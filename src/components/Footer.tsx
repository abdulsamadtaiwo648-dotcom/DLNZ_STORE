import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Instagram, Info, Mail, Truck } from 'lucide-react';

import { Logo } from './Logo';
import { useAuth } from './FirebaseProvider';
import { useTheme } from './ThemeContext';
import { cn } from '../lib/utils';

const TiktokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    viewBox="0 0 24 24" 
    width="16" 
    height="16" 
    stroke="currentColor" 
    strokeWidth="2" 
    fill="none" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={props.className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

export const Footer = () => {
  const location = useLocation();
  const { theme } = useTheme();
  const { isAdmin: isUserAdmin } = useAuth();
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <footer 
      className={cn(
        "border-t px-6 md:px-16 py-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-12 transition-colors duration-300",
        theme === 'light' 
          ? "bg-[#F5F3F0] border-outline-variant/20 text-[#111111]" 
          : "bg-black border-outline-variant/20 text-[#FCFAF7]",
        isAdminPath && isUserAdmin ? 'md:ml-80' : ''
      )}
    >
      <div className="flex flex-col gap-6">
        <Logo size="sm" className="items-start" />
        <p className={cn(
          "font-technical-sm text-label-xs max-w-sm leading-relaxed",
          theme === 'light' ? "text-black font-semibold" : "text-brand-silver opacity-85"
        )}>
          DRIVEN LIVES, NEW ZONE. IS A GLOBAL COLLECTIVE FOCUSED ON ARCHITECTURAL MINIMALISM AND THE EVOLUTION OF MODERN DESIGN.
        </p>
        <p className={cn(
          "font-technical-sm text-[10px] uppercase tracking-widest",
          theme === 'light' ? "text-black/60 font-medium" : "opacity-50"
        )}>
          © 2026 DRIVEN LIVES, NEW ZONE. ALL RIGHTS RESERVED.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-12 md:gap-24 font-technical-sm text-label-xs tracking-widest">
        <div className="flex flex-col gap-4">
          <span className={cn("font-bold mb-2", theme === 'light' ? "text-black" : "opacity-100")}>SOCIAL MEDIA</span>
          <a 
            href="https://instagram.com/dlnz_store01" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={cn("flex items-center gap-2.5 transition-all group", theme === 'light' ? "text-black/85 hover:text-brand-red font-medium" : "opacity-70 hover:opacity-100 hover:text-brand-red")}
          >
            <Instagram className="w-4 h-4 text-brand-red group-hover:scale-110 transition-all" />
            <span>INSTAGRAM (@dlnz_store01)</span>
          </a>
          <a 
            href="#" 
            className={cn("flex items-center gap-2.5 transition-all group", theme === 'light' ? "text-black/85 hover:text-brand-red font-medium" : "opacity-70 hover:opacity-100 hover:text-brand-red")}
          >
            <TiktokIcon className="w-4 h-4 text-brand-red group-hover:scale-110 transition-all" />
            <span>TIKTOK</span>
          </a>
        </div>
        <div className="flex flex-col gap-4">
          <span className={cn("font-bold mb-2", theme === 'light' ? "text-black" : "opacity-100")}>DIRECTORY</span>
          <Link 
            to="/about" 
            className={cn("flex items-center gap-2.5 transition-all group", theme === 'light' ? "text-black/85 hover:text-brand-red font-medium" : "opacity-70 hover:opacity-100 hover:text-brand-red")}
          >
            <Info className="w-4 h-4 text-brand-red group-hover:scale-110 transition-all" />
            <span>ABOUT</span>
          </Link>
          <a 
            href="#" 
            className={cn("flex items-center gap-2.5 transition-all group", theme === 'light' ? "text-black/85 hover:text-brand-red font-medium" : "opacity-70 hover:opacity-100 hover:text-brand-red")}
          >
            <Mail className="w-4 h-4 text-brand-red group-hover:scale-110 transition-all" />
            <span>CONTACT</span>
          </a>
          <Link 
            to="/tracking" 
            className={cn("flex items-center gap-2.5 transition-all group text-brand-red underline underline-offset-4 font-bold hover:brightness-110")}
          >
            <Truck className="w-4 h-4 group-hover:translate-x-0.5 transition-all" />
            <span>TRACKING</span>
          </Link>
        </div>
      </div>
    </footer>
  );
};
