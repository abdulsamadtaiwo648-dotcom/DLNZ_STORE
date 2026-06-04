import React from 'react';
import { cn } from '../lib/utils';
import { FlareIcon } from './Icons';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className, size = 'md' }) => {
  const sizes = {
    sm: {
      title: 'text-2xl',
      subtitle: 'text-[6px]',
      gap: 'gap-0.5',
      icon: 'w-2 h-2',
      divider: 'w-12'
    },
    md: {
      title: 'text-4xl',
      subtitle: 'text-[8px]',
      gap: 'gap-1',
      icon: 'w-3 h-3',
      divider: 'w-24'
    },
    lg: {
      title: 'text-6xl md:text-8xl',
      subtitle: 'text-[10px] md:text-[12px]',
      gap: 'gap-2',
      icon: 'w-4 h-4',
      divider: 'w-32 md:w-48'
    }
  };

  const current = sizes[size];

  return (
    <div className={cn("flex flex-col items-center group", className)}>
      <h1 className={cn(
        "font-display font-black tracking-tighter official-logo-gold leading-none italic",
        current.title
      )}>
        DLNZ
      </h1>
      <div className={cn("flex flex-col items-center mt-1", current.gap)}>
        <span className={cn(
          "font-technical tracking-[0.4em] opacity-80 uppercase whitespace-nowrap text-on-surface",
          current.subtitle
        )}>
          Driven Lives. New Zone.
        </span>
        
        {/* Decorative Divider matching the logo image */}
        <div className="flex items-center gap-2 mt-1">
          <div className={cn("h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent", current.divider)} />
          <FlareIcon className={cn("text-brand-red opacity-80", current.icon)} />
          <div className={cn("h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent", current.divider)} />
        </div>
      </div>
    </div>
  );
};
