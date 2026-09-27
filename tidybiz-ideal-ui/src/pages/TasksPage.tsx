import React, { useState } from 'react';
import { Task, Employee, TaskPriority, TaskStatus, AttentionCategory } from '../types/api';
import { TaskTable } from '../components/tasks/TaskTable';
import { Button } from '../components/ui/Button';
import { Plus, Filter, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface TasksPageProps {
  tasks: Task[];
  employees: Employee[];
  onToggleComplete: (task: Task) => void;
  onSelectTask: (task: Task) => void;
  onOpenNewTask: () => void;
  onOpenFilterModal: () => void;
  selectedAttention?: AttentionCategory;
  onSelectAttention: (cat?: AttentionCategory) => void;
  selectedPriority?: TaskPriority;
  onSelectPriority: (p?: TaskPriority) => void;
  selectedAssigneeId?: string;
  onSelectAssigneeId: (id?: string) => void;
  searchQuery: string;
  onResetFilters: () => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  tasks,
  employees,
  onToggleComplete,
  onSelectTask,
  onOpenNewTask,
  onOpenFilterModal,
  selectedAttention,
  onSelectAttention,
  selectedPriority,
  onSelectPriority,
  selectedAssigneeId,
  onSelectAssigneeId,
  searchQuery,
  onResetFilters,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | TaskStatus>('ALL');

  // Filter tasks based on internal status tab + active props filters
  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (selectedPriority && t.priority !== selectedPriority) return false;
    if (selectedAssigneeId && t.assignee_id !== selectedAssigneeId) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = t.title.toLowerCase().includes(q);
      const matchesCat = t.category?.toLowerCase().includes(q);
      if (!matchesTitle && !matchesCat) return false;
    }
    return true;
  });

  const hasAnyFilter = Boolean(
    statusFilter !== 'ALL' ||
    selectedAttention ||
    selectedPriority ||
    selectedAssigneeId ||
    searchQuery
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header & New Task CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#222321]">
              My Tasks
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#E5E5E1] text-[#222321] font-semibold">
              {filteredTasks.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#73756F] mt-0.5">
            Manage your daily workflow, client deliverables, and production deadlines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={onOpenFilterModal}
            variant="secondary"
            size="sm"
            className="text-xs"
          >
            <SlidersHorizontal size={14} className="mr-1.5" />
            <span>Filters</span>
          </Button>

          <Button
            onClick={onOpenNewTask}
            variant="primary"
            size="sm"
            className="text-xs font-semibold"
          >
            <Plus size={15} className="mr-1 stroke-[2.5]" />
            <span>New task</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs matching SaaS reference standards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E5E1] pb-3">
        {/* Status Segmented Control */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Tasks' },
            { id: 'TODO', label: 'Not Started' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
            { id: 'BLOCKED', label: 'Blocked' },
            { id: 'COMPLETED', label: 'Completed' },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 select-none',
                  isActive
                    ? 'bg-[#222321] text-white shadow-2xs font-semibold'
                    : 'text-[#73756F] hover:text-[#222321] hover:bg-[#E5E5E1]/50'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Quick Dropdown Selectors */}
        <div className="flex items-center gap-2">
          {/* Priority filter */}
          <select
            value={selectedPriority || ''}
            onChange={(e) => onSelectPriority(e.target.value ? (e.target.value as TaskPriority) : undefined)}
            className="text-xs bg-white border border-[#E5E5E1] rounded-xl px-2.5 py-1.5 text-[#222321] focus:outline-none"
          >
            <option value="">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Assignee filter */}
          <select
            value={selectedAssigneeId || ''}
            onChange={(e) => onSelectAssigneeId(e.target.value || undefined)}
            className="text-xs bg-white border border-[#E5E5E1] rounded-xl px-2.5 py-1.5 text-[#222321] focus:outline-none"
          >
            <option value="">All Assignees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>

          {hasAnyFilter && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                onResetFilters();
              }}
              title="Reset all filters"
              className="p-1.5 text-[#73756F] hover:text-[#222321] hover:bg-[#E5E5E1] rounded-lg transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Grouped Tasks Table matching Ref 5 */}
      <TaskTable
        tasks={filteredTasks}
        employees={employees}
        onToggleComplete={onToggleComplete}
        onSelectTask={onSelectTask}
      />
    </div>
  );
};
