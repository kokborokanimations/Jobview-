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
import { X } from 'lucide-react';
import { getUserBadge } from './lib/badgeUtils';
import Toast from './components/Toast';

export default function App() {
  // Global States
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<AdminSettings>({
    brandName: 'Jobview',
    tagline: 'Your Premium Portal to Verified Careers & Networking',
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
  });

  const [jobs, setJobs] = useState<Job[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [footerPages, setFooterPages] = useState<any[]>([]);
  const [activeFooterPage, setActiveFooterPage] = useState<any | null>(null);

  // Synchronized bookmark states
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('jobview_bookmarked_posts');
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
    localStorage.setItem('jobview_bookmarked_posts', JSON.stringify(updated));

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
  const [currentTab, setCurrentTab] = useState<'jobs' | 'community' | 'admin' | 'profile'>('jobs');
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

  // Load Initial Data
  useEffect(() => {
    fetchInitialData();
  }, []);

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
            localStorage.setItem('jobview_bookmarked_posts', JSON.stringify(savedIds));
          }
        })
        .catch(err => console.error('Error syncing bookmarks on user load:', err));
    }
  }, [user, posts]);

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
      const savedEmail = localStorage.getItem('jobview_user_email');
      if (savedEmail) {
        const syncRes = await fetch('/api/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: savedEmail })
        });
        if (syncRes.ok) {
          const syncedUser = await syncRes.json();
          setUser(syncedUser);
          
          // If the synced user is admin, fetch user list too
          if (syncedUser.email.toLowerCase() === 'kokborokanimations@gmail.com') {
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
    setUser(loggedInUser);
    setDismissedPaywall(false); // Reset paywall state on fresh login
    localStorage.setItem('jobview_user_email', loggedInUser.email);
    setShowLoginModal(false);

    // If logged in as admin, instantly fetch total user accounts
    if (loggedInUser.email.toLowerCase() === 'kokborokanimations@gmail.com') {
      fetchUserList();
    }
  };

  const handleLogout = () => {
    setUser(null);
    setDismissedPaywall(false);
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
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
      }
    } catch (e) {
      console.error(e);
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

  // Automatically trigger paywall popup when trying to open the community tab
  useEffect(() => {
    if (currentTab === 'community' && isExpiredUser) {
      setShowPaywallPopup(true);
    }
  }, [currentTab, isExpiredUser]);

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
          setSelectedJob(null);
          setCurrentTab(tab);
        }}
      />

      {/* Segment Navigation */}
      <Navigation
        currentTab={currentTab}
        onChangeTab={(tab) => {
          setSelectedJob(null);
          setCurrentTab(tab);
        }}
        user={user}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
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
              isExpiredUser ? (
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
                />
              )
            )}

            {/* 3. Secure Admin Panel */}
            {currentTab === 'admin' && user?.email.toLowerCase() === 'kokborokanimations@gmail.com' && (
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
              />
            )}

            {/* 4. User Profile */}
            {currentTab === 'profile' && (
              <UserProfile
                user={user}
                posts={posts}
                settings={settings}
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
              />
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
            alert('Membership subscription processed successfully! Thank you for choosing Jobview Premium.');
          }}
        />
      )}

      {/* Dialog Login Modal */}
      {showLoginModal && (
        <LoginModal
          onLogin={handleLogin}
          onClose={() => setShowLoginModal(false)}
          isClosable={true}
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
            
            <div className="p-6 overflow-y-auto text-xs text-slate-700 leading-relaxed font-medium space-y-4 prose max-w-none">
              {activeFooterPage.content.split('\n').map((line: string, idx: number) => {
                if (line.startsWith('# ')) {
                  return <h1 key={idx} className="text-base font-black text-slate-900 border-b pb-1.5 mt-4 first:mt-0">{line.replace('# ', '')}</h1>;
                } else if (line.startsWith('## ')) {
                  return <h2 key={idx} className="text-sm font-bold text-slate-900 mt-3">{line.replace('## ', '')}</h2>;
                } else if (line.startsWith('- ') || line.startsWith('* ')) {
                  return <li key={idx} className="ml-4 list-disc">{line.substring(2)}</li>;
                } else if (line.trim().length === 0) {
                  return <div key={idx} className="h-2" />;
                } else {
                  return <p key={idx}>{line}</p>;
                }
              })}
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

      {/* Responsive Footer Links */}
      <footer className="bg-white border-t border-slate-200 py-10 mt-auto font-sans">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="text-xs font-black text-slate-900 tracking-tight">{settings.brandName || 'Jobview'} Portal</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{settings.tagline}</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-bold text-slate-600">
            {footerPages.filter(p => p.isVisibleInFooter).map(p => (
              <button
                key={p.id}
                onClick={() => setActiveFooterPage(p)}
                className="hover:text-teal-600 transition-colors cursor-pointer"
              >
                {p.title}
              </button>
            ))}
          </div>
          
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center md:text-right">
            © {new Date().getFullYear()} {settings.brandName || 'Jobview'}. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>

      {/* Global Success/Error Toast notification center */}
      <Toast />

    </div>
  );
}
