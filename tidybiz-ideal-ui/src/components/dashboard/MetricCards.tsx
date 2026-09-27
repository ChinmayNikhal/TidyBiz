import React from 'react';
import { DashboardSummary } from '../../types/api';
import { CheckCircle2, Clock, AlertCircle, Inbox, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MetricCardsProps {
  summary: DashboardSummary | null;
  onFilterClick?: (type: 'open' | 'due_today' | 'overdue' | 'completed') => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ summary, onFilterClick }) => {
  const cards = [
    {
      id: 'open' as const,
      label: 'Open Tasks',
      value: summary?.open_tasks ?? 0,
      subtext: `${summary?.blocked_tasks ?? 0} blocked tasks`,
      icon: Inbox,
      iconBg: 'bg-[#F5F5F1] text-[#222321]',
      borderHover: 'hover:border-[#222321]',
    },
    {
      id: 'due_today' as const,
      label: 'Due Today',
      value: summary?.due_today ?? 0,
      subtext: 'Scheduled by end of day',
      icon: Clock,
      iconBg: 'bg-[#FEF3C7] text-[#B45309]',
      borderHover: 'hover:border-[#B45309]',
    },
    {
      id: 'overdue' as const,
      label: 'Overdue Deadlines',
      value: summary?.overdue_tasks ?? 0,
      subtext: 'Requires immediate attention',
      icon: AlertCircle,
      iconBg: (summary?.overdue_tasks ?? 0) > 0 ? 'bg-[#FEE2E2] text-[#B91C1C]' : 'bg-[#F5F5F1] text-[#73756F]',
      highlight: (summary?.overdue_tasks ?? 0) > 0,
      borderHover: 'hover:border-red-400',
    },
    {
      id: 'completed' as const,
      label: 'Completed Tasks',
      value: summary?.completed_tasks ?? 0,
      subtext: `${summary?.completion_rate ?? 0}% overall completion`,
      icon: CheckCircle2,
      iconBg: 'bg-[#DCFCE7] text-[#15803D]',
      borderHover: 'hover:border-green-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            onClick={() => onFilterClick && onFilterClick(card.id)}
            className={cn(
              'bg-white border border-[#E5E5E1] rounded-2xl p-4 sm:p-5 shadow-2xs transition-all cursor-pointer group',
              card.borderHover
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#73756F] uppercase tracking-wider">
                {card.label}
              </span>
              <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center shrink-0', card.iconBg)}>
                <Icon size={15} />
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              <p
                className={cn(
                  'text-2xl sm:text-3xl font-bold font-mono tracking-tight tabular-nums',
                  card.highlight ? 'text-red-600' : 'text-[#222321]'
                )}
              >
                {card.value}
              </p>
            </div>

            <p className="text-[11px] text-[#73756F] mt-1.5 flex items-center gap-1 truncate">
              {card.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
};
