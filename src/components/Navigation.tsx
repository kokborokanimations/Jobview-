/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Briefcase, Users, Shield } from 'lucide-react';
import { User } from '../types';
import { motion } from 'motion/react';

interface NavigationProps {
  currentTab: 'jobs' | 'community' | 'profile' | 'admin' | 'settings' | 'resume';
  onChangeTab: (tab: 'jobs' | 'community' | 'profile' | 'admin' | 'settings' | 'resume') => void;
  user: User | null;
}

export default function Navigation({ currentTab, onChangeTab, user }: NavigationProps) {
  const isAdmin = user && user.role === 'admin' && user.email.toLowerCase() === 'kokborokanimations@gmail.com';

  const tabs: { id: 'jobs' | 'community' | 'resume' | 'admin'; label: string; icon: any }[] = [
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'community', label: 'Community', icon: Users },
  ];

  if (isAdmin) {
    tabs.push({ id: 'admin', label: 'Admin', icon: Shield });
  }

  return (
    <div id="bottom-navigation-container" className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200/60 dark:border-slate-800/60 shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
      <div className="max-w-md mx-auto px-6 py-3.5 flex items-center justify-around gap-4">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              id={`nav-tab-${tab.id}`}
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className="flex-1 relative py-2.5 px-4 rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer focus:outline-none select-none"
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab-highlight"
                  className="absolute inset-0 bg-teal-50 dark:bg-teal-950/40 rounded-full border border-teal-100/40 dark:border-teal-900/30 -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              
              <Icon 
                size={16} 
                className={`transition-colors duration-200 z-10 ${
                  isActive ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-slate-400 dark:text-slate-500'
                }`} 
              />
              <span 
                className={`text-xs font-semibold tracking-wide transition-colors duration-200 font-display z-10 ${
                  isActive 
                    ? 'text-teal-600 dark:text-teal-400 font-bold' 
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}



