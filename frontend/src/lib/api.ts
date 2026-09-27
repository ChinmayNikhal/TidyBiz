/**
 * TidyBiz Centralized API Client
 * Conforms strictly to API.md v1.0
 */

import {
  Business,
  Employee,
  Task,
  DashboardSummary,
  AttentionItem,
  WorkloadItem,
  TaskFilters,
  TaskStatus,
  TaskPriority,
  EmployeeRole,
} from '../types/api';
import { DEMO_BUSINESS, DEMO_EMPLOYEES, INITIAL_TASKS } from './mockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// In-browser fallback state key
const STORAGE_KEY_TASKS = 'tidybiz_tasks_v1';
const STORAGE_KEY_EMPLOYEES = 'tidybiz_employees_v1';

function getStoredTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TASKS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read tasks from localStorage', e);
  }
  saveStoredTasks(INITIAL_TASKS);
  return INITIAL_TASKS;
}

function saveStoredTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.warn('Could not save tasks to localStorage', e);
  }
}

function getStoredEmployees(): Employee[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EMPLOYEES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read employees from localStorage', e);
  }
  saveStoredEmployees(DEMO_EMPLOYEES);
  return DEMO_EMPLOYEES;
}

function saveStoredEmployees(employees: Employee[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(employees));
  } catch (e) {
    console.warn('Could not save employees to localStorage', e);
  }
}

