/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';
// Firebase initialization completely removed in favor of Supabase

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'db.json');

app.use(express.json({ limit: '10mb' }));

// Middleware to handle dynamic client-side Supabase credentials sync (Self-healing restore mechanism)
app.use(async (req, res, next) => {
  const xSupabaseUrl = req.headers['x-supabase-url'] as string;
  const xSupabaseAnonKey = req.headers['x-supabase-anon-key'] as string;
  const xSupabaseServiceRoleKey = req.headers['x-supabase-service-role-key'] as string;

  if (xSupabaseUrl && xSupabaseAnonKey) {
    const db = readDB();
    const currentUrl = db.adminSettings?.supabaseUrl;
    const currentAnon = db.adminSettings?.supabaseAnonKey;
    const currentServiceRole = db.adminSettings?.supabaseServiceRoleKey;

    // If credentials are changed or currently blank on server side, hydrate immediately
    if (xSupabaseUrl !== currentUrl || xSupabaseAnonKey !== currentAnon || (xSupabaseServiceRoleKey && xSupabaseServiceRoleKey !== currentServiceRole)) {
      if (!db.adminSettings) db.adminSettings = {};
      db.adminSettings.supabaseUrl = xSupabaseUrl;
      db.adminSettings.supabaseAnonKey = xSupabaseAnonKey;
      if (xSupabaseServiceRoleKey) {
        db.adminSettings.supabaseServiceRoleKey = xSupabaseServiceRoleKey;
      }
      writeDB(db);
      console.log('[Middleware Sync] Hydrated server-side Supabase config from client headers!');

      try {
        const tempSupabase = createClient(xSupabaseUrl, xSupabaseAnonKey);
        
        // Settings Sync (Synchronous to make sure API returns correct branding on first call)
        const { data: sData, error: sErr } = await tempSupabase
          .from('admin_settings')
          .select('*')
          .eq('id', 'global_settings')
          .single();
        if (!sErr && sData) {
          const mapped = mapSettingsFromSupabase(sData, db.adminSettings);
          db.adminSettings = { ...db.adminSettings, ...mapped };
          writeDB(db);
          console.log('[Middleware Sync] Loaded admin settings from Supabase successfully.');
        }

        // Other tables can sync in the background so we don't block the request
        tempSupabase
          .from('jobs')
          .select('*')
          .order('created_at', { ascending: false })
          .then(({ data: jData, error: jErr }) => {
            if (!jErr && jData) {
              const freshDb = readDB();
              const localJobs = freshDb.jobs || [];
              const localJobsMap = new Map(localJobs.map((j: any) => [j.id, j]));
              
              freshDb.jobs = jData.map((jobRow: any) => {
                const mapped = mapJobFromSupabase(jobRow);
                // Preserve local isHot if missing/undefined in Supabase row
                if (jobRow.is_hot === undefined && jobRow.isHot === undefined) {
                  const localJob: any = localJobsMap.get(mapped.id);
                  if (localJob && localJob.isHot !== undefined) {
                    mapped.isHot = localJob.isHot;
                  }
                }
                return mapped;
              });
              writeDB(freshDb);
            }
          });

        tempSupabase
          .from('pages')
          .select('*')
          .then(({ data: pData, error: pErr }) => {
            if (!pErr && pData) {
              const freshDb = readDB();
              const mappedPages = pData.map(mapPageFromSupabase);
              mappedPages.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
              freshDb.pages = mappedPages;
              writeDB(freshDb);
            }
          });

        tempSupabase
          .from('resumes')
          .select('*')
          .then(({ data: rData, error: rErr }) => {
            if (!rErr && rData) {
              const freshDb = readDB();
              freshDb.resumes = rData.map(mapResumeFromSupabase);
              writeDB(freshDb);
            } else {
              tempSupabase
                .from('user_resumes')
                .select('*')
                .then(({ data: altR, error: altRErr }) => {
                  if (!altRErr && altR) {
                    const freshDb = readDB();
                    freshDb.resumes = altR.map(mapResumeFromSupabase);
                    writeDB(freshDb);
                  }
                });
            }
          });
      } catch (syncErr: any) {
        console.warn('[Middleware Sync Warn] Background sync failed:', syncErr.message);
      }
    }
  }
  next();
});

// Ensure DB exists with default realistic data
function initDB() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (data.adminSettings && data.jobs && data.communityPosts && data.users && data.paymentLogs && data.pages) {
        return; // DB looks healthy
      }
    } catch (e) {
      console.error("Error reading db.json, re-initializing", e);
    }
  }

  const initialData = {
    adminSettings: {
      brandName: 'Sebok',
      tagline: 'Your Premium Portal to Verified Careers & Networking',
      logoUrl: '',
      faviconUrl: '',
      bannerUrl: 'https://crdmccidgzknnylyggbf.supabase.co/storage/v1/object/public/branding/app_logo_1783614864312.jpg',
      premiumMode: true,
      membershipPrice: 499,
      currency: 'INR',
      paywallFeatures: [
        'Unlimited Premium Job Applications',
        'Access Live HR/Recruiter Contact Details',
        'Post in Community Feed with Image Uploads',
        'Direct WhatsApp Chat with Hiring Managers',
        'Priority Technical Support & Live Resume Tips'
      ],
      razorpayKeyId: '',
      razorpayKeySecret: '',
      cashfreeAppId: '',
      cashfreeSecretKey: '',
      postApprovalMode: true, // Manual post approval mode (ON) by default
      oneSignalAppId: '',
      oneSignalRestApiKey: '',
      oneSignalAutoNotify: true,
      loginTitle: 'Welcome to Sebok',
      loginSubtitle: 'Sign in to unlock verified hiring managers, contact details, and our community wall.'
    },
    jobs: [
      {
        id: 'job-1',
        companyName: 'Vercel',
        companyLogoIndex: 0,
        title: 'Frontend Engineer (React & Tailwind)',
        location: 'Remote, India',
        shortDescription: 'Join the team building the future of the Web. Scale React interfaces and elevate designer experience.',
        fullDescription: 'We are looking for an exceptional Frontend Engineer to join our core team. You will collaborate with designers and system engineers to implement highly polished, responsive, and performance-optimized UI layouts using React and Tailwind CSS. You will directly contribute to Vercel products and improve developer tooling around Next.js and Tailwind.',
        qualifications: '3+ years of React development, complete mastery of Tailwind CSS, deep understanding of build tools, and performance profiling.',
        salary: '₹18,00,000 - ₹24,0,000 / year',
        isLive: true,
        applyLink: 'https://vercel.com/careers',
        email: 'careers@vercel.com',
        phone: '+91 98765 43210',
        whatsapp: '919876543210',
        createdAt: new Date().toISOString(),
        whatsappEnabled: true,
        callEnabled: true,
        emailEnabled: true,
        applyEnabled: true
      },
      {
        id: 'job-2',
        companyName: 'Figma',
        companyLogoIndex: 1,
        title: 'Senior UI/UX Designer',
        location: 'Bangalore, Karnataka (Hybrid)',
        shortDescription: 'Craft the design tools used by millions of creators globally. Define desktop and mobile user interfaces.',
        fullDescription: 'Figma is seeking a Lead UI/UX Designer who is passionate about creating clean, delightful, and highly accessible user interfaces. You will have direct ownership of design system components and lead critical feature flows from discovery to shipping. You will conduct user research and translate complex flows into beautiful, easy-to-use digital spaces.',
        qualifications: 'High proficiency in typography, interaction design, vector workflows, interactive prototyping, and modern design tools.',
        salary: '₹25,0,000 - ₹32,0,000 / year',
        isLive: true,
        applyLink: 'https://figma.com/careers',
        email: 'design-careers@figma.com',
        phone: '+91 98123 45678',
        whatsapp: '919812345678',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        whatsappEnabled: true,
        callEnabled: true,
        emailEnabled: true,
        applyEnabled: true
      },
      {
        id: 'job-3',
        companyName: 'Cashfree Payments',
        companyLogoIndex: 2,
        title: 'Full-Stack Developer (Express & Node)',
        location: 'Mumbai, Maharashtra',
        shortDescription: 'Power scalable digital payments for millions of merchants. Excel in Node.js, Express, and React.',
        fullDescription: 'Join our payments platform squad to build robust, secure, and lightning-fast payment routing systems. You will build user-facing billing dashboards, integrate third-party APIs, and maintain high-throughput backend services that power digital transactions.',
        qualifications: 'Strong grasp of Node.js, relational databases, API gateway security, webhook handlers, and modern web applications.',
        salary: '₹15,0,000 - ₹20,0,000 / year',
        isLive: true,
        applyLink: 'https://cashfree.com/jobs',
        email: 'tech-recruiting@cashfree.com',
        phone: '+91 99008 87766',
        whatsapp: '919900887766',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        whatsappEnabled: true,
        callEnabled: true,
        emailEnabled: true,
        applyEnabled: true
      },
      {
        id: 'job-4',
        companyName: 'Hugging Face',
        companyLogoIndex: 3,
        title: 'AI Engineer (LLMs & RAG Systems)',
        location: 'Remote, Global',
        shortDescription: 'Shape open-source machine learning. Develop and scale retrieval-augmented generation pipelines.',
        fullDescription: 'Hugging Face is on a mission to democratize good machine learning. As an AI Engineer, you will build and optimize inference services, write custom fine-tuning scripts, and contribute to standardizing open AI pipelines. You will design, build, and deploy high-performance applications leveraging modern language models and vector search databases.',
        qualifications: 'Experience with PyTorch, Transformers, vector stores, deploying models to production clouds, and Node/React prototyping.',
        salary: '₹30,0,000 - ₹45,0,000 / year',
        isLive: true,
        applyLink: 'https://huggingface.co/careers',
        email: 'ai-jobs@huggingface.co',
        phone: '+91 90112 23344',
        whatsapp: '919011223344',
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        whatsappEnabled: true,
        callEnabled: true,
        emailEnabled: true,
        applyEnabled: true
      }
    ],
    communityPosts: [
      {
        id: 'post-1',
        userId: 'user-r1',
        userName: 'Rohan Sharma',
        userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop',
        imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop',
        caption: 'Just landed my dream job as a Frontend dev at a cool startup! Thanks to Sebok for the active HR WhatsApp links, literally scheduled my interview in 5 minutes! 🚀🔥',
        bookmarksCount: 18,
        sharesCount: 4,
        createdAt: new Date().toISOString(),
        status: 'Live'
      },
      {
        id: 'post-2',
        userId: 'user-p2',
        userName: 'Priya Patel',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
        imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop',
        caption: 'Is anyone else applying for remote UI roles this quarter? Let\'s connect and share resume tips. Here is my current multi-monitor workspace setup! 💻✨',
        bookmarksCount: 32,
        sharesCount: 12,
        createdAt: new Date(Date.now() - 43200000).toISOString(),
        status: 'Live'
      }
    ],
    users: [
      {
        id: 'user-admin',
        name: 'Admin Developer',
        email: 'kokborokanimations@gmail.com',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop',
        joinDate: new Date().toISOString(),
        trialExpiryDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        subscriptionStatus: 'Active',
        bio: 'Platform System Administrator and Developer'
      },
      {
        id: 'user-demo-1',
        name: 'Amit Kumar',
        email: 'amit.kumar@example.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
        joinDate: new Date(Date.now() - 15 * 86400000).toISOString(),
        trialExpiryDate: new Date(Date.now() + 15 * 86400000).toISOString(),
        subscriptionStatus: 'Free Trial',
        bio: 'Aspiring Full Stack Engineer. Looking for remote opportunities.'
      },
      {
        id: 'user-demo-2',
        name: 'Sarah Jenkins',
        email: 'sarah.j@example.com',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop',
        joinDate: new Date(Date.now() - 35 * 86400000).toISOString(),
        trialExpiryDate: new Date(Date.now() - 5 * 86400000).toISOString(),
        subscriptionStatus: 'Expired',
        bio: 'UI/UX Lead Designer @ Google.'
      }
    ],
    paymentLogs: [
      {
        id: 'tx_101',
        userId: 'user-admin',
        userEmail: 'kokborokanimations@gmail.com',
        amount: 499,
        status: 'SUCCESS',
        txId: 'CF_TX_890123748',
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_102',
        userId: 'user-demo-2',
        userEmail: 'sarah.j@example.com',
        amount: 499,
        status: 'FAILED',
        txId: 'CF_TX_FAILED_98124',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ],
    pages: [
      {
        id: 'page-about',
        title: 'About Us',
        slug: 'about-us',
        content: '<h2>About Us</h2><p>Welcome to Sebok, the ultimate platform for premium job discovery and professional community building. We connect qualified talents directly with verified employers through modern channels like WhatsApp and direct calls.</p>',
        showInFooter: true,
        isSystem: true
      },
      {
        id: 'page-contact',
        title: 'Contact Us',
        slug: 'contact-us',
        content: '',
        showInFooter: true,
        isSystem: true
      },
      {
        id: 'page-privacy',
        title: 'Privacy Policy',
        slug: 'privacy-policy',
        content: '<h2>Privacy Policy</h2><p>Your privacy is important to us. We encrypt all sensitive documents and protect your personal identification details securely. We do not sell your personal data to third-party ad networks.</p>',
        showInFooter: true,
        isSystem: true
      },
      {
        id: 'page-terms',
        title: 'Terms of Use',
        slug: 'terms-of-use',
        content: '<h2>Terms of Use</h2><p>By using Sebok, you agree to respect community guidelines. Spamming recruiter channels, abusing free trials, or publishing malicious comments will result in instant account termination.</p>',
        showInFooter: true,
        isSystem: true
      }
    ]
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  console.log('Database initialized successfully at db.json!');
}

initDB();

function readDB() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading DB, returning empty defaults', e);
    return { adminSettings: {}, jobs: [], communityPosts: [], users: [], paymentLogs: [] };
  }
}

function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing DB', e);
  }
}

function isCustomSupabaseConfigured(db: any) {
  const url = db.adminSettings?.supabaseUrl || process.env.VITE_SUPABASE_URL || 'https://crdmccidgzknnylyggbf.supabase.co';
  return !!url && url !== '';
}

