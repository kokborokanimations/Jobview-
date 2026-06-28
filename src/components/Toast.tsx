/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'warning';
}

export default function Toast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [jobToast, setJobToast] = useState<{ active: boolean; message: string }>({ active: false, message: '' });

  useEffect(() => {
    let jobTimeout: NodeJS.Timeout | null = null;

    // Expose global function to trigger toast
    const handleSuccessTrigger = (event: CustomEvent<string>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newMessage: ToastMessage = {
        id,
        message: event.detail || 'Settings Saved Successfully!',
        type: 'success',
      };
      
      setToasts((prev) => [...prev, newMessage]);

      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };

    const handleWarningTrigger = (event: CustomEvent<string>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newMessage: ToastMessage = {
        id,
        message: event.detail || 'No changes detected',
        type: 'warning',
      };
      
      setToasts((prev) => [...prev, newMessage]);

      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };

    const handleJobSavedTrigger = (event: CustomEvent<string>) => {
      if (jobTimeout) clearTimeout(jobTimeout);
      setJobToast({
        active: true,
        message: event.detail || 'Job Saved!',
      });

      // Auto-dismiss after 1.8 seconds
      jobTimeout = setTimeout(() => {
        setJobToast({ active: false, message: '' });
      }, 1800);
    };

    // Attach to window object for pure JS trigger
    window.showSuccessToast = (message?: string) => {
      window.dispatchEvent(
        new CustomEvent('show-success-toast-notification', {
          detail: message || 'Settings Saved Successfully!',
        })
      );
    };

    window.showWarningToast = (message?: string) => {
      window.dispatchEvent(
        new CustomEvent('show-warning-toast-notification', {
          detail: message || 'No changes detected',
        })
      );
    };

    window.showJobSavedToast = (message?: string) => {
      window.dispatchEvent(
        new CustomEvent('show-job-saved-toast-notification', {
          detail: message || 'Job Saved!',
        })
      );
    };

    window.addEventListener('show-success-toast-notification' as any, handleSuccessTrigger);
    window.addEventListener('show-warning-toast-notification' as any, handleWarningTrigger);
    window.addEventListener('show-job-saved-toast-notification' as any, handleJobSavedTrigger);

    return () => {
      window.removeEventListener('show-success-toast-notification' as any, handleSuccessTrigger);
      window.removeEventListener('show-warning-toast-notification' as any, handleWarningTrigger);
      window.removeEventListener('show-job-saved-toast-notification' as any, handleJobSavedTrigger);
      if (jobTimeout) clearTimeout(jobTimeout);
      delete (window as any).showSuccessToast;
      delete (window as any).showWarningToast;
      delete (window as any).showJobSavedToast;
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      {/* 1. General Floating Toast Notifications (Responsive alignment) */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-5 z-[10000] flex flex-col gap-3 pointer-events-none w-[calc(100%-2.5rem)] max-w-sm">
        <AnimatePresence>
          {toasts.map((toast) => {
            const isSuccess = toast.type === 'success';
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }}
                layout
                className={`pointer-events-auto bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)] border rounded-2xl p-4 flex items-center justify-between gap-4 text-slate-800 dark:text-slate-100 relative overflow-hidden group ${
                  isSuccess 
                    ? 'border-emerald-500/10 dark:border-emerald-500/15' 
                    : 'border-amber-500/10 dark:border-amber-500/15'
                }`}
              >
                {/* Subtle side accent line instead of full blocky top bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isSuccess ? 'bg-emerald-500/90' : 'bg-amber-500/90'}`} />
                
                <div className="flex items-center gap-3.5 pl-1.5">
                  {isSuccess ? (
                    <div className="flex-shrink-0 w-8.5 h-8.5 rounded-xl bg-emerald-50/85 dark:bg-emerald-950/45 border border-emerald-100/60 dark:border-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <CheckCircle size={17} className="stroke-[2.5px]" />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-8.5 h-8.5 rounded-xl bg-amber-50/85 dark:bg-amber-950/45 border border-amber-100/60 dark:border-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <AlertTriangle size={16} className="stroke-[2.5px]" />
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[12.5px] font-bold font-sans tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                      {toast.message}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => removeToast(toast.id)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 rounded-xl transition-all cursor-pointer flex-shrink-0"
                >
                  <X size={14} className="stroke-[2.5]" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 2. Minimal Centered Job Saved Toast with Overlay/Blur */}
      <AnimatePresence>
        {jobToast.active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/15 dark:bg-black/25 backdrop-blur-[2.5px] pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: -10, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', damping: 22, stiffness: 320 }}
              className="w-[260px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl border border-emerald-500/10 dark:border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 text-center pointer-events-auto"
            >
              {/* Ultra Clean Compact Design */}
              <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm shadow-emerald-500/10">
                <CheckCircle size={20} className="stroke-[2.5px]" />
              </div>
              
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold font-sans tracking-tight text-slate-900 dark:text-slate-100">
                  {jobToast.message}
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">
                  Success
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Global declaration for TypeScript
declare global {
  interface Window {
    showSuccessToast?: (message?: string) => void;
    showWarningToast?: (message?: string) => void;
    showJobSavedToast?: (message?: string) => void;
  }
}
