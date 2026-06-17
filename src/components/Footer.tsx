import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import { Logo } from './Logo';
import { useAuth } from './FirebaseProvider';

export const Footer = () => {
  const location = useLocation();
  const { isAdmin: isUserAdmin } = useAuth();
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <footer className={`bg-surface-container-lowest border-t border-outline-variant/20 px-6 md:px-16 py-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-12 ${isAdminPath && isUserAdmin ? 'md:ml-80' : ''}`}>
      <div className="flex flex-col gap-6">
        <Logo size="sm" className="items-start" />
        <p className="font-technical-sm text-label-xs text-brand-silver opacity-60 max-w-sm">
          DRIVEN LIVES, NEW ZONE. IS A GLOBAL COLLECTIVE FOCUSED ON ARCHITECTURAL MINIMALISM AND THE EVOLUTION OF MODERN DESIGN.
        </p>
        <p className="font-technical-sm text-[10px] opacity-40 uppercase tracking-widest">
          © 2026 DRIVEN LIVES, NEW ZONE. ALL RIGHTS RESERVED.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-12 md:gap-24 font-technical-sm text-label-xs tracking-widest">
        <div className="flex flex-col gap-4">
          <span className="font-bold opacity-100 mb-2">NAVIGATE</span>
          <a href="https://instagram.com/dlnz_store01" target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity">INSTAGRAM (@dlnz_store01)</a>
          <a href="#" className="opacity-60 hover:opacity-100 transition-opacity">TIKTOK</a>
          <Link to="/about" className="opacity-60 hover:opacity-100 transition-opacity">ABOUT</Link>
        </div>
        <div className="flex flex-col gap-4">
          <span className="font-bold opacity-100 mb-2">SUPPORT</span>
          <a href="#" className="opacity-60 hover:opacity-100 transition-opacity">CONTACT</a>
          <Link to="/tracking" className="text-brand-red underline underline-offset-4 font-bold">TRACKING</Link>
        </div>
      </div>
    </footer>
  );
};