// Supabase Data Mapping Helpers
function mapPostFromSupabase(p: any) {
  return {
    id: p.id,
    userId: p.user_id || p.userId,
    userName: p.user_name || p.userName,
    userAvatar: p.user_avatar || p.userAvatar,
    imageUrl: p.image_url || p.imageUrl,
    caption: p.caption,
    bookmarksCount: p.bookmarks_count !== undefined ? p.bookmarks_count : (p.bookmarksCount || 0),
    sharesCount: p.shares_count !== undefined ? p.shares_count : (p.sharesCount || 0),
    createdAt: p.created_at || p.createdAt,
    status: p.status || 'Live'
  };
}

function mapPostToSupabase(p: any) {
  return {
    id: p.id,
    user_id: p.userId,
    user_name: p.userName,
    user_avatar: p.userAvatar,
    image_url: p.imageUrl,
    caption: p.caption,
    bookmarks_count: p.bookmarksCount || 0,
    shares_count: p.sharesCount || 0,
    status: p.status,
    created_at: p.createdAt
  };
}

function mapUserFromSupabase(u: any) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatar: u.avatar,
    joinDate: u.join_date || u.joinDate,
    trialExpiryDate: u.trial_expiry_date || u.trialExpiryDate,
    subscriptionStatus: (u.email && u.email.toLowerCase() === 'kokborokanimations@gmail.com') ? 'Active' : (u.subscription_status || u.subscriptionStatus),
    bio: u.bio,
    plan_expiry_date: u.plan_expiry_date || u.planExpiryDate,
    planExpiryDate: u.plan_expiry_date || u.planExpiryDate,
    role: (u.email && u.email.toLowerCase() === 'kokborokanimations@gmail.com') ? 'admin' : 'member'
  };
}

function mapUserToSupabase(u: any) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatar: u.avatar,
    join_date: u.joinDate,
    trial_expiry_date: u.trialExpiryDate,
    subscription_status: (u.email && u.email.toLowerCase() === 'kokborokanimations@gmail.com') ? 'Active' : u.subscriptionStatus,
    bio: u.bio
  };
}

function mapPaymentLogFromSupabase(p: any) {
  return {
    id: p.id,
    userId: p.user_id || p.userId,
    userEmail: p.user_email || p.userEmail,
    amount: Number(p.amount),
    status: p.status,
    txId: p.tx_id || p.txId,
    createdAt: p.created_at || p.createdAt
  };
}

function mapPaymentLogToSupabase(p: any) {
  return {
    id: p.id,
    user_id: p.userId,
    user_email: p.userEmail,
    amount: p.amount,
    status: p.status,
    tx_id: p.txId,
    created_at: p.createdAt
  };
}

function mapPageFromSupabase(p: any) {
  const visibility = p.show_in_footer !== undefined ? p.show_in_footer : (p.isVisibleInFooter !== undefined ? p.isVisibleInFooter : true);
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    content: p.content,
    showInFooter: visibility,
    isVisibleInFooter: visibility,
    isSystem: p.is_system !== undefined ? p.is_system : (p.isSystem !== undefined ? p.isSystem : false),
    order: p.sort_order !== undefined ? p.sort_order : (p.order !== undefined ? p.order : 0)
  };
}

function mapPageToSupabase(p: any) {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    content: p.content,
    show_in_footer: p.showInFooter !== undefined ? p.showInFooter : p.isVisibleInFooter,
    is_system: p.isSystem,
    sort_order: p.order !== undefined ? p.order : 0
  };
}

function mapJobFromSupabase(job: any) {
  return {
    id: job.id,
    title: job.title,
    companyName: job.company_name || job.companyName,
    companyLogoUrl: job.company_logo_url || job.companyLogoUrl || '',
    companyLogoIndex: typeof job.company_logo_index === 'number' ? job.company_logo_index : (typeof job.companyLogoIndex === 'number' ? job.companyLogoIndex : 0),
    location: job.location,
    salary: job.salary,
    shortDescription: job.short_description || job.shortDescription || job.description || '',
    fullDescription: job.full_description || job.fullDescription || job.description || '',
    applyLink: job.apply_link || job.applyLink || '',
    datePosted: job.date_posted || job.datePosted,
    isLive: job.is_live !== undefined ? job.is_live : (job.isLive !== undefined ? job.isLive : true),
    createdAt: job.created_at || job.createdAt || new Date().toISOString(),
    category: job.category,
    experience: job.experience,
    contractType: job.contract_type || job.contractType,
    email: job.email || '',
    phone: job.phone || '',
    whatsapp: job.whatsapp || '',
    whatsappEnabled: job.whatsapp_enabled !== undefined ? job.whatsapp_enabled : (job.whatsappEnabled !== undefined ? job.whatsappEnabled : true),
    callEnabled: job.call_enabled !== undefined ? job.call_enabled : (job.callEnabled !== undefined ? job.callEnabled : true),
    emailEnabled: job.email_enabled !== undefined ? job.email_enabled : (job.emailEnabled !== undefined ? job.emailEnabled : true),
    applyEnabled: job.apply_enabled !== undefined ? job.apply_enabled : (job.applyEnabled !== undefined ? job.applyEnabled : true),
    qualifications: job.qualifications || '',
    isHot: job.is_hot !== undefined ? job.is_hot : (job.isHot !== undefined ? job.isHot : false),
  };
}

function mapJobToSupabase(job: any) {
  return {
    id: job.id,
    title: job.title,
    company_name: job.companyName,
    company_logo_url: job.companyLogoUrl || '',
    company_logo_index: typeof job.companyLogoIndex === 'number' ? job.companyLogoIndex : 0,
    location: job.location,
    salary: job.salary || '',
    short_description: job.shortDescription || job.description || '',
    full_description: job.fullDescription || job.description || '',
    description: job.fullDescription || job.shortDescription || job.description || '',
    apply_link: job.applyLink || '',
    date_posted: job.datePosted || job.createdAt,
    is_live: job.isLive !== undefined ? job.isLive : true,
    category: job.category || '',
    experience: job.experience || '',
    contract_type: job.contractType || '',
    email: job.email || '',
    phone: job.phone || '',
    whatsapp: job.whatsapp || '',
    whatsapp_enabled: job.whatsappEnabled !== undefined ? job.whatsappEnabled : true,
    call_enabled: job.callEnabled !== undefined ? job.callEnabled : true,
    email_enabled: job.emailEnabled !== undefined ? job.emailEnabled : true,
    apply_enabled: job.applyEnabled !== undefined ? job.apply_enabled : true,
    qualifications: job.qualifications || '',
    is_hot: job.isHot !== undefined ? job.isHot : false
  };
}

function mapContactFromSupabase(c: any) {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    subject: c.subject,
    message: c.message,
    createdAt: c.created_at || c.createdAt
  };
}

function mapContactToSupabase(c: any) {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    subject: c.subject,
    message: c.message,
    created_at: c.createdAt
  };
}

function mapSettingsFromSupabase(s: any, currentSettings: any = {}) {
  let paywallFeatures = [];
  if (s.paywall_features) {
    try {
      paywallFeatures = JSON.parse(s.paywall_features);
    } catch (e) {
      paywallFeatures = String(s.paywall_features).split('\n').filter(Boolean);
    }
  } else if (currentSettings.paywallFeatures) {
    paywallFeatures = currentSettings.paywallFeatures;
  }

  const getBool = (dbVal: any, localVal: any, defaultVal: boolean) => {
    if (dbVal !== undefined && dbVal !== null) return dbVal;
    if (localVal !== undefined && localVal !== null) return localVal;
    return defaultVal;
  };

  const getStr = (dbVal: any, localVal: any, defaultVal: string) => {
    if (dbVal !== undefined && dbVal !== null && dbVal !== '') return dbVal;
    if (localVal !== undefined && localVal !== null && localVal !== '') return localVal;
    return defaultVal;
  };

  const getNum = (dbVal: any, localVal: any, defaultVal: number) => {
    if (dbVal !== undefined && dbVal !== null) return dbVal;
    if (localVal !== undefined && localVal !== null) return localVal;
    return defaultVal;
  };

  return {
    brandName: getStr(s.brand_name, currentSettings.brandName, 'Sebok'),
    tagline: getStr(s.tagline, currentSettings.tagline, 'Your Premium Portal to Verified Careers & Networking'),
    shareTitle: getStr(s.share_title, currentSettings.shareTitle, ''),
    shareDesc: getStr(s.share_desc, currentSettings.shareDesc, ''),
    shareImg: getStr(s.share_img, currentSettings.shareImg, ''),
    logoUrl: getStr(s.logo_url, currentSettings.logoUrl, ''),
    faviconUrl: getStr(s.favicon_url, currentSettings.faviconUrl, ''),
    bannerUrl: getStr(s.banner_url, currentSettings.bannerUrl, ''),
    bannerHtml: getStr(s.banner_html, currentSettings.bannerHtml, ''),
    premiumMode: getBool(s.premium_mode, currentSettings.premiumMode, true),
    communityPremiumMode: getBool(s.community_premium_mode, currentSettings.communityPremiumMode, true),
    membershipPrice: getNum(s.membership_price, currentSettings.membershipPrice, 499),
    currency: getStr(s.currency, currentSettings.currency, 'INR'),
    paywallFeatures: paywallFeatures,
    paywallTitle: getStr(s.paywall_title, currentSettings.paywallTitle, 'Activate Premium'),
    paywallSubtitle: getStr(s.paywall_subtitle, currentSettings.paywallSubtitle, 'Unlock Premium access to continue searching & applying.'),
    paywallButtonText: getStr(s.paywall_button_text, currentSettings.paywallButtonText, 'Activate Membership Now'),
    paywallPriceDescription: getStr(s.paywall_price_description, currentSettings.paywallPriceDescription, 'One-time manual purchase. Extend anytime.'),
    paywallFooterText: getStr(s.paywall_footer_text, currentSettings.paywallFooterText, 'Secured & processed under Cashfree Secure Gateway. This is a one-time manual charge. No automatic renewals or recurring billing cycles.'),
    paywallExtendTitle: getStr(s.paywall_extend_title, currentSettings.paywallExtendTitle, 'Extend Premium'),
    paywallExtendSubtitle: getStr(s.paywall_extend_subtitle, currentSettings.paywallExtendSubtitle, 'Extend your manual premium access for another month.'),
    paywallExtendButtonText: getStr(s.paywall_extend_button_text, currentSettings.paywallExtendButtonText, 'Extend Membership Now'),
    razorpayKeyId: getStr(s.razorpay_key_id, currentSettings.razorpayKeyId, ''),
    razorpayKeySecret: getStr(s.razorpay_key_secret, currentSettings.razorpayKeySecret, ''),
    cashfreeAppId: getStr(s.cashfree_app_id || s.razorpay_key_id, currentSettings.cashfreeAppId || currentSettings.razorpayKeyId, ''),
    cashfreeSecretKey: getStr(s.cashfree_secret_key || s.razorpay_key_secret, currentSettings.cashfreeSecretKey || currentSettings.razorpayKeySecret, ''),
    postApprovalMode: getBool(s.post_approval_mode, currentSettings.postApprovalMode, true),
    supabaseUrl: getStr(s.supabase_url, currentSettings.supabaseUrl, ''),
    supabaseAnonKey: getStr(s.supabase_anon_key, currentSettings.supabaseAnonKey, ''),
    supabaseServiceRoleKey: getStr(s.supabase_service_role_key, currentSettings.supabaseServiceRoleKey, ''),
    googleSiteVerification: getStr(s.google_site_verification, currentSettings.googleSiteVerification, ''),
    oneSignalCode: getStr(s.one_signal_code, currentSettings.oneSignalCode, ''),
    oneSignalAppId: getStr(s.one_signal_app_id, currentSettings.oneSignalAppId, ''),
    oneSignalRestApiKey: getStr(s.one_signal_rest_api_key, currentSettings.oneSignalRestApiKey, ''),
    oneSignalAutoNotify: getBool(s.one_signal_auto_notify, currentSettings.oneSignalAutoNotify, true),
    oneSignalCommunityNotify: getBool(s.one_signal_community_notify, currentSettings.oneSignalCommunityNotify, true),
    oneSignalPromptTitle: getStr(s.one_signal_prompt_title, currentSettings.oneSignalPromptTitle, 'JOB ALERTS DIRECT CHAHIYE? 🔔'),
    oneSignalPromptSubtitle: getStr(s.one_signal_prompt_subtitle, currentSettings.oneSignalPromptSubtitle, 'NEVER MISS A HIRING UPDATE'),
    oneSignalPromptDesc: getStr(s.one_signal_prompt_desc, currentSettings.oneSignalPromptDesc, 'Naye job alerts aur community postings direct apne mobile ya computer screen par instant receive karne ke liye notifications Subscribe karein!'),
    oneSignalPromptBtnDismiss: getStr(s.one_signal_prompt_btn_dismiss, currentSettings.oneSignalPromptBtnDismiss, 'BAAD MEIN'),
    oneSignalPromptBtnAllow: getStr(s.one_signal_prompt_btn_allow, currentSettings.oneSignalPromptBtnAllow, 'HAAN, ALLOW KAREIN 🔔'),
    communityMindPlaceholder: getStr(s.community_mind_placeholder, currentSettings.communityMindPlaceholder, ''),
    communityReviewNotice: getStr(s.community_review_notice, currentSettings.communityReviewNotice, ''),
    loginTitle: getStr(s.login_title, currentSettings.loginTitle, ''),
    loginSubtitle: getStr(s.login_subtitle, currentSettings.loginSubtitle, ''),
    googleOnly: getBool(s.google_only, currentSettings.googleOnly, false),
    showJobFilters: getBool(s.show_job_filters, currentSettings.showJobFilters, true),
    bannerHeightType: getStr(s.banner_height_type, currentSettings.bannerHeightType, 'default'),
    bannerHeightCustomValue: getNum(s.banner_height_custom_value, currentSettings.bannerHeightCustomValue, 150),
    bannerObjectFit: getStr(s.banner_object_fit, currentSettings.bannerObjectFit, 'cover'),
    bannerPosition: getStr(s.banner_position, currentSettings.bannerPosition, 'center')
  };
}

