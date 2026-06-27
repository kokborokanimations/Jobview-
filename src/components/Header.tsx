/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, AdminSettings } from '../types';
import { Briefcase, LogOut, User as UserIcon, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  settings: AdminSettings;
  onLogout: () => void;
  onLoginClick: () => void;
  onUpgradeClick?: () => void;
  onChangeTab?: (tab: 'jobs' | 'community' | 'profile' | 'admin') => void;
}

export default function Header({ user, settings, onLogout, onLoginClick, onUpgradeClick, onChangeTab }: HeaderProps) {
  const isAdmin = user && user.email.toLowerCase() === 'kokborokanimations@gmail.com';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
        
        {/* Brand Section */}
        <div className="flex items-center gap-3">
          {settings.logoUrl ? (
            <img 
              src={settings.logoUrl} 
              alt={settings.brandName} 
              className="w-10 h-10 object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 bg-teal-600 flex items-center justify-center text-white rounded-lg shadow-sm">
              <Briefcase size={20} className="stroke-[2.5]" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none font-display">
                {settings.brandName || 'Jobview'}
              </h1>
              {isAdmin && (
                <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-bold tracking-widest uppercase rounded">
                  Admin Mode
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-[180px] md:max-w-md">
              {settings.tagline || 'Premium Careers Portal'}
            </p>
          </div>
        </div>

        {/* User Profile / Action Section */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2.5">
              {user.subscriptionStatus !== 'Active' && !isAdmin && onUpgradeClick && (
                <button
                  onClick={onUpgradeClick}
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-full text-[10px] font-bold tracking-wider uppercase transition-all hover:scale-105 shadow-xs cursor-pointer flex items-center gap-1 shrink-0 font-display"
                >
                  <span>👑 Get Premium</span>
                </button>
              )}
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-gray-800 line-clamp-1">{user.name}</p>
                <p className="text-[10px] text-teal-600 font-bold uppercase tracking-widest font-display">
                  {user.subscriptionStatus === 'Active' ? '👑 Premium' : 'Free Trial'}
                </p>
              </div>

              <div className="relative group">
                <button className="flex items-center focus:outline-none cursor-pointer">
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.email}`}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-slate-200 hover:ring-teal-400 transition-all"
                    referrerPolicy="no-referrer"
                  />
                </button>
                
                {/* Micro Hover/Dropdown Card for Quick Switch & Logout */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 opacity-0 pointer-events-none group-focus-within:opacity-100 group-focus-within:pointer-events-auto group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
                  <div className="px-3 py-2 border-b border-gray-50">
                    <p className="text-xs font-bold text-gray-800 truncate">{user.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                  </div>
                  
                  {user.subscriptionStatus !== 'Active' && !isAdmin && (
                    <div className="px-3 py-1.5 bg-teal-50/50 m-1.5 rounded-lg text-[10px] text-teal-700 font-medium flex items-center gap-1 font-display">
                      <span>⚡ Trial Expires: {new Date(user.trialExpiryDate).toLocaleDateString()}</span>
                    </div>
                  )}

                  <div className="py-1 border-b border-gray-50 space-y-0.5">
                    <button
                      onClick={() => onChangeTab?.('profile')}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <UserIcon size={14} className="text-slate-500" />
                      My Profile
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => onChangeTab?.('admin')}
                        className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <ShieldAlert size={14} className="text-teal-600" />
                        Admin Panel
                      </button>
                    )}
                  </div>

                  <button
                    onClick={onLogout}
                    className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut size={14} />
                    Switch Account
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="px-5 py-2 border border-slate-200 hover:border-teal-600 text-slate-700 hover:text-teal-600 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 cursor-pointer shadow-xs bg-white font-display"
            >
              <UserIcon size={14} />
              Sign In
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
