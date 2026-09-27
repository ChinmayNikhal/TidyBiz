// API client — all calls use relative /api paths.
// Vite dev proxy (local) or FastAPI static serve (deployed) resolves them.

import type {
  ApiError,
  AttentionItem,
  Business,
  DashboardSummary,
  Employee,
  HealthStatus,
  Task,
  TaskCreatePayload,
  TaskUpdatePayload,
  WorkloadItem,
} from '../types'

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: { field: string; issue: string }[] = [],
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    })
  } catch {
    throw new ApiRequestError(0, 'NETWORK_ERROR', 'Cannot reach the TidyBiz API. Is the backend running?')
  }

  if (response.status === 204) {
    return undefined as T
  }

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const err = (body as ApiError | null)?.error
    // Handle nested error envelope from task validation
    const detail = (body as any)?.detail
    if (detail?.error) {
      throw new ApiRequestError(
        response.status,
        detail.error.code ?? 'UNKNOWN_ERROR',
        detail.error.message ?? `Request failed with status ${response.status}`,
        detail.error.details ?? [],
      )
    }
    throw new ApiRequestError(
      response.status,
      err?.code ?? 'UNKNOWN_ERROR',
      err?.message ?? (typeof detail === 'string' ? detail : `Request failed with status ${response.status}`),
      err?.details ?? [],
    )
  }

  return body as T
}

export const api = {
  // Health
  health: () => request<HealthStatus>('/health'),

  // Business
  business: () => request<Business>('/business'),

  // Employees
  employees: () => request<{ items: Employee[] }>('/employees'),
  createEmployee: (payload: { name: string; role?: string; department?: string | null; is_active?: boolean }) =>
    request<Employee>('/employees', { method: 'POST', body: JSON.stringify(payload) }),
  updateEmployee: (id: string, payload: { name?: string; role?: string; department?: string | null; is_active?: boolean }) =>
    request<Employee>(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  // Tasks
  tasks: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<{ items: Task[] }>(`/tasks${qs}`)
  },
  createTask: (payload: TaskCreatePayload) =>
    request<Task>('/tasks', { method: 'POST', body: JSON.stringify(payload) }),
  getTask: (id: string) => request<Task>(`/tasks/${id}`),
  updateTask: (id: string, payload: TaskUpdatePayload) =>
    request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteTask: (id: string) =>
    request<void>(`/tasks/${id}`, { method: 'DELETE' }),

  // Dashboard
  dashboardSummary: () => request<DashboardSummary>('/dashboard/summary'),
  attention: () => request<{ items: AttentionItem[] }>('/dashboard/attention'),
  workload: () => request<{ items: WorkloadItem[] }>('/dashboard/workload'),
}
