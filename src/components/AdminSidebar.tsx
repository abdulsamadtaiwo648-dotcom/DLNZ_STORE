import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, History, Info, Sparkles, LogOut, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Logo } from './Logo';

import { useAuth } from './FirebaseProvider';

export const AdminSidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { label: 'Dashboard', href: '/admin', icon: Sparkles },
    { label: 'Inventory', href: '/admin/inventory', icon: LayoutGrid },
    { label: 'Orders', href: '/admin/orders', icon: History },
    { label: 'Analytics', href: '/admin/analytics', icon: Info },
  ];

  const SidebarContent = () => (
    <>
      <Link to="/" onClick={() => setIsOpen(false)}>
        <Logo size="sm" className="items-start" />
      </Link>
      
      <nav className="flex flex-col gap-2 mt-8 flex-grow">
        {links.map((link) => (
          <Link
            key={link.label}
            to={link.href}
            onClick={() => setIsOpen(false)}
            className={cn(
               "flex items-center gap-4 py-4 px-6 transition-all duration-300 group relative",
               location.pathname === link.href 
                 ? "text-primary font-bold bg-surface-container/50" 
                 : "text-on-surface-variant hover:bg-surface-variant/20 hover:text-on-surface"
            )}
          >
            {location.pathname === link.href && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-red" />}
            <link.icon className={cn("w-5 h-5", location.pathname === link.href ? "text-brand-red" : "text-on-surface-variant group-hover:text-primary")} />
            <span className="font-display text-lg uppercase tracking-tighter">{link.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-6">
        <div className="p-4 border border-outline-variant/30 flex items-center gap-4 bg-surface-container">
          {user?.photoURL ? (
            <img src={user.photoURL} className="w-8 h-8 rounded-full border border-outline/30" alt={user.displayName || ''} />
          ) : (
            <div className="w-8 h-8 bg-brand-charcoal rounded-full border border-outline/30 flex items-center justify-center font-technical text-brand-red text-xs">
               {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'A'}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-technical-sm text-[10px] uppercase font-bold truncate">{user?.displayName || user?.email?.split('@')[0] || 'Admin'}</p>
            <p className="text-[10px] opacity-40 uppercase tracking-widest scale-75 origin-left">Master</p>
          </div>
        </div>
        <button 
          onClick={() => logout()}
          className="flex items-center gap-3 font-technical-sm text-label-xs opacity-50 hover:opacity-100 hover:text-brand-red transition-all pl-2 uppercase tracking-widest"
        >
          <LogOut className="w-4 h-4" />
          LOG OUT
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Top Nav for Admin */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-surface-container-lowest border-b border-outline-variant/30 flex items-center justify-between px-6 z-50">
        <Logo size="sm" />
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-primary"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Mobile Sidebar Drawer */}
      <aside className={cn(
        "fixed left-0 top-0 h-full w-72 bg-surface-container-lowest/80 backdrop-blur-md border-r border-outline-variant/30 flex flex-col p-8 gap-10 z-[60] lg:hidden transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent />
      </aside>

      {/* Desktop Persistent Sidebar */}
      <aside className="h-screen sticky top-0 w-72 bg-surface-container-lowest/80 backdrop-blur-md border-r border-outline-variant/30 hidden lg:flex flex-col p-8 gap-10 z-40 shrink-0 overflow-y-auto scrollbar-hide">
        <SidebarContent />
      </aside>
    </>
  );
};

