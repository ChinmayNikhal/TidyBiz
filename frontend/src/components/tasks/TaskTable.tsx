import React from 'react';
import { Task, Employee } from '../../types/api';
import { PriorityBadge, StatusBadge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Check, Calendar } from 'lucide-react';
import { cn, isDateToday, isDateTomorrow, isDateThisWeek, formatDate } from '../../lib/utils';

interface TaskTableProps {
  tasks: Task[];
  employees: Employee[];
  onToggleComplete: (task: Task) => void;
  onSelectTask: (task: Task) => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  employees,
  onToggleComplete,
  onSelectTask,
}) => {
  const getEmployee = (id: string) => employees.find((e) => e.id === id);

  // Group tasks by timeline matching Ref 5:
  // Today, Tomorrow, This week, Upcoming/Later, and Completed
  const activeTasks = tasks.filter((t) => t.status !== 'COMPLETED');
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');

  const todayTasks = activeTasks.filter((t) => isDateToday(t.due_at));
  const tomorrowTasks = activeTasks.filter((t) => isDateTomorrow(t.due_at));
  const thisWeekTasks = activeTasks.filter(
    (t) => !isDateToday(t.due_at) && !isDateTomorrow(t.due_at) && isDateThisWeek(t.due_at)
  );
  const upcomingTasks = activeTasks.filter(
    (t) =>
      !isDateToday(t.due_at) &&
      !isDateTomorrow(t.due_at) &&
      !isDateThisWeek(t.due_at) &&
      new Date(t.due_at).getTime() >= new Date().getTime()
  );
  const overdueTasks = activeTasks.filter(
    (t) =>
      !isDateToday(t.due_at) &&
      new Date(t.due_at).getTime() < new Date().getTime()
  );

  const renderSection = (title: string, sectionTasks: Task[], badgeColor?: string) => {
    if (sectionTasks.length === 0) return null;

    return (
      <div className="mb-8">
        {/* Section Title */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#222321] tracking-tight">{title}</h3>
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', badgeColor || 'bg-[#E5E5E1]/60 text-[#73756F]')}>
              {sectionTasks.length}
            </span>
          </div>
        </div>

        {/* Grouped Table Card matching Ref 5 */}
        <div className="bg-white border border-[#E5E5E1] rounded-2xl overflow-hidden shadow-2xs">
          {/* Table Headers */}
          <div className="grid grid-cols-12 gap-3 px-5 py-2.5 bg-[#F5F5F1]/60 border-b border-[#E5E5E1] text-[11px] font-semibold text-[#73756F] uppercase tracking-wider">
            <div className="col-span-12 sm:col-span-5 md:col-span-5">Task</div>
            <div className="hidden sm:block sm:col-span-2 md:col-span-2">Due Date</div>
            <div className="hidden sm:block sm:col-span-2 md:col-span-2">Stage</div>
            <div className="hidden md:block md:col-span-1 text-center">Priority</div>
            <div className="hidden md:block md:col-span-1">Team</div>
            <div className="hidden sm:block sm:col-span-1 md:col-span-1 text-right">Assignee</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-[#E5E5E1]">
            {sectionTasks.map((task) => {
              const assignee = getEmployee(task.assignee_id);
              const isCompleted = task.status === 'COMPLETED';

              return (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="grid grid-cols-12 gap-3 items-center px-5 py-3.5 hover:bg-[#F5F5F1]/70 transition-colors cursor-pointer group"
                >
                  {/* Title & Checkbox */}
                  <div className="col-span-12 sm:col-span-5 md:col-span-5 flex items-center gap-3 min-w-0">
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
                          : 'border-[#E5E5E1] hover:border-[#222321] group-hover:border-[#73756F]'
                      )}
                      aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {isCompleted && <Check size={12} className="stroke-[3]" />}
                    </button>
                    <div className="min-w-0">
                      <span
                        className={cn(
                          'text-sm font-medium text-[#222321] block truncate',
                          isCompleted && 'line-through text-[#73756F]'
                        )}
                      >
                        {task.title}
                      </span>
                      {/* Mobile metadata line */}
                      <div className="sm:hidden flex items-center gap-2 mt-1 text-[11px] text-[#73756F]">
                        <span>{formatDate(task.due_at)}</span>
                        <span>·</span>
                        <StatusBadge status={task.status} />
                      </div>
                    </div>
                  </div>

                  {/* Due Date Column */}
                  <div className="hidden sm:block sm:col-span-2 md:col-span-2 text-xs text-[#73756F]">
                    {isDateToday(task.due_at)
                      ? 'Today'
                      : isDateTomorrow(task.due_at)
                      ? 'Tomorrow'
                      : formatDate(task.due_at)}
                  </div>

                  {/* Stage / Status Column */}
                  <div className="hidden sm:block sm:col-span-2 md:col-span-2">
                    <StatusBadge status={task.status} />
                  </div>

                  {/* Priority Column */}
                  <div className="hidden md:block md:col-span-1 text-center">
                    <PriorityBadge priority={task.priority} />
                  </div>

                  {/* Team / Category Column */}
                  <div className="hidden md:block md:col-span-1 text-xs text-[#73756F] truncate">
                    {task.category || 'General'}
                  </div>

                  {/* Assignee Column with Avatar */}
                  <div className="hidden sm:flex sm:col-span-1 md:col-span-1 justify-end">
                    <Avatar
                      name={assignee?.name || 'Unassigned'}
                      initials={assignee?.initials}
                      color={assignee?.avatar_color}
                      size="sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-white border border-[#E5E5E1] rounded-2xl p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-[#F5F5F1] text-[#73756F] flex items-center justify-center mx-auto mb-3">
          <Calendar size={20} />
        </div>
        <h4 className="text-base font-semibold text-[#222321] mb-1">No tasks found</h4>
        <p className="text-xs text-[#73756F] max-w-sm mx-auto">
          No tasks matched your current filter criteria. Try adjusting your search query or clear the filters.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Overdue Section if any */}
      {renderSection('Overdue Deadlines', overdueTasks, 'bg-red-100 text-red-700')}

      {/* Today Section */}
      {renderSection('Today', todayTasks, 'bg-[#E8EB39] text-[#222321]')}

      {/* Tomorrow Section */}
      {renderSection('Tomorrow', tomorrowTasks)}

      {/* This Week Section */}
      {renderSection('This week', thisWeekTasks)}

      {/* Later / Upcoming */}
      {renderSection('Upcoming & Later', upcomingTasks)}

      {/* Completed Section with subtle opacity */}
      {completedTasks.length > 0 && (
        <div className="opacity-75 mt-8">
          {renderSection('Completed', completedTasks, 'bg-green-100 text-green-800')}
        </div>
      )}
    </div>
  );
};