function mapSettingsToSupabase(s: any) {
  return {
    id: 'global_settings',
    brand_name: s.brandName,
    tagline: s.tagline,
    share_title: s.shareTitle || '',
    share_desc: s.shareDesc || '',
    share_img: s.shareImg || '',
    logo_url: s.logoUrl,
    favicon_url: s.faviconUrl || '',
    banner_url: s.bannerUrl,
    banner_html: s.bannerHtml,
    premium_mode: s.premiumMode,
    community_premium_mode: s.communityPremiumMode !== false,
    membership_price: s.membershipPrice,
    currency: s.currency,
    paywall_features: JSON.stringify(s.paywallFeatures || []),
    paywall_title: s.paywallTitle,
    paywall_subtitle: s.paywallSubtitle,
    paywall_button_text: s.paywallButtonText,
    paywall_price_description: s.paywallPriceDescription,
    paywall_footer_text: s.paywallFooterText,
    paywall_extend_title: s.paywallExtendTitle,
    paywall_extend_subtitle: s.paywallExtendSubtitle,
    paywall_extend_button_text: s.paywallExtendButtonText,
    cashfree_app_id: s.cashfreeAppId || s.razorpayKeyId || '',
    cashfree_secret_key: s.cashfreeSecretKey || s.razorpayKeySecret || '',
    post_approval_mode: s.postApprovalMode,
    supabase_url: s.supabaseUrl,
    supabase_anon_key: s.supabaseAnonKey,
    supabase_service_role_key: s.supabaseServiceRoleKey,
    google_site_verification: s.googleSiteVerification,
    one_signal_code: s.oneSignalCode || '',
    one_signal_app_id: s.oneSignalAppId || '',
    one_signal_rest_api_key: s.oneSignalRestApiKey || '',
    one_signal_auto_notify: s.oneSignalAutoNotify !== false,
    one_signal_community_notify: s.oneSignalCommunityNotify !== false,
    one_signal_prompt_title: s.oneSignalPromptTitle || '',
    one_signal_prompt_subtitle: s.oneSignalPromptSubtitle || '',
    one_signal_prompt_desc: s.oneSignalPromptDesc || '',
    one_signal_prompt_btn_dismiss: s.oneSignalPromptBtnDismiss || '',
    one_signal_prompt_btn_allow: s.oneSignalPromptBtnAllow || '',
    community_mind_placeholder: s.communityMindPlaceholder,
    community_review_notice: s.communityReviewNotice,
    login_title: s.loginTitle,
    login_subtitle: s.loginSubtitle,
    google_only: s.googleOnly,
    show_job_filters: s.showJobFilters !== false,
    banner_height_type: s.bannerHeightType,
    banner_height_custom_value: s.bannerHeightCustomValue,
    banner_object_fit: s.bannerObjectFit,
    banner_position: s.bannerPosition
  };
}

async function cleanSettingsRowForSupabase(supabase: any, row: any): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('*')
      .eq('id', 'global_settings')
      .maybeSingle();

    if (!error && data) {
      const validColumns = new Set(Object.keys(data));
      const cleaned: any = {};
      for (const [key, val] of Object.entries(row)) {
        if (validColumns.has(key)) {
          cleaned[key] = val;
        } else {
          console.log(`[Supabase Auto-Pruning] Pruning column "${key}" because it is not defined in the remote schema cache.`);
        }
      }
      return cleaned;
    }
  } catch (err: any) {
    console.warn('[Supabase Warning] Failed to dynamically inspect admin_settings columns, using fallback set:', err.message || String(err));
  }

  // Fallback set of standard/legacy columns guaranteed to exist on earlier schemas
  const basicColumns = new Set([
    'id', 'created_at', 'brand_name', 'tagline', 'share_title', 'share_desc', 'share_img', 'logo_url', 'favicon_url', 'banner_url', 'banner_html',
    'premium_mode', 'community_premium_mode', 'membership_price', 'currency', 'paywall_features', 'paywall_title', 'paywall_subtitle',
    'paywall_button_text', 'paywall_price_description', 'paywall_footer_text', 'paywall_extend_title',
    'paywall_extend_subtitle', 'paywall_extend_button_text', 'razorpay_key_id', 'razorpay_key_secret',
    'cashfree_app_id', 'cashfree_secret_key', 'post_approval_mode', 'supabase_url', 'supabase_anon_key',
    'supabase_service_role_key', 'google_site_verification', 'one_signal_code', 'one_signal_app_id', 'one_signal_rest_api_key',
    'one_signal_auto_notify', 'one_signal_community_notify', 'one_signal_prompt_title', 'one_signal_prompt_subtitle',
    'one_signal_prompt_desc', 'one_signal_prompt_btn_dismiss', 'one_signal_prompt_btn_allow', 'community_mind_placeholder',
    'community_review_notice', 'login_title', 'login_subtitle', 'google_only', 'show_job_filters', 'banner_height_type',
    'banner_height_custom_value', 'banner_object_fit', 'banner_position'
  ]);

  const cleaned: any = {};
  for (const [key, val] of Object.entries(row)) {
    if (basicColumns.has(key)) {
      cleaned[key] = val;
    } else {
      console.log(`[Supabase Fallback Auto-Pruning] Pruned column "${key}" as part of safety fallback list.`);
    }
  }
  return cleaned;
}

function mapResumeFromSupabase(r: any) {
  return {
    id: r.id,
    user_id: r.user_id || r.userId || 'guest',
    name: r.name,
    timestamp: r.timestamp || new Date(r.updated_at || r.created_at || Date.now()).toISOString(),
    data: typeof r.data === 'string' ? JSON.parse(r.data) : r.data,
    template: r.template || 'donna-elegant'
  };
}

function mapResumeToSupabase(r: any) {
  return {
    id: r.id,
    user_id: r.user_id || r.userId || 'guest',
    name: r.name,
    timestamp: r.timestamp || new Date().toISOString(),
    data: typeof r.data === 'object' ? JSON.stringify(r.data) : r.data,
    template: r.template || 'donna-elegant',
    updated_at: new Date().toISOString()
  };
}

function deleteLocalFileByUrl(url: string) {
  if (url && url.startsWith('/uploads/')) {
    try {
      const fileName = url.substring('/uploads/'.length);
      const filePath = path.join(process.cwd(), 'uploads', fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[File Cleanup] Successfully deleted old file: ${fileName}`);
      }
    } catch (e: any) {
      console.warn(`[File Cleanup] Failed to delete file at ${url}:`, e.message);
    }
  }
}

// Serve uploaded media statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Media Upload endpoint
app.post('/api/upload', async (req, res) => {
  try {
    const { file, name } = req.body;
    if (!file) {
      return res.status(400).json({ error: 'No file data received' });
    }

    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const matches = file.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 string' });
    }

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    
    let ext = 'png';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
    else if (mimeType.includes('gif')) ext = 'gif';
    else if (mimeType.includes('svg')) ext = 'svg';
    else if (mimeType.includes('webp')) ext = 'webp';

    const cleanName = name ? name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'uploaded';
    const timestamp = Date.now();
    const fileName = `${cleanName}_${timestamp}.${ext}`;
    const filePath = path.join(uploadDir, fileName);
    
    fs.writeFileSync(filePath, buffer);
    
    let finalUrl = `/uploads/${fileName}`;
    
    // For branding and core data assets, if custom Supabase is configured, save directly to Supabase Storage.
    const db = readDB();
    if (isCustomSupabaseConfigured(db) && (
      name === 'app_logo' || 
      name === 'app_favicon' || 
      name === 'jobs_banner' || 
      name === 'company_logo' || 
      name === 'user_avatar'
    )) {
      try {
        const supabase = getAdminSupabase() || getServerSupabase();
        if (supabase) {
          const bucketName = 'branding';
          
          // Create bucket if it doesn't exist
          try {
            await supabase.storage.createBucket(bucketName, { public: true });
          } catch (bucketErr) {
            // Bucket likely already exists, ignore
          }

          // Fetch old asset URL to delete from bucket
          let oldUrl = '';
          if (name === 'app_logo') oldUrl = db.adminSettings?.logoUrl || '';
          else if (name === 'app_favicon') oldUrl = db.adminSettings?.faviconUrl || '';
          else if (name === 'jobs_banner') oldUrl = db.adminSettings?.bannerUrl || '';

          // If the old URL is a Supabase public Storage URL, delete it from the bucket to save space
          if (oldUrl && oldUrl.includes('/storage/v1/object/public/')) {
            try {
              const urlParts = oldUrl.split('/');
              const oldFileName = urlParts[urlParts.length - 1];
              if (oldFileName) {
                await supabase.storage.from(bucketName).remove([oldFileName]);
                console.log(`[Supabase Storage] Deleted old file from bucket: ${oldFileName}`);
              }
            } catch (delErr: any) {
              console.warn('[Supabase Storage Warning] Could not delete old file:', delErr.message);
            }
          }

          // Upload new asset to storage bucket
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, buffer, {
              contentType: mimeType,
              upsert: true
            });

          if (!error) {
            const { data: urlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(fileName);
            if (urlData && urlData.publicUrl) {
              finalUrl = urlData.publicUrl;
              console.log(`[Supabase Storage] Successfully uploaded to bucket: ${finalUrl}`);
            }
          } else {
            console.warn('[Supabase Storage Warning] Upload failed, falling back to base64 encoding:', error.message);
            finalUrl = file; // Fallback to storing full base64 data URL
          }
        }
      } catch (storageErr: any) {
        console.warn('[Supabase Storage Warning] Connection/configuration issue, falling back to base64:', storageErr.message || String(storageErr));
        finalUrl = file; // Fallback to storing full base64 data URL
      }
    }
    
    res.json({ success: true, url: finalUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// REST endpoints
// 1. Admin settings
app.get('/api/settings', async (req, res) => {
  const db = readDB();
  const localSettings = db.adminSettings || {};

  if (isCustomSupabaseConfigured(db)) {
    try {
      const supabase = getServerSupabase();
      if (supabase) {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('*')
          .eq('id', 'global_settings')
          .single();
        
        if (!error && data) {
          const mappedSettings = mapSettingsFromSupabase(data, db.adminSettings);
          db.adminSettings = { ...db.adminSettings, ...mappedSettings };
          writeDB(db);
          return res.json(db.adminSettings);
        } else if (error) {
          console.log('[Supabase Info] Serving settings from local JSON store. Supabase lookup details:', error.message);
        }
      }
    } catch (err: any) {
      console.log('[Supabase Info] Serving settings from local JSON store. Details:', err.message || String(err));
    }
  }

  res.json(localSettings);
});

app.post('/api/settings', async (req, res) => {
  const db = readDB();
  
  // Clean up old local files if they are replaced
  const oldLogo = db.adminSettings?.logoUrl;
  const oldFavicon = db.adminSettings?.faviconUrl;
  const oldBanner = db.adminSettings?.bannerUrl;

  const newLogo = req.body.logoUrl;
  const newFavicon = req.body.faviconUrl;
  const newBanner = req.body.bannerUrl;

  if (oldLogo && oldLogo !== newLogo) {
    deleteLocalFileByUrl(oldLogo);
  }
  if (oldFavicon && oldFavicon !== newFavicon) {
    deleteLocalFileByUrl(oldFavicon);
  }
  if (oldBanner && oldBanner !== newBanner) {
    deleteLocalFileByUrl(oldBanner);
  }

  db.adminSettings = { ...db.adminSettings, ...req.body };
  writeDB(db);

  let supabaseError = null;

  if (isCustomSupabaseConfigured(db)) {
    try {
      const supabase = getAdminSupabase() || getServerSupabase();
      if (supabase) {
        const dbRow = mapSettingsToSupabase(db.adminSettings);
        const cleanedDbRow = await cleanSettingsRowForSupabase(supabase, dbRow);
        const { error } = await supabase
          .from('admin_settings')
          .upsert(cleanedDbRow);
        if (error) {
          supabaseError = error.message;
          console.error('[Supabase Error] Settings upsert failed:', error.message);
        }
      }
    } catch (err: any) {
      supabaseError = err.message || String(err);
      console.error('[Supabase Error] Settings upsert exception:', err.message || String(err));
    }
  }

  res.json({ success: true, settings: db.adminSettings, supabaseError });
});

// 2. Jobs endpoints
app.get('/api/jobs', async (req, res) => {
  const db = readDB();
  const localJobs = db.jobs || [];

  try {
    const supabase = getServerSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        const localJobsMap = new Map(localJobs.map((j: any) => [j.id, j]));
        const mappedJobs = data.map((jobRow: any) => {
          const mapped = mapJobFromSupabase(jobRow);
          // Preserve local isHot if missing/undefined in Supabase row
          if (jobRow.is_hot === undefined && jobRow.isHot === undefined) {
            const localJob: any = localJobsMap.get(mapped.id);
            if (localJob && localJob.isHot !== undefined) {
              mapped.isHot = localJob.isHot;
            }
          }
          return mapped;
        });

        // Merge localJobs and mappedJobs by ID to prevent any job from being lost
        const mergedJobsMap = new Map();
        mappedJobs.forEach((job: any) => {
          mergedJobsMap.set(job.id, job);
        });
        localJobs.forEach((job: any) => {
          mergedJobsMap.set(job.id, job);
        });

        const mergedJobs = Array.from(mergedJobsMap.values());
        mergedJobs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Update local JSON cache with merged jobs
        db.jobs = mergedJobs;
        writeDB(db);

        return res.json(mergedJobs);
      } else if (error) {
        if (error.message && (error.message.includes('relation') || error.message.includes('does not exist') || error.code === 'PGRST116')) {
          console.log('[Supabase Info] "jobs" table is not present in the Supabase schema yet. Serving jobs from local JSON database.');
        } else {
          console.log('[Supabase Info] Fetching jobs returned info:', error.message);
        }
      }
    }
  } catch (err: any) {
    console.log('[Supabase Info] Serving jobs from local JSON store. Details:', err.message || String(err));
  }
  
  res.json(localJobs);
});

async function sendOneSignalPush(title: string, body: string, targetUrl: string, customContents?: Record<string, string>, customHeadings?: Record<string, string>) {
  try {
    const db = readDB();
    const settings = db.adminSettings || {};
    const appId = settings.oneSignalAppId;
    const restApiKey = settings.oneSignalRestApiKey;
    const autoNotify = settings.oneSignalAutoNotify !== false;

    if (!autoNotify || !appId || !restApiKey) {
      console.log('[OneSignal] Auto notify is disabled or missing App ID / REST API Key settings.');
      return;
    }

    const payload = {
      app_id: appId,
      included_segments: ['All'],
      contents: customContents || {
        en: body
      },
      headings: customHeadings || {
        en: title
      },
      url: targetUrl
    };

    console.log('[OneSignal] Sending push notification with payload:', JSON.stringify(payload));

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${restApiKey}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log('[OneSignal] API Response:', result);
    return result;
  } catch (error: any) {
    console.error('[OneSignal] Error sending notification:', error.message || error);
    throw error;
  }
}

async function triggerOneSignalNotification(newJob: any, host: string) {
  try {
    const jobTitle = newJob.title || 'New Job';
    const companyName = newJob.companyName || 'Company';
    const jobId = newJob.id;
    
    // Construct target URL
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const targetUrl = `${protocol}://${host}/job/${jobId}`;

    const titleEn = `New Job Alert! 🔔`;
    const titleHi = `नया जॉब अपडेट! 🔔`;
    const bodyEn = `New Job Posted: ${jobTitle} at ${companyName}`;
    const bodyHi = `नयी जॉब अलर्ट: ${companyName} में ${jobTitle} की भर्ती`;

    await sendOneSignalPush(
      titleEn,
      bodyEn,
      targetUrl,
      { en: bodyEn, hi: bodyHi },
      { en: titleEn, hi: titleHi }
    );
  } catch (err: any) {
    console.error('[OneSignal] triggerOneSignalNotification failed:', err.message || err);
  }
}

// FCM notification endpoints and functions have been completely removed.

app.get('/OneSignalSDKWorker.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Service-Worker-Allowed', '/');
  res.send(`importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');`);
});

