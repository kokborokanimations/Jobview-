/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, FormEvent } from 'react';
import { User } from '../types';
import { LogIn, Sparkles, Mail, User as UserIcon } from 'lucide-react';

interface LoginModalProps {
  onLogin: (user: User) => void;
  onClose?: () => void;
  isClosable?: boolean;
}

export default function LoginModal({ onLogin, onClose, isClosable = false }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDemoLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide an email address.');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || email.split('@')[0],
          email: email.trim().toLowerCase(),
          avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email)}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to synchronize user session with server');
      }

      const syncedUser = await response.json();
      onLogin(syncedUser);
    } catch (err: any) {
      console.error(err);
      setError('Connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsAdmin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Developer Admin',
          email: 'kokborokanimations@gmail.com',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop'
        })
      });

      if (response.ok) {
        const syncedUser = await response.json();
        onLogin(syncedUser);
      } else {
        throw new Error('Failed to login');
      }
    } catch (err) {
      setError('Could not complete admin fast-login.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsUser = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Amit Kumar',
          email: 'amit.kumar@example.com',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop'
        })
      });

      if (response.ok) {
        const syncedUser = await response.json();
        onLogin(syncedUser);
      } else {
        throw new Error('Failed to login');
      }
    } catch (err) {
      setError('Could not complete user fast-login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden bg-white rounded-2xl shadow-2xl border border-slate-200">
        
        {/* Decorative Top Accent */}
        <div className="h-2 bg-gradient-to-r from-teal-500 to-teal-700 w-full" />

        {/* Modal Header */}
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-4 bg-teal-50 text-teal-600 rounded-full">
            <LogIn size={24} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">Welcome to Jobview</h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to unlock verified hiring managers, contact details, and our community wall.
          </p>
        </div>

        {/* Modal Body */}
        <div className="px-8 pb-8">
          <form onSubmit={handleDemoLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-1 font-display">
                Your Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <UserIcon size={18} />
                </span>
                <input
                  type="text"
                  placeholder="John Doe (Optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm text-slate-900 font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-1 font-display">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm text-slate-900 font-sans"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs font-medium text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold tracking-wide shadow-md hover:shadow-lg hover:shadow-teal-600/10 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 font-display"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Continue with Email</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <span className="absolute inset-x-0 top-1/2 h-px bg-slate-100 -z-10" />
            <span className="bg-white px-3 text-xs text-slate-400 uppercase tracking-widest font-bold font-display">
              Or Fast-Pass Login
            </span>
          </div>

          {/* Fast-Pass Options */}
          <div className="grid grid-cols-2 gap-3 font-display">
            <button
              onClick={loginAsAdmin}
              disabled={isLoading}
              className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-950 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              👑 Admin Demo
            </button>
            <button
              onClick={loginAsUser}
              disabled={isLoading}
              className="px-4 py-2.5 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 hover:text-teal-950 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              👤 Candidate Demo
            </button>
          </div>

          {isClosable && onClose && (
            <button
              onClick={onClose}
              className="mt-6 w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer font-display"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
