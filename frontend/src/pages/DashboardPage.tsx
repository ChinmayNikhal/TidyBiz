import React from 'react';
import {
  DashboardSummary,
  AttentionItem,
  WorkloadItem,
  Task,
  Employee,
  Business,
} from '../types/api';
import { MetricCards } from '../components/dashboard/MetricCards';
import { CalendarWidget } from '../components/dashboard/CalendarWidget';
import { TimeTrackingWidget } from '../components/dashboard/TimeTrackingWidget';
import { AttentionWidget } from '../components/dashboard/AttentionWidget';
import { WorkloadWidget } from '../components/dashboard/WorkloadWidget';
import { CategoriesWidget } from '../components/dashboard/CategoriesWidget';
import { Check, ArrowRight, Plus } from 'lucide-react';
import { cn, isDateToday, formatDate } from '../lib/utils';
import { Button } from '../components/ui/Button';

interface DashboardPageProps {
  business: Business | null;
  currentUser: Employee | null;
  summary: DashboardSummary | null;
  attentionItems: AttentionItem[];
  workload: WorkloadItem[];
  tasks: Task[];
  employees: Employee[];
  onToggleComplete: (task: Task) => void;
  onSelectTask: (task: Task) => void;
  onNavigateToTasks: (filter?: string) => void;
  onOpenNewTask: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  business,
  currentUser,
  summary,
  attentionItems,
  workload,
  tasks,
  employees,
  onToggleComplete,
  onSelectTask,
  onNavigateToTasks,
  onOpenNewTask,
}) => {
  // Due today tasks for the quick overview widget matching Ref 4 "My tasks (05)"
  const todayTasks = tasks.filter((t) => isDateToday(t.due_at) || t.status === 'IN_PROGRESS');

  return (
    <div className="space-y-6 pb-12">
      {/* Top Greeting & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#222321]">
            Welcome back, {currentUser?.name.split(' ')[0] || 'Asha'}
          </h1>
          <p className="text-xs sm:text-sm text-[#73756F] mt-0.5">
            Operational dashboard and workflow pipeline for {business?.name || 'PrintWorks Studio'}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => onNavigateToTasks()}
            variant="secondary"
            size="sm"
            className="text-xs"
          >
            <span>View all tasks</span>
            <ArrowRight size={14} className="ml-1" />
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

      {/* 4 Summary Metric Cards */}
      <MetricCards
        summary={summary}
        onFilterClick={(type) => {
          if (type === 'overdue') onNavigateToTasks('overdue');
          else if (type === 'due_today') onNavigateToTasks('due_today');
          else if (type === 'completed') onNavigateToTasks('completed');
          else onNavigateToTasks();
        }}
      />

      {/* Primary Section: Today's Queue & Needs Attention Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* "My tasks" widget matching Reference 4 */}
        <div className="bg-white border border-[#E5E5E1] rounded-2xl p-5 shadow-2xs flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-[#E5E5E1]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#222321]">
                  Today's Priority Queue ({todayTasks.length.toString().padStart(2, '0')})
                </h3>
              </div>
              <button
                onClick={() => onNavigateToTasks('due_today')}
                className="text-xs text-[#73756F] hover:text-[#222321] transition-colors"
              >
                View all
              </button>
            </div>

            <div className="space-y-1.5 divide-y divide-[#E5E5E1]/60">
              {todayTasks.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#73756F]">
                  No tasks due today. You are fully caught up!
                </div>
              ) : (
                todayTasks.slice(0, 5).map((task) => {
                  const isCompleted = task.status === 'COMPLETED';
                  return (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className="pt-2 flex items-center justify-between text-xs py-2 hover:bg-[#F5F5F1] px-2 rounded-xl transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleComplete(task);
                          }}
                          className={cn(
                            'w-5 h-5 rounded-full flex items-center justify-center border transition-all shrink-0',
                            isCompleted
                              ? 'bg-[#E8EB39] border-[#d3d629] text-[#222321]'
                              : 'border-[#E5E5E1] hover:border-[#222321]'
                          )}
                        >
                          {isCompleted && <Check size={12} className="stroke-[3]" />}
                        </button>
                        <span
                          className={cn(
                            'font-medium text-[#222321] truncate',
                            isCompleted && 'line-through text-[#73756F]'
                          )}
                        >
                          {task.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-[#73756F]">
                        <span className="text-[11px]">
                          {isDateToday(task.due_at) ? 'Today' : formatDate(task.due_at)}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold',
                            task.priority === 'CRITICAL'
                              ? 'bg-red-50 text-red-700'
                              : task.priority === 'HIGH'
                              ? 'bg-[#F5E6CC] text-[#78350F]'
                              : 'bg-[#F5F5F1] text-[#73756F]'
                          )}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateToTasks()}
            className="mt-4 pt-3 border-t border-[#E5E5E1]/80 text-xs font-semibold text-[#222321] hover:underline flex items-center justify-center gap-1.5"
          >
            <span>Open complete task manager</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Needs Attention Explainable Rules Widget */}
        <AttentionWidget
          items={attentionItems}
          tasks={tasks}
          onSelectTaskById={(id) => {
            const found = tasks.find((t) => t.id === id);
            if (found) onSelectTask(found);
          }}
        />
      </div>

      {/* Calendar & Time Tracking Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Calendar Widget matching Ref 4 */}
        <CalendarWidget tasks={tasks} />

        {/* Time Tracking Live Widget matching Ref 4 */}
        <TimeTrackingWidget />
      </div>

      {/* Workload & Categories Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Team Workload Widget (Spans 8 columns on desktop for wide table layout) */}
        <div className="lg:col-span-8">
          <WorkloadWidget workload={workload} employees={employees} />
        </div>

        {/* Categories & Workspaces Widget (Spans 4 columns) */}
        <div className="lg:col-span-4">
          <CategoriesWidget
            employees={employees}
            onSelectCategory={() => onNavigateToTasks()}
          />
        </div>
      </div>
    </div>
  );
};
