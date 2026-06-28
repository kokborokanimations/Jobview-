/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Job, CommunityPost, User, AdminSettings, PaymentLog } from '../types';
import { 
  Settings, Briefcase, Users, CreditCard, Shield, Plus, 
  Trash2, Edit, Save, ToggleLeft, ToggleRight, Check, RefreshCw, EyeOff, Eye,
  Clock, CheckCircle, FileText, Globe
} from 'lucide-react';
import WysiwygEditor from './WysiwygEditor';
import { getUserBadge, getTrialInfo } from '../lib/badgeUtils';

interface AdminPanelProps {
  settings: AdminSettings;
  jobs: Job[];
  posts: CommunityPost[];
  users: User[];
  onUpdateSettings: (newSettings: AdminSettings) => Promise<boolean>;
  onAddJob: (job: Omit<Job, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateJob: (id: string, jobUpdates: Partial<Job>) => Promise<void>;
  onDeleteJob: (id: string) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
  onUpdateUserSubscription: (userId: string, updates: { subscriptionStatus: string; trialExpiryDate?: string }) => Promise<void>;
  onRefreshPages?: () => void;
  onApprovePost?: (postId: string) => void;
  onDeleteUser?: (userId: string) => Promise<void>;
}

export default function AdminPanel({
  settings,
  jobs,
  posts,
  users,
  onUpdateSettings,
  onAddJob,
  onUpdateJob,
  onDeleteJob,
  onDeletePost,
  onUpdateUserSubscription,
  onRefreshPages,
  onApprovePost,
  onDeleteUser
}: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'branding' | 'pricing' | 'users' | 'cashfree' | 'posts' | 'pages'>('branding');
  
  // Settings Form state
  const [brandName, setBrandName] = useState(settings.brandName || '');
  const [tagline, setTagline] = useState(settings.tagline || '');
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const [bannerUrl, setBannerUrl] = useState(settings.bannerUrl || '');
  const [bannerHtml, setBannerHtml] = useState(settings.bannerHtml || '');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [premiumMode, setPremiumMode] = useState(settings.premiumMode);
  const [membershipPrice, setMembershipPrice] = useState(settings.membershipPrice || 499);
  const [currency, setCurrency] = useState(settings.currency || 'INR');
  const [paywallFeaturesText, setPaywallFeaturesText] = useState((settings.paywallFeatures || []).join('\n'));
  const [cashfreeAppId, setCashfreeAppId] = useState(settings.cashfreeAppId || '');
  const [cashfreeSecretKey, setCashfreeSecretKey] = useState(settings.cashfreeSecretKey || '');
  const [postApprovalMode, setPostApprovalMode] = useState(settings.postApprovalMode || false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // Secret Keys visibility toggle
  const [showSecret, setShowSecret] = useState(false);

  // Job creation Form state
  const [isAddingJob, setIsAddingJob] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  
  const [jobTitle, setJobTitle] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobSalary, setJobSalary] = useState('');
  const [jobShortDesc, setJobShortDesc] = useState('');
  const [jobFullDesc, setJobFullDesc] = useState('');
  const [jobQualifications, setJobQualifications] = useState('');
  const [jobApplyLink, setJobApplyLink] = useState('');
  const [jobEmail, setJobEmail] = useState('');
  const [jobPhone, setJobPhone] = useState('');
  const [jobWhatsapp, setJobWhatsapp] = useState('');
  const [jobLogoIndex, setJobLogoIndex] = useState(0);
  const [jobWhatsappEnabled, setJobWhatsappEnabled] = useState(true);
  const [jobCallEnabled, setJobCallEnabled] = useState(true);
  const [jobEmailEnabled, setJobEmailEnabled] = useState(true);
  const [jobApplyEnabled, setJobApplyEnabled] = useState(true);

  // Payment Logs
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [isDeletingJob, setIsDeletingJob] = useState(false);

  const [adminPosts, setAdminPosts] = useState<CommunityPost[]>(posts);
  const [pages, setPages] = useState<any[]>([]);
  const [isEditingPage, setIsEditingPage] = useState<boolean>(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [pageContent, setPageContent] = useState('');
  const [pageIsVisible, setPageIsVisible] = useState(true);

  useEffect(() => {
    setAdminPosts(posts);
  }, [posts]);

  // Synchronize local form states when settings prop is updated from server/parent
  useEffect(() => {
    setBrandName(settings.brandName || '');
    setTagline(settings.tagline || '');
    setLogoUrl(settings.logoUrl || '');
    setBannerUrl(settings.bannerUrl || '');
    setBannerHtml(settings.bannerHtml || '');
    setPremiumMode(settings.premiumMode);
    setMembershipPrice(settings.membershipPrice || 499);
    setCurrency(settings.currency || 'INR');
    setPaywallFeaturesText((settings.paywallFeatures || []).join('\n'));
    setCashfreeAppId(settings.cashfreeAppId || '');
    setCashfreeSecretKey(settings.cashfreeSecretKey || '');
    setPostApprovalMode(settings.postApprovalMode || false);
  }, [settings]);

  const handleApprovePost = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/approve`, {
        method: 'PUT'
      });
      if (res.ok) {
        setAdminPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'Live' } : p));
        if (onApprovePost) {
          onApprovePost(postId);
        }
        alert('Post approved successfully!');
      } else {
        alert('Failed to approve post.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error approving post.');
    }
  };

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/pages');
      if (res.ok) {
        const data = await res.json();
        setPages(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handlePageSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      title: pageTitle,
      slug: pageSlug.toLowerCase().trim().replace(/\s+/g, '-'),
      content: pageContent,
      isVisibleInFooter: pageIsVisible
    };

    try {
      if (editingPageId) {
        const res = await fetch(`/api/pages/${editingPageId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          alert('Custom page updated successfully!');
          fetchPages();
          onRefreshPages?.();
          setIsEditingPage(false);
          resetPageForm();
        }
      } else {
        const res = await fetch('/api/pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          alert('Custom page created successfully!');
          fetchPages();
          onRefreshPages?.();
          setIsEditingPage(false);
          resetPageForm();
        }
      }
    } catch (e) {
      console.error(e);
      alert('Error saving custom page.');
    }
  };

  const handleDeletePage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom page?')) return;
    try {
      const res = await fetch(`/api/pages/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchPages();
        onRefreshPages?.();
        alert('Custom page deleted!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resetPageForm = () => {
    setPageTitle('');
    setPageSlug('');
    setPageContent('');
    setPageIsVisible(true);
    setEditingPageId(null);
  };

  useEffect(() => {
    fetchPaymentLogs();
  }, []);

  const fetchPaymentLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/payments/logs');
      if (res.ok) {
        const data = await res.json();
        setPaymentLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (isSavingSettings) return;

    const features = paywallFeaturesText
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const propFeatures = settings.paywallFeatures || [];

    const hasChanges =
      brandName !== (settings.brandName || '') ||
      tagline !== (settings.tagline || '') ||
      logoUrl !== (settings.logoUrl || '') ||
      bannerUrl !== (settings.bannerUrl || '') ||
      bannerHtml !== (settings.bannerHtml || '') ||
      premiumMode !== settings.premiumMode ||
      Number(membershipPrice) !== (settings.membershipPrice || 499) ||
      currency !== (settings.currency || 'INR') ||
      cashfreeAppId !== (settings.cashfreeAppId || '') ||
      cashfreeSecretKey !== (settings.cashfreeSecretKey || '') ||
      postApprovalMode !== (settings.postApprovalMode || false) ||
      JSON.stringify(features) !== JSON.stringify(propFeatures);

    if (!hasChanges) {
      if (window.showWarningToast) {
        window.showWarningToast('No changes detected');
      } else {
        alert('No changes detected');
      }
      return;
    }

    setIsSavingSettings(true);
    try {
      const success = await onUpdateSettings({
        brandName,
        tagline,
        logoUrl,
        bannerUrl,
        bannerHtml,
        premiumMode,
        membershipPrice: Number(membershipPrice),
        currency,
        paywallFeatures: features,
        cashfreeAppId,
        cashfreeSecretKey,
        postApprovalMode
      });

      if (success) {
        if (window.showSuccessToast) {
          window.showSuccessToast('Settings Saved Successfully!');
        } else {
          alert('Application branding and credentials successfully saved on server.');
        }
      } else {
        alert('Failed to save settings. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleCreateJobSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingJobId;
    if (editingJobId) {
      await onUpdateJob(editingJobId, {
        title: jobTitle,
        companyName: jobCompany,
        location: jobLocation,
        salary: jobSalary,
        shortDescription: jobShortDesc,
        fullDescription: jobFullDesc,
        qualifications: jobQualifications,
        applyLink: jobApplyLink,
        email: jobEmail,
        phone: jobPhone,
        whatsapp: jobWhatsapp,
        companyLogoIndex: Number(jobLogoIndex),
        whatsappEnabled: jobWhatsappEnabled,
        callEnabled: jobCallEnabled,
        emailEnabled: jobEmailEnabled,
        applyEnabled: jobApplyEnabled
      });
      setEditingJobId(null);
    } else {
      await onAddJob({
        title: jobTitle,
        companyName: jobCompany,
        location: jobLocation,
        salary: jobSalary,
        shortDescription: jobShortDesc,
        fullDescription: jobFullDesc,
        qualifications: jobQualifications,
        applyLink: jobApplyLink,
        email: jobEmail,
        phone: jobPhone,
        whatsapp: jobWhatsapp,
        companyLogoIndex: Number(jobLogoIndex),
        isLive: true,
        whatsappEnabled: jobWhatsappEnabled,
        callEnabled: jobCallEnabled,
        emailEnabled: jobEmailEnabled,
        applyEnabled: jobApplyEnabled
      });
      setIsAddingJob(false);
    }

    // Trigger the minimal centered success popup
    window.showJobSavedToast?.(isEdit ? 'Job Saved!' : 'Job Published!');

    // Reset Job creation form
    setJobTitle('');
    setJobCompany('');
    setJobLocation('');
    setJobSalary('');
    setJobShortDesc('');
    setJobFullDesc('');
    setJobQualifications('');
    setJobApplyLink('');
    setJobEmail('');
    setJobPhone('');
    setJobWhatsapp('');
    setJobLogoIndex(0);
    setJobWhatsappEnabled(true);
    setJobCallEnabled(true);
    setJobEmailEnabled(true);
    setJobApplyEnabled(true);
  };

  const handleEditJobClick = (job: Job) => {
    setEditingJobId(job.id);
    setJobTitle(job.title);
    setJobCompany(job.companyName);
    setJobLocation(job.location);
    setJobSalary(job.salary || '');
    setJobShortDesc(job.shortDescription);
    setJobFullDesc(job.fullDescription);
    setJobQualifications(job.qualifications);
    setJobApplyLink(job.applyLink);
    setJobEmail(job.email);
    setJobPhone(job.phone);
    setJobWhatsapp(job.whatsapp);
    setJobLogoIndex(job.companyLogoIndex);
    setJobWhatsappEnabled(job.whatsappEnabled !== false);
    setJobCallEnabled(job.callEnabled !== false);
    setJobEmailEnabled(job.emailEnabled !== false);
    setJobApplyEnabled(job.applyEnabled !== false);
    setIsAddingJob(true);
  };

  const handleToggleJobLive = async (job: Job) => {
    await onUpdateJob(job.id, { isLive: !job.isLive });
  };

  const handleTrialExtend = async (user: User) => {
    // Extend trial by 15 days from current date or expiry date
    const currentExpiry = new Date(user.trialExpiryDate);
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    const extendedDate = new Date(baseDate.getTime() + 15 * 24 * 60 * 60 * 1000);

    await onUpdateUserSubscription(user.id, {
      subscriptionStatus: 'Free Trial',
      trialExpiryDate: extendedDate.toISOString()
    });

    alert(`Trial extended until ${extendedDate.toLocaleDateString()} for ${user.email}`);
  };

  const handleUserOverrideStatus = async (user: User, status: 'Free Trial' | 'Active' | 'Expired') => {
    const updates: { subscriptionStatus: string; trialExpiryDate?: string } = {
      subscriptionStatus: status
    };
    if (status === 'Free Trial') {
      // Extend to 30 days from now
      updates.trialExpiryDate = new Date(Date.now() + 30 * 86400000).toISOString();
    }
    await onUpdateUserSubscription(user.id, updates);
  };

  const handleFileUpload = async (file: File, name: string): Promise<string | null> => {
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
              name: name
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
          alert('Failed to connect to upload service.');
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

  const handleLogoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploadingLogo(true);
      const url = await handleFileUpload(e.target.files[0], 'app_logo');
      setIsUploadingLogo(false);
      if (url) {
        setLogoUrl(url);
      }
    }
  };

  const handleBannerChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploadingBanner(true);
      const url = await handleFileUpload(e.target.files[0], 'jobs_banner');
      setIsUploadingBanner(false);
      if (url) {
        setBannerUrl(url);
      }
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 space-y-6">
      
      {/* Top Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 font-display">
            <Shield className="text-teal-600 shrink-0" size={26} />
            Admin Control Center
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-0.5">
            Synchronize, review, and moderate content, payments, pricing, and live portals in real-time.
          </p>
        </div>

        {/* Dynamic server-saved notification */}
        <div className="px-3.5 py-1.5 bg-slate-900 text-amber-400 font-mono text-[10px] font-bold rounded-xl shadow-inner inline-flex items-center gap-1.5 self-start">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          <span>WORKSPACE SECURED • PERSISTED</span>
        </div>
      </div>

      {/* Internal Subtabs Selector */}
      <div className="flex items-center gap-1.5 border-b border-gray-200 overflow-x-auto whitespace-nowrap pb-1 font-display">
        <button
          onClick={() => setActiveSubTab('branding')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${
            activeSubTab === 'branding' 
              ? 'text-teal-600 border-b-2 border-teal-600 font-extrabold' 
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          🎨 Custom Branding & Jobs CRUD
        </button>

        <button
          onClick={() => setActiveSubTab('pricing')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${
            activeSubTab === 'pricing' 
              ? 'text-teal-600 border-b-2 border-teal-600 font-extrabold' 
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          💰 Paywall & Membership Pricing
        </button>

        <button
          onClick={() => setActiveSubTab('users')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${
            activeSubTab === 'users' 
              ? 'text-teal-600 border-b-2 border-teal-600 font-extrabold' 
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          👥 User Subscriptions & Management
        </button>

        <button
          onClick={() => {
            setActiveSubTab('posts');
          }}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${
            activeSubTab === 'posts' 
              ? 'text-teal-600 border-b-2 border-teal-600 font-extrabold' 
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          📢 Community Approvals
        </button>

        <button
          onClick={() => {
            setActiveSubTab('pages');
          }}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${
            activeSubTab === 'pages' 
              ? 'text-teal-600 border-b-2 border-teal-600 font-extrabold' 
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          📄 Custom Pages Manager
        </button>

        <button
          onClick={() => {
            setActiveSubTab('cashfree');
            fetchPaymentLogs();
          }}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${
            activeSubTab === 'cashfree' 
              ? 'text-teal-600 border-b-2 border-teal-600 font-extrabold' 
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          💳 Cashfree Gateway Logs
        </button>
      </div>

      {/* SUBTAB CONTENT: BRANDING & PORTAL CONTROLS */}
      {activeSubTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form Branding */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest border-b border-gray-50 pb-2 flex items-center gap-1.5 font-display">
              <Settings size={15} className="text-teal-600" />
              General Branding
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display">App Brand Name</label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 focus:bg-white rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display">Dynamic Tagline</label>
                <input
                  type="text"
                  required
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 focus:bg-white rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                />
              </div>

              {/* App Logo */}
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display">App Logo Branding</label>
                <div className="mt-1 flex flex-col items-center gap-3 p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-50/80 transition-colors">
                  {logoUrl ? (
                    <div className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-100 shadow-sm bg-white flex items-center justify-center p-1">
                      <img src={logoUrl} alt="App Logo" className="max-w-full max-h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-2">
                      <svg className="mx-auto h-8 w-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-[10px] font-bold text-teal-600 mt-1 cursor-pointer hover:underline">
                        Upload Logo
                      </span>
                      <p className="text-[8px] text-gray-400 mt-0.5">PNG, JPG, WebP, SVG</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="logo-file-input"
                    disabled={isUploadingLogo}
                  />
                  {!logoUrl && (
                    <button
                      type="button"
                      onClick={() => document.getElementById('logo-file-input')?.click()}
                      className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-colors cursor-pointer"
                    >
                      {isUploadingLogo ? 'Uploading...' : 'Browse File'}
                    </button>
                  )}
                </div>
              </div>

              {/* Job Feed Banner */}
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display">Banner Image Upload</label>
                <div className="mt-1 flex flex-col items-center gap-3 p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-50/80 transition-colors">
                  {bannerUrl ? (
                    <div className="relative group w-full h-24 rounded-xl overflow-hidden border border-slate-100 shadow-sm bg-white">
                      <img src={bannerUrl} alt="Careers Banner" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setBannerUrl('')}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity cursor-pointer"
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-2">
                      <svg className="mx-auto h-8 w-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-[10px] font-bold text-teal-600 mt-1 cursor-pointer hover:underline">
                        Upload Banner
                      </span>
                      <p className="text-[8px] text-gray-400 mt-0.5">Landscape aspect ratio</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                    className="hidden"
                    id="banner-file-input"
                    disabled={isUploadingBanner}
                  />
                  {!bannerUrl && (
                    <button
                      type="button"
                      onClick={() => document.getElementById('banner-file-input')?.click()}
                      className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-colors cursor-pointer"
                    >
                      {isUploadingBanner ? 'Uploading...' : 'Browse File'}
                    </button>
                  )}
                </div>
              </div>

              {/* Banner Text Customization - Classic WYSIWYG Editor */}
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display block mb-1">Banner Text Customization</label>
                <WysiwygEditor 
                  value={bannerHtml}
                  onChange={(val) => setBannerHtml(val)}
                  placeholder="<h1>Discover Jobs</h1><p>Work with the most innovative companies on the planet. Apply in seconds and text hiring managers directly.</p>"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingSettings}
                className={`w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/10 flex items-center justify-center gap-1.5 font-display ${
                  isSavingSettings ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <Save size={14} className={isSavingSettings ? 'animate-spin' : ''} />
                <span>{isSavingSettings ? 'Saving Config...' : 'Save General Config'}</span>
              </button>
            </form>
          </div>

          {/* Jobs & Community Management CRUD */}
          <div className="lg:col-span-2 space-y-6">
            
           {/* CRUD Jobs Actions */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest flex items-center gap-1.5 font-display">
                  <Briefcase size={15} className="text-teal-600" />
                  Jobs Inventory Database
                </h3>
                
                {!isAddingJob ? (
                  <button
                    onClick={() => {
                      setEditingJobId(null);
                      setIsAddingJob(true);
                    }}
                    className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-600 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 font-display"
                  >
                    <Plus size={14} />
                    <span>Create Job</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsAddingJob(false)}
                    className="px-3 py-1.5 hover:bg-gray-100 text-gray-500 rounded-xl text-xs font-bold transition-colors cursor-pointer font-display"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* Add/Edit Job Form */}
              {isAddingJob && (
                <form onSubmit={handleCreateJobSubmit} className="p-4 bg-slate-50 rounded-2xl border border-gray-100 space-y-4 animate-fade-in">
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider font-display">
                    {editingJobId ? '✍️ Modify Job Post' : '🚀 Publish New Job Post'}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase">Job Title</label>
                      <input
                        type="text" required value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="Frontend Engineer"
                        className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase">Company Name</label>
                      <input
                        type="text" required value={jobCompany} onChange={(e) => setJobCompany(e.target.value)}
                        placeholder="Vercel"
                        className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase">Location</label>
                      <input
                        type="text" required value={jobLocation} onChange={(e) => setJobLocation(e.target.value)}
                        placeholder="Remote, India"
                        className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase">Salary Package / Compensation</label>
                      <input
                        type="text" value={jobSalary} onChange={(e) => setJobSalary(e.target.value)}
                        placeholder="₹15,00,000 - ₹20,00,000 / yr"
                        className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase">Application URL</label>
                      <input
                        type="url" required value={jobApplyLink} onChange={(e) => setJobApplyLink(e.target.value)}
                        placeholder="https://vercel.com/careers"
                        className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase">HR Recruiter Email</label>
                      <input
                        type="email" required value={jobEmail} onChange={(e) => setJobEmail(e.target.value)}
                        placeholder="careers@company.com"
                        className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase">HR Recruiter Phone</label>
                      <input
                        type="text" required value={jobPhone} onChange={(e) => setJobPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase">WhatsApp Intent Number</label>
                      <input
                        type="text" required value={jobWhatsapp} onChange={(e) => setJobWhatsapp(e.target.value)}
                        placeholder="919876543210 (with country code)"
                        className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Active Action Toggles for Frontend */}
                  <div className="bg-white p-4 rounded-xl border border-gray-200/80 space-y-2">
                    <span className="text-[10px] text-slate-800 font-extrabold uppercase tracking-wider block font-display">
                      Active Contact Channels (Frontend Buttons)
                    </span>
                    <p className="text-[10px] text-gray-400 leading-tight">
                      Control which contact or apply buttons appear for candidates on the live feed.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={jobApplyEnabled}
                          onChange={(e) => setJobApplyEnabled(e.target.checked)}
                          className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded accent-teal-600"
                        />
                        <span>Apply Link</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={jobEmailEnabled}
                          onChange={(e) => setJobEmailEnabled(e.target.checked)}
                          className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded accent-teal-600"
                        />
                        <span>Recruiter Email</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={jobCallEnabled}
                          onChange={(e) => setJobCallEnabled(e.target.checked)}
                          className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded accent-teal-600"
                        />
                        <span>Recruiter Phone</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={jobWhatsappEnabled}
                          onChange={(e) => setJobWhatsappEnabled(e.target.checked)}
                          className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded accent-teal-600"
                        />
                        <span>WhatsApp</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase">Company Logo Color Preset (0 - 5)</label>
                    <select
                      value={jobLogoIndex}
                      onChange={(e) => setJobLogoIndex(Number(e.target.value))}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none"
                    >
                      <option value={0}>Blue to Cyan Preset</option>
                      <option value={1}>Pink to Indigo Preset</option>
                      <option value={2}>Emerald to Teal Preset</option>
                      <option value={3}>Amber to Rose Preset</option>
                      <option value={4}>Violet to Fuchsia Preset</option>
                      <option value={5}>Cyan to Blue Preset</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase">Short Description (Displays in card list)</label>
                    <input
                      type="text" required value={jobShortDesc} onChange={(e) => setJobShortDesc(e.target.value)}
                      placeholder="Short catchphrase summarizing the position."
                      className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase">Full Job Description</label>
                    <textarea
                      rows={4} required value={jobFullDesc} onChange={(e) => setJobFullDesc(e.target.value)}
                      placeholder="Detail expectations, responsibilities, culture..."
                      className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none font-sans"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase">Hiring Qualifications</label>
                    <textarea
                      rows={2} required value={jobQualifications} onChange={(e) => setJobQualifications(e.target.value)}
                      placeholder="Degree requirements, skill tags, techstack experience..."
                      className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none font-sans"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingJob(false);
                        setEditingJobId(null);
                      }}
                      className="px-4 py-2 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-600 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer font-display"
                    >
                      {editingJobId ? 'Save Changes' : 'Publish Job'}
                    </button>
                  </div>
                </form>
              )}

              {/* Jobs Table List */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-bold">
                      <th className="py-2">Job Title & Company</th>
                      <th className="py-2">Location</th>
                      <th className="py-2">Status</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job.id} className="border-b border-gray-50 hover:bg-slate-50/50">
                        <td className="py-3 font-medium">
                          <span className="font-bold text-gray-900 block">{job.title}</span>
                          <span className="text-gray-400 text-[11px] font-semibold">{job.companyName}</span>
                        </td>
                        <td className="py-3 text-gray-500 font-semibold">{job.location}</td>
                        <td className="py-3">
                          <button
                            onClick={() => handleToggleJobLive(job)}
                            className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide cursor-pointer ${
                              job.isLive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {job.isLive ? 'Active / Live' : 'Expired'}
                          </button>
                        </td>
                        <td className="py-3 text-right space-x-1">
                          <button
                            id={`job-edit-${job.id}`}
                            onClick={() => handleEditJobClick(job)}
                            className="p-1 hover:bg-gray-100 text-gray-500 hover:text-teal-600 rounded-lg transition-colors cursor-pointer inline-flex"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            id={`job-delete-${job.id}`}
                            onClick={() => setJobToDelete(job)}
                            className="p-1 hover:bg-rose-50 text-rose-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer inline-flex"
                            title="Delete job post"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Moderating community posts list */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest border-b border-gray-50 pb-3 flex items-center gap-1.5 font-display">
                <Users size={15} className="text-teal-600" />
                Community Content Moderation
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {posts.map((post) => (
                  <div key={post.id} className="p-3 border border-gray-100 rounded-xl flex items-start justify-between gap-3 bg-slate-50/20">
                    <div className="flex gap-2.5">
                      <img src={post.userAvatar} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      <div>
                        <span className="font-extrabold text-xs block text-gray-900">{post.userName}</span>
                        <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2 italic pr-2">"{post.caption}"</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        if (confirm('Moderate and permanently delete this community post?')) {
                          onDeletePost(post.id);
                        }
                      }}
                      className="p-1 hover:bg-rose-50 text-rose-500 rounded-lg shrink-0 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Job deletion confirmation modal */}
          {jobToDelete && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-gray-100 shadow-2xl space-y-4">
                <div className="flex items-center gap-3 text-rose-600">
                  <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                    <Trash2 size={20} />
                  </div>
                  <div className="text-left">
                    <h4 className="font-extrabold text-slate-900 tracking-tight text-sm font-display">Delete Job Post</h4>
                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Permanent Action</p>
                  </div>
                </div>
                
                <div className="text-xs text-gray-600 leading-relaxed font-semibold text-left space-y-2">
                  <p>Are you sure you want to permanently delete this job post?</p>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                    <p className="text-slate-900 font-bold"><span className="text-gray-400 font-medium">Title:</span> {jobToDelete.title}</p>
                    <p className="text-slate-700 font-medium"><span className="text-gray-400 font-normal">Company:</span> {jobToDelete.companyName}</p>
                    {jobToDelete.location && (
                      <p className="text-slate-500 text-[11px]"><span className="text-gray-400 font-normal">Location:</span> {jobToDelete.location}</p>
                    )}
                  </div>
                  <p className="text-slate-500 text-[11px] font-normal italic">
                    This will permanently delete the job from both the Supabase table and the local store. This action is irreversible.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setJobToDelete(null)}
                    disabled={isDeletingJob}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    id="confirm-job-delete-btn"
                    onClick={async () => {
                      setIsDeletingJob(true);
                      try {
                        await onDeleteJob(jobToDelete.id);
                        setJobToDelete(null);
                      } catch (err: any) {
                        alert(err.message || 'Failed to delete job post.');
                      } finally {
                        setIsDeletingJob(false);
                      }
                    }}
                    disabled={isDeletingJob}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-rose-600/10 disabled:opacity-50"
                  >
                    {isDeletingJob ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={12} />
                        <span>Permanently Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* SUBTAB CONTENT: MEMBERSHIP & PRICING CONTROLS */}
      {activeSubTab === 'pricing' && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-xs max-w-xl mx-auto space-y-6 animate-fade-in">
          <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest border-b border-gray-100 pb-3 flex items-center gap-1.5 font-display">
            <CreditCard size={15} className="text-teal-600" />
            Membership & Pricing Controls
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            {/* Global App Mode */}
            <div className="p-4 bg-teal-50/40 rounded-2xl border border-teal-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold text-slate-900 font-display">Active Global Paywall Mode</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Toggle between Free Trial mode with a beautiful subscription lock, or 100% Free Mode.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPremiumMode(!premiumMode)}
                className="text-teal-600 hover:text-teal-800 transition-colors focus:outline-none cursor-pointer"
              >
                {premiumMode ? <ToggleRight size={44} /> : <ToggleLeft size={44} className="text-gray-400" />}
              </button>
            </div>

            {/* Currency and Pricing Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display">Plan Currency Code</label>
                <input
                  type="text" required value={currency} onChange={(e) => setCurrency(e.target.value)}
                  placeholder="INR"
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                />
              </div>
              
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display">Subscription Price / month</label>
                <input
                  type="number" required value={membershipPrice} onChange={(e) => setMembershipPrice(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                />
              </div>
            </div>

            {/* Features list text area */}
            <div>
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display">Paywall Features List (One per line)</label>
              <textarea
                rows={5} required value={paywallFeaturesText} onChange={(e) => setPaywallFeaturesText(e.target.value)}
                placeholder="Unlimited Applications&#10;Access Recruiter Numbers&#10;..."
                className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/10 font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingSettings}
              className={`w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/10 flex items-center justify-center gap-1.5 font-display ${
                isSavingSettings ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <Save size={14} className={isSavingSettings ? 'animate-spin' : ''} />
              <span>{isSavingSettings ? 'Updating Pricing Controls...' : 'Update Pricing Controls'}</span>
            </button>
          </form>
        </div>
      )}

      {/* SUBTAB CONTENT: USER & SUBSCRIPTION OVERRIDES */}
      {activeSubTab === 'users' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4 animate-fade-in font-sans">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50 pb-3">
            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest flex items-center gap-1.5 font-display">
              <Users size={15} className="text-teal-600" />
              Registered Users & Plan Control
            </h3>
            
            {/* Search Bar */}
            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 focus:bg-white rounded-xl p-2 pl-8 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
              />
              <span className="absolute left-2.5 top-2.5 text-gray-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-bold">
                  <th className="py-2">User details</th>
                  <th className="py-2">Join Date</th>
                  <th className="py-2">Trial Expiry</th>
                  <th className="py-2">Current Tier Badge</th>
                  <th className="py-2">Change Plan Tier</th>
                  <th className="py-2 text-right">Quick Helpers</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filteredUsers = users.filter((u) => 
                    u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                    u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
                  );

                  if (filteredUsers.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-400 font-medium italic">
                          No users found matching "{userSearchQuery}"
                        </td>
                      </tr>
                    );
                  }

                  return filteredUsers.map((user) => {
                    const dynBadge = getUserBadge(user, settings);
                    const trialInfo = getTrialInfo(user);
                    const isExpired = dynBadge === 'EXPIRED';
                    const trialExpiryShow = trialInfo ? trialInfo.expiryDate : new Date(user.trialExpiryDate);
                    
                    return (
                      <tr key={user.id} className="border-b border-gray-50 hover:bg-slate-50/50">
                        <td className="py-3 font-medium flex items-center gap-2.5">
                          <img 
                            src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.email)}`} 
                            alt="" 
                            className="w-8 h-8 rounded-lg object-cover border border-slate-100 shrink-0" 
                          />
                          <div>
                            <span className="font-bold text-gray-900 block">{user.name}</span>
                            <span className="text-gray-400 text-[10px]">{user.email}</span>
                          </div>
                        </td>

                        <td className="py-3 text-gray-500 font-semibold">
                          {new Date(user.joinDate).toLocaleDateString()}
                        </td>

                        <td className="py-3">
                          <span className={`font-semibold ${isExpired ? 'text-rose-500 font-bold' : 'text-gray-500'}`}>
                            {trialExpiryShow.toLocaleDateString()}
                          </span>
                          {isExpired && <span className="text-[9px] bg-rose-50 text-rose-600 font-bold ml-1.5 px-1 py-0.5 rounded">Expired</span>}
                          {dynBadge === 'TRIAL' && trialInfo && (
                            <span className="text-[9px] bg-teal-50 text-teal-600 font-bold ml-1.5 px-1 py-0.5 rounded">{trialInfo.daysRemaining}d left</span>
                          )}
                        </td>

                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide border ${
                            dynBadge === 'PREMIUM'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : dynBadge === 'TRIAL'
                              ? 'bg-teal-50 text-teal-700 border-teal-100'
                              : 'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>
                            {dynBadge === 'PREMIUM' ? '👑 Premium' : dynBadge === 'TRIAL' ? '🌱 Trial' : '🛑 Expired'}
                          </span>
                        </td>

                        <td className="py-3">
                          <select
                            value={user.subscriptionStatus}
                            onChange={async (e) => {
                              const val = e.target.value as 'Free Trial' | 'Active' | 'Expired';
                              await handleUserOverrideStatus(user, val);
                            }}
                            className="bg-slate-50 border border-gray-200 text-xs font-bold rounded-lg p-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/15 cursor-pointer font-display"
                          >
                            <option value="Free Trial">Trial</option>
                            <option value="Active">Premium (Active)</option>
                            <option value="Expired">Expired</option>
                          </select>
                        </td>

                        <td className="py-3 text-right space-x-1.5 font-display flex items-center justify-end">
                          <button
                            onClick={() => handleTrialExtend(user)}
                            title="Extend Trial +15 Days"
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100 rounded-lg text-[10px] font-bold transition-all cursor-pointer inline-flex animate-fade-in"
                          >
                            +15d Trial
                          </button>
                          {onDeleteUser && user.email.toLowerCase() !== 'kokborokanimations@gmail.com' && (
                            <button
                              onClick={() => setUserToDelete(user)}
                              title="Delete User Account"
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 rounded-lg text-[10px] font-bold transition-all cursor-pointer inline-flex animate-fade-in"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>

          {/* User deletion confirmation modal */}
          {userToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-gray-100 shadow-2xl space-y-4">
                <div className="flex items-center gap-3 text-rose-600">
                  <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                    <Trash2 size={20} />
                  </div>
                  <div className="text-left">
                    <h4 className="font-extrabold text-slate-900 tracking-tight text-sm font-display">Delete User Account</h4>
                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Permanent Action</p>
                  </div>
                </div>
                
                <p className="text-xs text-gray-600 leading-relaxed font-semibold text-left">
                  Are you sure you want to permanently delete <span className="font-bold text-slate-900">{userToDelete.name}</span> (<span className="text-slate-500">{userToDelete.email}</span>)? This will permanently remove their account from Supabase Authentication and clear all of their custom profile and community data. This action is irreversible.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setUserToDelete(null)}
                    disabled={isDeletingUser}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!onDeleteUser) return;
                      setIsDeletingUser(true);
                      try {
                        await onDeleteUser(userToDelete.id);
                        setUserToDelete(null);
                      } catch (err: any) {
                        alert(err.message || 'Failed to delete user.');
                      } finally {
                        setIsDeletingUser(false);
                      }
                    }}
                    disabled={isDeletingUser}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-rose-600/10 disabled:opacity-50"
                  >
                    {isDeletingUser ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={12} />
                        <span>Permanently Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB CONTENT: CASHFREE GATEWAY LOGS & SETTINGS */}
      {activeSubTab === 'cashfree' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Credentials Settings Card */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest border-b border-gray-50 pb-2 flex items-center gap-1.5 font-display">
              <CreditCard size={15} className="text-teal-600" />
              Cashfree Credentials
            </h3>

            <p className="text-[10px] text-gray-500 leading-normal font-semibold">
              Input your Cashfree App ID and Secret Key. If left blank, Jobview runs in a beautiful built-in Cashfree Checkout Simulator for testing!
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display">Cashfree App ID</label>
                <input
                  type="text"
                  placeholder="e.g., TEST43912a78"
                  value={cashfreeAppId}
                  onChange={(e) => setCashfreeAppId(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                />
              </div>

              <div>
                <div className="flex items-center justify-between font-display">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Cashfree Secret Key</label>
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-xs text-teal-600 font-bold hover:underline"
                  >
                    {showSecret ? <EyeOff size={14} className="inline mr-1" /> : <Eye size={14} className="inline mr-1" />}
                    {showSecret ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showSecret ? 'text' : 'password'}
                  placeholder="e.g., cf_secret_key_89ab..."
                  value={cashfreeSecretKey}
                  onChange={(e) => setCashfreeSecretKey(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/10 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingSettings}
                className={`w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/10 flex items-center justify-center gap-1.5 font-display ${
                  isSavingSettings ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <Save size={14} className={isSavingSettings ? 'animate-spin' : ''} />
                <span>{isSavingSettings ? 'Saving Credentials...' : 'Save Credentials'}</span>
              </button>
            </form>
          </div>

          {/* Transactions Table Log */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest flex items-center gap-1.5 font-display">
                <CreditCard size={15} className="text-teal-600" />
                Recent Cashfree Transactions
              </h3>
              
              <button
                onClick={fetchPaymentLogs}
                disabled={isLoadingLogs}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-teal-600 transition-all cursor-pointer inline-flex items-center gap-1 font-display"
                title="Refresh logs"
              >
                <RefreshCw size={14} className={isLoadingLogs ? 'animate-spin' : ''} />
                <span className="text-[10px] font-bold">Refresh</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-bold">
                    <th className="py-2">User Email</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Tx ID</th>
                    <th className="py-2">Date</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-50 hover:bg-slate-50/50">
                      <td className="py-3 font-medium text-gray-900">{log.userEmail}</td>
                      <td className="py-3 font-bold text-gray-900">
                        {settings.currency} {log.amount}
                      </td>
                      <td className="py-3 font-mono text-gray-500 text-[10px]">{log.txId}</td>
                      <td className="py-3 text-gray-400 font-semibold">
                        {new Date(log.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SUBTAB CONTENT: COMMUNITY POST APPROVALS */}
      {activeSubTab === 'posts' && (
        <div className="space-y-6 animate-fade-in">
          {/* Post Approval Master Setting */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider font-display flex items-center gap-1.5">
                <Shield size={16} className="text-teal-600" />
                Master Approval Guard
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Configure whether user posts go live instantly or require secure admin clearance.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold font-display px-2.5 py-1 rounded-full ${
                postApprovalMode 
                  ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}>
                {postApprovalMode ? '🔒 Manual Approval Required (ON)' : '🔓 Auto Live Posts (OFF)'}
              </span>
              
              <button
                disabled={isSavingSettings}
                onClick={async () => {
                  if (isSavingSettings) return;
                  const newVal = !postApprovalMode;
                  setPostApprovalMode(newVal);
                  setIsSavingSettings(true);
                  try {
                    const success = await onUpdateSettings({
                      ...settings,
                      postApprovalMode: newVal
                    });
                    if (success) {
                      if (window.showSuccessToast) {
                        window.showSuccessToast('Approval Mode Updated Successfully!');
                      }
                    } else {
                      alert('Failed to update approval mode.');
                      setPostApprovalMode(!newVal);
                    }
                  } catch (err) {
                    console.error(err);
                    alert('Error updating approval mode.');
                    setPostApprovalMode(!newVal);
                  } finally {
                    setIsSavingSettings(false);
                  }
                }}
                className={`text-teal-600 hover:text-teal-700 transition-colors ${
                  isSavingSettings ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
                title="Toggle Approval Mode"
              >
                {postApprovalMode ? (
                  <ToggleRight size={44} className="text-teal-600" />
                ) : (
                  <ToggleLeft size={44} className="text-gray-300" />
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Approval Queue */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <div className="border-b border-gray-50 pb-3 flex items-center justify-between">
                <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest flex items-center gap-1.5 font-display">
                  <Clock size={15} className="text-amber-500 animate-pulse" />
                  Pending Clearance Queue ({adminPosts.filter(p => p.status === 'Pending').length})
                </h3>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {(() => {
                  const pending = adminPosts.filter(p => p.status === 'Pending');
                  if (pending.length === 0) {
                    return (
                      <div className="text-center py-12 text-gray-400">
                        <CheckCircle size={24} className="mx-auto mb-2 text-emerald-500" />
                        <p className="text-xs font-bold">Clearance Queue Empty</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">No posts are awaiting moderation.</p>
                      </div>
                    );
                  }
                  return pending.map((post) => (
                    <div key={post.id} className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img 
                            src={post.userAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(post.userName)}`}
                            alt={post.userName} 
                            className="w-6 h-6 rounded-full border border-slate-200" 
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">{post.userName}</span>
                            <span className="text-[9px] text-gray-400 font-medium">Awaiting check</span>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleApprovePost(post.id)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title="Approve Post"
                          >
                            <Check size={12} />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to reject and delete this post?')) {
                                onDeletePost(post.id);
                              }
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title="Reject Post"
                          >
                            <Trash2 size={12} />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-xs text-slate-700 leading-normal pl-8">{post.caption}</p>
                      
                      {post.imageUrl && (
                        <div className="pl-8">
                          <img 
                            src={post.imageUrl} 
                            alt="Attached file" 
                            className="max-h-32 object-contain rounded border border-gray-100" 
                          />
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Live Feed Moderation Database */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <div className="border-b border-gray-50 pb-3 flex items-center justify-between">
                <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest flex items-center gap-1.5 font-display">
                  <CheckCircle size={15} className="text-emerald-500" />
                  Live Community Database ({adminPosts.filter(p => p.status !== 'Pending').length})
                </h3>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {(() => {
                  const live = adminPosts.filter(p => p.status !== 'Pending');
                  if (live.length === 0) {
                    return (
                      <div className="text-center py-12 text-gray-400">
                        <p className="text-xs font-bold">No Live Posts</p>
                      </div>
                    );
                  }
                  return live.map((post) => (
                    <div key={post.id} className="p-3 bg-white rounded-xl border border-gray-100 flex items-start justify-between gap-3 hover:bg-slate-50/30 transition-colors">
                      <div className="flex gap-2 flex-1">
                        <img 
                          src={post.userAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(post.userName)}`}
                          alt={post.userName} 
                          className="w-6 h-6 rounded-full shrink-0 border border-slate-200" 
                        />
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">{post.userName}</span>
                            <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.2 rounded-full uppercase font-bold">Live</span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-normal line-clamp-2">{post.caption}</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          if (confirm('Delete this live post? This is irreversible.')) {
                            onDeletePost(post.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Live Post"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB CONTENT: CUSTOM PAGES MANAGER */}
      {activeSubTab === 'pages' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Custom Page Form */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest border-b border-gray-50 pb-2 flex items-center gap-1.5 font-display">
              <FileText size={15} className="text-teal-600" />
              {editingPageId ? '✍️ Edit Custom Page' : '➕ Create Custom Page'}
            </h3>

            <form onSubmit={handlePageSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display">Page Title</label>
                <input
                  type="text" required value={pageTitle} onChange={(e) => setPageTitle(e.target.value)}
                  placeholder="e.g., Refund Policy"
                  className="w-full bg-slate-50 border border-gray-200 focus:bg-white rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/10 font-sans"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display">URL Slug</label>
                <input
                  type="text" required value={pageSlug} onChange={(e) => setPageSlug(e.target.value)}
                  placeholder="e.g., refund-policy"
                  className="w-full bg-slate-50 border border-gray-200 focus:bg-white rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/10 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between font-display">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Page Content (Markdown/HTML)</label>
                  <span className="text-[8px] font-extrabold text-teal-600 bg-teal-50 px-1.5 rounded">Markdown Enabled</span>
                </div>
                <textarea
                  rows={8} required value={pageContent} onChange={(e) => setPageContent(e.target.value)}
                  placeholder="# Refund & Cancellation Policy&#10;&#10;Our refund policy outlines..."
                  className="w-full bg-slate-50 border border-gray-200 focus:bg-white rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/10 font-mono"
                />
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-display">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-800 font-bold uppercase block">Footer Visibility</span>
                  <span className="text-[9px] text-gray-400 leading-none">Toggle to show in website footer link group.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPageIsVisible(!pageIsVisible)}
                  className="text-teal-600 hover:text-teal-700 transition-colors cursor-pointer"
                >
                  {pageIsVisible ? (
                    <ToggleRight size={38} className="text-teal-600" />
                  ) : (
                    <ToggleLeft size={38} className="text-gray-300" />
                  )}
                </button>
              </div>

              <div className="flex gap-2 font-display">
                {editingPageId && (
                  <button
                    type="button"
                    onClick={() => {
                      resetPageForm();
                    }}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/10 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save size={14} />
                  <span>{editingPageId ? 'Save Edits' : 'Publish Page'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Formatted Content Live Preview & Pages Table List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Split Page Live Preview (Rich text simulator) */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
              <span className="text-[10px] text-slate-800 font-extrabold uppercase tracking-widest font-display block">👁️ Real-time Styled Content Preview</span>
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 max-h-[180px] overflow-y-auto text-xs font-semibold prose prose-sm text-slate-700 leading-relaxed">
                {pageContent ? (
                  <div className="space-y-2">
                    {pageContent.split('\n').map((line, idx) => {
                      if (line.startsWith('# ')) {
                        return <h1 key={idx} className="text-sm font-black text-slate-900 border-b pb-1">{line.replace('# ', '')}</h1>;
                      } else if (line.startsWith('## ')) {
                        return <h2 key={idx} className="text-xs font-bold text-slate-900">{line.replace('## ', '')}</h2>;
                      } else if (line.startsWith('- ') || line.startsWith('* ')) {
                        return <li key={idx} className="ml-3 list-disc">{line.substring(2)}</li>;
                      } else if (line.trim().length === 0) {
                        return <div key={idx} className="h-2" />;
                      } else {
                        return <p key={idx}>{line}</p>;
                      }
                    })}
                  </div>
                ) : (
                  <span className="text-gray-400 italic font-medium">Type inside the content textarea to simulate rich formatted preview...</span>
                )}
              </div>
            </div>

            {/* Custom Footer Pages Table */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-3">
              <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest flex items-center gap-1.5 font-display">
                <Globe size={15} className="text-teal-600" />
                Active Pages Database
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-bold">
                      <th className="py-2">Page Title</th>
                      <th className="py-2">Slug Link</th>
                      <th className="py-2">Footer Visibility</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pages.map((p) => {
                      const isDefaultPage = ['about-us', 'contact-us', 'privacy-policy', 'terms-of-use'].includes(p.slug);
                      return (
                        <tr key={p.id} className="border-b border-gray-50 hover:bg-slate-50/50">
                          <td className="py-3 font-medium">
                            <span className="font-bold text-slate-950 block">{p.title}</span>
                            {isDefaultPage && (
                              <span className="inline-flex bg-slate-100 text-slate-500 text-[8px] font-bold uppercase px-1 rounded mt-0.5">Core Page</span>
                            )}
                          </td>
                          <td className="py-3 font-mono text-gray-500 text-[10px]">/{p.slug}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide border ${
                              p.isVisibleInFooter 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : 'bg-slate-100 text-gray-400 border-slate-200'
                            }`}>
                              {p.isVisibleInFooter ? 'Visible' : 'Hidden'}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingPageId(p.id);
                                  setPageTitle(p.title);
                                  setPageSlug(p.slug);
                                  setPageContent(p.content);
                                  setPageIsVisible(p.isVisibleInFooter);
                                }}
                                className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg cursor-pointer transition-colors"
                                title="Edit Content"
                              >
                                <Edit size={13} />
                              </button>
                              
                              {!isDefaultPage && (
                                <button
                                  onClick={() => handleDeletePage(p.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                  title="Delete Page"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
