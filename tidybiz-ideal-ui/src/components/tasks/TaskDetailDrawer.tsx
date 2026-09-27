import React, { useState } from 'react';
import { Task, Employee, TaskPriority, TaskStatus } from '../../types/api';
import { Avatar } from '../ui/Avatar';
import { PriorityBadge, StatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  X,
  Calendar,
  User,
  Flag,
  CheckCircle2,
  Trash2,
  Paperclip,
  Plus,
  Send,
  ExternalLink,
} from 'lucide-react';
import { formatDate, formatDateTime } from '../../lib/utils';

interface TaskDetailDrawerProps {
  task: Task | null;
  employees: Employee[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  employees,
  isOpen,
  onClose,
  onUpdateTask,
  onDeleteTask,
}) => {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Array<{ id: string; author: string; text: string; time: string }>>([
    {
      id: 'c1',
      author: 'Asha Sharma',
      text: 'Please ensure high color fidelity against client Pantone swatches before print run.',
      time: 'Yesterday at 4:15 PM',
    },
  ]);
  const [attachments, setAttachments] = useState<Array<{ name: string; size: string }>>([
    { name: 'Pantone_Formula_Guide.pdf', size: '2.4 MB' },
    { name: 'PrintWorks_Proof_Sheet_v2.cmyk', size: '8.1 MB' },
  ]);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !task) return null;

  const currentAssignee = employees.find((e) => e.id === task.assignee_id);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setComments((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        author: 'Current User',
        text: commentText.trim(),
        time: 'Just now',
      },
    ]);
    setCommentText('');
  };

  const handleAddAttachment = () => {
    const fileName = prompt('Attachment name (e.g. proof_sample.pdf):', 'Client_Approval_Spec.pdf');
    if (fileName) {
      setAttachments((prev) => [...prev, { name: fileName, size: '1.2 MB' }]);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    setIsDeleting(true);
    try {
      await onDeleteTask(task.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#222321]/30 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white border-l border-[#E5E5E1] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#E5E5E1] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#73756F] uppercase tracking-wider">
              Task Details
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-[#73756F] hover:text-[#222321] rounded-lg hover:bg-[#F5F5F1] transition-colors"
              aria-label="Close drawer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Title & Category */}
            <div>
              <h2 className="text-xl font-bold text-[#222321] leading-snug">
                {task.title}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F5F5F1] text-[#73756F] font-medium border border-[#E5E5E1]">
                  {task.category || 'General Workspace'}
                </span>
                {task.status === 'COMPLETED' && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 font-medium border border-green-200 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    <span>Completed</span>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Properties Card */}
            <div className="bg-[#F5F5F1] border border-[#E5E5E1] rounded-2xl p-4 space-y-3.5 text-xs">
              {/* Assignee */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#73756F]">
                  <User size={15} />
                  <span>Assignee</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={task.assignee_id}
                    onChange={(e) => onUpdateTask(task.id, { assignee_id: e.target.value })}
                    className="bg-white border border-[#E5E5E1] rounded-lg px-2.5 py-1 text-xs text-[#222321] focus:outline-none"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status / Stage */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#73756F]">
                  <CheckCircle2 size={15} />
                  <span>Status</span>
                </div>
                <select
                  value={task.status}
                  onChange={(e) => onUpdateTask(task.id, { status: e.target.value as TaskStatus })}
                  className="bg-white border border-[#E5E5E1] rounded-lg px-2.5 py-1 text-xs text-[#222321] focus:outline-none"
                >
                  <option value="TODO">Not started</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              {/* Priority */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#73756F]">
                  <Flag size={15} />
                  <span>Priority</span>
                </div>
                <select
                  value={task.priority}
                  onChange={(e) => onUpdateTask(task.id, { priority: e.target.value as TaskPriority })}
                  className="bg-white border border-[#E5E5E1] rounded-lg px-2.5 py-1 text-xs text-[#222321] focus:outline-none"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              {/* Deadline */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#73756F]">
                  <Calendar size={15} />
                  <span>Due Date</span>
                </div>
                <span className="font-medium text-[#222321]">
                  {formatDateTime(task.due_at)}
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-semibold text-[#73756F] uppercase tracking-wider mb-2">
                Description
              </h4>
              <div className="p-3.5 bg-[#F5F5F1]/50 border border-[#E5E5E1] rounded-xl text-xs text-[#222321] leading-relaxed whitespace-pre-wrap">
                {task.description || 'No description provided for this task.'}
              </div>
            </div>

            {/* Attachments Section matching Ref 1 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-[#73756F] uppercase tracking-wider">
                  Attachments ({attachments.length})
                </h4>
                <button
                  type="button"
                  onClick={handleAddAttachment}
                  className="text-xs font-medium text-[#222321] hover:underline flex items-center gap-1"
                >
                  <Plus size={13} />
                  <span>Attach</span>
                </button>
              </div>
              <div className="space-y-2">
                {attachments.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-[#E5E5E1] bg-white text-xs hover:bg-[#F5F5F1] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#E8EB39] text-[#222321] flex items-center justify-center shrink-0">
                        <Paperclip size={14} />
                      </div>
                      <div className="truncate">
                        <p className="font-medium text-[#222321] truncate">{file.name}</p>
                        <p className="text-[10px] text-[#73756F]">{file.size}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#73756F]">Ready</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments & Activity matching Ref 1 */}
            <div>
              <h4 className="text-xs font-semibold text-[#73756F] uppercase tracking-wider mb-3">
                Activity & Comments
              </h4>
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-[#F5F5F1] border border-[#E5E5E1] text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[#222321]">{c.author}</span>
                      <span className="text-[10px] text-[#73756F]">{c.time}</span>
                    </div>
                    <p className="text-[#222321] leading-relaxed">{c.text}</p>
                  </div>
                ))}

                <form onSubmit={handleAddComment} className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment or update..."
                    className="flex-1 px-3 py-2 text-xs bg-[#F5F5F1] border border-[#E5E5E1] rounded-xl text-[#222321] placeholder-[#73756F] focus:outline-none focus:bg-white focus:border-[#222321]"
                  />
                  <Button type="submit" variant="primary" size="sm" className="rounded-xl">
                    <Send size={14} />
                  </Button>
                </form>
              </div>
            </div>
          </div>

          {/* Footer Actions matching Ref 1 */}
          <div className="p-4 border-t border-[#E5E5E1] bg-[#F5F5F1] flex items-center justify-between">
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDelete}
              isLoading={isDeleting}
              className="gap-1.5"
            >
              <Trash2 size={14} />
              <span>Delete task</span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
