/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Briefcase, Users, Shield } from 'lucide-react';
import { User } from '../types';

interface NavigationProps {
  currentTab: 'jobs' | 'community' | 'profile' | 'admin';
  onChangeTab: (tab: 'jobs' | 'community' | 'profile' | 'admin') => void;
  user: User | null;
}

export default function Navigation({ currentTab, onChangeTab, user }: NavigationProps) {
  const isAdmin = user && user.role === 'admin' && user.email.toLowerCase() === 'kokborokanimations@gmail.com';

  return (
    <div className="w-full max-w-md mx-auto px-4 mt-6">
      <div className="bg-slate-100 p-1 rounded-full flex flex-wrap items-center gap-1 border border-slate-200/50 shadow-xs">
        <button
          onClick={() => onChangeTab('jobs')}
          className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer font-display ${
            currentTab === 'jobs'
              ? 'bg-white text-teal-600 shadow-sm font-bold'
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
          }`}
        >
          <Briefcase size={13} className={currentTab === 'jobs' ? 'text-teal-600' : 'text-slate-400'} />
          <span>Jobs</span>
        </button>

        <button
          onClick={() => onChangeTab('community')}
          className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer font-display ${
            currentTab === 'community'
              ? 'bg-white text-teal-600 shadow-sm font-bold'
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
          }`}
        >
          <Users size={13} className={currentTab === 'community' ? 'text-teal-600' : 'text-slate-400'} />
          <span>Community</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => onChangeTab('admin')}
            className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer font-display ${
              currentTab === 'admin'
                ? 'bg-slate-900 text-teal-400 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
            }`}
          >
            <Shield size={13} className={currentTab === 'admin' ? 'text-teal-400' : 'text-slate-400'} />
            <span>Admin</span>
          </button>
        )}
      </div>
    </div>
  );
}