app.post('/api/onesignal/test', async (req, res) => {
  try {
    const db = readDB();
    const settings = db.adminSettings || {};
    const appId = settings.oneSignalAppId;
    const restApiKey = settings.oneSignalRestApiKey;

    if (!appId || !appId.trim()) {
      return res.status(400).json({ error: 'OneSignal App ID missing in your settings!' });
    }
    if (!restApiKey || !restApiKey.trim()) {
      return res.status(400).json({ error: 'OneSignal REST API Key missing in your settings!' });
    }

    const title = req.body.title || 'OneSignal Test 🔔';
    const body = req.body.body || 'Your OneSignal Push Notification setup is working perfectly!';
    const protocol = (req.headers.host || 'localhost:3000').includes('localhost') ? 'http' : 'https';
    const url = req.body.url || `${protocol}://${req.headers.host || 'localhost:3000'}/`;

    console.log('[OneSignal Test] Sending test notification...');
    
    const result = await sendOneSignalPush(title, body, url);
    
    if (result && result.errors) {
      return res.status(400).json({ error: `OneSignal API error: ${JSON.stringify(result.errors)}` });
    }

    res.json({ 
      success: true, 
      message: `Test notification sent successfully via OneSignal! Recipient/Subscribers Count: ${result?.recipients || 'queued'}` 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

app.post('/api/jobs', async (req, res) => {
  const db = readDB();
  const newJobId = 'job-' + Date.now();
  const newJob = {
    id: newJobId,
    createdAt: new Date().toISOString(),
    isLive: true,
    ...req.body
  };
  db.jobs.unshift(newJob);
  writeDB(db);

  // Trigger push notification asynchronously in the background
  triggerOneSignalNotification(newJob, req.headers.host || 'localhost:3000').catch(err => {
    console.error('[OneSignal Background Error]:', err);
  });

  // FCM notification trigger removed

  try {
    const supabase = getServerSupabase();
    if (supabase) {
      // Use helper to map exactly to the Supabase columns
      const dbRow = mapJobToSupabase(newJob);
      const { error } = await supabase.from('jobs').insert([dbRow]);
      if (error) {
        console.log('[Supabase Info] Local job created successfully, but Supabase insert was skipped:', error.message);
      }
    }
  } catch (err: any) {
    console.log('[Supabase Info] Local job created successfully, but Supabase insert was skipped. Details:', err.message || String(err));
  }

  res.json({ success: true, job: newJob });
});

app.put('/api/jobs/:id', async (req, res) => {
  const db = readDB();
  const index = db.jobs.findIndex((j: any) => j.id === req.params.id);
  if (index !== -1) {
    db.jobs[index] = { ...db.jobs[index], ...req.body };
    writeDB(db);

    try {
      const supabase = getServerSupabase();
      if (supabase) {
        // Use helper to map exactly to the Supabase columns
        const dbRow = mapJobToSupabase(db.jobs[index]);
        const { error } = await supabase
          .from('jobs')
          .update(dbRow)
          .eq('id', req.params.id);
        if (error) {
          console.log('[Supabase Info] Local job updated successfully, but Supabase sync was skipped:', error.message);
        }
      }
    } catch (err: any) {
      console.log('[Supabase Info] Local job updated successfully, but Supabase sync was skipped. Details:', err.message || String(err));
    }

    res.json({ success: true, job: db.jobs[index] });
  } else {
    res.status(404).json({ error: 'Job not found' });
  }
});

app.delete('/api/jobs/:id', async (req, res) => {
  const db = readDB();
  const initialLen = db.jobs.length;
  const targetId = String(req.params.id).trim().toLowerCase();
  
  db.jobs = db.jobs.filter((j: any) => {
    if (!j || !j.id) return false;
    return String(j.id).trim().toLowerCase() !== targetId;
  });

  if (db.jobs.length < initialLen) {
    writeDB(db);

    // Also delete from Supabase
    try {
      const supabase = getServerSupabase();
      if (supabase) {
        const { error } = await supabase
          .from('jobs')
          .delete()
          .eq('id', req.params.id);
        if (error) {
          console.log('[Supabase Info] Local job deleted, but Supabase sync was skipped:', error.message);
        }
      }
    } catch (err: any) {
      console.log('[Supabase Info] Local job deleted, but Supabase sync was skipped. Details:', err.message || String(err));
    }

    res.json({ success: true });
  } else {
    // Fallback search to ensure if it already doesn't exist, we don't throw 404 unnecessarily, or we log it
    res.status(404).json({ error: 'Job not found in database' });
  }
});

// 3. Community posts endpoints
app.get('/api/posts', async (req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoffTime = thirtyDaysAgo.getTime();

  const db = readDB();
  const initialLocalCount = (db.communityPosts || []).length;
  
  // Clean up expired local posts (Automatic 30-day deletion fallback)
  db.communityPosts = (db.communityPosts || []).filter((post: any) => {
    const postTime = new Date(post.createdAt).getTime();
    return !isNaN(postTime) && postTime >= cutoffTime;
  });

  if (db.communityPosts.length !== initialLocalCount) {
    writeDB(db);
  }

  const localPosts = db.communityPosts || [];

  try {
    const supabase = getServerSupabase();
    if (supabase) {
      // Automatic 30-day deletion from live Supabase table
      try {
        const { error: deleteError } = await supabase
          .from('community_posts')
          .delete()
          .lt('created_at', thirtyDaysAgo.toISOString());
        if (deleteError) {
          console.log('[Supabase Info] Failed to delete expired posts from Supabase:', deleteError.message);
        }
      } catch (deleteErr: any) {
        console.log('[Supabase Info] Failed to execute Supabase cleanup:', deleteErr.message || String(deleteErr));
      }

      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        const mappedPosts = data.map(mapPostFromSupabase);

        // Merge localPosts and mappedPosts by ID to prevent loss, filtering out expired items
        const mergedMap = new Map();
        mappedPosts.forEach((post: any) => {
          const postTime = new Date(post.createdAt).getTime();
          if (!isNaN(postTime) && postTime >= cutoffTime) {
            mergedMap.set(post.id, post);
          }
        });
        localPosts.forEach((post: any) => {
          const postTime = new Date(post.createdAt).getTime();
          if (!isNaN(postTime) && postTime >= cutoffTime) {
            mergedMap.set(post.id, post);
          }
        });

        const mergedPosts = Array.from(mergedMap.values());
        mergedPosts.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        db.communityPosts = mergedPosts;
        writeDB(db);
        return res.json(mergedPosts);
      }
    }
  } catch (err: any) {
    console.log('[Supabase Info] Serving posts from local JSON store. Details:', err.message || String(err));
  }
  res.json(localPosts);
});

app.post('/api/posts', async (req, res) => {
  const db = readDB();
  const isApprovalOn = db.adminSettings.postApprovalMode === true;
  // If admin is posting, bypass manual approval
  const isAdmin = req.body.userEmail === 'kokborokanimations@gmail.com' || req.body.userId === 'user-admin';
  const newPost = {
    id: 'post-' + Date.now(),
    bookmarksCount: 0,
    sharesCount: 0,
    createdAt: new Date().toISOString(),
    status: (isApprovalOn && !isAdmin) ? 'Pending' : 'Live',
    ...req.body
  };
  db.communityPosts.unshift(newPost);
  writeDB(db);

  try {
    const supabase = getServerSupabase();
    if (supabase) {
      const { error } = await supabase
        .from('community_posts')
        .insert([mapPostToSupabase(newPost)]);
      if (error) {
        console.log('[Supabase Info] Local post created successfully, but Supabase insert was skipped:', error.message);
      }
    }
  } catch (err: any) {
    console.log('[Supabase Info] Local post created successfully, but Supabase insert was skipped. Details:', err.message || String(err));
  }

  // Trigger OneSignal Push Notification asynchronously in the background if the post is immediately Live and notification is enabled
  if (newPost.status === 'Live' && db.adminSettings?.oneSignalCommunityNotify !== false) {
    const protocol = (req.headers.host || 'localhost:3000').includes('localhost') ? 'http' : 'https';
    const postTargetUrl = `${protocol}://${req.headers.host || 'localhost:3000'}/community`;
    const title = `New Community Post! 💬`;
    const captionText = newPost.caption && newPost.caption.length > 50 ? `${newPost.caption.slice(0, 50)}...` : (newPost.caption || '');
    const body = `${newPost.userName || 'Someone'} shared: ${captionText}`;
    
    sendOneSignalPush(title, body, postTargetUrl).catch(err => {
      console.error('[OneSignal Community Notification Error]:', err);
    });
  }

  res.json({ success: true, post: newPost });
});

app.put('/api/posts/:id/approve', async (req, res) => {
  const db = readDB();
  const post = db.communityPosts.find((p: any) => p.id === req.params.id);
  if (post) {
    post.status = 'Live';
    writeDB(db);

    try {
      const supabase = getServerSupabase();
      if (supabase) {
        const { error } = await supabase
          .from('community_posts')
          .update({ status: 'Live' })
          .eq('id', req.params.id);
        if (error) {
          console.log('[Supabase Info] Post approved locally, but Supabase sync was skipped:', error.message);
        }
      }
    } catch (err: any) {
      console.log('[Supabase Info] Post approved locally, but Supabase sync was skipped. Details:', err.message || String(err));
    }

    // Trigger OneSignal Push Notification asynchronously in the background when approved and notification is enabled
    if (db.adminSettings?.oneSignalCommunityNotify !== false) {
      const protocol = (req.headers.host || 'localhost:3000').includes('localhost') ? 'http' : 'https';
      const postTargetUrl = `${protocol}://${req.headers.host || 'localhost:3000'}/community`;
      const title = `Post Approved! 💬`;
      const captionText = post.caption && post.caption.length > 50 ? `${post.caption.slice(0, 50)}...` : (post.caption || '');
      const body = `${post.userName || 'Someone'} shared: ${captionText}`;
      
      sendOneSignalPush(title, body, postTargetUrl).catch(err => {
        console.error('[OneSignal Community Approved Notification Error]:', err);
      });
    }

    res.json({ success: true, post });
  } else {
    res.status(404).json({ error: 'Post not found' });
  }
});

app.post('/api/posts/:id/bookmark', async (req, res) => {
  const db = readDB();
  const post = db.communityPosts.find((p: any) => p.id === req.params.id);
  if (post) {
    post.bookmarksCount = (post.bookmarksCount || 0) + 1;
    writeDB(db);

    try {
      const supabase = getServerSupabase();
      if (supabase) {
        const { error } = await supabase
          .from('community_posts')
          .update({ bookmarks_count: post.bookmarksCount })
          .eq('id', req.params.id);
        if (error) {
          console.log('[Supabase Info] Bookmark updated locally, but Supabase sync was skipped:', error.message);
        }
      }
    } catch (err: any) {
      console.log('[Supabase Info] Bookmark updated locally, but Supabase sync was skipped. Details:', err.message || String(err));
    }

    res.json({ success: true, bookmarksCount: post.bookmarksCount });
  } else {
    res.status(404).json({ error: 'Post not found' });
  }
});

app.post('/api/posts/:id/share', async (req, res) => {
  const db = readDB();
  const post = db.communityPosts.find((p: any) => p.id === req.params.id);
  if (post) {
    post.sharesCount = (post.sharesCount || 0) + 1;
    writeDB(db);

    try {
      const supabase = getServerSupabase();
      if (supabase) {
        const { error } = await supabase
          .from('community_posts')
          .update({ shares_count: post.sharesCount })
          .eq('id', req.params.id);
        if (error) {
          console.log('[Supabase Info] Share updated locally, but Supabase sync was skipped:', error.message);
        }
      }
    } catch (err: any) {
      console.log('[Supabase Info] Share updated locally, but Supabase sync was skipped. Details:', err.message || String(err));
    }

    res.json({ success: true, sharesCount: post.sharesCount });
  } else {
    res.status(404).json({ error: 'Post not found' });
  }
});

app.delete('/api/posts/:id', async (req, res) => {
  const db = readDB();
  const postId = req.params.id;
  const post = db.communityPosts.find((p: any) => p.id === postId);
  
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  // Strictly verify requester identity
  const reqUserId = req.body?.userId || req.headers['x-user-id'];
  const reqUserEmail = req.body?.userEmail || req.headers['x-user-email'];

  if (!reqUserId) {
    return res.status(401).json({ error: 'Authentication required. Missing user identifier.' });
  }

  const isAdmin = String(reqUserEmail).toLowerCase() === 'kokborokanimations@gmail.com' || reqUserId === 'user-admin';
  const isAuthor = post.userId === reqUserId;

  if (!isAdmin && !isAuthor) {
    return res.status(403).json({ error: 'Access denied. You do not have permission to delete this community post.' });
  }

  // Remove post from collection
  db.communityPosts = db.communityPosts.filter((p: any) => p.id !== postId);
  writeDB(db);

  try {
    const supabase = getServerSupabase();
    if (supabase) {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId);
      if (error) {
        console.log('[Supabase Info] Post deleted locally, but Supabase delete was skipped:', error.message);
      }
    }
  } catch (err: any) {
    console.log('[Supabase Info] Post deleted locally, but Supabase delete was skipped. Details:', err.message || String(err));
  }

  res.json({ success: true });
});

// 4. Users endpoints
app.get('/api/users', async (req, res) => {
  const db = readDB();
  const localUsers = db.users || [];

  try {
    const supabase = getServerSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (!error && data) {
        const mappedUsers = data.map(mapUserFromSupabase);

        // Merge localUsers and mappedUsers by ID
        const mergedMap = new Map();
        mappedUsers.forEach((user: any) => mergedMap.set(user.id, user));
        localUsers.forEach((user: any) => mergedMap.set(user.id, user));

        const mergedUsers = Array.from(mergedMap.values());
        
        db.users = mergedUsers;
        writeDB(db);
        return res.json(mergedUsers);
      }
    }
  } catch (err: any) {
    console.log('[Supabase Info] Serving users from local JSON store. Details:', err.message || String(err));
  }
  res.json(localUsers);
});

// Update specific user profile details (Name, Avatar, Bio)
app.put('/api/users/:id', async (req, res) => {
  const { name, avatar, bio } = req.body;
  const db = readDB();
  const index = db.users.findIndex((u: any) => u.id === req.params.id);
  if (index !== -1) {
    if (name !== undefined) db.users[index].name = name;
    if (avatar !== undefined) db.users[index].avatar = avatar;
    if (bio !== undefined) db.users[index].bio = bio;
    writeDB(db);

    try {
      const supabase = getServerSupabase();
      if (supabase) {
        const { error } = await supabase
          .from('users')
          .upsert(mapUserToSupabase(db.users[index]));
        if (error) {
          console.log('[Supabase Info] User updated locally, but Supabase sync was skipped:', error.message);
        }
      }
    } catch (err: any) {
      console.log('[Supabase Info] User updated locally, but Supabase sync was skipped. Details:', err.message || String(err));
    }

    res.json({ success: true, user: db.users[index] });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// 5. Custom Footer Pages endpoints
app.get('/api/pages', async (req, res) => {
  const db = readDB();
  const localPages = db.pages || [];

  try {
    const supabase = getServerSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('pages')
        .select('*');
      
      if (!error && data) {
        const mappedPages = data.map(mapPageFromSupabase);

        // Merge localPages and mappedPages by ID
        const mergedMap = new Map();
        mappedPages.forEach((page: any) => mergedMap.set(page.id, page));
        localPages.forEach((page: any) => mergedMap.set(page.id, page));

        const mergedPages = Array.from(mergedMap.values());
        
        db.pages = mergedPages;
        writeDB(db);
        
        const sorted = mergedPages.map((p: any) => {
          const visibility = p.isVisibleInFooter !== undefined ? p.isVisibleInFooter : (p.showInFooter !== undefined ? p.showInFooter : true);
          return {
            ...p,
            isVisibleInFooter: visibility,
            showInFooter: visibility,
            order: p.order !== undefined ? p.order : 0
          };
        });

        sorted.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        return res.json(sorted);
      }
    }
  } catch (err: any) {
    console.log('[Supabase Info] Serving pages from local JSON store. Details:', err.message || String(err));
  }

  const pages = localPages.map((p: any) => {
    const visibility = p.isVisibleInFooter !== undefined ? p.isVisibleInFooter : (p.showInFooter !== undefined ? p.showInFooter : true);
    return {
      ...p,
      isVisibleInFooter: visibility,
      showInFooter: visibility,
      order: p.order !== undefined ? p.order : 0
    };
  });

  pages.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  res.json(pages);
});

app.post('/api/pages/reorder', async (req, res) => {
  const db = readDB();
  if (!db.pages) db.pages = [];
  const { orders } = req.body; // Array of { id: string, order: number }
  if (!orders || !Array.isArray(orders)) {
    return res.status(400).json({ error: 'Orders array is required' });
  }

  orders.forEach((o: any) => {
    const idx = db.pages.findIndex((p: any) => p.id === o.id);
    if (idx !== -1) {
      db.pages[idx].order = o.order;
    }
  });

  writeDB(db);

  // Sync to Supabase
  try {
    const supabase = getServerSupabase();
    if (supabase) {
      // Upsert all modified pages
      for (const o of orders) {
        const page = db.pages.find((p: any) => p.id === o.id);
        if (page) {
          const { error } = await supabase
            .from('pages')
            .upsert(mapPageToSupabase(page));
          if (error) {
            console.log('[Supabase Error] Reordering page failed to sync to Supabase:', error.message);
          }
        }
      }
    }
  } catch (err: any) {
    console.log('[Supabase Info] Local pages reordered, but Supabase sync was skipped. Details:', err.message || String(err));
  }

  const sortedPages = db.pages.map((p: any) => {
    const visibility = p.isVisibleInFooter !== undefined ? p.isVisibleInFooter : (p.showInFooter !== undefined ? p.showInFooter : true);
    return {
      ...p,
      isVisibleInFooter: visibility,
      showInFooter: visibility,
      order: p.order !== undefined ? p.order : 0
    };
  });
  sortedPages.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  res.json({ success: true, pages: sortedPages });
});

app.post('/api/pages', async (req, res) => {
  const db = readDB();
  if (!db.pages) db.pages = [];
  const { id, title, slug, content, showInFooter, isVisibleInFooter, isSystem } = req.body;
  if (!title || !slug) {
    return res.status(400).json({ error: 'Title and slug are required' });
  }

  const visibility = isVisibleInFooter !== undefined ? isVisibleInFooter : (showInFooter !== undefined ? showInFooter : true);

  const existingIndex = db.pages.findIndex((p: any) => p.id === id || p.slug === slug);
  let page;
  if (existingIndex !== -1) {
    db.pages[existingIndex] = {
      ...db.pages[existingIndex],
      title,
      slug,
      content,
      showInFooter: visibility,
      isVisibleInFooter: visibility,
      isSystem: db.pages[existingIndex].isSystem || isSystem
    };
    page = db.pages[existingIndex];
  } else {
    page = {
      id: id || 'page-' + Date.now(),
      title,
      slug,
      content: content || '',
      showInFooter: visibility,
      isVisibleInFooter: visibility,
      isSystem: !!isSystem
    };
    db.pages.push(page);
  }
  writeDB(db);

  try {
    const supabase = getServerSupabase();
    if (supabase) {
      const { error } = await supabase
        .from('pages')
        .upsert(mapPageToSupabase(page));
      if (error) {
        console.log('[Supabase Info] Local page updated, but Supabase sync was skipped:', error.message);
      }
    }
  } catch (err: any) {
    console.log('[Supabase Info] Local page updated, but Supabase sync was skipped. Details:', err.message || String(err));
  }

  res.json({ success: true, page });
});

app.put('/api/pages/:id', async (req, res) => {
  const db = readDB();
  if (!db.pages) db.pages = [];
  const index = db.pages.findIndex((p: any) => p.id === req.params.id);

  if (index !== -1) {
    const { title, slug, content, isVisibleInFooter, showInFooter } = req.body;
    const visibility = isVisibleInFooter !== undefined ? isVisibleInFooter : (showInFooter !== undefined ? showInFooter : db.pages[index].showInFooter);

    db.pages[index] = {
      ...db.pages[index],
      title: title !== undefined ? title : db.pages[index].title,
      slug: slug !== undefined ? slug : db.pages[index].slug,
      content: content !== undefined ? content : db.pages[index].content,
      showInFooter: visibility,
      isVisibleInFooter: visibility
    };
    writeDB(db);

    try {
      const supabase = getServerSupabase();
      if (supabase) {
        const { error } = await supabase
          .from('pages')
          .upsert(mapPageToSupabase(db.pages[index]));
        if (error) {
          console.log('[Supabase Info] Local page updated, but Supabase sync was skipped:', error.message);
        }
      }
    } catch (err: any) {
      console.log('[Supabase Info] Local page updated, but Supabase sync was skipped. Details:', err.message || String(err));
    }

    res.json({ success: true, page: db.pages[index] });
  } else {
    res.status(404).json({ error: 'Page not found' });
  }
});

app.delete('/api/pages/:id', async (req, res) => {
  const db = readDB();
  if (!db.pages) db.pages = [];
  const pageIndex = db.pages.findIndex((p: any) => p.id === req.params.id);
  if (pageIndex !== -1) {
    if (db.pages[pageIndex].isSystem) {
      return res.status(400).json({ error: 'Cannot delete system pages' });
    }
    db.pages.splice(pageIndex, 1);
    writeDB(db);

    try {
      const supabase = getServerSupabase();
      if (supabase) {
        const { error } = await supabase
          .from('pages')
          .delete()
          .eq('id', req.params.id);
        if (error) {
          console.log('[Supabase Info] Local page deleted, but Supabase sync was skipped:', error.message);
        }
      }
    } catch (err: any) {
      console.log('[Supabase Info] Local page deleted, but Supabase sync was skipped. Details:', err.message || String(err));
    }

    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Page not found' });
  }
});

// 6. Contact Submissions endpoints
app.get('/api/contacts', async (req, res) => {
  const db = readDB();
  const localContacts = db.contacts || [];

  try {
    const supabase = getServerSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('contacts')
        .select('*');
      
      if (!error && data) {
        const mappedContacts = data.map(mapContactFromSupabase);

        // Merge localContacts and mappedContacts by ID
        const mergedMap = new Map();
        mappedContacts.forEach((c: any) => mergedMap.set(c.id, c));
        localContacts.forEach((c: any) => mergedMap.set(c.id, c));

        const mergedContacts = Array.from(mergedMap.values());
        mergedContacts.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        db.contacts = mergedContacts;
        writeDB(db);

        return res.json(mergedContacts);
      }
    }
  } catch (err: any) {
    console.log('[Supabase Info] Serving contacts from local JSON store. Details:', err.message || String(err));
  }

  localContacts.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(localContacts);
});

app.post('/api/contacts', async (req, res) => {
  const db = readDB();
  if (!db.contacts) db.contacts = [];
  
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required fields' });
  }

  const newContact = {
    id: 'contact-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    name,
    email,
    subject: subject || 'General Query',
    message,
    createdAt: new Date().toISOString(),
    status: 'unread'
  };

  db.contacts.push(newContact);
  writeDB(db);

  try {
    const supabase = getServerSupabase();
    if (supabase) {
      const { error } = await supabase
        .from('contacts')
        .insert([mapContactToSupabase(newContact)]);
      if (error) {
        console.log('[Supabase Info] Local contact created, but Supabase sync was skipped:', error.message);
      }
    }
  } catch (err: any) {
    console.log('[Supabase Info] Local contact created, but Supabase sync was skipped. Details:', err.message || String(err));
  }

  res.json({ success: true, contact: newContact });
});

app.delete('/api/contacts/:id', async (req, res) => {
  const db = readDB();
  if (!db.contacts) db.contacts = [];
  
  const contactIndex = db.contacts.findIndex((c: any) => c.id === req.params.id);
  if (contactIndex !== -1) {
    db.contacts.splice(contactIndex, 1);
    writeDB(db);

    try {
      const supabase = getServerSupabase();
      if (supabase) {
        const { error } = await supabase
          .from('contacts')
          .delete()
          .eq('id', req.params.id);
        if (error) {
          console.log('[Supabase Info] Local contact deleted, but Supabase sync was skipped:', error.message);
        }
      }
    } catch (err: any) {
      console.log('[Supabase Info] Local contact deleted, but Supabase sync was skipped. Details:', err.message || String(err));
    }

    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Contact submission not found' });
  }
});

// Lazy-initialize Supabase on the server
let serverSupabaseClient: any = null;
function getServerSupabase() {
  const db = readDB();
  if (!isCustomSupabaseConfigured(db)) {
    return null;
  }
  const url = db.adminSettings?.supabaseUrl || process.env.VITE_SUPABASE_URL || 'https://crdmccidgzknnylyggbf.supabase.co';
  const anonKey = db.adminSettings?.supabaseAnonKey || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZG1jY2lkZ3prbm55bHlnZ2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NDg1NjAsImV4cCI6MjA5ODAyNDU2MH0.gPwgKSe-0lSFZf4holpBctmYSGrTYsv5cwpKcgLODBs';

  if (!serverSupabaseClient || serverSupabaseClient.__url !== url || serverSupabaseClient.__key !== anonKey) {
    if (!url || !anonKey) {
      throw new Error('Supabase configuration missing (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required)');
    }
    serverSupabaseClient = createClient(url, anonKey);
    serverSupabaseClient.__url = url;
    serverSupabaseClient.__key = anonKey;
  }
  return serverSupabaseClient;
}

let adminSupabaseClient: any = null;
function getAdminSupabase() {
  const db = readDB();
  if (!isCustomSupabaseConfigured(db)) {
    return null;
  }
  const url = db.adminSettings?.supabaseUrl || process.env.VITE_SUPABASE_URL || 'https://crdmccidgzknnylyggbf.supabase.co';
  const serviceRoleKey = db.adminSettings?.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!adminSupabaseClient || adminSupabaseClient.__url !== url || adminSupabaseClient.__key !== serviceRoleKey) {
    if (!serviceRoleKey) {
      console.warn('SUPABASE_SERVICE_ROLE_KEY is missing. Supabase auth admin operations will be skipped or simulated.');
      return null;
    }
    adminSupabaseClient = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    adminSupabaseClient.__url = url;
    adminSupabaseClient.__key = serviceRoleKey;
  }
  return adminSupabaseClient;
}

// OAuth Callback Route to handle Google Sign-In redirect
app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
  const code = req.query.code as string;
  
  if (!code) {
    return res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #f8fafc; color: #0f172a; margin: 0;">
          <div id="error-container" style="background-color: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: center; max-width: 400px;">
            <h1 style="color: #ef4444; margin-top: 0;">Authentication Error</h1>
            <p>No authorization code was returned from the sign-in provider.</p>
            <button onclick="window.close()" style="margin-top: 1rem; background-color: #ef4444; color: white; border: none; padding: 0.5rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: bold;">Close Window</button>
          </div>
          <div id="success-container" style="display: none; background-color: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: center; max-width: 400px;">
            <h1 style="color: #0d9488; margin-top: 0;">Success!</h1>
            <p>You have logged in successfully with Google.</p>
            <p style="color: #64748b; font-size: 0.875rem;">This window will close automatically...</p>
          </div>
          <script>
            function parseHash() {
              const hash = window.location.hash.substring(1);
              const params = {};
              if (!hash) return params;
              hash.split('&').forEach(pair => {
                const parts = pair.split('=');
                params[parts[0]] = decodeURIComponent(parts[1] || '');
              });
              return params;
            }

            function parseJwt(token) {
              try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                return JSON.parse(jsonPayload);
              } catch (e) {
                console.error('Error parsing JWT:', e);
                return null;
              }
            }

            const hashParams = parseHash();
            if (hashParams.access_token) {
              const payload = parseJwt(hashParams.access_token);
              if (payload) {
                if (window.opener) {
                  const session = {
                    access_token: hashParams.access_token,
                    refresh_token: hashParams.refresh_token,
                    expires_in: hashParams.expires_in,
                    token_type: hashParams.token_type,
                    user: {
                      id: payload.sub,
                      email: payload.email,
                      user_metadata: payload.user_metadata || {}
                    }
                  };
                  
                  document.getElementById('error-container').style.display = 'none';
                  document.getElementById('success-container').style.display = 'block';
                  
                  window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', session: session }, '*');
                  setTimeout(() => window.close(), 1000);
                } else {
                  // Direct fallback for lost openers (e.g. mobile tabs / blocked popups)
                  document.getElementById('error-container').style.display = 'none';
                  document.getElementById('success-container').style.display = 'block';
                  setTimeout(() => {
                    window.location.href = '/' + window.location.hash;
                  }, 800);
                }
              } else if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_FAILURE', error: 'Invalid session tokens received' }, '*');
                setTimeout(() => window.close(), 3000);
              }
            } else {
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_FAILURE', error: hashParams.error_description || 'No auth code found' }, '*');
                setTimeout(() => window.close(), 3000);
              } else {
                // If there is an error/no token and no opener, redirect back to home page
                setTimeout(() => {
                  window.location.href = '/';
                }, 3000);
              }
            }
          </script>
        </body>
      </html>
    `);
  }

  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.session) {
      throw error || new Error('Failed to retrieve active session');
    }

    const sessionJson = JSON.stringify(data.session);

    res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #f8fafc; color: #0f172a; margin: 0;">
          <div style="background-color: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: center; max-width: 400px;">
            <h1 style="color: #0d9488; margin-top: 0;">Success!</h1>
            <p>You have logged in successfully with Google.</p>
            <p style="color: #64748b; font-size: 0.875rem;">This window will close automatically...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', session: ${sessionJson} }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('Supabase token exchange error:', err);
    res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #f8fafc; color: #0f172a; margin: 0;">
          <div style="background-color: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: center; max-width: 400px;">
            <h1 style="color: #ef4444; margin-top: 0;">Exchange Failed</h1>
            <p>Could not verify authorization code with Supabase.</p>
            <p style="color: #64748b; font-size: 0.875rem;">${err.message || 'Unknown error'}</p>
            <button onclick="window.close()" style="margin-top: 1rem; background-color: #ef4444; color: white; border: none; padding: 0.5rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: bold;">Close Window</button>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_FAILURE', error: ${JSON.stringify(err.message || 'Token exchange failed')} }, '*');
              setTimeout(() => window.close(), 5000);
            }
          </script>
        </body>
      </html>
    `);
  }
});

