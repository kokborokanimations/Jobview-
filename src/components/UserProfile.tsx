/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, CommunityPost } from '../types';
import { User as UserIcon, Calendar, FileText, BadgeCheck, AlertTriangle, Clock, Edit3, Save, X, Sparkles, Image as ImageIcon } from 'lucide-react';

interface UserProfileProps {
  user: User | null;
  posts: CommunityPost[];
  onUpdateProfile: (userData: { name: string; avatar: string; bio: string }) => Promise<void>;
  onLoginTrigger: () => void;
  onSelectPost?: (postId: string) => void;
}

export default function UserProfile({
  user,
  posts,
  onUpdateProfile,
  onLoginTrigger,
  onSelectPost
}: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);

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

  // Filter posts made by this user
  const myPosts = posts.filter(
    (post) => post.userId === user.id || post.userName === user.name
  );

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
    switch (user.subscriptionStatus) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
            <Sparkles size={11} className="text-amber-500 fill-current" />
            Premium
          </span>
        );
      case 'Free Trial':
        return (
          <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
            <BadgeCheck size={11} className="text-teal-600" />
            Trial
          </span>
        );
      case 'Expired':
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
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name}`}
                alt={user.name}
                className="w-20 h-20 rounded-xl object-cover bg-white border border-slate-200 p-1 shadow-xs"
                referrerPolicy="no-referrer"
              />
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
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={15} />
                </button>
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
                    Avatar URL / Seed
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
            {user.subscriptionStatus === 'Free Trial' && (
              <div className="flex items-center gap-1 text-amber-600">
                <Clock size={12} />
                <span>Trial ends: {new Date(user.trialExpiryDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User's Posted Community Items */}
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
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors flex gap-4 items-start relative"
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

    </div>
  );
}
