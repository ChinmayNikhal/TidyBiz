import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  initials?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  avatarUrl?: string | null;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  initials,
  size = 'md',
  color,
  avatarUrl,
  className,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);

  const displayInitials =
    initials ||
    name
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ||
    'U';

  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm font-semibold',
    xl: 'w-16 h-16 text-lg font-bold',
  };

  const defaultBg = color || '#222321';
  const defaultText = '#FFFFFF';

  if (avatarUrl && !imageError) {
    return (
      <div
        title={name}
        className={cn(
          'rounded-full overflow-hidden shrink-0 border border-[#E5E5E1] shadow-2xs relative select-none bg-[#F5F5F1]',
          sizes[size],
          className
        )}
        {...props}
      >
        <img
          src={avatarUrl}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      title={name}
      className={cn(
        'rounded-full flex items-center justify-center font-medium select-none shrink-0 border border-white/20 shadow-2xs',
        sizes[size],
        className
      )}
      style={{ backgroundColor: defaultBg, color: defaultText }}
      {...props}
    >
      {displayInitials}
    </div>
  );
};