// AI Resume Content Enhancer using Gemini API
app.post('/api/resume/enhance', async (req, res) => {
  const { section, text, role } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required to enhance' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'GEMINI_API_KEY is not configured on the server. Please add it to your secrets.' 
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    let prompt = '';
    if (section === 'summary') {
      prompt = `Write a professional, impactful 2-3 sentence resume summary statement for a ${role || 'professional'} based on this draft/notes: "${text}". Make it high-impact and compelling. Return only the final text, no introductions or markdown styling.`;
    } else if (section === 'experience') {
      prompt = `Enhance this job description/achievement for a resume. Turn it into 2-3 polished, action-oriented bullet points (starting with strong action verbs) suitable for a ${role || 'professional'}. Draft: "${text}". 
CRITICAL: Do NOT include any introductory text, preamble, conversational filler, markdown code blocks, or explanations. 
Return ONLY the bullet points, each starting with a hyphen '-' followed by a space, on a new line.
Example output format:
- Designed and executed strategic marketing campaigns.
- Managed a high-performing team of developers.`;
    } else if (section === 'skills') {
      prompt = `Review this draft list of skills: "${text}". Suggest a refined, comma-separated list of professional, industry-standard skill terms suitable for a ${role || 'professional'}. Return only the clean comma-separated terms, no explanations.`;
    } else {
      prompt = `Review and improve this professional resume text for a ${role || 'professional'}: "${text}". Enhance vocabulary, impact, and grammar. Return only the refined text.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    let enhancedText = response.text?.trim() || '';

    // Advanced cleaning for robust bullet formatting
    if (section === 'experience') {
      // Remove markdown code blocks if present
      enhancedText = enhancedText.replace(/```[a-z]*\n?/gi, '');
      enhancedText = enhancedText.replace(/```/g, '');
      enhancedText = enhancedText.trim();

      const lines = enhancedText.split('\n');
      const validBullets: string[] = [];

      for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        const lower = line.toLowerCase();
        // Skip conversational lines
        if (
          lower.startsWith('here is') ||
          lower.startsWith('here are') ||
          lower.startsWith('sure,') ||
          lower.startsWith('i hope') ||
          lower.startsWith('polished') ||
          lower.startsWith('bullet points:') ||
          lower.startsWith('improved') ||
          lower.startsWith('revised') ||
          lower.startsWith('edited') ||
          lower.includes('suitable for') ||
          lower.endsWith(':')
        ) {
          continue;
        }

        // Standardize prefix to standard hyphen '-'
        const match = line.match(/^([•\-\s*]+)(.*)/);
        if (match) {
          const content = match[2].trim();
          if (content) {
            validBullets.push(`- ${content}`);
          }
        } else {
          validBullets.push(`- ${line}`);
        }
      }

      if (validBullets.length > 0) {
        enhancedText = validBullets.join('\n');
      }
    }

    res.json({ enhancedText });
  } catch (err: any) {
    console.error('Error enhancing resume via Gemini:', err);
    res.status(500).json({ error: 'AI processing failed: ' + (err.message || String(err)) });
  }
});

// GET resumes (list all saved resumes or filter by userId)
app.get('/api/resumes', async (req, res) => {
  try {
    const db = readDB();
    if (!db.resumes) db.resumes = [];
    
    const userId = req.query.userId;
    if (userId) {
      const filtered = db.resumes.filter((r: any) => r.user_id === userId);
      return res.json({ success: true, resumes: filtered });
    }
    
    res.json({ success: true, resumes: db.resumes });
  } catch (error: any) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// POST save / update a resume draft
app.post('/api/resumes', async (req, res) => {
  try {
    const db = readDB();
    if (!db.resumes) db.resumes = [];
    
    const { id, userId, name, timestamp, data, template } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Resume id is required' });
    }
    
    const cleanId = id.trim();
    const cleanUserId = userId ? userId.trim() : 'guest';
    const cleanName = name ? name.trim() : 'My Resume Draft';
    
    const newResume = {
      id: cleanId,
      user_id: cleanUserId,
      name: cleanName,
      timestamp: timestamp || new Date().toISOString(),
      data: data,
      template: template || 'donna-elegant'
    };
    
    const existingIndex = db.resumes.findIndex((r: any) => r.id === cleanId);
    if (existingIndex !== -1) {
      db.resumes[existingIndex] = newResume;
    } else {
      db.resumes.push(newResume);
    }
    
    writeDB(db);
    
    // Sync to Supabase if custom Supabase is configured
    try {
      const supabase = getServerSupabase();
      if (supabase) {
        const payload = mapResumeToSupabase(newResume);
        const { error } = await supabase
          .from('resumes')
          .upsert(payload, { onConflict: 'id' });
          
        if (error) {
          if (error.message?.includes('does not exist')) {
            // Try fallback 'user_resumes' table
            const { error: altError } = await supabase
              .from('user_resumes')
              .upsert(payload, { onConflict: 'id' });
            if (altError) {
              console.log('[Supabase Info] Local resume saved, but user_resumes sync was skipped:', altError.message);
            }
          } else {
            console.log('[Supabase Info] Local resume saved, but resumes sync was skipped:', error.message);
          }
        }
      }
    } catch (dbErr: any) {
      console.warn('[Supabase Warn] Failed to sync resume save to Supabase:', dbErr.message);
    }
    
    res.json({ success: true, resume: newResume });
  } catch (error: any) {
    console.error('Error saving resume:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// DELETE a resume
app.delete('/api/resumes/:id', async (req, res) => {
  try {
    const db = readDB();
    if (!db.resumes) db.resumes = [];
    
    const resumeId = req.params.id;
    db.resumes = db.resumes.filter((r: any) => r.id !== resumeId);
    writeDB(db);
    
    // Sync deletion to Supabase if custom Supabase is configured
    try {
      const supabase = getServerSupabase();
      if (supabase) {
        const { error } = await supabase
          .from('resumes')
          .delete()
          .eq('id', resumeId);
          
        if (error) {
          if (error.message?.includes('does not exist')) {
            // Try fallback 'user_resumes' table
            const { error: altError } = await supabase
              .from('user_resumes')
              .delete()
              .eq('id', resumeId);
            if (altError) {
              console.log('[Supabase Info] Local resume deleted, but user_resumes deletion skipped:', altError.message);
            }
          } else {
            console.log('[Supabase Info] Local resume deleted, but resumes deletion skipped:', error.message);
          }
        }
      }
    } catch (dbErr: any) {
      console.warn('[Supabase Warn] Failed to sync resume deletion to Supabase:', dbErr.message);
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting resume:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Sync current user (login or trigger trial evaluation)
app.post('/api/users/register', async (req, res) => {
  const { name, email, password, avatar } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = readDB();
  let existingUser = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: 'Account already exists with this email address' });
  }

  const isAdmin = email.toLowerCase() === 'kokborokanimations@gmail.com';
  const now = new Date();
  const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const user = {
    id: 'user-' + Date.now(),
    name: name || email.split('@')[0],
    email: email.toLowerCase(),
    password: password,
    avatar: avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email)}`,
    joinDate: now.toISOString(),
    created_at: now.toISOString(),
    trialExpiryDate: expiry.toISOString(),
    subscriptionStatus: isAdmin ? 'Active' : 'Free Trial',
    role: isAdmin ? 'admin' : 'member'
  };

  db.users.push(user);
  writeDB(db);

  // Sync to Supabase
  try {
    const supabase = getServerSupabase();
    if (supabase) {
      const { error } = await supabase
        .from('users')
        .upsert(mapUserToSupabase(user));
      if (error) {
        console.log('[Supabase Info] Local user synced but Supabase upsert skipped:', error.message);
      }
    }
  } catch (err: any) {
    console.log('[Supabase Info] Local user synced but Supabase upsert skipped. Details:', err.message || String(err));
  }

  const responseUser = { ...user };
  delete responseUser.password;
  res.json(responseUser);
});

