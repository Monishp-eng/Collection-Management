import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  // Get user initials for avatar
  const getInitials = (name = 'U') => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] overflow-hidden transition-colors duration-300">
      {/* 1. Desktop Sidebar (Permanent left panel for screen widths >= lg) */}
      <div className="hidden lg:block w-64 h-full flex-shrink-0">
        <Sidebar />
      </div>

      {/* 2. Mobile Sidebar Drawer (Slide-out menu for screen widths < lg) */}
      {/* Backdrop overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Slide-out Sidebar Panel */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-sidebar z-50 lg:hidden transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* 3. Main Workspace Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121826] px-4 md:px-6 flex items-center justify-between flex-shrink-0 transition-colors duration-300 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-3">
            {/* Hamburger menu button for mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Mobile Header Title */}
            <span className="lg:hidden font-bold text-slate-800 dark:text-white tracking-wide">
              Finance Collection
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <ThemeToggle className="text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition" />
            
            {/* User Profile initials avatar badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-blue-500/10">
                {getInitials(user?.fullName)}
              </div>
              <span className="hidden md:inline text-xs font-semibold text-slate-700 dark:text-slate-300">
                {user?.fullName || 'Administrator'}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Content Pane */}
        <main className="flex-1 overflow-auto bg-[#F8FAFC] dark:bg-[#0B0F19] transition-colors duration-300 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
