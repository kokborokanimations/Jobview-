import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

export default function OneSignalPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 1. Check if user already dismissed the prompt recently
    const dismissedTime = localStorage.getItem('onesignal_prompt_dismissed');
    if (dismissedTime) {
      const dismissedDate = new Date(parseInt(dismissedTime, 10));
      const now = new Date();
      // Only ask again after 7 days
      const diffTime = Math.abs(now.getTime() - dismissedDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 7) {
        return;
      }
    }

    // 2. Check if browser notification permission is already granted
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        return;
      }
    }

    // 3. Wait for 4 seconds after page load before showing the prompt
    const timer = setTimeout(() => {
      // Confirm OneSignal is actually configured or check if window is available
      if (typeof window !== 'undefined') {
        setShowPrompt(true);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleSubscribe = async () => {
    if (typeof window !== 'undefined' && (window as any).OneSignal) {
      const OneSignal = (window as any).OneSignal;
      try {
        // v16 API: User.PushSubscription.optIn()
        if (OneSignal.User && OneSignal.User.PushSubscription && typeof OneSignal.User.PushSubscription.optIn === 'function') {
          await OneSignal.User.PushSubscription.optIn();
        } 
        // Legacy v15 API: showNativePrompt() or registerForPushNotifications()
        else if (typeof OneSignal.registerForPushNotifications === 'function') {
          await OneSignal.registerForPushNotifications();
        } else if (typeof OneSignal.showNativePrompt === 'function') {
          await OneSignal.showNativePrompt();
        } else {
          // Fallback if none are found but OneSignal object exists
          console.warn('[OneSignal] OptIn methods not found, trying push subscription optIn...');
          OneSignal.push(function() {
            if (OneSignal.showNativePrompt) {
              OneSignal.showNativePrompt();
            } else {
              Notification.requestPermission();
            }
          });
        }
      } catch (err) {
        console.error('[OneSignal Prompt Error]:', err);
      }
    } else {
      // Fallback: Trigger standard browser notification prompt
      if (typeof window !== 'undefined' && 'Notification' in window) {
        Notification.requestPermission();
      }
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('onesignal_prompt_dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[999] p-4 flex flex-col gap-3 animate-slide-up bg-linear-to-b from-white to-slate-50">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-teal-50 border border-teal-100 rounded-xl text-teal-600 animate-bounce">
            <Bell size={20} className="fill-teal-600/10" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider font-display">
              Job Alerts Direct Chahiye? 🔔
            </h4>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-tight mt-0.5 font-display">
              Never Miss a hiring update
            </p>
          </div>
        </div>
        <button 
          onClick={handleDismiss} 
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-1">
        <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
          Naye job alerts aur community postings direct apne mobile ya computer screen par instant receive karne ke liye notifications <strong>Subscribe</strong> karein!
        </p>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={handleDismiss}
          className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-all cursor-pointer text-center font-display uppercase tracking-wider"
        >
          Baad Mein
        </button>
        <button
          onClick={handleSubscribe}
          className="flex-1 py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-extrabold rounded-lg transition-all cursor-pointer text-center font-display uppercase tracking-wider shadow-sm shadow-teal-600/10"
        >
          Haan, Allow Karein 🔔
        </button>
      </div>
    </div>
  );
}
