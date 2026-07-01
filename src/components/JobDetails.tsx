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
      setIsBookmarked(ids.map(String).includes(String(job.id)));
    }
  }, [job.id]);

  const handleToggleBookmark = () => {
    const saved = localStorage.getItem('jobview_bookmarked_jobs');
    let ids: string[] = saved ? JSON.parse(saved).map(String) : [];
    const jobIdStr = String(job.id);
    
    if (isBookmarked) {
      ids = ids.filter(id => id !== jobIdStr);
      setIsBookmarked(false);
    } else {
      ids.push(jobIdStr);
      setIsBookmarked(true);
      window.showJobSavedToast?.('Job Saved!');
    }
    localStorage.setItem('jobview_bookmarked_jobs', JSON.stringify(ids));
  };

  const handleShare = () => {
    // Generate simple shareable simulated link using window.location.origin
    const shareUrl = `${window.location.origin}/?job_id=${String(job.id)}`;
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
        <div className="flex flex-col sm:flex-row items-start gap-4 border-b border-slate-100 pb-6">
          {/* Logo container */}
          {job.companyLogoUrl ? (
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200/80 flex items-center justify-center shrink-0 bg-slate-50 shadow-xs">
              <img
                src={job.companyLogoUrl}
                alt={`${job.companyName} logo`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain p-1.5"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.className = "w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center font-bold text-lg text-amber-700 tracking-wide shadow-xs shrink-0 font-display";
                    parent.innerHTML = `
                      <svg class="w-8 h-8 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M4 5l8-3 8 3M12 10v11" />
                      </svg>
                    `;
                  }
                }}
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center font-bold text-lg text-amber-700 tracking-wide shadow-xs shrink-0 font-display">
              <svg className="w-8 h-8 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M4 5l8-3 8 3M12 10v11" />
              </svg>
            </div>
          )}

          <div className="space-y-2 flex-1">
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
        <div className="grid grid-cols-1 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50 flex items-center gap-3">
            <div className="w-9 h-9 bg-white text-teal-600 rounded-lg border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
              <Briefcase size={16} />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-display">Employment Type</p>
              <p className="text-xs font-bold text-slate-800">{job.contractType || "Full-Time / Direct Hiring"}</p>
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



      </div>

      {/* Action Sheet (Sleek Bottom Section) */}
      {((job.emailEnabled !== false && job.email) || (job.callEnabled !== false && job.phone) || (job.whatsappEnabled !== false && job.whatsapp) || (job.applyEnabled !== false && job.applyLink)) && (
        <div className="border border-slate-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 rounded-2xl shadow-xs">
          <div className="space-y-1 text-center sm:text-left w-full sm:w-auto">
            <h4 className="text-xs font-bold tracking-wider uppercase text-slate-400 font-display">
              Send your CV / HR Contact
            </h4>
            <p className="text-[10px] text-slate-500">
              Apply directly or reach out to the recruiter via the contacts below.
            </p>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto justify-center sm:justify-start">
            {/* Email */}
            {job.emailEnabled !== false && job.email && (
              <a
                href={`mailto:${job.email}?subject=${emailSubject}&body=${emailBody}`}
                title="Apply via Email"
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-white hover:bg-slate-100 shadow-xs border border-slate-200 text-teal-600 transition-colors cursor-pointer"
              >
                <Mail size={18} />
              </a>
            )}
            
            {/* Phone */}
            {job.callEnabled !== false && job.phone && (
              <a
                href={`tel:${job.phone}`}
                title="Call Recruiter Direct"
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-white hover:bg-slate-100 shadow-xs border border-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                <Phone size={18} />
              </a>
            )}
            
            {/* WhatsApp */}
            {job.whatsappEnabled !== false && job.whatsapp && (
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
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.454 5.709 1.455h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            )}
          </div>
          
          {job.applyEnabled !== false && job.applyLink && (
            <a
              href={job.applyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 text-center bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-md shadow-teal-600/10 hover:shadow-teal-600/20 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer font-display"
            >
              <span>Apply Job</span>
              <ExternalLink size={15} />
            </a>
          )}
        </div>
      )}

    </div>
  );
}
