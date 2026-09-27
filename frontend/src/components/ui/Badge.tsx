import React from 'react';
import { cn } from '../../lib/utils';
import { TaskPriority, TaskStatus, AttentionSeverity } from '../../types/api';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'neutral' | 'brand' | 'warning' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'sm',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full transition-colors select-none';

  const variants = {
    default: 'bg-[#F5F5F1] text-[#222321] border border-[#E5E5E1]',
    neutral: 'bg-[#F5F5F1] text-[#73756F]',
    brand: 'bg-[#E8EB39] text-[#222321]',
    warning: 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]',
    danger: 'bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]',
    success: 'bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]',
    outline: 'border border-[#E5E5E1] text-[#73756F]',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: TaskPriority; className?: string }> = ({
  priority,
  className,
}) => {
  // In reference images, priority badges use warm earthy tones:
  // Critical/High: Warm amber / ochre or red
  // Medium: Golden wheat
  // Low: Calm stone
  switch (priority) {
    case 'CRITICAL':
      return (
        <span className={cn('inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]', className)}>
          Critical
        </span>
      );
    case 'HIGH':
      return (
        <span className={cn('inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F5E6CC] text-[#78350F] border border-[#E8D4B4]', className)}>
          High
        </span>
      );
    case 'MEDIUM':
      return (
        <span className={cn('inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#EFECE1] text-[#635532] border border-[#E0DBCF]', className)}>
          Medium
        </span>
      );
    case 'LOW':
    default:
      return (
        <span className={cn('inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F5F5F1] text-[#73756F] border border-[#E5E5E1]', className)}>
          Low
        </span>
      );
  }
};

export const StatusBadge: React.FC<{ status: TaskStatus; className?: string }> = ({
  status,
  className,
}) => {
  switch (status) {
    case 'IN_PROGRESS':
      return (
        <span className={cn('inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#E8EB39] text-[#222321] border border-[#d3d629]', className)}>
          In progress
        </span>
      );
    case 'BLOCKED':
      return (
        <span className={cn('inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]', className)}>
          Blocked
        </span>
      );
    case 'COMPLETED':
      return (
        <span className={cn('inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]', className)}>
          Completed
        </span>
      );
    case 'TODO':
    default:
      return (
        <span className={cn('inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F5F5F1] text-[#73756F] border border-[#E5E5E1]', className)}>
          Not started
        </span>
      );
  }
};

export const SeverityBadge: React.FC<{ severity: AttentionSeverity; className?: string }> = ({
  severity,
  className,
}) => {
  switch (severity) {
    case 'HIGH':
      return (
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-semibold bg-[#FEE2E2] text-[#991B1B]', className)}>
          High Alert
        </span>
      );
    case 'MEDIUM':
      return (
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-semibold bg-[#FEF3C7] text-[#92400E]', className)}>
          Warning
        </span>
      );
    case 'LOW':
    default:
      return (
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-semibold bg-[#F5F5F1] text-[#73756F]', className)}>
          Notice
        </span>
      );
  }
};