app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = readDB();
  let user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(400).json({ error: 'No account found with this email. Please sign up.' });
  }

  if (user.password && user.password !== password) {
    return res.status(400).json({ error: 'Incorrect password' });
  }

  if (!user.password) {
    user.password = password;
    writeDB(db);
  }

  const isAdmin = email.toLowerCase() === 'kokborokanimations@gmail.com';
  user.role = isAdmin ? 'admin' : 'member';
  if (isAdmin) {
    user.subscriptionStatus = 'Active';
  }

  // Check trial or premium subscription expiration
  if (user.subscriptionStatus === 'Free Trial') {
    const now = new Date();
    const expiry = new Date(user.trialExpiryDate);
    if (now > expiry) {
      user.subscriptionStatus = 'Expired';
    }
  } else if (user.subscriptionStatus === 'Active' && !isAdmin) {
    const now = new Date();
    const planExpiryStr = user.plan_expiry_date || user.planExpiryDate;
    if (planExpiryStr) {
      const expiry = new Date(planExpiryStr);
      if (now > expiry) {
        user.subscriptionStatus = 'Expired';
      }
    }
  }
  writeDB(db);

  // Sync to Supabase
  try {
    const supabase = getServerSupabase();
    if (supabase) {
      const { error } = await supabase
        .from('users')
        .upsert(mapUserToSupabase(user));
      if (error) {
        console.log('[Supabase Info] Local user synced but Supabase upsert skipped:', error.message);
      }
    }
  } catch (err: any) {
    console.log('[Supabase Info] Local user synced but Supabase upsert skipped. Details:', err.message || String(err));
  }

  const responseUser = { ...user };
  delete responseUser.password;
  res.json(responseUser);
});

