import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Employee, TaskPriority, TaskStatus } from '../../types/api';
import { Calendar, User, Tag, Clock, Flag, AlignLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onCreateTask: (task: {
    title: string;
    description?: string;
    assignee_id: string;
    priority: TaskPriority;
    due_at: string;
    status: TaskStatus;
    category?: string;
  }) => Promise<void>;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  employees,
  onCreateTask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>(
    employees[0]?.id || 'e1-asha'
  );
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [category, setCategory] = useState('');
  const [dayType, setDayType] = useState<'today' | 'tomorrow' | 'custom'>('today');
  const [customDueDate, setCustomDueDate] = useState(() => {
    const d = new Date();
    d.setHours(17, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleDaySelect = (type: 'today' | 'tomorrow' | 'custom') => {
    setDayType(type);
    const d = new Date();
    if (type === 'tomorrow') {
      d.setDate(d.getDate() + 1);
    }
    d.setHours(17, 0, 0, 0);
    setCustomDueDate(d.toISOString().slice(0, 16));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a task title');
      return;
    }
    if (!selectedAssignee) {
      setErrorMsg('Please select an assignee');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const finalDueAt = new Date(customDueDate).toISOString();
      await onCreateTask({
        title: title.trim(),
        description: description.trim() || undefined,
        assignee_id: selectedAssignee,
        priority,
        due_at: finalDueAt,
        status,
        category: category.trim() || undefined,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
      setPriority('MEDIUM');
      setStatus('TODO');
      setDayType('today');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title Input matching Ref 2 */}
        <div>
          <input
            type="text"
            required
            autoFocus
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            placeholder="Name of task..."
            className="w-full text-lg font-semibold text-[#222321] placeholder-[#73756F]/60 border-b border-[#E5E5E1] pb-3 focus:outline-none focus:border-[#222321] transition-colors bg-transparent"
          />
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
            {errorMsg}
          </div>
        )}

        {/* Day selection row matching Ref 2 */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#73756F] w-24 shrink-0">
            <Clock size={15} />
            <span className="font-medium">Day</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleDaySelect('today')}
              className={cn(
                'px-3 py-1 rounded-full border transition-all',
                dayType === 'today'
                  ? 'bg-[#222321] text-white border-[#222321] font-semibold'
                  : 'bg-white text-[#222321] border-[#E5E5E1] hover:bg-[#F5F5F1]'
              )}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleDaySelect('tomorrow')}
              className={cn(
                'px-3 py-1 rounded-full border transition-all',
                dayType === 'tomorrow'
                  ? 'bg-[#222321] text-white border-[#222321] font-semibold'
                  : 'bg-white text-[#222321] border-[#E5E5E1] hover:bg-[#F5F5F1]'
              )}
            >
              Tomorrow
            </button>
            <div className="flex items-center gap-1.5">
              <input
                type="datetime-local"
                value={customDueDate}
                onChange={(e) => {
                  setCustomDueDate(e.target.value);
                  setDayType('custom');
                }}
                className="px-2.5 py-1 text-xs rounded-full border border-[#E5E5E1] bg-white text-[#222321] focus:outline-none focus:border-[#222321]"
              />
            </div>
          </div>
        </div>

        {/* Priority row matching Ref 2 */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#73756F] w-24 shrink-0">
            <Flag size={15} />
            <span className="font-medium">Priority</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as TaskPriority[]).map((p) => {
              const isSelected = priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    'px-3 py-1 rounded-full border text-xs transition-all',
                    isSelected
                      ? 'bg-[#222321] text-white border-[#222321] font-semibold'
                      : 'bg-white text-[#73756F] border-[#E5E5E1] hover:text-[#222321] hover:bg-[#F5F5F1]'
                  )}
                >
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Assignee row matching Ref 2 */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#73756F] w-24 shrink-0">
            <User size={15} />
            <span className="font-medium">Assign</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {employees.map((emp) => {
              const isSelected = selectedAssignee === emp.id;
              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => setSelectedAssignee(emp.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-all',
                    isSelected
                      ? 'bg-[#E8EB39] text-[#222321] border-[#d3d629] font-medium'
                      : 'bg-white text-[#222321] border-[#E5E5E1] hover:bg-[#F5F5F1]'
                  )}
                >
                  <Avatar
                    name={emp.name}
                    initials={emp.initials}
                    color={emp.avatar_color}
                    size="xs"
                  />
                  <span>{emp.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Category / Project Tag */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#73756F] w-24 shrink-0">
            <Tag size={15} />
            <span className="font-medium">Project</span>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Design, Operations, Customer Care"
              className="flex-1 px-3 py-1.5 bg-[#F5F5F1] border border-[#E5E5E1] rounded-xl text-xs text-[#222321] placeholder-[#73756F] focus:outline-none focus:bg-white focus:border-[#222321]"
            />
          </div>
        </div>

        {/* Description box matching Ref 2 */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-medium text-[#73756F]">
            <AlignLeft size={14} />
            <span>Description</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add relevant notes, checklist, or client specifications..."
            className="w-full p-3 bg-[#F5F5F1] border border-[#E5E5E1] rounded-xl text-xs text-[#222321] placeholder-[#73756F] focus:outline-none focus:bg-white focus:border-[#222321] transition-all resize-none"
          />
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-between border-t border-[#E5E5E1]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#73756F]">Initial status:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="text-xs bg-[#F5F5F1] border border-[#E5E5E1] rounded-lg px-2 py-1 text-[#222321] focus:outline-none"
            >
              <option value="TODO">Not started (TODO)</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            {/* The signature yellow pill button from Reference 2 */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="rounded-full px-5 font-semibold"
            >
              Create task
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
