/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, FormEvent } from 'react';
import { User } from '../types';
import { LogIn, Sparkles, Mail, User as UserIcon, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

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

  const handleGoogleLogin = async () => {
    setError('');
    
    if (!supabase) {
      setError('Google Sign-In is not configured. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
        },
      });

      if (oauthError) {
        throw oauthError;
      }

      if (!data || !data.url) {
        throw new Error('No authorization URL returned from Supabase Auth');
      }

      // Open OAuth provider URL directly in popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const authWindow = window.open(
        data.url,
        'supabase_oauth_popup',
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=yes`
      );

      if (!authWindow) {
        setError('Popup blocked. Please allow popups for this site to complete sign-in.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setError(err.message || 'Failed to initiate Google Sign-In.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleOAuthMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const session = event.data.session;
        if (session && session.user) {
          const { user: oauthUser } = session;
          setIsLoading(true);
          try {
            const response = await fetch('/api/users/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: oauthUser.user_metadata?.full_name || oauthUser.user_metadata?.name || oauthUser.email?.split('@')[0],
                email: oauthUser.email,
                avatar: oauthUser.user_metadata?.avatar_url || oauthUser.user_metadata?.picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(oauthUser.email)}`
              })
            });

            if (response.ok) {
              const syncedUser = await response.json();
              localStorage.setItem('sb-access-token', session.access_token);
              localStorage.setItem('sb-refresh-token', session.refresh_token);
              onLogin(syncedUser);
            } else {
              setError('Failed to sync authenticated profile with server.');
            }
          } catch (err) {
            setError('Profile synchronization failed.');
          } finally {
            setIsLoading(false);
          }
        }
      } else if (event.data?.type === 'OAUTH_AUTH_FAILURE') {
        setError(event.data.error || 'Authentication aborted or failed.');
        setIsLoading(false);
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [onLogin]);

  // Prevent background scrolling when login modal is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-md bg-white md:rounded-2xl shadow-2xl border-0 md:border border-slate-200 flex flex-col overflow-y-auto">
        
        {/* Absolute X Close Button at the top-right */}
        {isClosable && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer z-10"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        )}

        {/* Decorative Top Accent */}
        <div className="h-2 bg-gradient-to-r from-teal-500 to-teal-700 w-full shrink-0" />

        {/* Modal Header */}
        <div className="p-6 md:p-8 text-center shrink-0">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-3 md:mb-4 bg-teal-50 text-teal-600 rounded-full">
            <LogIn size={24} />
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight font-display">Welcome to Jobview</h2>
          <p className="mt-1.5 md:mt-2 text-xs md:text-sm text-slate-500 max-w-sm mx-auto">
            Sign in to unlock verified hiring managers, contact details, and our community wall.
          </p>
        </div>

        {/* Modal Body */}
        <div className="px-6 md:px-8 pb-8 flex-1">
          
          {/* Google Sign-In Button */}
          <div className="mb-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold tracking-wide shadow-xs transition-all text-sm flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 font-display"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                    <g transform="matrix(1, 0, 0, 1, 0, 0)">
                      <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.56h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.48c0,-0.61 -0.05,-1.2 -0.15,-1.78Z" fill="#4285F4" />
                      <path d="M12,20.6c2.56,0 4.71,-0.85 6.28,-2.3l-3.3,-2.56c-0.91,0.61 -2.08,0.98 -2.98,0.98c-2.3,0 -4.25,-1.55 -4.94,-3.64H3.63v2.64c1.55,3.08 4.75,5.18 8.37,5.18Z" fill="#34A853" />
                      <path d="M7.06,13.08c-0.18,-0.54 -0.28,-1.11 -0.28,-1.7s0.1,-1.16 0.28,-1.7V7.04H3.63c-0.6,1.2 -0.94,2.56 -0.94,4c0,1.44 0.34,2.8 0.94,4l3.43,-2.66Z" fill="#FBBC05" />
                      <path d="M12,6.12c1.39,0 2.64,0.48 3.63,1.42l2.72,-2.72C16.71,3.22 14.56,2.4 12,2.4c-3.62,0 -6.82,2.1 -8.37,5.18l3.43,2.66c0.69,-2.09 2.64,-3.64 4.94,-3.64Z" fill="#EA4335" />
                    </g>
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-4 text-center">
            <span className="absolute inset-x-0 top-1/2 h-px bg-slate-100 -z-10" />
            <span className="bg-white px-3 text-xs text-slate-400 uppercase tracking-widest font-bold font-display">
              Or Enter Email Details
            </span>
          </div>

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