// Sync current user (login or trigger trial evaluation)
app.post('/api/users/sync', async (req, res) => {
  const { name, email, avatar } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required to sync user' });
  }

  const db = readDB();
  let user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  const isAdmin = email.toLowerCase() === 'kokborokanimations@gmail.com';

  if (!user) {
    // Create new user with 30 days trial
    const now = new Date();
    const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    user = {
      id: 'user-' + Date.now(),
      name: name || email.split('@')[0],
      email: email.toLowerCase(),
      avatar: avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email)}`,
      joinDate: now.toISOString(),
      created_at: now.toISOString(),
      trialExpiryDate: expiry.toISOString(),
      subscriptionStatus: isAdmin ? 'Active' : 'Free Trial',
      role: isAdmin ? 'admin' : 'member'
    };

    db.users.push(user);
    writeDB(db);
  } else {
    // Ensure correct role and subscription status for existing users
    user.role = isAdmin ? 'admin' : 'member';
    if (isAdmin) {
      user.subscriptionStatus = 'Active';
    }

    // Check trial or premium subscription expiration
    if (user.subscriptionStatus === 'Free Trial') {
      const now = new Date();
      const expiry = new Date(user.trialExpiryDate);
      if (now > expiry) {
        user.subscriptionStatus = 'Expired';
      }
    } else if (user.subscriptionStatus === 'Active' && !isAdmin) {
      const now = new Date();
      const planExpiryStr = user.plan_expiry_date || user.planExpiryDate;
      if (planExpiryStr) {
        const expiry = new Date(planExpiryStr);
        if (now > expiry) {
          user.subscriptionStatus = 'Expired';
        }
      }
    }
    writeDB(db);
  }

  // Sync to Supabase
  try {
    const supabase = getServerSupabase();
    if (supabase) {
      const { error } = await supabase
        .from('users')
        .upsert(mapUserToSupabase(user));
      if (error) {
        console.log('[Supabase Info] Local user synced but Supabase upsert skipped:', error.message);
      }
    }
  } catch (err: any) {
    console.log('[Supabase Info] Local user synced but Supabase upsert skipped. Details:', err.message || String(err));
  }

  res.json(user);
});

// Override subscription
app.put('/api/users/:id/subscription', async (req, res) => {
  const { subscriptionStatus, trialExpiryDate, plan_expiry_date, planExpiryDate } = req.body;
  const db = readDB();
  const index = db.users.findIndex((u: any) => u.id === req.params.id);
  if (index !== -1) {
    if (subscriptionStatus) {
      db.users[index].subscriptionStatus = subscriptionStatus;
      if (subscriptionStatus === 'Active' && !db.users[index].plan_expiry_date && !plan_expiry_date && !planExpiryDate) {
        const now = new Date();
        const planExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        db.users[index].plan_expiry_date = planExpiry.toISOString();
        db.users[index].planExpiryDate = planExpiry.toISOString();
      }
    }
    if (trialExpiryDate) {
      db.users[index].trialExpiryDate = trialExpiryDate;
    }
    if (plan_expiry_date) {
      db.users[index].plan_expiry_date = plan_expiry_date;
      db.users[index].planExpiryDate = plan_expiry_date;
    } else if (planExpiryDate) {
      db.users[index].plan_expiry_date = planExpiryDate;
      db.users[index].planExpiryDate = planExpiryDate;
    }
    writeDB(db);

    try {
      const supabase = getServerSupabase();
      if (supabase) {
        const { error } = await supabase
          .from('users')
          .upsert(mapUserToSupabase(db.users[index]));
        if (error) {
          console.log('[Supabase Info] Subscription updated locally, but Supabase sync skipped:', error.message);
        }
      }
    } catch (err: any) {
      console.log('[Supabase Info] Subscription updated locally, but Supabase sync skipped. Details:', err.message || String(err));
    }

    res.json({ success: true, user: db.users[index] });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Delete user from local database and Supabase Auth
app.delete('/api/users/:id', async (req, res) => {
  const db = readDB();
  const user = db.users.find((u: any) => u.id === req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Prevent deleting the main Admin developer for security
  if (user.email.toLowerCase() === 'kokborokanimations@gmail.com') {
    return res.status(403).json({ error: 'Cannot delete the main platform Administrator' });
  }

  let deletedFromSupabase = false;
  let supabaseError = null;

  try {
    const supabaseAdmin = getAdminSupabase();
    if (supabaseAdmin) {
      // List users to find the matching email
      const { data, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) {
        throw listError;
      }

      const sbUser = data.users?.find((u: any) => u.email?.toLowerCase() === user.email.toLowerCase());
      if (sbUser) {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(sbUser.id);
        if (deleteError) {
          throw deleteError;
        }
        deletedFromSupabase = true;
      } else {
        console.log(`User email ${user.email} not found in Supabase Auth`);
      }
    }
  } catch (err: any) {
    console.error('Error deleting user from Supabase Auth:', err);
    supabaseError = err.message || err;
  }

  // Clean up user and their community posts from db.json
  db.users = db.users.filter((u: any) => u.id !== req.params.id);
  db.communityPosts = db.communityPosts.filter((p: any) => p.userId !== req.params.id);
  writeDB(db);

  try {
    const supabase = getServerSupabase();
    if (supabase) {
      await supabase.from('users').delete().eq('id', req.params.id);
      await supabase.from('community_posts').delete().eq('user_id', req.params.id);
    }
  } catch (err: any) {
    console.log('[Supabase Info] Local user cleanup done, but Supabase table sync skipped:', err.message || String(err));
  }

  res.json({
    success: true,
    deletedFromSupabase,
    supabaseError,
    message: deletedFromSupabase 
      ? 'User successfully deleted from Supabase Auth and local database.' 
      : (supabaseError 
          ? `User deleted from local database, but Supabase error occurred: ${supabaseError}`
          : 'User deleted from local database (Supabase Auth user not found or Service Role Key not set).')
  });
});

// 5. Payments (Cashfree Order & Verification & Polling Status)
app.post('/api/payments/create-order', async (req, res) => {
  const { userId, userEmail, amount } = req.body;
  const db = readDB();
  const settings = db.adminSettings;

  const orderId = 'order_' + Date.now();

  const cfAppId = settings.cashfreeAppId || settings.razorpayKeyId || '';
  const cfSecret = settings.cashfreeSecretKey || settings.razorpayKeySecret || '';

  // If Cashfree credentials are missing, we run in Simulator Mode
  if (!cfAppId || !cfSecret) {
    return res.json({
      isMock: true,
      order_id: orderId,
      order_amount: amount || settings.membershipPrice || 499,
      order_currency: settings.currency || 'INR',
      message: 'Cashfree Gateway is in Simulator Mode. Click Continue to proceed.'
    });
  }

  try {
    const isSandbox = cfAppId.startsWith('TEST') || settings.cashfreeSandbox === true;
    const reqHost = req.headers.host || 'sebok.in';

    // Cashfree production API keys are domain-restricted to 'sebok.in'.
    // If running in development/preview/AI Studio environments, we must fall back to the Simulator
    // to avoid the fatal "error 0: Can only be used on: https://sebok.in" SDK crash.
    const isProductionOnWrongDomain = !isSandbox && 
      !reqHost.includes('sebok.in') && 
      !reqHost.includes('localhost') && 
      !reqHost.includes('127.0.0.1');

    if (isProductionOnWrongDomain) {
      console.log(`[Cashfree Sync Bypass] Host is "${reqHost}" but production keys are configured. Activating Simulator Mode.`);
      return res.json({
        isMock: true,
        order_id: orderId,
        order_amount: amount || settings.membershipPrice || 499,
        order_currency: settings.currency || 'INR',
        message: 'Your production Cashfree Gateway is configured for sebok.in. Since you are running on a development/preview domain, we have automatically loaded the Cashfree Simulator for safe testing.',
        warning: 'Cashfree production keys are domain-restricted to https://sebok.in.'
      });
    }

    const cashfreeUrl = isSandbox 
      ? 'https://sandbox.cashfree.com/pg/orders' 
      : 'https://api.cashfree.com/pg/orders';

    const finalAmount = Number(amount || settings.membershipPrice || 499);
    const protocol = reqHost.includes('localhost') ? 'http' : 'https';
    const dynamicReturnUrl = `${protocol}://${reqHost}/payments/success?order_id=${orderId}`;

    const payload = {
      order_amount: finalAmount,
      order_currency: settings.currency || 'INR',
      order_id: orderId,
      customer_details: {
        customer_id: userId || 'cust_' + Date.now(),
        customer_phone: '9999999999', // cashfree requires phone number, so provide a fallback if missing
        customer_email: userEmail || 'guest@sebok.in'
      },
      order_meta: {
        return_url: dynamicReturnUrl
      }
    };

    const headers = {
      'Content-Type': 'application/json',
      'x-client-id': cfAppId,
      'x-client-secret': cfSecret,
      'x-api-version': '2023-08-01'
    };

    const cfResponse = await fetch(cashfreeUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!cfResponse.ok) {
      const errorText = await cfResponse.text();
      throw new Error(`Cashfree error: ${cfResponse.status} - ${errorText}`);
    }

    const cfOrder = await cfResponse.json();

    res.json({
      isMock: false,
      order_id: cfOrder.order_id,
      order_amount: cfOrder.order_amount,
      order_currency: cfOrder.order_currency,
      payment_session_id: cfOrder.payment_session_id,
      payment_link: cfOrder.payment_link,
      isSandbox: isSandbox
    });
  } catch (err: any) {
    console.error('Cashfree Connection or API failed, falling back to simulator:', err);
    res.json({
      isMock: true,
      order_id: orderId,
      order_amount: amount || settings.membershipPrice || 499,
      order_currency: settings.currency || 'INR',
      warning: 'Cashfree API returned an error, running in Mock Simulator Mode.',
      errorDetail: err.message || 'Check Cashfree Credentials configuration.'
    });
  }
});

// Polling status for Cashfree orders
app.get('/api/payments/status/:orderId', async (req, res) => {
  const { orderId } = req.params;
  const db = readDB();
  const settings = db.adminSettings;

  // Find if there is already a successful payment log locally
  const existingSuccessLog = db.paymentLogs.find((l: any) => l.id === orderId && l.status === 'SUCCESS');
  if (existingSuccessLog) {
    return res.json({ status: 'SUCCESS' });
  }

  const cfAppId = settings.cashfreeAppId || settings.razorpayKeyId || '';
  const cfSecret = settings.cashfreeSecretKey || settings.razorpayKeySecret || '';

  // If credentials are empty, we don't query Cashfree, it's simulated
  if (!cfAppId || !cfSecret) {
    return res.json({ status: 'MOCK' });
  }

  try {
    const isSandbox = cfAppId.startsWith('TEST') || settings.cashfreeSandbox === true;
    const cashfreeUrl = isSandbox 
      ? `https://sandbox.cashfree.com/pg/orders/${orderId}` 
      : `https://api.cashfree.com/pg/orders/${orderId}`;

    const cfResponse = await fetch(cashfreeUrl, {
      method: 'GET',
      headers: {
        'x-client-id': cfAppId,
        'x-client-secret': cfSecret,
        'x-api-version': '2023-08-01'
      }
    });

    if (cfResponse.ok) {
      const orderInfo = await cfResponse.json();
      if (orderInfo.order_status === 'PAID') {
        const userEmail = orderInfo.customer_details?.customer_email;
        let updatedUserObj: any = null;

        const alreadyLogged = db.paymentLogs.some((l: any) => l.id === orderId && l.status === 'SUCCESS');
        if (!alreadyLogged) {
          const newLog = {
            id: orderId,
            userId: orderInfo.customer_details?.customer_id || 'unknown_user',
            userEmail: userEmail || 'unknown@example.com',
            amount: orderInfo.order_amount,
            status: 'SUCCESS' as const,
            txId: orderId,
            createdAt: new Date().toISOString()
          };
          db.paymentLogs.unshift(newLog);

          if (userEmail) {
            const userIndex = db.users.findIndex((u: any) => u.email.toLowerCase() === userEmail.toLowerCase());
            if (userIndex !== -1) {
              db.users[userIndex].subscriptionStatus = 'Active';
              const now = new Date();
              const planExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
              db.users[userIndex].plan_expiry_date = planExpiry.toISOString();
              db.users[userIndex].planExpiryDate = planExpiry.toISOString();
              updatedUserObj = db.users[userIndex];
            }
          }
          writeDB(db);

          try {
            const supabase = getServerSupabase();
            if (supabase) {
              await supabase.from('payment_logs').insert([mapPaymentLogToSupabase(newLog)]);
              if (updatedUserObj) {
                await supabase.from('users').upsert(mapUserToSupabase(updatedUserObj));
              }
            }
          } catch (supErr: any) {
            console.log('[Supabase Info] Syncing Cashfree payment failed:', supErr.message);
          }
        }

        return res.json({ status: 'SUCCESS' });
      } else {
        return res.json({ status: orderInfo.order_status });
      }
    } else {
      return res.json({ status: 'ERROR', message: `Cashfree status response code: ${cfResponse.status}` });
    }
  } catch (err: any) {
    console.error('Error in cashfree status check:', err);
    return res.json({ status: 'ERROR', message: err.message });
  }
});

// Verify payment / callback simulation
app.post('/api/payments/verify', async (req, res) => {
  const { orderId, paymentId, signature, status, userId, userEmail, amount, txId } = req.body;
  const db = readDB();
  const settings = db.adminSettings;

  let finalStatus = 'FAILED';
  let verifiedTxId = txId || paymentId || 'cf_tx_' + Date.now();

  const cfAppId = settings.cashfreeAppId || settings.razorpayKeyId || '';
  const cfSecret = settings.cashfreeSecretKey || settings.razorpayKeySecret || '';

  if (!cfAppId || !cfSecret) {
    finalStatus = status === 'SUCCESS' ? 'SUCCESS' : 'FAILED';
  } else {
    try {
      const isSandbox = cfAppId.startsWith('TEST') || settings.cashfreeSandbox === true;
      const cashfreeUrl = isSandbox 
        ? `https://sandbox.cashfree.com/pg/orders/${orderId}` 
        : `https://api.cashfree.com/pg/orders/${orderId}`;

      const cfResponse = await fetch(cashfreeUrl, {
        method: 'GET',
        headers: {
          'x-client-id': cfAppId,
          'x-client-secret': cfSecret,
          'x-api-version': '2023-08-01'
        }
      });

      if (cfResponse.ok) {
        const orderInfo = await cfResponse.json();
        if (orderInfo.order_status === 'PAID') {
          finalStatus = 'SUCCESS';
          verifiedTxId = orderId;
        }
      }
    } catch (err) {
      console.error('Error verifying Cashfree order:', err);
    }
  }

  const newLog = {
    id: verifiedTxId,
    userId: userId || 'unknown_user',
    userEmail: userEmail || 'unknown@example.com',
    amount: amount || settings.membershipPrice || 499,
    status: finalStatus as any,
    txId: verifiedTxId,
    createdAt: new Date().toISOString()
  };

  const alreadyLogged = db.paymentLogs.some((l: any) => l.id === verifiedTxId && l.status === 'SUCCESS');
  let updatedUserObj: any = null;

  if (finalStatus === 'SUCCESS' && !alreadyLogged) {
    db.paymentLogs.unshift(newLog);
    const userIndex = db.users.findIndex((u: any) => u.email.toLowerCase() === userEmail.toLowerCase() || u.id === userId);
    if (userIndex !== -1) {
      db.users[userIndex].subscriptionStatus = 'Active';
      const now = new Date();
      const planExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      db.users[userIndex].plan_expiry_date = planExpiry.toISOString();
      db.users[userIndex].planExpiryDate = planExpiry.toISOString();
      updatedUserObj = db.users[userIndex];
    }
    writeDB(db);

    try {
      const supabase = getServerSupabase();
      if (supabase) {
        await supabase.from('payment_logs').insert([mapPaymentLogToSupabase(newLog)]);
        if (updatedUserObj) {
          await supabase.from('users').upsert(mapUserToSupabase(updatedUserObj));
        }
      }
    } catch (err: any) {
      console.log('[Supabase Info] Local payment verified, Supabase sync skipped:', err.message);
    }
  }

  res.json({ success: finalStatus === 'SUCCESS', log: newLog });
});

