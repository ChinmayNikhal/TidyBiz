import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Employee, EmployeeRole } from '../../types/api';
import { PFP_PRESETS } from '../../lib/pfpPresets';
import { Upload, Camera, Check, Mail, User, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Employee | null;
  onSaveProfile: (updates: {
    name?: string;
    email?: string;
    avatar_url?: string;
    department?: string;
  }) => Promise<void>;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveProfile,
}) => {
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [pfpUrl, setPfpUrl] = useState<string>(currentUser?.avatar_url || PFP_PRESETS[0].url);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state if currentUser changes
  React.useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email || `${currentUser.name.toLowerCase().replace(/\s+/g, '.')}@printworks.studio`);
      setDepartment(currentUser.department || '');
      setPfpUrl(currentUser.avatar_url || PFP_PRESETS[0].url);
    }
  }, [currentUser]);

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be under 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPfpUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSaveProfile({
        name: name.trim(),
        email: email.trim(),
        department: department.trim() || undefined,
        avatar_url: pfpUrl,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile & Picture"
      description="Update your contact information and customize your profile photo (pfp)."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* PFP Photo Section */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-[#F5F5F1] border border-[#E5E5E1]">
          <div className="relative group">
            <Avatar
              name={name || 'User'}
              avatarUrl={pfpUrl}
              size="xl"
              className="ring-4 ring-white shadow-md"
            />
            <label
              htmlFor="pfp-upload-file"
              className="absolute bottom-0 right-0 p-1.5 bg-[#222321] text-white rounded-full hover:bg-black transition-colors cursor-pointer shadow-sm"
              title="Upload new photo"
            >
              <Camera size={13} />
              <input
                id="pfp-upload-file"
                type="file"
                accept="image/*"
                onChange={handleCustomUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <p className="text-xs font-semibold text-[#222321]">Profile Picture (PFP)</p>
            <p className="text-[11px] text-[#73756F]">
              Select a preset avatar or upload your own JPEG, PNG or WebP photo.
            </p>

            {/* Presets Grid */}
            <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap pt-1">
              {PFP_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setPfpUrl(preset.url)}
                  title={preset.name}
                  className={cn(
                    'w-7 h-7 rounded-full overflow-hidden border transition-all cursor-pointer',
                    pfpUrl === preset.url
                      ? 'ring-2 ring-[#222321] scale-105'
                      : 'border-[#E5E5E1] opacity-70 hover:opacity-100'
                  )}
                >
                  <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Inputs matching Ref 1 top-right settings design */}
        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#73756F] uppercase tracking-wider mb-1">
              Full Name
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#73756F]" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Type your name here..."
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#F5F5F1] border border-[#E5E5E1] rounded-xl text-[#222321] focus:outline-none focus:bg-white focus:border-[#222321]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#73756F] uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#73756F]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@printworks.studio"
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#F5F5F1] border border-[#E5E5E1] rounded-xl text-[#222321] focus:outline-none focus:bg-white focus:border-[#222321]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#73756F] uppercase tracking-wider mb-1">
              Department / Team
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Design, Operations, Management"
              className="w-full px-3.5 py-2 text-xs bg-[#F5F5F1] border border-[#E5E5E1] rounded-xl text-[#222321] focus:outline-none focus:bg-white focus:border-[#222321]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[#E5E5E1] flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>

          {/* Yellow Save Button matching Ref 1 */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            className="rounded-full px-5 font-bold text-xs"
          >
            <Check size={14} className="mr-1 stroke-[2.5]" />
            <span>Save changes</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
