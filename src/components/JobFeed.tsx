/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Job, AdminSettings } from '../types';
import { Search, MapPin, Briefcase, Calendar, ChevronRight, ChevronLeft, Activity, Bookmark, Share2, Check, Clock, Flame } from 'lucide-react';

export function getRelativeTime(dateString: string | undefined, createdAtString?: string): string {
  const targetStr = dateString || createdAtString;
  if (!targetStr) return 'Recently';

  const cleanStr = targetStr.trim().toLowerCase();

  // If it already looks like a relative string (e.g., contains 'ago' or 'recently' or 'today' or 'yesterday')
  if (
    cleanStr.includes('ago') || 
    cleanStr.includes('recently') || 
    cleanStr.includes('today') || 
    cleanStr.includes('yesterday') ||
    cleanStr.includes('just now') ||
    cleanStr.includes('hours') ||
    cleanStr.includes('days') ||
    cleanStr.includes('mins') ||
    cleanStr.includes('weeks') ||
    cleanStr.includes('months') ||
    cleanStr.includes('hr') ||
    cleanStr.includes('day') ||
    cleanStr.includes('min')
  ) {
    // Capitalize first letter cleanly
    return targetStr.trim().charAt(0).toUpperCase() + targetStr.trim().slice(1);
  }

  // Otherwise, calculate relative time
  try {
    const date = new Date(targetStr);
    if (isNaN(date.getTime())) {
      if (createdAtString && createdAtString !== targetStr) {
        return getRelativeTime(undefined, createdAtString);
      }
      return targetStr;
    }
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'Just now';

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} days ago`;

    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks} weeks ago`;

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} months ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return 'Recently';
  }
}

interface JobFeedProps {
  jobs: Job[];
  settings: AdminSettings;
  onSelectJob: (job: Job) => void;
}

export const LOGO_GRADIENTS = [
  'from-blue-600 to-cyan-500 text-white',
  'from-pink-500 to-teal-600 text-white',
  'from-emerald-500 to-teal-600 text-white',
  'from-amber-500 to-rose-500 text-white',
  'from-violet-600 to-fuchsia-600 text-white',
  'from-cyan-500 to-blue-600 text-white'
];

