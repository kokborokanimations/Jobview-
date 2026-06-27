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
  
  // Navigation
  const [currentTab, setCurrentTab] = useState<'jobs' | 'community' | 'admin'>('jobs');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load Initial Data
  useEffect(() => {
    fetchInitialData();
  }, []);

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
    localStorage.setItem('jobview_user_email', loggedInUser.email);
    setShowLoginModal(false);

    // If logged in as admin, instantly fetch total user accounts
    if (loggedInUser.email.toLowerCase() === 'kokborokanimations@gmail.com') {
      fetchUserList();
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('jobview_user_email');
    setSelectedJob(null);
    setCurrentTab('jobs');
  };

  // Admin Actions Forwarding
  const handleUpdateSettings = async (newSettings: AdminSettings) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        setSettings(newSettings);
      }
    } catch (e) {
      console.error(e);
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
      const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setJobs(prev => prev.filter(j => j.id !== id));
        if (selectedJob && selectedJob.id === id) {
          setSelectedJob(null);
        }
      }
    } catch (e) {
      console.error(e);
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

  const handleSelectJob = (job: Job) => {
    if (!user) {
      // Prompt Guest to login before seeing complete recruiters details & action sheet
      setShowLoginModal(true);
    } else {
      setSelectedJob(job);
    }
  };

  // Evaluate Lock & Paywall Popup Logic
  const isTrialExpired = user && 
    user.subscriptionStatus === 'Free Trial' && 
    new Date() > new Date(user.trialExpiryDate);

  const shouldLockApp = settings.premiumMode && 
    user && 
    user.subscriptionStatus !== 'Active' && 
    (user.subscriptionStatus === 'Expired' || isTrialExpired) &&
    // Don't completely lock out the admin tab so they can change premiumMode back or check logs!
    currentTab !== 'admin' &&
    user.email.toLowerCase() !== 'kokborokanimations@gmail.com';

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans text-slate-800">
      
      {/* Dynamic Header */}
      <Header
        user={user}
        settings={settings}
        onLogout={handleLogout}
        onLoginClick={() => setShowLoginModal(true)}
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
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
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
              <CommunityFeed
                posts={posts}
                user={user}
                onAddPost={handleAddPost}
                onDeletePost={handleDeletePost}
                onLoginTrigger={() => setShowLoginModal(true)}
              />
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

      {/* Decorative Bottom Credits */}
      <footer className="py-6 border-t border-slate-200/60 bg-white text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
        <span>© {new Date().getFullYear()} {settings.brandName || 'Jobview'} Premium. All Rights Reserved.</span>
      </footer>

    </div>
  );
}
