import React, { useState } from 'react';
import { Task, Employee, TaskPriority, AttentionCategory } from '../../types/api';
import { Check, X, SlidersHorizontal, Calendar, Folder, User, Flag } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';

interface FilterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  employees: Employee[];
  selectedPriority?: TaskPriority;
  onSelectPriority: (p?: TaskPriority) => void;
  selectedAssigneeId?: string;
  onSelectAssigneeId: (id?: string) => void;
  selectedAttention?: AttentionCategory;
  onSelectAttention: (att?: AttentionCategory) => void;
  selectedCategory?: string;
  onSelectCategory: (cat?: string) => void;
  onToggleTaskComplete: (task: Task) => void;
  onSelectTask: (task: Task) => void;
  onResetFilters: () => void;
}

export const FilterPopover: React.FC<FilterPopoverProps> = ({
  isOpen,
  onClose,
  tasks,
  employees,
  selectedPriority,
  onSelectPriority,
  selectedAssigneeId,
  onSelectAssigneeId,
  selectedAttention,
  onSelectAttention,
  selectedCategory,
  onSelectCategory,
  onToggleTaskComplete,
  onSelectTask,
  onResetFilters,
}) => {
  const [activeTab, setActiveTab] = useState<'project' | 'deadline' | 'priority' | 'assignee'>('deadline');
  const [searchInternal, setSearchInternal] = useState('');

  if (!isOpen) return null;

  // Extract unique categories
  const categories = Array.from(
    new Set(tasks.map(t => t.category).filter(Boolean) as string[])
  );

  // Filter tasks based on active selections
  const filteredTasks = tasks.filter(t => {
    if (searchInternal && !t.title.toLowerCase().includes(searchInternal.toLowerCase())) {
      return false;
    }
    if (selectedPriority && t.priority !== selectedPriority) return false;
    if (selectedAssigneeId && t.assignee_id !== selectedAssigneeId) return false;
    if (selectedCategory && t.category !== selectedCategory) return false;
    return true;
  });

  const hasActiveFilters = Boolean(
    selectedPriority || selectedAssigneeId || selectedAttention || selectedCategory
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#222321]/20 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      {/* Popover card matching Reference 3 */}
      <div className="relative w-full max-w-lg bg-white border border-[#E5E5E1] rounded-2xl shadow-xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-[#E5E5E1]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#222321] flex items-center gap-2">
              <SlidersHorizontal size={15} />
              <span>Add filters</span>
            </h3>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={onResetFilters}
                  className="text-xs text-[#73756F] hover:text-[#222321] underline"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={onClose}
                className="text-[#73756F] hover:text-[#222321] p-1 rounded-md"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Quick Filter Pills matching Ref 3 */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('project')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors shrink-0',
                activeTab === 'project' || selectedCategory
                  ? 'bg-[#222321] text-white border-[#222321]'
                  : 'bg-white text-[#222321] border-[#E5E5E1] hover:bg-[#F5F5F1]'
              )}
            >
              <Folder size={13} />
              <span>Project {selectedCategory ? `(${selectedCategory})` : ''}</span>
            </button>

            <button
              onClick={() => setActiveTab('deadline')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors shrink-0',
                activeTab === 'deadline' || selectedAttention
                  ? 'bg-[#222321] text-white border-[#222321]'
                  : 'bg-white text-[#222321] border-[#E5E5E1] hover:bg-[#F5F5F1]'
              )}
            >
              <Calendar size={13} />
              <span>Deadline {selectedAttention ? `(${selectedAttention})` : ''}</span>
            </button>

            <button
              onClick={() => setActiveTab('priority')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors shrink-0',
                activeTab === 'priority' || selectedPriority
                  ? 'bg-[#222321] text-white border-[#222321]'
                  : 'bg-white text-[#222321] border-[#E5E5E1] hover:bg-[#F5F5F1]'
              )}
            >
              <Flag size={13} />
              <span>Type / Priority {selectedPriority ? `(${selectedPriority})` : ''}</span>
            </button>

            <button
              onClick={() => setActiveTab('assignee')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors shrink-0',
                activeTab === 'assignee' || selectedAssigneeId
                  ? 'bg-[#222321] text-white border-[#222321]'
                  : 'bg-white text-[#222321] border-[#E5E5E1] hover:bg-[#F5F5F1]'
              )}
            >
              <User size={13} />
              <span>Assignee</span>
            </button>
          </div>

          {/* Tab Content Sub-options */}
          <div className="mt-3 pt-3 border-t border-[#E5E5E1]/60">
            {activeTab === 'project' && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => onSelectCategory(undefined)}
                  className={cn(
                    'px-2.5 py-1 text-xs rounded-lg border transition-colors',
                    !selectedCategory ? 'bg-[#E8EB39] text-[#222321] font-semibold border-[#d3d629]' : 'bg-[#F5F5F1] text-[#73756F] border-[#E5E5E1]'
                  )}
                >
                  All Projects
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => onSelectCategory(selectedCategory === c ? undefined : c)}
                    className={cn(
                      'px-2.5 py-1 text-xs rounded-lg border transition-colors',
                      selectedCategory === c
                        ? 'bg-[#E8EB39] text-[#222321] font-semibold border-[#d3d629]'
                        : 'bg-[#F5F5F1] text-[#73756F] border-[#E5E5E1] hover:text-[#222321]'
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'deadline' && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['due_today', 'overdue', 'blocked', 'upcoming'] as AttentionCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => onSelectAttention(selectedAttention === cat ? undefined : cat)}
                    className={cn(
                      'px-2.5 py-1 text-xs rounded-lg border transition-colors capitalize',
                      selectedAttention === cat
                        ? 'bg-[#E8EB39] text-[#222321] font-semibold border-[#d3d629]'
                        : 'bg-[#F5F5F1] text-[#73756F] border-[#E5E5E1] hover:text-[#222321]'
                    )}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                ))}
                {selectedAttention && (
                  <button
                    onClick={() => onSelectAttention(undefined)}
                    className="text-xs text-[#73756F] hover:text-[#222321] px-2"
                  >
                    Reset
                  </button>
                )}
              </div>
            )}

            {activeTab === 'priority' && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as TaskPriority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => onSelectPriority(selectedPriority === p ? undefined : p)}
                    className={cn(
                      'px-2.5 py-1 text-xs rounded-lg border transition-colors',
                      selectedPriority === p
                        ? 'bg-[#E8EB39] text-[#222321] font-semibold border-[#d3d629]'
                        : 'bg-[#F5F5F1] text-[#73756F] border-[#E5E5E1] hover:text-[#222321]'
                    )}
                  >
                    {p}
                  </button>
                ))}
                {selectedPriority && (
                  <button
                    onClick={() => onSelectPriority(undefined)}
                    className="text-xs text-[#73756F] hover:text-[#222321] px-2"
                  >
                    Reset
                  </button>
                )}
              </div>
            )}

            {activeTab === 'assignee' && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {employees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => onSelectAssigneeId(selectedAssigneeId === emp.id ? undefined : emp.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-colors',
                      selectedAssigneeId === emp.id
                        ? 'bg-[#E8EB39] text-[#222321] font-semibold border-[#d3d629]'
                        : 'bg-[#F5F5F1] text-[#73756F] border-[#E5E5E1] hover:text-[#222321]'
                    )}
                  >
                    <Avatar name={emp.name} initials={emp.initials} color={emp.avatar_color} size="xs" />
                    <span>{emp.name.split(' ')[0]}</span>
                  </button>
                ))}
                {selectedAssigneeId && (
                  <button
                    onClick={() => onSelectAssigneeId(undefined)}
                    className="text-xs text-[#73756F] hover:text-[#222321] px-2"
                  >
                    Reset
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Live Filtered Tasks Results List matching Reference 3 */}
        <div className="p-4 max-h-72 overflow-y-auto space-y-1">
          <div className="px-2 pb-2 text-[11px] font-semibold text-[#73756F] uppercase tracking-wider">
            Matching Tasks ({filteredTasks.length})
          </div>

          {filteredTasks.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#73756F]">
              No tasks match the selected filters.
            </div>
          ) : (
            filteredTasks.map((t) => {
              const isCompleted = t.status === 'COMPLETED';
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F5F5F1] transition-colors group cursor-pointer"
                  onClick={() => {
                    onSelectTask(t);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleTaskComplete(t);
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
                    <div className="min-w-0">
                      <p
                        className={cn(
                          'text-xs font-medium text-[#222321] truncate',
                          isCompleted && 'line-through text-[#73756F]'
                        )}
                      >
                        {t.title}
                      </p>
                      <p className="text-[10px] text-[#73756F] truncate">
                        {t.category || 'General'} · Due {new Date(t.due_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
