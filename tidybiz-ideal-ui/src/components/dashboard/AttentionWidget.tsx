import React from 'react';
import { AttentionItem, Task } from '../../types/api';
import { SeverityBadge } from '../ui/Badge';
import { AlertTriangle, ArrowRight, CheckCircle2, AlertOctagon, Clock, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

interface AttentionWidgetProps {
  items: AttentionItem[];
  tasks: Task[];
  onSelectTaskById?: (taskId: string) => void;
}

export const AttentionWidget: React.FC<AttentionWidgetProps> = ({
  items,
  tasks,
  onSelectTaskById,
}) => {
  const getRuleIcon = (code: string) => {
    switch (code) {
      case 'OVERDUE_TASK':
        return <Clock size={16} className="text-red-600" />;
      case 'BLOCKED_TASK':
      case 'HIGH_PRIORITY_BLOCKED':
        return <AlertOctagon size={16} className="text-amber-700" />;
      case 'CRITICAL_DEADLINE':
        return <AlertTriangle size={16} className="text-red-700" />;
      case 'EMPLOYEE_OVERDUE_LOAD':
      default:
        return <ShieldAlert size={16} className="text-amber-600" />;
    }
  };

  return (
    <div className="bg-white border border-[#E5E5E1] rounded-2xl p-5 shadow-2xs flex flex-col h-full min-h-[320px]">
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-[#E5E5E1]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center shrink-0">
            <AlertTriangle size={15} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#222321] tracking-tight">Needs Attention</h3>
            <p className="text-[11px] text-[#73756F]">Rule-based bottleneck detection</p>
          </div>
        </div>
        <span
          className={cn(
            'text-xs px-2.5 py-0.5 rounded-full font-semibold',
            items.length > 0 ? 'bg-[#FEE2E2] text-red-800 border border-red-200' : 'bg-[#DCFCE7] text-green-800'
          )}
        >
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[360px]">
        {items.length === 0 ? (
          <div className="py-12 px-4 text-center text-xs text-[#73756F] flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-[#DCFCE7] text-green-700 flex items-center justify-center mb-2.5">
              <CheckCircle2 size={20} />
            </div>
            <p className="font-semibold text-sm text-[#222321]">Zero bottlenecks detected</p>
            <p className="text-[11px] text-[#73756F] mt-1 max-w-xs">
              No overdue deadlines, blocked pipelines, or overloaded members in your workspace.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const hasTask = Boolean(item.task_id);
            const isHigh = item.severity === 'HIGH';

            return (
              <div
                key={item.id}
                className={cn(
                  'p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between gap-2.5',
                  isHigh
                    ? 'bg-[#FFFBFB] border-red-200/90 hover:border-red-300'
                    : 'bg-[#FFFDF7] border-amber-200/80 hover:border-amber-300'
                )}
              >
                {/* Top Row: Icon + Title + Severity Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={cn(
                        'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                        isHigh ? 'bg-red-100' : 'bg-amber-100'
                      )}
                    >
                      {getRuleIcon(item.rule_code)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-[#222321] leading-snug">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-[#73756F] mt-0.5 leading-relaxed">
                        {item.reason}
                      </p>
                    </div>
                  </div>

                  <SeverityBadge severity={item.severity} className="shrink-0" />
                </div>

                {/* Bottom Row: Suggested Action & Action Button */}
                <div className="pt-2 border-t border-[#E5E5E1]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                  <p className="text-[#222321] font-medium leading-tight">
                    <span className="text-[#73756F] font-normal">Action: </span>
                    {item.suggested_action}
                  </p>

                  {hasTask && onSelectTaskById && (
                    <button
                      type="button"
                      onClick={() => onSelectTaskById(item.task_id!)}
                      className="inline-flex items-center gap-1 font-semibold text-[#222321] hover:text-black bg-white hover:bg-[#F5F5F1] border border-[#E5E5E1] rounded-lg px-2.5 py-1 transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      <span>Resolve</span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
