/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, CommunityPost, AdminSettings, Job } from '../types';
import { User as UserIcon, Calendar, FileText, BadgeCheck, AlertTriangle, Clock, Edit3, Save, X, Sparkles, Image as ImageIcon, Bookmark, Heart, Share2, Check, Flag, Briefcase, MapPin, Trash2, Camera, Upload } from 'lucide-react';
import { getUserBadge, getTrialInfo } from '../lib/badgeUtils';

interface UserProfileProps {
  user: User | null;
  posts: CommunityPost[];
  settings: AdminSettings;
  onUpdateProfile: (userData: { name: string; avatar: string; bio: string }) => Promise<void>;
  onLoginTrigger: () => void;
  onSelectPost?: (postId: string) => void;
  bookmarkedPostIds: string[];
  onToggleBookmark: (postId: string) => void;
  onUpgradeClick?: () => void;
  jobs?: Job[];
  onSelectJob?: (job: Job) => void;
  onDeletePost?: (postId: string) => Promise<void>;
}

export default function UserProfile({
  user,
  posts,
  settings,
  onUpdateProfile,
  onLoginTrigger,
  onSelectPost,
  bookmarkedPostIds,
  onToggleBookmark,
  onUpgradeClick,
  jobs = [],
  onSelectJob,
  onDeletePost
}: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [supabaseUser, setSupabaseUser] = useState<any>(null);

  React.useEffect(() => {
    async function fetchAuthUser() {
      try {
        const { getSupabaseClient } = await import('../lib/supabase');
        const client = getSupabaseClient();
        if (client) {
          const { data: { user: authUser } } = await client.auth.getUser();
          if (authUser) {
            setSupabaseUser(authUser);
          }
        }
      } catch (err) {
        console.error('Error fetching Supabase auth user:', err);
      }
    }
    if (user) {
      fetchAuthUser();
    } else {
      setSupabaseUser(null);
    }
  }, [user]);

  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleFileUpload = async (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        alert('Please upload a valid image file (PNG, JPG, GIF, WebP, SVG).');
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              file: base64Data,
              name: 'user_avatar'
            })
          });
          
          const data = await res.json();
          if (data.success && data.url) {
            resolve(data.url);
          } else {
            alert('Upload failed: ' + (data.error || 'Unknown error'));
            resolve(null);
          }
        } catch (err) {
          console.error('Upload fetch error:', err);
          resolve(null);
        }
      };
      reader.onerror = () => {
        alert('Error reading file.');
        resolve(null);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploadingAvatar(true);
      const url = await handleFileUpload(e.target.files[0]);
      setIsUploadingAvatar(false);
      if (url) {
        setEditAvatar(url);
        if (window.showSuccessToast) {
          window.showSuccessToast('Profile photo uploaded successfully!');
        }
      }
    }
  };

  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-12 text-center animate-fade-in">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-5">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-slate-200">
            <UserIcon size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-900 text-sm font-display uppercase tracking-wide">
              Access Your Profile
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Log in to view your account details, manage your community posts, and review your premium subscription status.
            </p>
          </div>
          <button
            onClick={onLoginTrigger}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/10 hover:shadow-teal-600/20 cursor-pointer font-display"
          >
            Sign In / Register
          </button>
        </div>
      </div>
    );
  }

  const [activeSubTab, setActiveSubTab] = useState<'posts' | 'saved'>('posts');
  const [supabaseSavedPosts, setSupabaseSavedPosts] = useState<CommunityPost[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [selectedPostForView, setSelectedPostForView] = useState<CommunityPost | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [savedType, setSavedType] = useState<'jobs' | 'posts'>('jobs');
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);

  // Filter posts made by this user
  const myPosts = posts.filter(
    (post) => post.userId === user.id || post.userName === user.name
  );

  // Sync saved jobs from localStorage
  React.useEffect(() => {
    if (activeSubTab === 'saved') {
      const saved = localStorage.getItem('jobview_bookmarked_jobs');
      const savedIds: string[] = saved ? JSON.parse(saved).map(String) : [];
      const filtered = (jobs || []).filter(job => savedIds.includes(String(job.id)));
      setSavedJobs(filtered);
    }
  }, [activeSubTab, jobs]);

  const handleUnsaveJob = (jobId: string) => {
    const saved = localStorage.getItem('jobview_bookmarked_jobs');
    let savedIds: string[] = saved ? JSON.parse(saved).map(String) : [];
    const jobIdStr = String(jobId);
    savedIds = savedIds.filter(id => id !== jobIdStr);
    localStorage.setItem('jobview_bookmarked_jobs', JSON.stringify(savedIds));
    setSavedJobs(prev => prev.filter(j => String(j.id) !== jobIdStr));
    if (window.showSuccessToast) {
      window.showSuccessToast('Job removed from Saved!');
    }
  };

  // Dynamically fetch and synchronize saved posts for this specific logged-in user
  React.useEffect(() => {
    if (user && activeSubTab === 'saved') {
      setIsLoadingSaved(true);
      import('../lib/supabaseQueries')
        .then(({ fetchSavedPostsFromSupabase }) => {
          return fetchSavedPostsFromSupabase(user.id, posts);
        })
        .then((data) => {
          setSupabaseSavedPosts(data);
          setIsLoadingSaved(false);
        })
        .catch((err) => {
          console.error('Error in fetching saved posts:', err);
          // Fallback to local filtering
          const localSaved = posts.filter(post => bookmarkedPostIds.includes(post.id));
          setSupabaseSavedPosts(localSaved);
          setIsLoadingSaved(false);
        });
    }
  }, [user, activeSubTab, posts, bookmarkedPostIds]);

  const handleToggleSavedInProfile = async (postId: string) => {
    if (!user) return;
    try {
      const { toggleSavedPostInSupabase } = await import('../lib/supabaseQueries');
      const isAlreadySaved = bookmarkedPostIds.includes(postId);
      const res = await toggleSavedPostInSupabase(user.id, postId, isAlreadySaved);
      
      if (res.success) {
        onToggleBookmark(postId);
        // Live update the sub-tab list
        setSupabaseSavedPosts(prev => prev.filter(p => p.id !== postId));
        if (window.showSuccessToast) {
          window.showSuccessToast(!isAlreadySaved ? 'Saved successfully!' : 'Removed from Saved Posts');
        }
      }
    } catch (err) {
      console.error(err);
      onToggleBookmark(postId);
    }
  };

  const handleStartEdit = () => {
    setEditName(user.name);
    setEditBio(user.bio || '');
    setEditAvatar(user.avatar);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert('Name cannot be empty.');
      return;
    }
    setIsSaving(true);
    try {
      await onUpdateProfile({
        name: editName.trim(),
        bio: editBio.trim(),
        avatar: editAvatar.trim()
      });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // Human relative/absolute timestamp logic
  const getRelativeTimestamp = (dateStr: string) => {
    const postDate = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - postDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      const mins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      if (mins < 60) {
        return `${mins} min${mins > 1 ? 's' : ''} ago`;
      }
      const hrs = Math.floor(diffHours);
      return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
    } else {
      // Return absolute date: "Posted: 15 Oct 2023"
      return `Posted: ${postDate.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })}`;
    }
  };

  // Get premium badge styling
  const getSubscriptionBadge = () => {
    const badge = getUserBadge(user, settings);
    switch (badge) {
      case 'PREMIUM':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
            <Sparkles size={11} className="text-amber-500 fill-current" />
            Premium
          </span>
        );
      case 'TRIAL':
        return (
          <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
            <BadgeCheck size={11} className="text-teal-600" />
            Trial
          </span>
        );
      case 'EXPIRED':
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
            <AlertTriangle size={11} className="text-rose-500" />
            Expired
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-6">
      
      {/* Profile Header Block */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs animate-fade-in">
        <div className="h-20 bg-gradient-to-r from-teal-50 to-emerald-5/40 border-b border-slate-100" />
        
        <div className="p-5 -mt-10 space-y-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="w-20 h-20 rounded-full bg-white border border-slate-200 p-1 shadow-xs hover:border-teal-400 transition-all shrink-0 flex items-center justify-center overflow-hidden">
                <img
                  src={
                    user.avatar || 
                    `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.email || user.name || 'user')}`
                  }
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 font-display">
                    {user.name}
                  </h3>
                  {getSubscriptionBadge()}
                </div>
                <p className="text-xs text-slate-400 font-mono leading-none">
                  {user.email}
                </p>

              </div>
            </div>

            {!isEditing && (
              <button
                onClick={handleStartEdit}
                className="px-4 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer font-display"
              >
                <Edit3 size={13} />
                <span>Edit Profile</span>
              </button>
            )}
          </div>

          {/* Bio Description */}
          {!isEditing ? (
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
              {user.bio || "No professional summary added yet. Introduce yourself to the community!"}
            </p>
          ) : (
            <form onSubmit={handleSave} className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 animate-slide-up">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-500 font-display">
                  Profile Settings Control
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Photo Upload Option */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-lg border border-slate-200 mb-1">
                <div className="relative group w-16 h-16 rounded-full overflow-hidden border border-slate-200 bg-white p-1 flex items-center justify-center shrink-0 shadow-xs">
                  <img
                    src={editAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.email || editName || 'user')}`}
                    alt="Preview"
                    className="w-full h-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1.5 w-full text-center sm:text-left">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">
                    Profile Photo / Avatar
                  </span>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                      id="profile-avatar-file-input"
                      disabled={isUploadingAvatar}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('profile-avatar-file-input')?.click()}
                      className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/60 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 font-display"
                    >
                      <Camera size={11} />
                      <span>{isUploadingAvatar ? 'Uploading...' : 'Upload Photo'}</span>
                    </button>
                    {editAvatar && (
                      <button
                        type="button"
                        onClick={() => setEditAvatar('')}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer font-display"
                      >
                        Reset to default
                      </button>
                    )}
                  </div>
                  <p className="text-[9px] text-slate-400">Supported: PNG, JPG, GIF, SVG or WebP. Max 5MB.</p>
                </div>
              </div>

              {/* Default Premium Avatars Selection Grid */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 mb-1 space-y-2">
                <span className="block text-[10px] font-bold text-slate-500 uppercase">
                  Or choose a premium default avatar
                </span>
                <div className="flex flex-wrap gap-2.5 justify-start items-center">
                  {[
                    { name: 'Default Email Avatar', url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.email || 'user')}` },
                    { name: 'Felix', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix' },
                    { name: 'Aneka', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka' },
                    { name: 'Jack', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack' },
                    { name: 'Kim', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Kim' },
                    { name: 'Cookie', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Cookie' },
                    { name: 'Initials', url: 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(editName || user.name || 'U') }
                  ].map((av) => {
                    const isSelected = editAvatar === av.url || (!editAvatar && av.name === 'Default Email Avatar');
                    return (
                      <button
                        key={av.name}
                        type="button"
                        onClick={() => setEditAvatar(av.url)}
                        title={av.name}
                        className={`w-10 h-10 rounded-full border p-0.5 hover:scale-105 hover:border-teal-400 transition-all overflow-hidden bg-slate-50 relative shrink-0 ${
                          isSelected ? 'border-teal-500 ring-2 ring-teal-500/15' : 'border-slate-200'
                        }`}
                      >
                        <img src={av.url} alt={av.name} className="w-full h-full rounded-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-teal-500/10 flex items-center justify-center">
                            <div className="bg-teal-600 text-white rounded-full p-0.5 shadow-xs">
                              <Check size={8} className="stroke-[3]" />
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 text-xs text-slate-900 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Avatar URL / Seed (Optional)
                  </label>
                  <input
                    type="text"
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    placeholder="e.g. https://api.dicebear.com/..."
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Professional Bio / Headline
                </label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Share your expertise, resume links, or current project goals..."
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 text-xs text-slate-900 resize-none font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer font-display"
                >
                  {isSaving ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={12} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-slate-400 font-medium font-mono border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1">
              <Calendar size={12} className="text-slate-400" />
              <span>Joined {new Date(user.joinDate).toLocaleDateString()}</span>
            </div>
            {getUserBadge(user, settings) === 'TRIAL' && (() => {
              const info = getTrialInfo(user);
              if (!info) return null;
              return (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-teal-50/60 text-teal-800 border border-teal-100 rounded-xl px-3 py-1.5 font-semibold text-[11px] font-sans mt-1">
                  <div className="flex items-center gap-1">
                    <Clock size={12} className="text-teal-600 animate-pulse" />
                    <span>Trial Active: <span className="font-bold">{info.daysRemaining} days left</span></span>
                  </div>
                  <div className="hidden sm:block text-teal-300">|</div>
                  <div>
                    <span>Expires: <span className="font-bold text-teal-900">{info.expiryDate.toLocaleDateString()}</span></span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('posts')}
          className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 font-display cursor-pointer text-center ${
            activeSubTab === 'posts'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          My Posts ({myPosts.length})
        </button>
        <button
          onClick={() => setActiveSubTab('saved')}
          className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 font-display cursor-pointer text-center ${
            activeSubTab === 'saved'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Saved ({savedJobs.length + supabaseSavedPosts.length})
        </button>
      </div>

      {/* Render Lists based on Active Tab */}
      {activeSubTab === 'posts' ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-teal-600" />
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider font-display">
              My Community Posts
            </h4>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
              {myPosts.length}
            </span>
          </div>

          {myPosts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {myPosts.map((post) => {
                const isLive = post.status !== 'Pending';
                return (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPostForView(post)}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors flex gap-4 items-start relative cursor-pointer"
                  >
                    {post.imageUrl && (
                      <div className="w-16 h-16 rounded-lg bg-slate-50 overflow-hidden border border-slate-100 shrink-0">
                        <img
                          src={post.imageUrl}
                          alt="Post snapshot"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-slate-400 font-medium">
                          {getRelativeTimestamp(post.createdAt)}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          {/* Live or Pending Badge */}
                          {isLive ? (
                            <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                              <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                              Live
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                              <Clock size={9} className="text-amber-500 animate-pulse" />
                              Approval Pending
                            </span>
                          )}

                           {/* Delete post button */}
                           {user && (post.userId === user.id || post.userName === user.name) && onDeletePost && (
                             <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                               {confirmDeleteId === post.id ? (
                                 <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg p-0.5 animate-fade-in shrink-0">
                                   <button
                                     onClick={async (e) => {
                                       e.stopPropagation();
                                       await onDeletePost(post.id);
                                       setConfirmDeleteId(null);
                                     }}
                                     className="px-1.5 py-0.5 text-[9px] font-extrabold bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-colors cursor-pointer shrink-0"
                                   >
                                     Confirm
                                   </button>
                                   <button
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       setConfirmDeleteId(null);
                                     }}
                                     className="px-1.5 py-0.5 text-[9px] font-bold text-slate-500 hover:text-slate-800 rounded-md transition-colors cursor-pointer shrink-0"
                                   >
                                     Cancel
                                   </button>
                                 </div>
                               ) : (
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     setConfirmDeleteId(post.id);
                                   }}
                                   className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                                   title="Delete Post"
                                 >
                                   <Trash2 size={13} />
                                 </button>
                               )}
                             </div>
                           )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                        {post.caption}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
              <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-2">
                <ImageIcon size={16} />
              </div>
              <p className="text-xs font-bold text-slate-700">No community posts yet</p>
              <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs mx-auto">
                Share your professional victories, design drafts, or workstation setups on the Community Feed tab to get listed here!
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5 animate-fade-in">
          {/* Sub-Segment Switcher for Saved Items */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl">
            <div className="flex items-center gap-1.5">
              <Bookmark size={14} className="text-teal-600" />
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider font-display">
                Saved Items Browser
              </span>
            </div>

            <div className="flex bg-slate-200/60 p-0.5 rounded-lg border border-slate-200 shrink-0 self-start sm:self-auto">
              <button
                onClick={() => setSavedType('jobs')}
                className={`px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider rounded-md transition-all font-display cursor-pointer ${
                  savedType === 'jobs'
                    ? 'bg-white text-teal-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                💼 Jobs ({savedJobs.length})
              </button>
              <button
                onClick={() => setSavedType('posts')}
                className={`px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider rounded-md transition-all font-display cursor-pointer ${
                  savedType === 'posts'
                    ? 'bg-white text-teal-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                💬 Community ({supabaseSavedPosts.length})
              </button>
            </div>
          </div>

          {/* List display based on selected segment */}
          {savedType === 'jobs' ? (
            <div className="space-y-4">
              {savedJobs.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {savedJobs.map((job) => {
                    return (
                      <div
                        key={job.id}
                        onClick={() => onSelectJob?.(job)}
                        className="group relative bg-white p-4 rounded-xl shadow-xs border border-slate-200 hover:border-teal-300 hover:shadow-sm transition-all duration-200 flex gap-4 items-start relative cursor-pointer"
                      >
                        {/* Company Logo or Fallback */}
                        {job.companyLogoUrl ? (
                          <div className="w-12 h-12 rounded-lg border border-slate-200/60 flex items-center justify-center shrink-0 bg-slate-50 shadow-xs overflow-hidden">
                            <img
                              src={job.companyLogoUrl}
                              alt={`${job.companyName} logo`}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-contain p-1"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 font-bold text-[13px] text-amber-700 tracking-wide shadow-xs font-display">
                            <Briefcase size={20} className="text-amber-600" />
                          </div>
                        )}

                        <div className="flex-1 space-y-1.5 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-col min-w-0">
                              <h4 className="font-bold text-slate-900 group-hover:text-teal-600 transition-colors tracking-tight text-xs font-display truncate">
                                {job.title}
                              </h4>
                              <span className="text-[10px] font-bold text-slate-500">{job.companyName}</span>
                            </div>
                            
                            {/* Interactive Unsave button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnsaveJob(job.id);
                              }}
                              title="Remove from saved jobs"
                              className="p-1.5 hover:bg-rose-50 text-amber-500 hover:text-rose-600 rounded-lg transition-all cursor-pointer opacity-90 group-hover:opacity-100 shrink-0"
                            >
                              <Bookmark size={13} fill="currentColor" />
                            </button>
                          </div>

                          {/* Info bar */}
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-400 font-medium font-mono">
                            <span className="flex items-center gap-0.5">
                              <MapPin size={10} className="text-slate-400" />
                              {job.location}
                            </span>
                            <span>•</span>
                            {job.salary && (
                              <>
                                <span className="text-emerald-600 font-bold font-sans">{job.salary}</span>
                                <span>•</span>
                              </>
                            )}
                            <span className="flex items-center gap-0.5">
                              <Clock size={10} className="text-slate-400" />
                              <span>{job.datePosted || getRelativeTimestamp(job.createdAt)}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                  <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Briefcase size={16} />
                  </div>
                  <p className="text-xs font-bold text-slate-700">No saved jobs yet</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs mx-auto leading-relaxed">
                    Explore high-quality openings in the Jobs tab, click the bookmark icon on any job to pin them directly here!
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {isLoadingSaved ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400 font-medium">Fetching saved posts from database...</p>
                </div>
              ) : supabaseSavedPosts.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {supabaseSavedPosts.map((post) => {
                    return (
                      <div
                        key={post.id}
                        onClick={() => setSelectedPostForView(post)}
                        className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors flex gap-4 items-start relative group cursor-pointer"
                      >
                        {post.imageUrl && (
                          <div className="w-16 h-16 rounded-lg bg-slate-50 overflow-hidden border border-slate-100 shrink-0">
                            <img
                              src={post.imageUrl}
                              alt="Post snapshot"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        <div className="flex-1 space-y-1.5 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-slate-800">{post.userName}</span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {getRelativeTimestamp(post.createdAt)}
                              </span>
                            </div>
                            
                            {/* Interactive Unsave button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSavedInProfile(post.id);
                              }}
                              title="Remove from saved posts"
                              className="p-1 hover:bg-rose-50 text-amber-500 hover:text-rose-600 rounded-lg transition-all cursor-pointer opacity-90 group-hover:opacity-100 shrink-0"
                            >
                              <Bookmark size={13} fill="currentColor" />
                            </button>
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {post.caption}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                  <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Bookmark size={16} />
                  </div>
                  <p className="text-xs font-bold text-slate-700">No saved community posts yet</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs mx-auto leading-relaxed">
                    Whenever you see an interesting community feed item, click the bookmark icon to review them in this panel.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Selected Post Full View Modal */}
      {selectedPostForView && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedPostForView(null)}
        >
          <div 
            className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-scale-up border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-xs border border-teal-100 select-none">
                  {selectedPostForView.userName ? selectedPostForView.userName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{selectedPostForView.userName}</h4>
                  <p className="text-[10px] font-mono text-slate-400">
                    {getRelativeTimestamp(selectedPostForView.createdAt)}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPostForView(null)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body / Scrollable Content */}
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {selectedPostForView.caption}
              </p>

              {selectedPostForView.imageUrl && (
                <div 
                  onClick={() => setLightboxImage(selectedPostForView.imageUrl)}
                  className="rounded-xl overflow-hidden bg-slate-50 border border-slate-100 cursor-zoom-in group/img relative"
                >
                  <img 
                    src={selectedPostForView.imageUrl} 
                    alt="Community upload" 
                    className="w-full h-auto max-h-[300px] object-cover mx-auto transition-transform duration-300 group-hover/img:scale-[1.02]"
                    referrerPolicy="no-referrer"
                    title="Click to view full image"
                  />
                  <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="bg-slate-900/70 text-white text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-xs flex items-center gap-1 shadow-md">
                      <span>🔍 Click to Zoom</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer / Interactive Toolbar */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Like Button */}
                <button
                  onClick={() => {
                    const liked = localStorage.getItem('jobview_liked_posts');
                    let likedIds: string[] = liked ? JSON.parse(liked) : [];
                    if (likedIds.includes(selectedPostForView.id)) {
                      likedIds = likedIds.filter(id => id !== selectedPostForView.id);
                    } else {
                      likedIds.push(selectedPostForView.id);
                    }
                    localStorage.setItem('jobview_liked_posts', JSON.stringify(likedIds));
                    setSelectedPostForView({ ...selectedPostForView });
                  }}
                  className={`p-2 rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold ${
                    (() => {
                      const liked = localStorage.getItem('jobview_liked_posts');
                      const likedIds: string[] = liked ? JSON.parse(liked) : [];
                      return likedIds.includes(selectedPostForView.id);
                    })()
                      ? 'bg-rose-50 text-rose-600 border border-rose-100'
                      : 'bg-transparent text-slate-500 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <Heart 
                    size={14} 
                    fill={(() => {
                      const liked = localStorage.getItem('jobview_liked_posts');
                      const likedIds: string[] = liked ? JSON.parse(liked) : [];
                      return likedIds.includes(selectedPostForView.id);
                    })() ? 'currentColor' : 'none'} 
                  />
                  <span className="text-[11px] font-mono">
                    {((selectedPostForView.bookmarksCount || 0) % 7) + (
                      (() => {
                        const liked = localStorage.getItem('jobview_liked_posts');
                        const likedIds: string[] = liked ? JSON.parse(liked) : [];
                        return likedIds.includes(selectedPostForView.id) ? 1 : 0;
                      })()
                    )}
                  </span>
                </button>

                {/* Bookmark/Save Button */}
                <button
                  onClick={async () => {
                    await handleToggleSavedInProfile(selectedPostForView.id);
                    if (activeSubTab === 'saved') {
                      setSelectedPostForView(null);
                    } else {
                      setSelectedPostForView({ ...selectedPostForView });
                    }
                  }}
                  className={`p-2 rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold ${
                    bookmarkedPostIds.includes(selectedPostForView.id)
                      ? 'bg-amber-50 text-amber-600 border border-amber-100'
                      : 'bg-transparent text-slate-500 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <Bookmark 
                    size={14} 
                    fill={bookmarkedPostIds.includes(selectedPostForView.id) ? 'currentColor' : 'none'} 
                  />
                  <span className="text-[11px] font-mono">
                    {bookmarkedPostIds.includes(selectedPostForView.id) ? 'Saved' : 'Save'}
                  </span>
                </button>
              </div>

              {/* Share Button */}
              <button
                onClick={() => {
                  const url = `${window.location.origin}/community?post=${selectedPostForView.id}`;
                  navigator.clipboard.writeText(url).then(() => {
                    if (window.showSuccessToast) {
                      window.showSuccessToast('Link Copied to Clipboard!');
                    } else {
                      alert('Link Copied!');
                    }
                  });
                }}
                className="p-2 rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold bg-transparent text-slate-500 hover:bg-slate-100 border border-transparent"
              >
                <Share2 size={14} />
                <span className="text-[11px]">Share</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Image Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[10000] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <button 
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
            title="Close full view"
          >
            <X size={20} />
          </button>
          <img 
            src={lightboxImage} 
            alt="Full-size preview" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scale-up"
            referrerPolicy="no-referrer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}



    </div>
  );
}
