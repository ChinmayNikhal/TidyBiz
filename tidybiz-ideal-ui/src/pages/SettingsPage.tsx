import React, { useState } from 'react';
import { Business, Employee } from '../types/api';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Building2, User, Camera, RotateCcw, Check, Sparkles } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

interface SettingsPageProps {
  business: Business | null;
  currentUser: Employee | null;
  onResetSeedData: () => void;
  onOpenProfileModal: () => void;
  onOpenAuthModal: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  business,
  currentUser,
  onResetSeedData,
  onOpenProfileModal,
  onOpenAuthModal,
}) => {
  const { showToast } = useToast();
  const [workspaceName, setWorkspaceName] = useState(business?.name || 'PrintWorks Studio');
  const [timezone, setTimezone] = useState(business?.timezone || 'Asia/Kolkata');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    showToast('Workspace settings saved successfully', 'success');
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleReset = () => {
    if (confirm('Reset workspace tasks and data to original canonical seed dataset?')) {
      onResetSeedData();
      showToast('Workspace reset to initial demo dataset', 'info');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#222321]">
          Settings & Workspace
        </h1>
        <p className="text-xs sm:text-sm text-[#73756F] mt-0.5">
          Configure business details, timezone, and your personal profile picture (PFP).
        </p>
      </div>

      {/* Profile & Avatar Card */}
      <div className="bg-white border border-[#E5E5E1] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E1]">
          <div className="flex items-center gap-2.5">
            <User size={18} className="text-[#222321]" />
            <h3 className="text-sm font-bold text-[#222321]">Your Profile & Avatar</h3>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onOpenProfileModal}
            className="text-xs font-semibold"
          >
            <Camera size={13} className="mr-1.5" />
            <span>Customize PFP</span>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5">
          <Avatar
            name={currentUser?.name || 'User'}
            initials={currentUser?.initials}
            avatarUrl={currentUser?.avatar_url}
            color={currentUser?.avatar_color}
            size="xl"
            className="ring-4 ring-[#E8EB39]/40 shadow-sm"
          />

          <div className="space-y-1 text-center sm:text-left flex-1">
            <h4 className="text-base font-bold text-[#222321]">{currentUser?.name}</h4>
            <p className="text-xs text-[#73756F]">{currentUser?.email || 'user@printworks.studio'}</p>
            <div className="flex items-center gap-2 justify-center sm:justify-start pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#E8EB39] text-[#222321] rounded-md">
                {currentUser?.role}
              </span>
              <span className="text-xs text-[#73756F]">
                {currentUser?.department || 'Workspace Member'}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenAuthModal}
            className="text-xs"
          >
            <span>Switch / Sign In</span>
          </Button>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Workspace Profile */}
        <div className="bg-white border border-[#E5E5E1] rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5E5E1]">
            <Building2 size={18} className="text-[#222321]" />
            <h3 className="text-sm font-bold text-[#222321]">Business Profile</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#73756F] uppercase tracking-wider mb-1.5">
                Business Name
              </label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-[#F5F5F1] border border-[#E5E5E1] rounded-xl text-[#222321] focus:outline-none focus:bg-white focus:border-[#222321]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#73756F] uppercase tracking-wider mb-1.5">
                Category
              </label>
              <input
                type="text"
                disabled
                value={business?.category || 'Printing and design'}
                className="w-full px-3.5 py-2 text-xs bg-[#F5F5F1] border border-[#E5E5E1] rounded-xl text-[#73756F] cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#73756F] uppercase tracking-wider mb-1.5">
              Operating Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-[#F5F5F1] border border-[#E5E5E1] rounded-xl text-[#222321] focus:outline-none focus:bg-white focus:border-[#222321]"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+05:30) [Authoritative]</option>
              <option value="America/New_York">America/New_York (EST - UTC-05:00)</option>
              <option value="Europe/London">Europe/London (GMT - UTC+00:00)</option>
              <option value="Asia/Singapore">Asia/Singapore (SGT - UTC+08:00)</option>
            </select>
            <p className="text-[11px] text-[#73756F] mt-1">
              Used for server-side evaluation of overdue, due-today, and workload windows.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleReset}
            className="text-xs"
          >
            <RotateCcw size={14} className="mr-1.5" />
            <span>Reset Demo Seed Data</span>
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="rounded-full px-6 font-semibold"
          >
            {isSaved ? (
              <>
                <Check size={16} className="mr-1.5" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save preferences</span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
