import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, LayoutDashboard, LogOut, UserCircle2, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleLogout = () => {
    logout();
    if (onClose) onClose();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path
    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-400/20'
    : 'text-slate-300 hover:bg-slate-800 hover:text-white';

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#1E3A8A] text-white dark:bg-[#090D1A] border-r border-blue-900/40 dark:border-slate-800 transition-colors duration-300">
      {/* Sidebar Header */}
      <div className="p-5 border-b border-blue-800/60 dark:border-slate-800/80 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-wide">Finance Collection</h1>
          <p className="text-xs text-slate-300 mt-0.5 truncate max-w-[170px]">{user?.fullName || 'Workspace'}</p>
        </div>
        
        {/* Mobile Close Button */}
        {onClose && (
          <button 
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-blue-800/50 dark:hover:bg-slate-850 text-slate-300 hover:text-white transition"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Sidebar Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto space-y-1">
        <Link 
          to="/dashboard" 
          onClick={handleLinkClick}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/dashboard')}`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-medium">Dashboard</span>
        </Link>

        {/* Added missing All Customers Link */}
        <Link 
          to="/customers" 
          onClick={handleLinkClick}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/customers')}`}
        >
          <Users className="w-5 h-5" />
          <span className="font-medium">All Customers</span>
        </Link>

        <Link 
          to="/profile" 
          onClick={handleLinkClick}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/profile')}`}
        >
          <UserCircle2 className="w-5 h-5" />
          <span className="font-medium">Profile</span>
        </Link>

        <div className="pt-4 mt-4 border-t border-blue-800/40 dark:border-slate-800/50">
          <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">Collection Days</p>
          <div className="space-y-0.5 mt-1">
            {days.map((day) => (
              <Link
                key={day}
                to={`/weekday/${day}`}
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${
                  location.pathname === `/weekday/${day}` 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4 opacity-80" />
                <span>{day}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="border-t border-blue-800/60 dark:border-slate-800/80 p-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-300 hover:bg-red-950/20 hover:text-red-300 hover:border-red-900/30 border border-transparent transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
