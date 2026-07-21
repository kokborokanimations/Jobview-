/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Job {
  id: string;
  companyName: string;
  companyLogoIndex: number; // For elegant colored icon-based placeholders (0 to 5)
  companyLogoUrl?: string;
  title: string;
  location: string;
  shortDescription: string;
  fullDescription: string;
  qualifications: string;
  salary?: string;
  isLive: boolean;
  applyLink: string;
  email: string;
  phone: string;
  whatsapp: string;
  createdAt: string;
  datePosted?: string;
  whatsappEnabled?: boolean;
  callEnabled?: boolean;
  emailEnabled?: boolean;
  applyEnabled?: boolean;
  contractType?: string;
  isHot?: boolean;
}

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  imageUrl: string;
  caption: string;
  bookmarksCount: number;
  sharesCount: number;
  createdAt: string;
  status: 'Live' | 'Pending';
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinDate: string;
  trialExpiryDate: string;
  subscriptionStatus: 'Free Trial' | 'Active' | 'Expired';
  bio?: string;
  plan_expiry_date?: string;
  planExpiryDate?: string;
  role?: 'admin' | 'member';
}

export interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  showInFooter: boolean;
  isSystem?: boolean;
}

export interface AdminSettings {
  brandName: string;
  tagline: string;
  shareTitle?: string;
  shareDesc?: string;
  shareImg?: string;
  logoUrl: string; // If empty, we can render a gorgeous Lucide icon
  faviconUrl?: string; // App Favicon Icon URL
  bannerUrl: string; // Job Feed Banner
  bannerHtml?: string; // Customizable Rich Text Banner
  bannerHeightType?: 'default' | 'small' | 'medium' | 'large' | 'custom';
  bannerHeightCustomValue?: number;
  bannerObjectFit?: 'cover' | 'contain' | 'fill';
  bannerPosition?: 'center' | 'top' | 'bottom';
  premiumMode: boolean;
  communityPremiumMode?: boolean;
  membershipPrice: number;
  currency: string;
  paywallFeatures: string[];
  paywallTitle?: string;
  paywallSubtitle?: string;
  paywallButtonText?: string;
  paywallPriceDescription?: string;
  paywallFooterText?: string;
  paywallExtendTitle?: string;
  paywallExtendSubtitle?: string;
  paywallExtendButtonText?: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  cashfreeAppId?: string;
  cashfreeSecretKey?: string;
  cashfreeSandbox?: boolean;
  postApprovalMode?: boolean; // Master Toggle: manual approval vs automatic instant
  showJobFilters?: boolean; // Toggle to show/hide Search and Filter component in Job Feed
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceRoleKey?: string;
  serpapiApiKey?: string;
  googleSiteVerification?: string;
  oneSignalCode?: string;
  oneSignalAppId?: string;
  oneSignalRestApiKey?: string;
  oneSignalAutoNotify?: boolean;
  oneSignalCommunityNotify?: boolean;
  oneSignalPromptTitle?: string;
  oneSignalPromptSubtitle?: string;
  oneSignalPromptDesc?: string;
  oneSignalPromptBtnDismiss?: string;
  oneSignalPromptBtnAllow?: string;
  fcmConfigJson?: string;
  fcmVapidKey?: string;
  fcmServerKey?: string;
  fcmServiceAccountJson?: string;
  fcmAutoNotify?: boolean;
  communityMindPlaceholder?: string;
  communityReviewNotice?: string;
  loginTitle?: string;
  loginSubtitle?: string;
  googleOnly?: boolean;
  hotJobsTitle?: string;
  hotJobsSubtitle?: string;
  hotJobsSliderTimer?: number;
  hotJobsSliderEnabled?: boolean;
  hotJobsShowSlider?: boolean;
  hotJobsAutoSlideEnabled?: boolean;
  hotJobsCardBgType?: 'preset' | 'custom_solid' | 'custom_gradient';
  hotJobsCardPresetTheme?: 'amber' | 'emerald' | 'indigo' | 'rose' | 'ocean' | 'dark';
  hotJobsCardBgColor?: string;
  hotJobsCardBgGradientFrom?: string;
  hotJobsCardBgGradientTo?: string;
  hotJobsCardTextColor?: string;
  hotJobsCardBorderColor?: string;
  hotJobsCardTitleColor?: string;
  hotJobsCardAccentColor?: string;
}

export interface PaymentLog {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  txId: string;
  createdAt: string;
}
