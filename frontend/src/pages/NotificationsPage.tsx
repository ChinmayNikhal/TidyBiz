import React, { useState } from 'react';
import { AttentionItem, Task } from '../types/api';
import { Bell, CheckCircle2, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SeverityBadge } from '../components/ui/Badge';
import { cn } from '../lib/utils';

interface NotificationsPageProps {
  attentionItems: AttentionItem[];
  tasks: Task[];
  onSelectTaskById: (id: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  attentionItems,
  tasks,
  onSelectTaskById,
}) => {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const markAllRead = () => {
    setReadIds(new Set(attentionItems.map((i) => i.id)));
  };

  const toggleRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const unreadCount = attentionItems.filter((i) => !readIds.has(i.id)).length;

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#222321]">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#E8EB39] text-[#222321] font-semibold">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#73756F] mt-0.5">
            Operational alerts, priority deadlines, and bottleneck warnings.
          </p>
        </div>

        {attentionItems.length > 0 && (
          <Button
            onClick={markAllRead}
            variant="secondary"
            size="sm"
            className="text-xs"
          >
            <CheckCircle2 size={14} className="mr-1.5" />
            <span>Mark all as read</span>
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-[#E5E5E1] rounded-2xl overflow-hidden shadow-2xs divide-y divide-[#E5E5E1]">
        {attentionItems.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#73756F]">
            <CheckCircle2 size={28} className="text-green-600 mx-auto mb-2" />
            <p className="font-semibold text-sm text-[#222321]">No unread alerts</p>
            <p className="mt-1">All workspace deliverables are running smoothly.</p>
          </div>
        ) : (
          attentionItems.map((item) => {
            const isRead = readIds.has(item.id);
            return (
              <div
                key={item.id}
                className={cn(
                  'p-5 transition-colors flex items-start justify-between gap-4 hover:bg-[#F5F5F1]/60',
                  isRead ? 'opacity-60 bg-white' : 'bg-[#F5F5F1]/20'
                )}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                      item.severity === 'HIGH' ? 'bg-[#FEE2E2] text-red-700' : 'bg-[#FEF3C7] text-amber-700'
                    )}
                  >
                    <AlertTriangle size={16} />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-[#222321]">{item.title}</h4>
                      <SeverityBadge severity={item.severity} />
                    </div>
                    <p className="text-xs text-[#73756F] leading-relaxed">{item.reason}</p>
                    <p className="text-xs text-[#222321] font-medium pt-1">
                      <span className="text-[#73756F]">Suggested action:</span> {item.suggested_action}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.task_id && (
                    <Button
                      onClick={() => onSelectTaskById(item.task_id!)}
                      variant="secondary"
                      size="sm"
                      className="text-xs"
                    >
                      <span>View task</span>
                      <ArrowRight size={13} className="ml-1" />
                    </Button>
                  )}
                  <button
                    onClick={() => toggleRead(item.id)}
                    className="text-xs text-[#73756F] hover:text-[#222321] px-2 py-1"
                  >
                    {isRead ? 'Unread' : 'Dismiss'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
