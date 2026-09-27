/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { api } from './lib/api';
import {
  Business,
  Employee,
  Task,
  DashboardSummary,
  AttentionItem,
  WorkloadItem,
  TaskPriority,
  TaskStatus,
  AttentionCategory,
  EmployeeRole,
} from './types/api';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { ToastProvider, useToast } from './components/ui/Toast';
import { CreateTaskModal } from './components/tasks/CreateTaskModal';
import { TaskDetailDrawer } from './components/tasks/TaskDetailDrawer';
import { FilterPopover } from './components/tasks/FilterPopover';
import { AuthModal, AuthMode } from './components/auth/AuthModal';
import { ProfileEditModal } from './components/auth/ProfileEditModal';

import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { TeamPage } from './pages/TeamPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';

const CURRENT_USER_KEY = 'tidybiz_active_user_id';

function TidyBizWorkspace() {
  const { showToast } = useToast();

  // Navigation
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Core Data
  const [business, setBusiness] = useState<Business | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([]);
  const [workload, setWorkload] = useState<WorkloadItem[]>([]);

  // Active Session User
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem(CURRENT_USER_KEY) || 'e1-asha';
  });

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | undefined>();
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | undefined>();
  const [selectedAttention, setSelectedAttention] = useState<AttentionCategory | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  // Modals & Drawers
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auth & Profile Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>('login');
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);

  // Fetch all state
  const loadWorkspaceData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [b, emps, tList, sum, att, wl] = await Promise.all([
        api.getBusiness(),
        api.getEmployees(),
        api.getTasks(),
        api.getSummary(),
        api.getAttention(),
        api.getWorkload(),
      ]);

      setBusiness(b);
      setEmployees(emps);
      setTasks(tList);
      setSummary(sum);
      setAttentionItems(att);
      setWorkload(wl);
    } catch (err: any) {
      console.error('Error loading workspace data:', err);
      showToast(err.message || 'Error updating data', 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  // Derive active current user
  const currentUser = employees.find((e) => e.id === currentUserId) || employees[0] || null;

  // Keep selectedTask in sync with tasks list
  useEffect(() => {
    if (selectedTask) {
      const refreshed = tasks.find((t) => t.id === selectedTask.id);
      if (refreshed) setSelectedTask(refreshed);
    }
  }, [tasks]);

  // Session / User Switcher
  const handleSwitchUser = (employee: Employee) => {
    setCurrentUserId(employee.id);
    localStorage.setItem(CURRENT_USER_KEY, employee.id);
    showToast(`Active session switched to ${employee.name}`, 'info');
  };

  // Profile & PFP Update
  const handleSaveProfile = async (updates: {
    name?: string;
    email?: string;
    avatar_url?: string;
    department?: string;
  }) => {
    if (!currentUser) return;
    try {
      const updated = await api.updateEmployee(currentUser.id, updates);
      showToast('Profile and PFP updated successfully', 'success');
      await loadWorkspaceData();
    } catch (err: any) {
      showToast(err.message || 'Could not update profile', 'error');
    }
  };

  // Signup
  const handleSignup = async (userData: {
    name: string;
    businessName: string;
    email: string;
    role: EmployeeRole;
    department?: string;
    avatar_url?: string;
  }) => {
    try {
      const created = await api.createEmployee({
        name: userData.name,
        role: userData.role,
        department: userData.department || 'Management',
        is_active: true,
      });

      // Update email and avatar if provided
      if (userData.email || userData.avatar_url) {
        await api.updateEmployee(created.id, {
          email: userData.email,
          avatar_url: userData.avatar_url,
        });
      }

      setCurrentUserId(created.id);
      localStorage.setItem(CURRENT_USER_KEY, created.id);
      showToast(`Welcome to TidyBiz, ${created.name}!`, 'success');
      await loadWorkspaceData();
    } catch (err: any) {
      showToast(err.message || 'Could not complete registration', 'error');
      throw err;
    }
  };

  // Task Mutations
  const handleToggleComplete = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );

    try {
      await api.updateTask(task.id, { status: nextStatus });
      showToast(
        nextStatus === 'COMPLETED'
          ? `Completed "${task.title}"`
          : `Reopened "${task.title}"`,
        'success'
      );
      // Reload computed summaries
      const [sum, att, wl] = await Promise.all([
        api.getSummary(),
        api.getAttention(),
        api.getWorkload(),
      ]);
      setSummary(sum);
      setAttentionItems(att);
      setWorkload(wl);
    } catch (err: any) {
      showToast(err.message || 'Failed to update task', 'error');
      loadWorkspaceData();
    }
  };

  const handleCreateTask = async (taskData: {
    title: string;
    description?: string;
    assignee_id: string;
    priority: TaskPriority;
    due_at: string;
    status: TaskStatus;
    category?: string;
  }) => {
    try {
      const created = await api.createTask(taskData);
      showToast(`Task created: "${created.title}"`, 'success');
      await loadWorkspaceData();
    } catch (err: any) {
      showToast(err.message || 'Could not create task', 'error');
      throw err;
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    try {
      await api.updateTask(id, updates);
      showToast('Task updated', 'success');
      await loadWorkspaceData();
    } catch (err: any) {
      showToast(err.message || 'Could not update task', 'error');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.deleteTask(id);
      showToast('Task deleted', 'info');
      setSelectedTask(null);
      await loadWorkspaceData();
    } catch (err: any) {
      showToast(err.message || 'Could not delete task', 'error');
    }
  };

  // Employee Mutations
  const handleAddEmployee = async (payload: {
    name: string;
    role: EmployeeRole;
    department?: string;
    is_active?: boolean;
  }) => {
    try {
      const created = await api.createEmployee(payload);
      showToast(`Added ${created.name} to the team`, 'success');
      await loadWorkspaceData();
    } catch (err: any) {
      showToast(err.message || 'Could not add team member', 'error');
      throw err;
    }
  };

  const handleUpdateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      await api.updateEmployee(id, updates);
      showToast('Team member updated', 'success');
      await loadWorkspaceData();
    } catch (err: any) {
      showToast(err.message || 'Could not update employee', 'error');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedPriority(undefined);
    setSelectedAssigneeId(undefined);
    setSelectedAttention(undefined);
    setSelectedCategory(undefined);
  };

  const handleResetSeed = () => {
    api.resetDemoData();
    handleResetFilters();
    loadWorkspaceData();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F1] text-[#222321]">
      {/* Collapsible Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        business={business}
        unreadNotificationsCount={attentionItems.length}
        openTasksCount={summary?.open_tasks ?? 0}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <TopBar
          onOpenNewTask={() => setIsNewTaskOpen(true)}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenFilterPopover={() => setIsFilterModalOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          currentUser={currentUser}
          employees={employees}
          unreadCount={attentionItems.length}
          onNavigateToNotifications={() => setCurrentTab('notifications')}
          onRefreshData={loadWorkspaceData}
          isRefreshing={isRefreshing}
          onOpenAuthModal={() => {
            setAuthModalMode('login');
            setIsAuthModalOpen(true);
          }}
          onOpenProfileEditModal={() => setIsProfileEditModalOpen(true)}
          onSwitchUser={handleSwitchUser}
        />

        {/* Viewport Screen Content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <DashboardPage
                business={business}
                currentUser={currentUser}
                summary={summary}
                attentionItems={attentionItems}
                workload={workload}
                tasks={tasks}
                employees={employees}
                onToggleComplete={handleToggleComplete}
                onSelectTask={setSelectedTask}
                onNavigateToTasks={(filterType) => {
                  if (filterType === 'due_today') {
                    setSelectedAttention('due_today');
                  } else if (filterType === 'overdue') {
                    setSelectedAttention('overdue');
                  }
                  setCurrentTab('tasks');
                }}
                onOpenNewTask={() => setIsNewTaskOpen(true)}
              />
            )}

            {currentTab === 'tasks' && (
              <TasksPage
                tasks={tasks}
                employees={employees}
                onToggleComplete={handleToggleComplete}
                onSelectTask={setSelectedTask}
                onOpenNewTask={() => setIsNewTaskOpen(true)}
                onOpenFilterModal={() => setIsFilterModalOpen(true)}
                selectedAttention={selectedAttention}
                onSelectAttention={setSelectedAttention}
                selectedPriority={selectedPriority}
                onSelectPriority={setSelectedPriority}
                selectedAssigneeId={selectedAssigneeId}
                onSelectAssigneeId={setSelectedAssigneeId}
                searchQuery={searchQuery}
                onResetFilters={handleResetFilters}
              />
            )}

            {currentTab === 'team' && (
              <TeamPage
                employees={employees}
                workload={workload}
                onAddEmployee={handleAddEmployee}
                onUpdateEmployee={handleUpdateEmployee}
              />
            )}

            {currentTab === 'notifications' && (
              <NotificationsPage
                attentionItems={attentionItems}
                tasks={tasks}
                onSelectTaskById={(id) => {
                  const t = tasks.find((item) => item.id === id);
                  if (t) setSelectedTask(t);
                }}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsPage
                business={business}
                currentUser={currentUser}
                onResetSeedData={handleResetSeed}
                onOpenProfileModal={() => setIsProfileEditModalOpen(true)}
                onOpenAuthModal={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Task Creation Modal matching Ref 2 */}
      <CreateTaskModal
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        employees={employees}
        onCreateTask={handleCreateTask}
      />

      {/* Filter and Search Popover matching Ref 3 */}
      <FilterPopover
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        tasks={tasks}
        employees={employees}
        selectedPriority={selectedPriority}
        onSelectPriority={setSelectedPriority}
        selectedAssigneeId={selectedAssigneeId}
        onSelectAssigneeId={setSelectedAssigneeId}
        selectedAttention={selectedAttention}
        onSelectAttention={setSelectedAttention}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onToggleTaskComplete={handleToggleComplete}
        onSelectTask={setSelectedTask}
        onResetFilters={handleResetFilters}
      />

      {/* Task Details Side Drawer matching Ref 1 */}
      <TaskDetailDrawer
        task={selectedTask}
        employees={employees}
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
      />

      {/* Authentication Modal (Sign In, Sign Up, Forgot Password) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        employees={employees}
        onLoginAsEmployee={handleSwitchUser}
        onSignup={handleSignup}
      />

      {/* Profile & PFP Customization Modal */}
      <ProfileEditModal
        isOpen={isProfileEditModalOpen}
        onClose={() => setIsProfileEditModalOpen(false)}
        currentUser={currentUser}
        onSaveProfile={handleSaveProfile}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <TidyBizWorkspace />
    </ToastProvider>
  );
}
