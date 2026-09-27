import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { Task, Employee, Business, EmployeeRole, TaskPriority, TaskStatus } from '../types/api';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseAnonKey.includes('placeholder')
);

// Fallback dummy URL and Key so createClient doesn't throw if env vars aren't populated yet
const effectiveUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co';
const effectiveKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key';

export const supabase: SupabaseClient = createClient(effectiveUrl, effectiveKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// ─────────────────────────────────────────────────────────────
// Supabase Session & Authentication Logic
// ─────────────────────────────────────────────────────────────

export interface SupabaseAuthResult {
  user: User | null;
  session: Session | null;
  error: Error | null;
}

/**
 * Sign up with email, password, and custom employee profile metadata
 */
export async function signUpWithSupabase(params: {
  email: string;
  password: string;
  name: string;
  role: EmployeeRole;
  department?: string;
  businessName?: string;
  avatar_url?: string;
}): Promise<SupabaseAuthResult> {
  if (!isSupabaseConfigured) {
    // Simulated local auth fallback
    const mockUser = {
      id: `usr_${Date.now()}`,
      email: params.email,
      user_metadata: {
        name: params.name,
        role: params.role,
        department: params.department || null,
        avatar_url: params.avatar_url || null,
      },
    } as unknown as User;

    return { user: mockUser, session: null, error: null };
  }

  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        name: params.name,
        role: params.role,
        department: params.department,
        business_name: params.businessName,
        avatar_url: params.avatar_url,
      },
    },
  });

  return { user: data?.user ?? null, session: data?.session ?? null, error };
}

/**
 * Sign in with email and password
 */
export async function signInWithSupabase(email: string, password: string): Promise<SupabaseAuthResult> {
  if (!isSupabaseConfigured) {
    // Simulated local login fallback
    const mockUser = {
      id: `usr_${Date.now()}`,
      email,
      user_metadata: { name: email.split('@')[0] },
    } as unknown as User;
    return { user: mockUser, session: null, error: null };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { user: data?.user ?? null, session: data?.session ?? null, error };
}

/**
 * Sign out of active Supabase session
 */
export async function signOutFromSupabase(): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { error: null };
  }
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get current active session
 */
export async function getSupabaseSession(): Promise<Session | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Listen for auth state changes (login, logout, token refreshed)
 */
export function onSupabaseAuthStateChange(callback: (session: Session | null, user: User | null) => void) {
  if (!isSupabaseConfigured) {
    return { unsubscribe: () => {} };
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session, session?.user ?? null);
  });

  return subscription;
}

// ─────────────────────────────────────────────────────────────
// Supabase Database Query Logic (Direct Postgres access)
// ─────────────────────────────────────────────────────────────

/**
 * Fetch all tasks directly from Supabase 'tasks' table
 */
export async function fetchTasksFromSupabase(): Promise<Task[] | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('due_at', { ascending: true });

  if (error) {
    console.error('Supabase fetchTasks error:', error);
    return null;
  }
  return data as Task[];
}

/**
 * Insert task directly into Supabase 'tasks' table
 */
export async function insertTaskToSupabase(payload: {
  title: string;
  description?: string | null;
  assignee_id: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  due_at: string;
  category?: string | null;
  business_id: string;
}): Promise<Task | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('tasks')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Supabase insertTask error:', error);
    return null;
  }
  return data as Task;
}

/**
 * Update task directly in Supabase 'tasks' table
 */
export async function updateTaskInSupabase(taskId: string, updates: Partial<Task>): Promise<Task | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    console.error('Supabase updateTask error:', error);
    return null;
  }
  return data as Task;
}

/**
 * Delete task from Supabase 'tasks' table
 */
export async function deleteTaskFromSupabase(taskId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    console.error('Supabase deleteTask error:', error);
    return false;
  }
  return true;
}

/**
 * Fetch all employees from Supabase 'employees' table
 */
export async function fetchEmployeesFromSupabase(): Promise<Employee[] | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Supabase fetchEmployees error:', error);
    return null;
  }
  return data as Employee[];
}

/**
 * Fetch business from Supabase 'businesses' table
 */
export async function fetchBusinessFromSupabase(): Promise<Business | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('Supabase fetchBusiness error:', error);
    return null;
  }
  return data as Business;
}