export default function JobFeed({ jobs, settings, onSelectJob }: JobFeedProps) {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [currentHotIndex, setCurrentHotIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(settings.hotJobsAutoSlideEnabled !== false);

  useEffect(() => {
    setIsAutoPlaying(settings.hotJobsAutoSlideEnabled !== false);
  }, [settings.hotJobsAutoSlideEnabled]);

  // Auto-slide hot jobs with dynamic timing support
  const hotJobsCount = jobs.filter((job) => job.isHot && job.isLive).length;
  useEffect(() => {
    if (hotJobsCount <= 1 || !isAutoPlaying) return;

    const timerSeconds = settings.hotJobsSliderTimer || 3;
    const interval = setInterval(() => {
      setCurrentHotIndex((prev) => (prev >= hotJobsCount - 1 ? 0 : prev + 1));
    }, timerSeconds * 1000);

    return () => clearInterval(interval);
  }, [hotJobsCount, isAutoPlaying, settings.hotJobsSliderTimer]);

  const [bookmarkedJobIds, setBookmarkedJobIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('sebok_bookmarked_jobs') || localStorage.getItem('jobview_bookmarked_jobs');
    return saved ? JSON.parse(saved) : [];
  });
  const [sharedJobId, setSharedJobId] = useState<string | null>(null);

  const handleToggleBookmark = (jobId: string) => {
    let updated: string[];
    if (bookmarkedJobIds.includes(jobId)) {
      updated = bookmarkedJobIds.filter(id => id !== jobId);
    } else {
      updated = [...bookmarkedJobIds, jobId];
    }
    setBookmarkedJobIds(updated);
    localStorage.setItem('sebok_bookmarked_jobs', JSON.stringify(updated));
  };

  const handleShare = (jobId: string) => {
    const shareUrl = `${window.location.origin}/?job_id=${jobId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setSharedJobId(jobId);
      setTimeout(() => setSharedJobId(null), 2000);
    }).catch(err => console.error(err));
  };

  const filteredJobs = jobs.filter((job) => {
    const showFilters = settings.showJobFilters !== false;
    const matchesSearch = !showFilters ||
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.companyName.toLowerCase().includes(search.toLowerCase()) ||
      job.shortDescription.toLowerCase().includes(search.toLowerCase());
    const matchesLocation = !showFilters || job.location.toLowerCase().includes(location.toLowerCase());
    return matchesSearch && matchesLocation && job.isLive;
  });

  const bannerHeightType = settings.bannerHeightType || 'default';
  const bannerHeightCustomValue = settings.bannerHeightCustomValue || 150;
  const bannerObjectFit = settings.bannerObjectFit || 'cover';
  const bannerPosition = settings.bannerPosition || 'center';

  let bannerHeightStyle: React.CSSProperties = {};
  let bannerHeightClass = 'h-32 md:h-36'; // Default

  if (bannerHeightType === 'small') {
    bannerHeightClass = 'h-24';
  } else if (bannerHeightType === 'medium') {
    bannerHeightClass = 'h-36';
  } else if (bannerHeightType === 'large') {
    bannerHeightClass = 'h-48 md:h-52';
  } else if (bannerHeightType === 'custom') {
    bannerHeightClass = '';
    bannerHeightStyle = { height: `${bannerHeightCustomValue}px` };
  }

  const fitClass = 
    bannerObjectFit === 'contain' ? 'object-contain bg-slate-900' :
    bannerObjectFit === 'fill' ? 'object-fill' : 'object-cover';

  const positionClass = 
    bannerPosition === 'top' ? 'object-top' :
    bannerPosition === 'bottom' ? 'object-bottom' : 'object-center';

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 space-y-6">
      
      {/* Dynamic Job Feed Banner */}
      <div 
        className={`relative rounded-2xl overflow-hidden border border-slate-200 shadow-xs ${bannerHeightClass} ${!settings.bannerUrl ? 'bg-gradient-to-r from-teal-900 via-slate-800 to-indigo-950' : ''}`}
        style={bannerHeightStyle}
      >
        {settings.bannerUrl && (
          <img
            src={settings.bannerUrl}
            alt="Careers Banner"
            className={`w-full h-full ${fitClass} ${positionClass}`}
            referrerPolicy="no-referrer"
            onError={(e) => {
              const currentSrc = e.currentTarget.src;
              if (currentSrc && currentSrc.includes('/storage/v1/object/public/') && !currentSrc.includes('/uploads/')) {
                const parts = currentSrc.split('/');
                const filename = parts[parts.length - 1];
                e.currentTarget.src = `/uploads/${filename}`;
              }
            }}
          />
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-transparent flex flex-col justify-end p-5 text-white">
          {settings.bannerHtml ? (
            <div 
              className="text-white text-xs font-medium w-full wysiwyg-content select-text leading-relaxed"
              dangerouslySetInnerHTML={{ __html: settings.bannerHtml }}
            />
          ) : (
            <>
              <span className="px-2 py-0.5 bg-teal-600 text-white text-[9px] font-bold tracking-widest uppercase rounded self-start mb-1.5 shadow-xs font-display animate-pulse">
                Discover Jobs
              </span>
              <h2 className="text-base md:text-lg font-bold text-white leading-tight tracking-tight font-display">
                Work with the most innovative companies on the planet
              </h2>
              <p className="text-[10px] text-slate-200 mt-0.5 font-medium hidden sm:block">
                Apply in seconds and text hiring managers directly.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Hot Jobs Carousel Section */}
      {(() => {
        if (settings.hotJobsShowSlider === false) return null;
        const hotJobs = jobs.filter((job) => job.isHot && job.isLive);
        if (hotJobs.length === 0) return null;

        const activeIndex = currentHotIndex >= hotJobs.length ? 0 : currentHotIndex;
        const hotJob = hotJobs[activeIndex];
        if (!hotJob) return null;

        const bgType = settings.hotJobsCardBgType || 'preset';
        const presetTheme = settings.hotJobsCardPresetTheme || 'amber';

        let containerClass = "rounded-2xl pt-[14px] pb-[14px] px-5 transition-all duration-300 cursor-pointer flex flex-col relative group overflow-hidden shadow-xs hover:scale-[1.002]";
        let containerStyle: React.CSSProperties = {};
        
        let leftAccentClass = "absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl";
        let leftAccentStyle: React.CSSProperties = {};
        
        let titleColorClass = "font-extrabold transition-colors tracking-tight text-sm md:text-base font-display";
        let titleColorStyle: React.CSSProperties = {};

        let textColorClass = "text-xs line-clamp-2 leading-normal font-medium pt-1.5 border-t";
        let textColorStyle: React.CSSProperties = {};

        let badgeClass = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase shadow-xs";
        let badgeStyle: React.CSSProperties = {};

        let controlsBtnClass = "p-1 rounded-full border text-slate-600 hover:text-slate-900 active:scale-95 transition-all cursor-pointer shadow-xs";
        let controlsIndicatorClass = "text-[10px] font-mono font-bold px-0.5 select-none text-slate-400";
        let dotClassBase = "h-1 transition-all duration-300 cursor-pointer";

        let isDarkTheme = false;

        // Apply Preset Themes
        if (bgType === 'preset') {
          if (presetTheme === 'amber') {
            containerClass += " bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 hover:from-amber-100/50 hover:via-white hover:to-orange-100/30 border border-amber-200 hover:border-amber-300";
            leftAccentClass += " bg-gradient-to-b from-amber-400 to-orange-500";
            titleColorClass += " text-slate-900 group-hover:text-amber-800";
            textColorClass += " text-slate-500 border-amber-200/20";
            badgeClass += " bg-amber-500 text-white";
            controlsBtnClass += " bg-white hover:bg-slate-50 border-slate-200/60";
          } else if (presetTheme === 'emerald') {
            containerClass += " bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 hover:from-emerald-100/50 hover:via-white hover:to-teal-100/30 border border-emerald-200 hover:border-emerald-300";
            leftAccentClass += " bg-gradient-to-b from-emerald-400 to-teal-500";
            titleColorClass += " text-slate-900 group-hover:text-teal-800";
            textColorClass += " text-slate-500 border-emerald-200/20";
            badgeClass += " bg-emerald-600 text-white";
            controlsBtnClass += " bg-white hover:bg-slate-50 border-slate-200/60";
          } else if (presetTheme === 'indigo') {
            containerClass += " bg-gradient-to-br from-indigo-50/60 via-white to-violet-50/40 hover:from-indigo-100/50 hover:via-white hover:to-violet-100/30 border border-indigo-200 hover:border-indigo-300";
            leftAccentClass += " bg-gradient-to-b from-indigo-400 to-violet-500";
            titleColorClass += " text-slate-900 group-hover:text-indigo-800";
            textColorClass += " text-slate-500 border-indigo-200/20";
            badgeClass += " bg-indigo-600 text-white";
            controlsBtnClass += " bg-white hover:bg-slate-50 border-slate-200/60";
          } else if (presetTheme === 'rose') {
            containerClass += " bg-gradient-to-br from-rose-50/60 via-white to-pink-50/40 hover:from-rose-100/50 hover:via-white hover:to-pink-100/30 border border-rose-200 hover:border-rose-300";
            leftAccentClass += " bg-gradient-to-b from-rose-400 to-pink-500";
            titleColorClass += " text-slate-900 group-hover:text-rose-800";
            textColorClass += " text-slate-500 border-rose-200/20";
            badgeClass += " bg-rose-500 text-white";
            controlsBtnClass += " bg-white hover:bg-slate-50 border-slate-200/60";
          } else if (presetTheme === 'ocean') {
            containerClass += " bg-gradient-to-br from-blue-50/60 via-white to-cyan-50/40 hover:from-blue-100/50 hover:via-white hover:to-cyan-100/30 border border-blue-200 hover:border-blue-300";
            leftAccentClass += " bg-gradient-to-b from-blue-400 to-cyan-500";
            titleColorClass += " text-slate-900 group-hover:text-blue-800";
            textColorClass += " text-slate-500 border-blue-200/20";
            badgeClass += " bg-blue-500 text-white";
            controlsBtnClass += " bg-white hover:bg-slate-50 border-slate-200/60";
          } else if (presetTheme === 'dark') {
            containerClass += " bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 hover:from-slate-800 hover:via-slate-900 hover:to-slate-850 border border-slate-700 hover:border-slate-600 shadow-md";
            leftAccentClass += " bg-gradient-to-b from-amber-400 to-orange-500";
            titleColorClass += " text-white group-hover:text-amber-400";
            textColorClass += " text-slate-400 border-slate-800";
            badgeClass += " bg-amber-500 text-white";
            controlsBtnClass += " bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white";
            controlsIndicatorClass += " text-slate-500";
            isDarkTheme = true;
          }
        } else if (bgType === 'custom_solid') {
          const bgColor = settings.hotJobsCardBgColor || '#ffffff';
          const titleColor = settings.hotJobsCardTitleColor || '#0f172a';
          const textColor = settings.hotJobsCardTextColor || '#475569';
          const borderColor = settings.hotJobsCardBorderColor || '#fde68a';
          const accentColor = settings.hotJobsCardAccentColor || '#f59e0b';

          containerStyle = { backgroundColor: bgColor, borderColor: borderColor, borderWidth: '1px' };
          leftAccentStyle = { backgroundColor: accentColor };
          titleColorStyle = { color: titleColor };
          textColorStyle = { color: textColor, borderTopColor: `${borderColor}30` };
          badgeStyle = { backgroundColor: accentColor, color: '#ffffff' };
          controlsBtnClass += " bg-white hover:bg-slate-50 border-slate-200/60";

          // Determine if custom bg is dark for icon/text styling
          const hex = bgColor.replace('#', '');
          if (hex.length === 6) {
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            if (brightness < 140) {
              isDarkTheme = true;
            }
          }
        } else if (bgType === 'custom_gradient') {
          const fromColor = settings.hotJobsCardBgGradientFrom || '#fff7ed';
          const toColor = settings.hotJobsCardBgGradientTo || '#ffedd5';
          const titleColor = settings.hotJobsCardTitleColor || '#0f172a';
          const textColor = settings.hotJobsCardTextColor || '#475569';
          const borderColor = settings.hotJobsCardBorderColor || '#fde68a';
          const accentColor = settings.hotJobsCardAccentColor || '#f59e0b';

          containerStyle = { 
            background: `linear-gradient(135deg, ${fromColor}, ${toColor})`, 
            borderColor: borderColor, 
            borderWidth: '1px' 
          };
          leftAccentStyle = { backgroundColor: accentColor };
          titleColorStyle = { color: titleColor };
          textColorStyle = { color: textColor, borderTopColor: `${borderColor}30` };
          badgeStyle = { backgroundColor: accentColor, color: '#ffffff' };
          controlsBtnClass += " bg-white hover:bg-slate-50 border-slate-200/60";

          // Check brightness of 'from' to determine theme brightness
          const hex = fromColor.replace('#', '');
          if (hex.length === 6) {
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            if (brightness < 140) {
              isDarkTheme = true;
            }
          }
        }

        return (
          <div 
            onClick={() => {
              if (isAutoPlaying) {
                setIsAutoPlaying(false);
              }
              onSelectJob(hotJob);
            }}
            className={containerClass}
            style={containerStyle}
          >
            {/* Glowing left highlight accent line */}
            <div className={leftAccentClass} style={leftAccentStyle} />

            {/* Glowing ambient background glow effect */}
            {!isDarkTheme && (
              <>
                <div className="absolute right-0 top-0 w-36 h-36 bg-amber-100/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute left-1/4 bottom-0 w-24 h-24 bg-orange-100/10 rounded-full blur-xl pointer-events-none" />
              </>
            )}

            {/* Header row with controls & badge */}
            <div className="flex items-center justify-between mb-4 relative z-10 pl-1.5">
              <div className="flex items-center gap-2">
                <span className={badgeClass} style={badgeStyle}>
                  <Flame size={12} className="fill-white text-white animate-pulse" />
                  {settings.hotJobsTitle || 'Hot Openings'}
                </span>
              </div>

              {/* Minimal Slider Controls */}
              {hotJobs.length > 1 && (
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAutoPlaying(false);
                      setCurrentHotIndex((prev) => (prev === 0 ? hotJobs.length - 1 : prev - 1));
                    }}
                    className={controlsBtnClass}
                    aria-label="Previous Slide"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className={controlsIndicatorClass}>
                    {activeIndex + 1}/{hotJobs.length}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAutoPlaying(false);
                      setCurrentHotIndex((prev) => (prev >= hotJobs.length - 1 ? 0 : prev + 1));
                    }}
                    className={controlsBtnClass}
                    aria-label="Next Slide"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Active Hot Job Details Inside Card */}
            <div className="flex flex-col gap-3 pl-1.5 relative z-10 mb-4 w-full">
              <div className="flex items-start sm:items-center justify-between gap-4 w-full">
                <div className="space-y-1 min-w-0 flex-1">
                  <h4 className={titleColorClass} style={titleColorStyle}>
                    {hotJob.title}
                  </h4>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-slate-500">
                    <span className={isDarkTheme ? "text-amber-400 font-extrabold" : "text-amber-700 font-extrabold"}>
                      {hotJob.companyName}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className={`flex items-center gap-0.5 font-medium text-[13px] ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}>
                      <MapPin size={11} className={isDarkTheme ? "text-amber-400" : "text-amber-500"} />
                      {hotJob.location}
                    </span>
                    {hotJob.contractType && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className={`px-1.5 py-0.5 border rounded text-[9px] font-extrabold uppercase ${
                          isDarkTheme 
                            ? "bg-slate-800 text-amber-400 border-slate-700" 
                            : "bg-amber-50 text-amber-700 border-amber-100/60"
                        }`}>
                          {hotJob.contractType}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Clean lightweight click indicator */}
                <div className={`shrink-0 self-center hidden sm:block p-1.5 rounded-lg border transition-colors ${
                  isDarkTheme 
                    ? "text-amber-400 hover:text-amber-300 bg-slate-800 border-slate-700" 
                    : "text-amber-500 group-hover:text-amber-600 bg-amber-50 border-amber-100/50"
                }`}>
                  <ChevronRight size={18} />
                </div>
              </div>

              {/* Description spanning the entire card width with more breathing space */}
              <p className={textColorClass} style={textColorStyle}>
                {hotJob.shortDescription}
              </p>
            </div>

            {/* Slider Dots indicators */}
            {hotJobs.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-auto relative z-10" onClick={(e) => e.stopPropagation()}>
                {hotJobs.map((_, dotIdx) => {
                  const isDotActive = dotIdx === activeIndex;
                  let dotStyle: React.CSSProperties = {};
                  let dotClass = dotClassBase;

                  if (isDotActive) {
                    dotClass += " w-5";
                    if (bgType !== 'preset') {
                      dotStyle = { backgroundColor: settings.hotJobsCardAccentColor || '#f59e0b' };
                    } else {
                      dotClass += presetTheme === 'emerald' ? " bg-emerald-500" :
                                 presetTheme === 'indigo' ? " bg-indigo-500" :
                                 presetTheme === 'rose' ? " bg-rose-500" :
                                 presetTheme === 'ocean' ? " bg-blue-500" : " bg-amber-500";
                    }
                  } else {
                    dotClass += " w-2";
                    if (isDarkTheme) {
                      dotClass += " bg-slate-700 hover:bg-slate-600";
                    } else {
                      dotClass += " bg-slate-200 hover:bg-slate-300";
                    }
                  }

                  return (
                    <button
                      key={dotIdx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAutoPlaying(false);
                        setCurrentHotIndex(dotIdx);
                      }}
                      className={dotClass}
                      style={dotStyle}
                      aria-label={`Go to slide ${dotIdx + 1}`}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Modern Filter Bars */}
      {settings.showJobFilters !== false && (
        <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search Job Title, Company, or Keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 transition-all text-xs text-slate-900 placeholder:text-slate-400 font-sans"
            />
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <MapPin size={16} />
            </span>
            <input
              type="text"
              placeholder="Filter by Location (e.g., Remote, Bangalore)..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 transition-all text-xs text-slate-900 placeholder:text-slate-400 font-sans"
            />
          </div>
        </div>
      )}

      {/* Jobs List Header & Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-teal-600" />
          <h3 className="font-bold text-slate-900 text-xs tracking-wider uppercase font-display">
            Live Openings
          </h3>
        </div>
        <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200/60 px-2.5 py-1 rounded-full font-semibold font-display">
          {filteredJobs.length} {filteredJobs.length === 1 ? 'Job' : 'Jobs'} Found
        </span>
      </div>

      {/* Jobs List */}
      {filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredJobs.map((job) => {
            const idStr = String(job.id || '');
            const logoIndex = typeof job.companyLogoIndex === 'number' ? job.companyLogoIndex : (idStr ? idStr.charCodeAt(idStr.length - 1) % LOGO_GRADIENTS.length : 0);
            const logoGrad = LOGO_GRADIENTS[logoIndex % LOGO_GRADIENTS.length];
            const initials = job.companyName.substring(0, 2).toUpperCase();

            return (
              <div
                key={job.id}
                onClick={() => onSelectJob(job)}
                className="group relative bg-white p-5 rounded-xl shadow-xs border border-slate-200 hover:border-teal-300 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col gap-3.5"
              >
                {/* Dynamic Absolutely Positioned LIVE Badge with Pulsing Red Dot */}
                {job.isLive && (
                  <div className="absolute -top-2.5 right-4 flex items-center gap-1.5 px-2 py-0.5 bg-red-500 hover:bg-red-600 text-white text-[9px] font-extrabold tracking-widest uppercase rounded-md shadow-sm shadow-red-500/20 border border-red-400/30 z-10 font-display transition-colors">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-live-pulse-ring absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="animate-live-pulse-dot relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                    </span>
                    <span>LIVE</span>
                  </div>
                )}

                {/* Job Logo & Basic details row */}
                <div className="flex items-start gap-4 min-w-0 w-full">
                  {/* Styled logo container: display image if available, else show the selected color preset gradient */}
                  {job.companyLogoUrl ? (
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200/60 flex items-center justify-center shrink-0 bg-slate-50 shadow-xs">
                      <img
                        src={job.companyLogoUrl}
                        alt={`${job.companyName} logo`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.className = `w-12 h-12 rounded-xl bg-gradient-to-br ${logoGrad} flex items-center justify-center font-bold text-[13px] tracking-wide shadow-xs shrink-0 font-display uppercase`;
                            parent.innerHTML = `<span>${initials}</span>`;
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${logoGrad} flex items-center justify-center font-bold text-[13px] tracking-wide shadow-xs shrink-0 font-display uppercase`}>
                      <span>{initials}</span>
                    </div>
                  )}

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-slate-900 group-hover:text-teal-600 transition-colors tracking-tight text-sm font-display break-words">
                        {job.title}
                      </h4>
                    </div>

                    <p className="text-[11px] font-semibold text-slate-500 flex flex-wrap items-center gap-1.5">
                      <span className="text-slate-800 font-bold">{job.companyName}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <MapPin size={11} className="inline text-slate-400" />
                        {job.location}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-500 bg-slate-50 border border-slate-200/50 px-1.5 py-0.5 rounded-md text-[10px] font-medium font-mono">
                        <Clock size={11} className="inline text-indigo-500" />
                        <span>{getRelativeTime(job.datePosted, job.createdAt)}</span>
                      </span>
                    </p>
                  </div>
                </div>

                {/* Description spanning the entire job card width with more horizontal and vertical breathing space */}
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed pt-1.5 border-t border-slate-100">
                  {job.shortDescription}
                </p>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-xs">
          <div className="w-12 h-12 bg-gray-50 flex items-center justify-center text-gray-400 rounded-full mx-auto mb-3">
            <Briefcase size={20} />
          </div>
          <h4 className="font-extrabold text-gray-900 text-sm">No live jobs found</h4>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, selecting different terms, or checking back later for newly published careers!
          </p>
        </div>
      )}

    </div>
  );
}
