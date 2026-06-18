import React from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { AdminSidebar } from './AdminSidebar';
import { useAuth } from './FirebaseProvider';
import { AuthModal } from './AuthModal';
import { SupportChatbot } from './SupportChatbot';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { isAdmin: isUserAdmin } = useAuth();
  const isAdminPath = location.pathname.startsWith('/admin');

  if (isAdminPath) {
    return (
      <div className="flex bg-background min-h-screen relative overflow-x-hidden text-primary selection:bg-brand-red selection:text-white">
        {isUserAdmin && <AdminSidebar />}
        <main className="flex-grow min-w-0">
          {children}
        </main>
        <AuthModal />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen relative overflow-x-hidden">
      <Navbar />
      <div className="flex flex-grow w-full relative">
        <main className="flex-grow min-w-0 pt-16 lg:pt-0">
          {children}
        </main>
      </div>
      <Footer />
      <AuthModal />

      {/* Modern Interactive Customer Support Chatbot Widget */}
      <SupportChatbot />
    </div>
  );
};
