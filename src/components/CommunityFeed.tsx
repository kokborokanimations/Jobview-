/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, FormEvent, DragEvent, ChangeEvent } from 'react';
import { CommunityPost, User } from '../types';
import { 
  Heart, Bookmark, Share2, Image as ImageIcon, Send, 
  Trash2, Plus, Sparkles, UploadCloud, X, Check, Clock
} from 'lucide-react';

interface CommunityFeedProps {
  posts: CommunityPost[];
  user: User | null;
  onAddPost: (postData: { imageUrl: string; caption: string }) => void;
  onDeletePost: (postId: string) => void;
  onLoginTrigger: () => void;
}

export default function CommunityFeed({ 
  posts, 
  user, 
  onAddPost, 
  onDeletePost,
  onLoginTrigger
}: CommunityFeedProps) {
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for interactive feed actions
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('jobview_bookmarked_posts');
    return saved ? JSON.parse(saved) : [];
  });
  const [sharedPostId, setSharedPostId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

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
    if (!imageFile) {
      alert('Please upload an image first.');
      return;
    }
    if (!caption.trim()) {
      alert('Please add a description.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddPost({
        imageUrl: imageFile,
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

  const handleToggleBookmark = (postId: string) => {
    let updated: string[];
    if (bookmarkedPostIds.includes(postId)) {
      updated = bookmarkedPostIds.filter(id => id !== postId);
    } else {
      updated = [...bookmarkedPostIds, postId];
    }
    setBookmarkedPostIds(updated);
    localStorage.setItem('jobview_bookmarked_posts', JSON.stringify(updated));

    // Optional: Call background API to save bookmark count
    fetch(`/api/posts/${postId}/bookmark`, { method: 'POST' }).catch(console.error);
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

  const handleOpenCreator = () => {
    if (!user) {
      onLoginTrigger();
    } else {
      setShowCreator(true);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-6">
      
      {/* Community Intro & Create Trigger Button */}
      <div className="bg-white text-slate-800 rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-teal-600" />
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider font-display">
              Community Feed
            </h3>
          </div>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            Share career wins, work environments, and connect with other creators and remote builders!
          </p>
        </div>

        {!showCreator && (
          <button
            onClick={handleOpenCreator}
            className="w-full md:w-auto px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer self-stretch md:self-auto shrink-0 font-display"
          >
            <Plus size={15} />
            <span>Create Post</span>
          </button>
        )}
      </div>

      {/* Post Creator Modal-style accordion */}
      {showCreator && user && (
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs animate-fade-in space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 font-display">
              Create a Community Post
            </h4>
            <button
              onClick={() => setShowCreator(false)}
              className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Image Upload Area */}
            {imageFile ? (
              <div className="relative rounded-lg overflow-hidden h-52 border border-slate-200">
                <img
                  src={imageFile}
                  alt="Post preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImageFile(null)}
                  className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-slate-950 text-white rounded-full transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border border-dashed rounded-lg h-36 flex flex-col items-center justify-center p-4 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-teal-500 bg-teal-50/10'
                    : 'border-slate-300 hover:border-teal-400 hover:bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="p-2.5 bg-slate-50 text-slate-600 rounded-lg mb-1 border border-slate-200">
                  <UploadCloud size={16} />
                </div>
                <p className="text-xs font-bold text-slate-700">
                  Drag and drop image, or <span className="text-teal-600 font-bold">browse file</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Supports PNG, JPG, GIF (Max 5MB)
                </p>
              </div>
            )}

            {/* Caption Input */}
            <div>
              <textarea
                rows={3}
                required
                placeholder="What is on your mind? Share achievements, workstation setups, or hiring needs..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 transition-all text-xs text-slate-900 placeholder:text-slate-400 resize-none font-sans"
              />
            </div>

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowCreator(false)}
                className="px-4 py-1.5 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-500 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 font-display"
              >
                {isSubmitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={12} />
                    <span>Post Now</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      )}

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
                          <h4 className="text-xs font-bold text-slate-950">{post.userName}</h4>
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

                    {/* Admin moderation delete button */}
                    {isModerator && (
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this community post as Moderator?')) {
                            onDeletePost(post.id);
                          }
                        }}
                        title="Moderate Post"
                        className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Post Caption */}
                  <p className="px-4 py-4 text-xs text-slate-700 leading-relaxed">
                    {post.caption}
                  </p>

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
                  <div className="p-3 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
                    <div className="flex items-center gap-4">
                      {/* Like indicator, styled with simple local state or display only */}
                      <button
                        onClick={() => alert('Thanks for the support!')}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-500 transition-colors cursor-pointer font-semibold"
                      >
                        <Heart size={15} />
                        <span>Support</span>
                      </button>

                      {/* Bookmark */}
                      <button
                        onClick={() => handleToggleBookmark(post.id)}
                        className={`flex items-center gap-1.5 text-xs transition-colors cursor-pointer font-semibold ${
                          isBookmarked 
                            ? 'text-amber-500 hover:text-amber-600' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <Bookmark size={15} fill={isBookmarked ? 'currentColor' : 'none'} />
                        <span>{isBookmarked ? 'Saved' : 'Save'}</span>
                      </button>
                    </div>

                    {/* Share Post */}
                    <button
                      onClick={() => handleShare(post.id)}
                      className={`flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                        isShared 
                          ? 'text-emerald-600 font-bold' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {isShared ? <Check size={14} /> : <Share2 size={14} />}
                      <span>{isShared ? 'Link Copied!' : 'Share Post'}</span>
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

    </div>
  );
}
