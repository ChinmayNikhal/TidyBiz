// Canonical API types — mirror of API.md (snake_case, uppercase enums).

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED'

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type EmployeeRole = 'OWNER' | 'MANAGER' | 'EMPLOYEE'

export interface Business {
  id: string
  name: string
  category: string
  timezone: string
  created_at: string
}

export interface Employee {
  id: string
  business_id: string
  name: string
  role: EmployeeRole
  department: string | null
  is_active: boolean
  created_at: string
}

export interface Task {
  id: string
  business_id: string
  title: string
  description: string | null
  assignee_id: string
  priority: TaskPriority
  status: TaskStatus
  due_at: string
  category: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface TaskCreatePayload {
  title: string
  description?: string | null
  assignee_id: string
  priority?: TaskPriority
  status?: TaskStatus
  due_at: string
  category?: string | null
}

export interface TaskUpdatePayload {
  title?: string
  description?: string | null
  assignee_id?: string
  priority?: TaskPriority
  status?: TaskStatus
  due_at?: string
  category?: string | null
}

export interface DashboardSummary {
  total_tasks: number
  open_tasks: number
  completed_tasks: number
  overdue_tasks: number
  blocked_tasks: number
  due_today: number
  completion_rate: number
}

export type AttentionType =
  | 'OVERDUE_TASK'
  | 'BLOCKED_TASK'
  | 'CRITICAL_DEADLINE'
  | 'EMPLOYEE_OVERDUE_LOAD'
  | 'HIGH_PRIORITY_BLOCKED'

export type AttentionSeverity = 'HIGH' | 'MEDIUM' | 'LOW'

export interface AttentionItem {
  id: string
  rule_code: AttentionType
  severity: AttentionSeverity
  title: string
  reason: string
  task_id: string | null
  assignee_id: string | null
  due_at: string | null
  suggested_action: string
}

export interface WorkloadItem {
  employee_id: string
  name: string
  role: EmployeeRole
  is_active: boolean
  open_tasks: number
  overdue_tasks: number
  blocked_tasks: number
  completed_tasks: number
}

export interface HealthStatus {
  status: string
  service: string
  version: string
  database: 'connected' | 'unavailable'
  time: string
}

export interface ApiError {
  error: {
    code: string
    message: string
    details: { field: string; issue: string }[]
  }
}
