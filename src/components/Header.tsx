/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { User, AdminSettings } from '../types';
import { Briefcase, LogOut, User as UserIcon, ShieldAlert, Settings, FileText } from 'lucide-react';
import { getUserBadge } from '../lib/badgeUtils';

interface HeaderProps {
  user: User | null;
  settings: AdminSettings;
  onLogout: () => void;
  onLoginClick: () => void;
  onUpgradeClick?: () => void;
  onChangeTab?: (tab: 'jobs' | 'community' | 'profile' | 'admin' | 'settings' | 'resume') => void;
}

export default function Header({ user, settings, onLogout, onLoginClick, onUpgradeClick, onChangeTab }: HeaderProps) {
  const isAdmin = user && user.role === 'admin' && user.email.toLowerCase() === 'kokborokanimations@gmail.com';
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        
        {/* Brand Section */}
        <div className="flex items-center gap-3">
          {settings.logoUrl && !logoError ? (
            <img 
              src={settings.logoUrl} 
              alt={settings.brandName} 
              className="w-10 h-10 object-contain rounded-lg"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const currentSrc = e.currentTarget.src;
                if (currentSrc.includes('/storage/v1/object/public/')) {
                  const parts = currentSrc.split('/');
                  const filename = parts[parts.length - 1];
                  e.currentTarget.src = `/uploads/${filename}`;
                } else {
                  setLogoError(true);
                }
              }}
            />
          ) : (
            <div className="w-10 h-10 bg-teal-600 flex items-center justify-center text-white rounded-lg shadow-sm">
              <Briefcase size={20} className="stroke-[2.5]" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none font-display">
                {settings.brandName}
              </h1>
              {isAdmin && (
                <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-bold tracking-widest uppercase rounded">
                  Admin Mode
                </span>
              )}
            </div>
            {settings.tagline && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-[180px] md:max-w-md">
                {settings.tagline}
              </p>
            )}
          </div>
        </div>

        {/* User Profile / Action Section */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2.5">
              {getUserBadge(user, settings) === 'EXPIRED' && !isAdmin && settings.premiumMode && onUpgradeClick && (
                <button
                  onClick={onUpgradeClick}
                  title="Get Premium"
                  aria-label="Get Premium"
                  className="w-8 h-8 flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white rounded-full transition-all hover:scale-110 shadow-xs cursor-pointer shrink-0 text-sm relative group/btn"
                >
                  <span>👑</span>
                  {/* Modern micro-tooltip */}
                  <span className="absolute top-10 right-0 scale-0 group-hover/btn:scale-100 transition-all origin-top-right duration-150 bg-slate-950 text-white text-[9px] font-extrabold tracking-widest uppercase px-2 py-1 rounded-lg shadow-lg pointer-events-none whitespace-nowrap z-50 border border-slate-800">
                    Get Premium
                  </span>
                </button>
              )}
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-gray-800 line-clamp-1">{user.name}</p>
                {settings.premiumMode && (
                  <p className="text-[10px] font-bold uppercase tracking-widest font-display mt-0.5">
                    {getUserBadge(user, settings) === 'PREMIUM' && (
                      <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/50">👑 Premium</span>
                    )}
                    {getUserBadge(user, settings) === 'TRIAL' && (
                      <span className="text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-md border border-teal-200/50">🌱 Trial</span>
                    )}
                    {getUserBadge(user, settings) === 'EXPIRED' && (
                      <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200/50">🛑 Expired</span>
                    )}
                  </p>
                )}
              </div>

              <div className="relative group">
                <button className="flex items-center focus:outline-none cursor-pointer transition-transform hover:scale-105">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 p-0.5 shadow-xs group-hover:border-teal-500 transition-all flex items-center justify-center overflow-hidden">
                    <img
                      src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.email || user.name || 'user')}`}
                      alt={user.name}
                      className="w-full h-full rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </button>
                
                {/* Micro Hover/Dropdown Card for Quick Switch & Logout */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 opacity-0 pointer-events-none group-focus-within:opacity-100 group-focus-within:pointer-events-auto group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
                  <div className="px-3 py-2 border-b border-gray-50">
                    <p className="text-xs font-bold text-gray-800 truncate">{user.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                  </div>
                  
                  {!isAdmin && settings.premiumMode && getUserBadge(user, settings) === 'TRIAL' && (
                    <div className="px-3 py-1.5 bg-teal-50/50 m-1.5 rounded-lg text-[10px] text-teal-700 font-medium flex items-center gap-1 font-display">
                      <span>⚡ Trial Expires: {new Date(user.trialExpiryDate).toLocaleDateString()}</span>
                    </div>
                  )}

                  {!isAdmin && settings.premiumMode && getUserBadge(user, settings) === 'EXPIRED' && (
                    <div className="px-3 py-1.5 bg-rose-50/50 m-1.5 rounded-lg text-[10px] text-rose-700 font-medium flex items-center gap-1 font-display">
                      <span>🛑 Trial Expired</span>
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

                    <button
                      onClick={() => onChangeTab?.('resume')}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <FileText size={14} className="text-slate-500" />
                      Resume
                    </button>

                    <button
                      onClick={() => onChangeTab?.('settings')}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Settings size={14} className="text-slate-500" />
                      Settings
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
