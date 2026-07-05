/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Job, CommunityPost, User, AdminSettings, PaymentLog } from '../types';
import { 
  Settings, Briefcase, Users, CreditCard, Shield, Plus, 
  Trash2, Edit, Save, ToggleLeft, ToggleRight, Check, RefreshCw, EyeOff, Eye,
  Clock, CheckCircle, FileText, Globe, Database, UploadCloud, X, Search, Mail, LogIn
} from 'lucide-react';
import WysiwygEditor from './WysiwygEditor';
import { getUserBadge, getTrialInfo } from '../lib/badgeUtils';
import { supabase, isCustomSupabaseConfigured } from '../lib/supabase';

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
  onRefreshJobs?: () => Promise<void> | void;
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
  onDeleteUser,
  onRefreshJobs
}: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'branding' | 'pricing' | 'users' | 'cashfree' | 'posts' | 'pages' | 'contacts'>('branding');
  
  // Settings Form state
  const [brandName, setBrandName] = useState(settings.brandName || '');
  const [tagline, setTagline] = useState(settings.tagline || '');
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const [faviconUrl, setFaviconUrl] = useState(settings.faviconUrl || '');
  const [bannerUrl, setBannerUrl] = useState(settings.bannerUrl || '');
  const [bannerHtml, setBannerHtml] = useState(settings.bannerHtml || '');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [premiumMode, setPremiumMode] = useState(settings.premiumMode);
  const [membershipPrice, setMembershipPrice] = useState(settings.membershipPrice || 499);
  const [currency, setCurrency] = useState(settings.currency || 'INR');
  const [paywallFeaturesText, setPaywallFeaturesText] = useState((settings.paywallFeatures || []).join('\n'));
  const [paywallTitle, setPaywallTitle] = useState(settings.paywallTitle || 'Activate Premium');
  const [paywallSubtitle, setPaywallSubtitle] = useState(settings.paywallSubtitle || 'Unlock Premium access to continue searching & applying.');
  const [paywallButtonText, setPaywallButtonText] = useState(settings.paywallButtonText || 'Activate Membership Now');
  const [paywallPriceDescription, setPaywallPriceDescription] = useState(settings.paywallPriceDescription || 'One-time manual purchase. Extend anytime.');
  const [paywallFooterText, setPaywallFooterText] = useState(settings.paywallFooterText || 'Secured & processed under Cashfree SDK Gateway. This is a one-time manual charge. No automatic renewals or recurring billing cycles.');
  const [paywallExtendTitle, setPaywallExtendTitle] = useState(settings.paywallExtendTitle || 'Extend Premium');
  const [paywallExtendSubtitle, setPaywallExtendSubtitle] = useState(settings.paywallExtendSubtitle || 'Extend your manual premium access for another month.');
  const [paywallExtendButtonText, setPaywallExtendButtonText] = useState(settings.paywallExtendButtonText || 'Extend Membership Now');
  const [cashfreeAppId, setCashfreeAppId] = useState(settings.cashfreeAppId || '');
  const [cashfreeSecretKey, setCashfreeSecretKey] = useState(settings.cashfreeSecretKey || '');
  const [postApprovalMode, setPostApprovalMode] = useState(settings.postApprovalMode || false);
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl || localStorage.getItem('VITE_SUPABASE_URL') || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(settings.supabaseAnonKey || localStorage.getItem('VITE_SUPABASE_ANON_KEY') || '');
  const [supabaseServiceRoleKey, setSupabaseServiceRoleKey] = useState(settings.supabaseServiceRoleKey || localStorage.getItem('SUPABASE_SERVICE_ROLE_KEY') || '');
  const [googleSiteVerification, setGoogleSiteVerification] = useState(settings.googleSiteVerification || '');
  const [communityMindPlaceholder, setCommunityMindPlaceholder] = useState(settings.communityMindPlaceholder || '');
  const [communityReviewNotice, setCommunityReviewNotice] = useState(settings.communityReviewNotice || '');
  const [loginTitle, setLoginTitle] = useState(settings.loginTitle || '');
  const [loginSubtitle, setLoginSubtitle] = useState(settings.loginSubtitle || '');
  const [googleOnly, setGoogleOnly] = useState(settings.googleOnly || false);
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
  const [jobContractType, setJobContractType] = useState('Full-Time / Direct Hiring');
  const [jobCompanyLogoUrl, setJobCompanyLogoUrl] = useState('');
  const [isUploadingJobCompanyLogo, setIsUploadingJobCompanyLogo] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
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
  const [confirmPostDeleteId, setConfirmPostDeleteId] = useState<string | null>(null);

  const [adminPosts, setAdminPosts] = useState<CommunityPost[]>(posts);

  useEffect(() => {
    setAdminPosts(posts);
  }, [posts]);

  const [pages, setPages] = useState<any[]>([]);
  const [isEditingPage, setIsEditingPage] = useState<boolean>(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [pageContent, setPageContent] = useState('');
  const [pageIsVisible, setPageIsVisible] = useState(true);

  // Contact Submissions state
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [contactIdToConfirmDelete, setContactIdToConfirmDelete] = useState<string | null>(null);

  const fetchContacts = async () => {
    setIsLoadingContacts(true);
    try {
      const response = await fetch('/api/contacts');
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setContacts(prev => prev.filter(c => c.id !== id));
        if (contactIdToConfirmDelete === id) {
          setContactIdToConfirmDelete(null);
        }
      } else {
        console.error('Failed to delete the contact submission.');
      }
    } catch (err) {
      console.error('Error deleting contact:', err);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'contacts') {
      fetchContacts();
    }
  }, [activeSubTab]);

  const filteredContacts = contacts.filter((c: any) => {
    const query = contactSearchQuery.toLowerCase();
    return (
      c.name?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.subject?.toLowerCase().includes(query) ||
      c.message?.toLowerCase().includes(query)
    );
  });

  // Supabase Connection Status State
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'error' | 'not-configured' | 'missing-table'>('checking');
  const [supabaseErrorDetails, setSupabaseErrorDetails] = useState<string | null>(null);
  const [visitCount, setVisitCount] = useState<number | null>(null);
  const [detailedStats, setDetailedStats] = useState<{ today: number; sevenDays: number; oneMonth: number; total: number } | null>(null);
  const [visitorFilter, setVisitorFilter] = useState<'today' | '7day' | '1month' | 'total'>('total');
  const [showSqlHelper, setShowSqlHelper] = useState(false);

  const refreshAnalytics = async () => {
    try {
      const { fetchDetailedVisitStats } = await import('../lib/supabaseQueries');
      const stats = await fetchDetailedVisitStats();
      if (stats) {
        setDetailedStats(stats);
        setVisitCount(stats.total);
      }
    } catch (countErr) {
      console.warn('Failed to refresh visitor stats:', countErr);
    }
  };

  useEffect(() => {
    async function checkSupabaseConnection() {
      // Fetch detailed analytics (with local storage fallback)
      await refreshAnalytics();

      if (!isCustomSupabaseConfigured() || !supabase) {
        setSupabaseStatus('not-configured');
        return;
      }
      try {
        const { error } = await supabase.from('jobs').select('id').limit(1);
        if (error) {
          if (error.code === 'PGRST116') {
            setSupabaseStatus('connected');
          } else if (error.message && (error.message.includes('relation') || error.message.includes('does not exist'))) {
            setSupabaseStatus('missing-table');
            setSupabaseErrorDetails('Connected successfully to Supabase, but the "jobs" table is missing in your Supabase schema.');
          } else {
            setSupabaseStatus('error');
            setSupabaseErrorDetails(error.message);
          }
        } else {
          setSupabaseStatus('connected');
        }
      } catch (err: any) {
        setSupabaseStatus('error');
        setSupabaseErrorDetails(err.message || String(err));
      }
    }
    checkSupabaseConnection();
  }, []);

  useEffect(() => {
    setAdminPosts(posts);
  }, [posts]);

  // Synchronize local form states when settings prop is updated from server/parent
  useEffect(() => {
    setBrandName(settings.brandName || '');
    setTagline(settings.tagline || '');
    setLogoUrl(settings.logoUrl || '');
    setFaviconUrl(settings.faviconUrl || '');
    setBannerUrl(settings.bannerUrl || '');
    setBannerHtml(settings.bannerHtml || '');
    setPremiumMode(settings.premiumMode);
    setMembershipPrice(settings.membershipPrice || 499);
    setCurrency(settings.currency || 'INR');
    setPaywallFeaturesText((settings.paywallFeatures || []).join('\n'));
    setPaywallTitle(settings.paywallTitle || 'Activate Premium');
    setPaywallSubtitle(settings.paywallSubtitle || 'Unlock Premium access to continue searching & applying.');
    setPaywallButtonText(settings.paywallButtonText || 'Activate Membership Now');
    setPaywallPriceDescription(settings.paywallPriceDescription || 'One-time manual purchase. Extend anytime.');
    setPaywallFooterText(settings.paywallFooterText || 'Secured & processed under Cashfree SDK Gateway. This is a one-time manual charge. No automatic renewals or recurring billing cycles.');
    setPaywallExtendTitle(settings.paywallExtendTitle || 'Extend Premium');
    setPaywallExtendSubtitle(settings.paywallExtendSubtitle || 'Extend your manual premium access for another month.');
    setPaywallExtendButtonText(settings.paywallExtendButtonText || 'Extend Membership Now');
    setCashfreeAppId(settings.cashfreeAppId || '');
    setCashfreeSecretKey(settings.cashfreeSecretKey || '');
    setPostApprovalMode(settings.postApprovalMode || false);
    setSupabaseUrl(settings.supabaseUrl || localStorage.getItem('VITE_SUPABASE_URL') || '');
    setSupabaseAnonKey(settings.supabaseAnonKey || localStorage.getItem('VITE_SUPABASE_ANON_KEY') || '');
    setSupabaseServiceRoleKey(settings.supabaseServiceRoleKey || localStorage.getItem('SUPABASE_SERVICE_ROLE_KEY') || '');
    setGoogleSiteVerification(settings.googleSiteVerification || '');
    setCommunityMindPlaceholder(settings.communityMindPlaceholder || '');
    setCommunityReviewNotice(settings.communityReviewNotice || '');
    setLoginTitle(settings.loginTitle || '');
    setLoginSubtitle(settings.loginSubtitle || '');
    setGoogleOnly(settings.googleOnly || false);
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
      faviconUrl !== (settings.faviconUrl || '') ||
      bannerUrl !== (settings.bannerUrl || '') ||
      bannerHtml !== (settings.bannerHtml || '') ||
      premiumMode !== settings.premiumMode ||
      Number(membershipPrice) !== (settings.membershipPrice || 499) ||
      currency !== (settings.currency || 'INR') ||
      paywallTitle !== (settings.paywallTitle || 'Activate Premium') ||
      paywallSubtitle !== (settings.paywallSubtitle || 'Unlock Premium access to continue searching & applying.') ||
      paywallButtonText !== (settings.paywallButtonText || 'Activate Membership Now') ||
      paywallPriceDescription !== (settings.paywallPriceDescription || 'One-time manual purchase. Extend anytime.') ||
      paywallFooterText !== (settings.paywallFooterText || 'Secured & processed under Cashfree SDK Gateway. This is a one-time manual charge. No automatic renewals or recurring billing cycles.') ||
      paywallExtendTitle !== (settings.paywallExtendTitle || 'Extend Premium') ||
      paywallExtendSubtitle !== (settings.paywallExtendSubtitle || 'Extend your manual premium access for another month.') ||
      paywallExtendButtonText !== (settings.paywallExtendButtonText || 'Extend Membership Now') ||
      cashfreeAppId !== (settings.cashfreeAppId || '') ||
      cashfreeSecretKey !== (settings.cashfreeSecretKey || '') ||
      postApprovalMode !== (settings.postApprovalMode || false) ||
      supabaseUrl !== (settings.supabaseUrl || '') ||
      supabaseAnonKey !== (settings.supabaseAnonKey || '') ||
      supabaseServiceRoleKey !== (settings.supabaseServiceRoleKey || '') ||
      googleSiteVerification !== (settings.googleSiteVerification || '') ||
      communityMindPlaceholder !== (settings.communityMindPlaceholder || '') ||
      communityReviewNotice !== (settings.communityReviewNotice || '') ||
      loginTitle !== (settings.loginTitle || '') ||
      loginSubtitle !== (settings.loginSubtitle || '') ||
      googleOnly !== (settings.googleOnly || false) ||
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
        faviconUrl,
        bannerUrl,
        bannerHtml,
        premiumMode,
        membershipPrice: Number(membershipPrice),
        currency,
        paywallFeatures: features,
        paywallTitle,
        paywallSubtitle,
        paywallButtonText,
        paywallPriceDescription,
        paywallFooterText,
        paywallExtendTitle,
        paywallExtendSubtitle,
        paywallExtendButtonText,
        cashfreeAppId,
        cashfreeSecretKey,
        postApprovalMode,
        supabaseUrl,
        supabaseAnonKey,
        supabaseServiceRoleKey,
        googleSiteVerification,
        communityMindPlaceholder,
        communityReviewNotice,
        loginTitle,
        loginSubtitle,
        googleOnly
      });

      if (success) {
        // Save to localStorage so browser proxy updates instantly
        localStorage.setItem('VITE_SUPABASE_URL', supabaseUrl);
        localStorage.setItem('VITE_SUPABASE_ANON_KEY', supabaseAnonKey);
        localStorage.setItem('SUPABASE_SERVICE_ROLE_KEY', supabaseServiceRoleKey);

        if (window.showSuccessToast) {
          window.showSuccessToast('Settings Saved Successfully!');
        } else {
          alert('Application branding and credentials successfully saved.');
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
        companyLogoUrl: jobCompanyLogoUrl,
        contractType: jobContractType,
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
        companyLogoUrl: jobCompanyLogoUrl,
        contractType: jobContractType,
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
    setJobContractType('Full-Time / Direct Hiring');
    setJobCompanyLogoUrl('');
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
    setJobContractType(job.contractType || 'Full-Time / Direct Hiring');
    setJobCompanyLogoUrl(job.companyLogoUrl || '');
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

  const handleFaviconChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploadingFavicon(true);
      const url = await handleFileUpload(e.target.files[0], 'app_favicon');
      setIsUploadingFavicon(false);
      if (url) {
        setFaviconUrl(url);
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

  const handleJobCompanyLogoChange = async (file: File) => {
    setIsUploadingJobCompanyLogo(true);
    const url = await handleFileUpload(file, 'company_logo');
    setIsUploadingJobCompanyLogo(false);
    if (url) {
      setJobCompanyLogoUrl(url);
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

        {/* Dynamic server-saved notification & Supabase status badge */}
        <div className="flex flex-wrap gap-2 items-center self-start">
          <div className="px-3.5 py-1.5 bg-slate-900 text-amber-400 font-mono text-[10px] font-bold rounded-xl shadow-inner inline-flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            <span>WORKSPACE SECURED • PERSISTED</span>
          </div>

          {visitCount !== null && (
            <div className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono text-[10px] font-extrabold rounded-xl shadow-xs inline-flex items-center gap-1.5 animate-fade-in hover:bg-indigo-100 transition-colors">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
              <span>TOTAL VISITS: {visitCount}</span>
            </div>
          )}

          {supabaseStatus === 'checking' && (
            <div className="px-3 py-1.5 bg-slate-100 text-gray-500 font-mono text-[10px] font-bold rounded-xl border border-gray-200 inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" />
              <span>CHECKING SUPABASE...</span>
            </div>
          )}
          {supabaseStatus === 'connected' && (
            <div 
              title={supabaseErrorDetails || "Connected successfully to Supabase Database API"}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold rounded-xl border border-emerald-200 inline-flex items-center gap-1.5 cursor-help"
            >
              <Database size={11} className="text-emerald-500 animate-pulse" />
              <span>SUPABASE ACTIVE</span>
            </div>
          )}
          {supabaseStatus === 'missing-table' && (
            <button 
              onClick={() => setShowSqlHelper(true)}
              title="Click to view SQL schema script to create the 'jobs' table"
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-mono text-[10px] font-bold rounded-xl border border-amber-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Database size={11} className="text-amber-500 animate-bounce" />
              <span>SETUP TABLE (REQUIRED)</span>
            </button>
          )}
          {supabaseStatus === 'error' && (
            <div 
              title={supabaseErrorDetails || "Connection failed. Please verify credentials."}
              className="px-3 py-1.5 bg-rose-50 text-rose-700 font-mono text-[10px] font-bold rounded-xl border border-rose-200 inline-flex items-center gap-1.5 cursor-help"
            >
              <Database size={11} className="text-rose-500 animate-bounce" />
              <span>SUPABASE OFFLINE</span>
            </div>
          )}
          {supabaseStatus === 'not-configured' && (
            <div className="px-3 py-1.5 bg-amber-50 text-amber-700 font-mono text-[10px] font-bold rounded-xl border border-amber-200 inline-flex items-center gap-1.5">
              <Database size={11} className="text-amber-500" />
              <span>SUPABASE LOCAL MODE</span>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Dashboard Overview Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in bg-slate-50/50 p-4 rounded-3xl border border-gray-100">
        {/* Total Visitors Card */}
        <div className="bg-gradient-to-br from-indigo-50/80 to-white p-4 rounded-2xl border border-indigo-100/60 shadow-xs relative overflow-hidden group transition-all hover:border-indigo-200/80 hover:shadow-sm col-span-1 sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Eye className="text-indigo-600" size={44} />
          </div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] text-indigo-700/90 font-black uppercase tracking-widest font-display flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
              Visitor Analytics
            </span>
            <button
              onClick={async () => {
                await refreshAnalytics();
              }}
              title="Refresh visitor counts"
              className="p-1 text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100/50 rounded-lg transition-all cursor-pointer"
            >
              <RefreshCw size={12} className="hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>

          {/* Metric prominent display depending on selected filter */}
          <div className="mt-2 flex items-baseline">
            <span className="text-3xl font-black text-indigo-950 font-display tracking-tight">
              {detailedStats ? (
                visitorFilter === 'today' ? detailedStats.today.toLocaleString() :
                visitorFilter === '7day' ? detailedStats.sevenDays.toLocaleString() :
                visitorFilter === '1month' ? detailedStats.oneMonth.toLocaleString() :
                detailedStats.total.toLocaleString()
              ) : (visitCount !== null ? visitCount.toLocaleString() : '0')}
            </span>
            <span className="text-[10px] text-indigo-600 font-extrabold font-mono uppercase ml-1.5">
              {visitorFilter === 'today' ? 'Today' :
               visitorFilter === '7day' ? '7 Days' :
               visitorFilter === '1month' ? '30 Days' :
               'Total'} Hits
            </span>
          </div>

          {/* Elegant Filter Segment Selector */}
          <div className="mt-3 flex gap-0.5 bg-indigo-100/40 p-0.5 rounded-lg border border-indigo-100/30">
            <button
              onClick={() => setVisitorFilter('today')}
              className={`flex-1 text-center py-1 text-[9px] font-black tracking-tight rounded-md transition-all cursor-pointer ${
                visitorFilter === 'today'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-600/70 hover:text-indigo-900 hover:bg-white/40'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setVisitorFilter('7day')}
              className={`flex-1 text-center py-1 text-[9px] font-black tracking-tight rounded-md transition-all cursor-pointer ${
                visitorFilter === '7day'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-600/70 hover:text-indigo-900 hover:bg-white/40'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setVisitorFilter('1month')}
              className={`flex-1 text-center py-1 text-[9px] font-black tracking-tight rounded-md transition-all cursor-pointer ${
                visitorFilter === '1month'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-600/70 hover:text-indigo-900 hover:bg-white/40'
              }`}
            >
              1 Month
            </button>
            <button
              onClick={() => setVisitorFilter('total')}
              className={`flex-1 text-center py-1 text-[9px] font-black tracking-tight rounded-md transition-all cursor-pointer ${
                visitorFilter === 'total'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-600/70 hover:text-indigo-900 hover:bg-white/40'
              }`}
            >
              Total
            </button>
          </div>

          {/* Compact full breakdown progress list */}
          {detailedStats && (
            <div className="mt-3 pt-3 border-t border-indigo-100/50 space-y-2">
              <div>
                <div className="flex items-center justify-between text-[9px] text-indigo-950 font-bold mb-0.5">
                  <span className="text-gray-500 font-semibold">Today's Visits</span>
                  <span className="font-mono">{detailedStats.today}</span>
                </div>
                <div className="w-full bg-indigo-100/30 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-1 rounded-full transition-all duration-500" 
                    style={{ width: `${detailedStats.total > 0 ? Math.min(100, (detailedStats.today / detailedStats.total) * 100) : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[9px] text-indigo-950 font-bold mb-0.5">
                  <span className="text-gray-500 font-semibold">Last 7 Days</span>
                  <span className="font-mono">{detailedStats.sevenDays}</span>
                </div>
                <div className="w-full bg-indigo-100/30 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-1 rounded-full transition-all duration-500" 
                    style={{ width: `${detailedStats.total > 0 ? Math.min(100, (detailedStats.sevenDays / detailedStats.total) * 100) : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[9px] text-indigo-950 font-bold mb-0.5">
                  <span className="text-gray-500 font-semibold">Last 30 Days</span>
                  <span className="font-mono">{detailedStats.oneMonth}</span>
                </div>
                <div className="w-full bg-indigo-100/30 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-1 rounded-full transition-all duration-500" 
                    style={{ width: `${detailedStats.total > 0 ? Math.min(100, (detailedStats.oneMonth / detailedStats.total) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <p className="text-[9px] text-gray-400 mt-2 font-semibold flex items-center gap-1">
            <span className={`w-1 h-1 rounded-full ${supabaseStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            <span>{supabaseStatus === 'connected' ? 'Live Supabase Sync Active' : 'Offline Local Storage'}</span>
          </p>
        </div>

        {/* Jobs Card */}
        <div className="bg-gradient-to-br from-teal-50/80 to-white p-4 rounded-2xl border border-teal-100/60 shadow-xs relative overflow-hidden group transition-all hover:border-teal-200/80 hover:shadow-sm">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Briefcase className="text-teal-600" size={44} />
          </div>
          <span className="text-[10px] text-teal-700/90 font-black uppercase tracking-widest font-display">
            Active Job Openings
          </span>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-teal-950 font-display tracking-tight">
              {jobs.length}
            </span>
            <span className="text-[10px] text-teal-600 font-extrabold font-mono uppercase">Live Listings</span>
          </div>
          <p className="text-[9px] text-gray-400 mt-2 font-semibold flex items-center gap-1">
            <span className="w-1 h-1 bg-teal-500 rounded-full" />
            <span>Fully accessible on candidate view</span>
          </p>
        </div>

        {/* Registered Users Card */}
        <div className="bg-gradient-to-br from-emerald-50/80 to-white p-4 rounded-2xl border border-emerald-100/60 shadow-xs relative overflow-hidden group transition-all hover:border-emerald-200/80 hover:shadow-sm">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="text-emerald-600" size={44} />
          </div>
          <span className="text-[10px] text-emerald-700/90 font-black uppercase tracking-widest font-display">
            Registered Profiles
          </span>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-emerald-950 font-display tracking-tight">
              {users.length}
            </span>
            <span className="text-[10px] text-emerald-600 font-extrabold font-mono uppercase font-bold">Candidates</span>
          </div>
          <p className="text-[9px] text-gray-400 mt-2 font-semibold flex items-center gap-1">
            <span className="w-1 h-1 bg-emerald-500 rounded-full" />
            <span>Job seekers & recruiter representatives</span>
          </p>
        </div>

        {/* Community posts card */}
        <div className="bg-gradient-to-br from-purple-50/80 to-white p-4 rounded-2xl border border-purple-100/60 shadow-xs relative overflow-hidden group transition-all hover:border-purple-200/80 hover:shadow-sm">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileText className="text-purple-600" size={44} />
          </div>
          <span className="text-[10px] text-purple-700/90 font-black uppercase tracking-widest font-display">
            Shared Discussions
          </span>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-purple-950 font-display tracking-tight">
              {posts.length}
            </span>
            <span className="text-[10px] text-purple-600 font-extrabold font-mono uppercase">User Posts</span>
          </div>
          <p className="text-[9px] text-gray-400 mt-2 font-semibold flex items-center gap-1">
            <span className={`w-1 h-1 rounded-full ${posts.filter(p => p.status === 'Pending').length > 0 ? 'bg-amber-500 animate-ping' : 'bg-purple-500'}`} />
            <span>{posts.filter(p => p.status === 'Pending').length} pending moderation reviews</span>
          </p>
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
            setActiveSubTab('contacts');
          }}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${
            activeSubTab === 'contacts' 
              ? 'text-teal-600 border-b-2 border-teal-600 font-extrabold' 
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          ✉️ Contact Submissions
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
          ⚙️ API Keys & DB Config
        </button>
      </div>

      {/* SUBTAB CONTENT: BRANDING & PORTAL CONTROLS */}
      {activeSubTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-1 space-y-6">
            {/* Form Branding */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
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

              {/* App Favicon Icon */}
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display">App Favicon Icon (.ico, .png, .svg)</label>
                <div className="mt-1 flex flex-col items-center gap-3 p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-50/80 transition-colors">
                  {faviconUrl ? (
                    <div className="relative group w-12 h-12 rounded-lg overflow-hidden border border-slate-100 shadow-sm bg-white flex items-center justify-center p-1">
                      <img src={faviconUrl} alt="App Favicon" className="max-w-full max-h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setFaviconUrl('')}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition-opacity cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-1">
                      <Globe className="mx-auto h-6 w-6 text-gray-400" />
                      <span className="text-[10px] font-bold text-teal-600 mt-1 cursor-pointer hover:underline">
                        Upload Favicon
                      </span>
                      <p className="text-[8px] text-gray-400 mt-0.5">Recommended: 32x32 PNG/ICO/SVG</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/x-icon,image/png,image/svg+xml,image/jpeg"
                    onChange={handleFaviconChange}
                    className="hidden"
                    id="favicon-file-input"
                    disabled={isUploadingFavicon}
                  />
                  {!faviconUrl && (
                    <button
                      type="button"
                      onClick={() => document.getElementById('favicon-file-input')?.click()}
                      className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-colors cursor-pointer"
                    >
                      {isUploadingFavicon ? 'Uploading...' : 'Browse File'}
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

          {/* Login Popup Customisation & Google Auth Controls */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest border-b border-gray-50 pb-2 flex items-center gap-1.5 font-display">
              <LogIn size={15} className="text-teal-600" />
              Sign In Popup Settings
            </h3>

            <p className="text-[10px] text-gray-500 leading-normal font-semibold">
              Fully customize the sign-in modal texts and control authentication mechanisms.
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display">Sign In Popup Title</label>
                <input
                  type="text"
                  value={loginTitle}
                  onChange={(e) => setLoginTitle(e.target.value)}
                  placeholder="Welcome to Jobview"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display">Sign In Popup Subtitle</label>
                <textarea
                  rows={3}
                  value={loginSubtitle}
                  onChange={(e) => setLoginSubtitle(e.target.value)}
                  placeholder="Sign in to unlock verified hiring managers, contact details, and our community wall."
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                />
              </div>

              <div className="p-3 bg-teal-50/20 rounded-xl border border-teal-100/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-850 font-display">Only Google Sign In</p>
                    <p className="text-[9px] text-slate-400 leading-normal font-medium mt-0.5">
                      Forces Google Auth by hiding manual email details forms and Fast-Pass demo credentials.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={googleOnly}
                      onChange={(e) => setGoogleOnly(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-250 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-350 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-teal-600"></div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingSettings}
                className={`w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/10 flex items-center justify-center gap-1.5 font-display ${
                  isSavingSettings ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <Save size={14} className={isSavingSettings ? 'animate-spin' : ''} />
                <span>{isSavingSettings ? 'Saving Popup Config...' : 'Save Popup Settings'}</span>
              </button>
            </form>
          </div>
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
                
                <div className="flex items-center gap-2">
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
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase">Employment Type / Hiring Type</label>
                      <input
                        type="text" value={jobContractType} onChange={(e) => setJobContractType(e.target.value)}
                        placeholder="Full-Time / Direct Hiring"
                        className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase">Application URL (Optional)</label>
                      <input
                        type="url" value={jobApplyLink} onChange={(e) => setJobApplyLink(e.target.value)}
                        placeholder="https://vercel.com/careers"
                        className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase">HR Recruiter Email (Optional)</label>
                      <input
                        type="email" value={jobEmail} onChange={(e) => setJobEmail(e.target.value)}
                        placeholder="careers@company.com"
                        className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase">HR Recruiter Phone (Optional)</label>
                      <input
                        type="text" value={jobPhone} onChange={(e) => setJobPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase">WhatsApp Intent Number (Optional)</label>
                      <input
                        type="text" value={jobWhatsapp} onChange={(e) => setJobWhatsapp(e.target.value)}
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
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display">Company Logo Image (Optional)</label>
                    <div className="mt-1 flex flex-col sm:flex-row items-center gap-4">
                      {jobCompanyLogoUrl ? (
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200/60 bg-slate-50 shadow-xs shrink-0 flex items-center justify-center group">
                          <img src={jobCompanyLogoUrl} alt="Company Logo Preview" className="w-full h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => setJobCompanyLogoUrl('')}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                            title="Remove Logo"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div
                          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                          onDragLeave={() => setIsDragOver(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragOver(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handleJobCompanyLogoChange(e.dataTransfer.files[0]);
                            }
                          }}
                          onClick={() => document.getElementById('job-logo-file-input')?.click()}
                          className={`w-full sm:flex-1 h-16 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 px-4 cursor-pointer transition-all ${
                            isDragOver 
                              ? 'border-teal-500 bg-teal-50/30' 
                              : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                          }`}
                        >
                          <UploadCloud size={18} className={isDragOver ? 'text-teal-500 animate-bounce' : 'text-slate-400'} />
                          <div className="text-left">
                            <p className="text-[11px] font-semibold text-slate-700">
                              {isUploadingJobCompanyLogo ? 'Uploading logo...' : 'Drag & drop or Click to Upload'}
                            </p>
                            <p className="text-[9px] text-slate-400">PNG, JPG, WebP up to 5MB</p>
                          </div>
                        </div>
                      )}
                      
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleJobCompanyLogoChange(e.target.files[0]);
                          }
                        }}
                        id="job-logo-file-input"
                        className="hidden"
                        disabled={isUploadingJobCompanyLogo}
                      />
                      
                      {jobCompanyLogoUrl && (
                        <p className="text-[10px] text-gray-500 italic">
                          Custom logo is set. It will override the color preset below.
                        </p>
                      )}
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

          {/* Supabase SQL Schema Helper Modal */}
          {showSqlHelper && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
              <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-gray-100 shadow-2xl space-y-4">
                <div className="flex items-center gap-3 text-amber-600">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                    <Database size={20} />
                  </div>
                  <div className="text-left">
                    <h4 className="font-extrabold text-slate-900 tracking-tight text-sm font-display">Supabase Database Tables Schema Helper</h4>
                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Required Tables Schema Setup</p>
                  </div>
                </div>
                
                <div className="text-xs text-gray-600 leading-relaxed font-semibold text-left space-y-2">
                  <p>
                    Please paste this SQL script into your <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-bold animate-pulse">Supabase SQL Editor</a> to create all tables and enable anon Row Level Security (RLS) policies:
                  </p>
                  
                  <div className="relative">
                    <pre className="p-3 bg-slate-950 text-slate-100 rounded-xl font-mono text-[9px] overflow-x-auto max-h-72 whitespace-pre leading-normal">
{`-- 1. JOBS TABLE
CREATE TABLE IF NOT EXISTS public.jobs (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT NOT NULL,
    company_name TEXT,
    company_logo_url TEXT,
    location TEXT,
    salary TEXT,
    short_description TEXT,
    full_description TEXT,
    description TEXT,
    apply_link TEXT,
    date_posted TEXT,
    is_live BOOLEAN DEFAULT TRUE,
    category TEXT,
    experience TEXT,
    contract_type TEXT
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.jobs FOR SELECT TO public USING (true);
CREATE POLICY "Allow anon insert" ON public.jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.jobs FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.jobs FOR DELETE USING (true);

-- 2. COMMUNITY POSTS TABLE
CREATE TABLE IF NOT EXISTS public.community_posts (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id TEXT,
    user_name TEXT,
    user_avatar TEXT,
    image_url TEXT,
    caption TEXT,
    bookmarks_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Pending'
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.community_posts FOR SELECT TO public USING (true);
CREATE POLICY "Allow anon insert" ON public.community_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.community_posts FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.community_posts FOR DELETE USING (true);

-- 3. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT,
    email TEXT,
    avatar TEXT,
    join_date TEXT,
    trial_expiry_date TEXT,
    subscription_status TEXT,
    bio TEXT
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.users FOR SELECT TO public USING (true);
CREATE POLICY "Allow anon insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.users FOR DELETE USING (true);

-- 4. PAYMENT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.payment_logs (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id TEXT,
    user_email TEXT,
    amount NUMERIC,
    status TEXT,
    tx_id TEXT
);

ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.payment_logs FOR SELECT TO public USING (true);
CREATE POLICY "Allow anon insert" ON public.payment_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.payment_logs FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.payment_logs FOR DELETE USING (true);

-- 5. PAGES TABLE
CREATE TABLE IF NOT EXISTS public.pages (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT,
    slug TEXT,
    content TEXT,
    show_in_footer BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.pages FOR SELECT TO public USING (true);
CREATE POLICY "Allow anon insert" ON public.pages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.pages FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.pages FOR DELETE USING (true);

-- 6. CONTACTS TABLE
CREATE TABLE IF NOT EXISTS public.contacts (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT,
    email TEXT,
    subject TEXT,
    message TEXT
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.contacts FOR SELECT TO public USING (true);
CREATE POLICY "Allow anon insert" ON public.contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.contacts FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.contacts FOR DELETE USING (true);

-- 7. ADMIN SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id TEXT PRIMARY KEY DEFAULT 'global_settings',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    brand_name TEXT,
    tagline TEXT,
    logo_url TEXT,
    banner_url TEXT,
    banner_html TEXT,
    premium_mode BOOLEAN DEFAULT TRUE,
    membership_price NUMERIC DEFAULT 499,
    currency TEXT DEFAULT 'INR',
    paywall_features TEXT,
    paywall_title TEXT,
    paywall_subtitle TEXT,
    paywall_button_text TEXT,
    paywall_price_description TEXT,
    paywall_footer_text TEXT,
    paywall_extend_title TEXT,
    paywall_extend_subtitle TEXT,
    paywall_extend_button_text TEXT,
    cashfree_app_id TEXT,
    cashfree_secret_key TEXT,
    post_approval_mode BOOLEAN DEFAULT TRUE,
    supabase_url TEXT,
    supabase_anon_key TEXT,
    supabase_service_role_key TEXT
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.admin_settings FOR SELECT TO public USING (true);
CREATE POLICY "Allow anon insert" ON public.admin_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.admin_settings FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.admin_settings FOR DELETE USING (true);

-- 8. SAVED POSTS TABLE
CREATE TABLE IF NOT EXISTS public.saved_posts (
    user_id TEXT NOT NULL,
    post_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.saved_posts FOR SELECT TO public USING (true);
CREATE POLICY "Allow anon insert" ON public.saved_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.saved_posts FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.saved_posts FOR DELETE USING (true);

-- 9. REPORTED POSTS TABLE
CREATE TABLE IF NOT EXISTS public.reported_posts (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id TEXT,
    post_id TEXT,
    reason TEXT,
    reported_at TEXT
);

ALTER TABLE public.reported_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.reported_posts FOR SELECT TO public USING (true);
CREATE POLICY "Allow anon insert" ON public.reported_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.reported_posts FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.reported_posts FOR DELETE USING (true);

-- 10. ANALYTICS TABLE
CREATE TABLE IF NOT EXISTS public.analytics (
    id TEXT PRIMARY KEY,
    visit_count INT DEFAULT 0
);

ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.analytics FOR SELECT TO public USING (true);
CREATE POLICY "Allow anon insert" ON public.analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.analytics FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.analytics FOR DELETE USING (true);

-- Insert initial row if not exists
INSERT INTO public.analytics (id, visit_count)
VALUES ('site-visitors', 0)
ON CONFLICT (id) DO NOTHING;`}
                    </pre>
                    <button
                      onClick={() => {
                        const sqlText = `-- 1. JOBS TABLE
CREATE TABLE IF NOT EXISTS public.jobs (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT NOT NULL,
    company_name TEXT,
    company_logo_url TEXT,
    location TEXT,
    salary TEXT,
    short_description TEXT,
    full_description TEXT,
    description TEXT,
    apply_link TEXT,
    date_posted TEXT,
    is_live BOOLEAN DEFAULT TRUE,
    category TEXT,
    experience TEXT,
    contract_type TEXT
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.jobs FOR SELECT TO public USING (true);
CREATE POLICY "Allow anon insert" ON public.jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.jobs FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.jobs FOR DELETE USING (true);

-- 2. COMMUNITY POSTS TABLE
CREATE TABLE IF NOT EXISTS public.community_posts (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id TEXT,
    user_name TEXT,
    user_avatar TEXT,
    image_url TEXT,
    caption TEXT,
    bookmarks_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Pending'
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.community_posts FOR SELECT TO public USING (true);
CREATE POLICY "Allow anon insert" ON public.community_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.community_posts FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.community_posts FOR DELETE USING (true);

-- 3. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT,
    email TEXT,
    avatar TEXT,
    join_date TEXT,
    trial_expiry_date TEXT,
    subscription_status TEXT,
    bio TEXT
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.users FOR SELECT TO public USING (true);
CREATE POLICY "Allow anon insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.users FOR DELETE USING (true);

-- 4. PAYMENT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.payment_logs (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id TEXT,
    user_email TEXT,
    amount NUMERIC,
    status TEXT,
    tx_id TEXT
);

ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.payment_logs FOR SELECT TO public USING (true);
CREATE POLICY "Allow anon insert" ON public.payment_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.payment_logs FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.payment_logs FOR DELETE USING (true);

-- 5. PAGES TABLE
CREATE TABLE IF NOT EXISTS public.pages (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT,
    slug TEXT,
    content TEXT,
    show_in_footer BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.pages FOR SELECT TO public USING (true);
CREATE POLICY "Allow anon insert" ON public.pages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.pages FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.pages FOR DELETE USING (true);

-- 6. CONTACTS TABLE
CREATE TABLE IF NOT EXISTS public.contacts (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT,
    email TEXT,
    subject TEXT,
    message TEXT
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.contacts FOR SELECT TO public USING (true);
CREATE POLICY "Allow anon insert" ON public.contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.contacts FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.contacts FOR DELETE USING (true);

-- 7. ADMIN SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id TEXT PRIMARY KEY DEFAULT 'global_settings',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    brand_name TEXT,
    tagline TEXT,
    logo_url TEXT,
    banner_url TEXT,
    banner_html TEXT,
    premium_mode BOOLEAN DEFAULT TRUE,
    membership_price NUMERIC DEFAULT 499,
    currency TEXT DEFAULT 'INR',
    paywall_features TEXT,
    paywall_title TEXT,
    paywall_subtitle TEXT,
    paywall_button_text TEXT,
    paywall_price_description TEXT,
    paywall_footer_text TEXT,
    paywall_extend_title TEXT,
    paywall_extend_subtitle TEXT,
    paywall_extend_button_text TEXT,
    cashfree_app_id TEXT,
    cashfree_secret_key TEXT,
    post_approval_mode BOOLEAN DEFAULT TRUE,
    supabase_url TEXT,
    supabase_anon_key TEXT,
    supabase_service_role_key TEXT
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.admin_settings FOR SELECT TO public USING (true);
CREATE POLICY "Allow anon insert" ON public.admin_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.admin_settings FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.admin_settings FOR DELETE USING (true);

-- 8. SAVED POSTS TABLE
CREATE TABLE IF NOT EXISTS public.saved_posts (
    user_id TEXT NOT NULL,
    post_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.saved_posts FOR SELECT TO public USING (true);
CREATE POLICY "Allow anon insert" ON public.saved_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.saved_posts FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.saved_posts FOR DELETE USING (true);

-- 9. REPORTED POSTS TABLE
CREATE TABLE IF NOT EXISTS public.reported_posts (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id TEXT,
    post_id TEXT,
    reason TEXT,
    reported_at TEXT
);

ALTER TABLE public.reported_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.reported_posts FOR SELECT TO public USING (true);
CREATE POLICY "Allow anon insert" ON public.reported_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.reported_posts FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.reported_posts FOR DELETE USING (true);

-- 10. ANALYTICS TABLE
CREATE TABLE IF NOT EXISTS public.analytics (
    id TEXT PRIMARY KEY,
    visit_count INT DEFAULT 0
);

ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.analytics FOR SELECT TO public USING (true);
CREATE POLICY "Allow anon insert" ON public.analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.analytics FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.analytics FOR DELETE USING (true);

-- Insert initial row if not exists
INSERT INTO public.analytics (id, visit_count)
VALUES ('site-visitors', 0)
ON CONFLICT (id) DO NOTHING;`;
                        navigator.clipboard.writeText(sqlText);
                        alert('All SQL Schemas copied to clipboard!');
                      }}
                      className="absolute top-2 right-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[9px] font-bold text-white rounded transition-colors cursor-pointer animate-pulse"
                    >
                      Copy All Tables SQL
                    </button>
                  </div>
                  
                  <p className="text-slate-500 text-[10px] font-normal italic">
                    Note: While the tables are being created, the application will seamlessly serve and save data through the local JSON store (db.json) as a fallback so your users face absolutely zero downtime!
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowSqlHelper(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Close Helper
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

            {/* Custom Paywall Text Elements */}
            <div className="border-t border-slate-100 pt-4 space-y-4">
              <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider font-display">
                New User Subscription Pop-up Texts
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display">Subscription Title</label>
                  <input
                    type="text" value={paywallTitle} onChange={(e) => setPaywallTitle(e.target.value)}
                    placeholder="Activate Premium"
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                  />
                </div>
                
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display">Subscription Button Text</label>
                  <input
                    type="text" value={paywallButtonText} onChange={(e) => setPaywallButtonText(e.target.value)}
                    placeholder="Activate Membership Now"
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display">Subscription Subtitle / Description</label>
                <textarea
                  rows={2} value={paywallSubtitle} onChange={(e) => setPaywallSubtitle(e.target.value)}
                  placeholder="Unlock Premium access to continue searching & applying."
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/10 font-sans"
                />
              </div>
            </div>



            <div className="border-t border-slate-100 pt-4 space-y-4 pb-2">
              <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider font-display">
                Shared Checkout Text Fields
              </h4>

              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display">Plan Card Description Text</label>
                <input
                  type="text" value={paywallPriceDescription} onChange={(e) => setPaywallPriceDescription(e.target.value)}
                  placeholder="One-time manual purchase. Extend anytime."
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display">Footer Disclaimer / Gateway Details Text</label>
                <textarea
                  rows={2} value={paywallFooterText} onChange={(e) => setPaywallFooterText(e.target.value)}
                  placeholder="Secured & processed under Cashfree SDK Gateway. This is a one-time manual charge. No automatic renewals or recurring billing cycles."
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/10 font-sans"
                />
              </div>
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
          
          {/* Left Column Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Credentials Settings Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
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

            {/* Supabase Configuration Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest border-b border-gray-50 pb-2 flex items-center gap-1.5 font-display">
                <Database size={15} className="text-teal-600" />
                Supabase Connection settings
              </h3>

              <p className="text-[10px] text-gray-500 leading-normal font-semibold">
                Re-submit or configure your custom Supabase Project credentials. They will update immediately on both the client and server!
              </p>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display">Supabase URL</label>
                  <input
                    type="text"
                    placeholder="https://your-project-id.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-950 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/10 font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between font-display">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display">Supabase Anon Key</label>
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="text-xs text-teal-600 font-bold hover:underline"
                    >
                      {showSecret ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showSecret ? 'text' : 'password'}
                    placeholder="eyJhbGciOiJIUzI1NiIs..."
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-950 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/10 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display">Supabase Service Role Key (Optional)</label>
                  <input
                    type={showSecret ? 'text' : 'password'}
                    placeholder="For server-side admin / auth operations"
                    value={supabaseServiceRoleKey}
                    onChange={(e) => setSupabaseServiceRoleKey(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-950 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/10 font-mono"
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
                  <span>{isSavingSettings ? 'Applying DB Settings...' : 'Apply DB Settings'}</span>
                </button>
              </form>
            </div>

            {/* Google Search Console Verification Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest border-b border-gray-50 pb-2 flex items-center gap-1.5 font-display">
                <Globe size={15} className="text-teal-600" />
                Google Search Console
              </h3>

              <p className="text-[10px] text-gray-500 leading-normal font-semibold">
                Verify ownership and index your job portal. Supports HTML file hash codes (e.g. google1234567.html) and meta-tags.
              </p>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display">Verification Token / Code</label>
                  <input
                    type="text"
                    value={googleSiteVerification}
                    onChange={(e) => setGoogleSiteVerification(e.target.value)}
                    placeholder="e.g. google876543210abcdef"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-gray-950 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/10 font-mono"
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
                  <span>{isSavingSettings ? 'Saving...' : 'Save Verification Code'}</span>
                </button>
              </form>
            </div>
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
                          {confirmPostDeleteId === post.id ? (
                            <div className="flex items-center gap-1 bg-rose-50 border border-rose-100 rounded-lg p-0.5 animate-fade-in">
                              <button
                                onClick={async () => {
                                  await onDeletePost(post.id);
                                  setConfirmPostDeleteId(null);
                                }}
                                className="px-2 py-1 text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-colors cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setConfirmPostDeleteId(null)}
                                className="px-1.5 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 rounded-md transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmPostDeleteId(post.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              title="Reject Post"
                            >
                              <Trash2 size={12} />
                              <span>Reject</span>
                            </button>
                          )}
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
                      
                      <div className="flex items-center gap-1 shrink-0">
                        {confirmPostDeleteId === post.id ? (
                          <div className="flex items-center gap-1 bg-rose-50 border border-rose-100 rounded-lg p-0.5 animate-fade-in">
                            <button
                              onClick={async () => {
                                await onDeletePost(post.id);
                                setConfirmPostDeleteId(null);
                              }}
                              className="px-2 py-0.5 text-[9px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-colors cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmPostDeleteId(null)}
                              className="px-1.5 py-0.5 text-[9px] font-bold text-slate-500 hover:text-slate-800 rounded-md transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmPostDeleteId(post.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Live Post"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>

          {/* Community Feed Customization Section */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest border-b border-gray-50 pb-2 flex items-center gap-1.5 font-display">
              <Users size={15} className="text-teal-600" />
              Community Feed Customization
            </h3>
            <p className="text-[10px] text-gray-500 font-semibold leading-normal">
              Customize placeholder text and guidelines shown on the community feed to your users.
            </p>

            <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display">Post Placeholder Text</label>
                <input
                  type="text"
                  value={communityMindPlaceholder}
                  onChange={(e) => setCommunityMindPlaceholder(e.target.value)}
                  placeholder="e.g. What's on your mind, {name}?"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-gray-950 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                />
                <p className="text-[9px] text-gray-400 mt-1">
                  Default placeholder: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">What's on your mind, {"{name}"}?</code> (Leave empty to use default)
                </p>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display">Review Guideline / Notice Description</label>
                <input
                  type="text"
                  value={communityReviewNotice}
                  onChange={(e) => setCommunityReviewNotice(e.target.value)}
                  placeholder="e.g. Posts are reviewed before going live."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-gray-950 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                />
                <p className="text-[9px] text-gray-400 mt-1">
                  Default notice: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">Posts are reviewed before going live.</code> (Leave empty to use default)
                </p>
              </div>

              <div className="md:col-span-2 pt-2 border-t border-slate-50">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className={`px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/10 flex items-center gap-1.5 font-display ${
                    isSavingSettings ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <Save size={14} className={isSavingSettings ? 'animate-spin' : ''} />
                  <span>{isSavingSettings ? 'Saving...' : 'Save Community Settings'}</span>
                </button>
              </div>
            </form>
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

      {activeSubTab === 'contacts' && (
        <div className="space-y-6 animate-fade-in" id="admin-contacts-subtab">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 pb-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest flex items-center gap-1.5 font-display">
                  <Mail size={15} className="text-teal-600" />
                  Customer & User Enquiries
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  View and manage contact form submissions sent from the footer contact page.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchContacts}
                  disabled={isLoadingContacts}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all text-slate-700 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw size={12} className={isLoadingContacts ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Quick Stats & Search */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 bg-white text-teal-600 border border-slate-200/50 rounded-xl flex items-center justify-center shadow-xs shrink-0">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Total Submissions</p>
                  <p className="text-lg font-extrabold text-slate-900">{contacts.length}</p>
                </div>
              </div>

              <div className="md:col-span-2 relative flex items-center">
                <span className="absolute left-3.5 text-gray-400 pointer-events-none">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  value={contactSearchQuery}
                  onChange={(e) => setContactSearchQuery(e.target.value)}
                  placeholder="Search by name, email, subject, or message..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Table */}
            <div className="mt-6 border border-gray-100 rounded-2xl overflow-hidden">
              {isLoadingContacts ? (
                <div className="p-12 text-center text-xs text-slate-400 font-medium">
                  <RefreshCw size={24} className="animate-spin text-teal-600 mx-auto mb-2" />
                  Loading message entries...
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 font-medium space-y-1">
                  <p>No messages found.</p>
                  {contactSearchQuery && <p className="text-[10px]">Try resetting your search query.</p>}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Date / Status</th>
                        <th className="py-3 px-4">Sender Details</th>
                        <th className="py-3 px-4">Subject & Message</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-slate-700 font-medium">
                      {filteredContacts.map((c: any) => (
                        <tr key={c.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono text-gray-400 block">
                                {new Date(c.createdAt).toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide bg-teal-50 text-teal-700 border border-teal-100">
                                New
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-0.5">
                              <p className="font-bold text-slate-900">{c.name}</p>
                              <a
                                href={`mailto:${c.email}`}
                                className="text-[10px] font-mono text-teal-600 hover:underline block"
                              >
                                {c.email}
                              </a>
                            </div>
                          </td>
                          <td className="py-4 px-4 max-w-md">
                            <div className="space-y-1">
                              <p className="font-bold text-slate-800">{c.subject}</p>
                              <p className="text-gray-500 whitespace-pre-wrap leading-relaxed text-[11px] bg-slate-50/50 p-2.5 rounded-xl border border-slate-200/30 font-medium">
                                {c.message}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            {contactIdToConfirmDelete === c.id ? (
                              <div className="inline-flex items-center gap-1.5 bg-rose-50/90 p-1.5 rounded-xl border border-rose-100 animate-in fade-in zoom-in-95 duration-150">
                                <span className="text-[10px] text-rose-700 font-bold px-1 select-none">Delete?</span>
                                <button
                                  onClick={() => handleDeleteContact(c.id)}
                                  className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer transition-all duration-150 shadow-sm"
                                  title="Confirm Delete"
                                >
                                  <Check size={11} strokeWidth={2.5} />
                                </button>
                                <button
                                  onClick={() => setContactIdToConfirmDelete(null)}
                                  className="p-1.5 bg-white hover:bg-slate-100 text-slate-500 rounded-lg cursor-pointer border border-slate-200 transition-all duration-150"
                                  title="Cancel"
                                >
                                  <X size={11} strokeWidth={2.5} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setContactIdToConfirmDelete(c.id)}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl cursor-pointer transition-colors"
                                title="Delete Submission"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
