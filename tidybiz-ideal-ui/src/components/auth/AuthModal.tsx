import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Employee, EmployeeRole } from '../../types/api';
import { PFP_PRESETS } from '../../lib/pfpPresets';
import { Mail, Lock, User, Building2, ArrowRight, CheckCircle2, Upload, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

export type AuthMode = 'login' | 'signup' | 'forgot_password';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  employees: Employee[];
  onLoginAsEmployee: (employee: Employee) => void;
  onSignup: (userData: {
    name: string;
    businessName: string;
    email: string;
    role: EmployeeRole;
    department?: string;
    avatar_url?: string;
  }) => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  employees,
  onLoginAsEmployee,
  onSignup,
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('PrintWorks Studio');
  const [role, setRole] = useState<EmployeeRole>('OWNER');
  const [selectedPfpUrl, setSelectedPfpUrl] = useState<string>(PFP_PRESETS[0].url);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Handle custom image upload for pfp
  const handlePfpFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image should be under 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedPfpUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Find matching employee by email or default to first
    const matched = employees.find(
      (emp) => emp.email?.toLowerCase() === email.toLowerCase()
    ) || employees[0];

    setTimeout(() => {
      setIsSubmitting(false);
      onLoginAsEmployee(matched);
      onClose();
    }, 400);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onSignup({
        name: name.trim(),
        businessName: businessName.trim() || 'PrintWorks Studio',
        email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@printworks.studio`,
        role,
        avatar_url: selectedPfpUrl,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(`Reset instructions sent to ${email || 'your email'}`);
    setTimeout(() => {
      setFeedbackMsg('');
      setMode('login');
    }, 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
    >
      <div className="space-y-6">
        {/* Mascot & Brand Header inspired by Reference 1 */}
        <div className="text-center pt-2">
          {/* Mascot Illustration SVG */}
          <div className="w-16 h-16 mx-auto mb-3 relative flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
              <circle cx="50" cy="50" r="38" fill="#E8EB39" />
              {/* Happy eyes */}
              <circle cx="40" cy="45" r="4.5" fill="#222321" />
              <circle cx="60" cy="45" r="4.5" fill="#222321" />
              {/* Big friendly smile */}
              <path
                d="M 38 56 Q 50 68 62 56"
                stroke="#222321"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              {/* Rosy cheeks */}
              <circle cx="34" cy="54" r="3" fill="#F43F5E" opacity="0.4" />
              <circle cx="66" cy="54" r="3" fill="#F43F5E" opacity="0.4" />
            </svg>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-[#222321]">
            {mode === 'login' && 'Sign in to TidyBiz'}
            {mode === 'signup' && 'Create your TidyBiz account'}
            {mode === 'forgot_password' && 'Reset your password'}
          </h2>
          <p className="text-xs text-[#73756F] mt-1">
            {mode === 'login' && 'Enter your credentials or choose a team member below.'}
            {mode === 'signup' && 'Set up your profile, choose your avatar, and join PrintWorks.'}
            {mode === 'forgot_password' && 'Enter your verified work email address.'}
          </p>
        </div>

        {/* Tab switch between Login and Signup */}
        {mode !== 'forgot_password' && (
          <div className="flex items-center p-1 bg-[#F5F5F1] rounded-xl border border-[#E5E5E1]">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={cn(
                'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all',
                mode === 'login'
                  ? 'bg-white text-[#222321] shadow-2xs'
                  : 'text-[#73756F] hover:text-[#222321]'
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={cn(
                'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all',
                mode === 'signup'
                  ? 'bg-white text-[#222321] shadow-2xs'
                  : 'text-[#73756F] hover:text-[#222321]'
              )}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Feedback alert */}
        {feedbackMsg && (
          <div className="p-3 bg-green-50 text-green-800 text-xs rounded-xl border border-green-200 flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#73756F] uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73756F]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="asha@printworks.studio"
                  className="w-full pl-10 pr-3.5 py-2 text-xs bg-[#F5F5F1] border border-[#E5E5E1] rounded-xl text-[#222321] focus:outline-none focus:bg-white focus:border-[#222321]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#73756F] uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setMode('forgot_password')}
                  className="text-xs text-[#73756F] hover:text-[#222321] underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73756F]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2 text-xs bg-[#F5F5F1] border border-[#E5E5E1] rounded-xl text-[#222321] focus:outline-none focus:bg-white focus:border-[#222321]"
                />
              </div>
            </div>

            {/* Signature Electric Yellow Action Button */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="w-full rounded-xl py-2.5 font-bold text-sm shadow-xs flex items-center justify-center gap-2"
            >
              <span>Continue</span>
              <ArrowRight size={16} />
            </Button>

            {/* Quick 1-Click Demo Logins */}
            <div className="pt-3 border-t border-[#E5E5E1]">
              <p className="text-[11px] font-semibold text-[#73756F] uppercase tracking-wider mb-2.5 text-center">
                Or quick switch to demo member:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {employees.slice(0, 4).map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => {
                      onLoginAsEmployee(emp);
                      onClose();
                    }}
                    className="flex items-center gap-2 p-2 rounded-xl border border-[#E5E5E1] bg-white hover:bg-[#F5F5F1] hover:border-[#222321] transition-all text-left group"
                  >
                    <Avatar
                      name={emp.name}
                      initials={emp.initials}
                      avatarUrl={emp.avatar_url}
                      color={emp.avatar_color}
                      size="xs"
                    />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-[#222321] group-hover:text-black truncate leading-tight">
                        {emp.name.split(' ')[0]}
                      </p>
                      <p className="text-[10px] text-[#73756F] truncate">
                        {emp.role}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}

        {/* SIGNUP FORM */}
        {mode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            {/* PFP (Profile Picture) Picker */}
            <div>
              <label className="block text-xs font-semibold text-[#73756F] uppercase tracking-wider mb-2">
                Choose Profile Picture (PFP)
              </label>

              <div className="flex items-center gap-4 p-3 bg-[#F5F5F1] rounded-2xl border border-[#E5E5E1]">
                <Avatar
                  name={name || 'New Member'}
                  avatarUrl={selectedPfpUrl}
                  size="lg"
                  className="ring-2 ring-[#E8EB39]"
                />

                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {PFP_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSelectedPfpUrl(preset.url)}
                        title={preset.name}
                        className={cn(
                          'w-7 h-7 rounded-full overflow-hidden border transition-all cursor-pointer',
                          selectedPfpUrl === preset.url
                            ? 'ring-2 ring-[#222321] border-[#222321]'
                            : 'border-[#E5E5E1] opacity-70 hover:opacity-100'
                        )}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>

                  <label className="inline-flex items-center gap-1.5 text-xs text-[#222321] font-semibold hover:underline cursor-pointer">
                    <Upload size={12} />
                    <span>Upload custom photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePfpFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#73756F] uppercase tracking-wider mb-1">
                  Your Name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#73756F]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Vikram Sharma"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#F5F5F1] border border-[#E5E5E1] rounded-xl text-[#222321] focus:outline-none focus:bg-white focus:border-[#222321]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#73756F] uppercase tracking-wider mb-1">
                  Business / Studio
                </label>
                <div className="relative">
                  <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#73756F]" />
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="PrintWorks Studio"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#F5F5F1] border border-[#E5E5E1] rounded-xl text-[#222321] focus:outline-none focus:bg-white focus:border-[#222321]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#73756F] uppercase tracking-wider mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@printworks.studio"
                  className="w-full px-3 py-2 text-xs bg-[#F5F5F1] border border-[#E5E5E1] rounded-xl text-[#222321] focus:outline-none focus:bg-white focus:border-[#222321]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#73756F] uppercase tracking-wider mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as EmployeeRole)}
                  className="w-full px-3 py-2 text-xs bg-[#F5F5F1] border border-[#E5E5E1] rounded-xl text-[#222321] focus:outline-none focus:bg-white"
                >
                  <option value="EMPLOYEE">Team Member</option>
                  <option value="MANAGER">Manager</option>
                  <option value="OWNER">Owner</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#73756F] uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a secure password"
                className="w-full px-3 py-2 text-xs bg-[#F5F5F1] border border-[#E5E5E1] rounded-xl text-[#222321] focus:outline-none focus:bg-white focus:border-[#222321]"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="w-full rounded-xl py-2.5 font-bold text-sm shadow-xs"
            >
              Create TidyBiz Account
            </Button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot_password' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#73756F] uppercase tracking-wider mb-1">
                Enter your registered email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@printworks.studio"
                className="w-full px-3.5 py-2 text-xs bg-[#F5F5F1] border border-[#E5E5E1] rounded-xl text-[#222321] focus:outline-none focus:bg-white focus:border-[#222321]"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full rounded-xl py-2.5 font-bold text-sm shadow-xs"
            >
              Send Reset Link
            </Button>

            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full text-center text-xs text-[#73756F] hover:text-[#222321] underline"
            >
              Back to Sign In
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
};