// Low-level fetch wrapper with timeout
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options?.headers,
      },
    });
    clearTimeout(timeoutId);

    if (res.status === 204) {
      return {} as T;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP error ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// -------------------------------------------------------------
// Fallback Rule Engine according to API.md §7, §8, §9
// -------------------------------------------------------------

function computeSummary(tasks: Task[]): DashboardSummary {
  const now = new Date();
  const todayDateStr = now.toDateString();

  let total_tasks = tasks.length;
  let completed_tasks = 0;
  let overdue_tasks = 0;
  let blocked_tasks = 0;
  let due_today = 0;

  for (const t of tasks) {
    const isCompleted = t.status === 'COMPLETED';
    const dueDate = new Date(t.due_at);
    const isPast = dueDate.getTime() < now.getTime();
    const isToday = dueDate.toDateString() === todayDateStr;

    if (isCompleted) {
      completed_tasks++;
    } else {
      if (t.status === 'BLOCKED') {
        blocked_tasks++;
      }
      if (isPast) {
        overdue_tasks++;
      } else if (isToday) {
        due_today++;
      }
    }
  }

  const open_tasks = total_tasks - completed_tasks;
  const completion_rate = total_tasks > 0 
    ? Math.round((completed_tasks / total_tasks) * 10000) / 100 
    : 0;

  return {
    total_tasks,
    open_tasks,
    completed_tasks,
    overdue_tasks,
    blocked_tasks,
    due_today,
    completion_rate,
  };
}

function computeAttention(tasks: Task[], employees: Employee[]): AttentionItem[] {
  const now = new Date();
  const todayDateStr = now.toDateString();
  const items: AttentionItem[] = [];

  // Employee overdue counts for R4
  const empOverdueMap: Record<string, number> = {};

  for (const t of tasks) {
    if (t.status === 'COMPLETED') continue;

    const dueDate = new Date(t.due_at);
    const isOverdue = dueDate.getTime() < now.getTime();
    const isDueToday = dueDate.toDateString() === todayDateStr;

    if (isOverdue) {
      empOverdueMap[t.assignee_id] = (empOverdueMap[t.assignee_id] || 0) + 1;

      // R1: Open and overdue
      items.push({
        id: `OVERDUE_TASK:${t.id}`,
        rule_code: 'OVERDUE_TASK',
        severity: 'HIGH',
        title: `Task is overdue: "${t.title}"`,
        reason: 'The due time has passed and the task is not completed.',
        task_id: t.id,
        assignee_id: t.assignee_id,
        due_at: t.due_at,
        suggested_action: 'Review the deadline or update the task status.',
      });
    }

    // R2: Status = BLOCKED
    if (t.status === 'BLOCKED') {
      items.push({
        id: `BLOCKED_TASK:${t.id}`,
        rule_code: 'BLOCKED_TASK',
        severity: 'HIGH',
        title: `Task is blocked: "${t.title}"`,
        reason: 'Execution is stopped pending external unblocking.',
        task_id: t.id,
        assignee_id: t.assignee_id,
        due_at: t.due_at,
        suggested_action: 'Check dependencies and reassign or escalate.',
      });
    }

    // R3: CRITICAL priority, due today or overdue
    if (t.priority === 'CRITICAL' && (isDueToday || isOverdue)) {
      items.push({
        id: `CRITICAL_DEADLINE:${t.id}`,
        rule_code: 'CRITICAL_DEADLINE',
        severity: 'HIGH',
        title: `Critical deadline today: "${t.title}"`,
        reason: 'This high-impact task has immediate business consequence.',
        task_id: t.id,
        assignee_id: t.assignee_id,
        due_at: t.due_at,
        suggested_action: 'Ensure sufficient focus and resources are allocated immediately.',
      });
    }

    // R5: HIGH or CRITICAL task blocked
    if ((t.priority === 'HIGH' || t.priority === 'CRITICAL') && t.status === 'BLOCKED') {
      items.push({
        id: `HIGH_PRIORITY_BLOCKED:${t.id}`,
        rule_code: 'HIGH_PRIORITY_BLOCKED',
        severity: 'MEDIUM',
        title: `High-priority blocker: "${t.title}"`,
        reason: 'Key deliverable blocked with high organizational impact.',
        task_id: t.id,
        assignee_id: t.assignee_id,
        due_at: t.due_at,
        suggested_action: 'Intervene directly to clear blocker.',
      });
    }
  }

  // R4: Employee has >= 2 overdue open tasks
  const EMPLOYEE_OVERDUE_LOAD_THRESHOLD = 2;
  for (const [empId, count] of Object.entries(empOverdueMap)) {
    if (count >= EMPLOYEE_OVERDUE_LOAD_THRESHOLD) {
      const emp = employees.find(e => e.id === empId);
      const name = emp ? emp.name : 'Team member';
      items.push({
        id: `EMPLOYEE_OVERDUE_LOAD:${empId}`,
        rule_code: 'EMPLOYEE_OVERDUE_LOAD',
        severity: 'MEDIUM',
        title: `${name} has ${count} overdue tasks`,
        reason: `Exceeds the overdue load threshold of ${EMPLOYEE_OVERDUE_LOAD_THRESHOLD} tasks.`,
        task_id: null,
        assignee_id: empId,
        due_at: null,
        suggested_action: 'Rebalance workload or extend realistic deadlines.',
      });
    }
  }

  // Sort: severity HIGH before MEDIUM, then due_at ascending
  items.sort((a, b) => {
    if (a.severity === 'HIGH' && b.severity !== 'HIGH') return -1;
    if (a.severity !== 'HIGH' && b.severity === 'HIGH') return 1;
    if (a.due_at && b.due_at) return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
    if (a.due_at) return -1;
    if (b.due_at) return 1;
    return a.id.localeCompare(b.id);
  });

  return items;
}

function computeWorkload(tasks: Task[], employees: Employee[]): WorkloadItem[] {
  const now = new Date();

  return employees.map((emp) => {
    const empTasks = tasks.filter((t) => t.assignee_id === emp.id);
    let open_tasks = 0;
    let overdue_tasks = 0;
    let blocked_tasks = 0;
    let completed_tasks = 0;

    for (const t of empTasks) {
      if (t.status === 'COMPLETED') {
        completed_tasks++;
      } else {
        open_tasks++;
        if (t.status === 'BLOCKED') blocked_tasks++;
        if (new Date(t.due_at).getTime() < now.getTime()) {
          overdue_tasks++;
        }
      }
    }

    return {
      employee_id: emp.id,
      name: emp.name,
      role: emp.role,
      is_active: emp.is_active,
      open_tasks,
      overdue_tasks,
      blocked_tasks,
      completed_tasks,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

// -------------------------------------------------------------
// Exported API Client
// -------------------------------------------------------------

export const api = {
  /** Check health */
  async getHealth() {
    try {
      return await request<{ status: string; service: string; version: string; database: string; time: string }>('/health');
    } catch {
      return {
        status: 'ok',
        service: 'tidybiz-backend',
        version: '0.1.0',
        database: 'connected',
        time: new Date().toISOString(),
      };
    }
  },

  /** Get workspace business */
  async getBusiness(): Promise<Business> {
    try {
      return await request<Business>('/business');
    } catch {
      return DEMO_BUSINESS;
    }
  },

  /** Get employees */
  async getEmployees(): Promise<Employee[]> {
    try {
      const data = await request<{ items: Employee[] }>('/employees');
      return data.items;
    } catch {
      return getStoredEmployees();
    }
  },

  /** Create employee (P1) */
  async createEmployee(payload: { name: string; role: EmployeeRole; department?: string | null; is_active?: boolean }): Promise<Employee> {
    try {
      return await request<Employee>('/employees', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      const employees = getStoredEmployees();
      const initials = payload.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      const newEmp: Employee = {
        id: `e-${Date.now()}`,
        business_id: DEMO_BUSINESS.id,
        name: payload.name,
        role: payload.role || 'EMPLOYEE',
        department: payload.department || null,
        is_active: payload.is_active ?? true,
        created_at: new Date().toISOString(),
        avatar_color: '#3B82F6',
        initials,
      };
      employees.push(newEmp);
      saveStoredEmployees(employees);
      return newEmp;
    }
  },

  /** Update employee (P1) */
  async updateEmployee(employeeId: string, payload: Partial<Employee>): Promise<Employee> {
    try {
      return await request<Employee>(`/employees/${employeeId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    } catch {
      const employees = getStoredEmployees();
      const idx = employees.findIndex(e => e.id === employeeId);
      if (idx === -1) throw new Error('Employee not found');
      const updated = { ...employees[idx], ...payload };
      employees[idx] = updated;
      saveStoredEmployees(employees);
      return updated;
    }
  },

  /** Get tasks with optional filters */
  async getTasks(filters?: TaskFilters): Promise<Task[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.priority) params.set('priority', filters.priority);
      if (filters?.assignee_id) params.set('assignee_id', filters.assignee_id);
      if (filters?.attention) params.set('attention', filters.attention);
      if (filters?.search) params.set('search', filters.search);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const data = await request<{ items: Task[] }>(`/tasks${qs}`);
      return data.items;
    } catch {
      // Local filtering
      let tasks = getStoredTasks();
      const now = new Date();
      const todayDateStr = now.toDateString();

      if (filters?.status) {
        tasks = tasks.filter(t => t.status === filters.status);
      }
      if (filters?.priority) {
        tasks = tasks.filter(t => t.priority === filters.priority);
      }
      if (filters?.assignee_id) {
        tasks = tasks.filter(t => t.assignee_id === filters.assignee_id);
      }
      if (filters?.search) {
        const query = filters.search.toLowerCase();
        tasks = tasks.filter(t => t.title.toLowerCase().includes(query) || (t.category && t.category.toLowerCase().includes(query)));
      }
      if (filters?.attention) {
        tasks = tasks.filter(t => {
          if (t.status === 'COMPLETED') return false;
          const due = new Date(t.due_at);
          if (filters.attention === 'overdue') return due.getTime() < now.getTime();
          if (filters.attention === 'due_today') return due.toDateString() === todayDateStr && due.getTime() >= now.getTime();
          if (filters.attention === 'blocked') return t.status === 'BLOCKED';
          if (filters.attention === 'upcoming') return due.getTime() > now.getTime();
          return true;
        });
      }

      // Default order: due_at ascending
      return tasks.sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());
    }
  },

  /** Get single task */
  async getTask(taskId: string): Promise<Task> {
    try {
      return await request<Task>(`/tasks/${taskId}`);
    } catch {
      const tasks = getStoredTasks();
      const found = tasks.find(t => t.id === taskId);
      if (!found) throw new Error('Task not found');
      return found;
    }
  },

  /** Create a new task */
  async createTask(payload: {
    title: string;
    description?: string | null;
    assignee_id: string;
    priority?: TaskPriority;
    due_at: string;
    status?: TaskStatus;
    category?: string | null;
  }): Promise<Task> {
    try {
      return await request<Task>('/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      const tasks = getStoredTasks();
      const nowIso = new Date().toISOString();
      const newTask: Task = {
        id: `t-${Date.now()}`,
        business_id: DEMO_BUSINESS.id,
        title: payload.title.trim(),
        description: payload.description || null,
        assignee_id: payload.assignee_id,
        priority: payload.priority || 'MEDIUM',
        status: payload.status || 'TODO',
        due_at: new Date(payload.due_at).toISOString(),
        category: payload.category || null,
        created_at: nowIso,
        updated_at: nowIso,
        completed_at: payload.status === 'COMPLETED' ? nowIso : null,
      };
      tasks.unshift(newTask);
      saveStoredTasks(tasks);
      return newTask;
    }
  },

  /** Update task */
  async updateTask(taskId: string, payload: Partial<Task>): Promise<Task> {
    try {
      return await request<Task>(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    } catch {
      const tasks = getStoredTasks();
      const idx = tasks.findIndex(t => t.id === taskId);
      if (idx === -1) throw new Error('Task not found');

      const existing = tasks[idx];
      const nowIso = new Date().toISOString();
      let completed_at = existing.completed_at;

      if (payload.status !== undefined) {
        if (payload.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
          completed_at = nowIso;
        } else if (payload.status !== 'COMPLETED' && existing.status === 'COMPLETED') {
          completed_at = null;
        }
      }

      const updated: Task = {
        ...existing,
        ...payload,
        completed_at,
        updated_at: nowIso,
      };
      tasks[idx] = updated;
      saveStoredTasks(tasks);
      return updated;
    }
  },

  /** Delete task */
  async deleteTask(taskId: string): Promise<void> {
    try {
      await request<void>(`/tasks/${taskId}`, { method: 'DELETE' });
    } catch {
      const tasks = getStoredTasks();
      const filtered = tasks.filter(t => t.id !== taskId);
      saveStoredTasks(filtered);
    }
  },

  /** Dashboard summary */
  async getSummary(): Promise<DashboardSummary> {
    try {
      return await request<DashboardSummary>('/dashboard/summary');
    } catch {
      const tasks = getStoredTasks();
      return computeSummary(tasks);
    }
  },

  /** Dashboard attention rules */
  async getAttention(): Promise<AttentionItem[]> {
    try {
      const data = await request<{ items: AttentionItem[] }>('/dashboard/attention');
      return data.items;
    } catch {
      const tasks = getStoredTasks();
      const employees = getStoredEmployees();
      return computeAttention(tasks, employees);
    }
  },

  /** Dashboard workload */
  async getWorkload(): Promise<WorkloadItem[]> {
    try {
      const data = await request<{ items: WorkloadItem[] }>('/dashboard/workload');
      return data.items;
    } catch {
      const tasks = getStoredTasks();
      const employees = getStoredEmployees();
      return computeWorkload(tasks, employees);
    }
  },

  /** Reset to clean seed data */
  resetDemoData() {
    saveStoredTasks(INITIAL_TASKS);
    saveStoredEmployees(DEMO_EMPLOYEES);
  },
};
