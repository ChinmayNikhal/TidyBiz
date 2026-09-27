import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Bell, Mail, Menu, Filter, RefreshCw, User, Settings, LogOut, ChevronDown, Check, LogIn } from 'lucide-react';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Employee } from '../../types/api';
import { cn } from '../../lib/utils';

interface TopBarProps {
  onOpenNewTask: () => void;
  onOpenMobileMenu: () => void;
  onOpenFilterPopover: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currentUser: Employee | null;
  employees: Employee[];
  unreadCount?: number;
  onNavigateToNotifications?: () => void;
  onRefreshData?: () => void;
  isRefreshing?: boolean;
  onOpenAuthModal: () => void;
  onOpenProfileEditModal: () => void;
  onSwitchUser: (employee: Employee) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenNewTask,
  onOpenMobileMenu,
  onOpenFilterPopover,
  searchQuery,
  onSearchChange,
  currentUser,
  employees,
  unreadCount = 2,
  onNavigateToNotifications,
  onRefreshData,
  isRefreshing,
  onOpenAuthModal,
  onOpenProfileEditModal,
  onSwitchUser,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 px-4 lg:px-8 border-b border-[#E5E5E1] bg-[#FFFFFF]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & Search input */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-[#73756F] hover:text-[#222321] hover:bg-[#F5F5F1] transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* Global Search with Filter Affordance */}
        <div className="relative w-full">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73756F] pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks, categories, or press ⌘K..."
            className="w-full pl-9 pr-12 py-2 bg-[#F5F5F1] border border-[#E5E5E1] rounded-full text-xs sm:text-sm text-[#222321] placeholder-[#73756F] focus:outline-none focus:border-[#222321] focus:bg-white transition-all"
          />
          <button
            onClick={onOpenFilterPopover}
            title="Filter options"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#73756F] hover:text-[#222321] hover:bg-white rounded-full transition-colors"
          >
            <Filter size={14} />
          </button>
        </div>
      </div>

      {/* Right Action Zone */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {onRefreshData && (
          <button
            onClick={onRefreshData}
            title="Refresh workspace data"
            className="p-2 text-[#73756F] hover:text-[#222321] hover:bg-[#F5F5F1] rounded-full transition-colors hidden sm:flex cursor-pointer"
          >
            <RefreshCw size={17} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        )}

        {/* Prominent + New Task Action Button (Electric Lime Yellow) */}
        <Button
          onClick={onOpenNewTask}
          variant="primary"
          size="sm"
          className="rounded-full px-4 h-9 shadow-xs font-semibold text-xs sm:text-sm"
        >
          <Plus size={16} className="mr-1 stroke-[2.5]" />
          <span>New task</span>
        </Button>

        {/* Inbox / Messages Icon */}
        <button
          onClick={() => {}}
          title="Team inbox"
          className="p-2 text-[#73756F] hover:text-[#222321] hover:bg-[#F5F5F1] rounded-full transition-colors hidden sm:flex cursor-pointer"
        >
          <Mail size={18} />
        </button>

        {/* Notifications Icon with Indicator */}
        <button
          onClick={onNavigateToNotifications}
          title="Notifications"
          className="relative p-2 text-[#73756F] hover:text-[#222321] hover:bg-[#F5F5F1] rounded-full transition-colors cursor-pointer"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>

        {/* User Profile Avatar with Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-[#E5E5E1]/80 hover:opacity-90 transition-opacity cursor-pointer text-left"
          >
            <Avatar
              name={currentUser?.name || 'Asha Sharma'}
              initials={currentUser?.initials || 'AS'}
              color={currentUser?.avatar_color || '#222321'}
              avatarUrl={currentUser?.avatar_url}
              size="sm"
            />
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-[#222321] leading-tight">
                {currentUser?.name || 'Asha Sharma'}
              </span>
              <span className="text-[10px] text-[#73756F] leading-tight flex items-center gap-1">
                <span>{currentUser?.role === 'OWNER' ? 'Owner' : currentUser?.department || 'Member'}</span>
                <ChevronDown size={11} />
              </span>
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-[#E5E5E1] rounded-2xl shadow-xl z-50 py-2 animate-in fade-in zoom-in-95 duration-150">
              {/* Profile Card Header */}
              <div className="px-4 py-3 border-b border-[#E5E5E1] flex items-center gap-3">
                <Avatar
                  name={currentUser?.name || 'User'}
                  initials={currentUser?.initials}
                  color={currentUser?.avatar_color}
                  avatarUrl={currentUser?.avatar_url}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#222321] truncate">
                    {currentUser?.name}
                  </p>
                  <p className="text-[11px] text-[#73756F] truncate">
                    {currentUser?.email || 'user@printworks.studio'}
                  </p>
                  <span className="inline-block mt-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-[#E8EB39] text-[#222321] rounded">
                    {currentUser?.role}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-1 space-y-0.5 text-xs">
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onOpenProfileEditModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#222321] hover:bg-[#F5F5F1] transition-colors text-left"
                >
                  <User size={15} className="text-[#73756F]" />
                  <span>Edit Profile & Photo (PFP)</span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onOpenAuthModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#222321] hover:bg-[#F5F5F1] transition-colors text-left"
                >
                  <LogIn size={15} className="text-[#73756F]" />
                  <span>Sign In / Create Account</span>
                </button>
              </div>

              {/* Switch User Section */}
              <div className="pt-2 mt-1 border-t border-[#E5E5E1] px-1">
                <p className="px-3 pb-1 text-[10px] font-semibold text-[#73756F] uppercase tracking-wider">
                  Switch Active Member
                </p>
                <div className="space-y-0.5">
                  {employees.map((emp) => {
                    const isSelected = currentUser?.id === emp.id;
                    return (
                      <button
                        key={emp.id}
                        onClick={() => {
                          onSwitchUser(emp);
                          setIsProfileMenuOpen(false);
                        }}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-colors text-xs text-left',
                          isSelected ? 'bg-[#F5F5F1] font-semibold' : 'hover:bg-[#F5F5F1]/60'
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar
                            name={emp.name}
                            initials={emp.initials}
                            avatarUrl={emp.avatar_url}
                            color={emp.avatar_color}
                            size="xs"
                          />
                          <span className="truncate">{emp.name}</span>
                        </div>
                        {isSelected && <Check size={14} className="text-[#222321]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
