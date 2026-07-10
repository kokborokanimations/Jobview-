/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Job, CommunityPost, User, AdminSettings } from './types';
import Header from './components/Header';
import Navigation from './components/Navigation';
import JobFeed from './components/JobFeed';
import JobDetails from './components/JobDetails';
import CommunityFeed from './components/CommunityFeed';
import Paywall from './components/Paywall';
import AdminPanel from './components/AdminPanel';
import LoginModal from './components/LoginModal';
import UserProfile from './components/UserProfile';
import ResumeBuilder from './components/ResumeBuilder';
import { X, Settings, LogOut, FileText, ChevronRight } from 'lucide-react';
import { getUserBadge } from './lib/badgeUtils';
import Toast from './components/Toast';
import { ContactForm } from './components/ContactForm';

export default function App() {
  // Global States
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<AdminSettings>(() => {
    const defaults = {
      brandName: '',
      tagline: '',
      logoUrl: '',
      bannerUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop',
      premiumMode: true,
      membershipPrice: 499,
      currency: 'INR',
      paywallFeatures: [
        'Unlimited Premium Job Applications',
        'Access Live HR/Recruiter Contact Details',
        'Post in Community Feed with Image Uploads',
        'Direct WhatsApp Chat with Hiring Managers'
      ],
      cashfreeAppId: '',
      cashfreeSecretKey: ''
    };
    if (typeof window !== 'undefined' && (window as any).__INITIAL_SETTINGS__) {
      return { ...defaults, ...(window as any).__INITIAL_SETTINGS__ };
    }
    return defaults;
  });

  const [jobs, setJobs] = useState<Job[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [footerPages, setFooterPages] = useState<any[]>([]);
  const [activeFooterPage, setActiveFooterPage] = useState<any | null>(null);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Synchronized bookmark states
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('sebok_bookmarked_posts') || localStorage.getItem('jobview_bookmarked_posts');
    return saved ? JSON.parse(saved) : [];
  });

  const handleToggleBookmark = async (postId: string) => {
    let updated: string[];
    const isBookmarked = bookmarkedPostIds.includes(postId);
    if (isBookmarked) {
      updated = bookmarkedPostIds.filter(id => id !== postId);
    } else {
      updated = [...bookmarkedPostIds, postId];
      window.showJobSavedToast?.('Post Saved!');
    }
    setBookmarkedPostIds(updated);
    localStorage.setItem('sebok_bookmarked_posts', JSON.stringify(updated));

    // Async update to Supabase (if user is logged in)
    if (user) {
      try {
        const { toggleSavedPostInSupabase } = await import('./lib/supabaseQueries');
        await toggleSavedPostInSupabase(user.id, postId, isBookmarked);
      } catch (err) {
        console.error('Error toggling saved post in Supabase from App.tsx:', err);
      }
    }

    // Optional: Call background API to save bookmark count
    fetch(`/api/posts/${postId}/bookmark`, { method: 'POST' }).catch(console.error);
  };
  
  // Navigation
  const [currentTab, setCurrentTab] = useState<'jobs' | 'community' | 'admin' | 'profile' | 'settings' | 'resume'>('jobs');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Paywall dismissal state
  const [dismissedPaywall, setDismissedPaywall] = useState(false);
  const [forceShowPaywall, setForceShowPaywall] = useState(false);
  const [showPaywallPopup, setShowPaywallPopup] = useState(false);

  const fetchFooterPages = async () => {
    try {
      const res = await fetch('/api/pages');
      if (res.ok) {
        const data = await res.json();
        setFooterPages(data);
      }
    } catch (e) {
      console.error('Error fetching pages', e);
    }
  };

  // Global listener for Supabase OAuth sign-ins (especially for redirects or popups with lost opener)
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    async function checkSupabaseSession() {
      try {
        const { getSupabaseClient, isCustomSupabaseConfigured } = await import('./lib/supabase');
        if (!isCustomSupabaseConfigured()) return;
        const client = getSupabaseClient();
        if (!client) return;

        // Helper to sync user session back to Express database
        const syncSupabaseUser = async (sUser: any) => {
          try {
            const res = await fetch('/api/users/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: sUser.user_metadata?.full_name || sUser.user_metadata?.name || sUser.email?.split('@')[0],
                email: sUser.email,
                avatar: sUser.user_metadata?.avatar_url || sUser.user_metadata?.picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(sUser.email || '')}`
              })
            });
            if (res.ok) {
              const syncedUser = await res.json();
              handleLogin(syncedUser);
              if (window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('error'))) {
                window.history.replaceState(null, '', window.location.pathname);
              }
            }
          } catch (syncErr) {
            console.error('Error syncing Supabase user to server:', syncErr);
          }
        };

        // 1. Check current session immediately (if any)
        const { data: { session } } = await client.auth.getSession();
        if (session && session.user) {
          await syncSupabaseUser(session.user);
        }

        // 2. Listen to state changes
        const { data: { subscription } } = client.auth.onAuthStateChange(async (event: string, session: any) => {
          if (session && session.user) {
            await syncSupabaseUser(session.user);
          }
        });

        unsubscribe = () => {
          subscription?.unsubscribe();
        };
      } catch (err) {
        console.error('Error setting up global Supabase listener:', err);
      }
    }

    checkSupabaseSession();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Load Initial Data
  useEffect(() => {
    fetchInitialData();
    
    // Track site visit count in Supabase analytics
    import('./lib/supabaseQueries')
      .then(({ incrementVisitCount }) => incrementVisitCount())
      .catch(err => console.error('Error auto-incrementing visitor count:', err));
  }, []);

  // Update browser document title and favicon dynamically when settings change
  useEffect(() => {
    if (settings) {
      const brand = settings.brandName || 'Sebok';
      const tagline = settings.tagline || '';
      document.title = tagline ? `${brand} - ${tagline}` : brand;

      if (settings.faviconUrl) {
        let linkTag: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
        if (!linkTag) {
          linkTag = document.createElement('link');
          linkTag.rel = 'icon';
          document.head.appendChild(linkTag);
        }
        linkTag.href = settings.faviconUrl;
      }
    }
  }, [settings]);

  // Sync bookmarks from Supabase on login/user state change
  useEffect(() => {
    if (user && posts.length > 0) {
      import('./lib/supabaseQueries')
        .then(({ fetchSavedPostsFromSupabase }) => {
          return fetchSavedPostsFromSupabase(user.id, posts);
        })
        .then((savedPosts) => {
          if (savedPosts && savedPosts.length > 0) {
            const savedIds = savedPosts.map(p => p.id);
            setBookmarkedPostIds(savedIds);
            localStorage.setItem('sebok_bookmarked_posts', JSON.stringify(savedIds));
          }
        })
        .catch(err => console.error('Error syncing bookmarks on user load:', err));
    }
  }, [user, posts]);

  // URL routing for Custom dynamic pages on load
  useEffect(() => {
    if (footerPages.length > 0 && !initialCheckDone) {
      const path = window.location.pathname.replace(/^\/p\//, '/').replace(/^\//, '').toLowerCase();
      const found = footerPages.find(p => p.slug.toLowerCase() === path);
      if (found) {
        setActiveFooterPage(found);
      }
      setInitialCheckDone(true);
    }
  }, [footerPages, initialCheckDone]);

  // Sync URL with activeFooterPage state changes
  useEffect(() => {
    if (!initialCheckDone) return;
    if (activeFooterPage) {
      if (window.location.pathname !== `/${activeFooterPage.slug}`) {
        window.history.pushState(null, '', `/${activeFooterPage.slug}`);
      }
    } else {
      const path = window.location.pathname.replace(/^\/p\//, '/').replace(/^\//, '').toLowerCase();
      const isPagePath = footerPages.some(p => p.slug.toLowerCase() === path);
      if (isPagePath) {
        window.history.pushState(null, '', '/');
      }
    }
  }, [activeFooterPage, footerPages, initialCheckDone]);

  // URL routing for Job posts on load
  useEffect(() => {
    if (jobs.length > 0) {
      const path = window.location.pathname;
      const match = path.match(/^\/job\/([^/]+)/i);
      const urlParams = new URLSearchParams(window.location.search);
      const queryJobId = urlParams.get('job_id');
      const jobIdFromUrl = (match ? match[1] : null) || queryJobId;

      if (jobIdFromUrl) {
        const found = jobs.find(j => String(j.id).toLowerCase() === String(jobIdFromUrl).toLowerCase());
        if (found) {
          setSelectedJob(found);
          setCurrentTab('jobs');
        }
      }
    }
  }, [jobs]);

  // Sync URL with selectedJob state changes
  useEffect(() => {
    if (jobs.length === 0) return;
    if (selectedJob) {
      const targetPath = `/job/${selectedJob.id}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ jobId: selectedJob.id }, '', targetPath);
      }
    } else {
      // If we were on a job details page, go back to the root '/'
      if (window.location.pathname.startsWith('/job/')) {
        window.history.pushState(null, '', '/');
      }
    }
  }, [selectedJob, jobs]);

  // Handle browser Back / Forward buttons for dynamic pages and job posts
  useEffect(() => {
    const handlePopState = () => {
      // Handle dynamic page pop
      if (footerPages.length > 0) {
        const path = window.location.pathname.replace(/^\/p\//, '/').replace(/^\//, '').toLowerCase();
        const found = footerPages.find(p => p.slug.toLowerCase() === path);
        setActiveFooterPage(found || null);
      }

      // Handle job detail pop
      const path = window.location.pathname;
      const match = path.match(/^\/job\/([^/]+)/i);
      const urlParams = new URLSearchParams(window.location.search);
      const queryJobId = urlParams.get('job_id');
      const jobIdFromUrl = (match ? match[1] : null) || queryJobId;

      if (jobIdFromUrl && jobs.length > 0) {
        const found = jobs.find(j => String(j.id).toLowerCase() === String(jobIdFromUrl).toLowerCase());
        setSelectedJob(found || null);
        setCurrentTab('jobs');
      } else {
        setSelectedJob(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [footerPages, jobs]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch settings
      const settingsRes = await fetch('/api/settings');
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }

      // 2. Fetch jobs
      const jobsRes = await fetch('/api/jobs');
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData);
      }

      // 3. Fetch community posts
      const postsRes = await fetch('/api/posts');
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(postsData);
      }

      // Fetch footer pages
      await fetchFooterPages();

      // 4. Check if we have a persisted session
      const savedEmail = localStorage.getItem('sebok_user_email') || localStorage.getItem('jobview_user_email');
      if (savedEmail) {
        const syncRes = await fetch('/api/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: savedEmail })
        });
        if (syncRes.ok) {
          const syncedUser = await syncRes.json();
          // Explicitly set/enforce correct user role in state
          if (syncedUser.email.toLowerCase() === 'kokborokanimations@gmail.com') {
            syncedUser.role = 'admin';
          } else {
            syncedUser.role = 'member';
          }
          setUser(syncedUser);
          
          // If the synced user is admin, fetch user list too
          if (syncedUser.role === 'admin') {
            fetchUserList();
          }
        }
      }
    } catch (err) {
      console.error('Error fetching initial server database', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserList = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error('Could not load user list', e);
    }
  };

  const handleLogin = (loggedInUser: User) => {
    // Explicitly set/enforce correct user role in state
    if (loggedInUser.email.toLowerCase() === 'kokborokanimations@gmail.com') {
      loggedInUser.role = 'admin';
    } else {
      loggedInUser.role = 'member';
    }
    setUser(loggedInUser);
    setDismissedPaywall(false); // Reset paywall state on fresh login
    localStorage.setItem('sebok_user_email', loggedInUser.email);
    setShowLoginModal(false);

    // If logged in as admin, instantly fetch total user accounts
    if (loggedInUser.role === 'admin') {
      fetchUserList();
    }
  };

  const handleLogout = () => {
    setUser(null);
    setDismissedPaywall(false);
    localStorage.removeItem('sebok_user_email');
    localStorage.removeItem('jobview_user_email');
    setSelectedJob(null);
    setCurrentTab('jobs');
  };

  // Admin Actions Forwarding
  const handleUpdateSettings = async (newSettings: AdminSettings): Promise<boolean> => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        setSettings(newSettings);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleAddJob = async (newJobData: Omit<Job, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJobData)
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(prev => [data.job, ...prev]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateJob = async (id: string, jobUpdates: Partial<Job>) => {
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobUpdates)
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(prev => prev.map(j => j.id === id ? data.job : j));
        if (selectedJob && selectedJob.id === id) {
          setSelectedJob(data.job);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteJob = async (id: string) => {
    try {
      // 1. Delete from Supabase
      const { deleteJobFromSupabase } = await import('./lib/supabaseQueries');
      const supabaseResult = await deleteJobFromSupabase(id);
      
      if (supabaseResult && !supabaseResult.success && supabaseResult.error) {
        console.warn('Could not delete from Supabase, but continuing to local database:', supabaseResult.error);
      }

      // 2. Delete from local database backend
      const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const targetId = String(id).trim().toLowerCase();
        setJobs(prev => prev.filter(j => j && j.id && String(j.id).trim().toLowerCase() !== targetId));
        if (selectedJob && String(selectedJob.id).trim().toLowerCase() === targetId) {
          setSelectedJob(null);
        }
        if (window.showSuccessToast) {
          window.showSuccessToast('Job Deleted Successfully!');
        } else {
          alert('Job Deleted Successfully!');
        }
      } else {
        const data = await res.json().catch(() => ({}));
        const errMsg = data.error || 'Job not found or deletion failed on server.';
        alert(`Error: ${errMsg}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Network error: ${e.message || 'Could not connect to the server'}`);
    }
  };

  const handleRefreshJobs = async () => {
    try {
      const jobsRes = await fetch('/api/jobs');
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData);
      }
    } catch (err) {
      console.error('Error refreshing jobs list:', err);
    }
  };

  const handleAddPost = async (postData: { imageUrl: string; caption: string }) => {
    if (!user) return;
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          imageUrl: postData.imageUrl,
          caption: postData.caption
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(prev => [data.post, ...prev]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) {
      if (window.showWarningToast) {
        window.showWarningToast('Please login first.');
      } else {
        alert('Please login first.');
      }
      return;
    }

    const postToDelete = posts.find(p => p.id === postId);
    if (!postToDelete) return;

    const isAdmin = user.email.toLowerCase() === 'kokborokanimations@gmail.com';
    const isAuthor = postToDelete.userId === user.id || postToDelete.userName === user.name;

    if (!isAdmin && !isAuthor) {
      if (window.showWarningToast) {
        window.showWarningToast('You do not have permission to delete this post.');
      } else {
        alert('You do not have permission to delete this post.');
      }
      return;
    }

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email
        })
      });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        if (window.showSuccessToast) {
          window.showSuccessToast('Post Deleted Successfully!');
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        if (window.showWarningToast) {
          window.showWarningToast(errData.error || 'Failed to delete post.');
        } else {
          alert(errData.error || 'Failed to delete post.');
        }
      }
    } catch (e) {
      console.error(e);
      if (window.showWarningToast) {
        window.showWarningToast('An error occurred while deleting the post.');
      }
    }
  };

  const handleApprovePost = (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'Live' } : p));
  };

  const handleUpdateUserSubscription = async (userId: string, updates: { subscriptionStatus: string; trialExpiryDate?: string }) => {
    try {
      const res = await fetch(`/api/users/${userId}/subscription`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        // Refresh users & update self if modified admin/current user
        fetchUserList();
        if (user && user.id === userId) {
          const syncRes = await fetch('/api/users/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email })
          });
          if (syncRes.ok) {
            setUser(await syncRes.json());
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        // Update local state list of users
        setUsers(prev => prev.filter(u => u.id !== userId));
        // Clean up any posts authored by deleted user in state
        setPosts(prev => prev.filter(p => p.userId !== userId));
        
        // Show informative success toast/message
        alert(data.message || 'User account successfully deleted.');
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete user account');
      }
    } catch (e: any) {
      console.error(e);
      alert(`Error: ${e.message}`);
    }
  };

  // Evaluate Lock & Paywall Popup Logic
  const userBadge = getUserBadge(user, settings);
  const isExpiredUser = !!(settings.premiumMode && 
    user && 
    userBadge === 'EXPIRED' && 
    user.email.toLowerCase() !== 'kokborokanimations@gmail.com');

  const handleSelectJob = (job: Job) => {
    if (!user) {
      // Prompt Guest to login before seeing complete recruiters details & action sheet
      setShowLoginModal(true);
    } else if (isExpiredUser) {
      // Block the access, stay on the page, and trigger the premium subscription popup
      setShowPaywallPopup(true);
      if (window.showWarningToast) {
        window.showWarningToast('Premium Subscription Required to view full details');
      }
    } else {
      setSelectedJob(job);
    }
  };

  const shouldLockApp = (forceShowPaywall && !dismissedPaywall) || showPaywallPopup;

  // Automatically trigger paywall popup or login popup when trying to open community or resume tab
  useEffect(() => {
    if (currentTab === 'community' || currentTab === 'resume') {
      if (!user) {
        setShowLoginModal(true);
      } else if (isExpiredUser) {
        setShowPaywallPopup(true);
      }
    }
  }, [currentTab, user, isExpiredUser]);

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans text-slate-800">
      
      {/* Dynamic Header */}
      <Header
        user={user}
        settings={settings}
        onLogout={handleLogout}
        onLoginClick={() => setShowLoginModal(true)}
        onUpgradeClick={() => {
          setDismissedPaywall(false);
          setForceShowPaywall(true);
        }}
        onChangeTab={(tab) => {
          if (tab === 'community' && !user) {
            setShowLoginModal(true);
            return;
          }
          setSelectedJob(null);
          setCurrentTab(tab);
        }}
      />

      {/* Segment Navigation */}
      <Navigation
        currentTab={currentTab}
        onChangeTab={(tab) => {
          if (tab === 'community' && !user) {
            setShowLoginModal(true);
            return;
          }
          setSelectedJob(null);
          setCurrentTab(tab);
        }}
        user={user}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-28">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-64 py-16 gap-3">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-display">
              Connecting to secure database...
            </p>
          </div>
        ) : (
          <>
            {/* 1. Job Feed / Details */}
            {currentTab === 'jobs' && (
              selectedJob ? (
                <JobDetails
                  job={selectedJob}
                  onBack={() => setSelectedJob(null)}
                />
              ) : (
                <JobFeed
                  jobs={jobs}
                  settings={settings}
                  onSelectJob={handleSelectJob}
                />
              )
            )}

            {/* 2. Community Feed */}
            {currentTab === 'community' && (
              !user ? (
                <div className="max-w-md mx-auto px-6 py-12 flex flex-col items-center justify-center text-center animate-fade-in">
                  <div className="w-16 h-16 bg-teal-50 dark:bg-teal-950/30 rounded-2xl border border-teal-100 dark:border-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-sm mb-6 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                  <h3 className="text-lg font-extrabold font-display text-slate-900 dark:text-slate-100 tracking-tight">
                    Sign In to View Community
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm leading-relaxed">
                    Our community feed of designers, developers, and product managers is exclusive to logged-in members. Please sign in to view updates and share your milestones.
                  </p>
                  <button
                    onClick={() => {
                      setShowLoginModal(true);
                    }}
                    className="mt-6 px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl text-xs font-bold font-sans tracking-wide hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-teal-500/10 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Sign In Now
                  </button>

                  {/* Blurred mockup items representing locked posts */}
                  <div className="w-full mt-8 opacity-40 select-none pointer-events-none blur-[4px] space-y-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-left shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
                        <div className="space-y-1 flex-1">
                          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                          <div className="h-2.5 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
                        </div>
                      </div>
                      <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded mb-2" />
                      <div className="h-3 w-4/5 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                  </div>
                </div>
              ) : isExpiredUser ? (
                <div className="max-w-md mx-auto px-6 py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-100 dark:border-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm mb-6 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <h3 className="text-lg font-extrabold font-display text-slate-900 dark:text-slate-100 tracking-tight">
                    Community Feed Locked
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm leading-relaxed">
                    Access to our active community of designers, developers, and product managers is exclusive to Premium members. Upgrade now to network, share milestones, and view job updates.
                  </p>
                  <button
                    onClick={() => {
                      setDismissedPaywall(false);
                      setShowPaywallPopup(true);
                    }}
                    className="mt-6 px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl text-xs font-bold font-sans tracking-wide hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-teal-500/10 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Unlock Community Feed
                  </button>

                  {/* Blurred mockup items representing locked posts */}
                  <div className="w-full mt-8 opacity-40 select-none pointer-events-none blur-[4px] space-y-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-left shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
                        <div className="space-y-1 flex-1">
                          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                          <div className="h-2.5 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
                        </div>
                      </div>
                      <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded mb-2" />
                      <div className="h-3 w-4/5 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                  </div>
                </div>
              ) : (
                <CommunityFeed
                  posts={posts}
                  user={user}
                  onAddPost={handleAddPost}
                  onDeletePost={handleDeletePost}
                  onLoginTrigger={() => setShowLoginModal(true)}
                  bookmarkedPostIds={bookmarkedPostIds}
                  onToggleBookmark={handleToggleBookmark}
                  settings={settings}
                />
              )
            )}

            {/* 3. Secure Admin Panel */}
            {currentTab === 'admin' && user?.role === 'admin' && user?.email.toLowerCase() === 'kokborokanimations@gmail.com' && (
              <AdminPanel
                settings={settings}
                jobs={jobs}
                posts={posts}
                users={users}
                onUpdateSettings={handleUpdateSettings}
                onAddJob={handleAddJob}
                onUpdateJob={handleUpdateJob}
                onDeleteJob={handleDeleteJob}
                onDeletePost={handleDeletePost}
                onUpdateUserSubscription={handleUpdateUserSubscription}
                onRefreshPages={fetchFooterPages}
                onApprovePost={handleApprovePost}
                onDeleteUser={handleDeleteUser}
                onRefreshJobs={handleRefreshJobs}
              />
            )}

            {/* 4. User Profile */}
            {currentTab === 'profile' && (
              <UserProfile
                user={user}
                posts={posts}
                settings={settings}
                jobs={jobs}
                onSelectJob={(job) => {
                  setSelectedJob(job);
                  setCurrentTab('jobs');
                }}
                onUpdateProfile={async (updatedDetails) => {
                  if (!user) return;
                  try {
                    const res = await fetch(`/api/users/${user.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(updatedDetails)
                    });
                    if (res.ok) {
                      const responseData = await res.json();
                      const updatedUser = responseData.user || responseData;
                      setUser(updatedUser);
                      if (window.showSuccessToast) {
                        window.showSuccessToast('Profile Updated Successfully!');
                      } else {
                        alert('Your professional profile has been updated successfully on the server!');
                      }
                    } else {
                      alert('Failed to update professional profile details.');
                    }
                  } catch (e) {
                    console.error(e);
                  }
                }}
                onLoginTrigger={() => setShowLoginModal(true)}
                bookmarkedPostIds={bookmarkedPostIds}
                onToggleBookmark={handleToggleBookmark}
                onUpgradeClick={() => setShowPaywallPopup(true)}
                onDeletePost={handleDeletePost}
              />
            )}

            {/* Resume Builder Section */}
            {currentTab === 'resume' && (
              !user ? (
                <div className="max-w-md mx-auto px-6 py-12 flex flex-col items-center justify-center text-center animate-fade-in">
                  <div className="w-16 h-16 bg-teal-50 dark:bg-teal-950/30 rounded-2xl border border-teal-100 dark:border-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-sm mb-6 animate-pulse">
                    <FileText size={28} className="stroke-[2.5]" />
                  </div>
                  <h3 className="text-lg font-extrabold font-display text-slate-900 dark:text-slate-100 tracking-tight">
                    Sign In to Access Resume Builder
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm leading-relaxed">
                    Our professional resume builder and templates are exclusive to members. Please sign in to build, edit, and export your professional resume.
                  </p>
                  <button
                    onClick={() => {
                      setShowLoginModal(true);
                    }}
                    className="mt-6 px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl text-xs font-bold font-sans tracking-wide hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-teal-500/10 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Sign In Now
                  </button>

                  {/* Blurred mockup representing locked resume */}
                  <div className="w-full mt-8 opacity-40 select-none pointer-events-none blur-[5px] space-y-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 text-left shadow-sm space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                          <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded" />
                        </div>
                      </div>
                      <div className="space-y-2 pt-2">
                        <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="h-3 w-5/6 bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : isExpiredUser ? (
                <div className="max-w-md mx-auto px-6 py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-100 dark:border-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm mb-6 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <h3 className="text-lg font-extrabold font-display text-slate-900 dark:text-slate-100 tracking-tight">
                    Resume Builder Locked
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm leading-relaxed">
                    Access to our premium Resume Builder, templates, and AI assistant is exclusive to active Trial and Premium members. Upgrade your plan now to unlock unlimited access.
                  </p>
                  <button
                    onClick={() => {
                      setDismissedPaywall(false);
                      setShowPaywallPopup(true);
                    }}
                    className="mt-6 px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl text-xs font-bold font-sans tracking-wide hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-teal-500/10 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Unlock Resume Builder
                  </button>

                  {/* Blurred mockup representing locked resume */}
                  <div className="w-full mt-8 opacity-40 select-none pointer-events-none blur-[5px] space-y-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 text-left shadow-sm space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                          <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded" />
                        </div>
                      </div>
                      <div className="space-y-2 pt-2">
                        <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="h-3 w-5/6 bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <ResumeBuilder
                  user={user}
                  settings={settings}
                  onLoginTrigger={() => setShowLoginModal(true)}
                />
              )
            )}

            {/* 5. App Settings */}
            {currentTab === 'settings' && (
              <div className="max-w-md mx-auto px-4 py-8 animate-fade-in space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                    <Settings size={20} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 font-display">Account Settings</h2>
                  </div>
                </div>



                {/* Dynamic Pages List */}
                <div className="space-y-2.5">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available Pages & Docs</span>
                  
                  {footerPages.length > 0 ? (
                    <div className="bg-white border border-slate-200/80 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-xs">
                      {footerPages.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setActiveFooterPage(p)}
                          className="w-full flex items-center justify-between p-3.5 text-left hover:bg-slate-50 transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1.5 bg-slate-50 text-slate-500 rounded-lg group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors shrink-0">
                              <FileText size={14} />
                            </div>
                            <div className="min-w-0">
                              <span className="block text-xs font-bold text-slate-800 truncate group-hover:text-teal-600 transition-colors">
                                {p.title}
                              </span>
                              <span className="block text-[9px] text-slate-400 font-mono">
                                /{p.slug}
                              </span>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-slate-400 group-hover:text-teal-600 transition-colors" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-6 text-xs text-slate-400 bg-white border border-slate-100 rounded-2xl">No pages available</p>
                  )}
                </div>

                {/* Logout Security Block */}
                <div className="space-y-2.5 pt-2">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">Session Actions</span>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-white border border-rose-200 hover:border-rose-500 hover:bg-rose-50/50 text-rose-600 rounded-2xl text-xs font-black tracking-wider uppercase transition-all duration-200 shadow-xs cursor-pointer"
                  >
                    <LogOut size={14} />
                    Logout Account
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Overlay Premium Paywall Modal */}
      {shouldLockApp && user && (
        <Paywall
          user={user}
          settings={settings}
          onClose={() => {
            setDismissedPaywall(true);
            setForceShowPaywall(false);
            setShowPaywallPopup(false);
            if (currentTab === 'community') {
              setCurrentTab('jobs');
            }
          }}
          onPaymentSuccess={(updatedUser) => {
            setUser(updatedUser);
            alert('Membership subscription processed successfully! Thank you for choosing Sebok Premium.');
          }}
        />
      )}

      {/* Dialog Login Modal */}
      {showLoginModal && (
        <LoginModal
          onLogin={handleLogin}
          onClose={() => setShowLoginModal(false)}
          isClosable={true}
          settings={settings}
        />
      )}

      {/* Custom Page Overlay Modal */}
      {activeFooterPage && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setActiveFooterPage(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-extrabold text-sm text-slate-950 uppercase tracking-wider font-display">
                  {activeFooterPage.title}
                </h3>
                <p className="text-[9px] text-gray-400 font-mono mt-0.5">/{activeFooterPage.slug}</p>
              </div>
              <button 
                onClick={() => setActiveFooterPage(null)}
                className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto text-xs text-slate-700 leading-relaxed font-medium space-y-4 prose max-w-none wysiwyg-content">
              <div dangerouslySetInnerHTML={{ __html: activeFooterPage.content }} />

              {(activeFooterPage.slug === 'contact-us' || activeFooterPage.id === 'page-contact') && (
                <ContactForm />
              )}
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveFooterPage(null)}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-teal-600/10 cursor-pointer font-display"
              >
                Close Document
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Global Success/Error Toast notification center */}
      <Toast />

    </div>
  );
}
