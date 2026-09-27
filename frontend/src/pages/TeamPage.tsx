import React, { useState } from 'react';
import { Employee, WorkloadItem, EmployeeRole } from '../types/api';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Mail, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface TeamPageProps {
  employees: Employee[];
  workload: WorkloadItem[];
  onAddEmployee: (payload: { name: string; role: EmployeeRole; department?: string; is_active?: boolean }) => Promise<void>;
  onUpdateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
}

export const TeamPage: React.FC<TeamPageProps> = ({
  employees,
  workload,
  onAddEmployee,
  onUpdateEmployee,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<EmployeeRole>('EMPLOYEE');
  const [department, setDepartment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getWorkload = (id: string) => workload.find((w) => w.employee_id === id);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddEmployee({
        name: name.trim(),
        role,
        department: department.trim() || undefined,
        is_active: true,
      });
      setName('');
      setDepartment('');
      setRole('EMPLOYEE');
      setIsAddModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#222321]">
            Team & Workload
          </h1>
          <p className="text-xs sm:text-sm text-[#73756F] mt-0.5">
            Monitor member assignments, capacity distribution, and team health.
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          variant="primary"
          size="sm"
          className="text-xs font-semibold"
        >
          <Plus size={15} className="mr-1 stroke-[2.5]" />
          <span>Add member</span>
        </Button>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {employees.map((emp) => {
          const stats = getWorkload(emp.id);

          return (
            <div
              key={emp.id}
              className="bg-white border border-[#E5E5E1] rounded-2xl p-5 shadow-2xs flex flex-col justify-between"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={emp.name}
                      initials={emp.initials}
                      color={emp.avatar_color}
                      size="lg"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-[#222321]">{emp.name}</h3>
                      <p className="text-xs text-[#73756F]">{emp.department || 'General'}</p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      'text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full',
                      emp.role === 'OWNER'
                        ? 'bg-[#E8EB39] text-[#222321]'
                        : emp.role === 'MANAGER'
                        ? 'bg-[#222321] text-white'
                        : 'bg-[#F5F5F1] text-[#73756F]'
                    )}
                  >
                    {emp.role}
                  </span>
                </div>

                {/* Workload Statistics Grid */}
                <div className="grid grid-cols-4 gap-2 p-3 bg-[#F5F5F1]/70 border border-[#E5E5E1]/80 rounded-xl text-center mb-4">
                  <div>
                    <span className="text-[10px] text-[#73756F] block">Open</span>
                    <span className="font-mono text-sm font-bold text-[#222321] tabular-nums">
                      {stats?.open_tasks ?? 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#73756F] block">Overdue</span>
                    <span
                      className={cn(
                        'font-mono text-sm font-bold tabular-nums',
                        (stats?.overdue_tasks ?? 0) > 0 ? 'text-red-600' : 'text-[#73756F]'
                      )}
                    >
                      {stats?.overdue_tasks ?? 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#73756F] block">Blocked</span>
                    <span
                      className={cn(
                        'font-mono text-sm font-bold tabular-nums',
                        (stats?.blocked_tasks ?? 0) > 0 ? 'text-amber-700' : 'text-[#73756F]'
                      )}
                    >
                      {stats?.blocked_tasks ?? 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#73756F] block">Done</span>
                    <span className="font-mono text-sm font-bold text-green-700 tabular-nums">
                      {stats?.completed_tasks ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer status & toggle */}
              <div className="pt-3 border-t border-[#E5E5E1] flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-[#73756F]">
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      emp.is_active ? 'bg-green-500' : 'bg-[#E5E5E1]'
                    )}
                  />
                  <span>{emp.is_active ? 'Active status' : 'Inactive'}</span>
                </span>

                <button
                  onClick={() => onUpdateEmployee(emp.id, { is_active: !emp.is_active })}
                  className="text-xs text-[#73756F] hover:text-[#222321] underline"
                >
                  {emp.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Member Modal (P1) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Team Member"
        description="Add a new employee to the PrintWorks Studio workspace."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#73756F] uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Vikram Malhotra"
              className="w-full px-3 py-2 text-xs bg-[#F5F5F1] border border-[#E5E5E1] rounded-xl text-[#222321] focus:outline-none focus:bg-white focus:border-[#222321]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#73756F] uppercase tracking-wider mb-1">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as EmployeeRole)}
                className="w-full px-3 py-2 text-xs bg-[#F5F5F1] border border-[#E5E5E1] rounded-xl text-[#222321] focus:outline-none focus:bg-white"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="OWNER">Owner</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#73756F] uppercase tracking-wider mb-1">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Pre-press, Packaging"
                className="w-full px-3 py-2 text-xs bg-[#F5F5F1] border border-[#E5E5E1] rounded-xl text-[#222321] focus:outline-none focus:bg-white focus:border-[#222321]"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#E5E5E1]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              className="rounded-full px-5 font-semibold"
            >
              Add member
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
