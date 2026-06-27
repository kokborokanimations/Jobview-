/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Job } from '../types';
import { 
  ArrowLeft, MapPin, DollarSign, Calendar, ExternalLink, 
  Mail, Phone, Share2, Bookmark, Check, Briefcase, Award 
} from 'lucide-react';

interface JobDetailsProps {
  job: Job;
  onBack: () => void;
}

export default function JobDetails({ job, onBack }: JobDetailsProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isShared, setIsShared] = useState(false);

  // Check bookmarks
  useEffect(() => {
    const saved = localStorage.getItem('jobview_bookmarked_jobs');
    if (saved) {
      const ids = JSON.parse(saved) as string[];
      setIsBookmarked(ids.includes(job.id));
    }
  }, [job.id]);

  const handleToggleBookmark = () => {
    const saved = localStorage.getItem('jobview_bookmarked_jobs');
    let ids: string[] = saved ? JSON.parse(saved) : [];
    
    if (isBookmarked) {
      ids = ids.filter(id => id !== job.id);
      setIsBookmarked(false);
    } else {
      ids.push(job.id);
      setIsBookmarked(true);
    }
    localStorage.setItem('jobview_bookmarked_jobs', JSON.stringify(ids));
  };

  const handleShare = () => {
    // Generate simple shareable simulated link using window.location.origin
    const shareUrl = `${window.location.origin}/?job_id=${job.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setIsShared(true);
      setTimeout(() => setIsShared(false), 2500);
    }).catch(err => {
      console.error('Clipboard copy failed', err);
    });
  };

  // WhatsApp click generator
  const getWhatsAppLink = () => {
    const cleanPhone = job.whatsapp ? job.whatsapp.replace(/\D/g, '') : '';
    const text = encodeURIComponent(
      `Hello! I found your opening for "${job.title}" at "${job.companyName}" on Jobview. I would love to share my portfolio and discuss the vacancy further.`
    );
    return `https://wa.me/${cleanPhone || '919999999999'}?text=${text}`;
  };

  const emailSubject = encodeURIComponent(`Job Application: ${job.title} - Jobview`);
  const emailBody = encodeURIComponent(`Dear Hiring Team,\n\nI am writing to express my strong interest in the "${job.title}" position at "${job.companyName}" advertised on Jobview.\n\nPlease find attached my resume for your consideration.\n\nBest regards,\n[Your Name]`);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 space-y-6">
      
      {/* Back Button & Action Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Feed</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Bookmark Button */}
          <button
            onClick={handleToggleBookmark}
            title={isBookmarked ? "Remove Bookmark" : "Bookmark Job"}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isBookmarked
                ? 'bg-amber-50 border-amber-200 text-amber-500 hover:bg-amber-100'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            title="Copy Job Link"
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all flex items-center gap-1 cursor-pointer"
          >
            {isShared ? (
              <Check size={18} className="text-emerald-600" />
            ) : (
              <Share2 size={18} />
            )}
            <span className="text-xs font-bold px-0.5 hidden sm:inline">
              {isShared ? 'Copied!' : 'Share'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Job Detail Card */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 space-y-6 shadow-xs">
        
        {/* Header Summary */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <span className="px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 rounded-full inline-flex items-center gap-1 mb-1 border border-emerald-100/60">
              <span className="w-1 h-1 bg-emerald-500 rounded-full" />
              Verified & Active
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
              {job.title}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-semibold text-slate-500">
              <span className="text-slate-900 font-bold text-sm">{job.companyName}</span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-0.5">
                <MapPin size={13} className="text-slate-400 inline" />
                {job.location}
              </span>
              {job.salary && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-0.5 text-slate-900 font-bold">
                    💰 {job.salary}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50 flex items-center gap-3">
            <div className="w-9 h-9 bg-white text-teal-600 rounded-lg border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
              <Briefcase size={16} />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-display">Employment Type</p>
              <p className="text-xs font-bold text-slate-800">Full-Time / Direct Hiring</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50 flex items-center gap-3">
            <div className="w-9 h-9 bg-white text-teal-600 rounded-lg border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
              <Calendar size={16} />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-display">Posted Date</p>
              <p className="text-xs font-bold text-slate-800">
                {new Date(job.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Full Job Description Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-display">
            <span className="w-1 h-3 bg-teal-600 rounded-full" />
            Job Description
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-5 rounded-xl border border-slate-200/50">
            {job.fullDescription}
          </p>
        </div>

        {/* Qualifications Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-display">
            <span className="w-1 h-3 bg-teal-600 rounded-full" />
            Core Qualifications
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-5 rounded-xl border border-slate-200/50">
            {job.qualifications}
          </p>
        </div>

      </div>

      {/* Action Sheet (Sleek Bottom Section) */}
      {((job.emailEnabled !== false) || (job.callEnabled !== false) || (job.whatsappEnabled !== false) || (job.applyEnabled !== false)) && (
        <div className="border border-slate-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 rounded-2xl shadow-xs">
          <div className="space-y-1 text-center sm:text-left hidden md:block">
            <h4 className="text-xs font-bold tracking-wider uppercase text-slate-400 font-display">
              Contact & Apply Channel
            </h4>
            <p className="text-[10px] text-slate-500 leading-none">
              Choose your preferred channel below.
            </p>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto justify-center sm:justify-start">
            {/* Email */}
            {job.emailEnabled !== false && (
              <a
                href={`mailto:${job.email}?subject=${emailSubject}&body=${emailBody}`}
                title="Apply via Email"
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-white hover:bg-slate-100 shadow-xs border border-slate-200 text-teal-600 transition-colors cursor-pointer"
              >
                <Mail size={18} />
              </a>
            )}
            
            {/* Phone */}
            {job.callEnabled !== false && (
              <a
                href={`tel:${job.phone}`}
                title="Call Recruiter Direct"
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-white hover:bg-slate-100 shadow-xs border border-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                <Phone size={18} />
              </a>
            )}
            
            {/* WhatsApp */}
            {job.whatsappEnabled !== false && (
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                title="Chat on WhatsApp"
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-all hover:scale-102 cursor-pointer"
              >
                <svg 
                  className="w-5 h-5 fill-current" 
                  viewBox="0 0 24 24"
                >
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.062 5.248 5.316.002 11.758.002c3.126 0 6.066 1.214 8.275 3.425 2.211 2.213 3.425 5.161 3.421 8.286-.007 6.502-5.261 11.748-11.7 11.748-2.003-.001-3.97-.512-5.711-1.488L0 24zm6.39-4.852c1.653.98 3.273 1.498 4.861 1.499 5.347 0 9.7-.4.004-9.699C20.9 6.27 16.55 1.93 11.761 1.93 6.969 1.93 3.07 5.83 3.067 10.621c-.002 1.683.504 3.327 1.464 4.71L3.58 19.3l4.083-1.071c-.001 0-.001.001 0 0zm11.72-4.89c-.272-.137-1.61-.795-1.86-.885-.25-.09-.432-.136-.613.136-.18.273-.703.885-.862 1.067-.158.182-.317.204-.589.068-.272-.136-1.15-.424-2.19-1.353-.809-.721-1.355-1.613-1.514-1.886-.159-.272-.017-.42.119-.556.123-.122.272-.318.408-.477.136-.159.182-.272.272-.454.09-.181.045-.34-.022-.477-.068-.136-.613-1.477-.84-2.022-.22-.533-.48-.46-.613-.466-.114-.006-.245-.007-.376-.007-.132 0-.346.05-.527.25-.181.2-.693.677-.693 1.654s.71 1.916.81 2.052c.099.136 1.398 2.134 3.387 2.992.473.204.842.326 1.13.418.476.151.909.13 1.25.079.382-.057 1.61-.659 1.838-1.296.227-.636.227-1.181.159-1.295-.068-.114-.25-.182-.523-.319z"/>
                </svg>
              </a>
            )}
          </div>
          
          {job.applyEnabled !== false && (
            <a
              href={job.applyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 text-center bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-md shadow-teal-600/10 hover:shadow-teal-600/20 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer font-display"
            >
              <span>Apply Website</span>
              <ExternalLink size={15} />
            </a>
          )}
        </div>
      )}

    </div>
  );
}
