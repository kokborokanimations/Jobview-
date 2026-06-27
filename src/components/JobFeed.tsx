/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Job, AdminSettings } from '../types';
import { Search, MapPin, Briefcase, Calendar, ChevronRight, Activity, Bookmark, Share2, Check } from 'lucide-react';

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

  const [bookmarkedJobIds, setBookmarkedJobIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('jobview_bookmarked_jobs');
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
    localStorage.setItem('jobview_bookmarked_jobs', JSON.stringify(updated));
  };

  const handleShare = (jobId: string) => {
    const shareUrl = `${window.location.origin}/?job_id=${jobId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setSharedJobId(jobId);
      setTimeout(() => setSharedJobId(null), 2000);
    }).catch(err => console.error(err));
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.companyName.toLowerCase().includes(search.toLowerCase()) ||
      job.shortDescription.toLowerCase().includes(search.toLowerCase());
    const matchesLocation = job.location.toLowerCase().includes(location.toLowerCase());
    return matchesSearch && matchesLocation && job.isLive;
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 space-y-6">
      
      {/* Dynamic Job Feed Banner */}
      {settings.bannerUrl && (
        <div className="relative h-32 md:h-36 rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
          <img
            src={settings.bannerUrl}
            alt="Careers Banner"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent flex flex-col justify-end p-5">
            <span className="px-2 py-0.5 bg-teal-600 text-white text-[9px] font-bold tracking-widest uppercase rounded self-start mb-1.5 shadow-xs font-display">
              Discover Jobs
            </span>
            <h2 className="text-base md:text-lg font-bold text-white leading-tight tracking-tight font-display">
              Work with the most innovative companies on the planet
            </h2>
            <p className="text-[10px] text-slate-200 mt-0.5 font-medium hidden sm:block">
              Apply in seconds and text hiring managers directly.
            </p>
          </div>
        </div>
      )}

      {/* Modern Filter Bars */}
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
            const logoGrad = LOGO_GRADIENTS[job.companyLogoIndex % LOGO_GRADIENTS.length];
            const initials = job.companyName.substring(0, 2).toUpperCase();

            return (
              <div
                key={job.id}
                onClick={() => onSelectJob(job)}
                className="group relative bg-white p-5 rounded-xl shadow-xs border border-slate-200 hover:border-teal-300 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Job Logo & Basic details */}
                <div className="flex items-start gap-4">
                  {/* Styled Placeholder Logo with dynamic brand gradient */}
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${logoGrad} flex items-center justify-center font-bold text-[13px] tracking-wide shadow-xs shrink-0 font-display`}>
                    {initials}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-slate-900 group-hover:text-teal-600 transition-colors tracking-tight text-sm font-display">
                        {job.title}
                      </h4>
                      <span className="inline-flex items-center gap-1 text-[9px] font-semibold tracking-wider uppercase bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-100/60">
                        <span className="w-1 h-1 bg-teal-500 rounded-full" />
                        Active
                      </span>
                    </div>

                    <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                      <span className="text-slate-800 font-bold">{job.companyName}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <MapPin size={11} className="inline text-slate-400" />
                        {job.location}
                      </span>
                    </p>

                    <p className="text-xs text-slate-600 line-clamp-2 pr-6 mt-1.5 leading-relaxed">
                      {job.shortDescription}
                    </p>
                  </div>
                </div>

                {/* Right side element with salary & action */}
                <div className="flex sm:flex-col items-end justify-between sm:justify-center w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 gap-2">
                  {job.salary && (
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900 font-display">
                        {job.salary}
                      </span>
                      <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest font-display">
                        EST. PACKAGE
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mt-1">
                    {/* Bookmark Icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleBookmark(job.id);
                      }}
                      className={`p-2 rounded-lg border transition-all cursor-pointer ${
                        bookmarkedJobIds.includes(job.id)
                          ? 'border-amber-200 bg-amber-50 text-amber-600'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600'
                      }`}
                      title={bookmarkedJobIds.includes(job.id) ? 'Remove Bookmark' : 'Bookmark Job'}
                    >
                      <Bookmark size={13} fill={bookmarkedJobIds.includes(job.id) ? 'currentColor' : 'none'} />
                    </button>

                    {/* Share Icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(job.id);
                      }}
                      className={`p-2 rounded-lg border transition-all cursor-pointer ${
                        sharedJobId === job.id
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600'
                      }`}
                      title="Share Job Link"
                    >
                      {sharedJobId === job.id ? <Check size={13} /> : <Share2 size={13} />}
                    </button>
                    
                    <div className="inline-flex items-center gap-1 text-[11px] text-teal-600 font-bold group-hover:translate-x-0.5 transition-transform font-display ml-1.5">
                      <span>View</span>
                      <ChevronRight size={12} />
                    </div>
                  </div>
                </div>

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
