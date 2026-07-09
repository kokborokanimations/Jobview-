/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, FormEvent, DragEvent, ChangeEvent } from 'react';
import { CommunityPost, User, AdminSettings } from '../types';
import { 
  Heart, Bookmark, Share2, Image as ImageIcon, Send, 
  Trash2, Plus, UploadCloud, X, Check, Clock
} from 'lucide-react';

interface CommunityFeedProps {
  posts: CommunityPost[];
  user: User | null;
  onAddPost: (postData: { imageUrl: string; caption: string }) => void;
  onDeletePost: (postId: string) => void;
  onLoginTrigger: () => void;
  bookmarkedPostIds: string[];
  onToggleBookmark: (postId: string) => void;
  settings?: AdminSettings;
}

export default function CommunityFeed({ 
  posts, 
  user, 
  onAddPost, 
  onDeletePost,
  onLoginTrigger,
  bookmarkedPostIds,
  onToggleBookmark,
  settings
}: CommunityFeedProps) {
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getMindPlaceholder = () => {
    const configured = settings?.communityMindPlaceholder;
    const name = user 
      ? (user.email.toLowerCase() === 'kokborokanimations@gmail.com' ? 'Admin' : (user.name || 'User')) 
      : 'Admin';
    
    if (configured) {
      return configured
        .replace(/\{name\}/gi, name)
        .replace(/\{user\}/gi, name);
    }
    return `What's on your mind, ${name}?`;
  };

  // States for interactive feed actions
  const [likedPostIds, setLikedPostIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('sebok_liked_posts') || localStorage.getItem('jobview_liked_posts');
    return saved ? JSON.parse(saved) : [];
  });
  const [sharedPostId, setSharedPostId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // States for custom Modal Actions
  const [activeDeletePostId, setActiveDeletePostId] = useState<string | null>(null);

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageFile(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      onLoginTrigger();
      return;
    }
    if (!imageFile && !caption.trim()) {
      alert('Please upload an image or write a description.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddPost({
        imageUrl: imageFile || '',
        caption: caption.trim()
      });
      // Reset form states
      setCaption('');
      setImageFile(null);
      setShowCreator(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLike = (postId: string) => {
    let updated: string[];
    const isLiked = likedPostIds.includes(postId);
    if (isLiked) {
      updated = likedPostIds.filter(id => id !== postId);
    } else {
      updated = [...likedPostIds, postId];
    }
    setLikedPostIds(updated);
    localStorage.setItem('sebok_liked_posts', JSON.stringify(updated));
  };

  const confirmDelete = () => {
    if (activeDeletePostId) {
      onDeletePost(activeDeletePostId);
      setActiveDeletePostId(null);
    }
  };

  const handleShare = (postId: string) => {
    const shareUrl = `${window.location.origin}/?post_id=${postId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setSharedPostId(postId);
      setTimeout(() => setSharedPostId(null), 2000);
    }).catch(err => console.error(err));

    // Optional: Call background API to save share count
    fetch(`/api/posts/${postId}/share`, { method: 'POST' }).catch(console.error);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-6">
      
      {/* Modern Create New Post Card (Replicating exact reference design) */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-white rounded-2xl border p-5 shadow-xs transition-all ${
          isDragging 
            ? 'border-blue-500 bg-blue-50/10' 
            : 'border-slate-200/80 hover:border-slate-300'
        }`}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          
          <div className="flex gap-4 items-start">
            {/* Avatar Badge with light blue circle background & blue bold initial */}
            {user && user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name || 'User avatar'} 
                className="w-11 h-11 rounded-full object-cover shrink-0 border border-slate-100" 
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-[#E6F0FA] flex items-center justify-center shrink-0">
                <span className="text-[#0062D2] font-extrabold text-[17px] font-sans">
                  {user ? (user.email.toLowerCase() === 'kokborokanimations@gmail.com' ? 'A' : (user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase())) : 'A'}
                </span>
              </div>
            )}

            {/* Post Area with custom placeholder */}
            <div className="flex-1 pt-2">
              <textarea
                rows={2}
                placeholder={getMindPlaceholder()}
                value={caption}
                onChange={(e) => {
                  if (!user) {
                    onLoginTrigger();
                  } else {
                    setCaption(e.target.value);
                  }
                }}
                onClick={() => {
                  if (!user) onLoginTrigger();
                }}
                className="w-full text-sm md:text-[15px] text-slate-800 placeholder:text-slate-500 bg-transparent border-none focus:outline-none focus:ring-0 p-0 resize-none font-sans min-h-[44px] leading-relaxed"
              />
            </div>
          </div>

          {/* Image Upload Preview */}
          {imageFile && (
            <div className="relative rounded-xl overflow-hidden max-h-80 border border-slate-100 animate-fade-in mt-2">
              <img
                src={imageFile}
                alt="Post preview"
                className="w-full max-h-80 object-cover rounded-xl"
              />
              <button
                type="button"
                onClick={() => setImageFile(null)}
                className="absolute top-2.5 right-2.5 p-1.5 bg-slate-900/80 hover:bg-slate-950 text-white rounded-full transition-all cursor-pointer hover:scale-105 shadow-md"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Thin line Divider */}
          <div className="border-t border-slate-200/60 w-full pt-1" />

          {/* Row containing Photo Option & Post Button */}
          <div className="flex items-center justify-between pt-1">
            
            {/* Photo Attachment (Triggers file input selection) */}
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  onLoginTrigger();
                } else {
                  fileInputRef.current?.click();
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer"
            >
              <ImageIcon size={18} className="text-slate-700" />
              <span className="text-[14px] text-slate-600 font-medium font-sans">Photo</span>
            </button>

            {/* Post button exactly matching the reference style */}
            <button
              type="submit"
              disabled={isSubmitting || (!caption.trim() && !imageFile)}
              className="px-5 py-2 bg-[#0062D2] hover:bg-[#0051B0] disabled:bg-[#0062D2]/50 disabled:cursor-not-allowed text-white rounded-lg text-xs md:text-[14px] font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer font-sans"
            >
              {isSubmitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Post</span>
              )}
            </button>
          </div>

          {/* Notice: Posts are reviewed before going live */}
          <div className="text-[12px] text-slate-500 font-medium font-sans pl-1 pt-1.5 leading-none">
            {settings?.communityReviewNotice || "Posts are reviewed before going live."}
          </div>

        </form>
      </div>

      {/* Posts Feed List */}
      <div className="space-y-6">
        {(() => {
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
              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              const day = postDate.getDate();
              const month = months[postDate.getMonth()];
              const year = postDate.getFullYear();
              return `Posted: ${day} ${month} ${year}`;
            }
          };

          const visiblePosts = posts.filter((post) => {
            if (post.status !== 'Pending') return true;
            const isAdmin = user && user.email.toLowerCase() === 'kokborokanimations@gmail.com';
            const isMyPost = user && (post.userId === user.id || post.userName === user.name);
            return isMyPost || isAdmin;
          });

          if (visiblePosts.length > 0) {
            return visiblePosts.map((post) => {
              const isBookmarked = bookmarkedPostIds.includes(post.id);
              const isShared = sharedPostId === post.id;
              const isModerator = user && user.email.toLowerCase() === 'kokborokanimations@gmail.com';
              const isMyPost = user && (post.userId === user.id || post.userName === user.name);
              const canDelete = isModerator || isMyPost;
              const isPending = post.status === 'Pending';

              return (
                <article
                  key={post.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs animate-slide-up"
                >
                  {/* Author Card Header */}
                  <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/30">
                    <div className="flex items-center gap-3">
                      <img
                        src={post.userAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(post.userName)}`}
                        alt={post.userName}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-[14px] font-bold text-slate-950">{post.userName}</h4>
                          {isPending && (
                            <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 border border-amber-100 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full">
                              <Clock size={8} className="text-amber-500 animate-pulse" />
                              Approval Pending
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {getRelativeTimestamp(post.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Delete button (Author or Moderator can delete) */}
                      {canDelete && (
                        <button
                          onClick={() => {
                            setActiveDeletePostId(post.id);
                          }}
                          title="Delete Post"
                          className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Post Caption */}
                  {post.caption && (
                    <p className="px-4 py-4 text-sm text-slate-700 leading-relaxed">
                      {post.caption}
                    </p>
                  )}

                  {/* Post Image Content (Free size with lightbox) */}
                  {post.imageUrl && (
                    <div className="bg-slate-50 border-y border-slate-100 max-h-[500px] flex items-center justify-center overflow-hidden relative">
                      <img
                        src={post.imageUrl}
                        alt="Shared community visual"
                        className="max-h-[500px] w-full object-contain cursor-pointer hover:opacity-95 transition-opacity"
                        referrerPolicy="no-referrer"
                        onClick={() => setLightboxImage(post.imageUrl)}
                      />
                    </div>
                  )}

                  {/* Bottom Interactive Toolbar */}
                  <div className="px-4 py-2 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      {/* Like/Support Button */}
                      <button
                        onClick={() => handleToggleLike(post.id)}
                        className={`p-2 rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold ${
                          likedPostIds.includes(post.id)
                            ? 'bg-rose-50 text-rose-600 border border-rose-100 scale-105 shadow-xs'
                            : 'bg-transparent text-slate-500 hover:bg-slate-100 border border-transparent'
                        }`}
                        title="Support this post"
                      >
                        <Heart size={14} fill={likedPostIds.includes(post.id) ? 'currentColor' : 'none'} className="transition-transform duration-300 active:scale-125" />
                        <span className="text-[11px] font-mono select-none">
                          {((post.bookmarksCount || 0) % 7) + (likedPostIds.includes(post.id) ? 1 : 0)}
                        </span>
                      </button>

                      {/* Bookmark/Saved Button */}
                      <button
                        onClick={() => onToggleBookmark(post.id)}
                        className={`p-2 rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold ${
                          isBookmarked
                            ? 'bg-amber-50 text-amber-600 border border-amber-100 scale-105 shadow-xs'
                            : 'bg-transparent text-slate-500 hover:bg-slate-100 border border-transparent'
                        }`}
                        title={isBookmarked ? 'Remove Saved Post' : 'Save Post'}
                      >
                        <Bookmark size={14} fill={isBookmarked ? 'currentColor' : 'none'} className="transition-transform duration-300 active:scale-125" />
                        <span className="text-[11px] font-mono select-none">
                          {isBookmarked ? 'Saved' : 'Save'}
                        </span>
                      </button>
                    </div>

                    {/* Share Post Button */}
                    <button
                      onClick={() => handleShare(post.id)}
                      className={`p-2 rounded-full transition-all cursor-pointer flex items-center justify-center gap-1 text-xs font-bold ${
                        isShared
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-transparent text-slate-500 hover:bg-slate-100 border border-transparent'
                      }`}
                      title="Share post"
                    >
                      {isShared ? (
                        <>
                          <Check size={14} className="text-emerald-600" />
                          <span className="text-[11px] text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Share2 size={14} />
                          <span className="text-[11px]">Share</span>
                        </>
                      )}
                    </button>
                  </div>

                </article>
              );
            });
          } else {
            return (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-xs">
                <div className="w-12 h-12 bg-gray-50 flex items-center justify-center text-gray-400 rounded-full mx-auto mb-3">
                  <ImageIcon size={20} />
                </div>
                <h4 className="font-extrabold text-gray-900 text-sm">No community posts yet</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Be the first user to share a career victory, resume snapshot, or collaborative post! Click Create Post to begin.
                </p>
              </div>
            );
          }
        })()}
      </div>

      {/* Full Screen Image Lightbox Modal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-slate-950/95 z-[9999] flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <button 
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full transition-colors z-50 cursor-pointer"
            title="Close Lightbox"
          >
            <X size={20} />
          </button>
          
          <div className="relative max-w-5xl max-h-[85vh] flex items-center justify-center overflow-hidden">
            <img 
              src={lightboxImage} 
              alt="Lightbox display" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg animate-scale-up"
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
          
          <p className="text-slate-400 text-xs mt-4 select-none">
            Click anywhere to close
          </p>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {activeDeletePostId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl overflow-hidden border border-slate-100 animate-scale-up">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/10">
              <div className="flex items-center gap-2">
                <Trash2 className="text-rose-500" size={18} />
                <h3 className="font-extrabold text-slate-900 text-sm">Delete Post?</h3>
              </div>
              <button 
                onClick={() => setActiveDeletePostId(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5">
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete this community post? This action cannot be undone, and the post will be removed immediately from the feed.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setActiveDeletePostId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
