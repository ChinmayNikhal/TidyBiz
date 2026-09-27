/**
 * Canonical frontend types for TidyBiz
 * Strictly derived from API.md (v1.0)
 */

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type EmployeeRole = 'OWNER' | 'MANAGER' | 'EMPLOYEE';
export type AttentionSeverity = 'HIGH' | 'MEDIUM' | 'LOW';
export type AttentionRuleCode = 
  | 'OVERDUE_TASK' 
  | 'BLOCKED_TASK' 
  | 'CRITICAL_DEADLINE' 
  | 'EMPLOYEE_OVERDUE_LOAD' 
  | 'HIGH_PRIORITY_BLOCKED';
export type AttentionCategory = 'overdue' | 'due_today' | 'blocked' | 'upcoming';

export interface Business {
  id: string;
  name: string;
  category: string;
  timezone: string;
  created_at: string;
}

export interface Employee {
  id: string;
  business_id: string;
  name: string;
  role: EmployeeRole;
  department: string | null;
  email?: string;
  is_active: boolean;
  created_at: string;
  avatar_color?: string;
  avatar_url?: string;
  initials?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  department?: string | null;
  avatar_url?: string;
  avatar_color?: string;
  initials?: string;
}

export interface Task {
  id: string;
  business_id: string;
  title: string;
  description: string | null;
  assignee_id: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_at: string; // ISO 8601 UTC
  category: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

export interface DashboardSummary {
  total_tasks: number;
  open_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  blocked_tasks: number;
  due_today: number;
  completion_rate: number;
}

export interface AttentionItem {
  id: string;
  rule_code: AttentionRuleCode;
  severity: AttentionSeverity;
  title: string;
  reason: string;
  task_id: string | null;
  assignee_id: string | null;
  due_at: string | null;
  suggested_action: string;
}

export interface WorkloadItem {
  employee_id: string;
  name: string;
  role: EmployeeRole;
  is_active: boolean;
  open_tasks: number;
  overdue_tasks: number;
  blocked_tasks: number;
  completed_tasks: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; issue: string }>;
  };
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string;
  attention?: AttentionCategory;
  search?: string;
}
