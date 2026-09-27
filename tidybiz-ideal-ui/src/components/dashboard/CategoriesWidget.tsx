import React from 'react';
import { Briefcase, FolderCheck, Palette, Truck, Plus, MoreVertical } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Employee } from '../../types/api';

interface CategoriesWidgetProps {
  employees: Employee[];
  onSelectCategory?: (category: string) => void;
}

export const CategoriesWidget: React.FC<CategoriesWidgetProps> = ({ employees, onSelectCategory }) => {
  const categories = [
    {
      name: 'Design & Proofs',
      icon: Palette,
      members: employees.filter((e) => e.department === 'Design' || e.role === 'OWNER'),
      taskCount: 3,
    },
    {
      name: 'Operations & Ink',
      icon: Briefcase,
      members: employees.filter((e) => e.department === 'Operations'),
      taskCount: 4,
    },
    {
      name: 'Customer & Accounts',
      icon: FolderCheck,
      members: employees.filter((e) => e.department === 'Customer Care'),
      taskCount: 2,
    },
    {
      name: 'Dispatch & Fleet',
      icon: Truck,
      members: employees.filter((e) => e.department?.includes('Dispatch')),
      taskCount: 2,
    },
  ];

  return (
    <div className="bg-white border border-[#E5E5E1] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#222321]">My categories</h3>
        <button className="text-[#73756F] hover:text-[#222321]">
          <MoreVertical size={14} />
        </button>
      </div>

      <div className="space-y-2">
        {categories.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <div
              key={i}
              onClick={() => onSelectCategory && onSelectCategory(cat.name)}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F5F5F1] transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#F5F5F1] text-[#222321] group-hover:bg-[#E8EB39] flex items-center justify-center shrink-0 transition-colors">
                  <Icon size={14} />
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-[#222321] truncate">{cat.name}</p>
                  <p className="text-[10px] text-[#73756F]">{cat.taskCount} tasks active</p>
                </div>
              </div>

              {/* Stacked avatars matching Ref 4 */}
              <div className="flex items-center -space-x-1.5 shrink-0">
                {cat.members.slice(0, 3).map((m) => (
                  <Avatar
                    key={m.id}
                    name={m.name}
                    initials={m.initials}
                    color={m.avatar_color}
                    size="xs"
                    className="ring-2 ring-white"
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => {
          const name = prompt('New category name:');
          if (name) alert(`Created category "${name}"`);
        }}
        className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 border border-dashed border-[#E5E5E1] rounded-xl text-xs font-medium text-[#73756F] hover:text-[#222321] hover:border-[#222321] hover:bg-[#F5F5F1] transition-all"
      >
        <Plus size={13} />
        <span>Add category</span>
      </button>
    </div>
  );
};
