import React from 'react';
import { WorkloadItem, Employee } from '../../types/api';
import { Avatar } from '../ui/Avatar';
import { Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface WorkloadWidgetProps {
  workload: WorkloadItem[];
  employees: Employee[];
}

export const WorkloadWidget: React.FC<WorkloadWidgetProps> = ({ workload, employees }) => {
  const getEmployee = (id: string) => employees.find((e) => e.id === id);

  return (
    <div className="bg-white border border-[#E5E5E1] rounded-2xl p-5 shadow-2xs flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-[#E5E5E1]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-[#F5F5F1] text-[#222321] flex items-center justify-center shrink-0">
            <Users size={15} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#222321] tracking-tight">Team Workload & Capacity</h3>
            <p className="text-[11px] text-[#73756F]">Active task distribution across members</p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F5F5F1] text-[#73756F] font-semibold border border-[#E5E5E1]">
          {workload.length} members
        </span>
      </div>

      {/* Table / Member List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E5E5E1] text-[11px] font-semibold text-[#73756F] uppercase tracking-wider">
              <th className="pb-2.5 font-medium min-w-[140px]">Team Member</th>
              <th className="pb-2.5 font-medium text-center px-2">Open</th>
              <th className="pb-2.5 font-medium text-center px-2">Overdue</th>
              <th className="pb-2.5 font-medium text-center px-2">Blocked</th>
              <th className="pb-2.5 font-medium text-center px-2">Completed</th>
              <th className="pb-2.5 font-medium text-right pr-1 min-w-[110px]">Capacity Load</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E1]/60">
            {workload.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-xs text-[#73756F]">
                  No workload statistics available.
                </td>
              </tr>
            ) : (
              workload.map((item) => {
                const emp = getEmployee(item.employee_id);
                const total = item.open_tasks + item.completed_tasks;
                const percentage = total > 0 ? Math.round((item.completed_tasks / total) * 100) : 100;
                const isOverloaded = item.overdue_tasks >= 2 || item.open_tasks > 5;
                const hasBlockers = item.blocked_tasks > 0;

                return (
                  <tr key={item.employee_id} className="hover:bg-[#F5F5F1]/50 transition-colors">
                    {/* Member Column */}
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          name={item.name}
                          initials={emp?.initials}
                          color={emp?.avatar_color}
                          avatarUrl={emp?.avatar_url}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-[#222321] text-xs truncate leading-tight">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-[#73756F] truncate mt-0.5">
                            {emp?.department || item.role}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Open */}
                    <td className="py-3 px-2 text-center">
                      <span className="font-mono text-xs font-semibold text-[#222321] tabular-nums">
                        {item.open_tasks}
                      </span>
                    </td>

                    {/* Overdue */}
                    <td className="py-3 px-2 text-center">
                      {item.overdue_tasks > 0 ? (
                        <span className="inline-flex items-center justify-center font-mono text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md tabular-nums">
                          {item.overdue_tasks}
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-[#73756F] tabular-nums">0</span>
                      )}
                    </td>

                    {/* Blocked */}
                    <td className="py-3 px-2 text-center">
                      {item.blocked_tasks > 0 ? (
                        <span className="inline-flex items-center justify-center font-mono text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md tabular-nums">
                          {item.blocked_tasks}
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-[#73756F] tabular-nums">0</span>
                      )}
                    </td>

                    {/* Done */}
                    <td className="py-3 px-2 text-center">
                      <span className="font-mono text-xs text-green-700 font-semibold tabular-nums">
                        {item.completed_tasks}
                      </span>
                    </td>

                    {/* Capacity Load Bar */}
                    <td className="py-3 pl-2 pr-1 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1.5 text-[10px]">
                          {isOverloaded ? (
                            <span className="font-semibold text-red-600">High Load</span>
                          ) : hasBlockers ? (
                            <span className="font-semibold text-amber-700">Blocked</span>
                          ) : (
                            <span className="font-medium text-[#73756F]">Optimal</span>
                          )}
                          <span className="font-mono text-[#222321] font-semibold tabular-nums">
                            {percentage}%
                          </span>
                        </div>
                        <div className="w-full max-w-[100px] h-1.5 bg-[#E5E5E1] rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-300',
                              isOverloaded
                                ? 'bg-red-500'
                                : percentage === 100
                                ? 'bg-green-500'
                                : 'bg-[#E8EB39]'
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