// Get payment logs
app.get('/api/payments/logs', async (req, res) => {
  const db = readDB();
  const localLogs = db.paymentLogs || [];

  try {
    const supabase = getServerSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('payment_logs')
        .select('*');
      
      if (!error && data) {
        const mappedLogs = data.map(mapPaymentLogFromSupabase);

        // Merge localLogs and mappedLogs by ID
        const mergedMap = new Map();
        mappedLogs.forEach((log: any) => mergedMap.set(log.id, log));
        localLogs.forEach((log: any) => mergedMap.set(log.id, log));

        const mergedLogs = Array.from(mergedMap.values());
        mergedLogs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        db.paymentLogs = mergedLogs;
        writeDB(db);

        return res.json(mergedLogs);
      }
    }
  } catch (err: any) {
    console.log('[Supabase Info] Serving payment logs from local JSON store. Details:', err.message || String(err));
  }
  res.json(localLogs);
});

// Google Search Console Verification Endpoint (HTML file method)
app.get('/google:hash.html', (req: any, res: any) => {
  const { hash } = req.params;
  const db = readDB();
  const configured = db.adminSettings?.googleSiteVerification || '';
  
  if (configured && configured.includes(hash)) {
    return res.send(`google-site-verification: google${hash}.html`);
  }
  res.status(404).send('Not Found');
});

function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Vite Setup for Development and static handling in Production
async function startServer() {
  // Sync and migrate data with Supabase on startup (Bulletproof & Self-Healing, No Data Loss)
  try {
    const dbData = readDB();
    const supabase = getServerSupabase();
    if (supabase) {
      console.log('[Startup] Custom Supabase is configured. Checking for database seeding or hydration...');
      
      // Query to check if we can reach the 'jobs' table and if it is empty
      const { data: jobs, error: jobsErr } = await supabase.from('jobs').select('id').limit(1);
      
      if (jobsErr) {
        console.warn('[Startup] Warning checking Supabase jobs table (it might not exist yet):', jobsErr.message);
      } else {
        const isSupabaseEmpty = !jobs || jobs.length === 0;
        
        if (isSupabaseEmpty && ((dbData.jobs && dbData.jobs.length > 0) || (dbData.communityPosts && dbData.communityPosts.length > 0))) {
          console.log('[Startup] Supabase is empty but local db.json has data. Performing one-time migration to seed Supabase...');
          
          // Seed Admin Settings
          if (dbData.adminSettings) {
            const dbRow = mapSettingsToSupabase(dbData.adminSettings);
            const cleanedDbRow = await cleanSettingsRowForSupabase(supabase, dbRow);
            await supabase.from('admin_settings').upsert({
              id: 'global_settings',
              ...cleanedDbRow
            });
          }
          
          // Seed Jobs
          if (dbData.jobs && dbData.jobs.length > 0) {
            const rows = dbData.jobs.map(mapJobToSupabase);
            await supabase.from('jobs').upsert(rows);
          }
          
          // Seed Community Posts
          if (dbData.communityPosts && dbData.communityPosts.length > 0) {
            const rows = dbData.communityPosts.map(mapPostToSupabase);
            await supabase.from('community_posts').upsert(rows);
          }
          
          // Seed Users
          if (dbData.users && dbData.users.length > 0) {
            const rows = dbData.users.map(mapUserToSupabase);
            await supabase.from('users').upsert(rows);
          }
          
          // Seed Pages
          if (dbData.pages && dbData.pages.length > 0) {
            const rows = dbData.pages.map(mapPageToSupabase);
            await supabase.from('pages').upsert(rows);
          }
          
          // Seed Contacts
          if (dbData.contacts && dbData.contacts.length > 0) {
            const rows = dbData.contacts.map(mapContactToSupabase);
            await supabase.from('contacts').upsert(rows);
          }
          
          // Seed Resumes
          if (dbData.resumes && dbData.resumes.length > 0) {
            const rows = dbData.resumes.map(mapResumeToSupabase);
            await supabase.from('resumes').upsert(rows);
          }
          
          console.log('[Startup] One-time Supabase seeding finished successfully.');
        } else if (!isSupabaseEmpty) {
          console.log('[Startup] Supabase has data. Hydrating local db.json cache from Supabase...');
          
          // Hydrate Settings
          const { data: sData } = await supabase.from('admin_settings').select('*').eq('id', 'global_settings').maybeSingle();
          if (sData) {
            dbData.adminSettings = { ...dbData.adminSettings, ...mapSettingsFromSupabase(sData, dbData.adminSettings) };
          }
          
          // Hydrate Jobs
          const { data: jData } = await supabase.from('jobs').select('*');
          if (jData && jData.length > 0) {
            const localJobs = dbData.jobs || [];
            const localJobsMap = new Map(localJobs.map((j: any) => [j.id, j]));
            dbData.jobs = jData.map((jobRow: any) => {
              const mapped = mapJobFromSupabase(jobRow);
              // Preserve local isHot if missing/undefined in Supabase row
              if (jobRow.is_hot === undefined && jobRow.isHot === undefined) {
                const localJob: any = localJobsMap.get(mapped.id);
                if (localJob && localJob.isHot !== undefined) {
                  mapped.isHot = localJob.isHot;
                }
              }
              return mapped;
            });
          }
          
          // Hydrate Community Posts
          const { data: cpData } = await supabase.from('community_posts').select('*');
          if (cpData && cpData.length > 0) {
            dbData.communityPosts = cpData.map(mapPostFromSupabase);
          }
          
          // Hydrate Users
          const { data: uData } = await supabase.from('users').select('*');
          if (uData && uData.length > 0) {
            dbData.users = uData.map(mapUserFromSupabase);
          }
          
          // Hydrate Pages
          const { data: pgData } = await supabase.from('pages').select('*');
          if (pgData && pgData.length > 0) {
            const mapped = pgData.map(mapPageFromSupabase);
            mapped.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
            dbData.pages = mapped;
          }
          
          // Hydrate Contacts
          const { data: cData } = await supabase.from('contacts').select('*');
          if (cData && cData.length > 0) {
            dbData.contacts = cData.map(mapContactFromSupabase);
          }
          
          // Hydrate Resumes
          const { data: rData } = await supabase.from('resumes').select('*');
          if (rData && rData.length > 0) {
            dbData.resumes = rData.map(mapResumeFromSupabase);
          }
          
          fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
          console.log('[Startup] Successfully hydrated local db.json cache from Supabase.');
        }
      }
    } else {
      console.log('[Startup] Supabase is not configured on server startup. Skipping startup sync.');
    }
  } catch (startupErr: any) {
    console.warn('[Startup Warning] Error pre-fetching or seeding Supabase:', startupErr.message || String(startupErr));
  }

  let vite: any = null;
  if (process.env.NODE_ENV !== 'production') {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });
  }

  // Intercept all HTML document requests to inject dynamic SEO meta-tags
  app.get('*', async (req: any, res: any, next: any) => {
    const url = req.path;

    // Check if it's an API route, static asset, or Vite internal module
    if (
      url.startsWith('/api/') || 
      url.includes('.') || 
      url.startsWith('/@') || 
      url.includes('/node_modules/')
    ) {
      return next();
    }

    try {
      let html = '';
      if (process.env.NODE_ENV !== 'production' && vite) {
        const indexPath = path.join(process.cwd(), 'index.html');
        if (fs.existsSync(indexPath)) {
          html = fs.readFileSync(indexPath, 'utf-8');
          // Let Vite transform the HTML (inject client script, handle HMR, etc.)
          html = await vite.transformIndexHtml(req.originalUrl, html);
        }
      } else {
        const indexPath = path.join(process.cwd(), 'dist', 'index.html');
        if (fs.existsSync(indexPath)) {
          html = fs.readFileSync(indexPath, 'utf-8');
        }
      }

      if (!html) {
        return next();
      }

      const db = readDB();

      // SEO & Sharing Preview Meta Injector
      const settings = db.adminSettings || {};
      const brand = settings.brandName || 'Sebok';
      const tagline = settings.tagline || 'Tripura jobs in your finger';
      const bannerUrl = settings.bannerUrl || '';
      const logoUrl = settings.logoUrl || '';

      // Create a sanitized settings object for instant client-side rendering
      const clientSettings = { 
        ...settings,
        isFirestoreQuotaExceeded: false 
      };
      delete clientSettings.razorpayKeySecret;
      delete clientSettings.cashfreeSecretKey;
      delete clientSettings.supabaseServiceRoleKey;
      delete clientSettings.oneSignalRestApiKey;
      delete clientSettings.oneSignalCode;
      delete clientSettings.googleSiteVerification;

      let title = settings.shareTitle && settings.shareTitle.trim() ? settings.shareTitle : brand;
      if (!settings.shareTitle && tagline) {
        title = `${brand} - ${tagline}`;
      }
      let description = settings.shareDesc && settings.shareDesc.trim() ? settings.shareDesc : tagline;
      let imageUrl = settings.shareImg && settings.shareImg.trim() ? settings.shareImg : (logoUrl || bannerUrl || 'https://crdmccidgzknnylyggbf.supabase.co/storage/v1/object/public/branding/app_logo_1783614864312.jpg');

      // Detect specific job preview
      let jobId = req.query.job_id;
      if (!jobId && url.startsWith('/job/')) {
        jobId = url.substring(5); // removes '/job/'
      }
      if (jobId) {
        const jobs = db.jobs || [];
        const foundJob = jobs.find((j: any) => String(j.id) === String(jobId));
        if (foundJob) {
          title = `${foundJob.title} at ${foundJob.companyName} | ${brand}`;
          description = foundJob.shortDescription || foundJob.fullDescription || description;
          if (foundJob.companyLogoUrl) {
            imageUrl = foundJob.companyLogoUrl;
          }
        }
      } 
      // Detect specific community post preview
      else if (req.query.post_id) {
        const postId = req.query.post_id;
        const posts = db.communityPosts || [];
        const foundPost = posts.find((p: any) => String(p.id) === String(postId));
        if (foundPost) {
          title = `Post by ${foundPost.userName || 'Member'} | ${brand}`;
          description = foundPost.caption || description;
          if (foundPost.imageUrl) {
            imageUrl = foundPost.imageUrl;
          } else if (foundPost.userAvatar) {
            imageUrl = foundPost.userAvatar;
          }
        }
      }

      // Build dynamic URL for metadata
      const host = req.get('host') || 'sebok.in';
      const protocol = req.protocol || 'https';
      const fullUrl = `${protocol}://${host}${req.originalUrl || '/'}`;

      // Escape values to safely put in HTML
      const escapedTitle = escapeHtml(title);
      const escapedDescription = escapeHtml(description);
      const escapedImage = escapeHtml(imageUrl);
      const escapedUrl = escapeHtml(fullUrl);

      // Meta tags block
      const faviconLink = settings.faviconUrl ? `<link rel="icon" href="${escapeHtml(settings.faviconUrl)}" />` : '';
      const metadataHtml = `
  <title>${escapedTitle}</title>
  ${faviconLink}
  <meta name="description" content="${escapedDescription}" />
  <meta property="og:title" content="${escapedTitle}" />
  <meta property="og:description" content="${escapedDescription}" />
  <meta property="og:image" content="${escapedImage}" />
  <meta property="og:url" content="${escapedUrl}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapedTitle}" />
  <meta name="twitter:description" content="${escapedDescription}" />
  <meta name="twitter:image" content="${escapedImage}" />
`;

      // Replace the default static title block with dynamic meta tags
      html = html.replace(/<title>.*?<\/title>/i, () => metadataHtml);

      // Pre-inject the settings into the window object so client-side React can load it instantly
      const initialSettingsScript = `<script>window.__INITIAL_SETTINGS__ = ${JSON.stringify(clientSettings)};</script>`;
      html = html.replace(/<head(\s[^>]*)?>/i, (match) => `${match}\n  ${initialSettingsScript}`);

      // Inject OneSignal Push Notification script if configured
      const oneSignalCode = settings.oneSignalCode;
      if (oneSignalCode && oneSignalCode.trim()) {
        html = html.replace(/<head(\s[^>]*)?>/i, (match) => `${match}\n  ${oneSignalCode.trim()}`);
      }

      const verificationCode = db.adminSettings?.googleSiteVerification;
      if (verificationCode) {
        let cleanCode = verificationCode.trim();
        let metaTag = '';
        if (cleanCode.startsWith('<')) {
          // It's already an HTML tag (like <meta name="..." content="..." />), inject it as-is
          metaTag = cleanCode;
        } else {
          // It's just the verification code (like abc123xyz), wrap it in a meta-tag
          if (cleanCode.includes('content=')) {
            const match = cleanCode.match(/content=["']([^"']+)["']/i);
            if (match && match[1]) {
              cleanCode = match[1];
            }
          }
          metaTag = `<meta name="google-site-verification" content="${cleanCode}" />`;
        }
        // Bulletproof case-insensitive insertion at the very top of <head> tag
        html = html.replace(/<head(\s[^>]*)?>/i, (match) => `${match}\n  ${metaTag}`);
      }

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (err) {
      console.error('Error rendering dynamic page HTML:', err);
      next(err);
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Disable serving index.html automatically for directories, so it hits our get('*') route
    app.use(express.static(distPath, { index: false }));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on http://localhost:${PORT}`);
  });
}

startServer();
