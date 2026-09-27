import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Bell,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  Building2,
  Menu,
  X,
} from 'lucide-react';
import { Business } from '../../types/api';
import { cn } from '../../lib/utils';

export type NavTab = 'dashboard' | 'tasks' | 'team' | 'notifications' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  business: Business | null;
  unreadNotificationsCount?: number;
  openTasksCount?: number;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  business,
  unreadNotificationsCount = 2,
  openTasksCount = 0,
  isMobileOpen,
  onCloseMobile,
}) => {
  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: number;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'My tasks', icon: CheckSquare, badge: openTasksCount },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotificationsCount },
    { id: 'team', label: 'Team & Workload', icon: Users },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#FFFFFF] border-r border-[#E5E5E1] select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-[#E5E5E1]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#E8EB39] text-[#222321] flex items-center justify-center font-bold text-base shadow-2xs border border-[#d3d629]">
            TB
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-[#222321]">
              TidyBiz
            </span>
          </div>
        </div>
        <button
          onClick={onCloseMobile}
          className="lg:hidden text-[#73756F] hover:text-[#222321] p-1"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Workspace Switcher */}
      <div className="px-4 py-3.5 border-b border-[#E5E5E1]/60">
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#F5F5F1] hover:bg-[#EFEFEA] transition-colors cursor-pointer border border-[#E5E5E1]/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-white border border-[#E5E5E1] flex items-center justify-center text-[#222321] shrink-0">
              <Building2 size={13} />
            </div>
            <div className="truncate text-left">
              <p className="text-xs font-semibold text-[#222321] truncate leading-tight">
                {business?.name || 'PrintWorks Studio'}
              </p>
              <p className="text-[10px] text-[#73756F] truncate">
                {business?.category || 'Printing & design'}
              </p>
            </div>
          </div>
          <ChevronDown size={14} className="text-[#73756F] shrink-0 ml-1" />
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-1.5 text-[11px] font-semibold text-[#73756F] uppercase tracking-wider">
          Workspace
        </div>
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={cn(
                'relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group',
                isActive
                  ? 'bg-[#F5F5F1] text-[#222321] font-semibold'
                  : 'text-[#73756F] hover:bg-[#F5F5F1]/60 hover:text-[#222321]'
              )}
            >
              {/* Distinctive active left border bar matching the design reference images */}
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#E8EB39] rounded-r-full" />
              )}
              <div className="flex items-center gap-3">
                <Icon
                  size={18}
                  className={cn(
                    'transition-colors',
                    isActive ? 'text-[#222321]' : 'text-[#73756F] group-hover:text-[#222321]'
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={cn(
                    'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                    isActive
                      ? 'bg-[#E8EB39] text-[#222321]'
                      : 'bg-[#F5F5F1] text-[#73756F] group-hover:bg-[#E5E5E1]'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-[#E5E5E1] space-y-1">
        <button
          onClick={() => handleNavClick('settings')}
          className={cn(
            'relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
            currentTab === 'settings'
              ? 'bg-[#F5F5F1] text-[#222321] font-semibold'
              : 'text-[#73756F] hover:bg-[#F5F5F1]/60 hover:text-[#222321]'
          )}
        >
          {currentTab === 'settings' && (
            <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#E8EB39] rounded-r-full" />
          )}
          <Settings size={18} />
          <span>Settings</span>
        </button>

        <button
          onClick={() => {
            alert('Signed out of demo session. Workspace state remains preserved.');
          }}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#73756F] hover:bg-[#FEE2E2]/40 hover:text-red-700 transition-colors"
        >
          <LogOut size={18} />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#222321]/40 backdrop-blur-2xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[80vw] h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
