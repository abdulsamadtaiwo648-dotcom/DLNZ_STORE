import React from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { AdminSidebar } from './AdminSidebar';
import { useAuth } from './FirebaseProvider';
import { AuthModal } from './AuthModal';
import { MessageSquare } from 'lucide-react';
import { WHATSAPP_LINK } from '../constants';

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

      {/* Floating WhatsApp Support */}
      <a 
        href={WHATSAPP_LINK('Hello DLNZ, I have a question regarding my order/collection.')}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-8 right-8 z-50 bg-brand-red text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all group border border-white/20"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="absolute right-full mr-4 bg-black/80 backdrop-blur-md px-4 py-2 text-[10px] font-technical-sm tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 pointer-events-none">
          WHATSAPP SUPPORT
        </span>
      </a>
    </div>
  );
};
