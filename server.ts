/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'db.json');

app.use(express.json({ limit: '10mb' }));

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
      brandName: 'Jobview',
      tagline: 'Your Premium Portal to Verified Careers & Networking',
      logoUrl: '',
      bannerUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop',
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
      cashfreeAppId: '',
      cashfreeSecretKey: '',
      postApprovalMode: true // Manual post approval mode (ON) by default
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
        companyName: 'Razorpay',
        companyLogoIndex: 2,
        title: 'Full-Stack Developer (Express & Node)',
        location: 'Mumbai, Maharashtra',
        shortDescription: 'Power scalable digital payments for millions of merchants. Excel in Node.js, Express, and React.',
        fullDescription: 'Join our payments platform squad to build robust, secure, and lightning-fast payment routing systems. You will build user-facing billing dashboards, integrate third-party APIs, and maintain high-throughput backend services that power digital transactions.',
        qualifications: 'Strong grasp of Node.js, relational databases, API gateway security, webhook handlers, and modern web applications.',
        salary: '₹15,0,000 - ₹20,0,000 / year',
        isLive: true,
        applyLink: 'https://razorpay.com/jobs',
        email: 'tech-recruiting@razorpay.com',
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
        caption: 'Just landed my dream job as a Frontend dev at a cool startup! Thanks to Jobview for the active HR WhatsApp links, literally scheduled my interview in 5 minutes! 🚀🔥',
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
        content: '<h2>About Us</h2><p>Welcome to Jobview, the ultimate platform for premium job discovery and professional community building. We connect qualified talents directly with verified employers through modern channels like WhatsApp and direct calls.</p>',
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
        content: '<h2>Terms of Use</h2><p>By using Jobview, you agree to respect community guidelines. Spamming recruiter channels, abusing free trials, or publishing malicious comments will result in instant account termination.</p>',
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
    isSystem: p.is_system !== undefined ? p.is_system : (p.isSystem !== undefined ? p.isSystem : false)
  };
}

function mapPageToSupabase(p: any) {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    content: p.content,
    show_in_footer: p.showInFooter !== undefined ? p.showInFooter : p.isVisibleInFooter,
    is_system: p.isSystem
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

function mapSettingsFromSupabase(s: any) {
  let paywallFeatures = [];
  if (s.paywall_features) {
    try {
      paywallFeatures = JSON.parse(s.paywall_features);
    } catch (e) {
      paywallFeatures = String(s.paywall_features).split('\n').filter(Boolean);
    }
  }
  return {
    brandName: s.brand_name || s.brandName || 'Jobview',
    tagline: s.tagline || 'Your Premium Portal to Verified Careers & Networking',
    logoUrl: s.logo_url || s.logoUrl || '',
    bannerUrl: s.banner_url || s.bannerUrl || '',
    bannerHtml: s.banner_html || s.bannerHtml || '',
    premiumMode: s.premium_mode !== undefined ? s.premium_mode : (s.premiumMode !== undefined ? s.premiumMode : true),
    membershipPrice: s.membership_price !== undefined ? s.membership_price : (s.membershipPrice || 499),
    currency: s.currency || 'INR',
    paywallFeatures: paywallFeatures,
    paywallTitle: s.paywall_title || s.paywallTitle || 'Activate Premium',
    paywallSubtitle: s.paywall_subtitle || s.paywallSubtitle || 'Unlock Premium access to continue searching & applying.',
    paywallButtonText: s.paywall_button_text || s.paywallButtonText || 'Activate Membership Now',
    paywallPriceDescription: s.paywall_price_description || s.paywallPriceDescription || 'One-time manual purchase. Extend anytime.',
    paywallFooterText: s.paywall_footer_text || s.paywallFooterText || 'Secured & processed under Cashfree SDK Gateway. This is a one-time manual charge. No automatic renewals or recurring billing cycles.',
    paywallExtendTitle: s.paywall_extend_title || s.paywallExtendTitle || 'Extend Premium',
    paywallExtendSubtitle: s.paywall_extend_subtitle || s.paywallExtendSubtitle || 'Extend your manual premium access for another month.',
    paywallExtendButtonText: s.paywall_extend_button_text || s.paywallExtendButtonText || 'Extend Membership Now',
    cashfreeAppId: s.cashfree_app_id || s.cashfreeAppId || '',
    cashfreeSecretKey: s.cashfree_secret_key || s.cashfreeSecretKey || '',
    postApprovalMode: s.post_approval_mode !== undefined ? s.post_approval_mode : (s.postApprovalMode !== undefined ? s.postApprovalMode : true),
    supabaseUrl: s.supabase_url || s.supabaseUrl || '',
    supabaseAnonKey: s.supabase_anon_key || s.supabaseAnonKey || '',
    supabaseServiceRoleKey: s.supabase_service_role_key || s.supabaseServiceRoleKey || ''
  };
}

function mapSettingsToSupabase(s: any) {
  return {
    id: 'global_settings',
    brand_name: s.brandName,
    tagline: s.tagline,
    logo_url: s.logoUrl,
    banner_url: s.bannerUrl,
    banner_html: s.bannerHtml,
    premium_mode: s.premiumMode,
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
    cashfree_app_id: s.cashfreeAppId,
    cashfree_secret_key: s.cashfreeSecretKey,
    post_approval_mode: s.postApprovalMode,
    supabase_url: s.supabaseUrl,
    supabase_anon_key: s.supabaseAnonKey,
    supabase_service_role_key: s.supabaseServiceRoleKey
  };
}

// Serve uploaded media statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Media Upload endpoint
app.post('/api/upload', (req, res) => {
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
    const fileName = `${cleanName}_${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, fileName);
    
    fs.writeFileSync(filePath, buffer);
    
    const fileUrl = `/uploads/${fileName}`;
    res.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// REST endpoints
// 1. Admin settings
app.get('/api/settings', async (req, res) => {
  const db = readDB();
  try {
    const supabase = getServerSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('id', 'global_settings')
        .maybeSingle();
      
      if (!error && data) {
        const mappedSettings = mapSettingsFromSupabase(data);
        db.adminSettings = { ...db.adminSettings, ...mappedSettings };
        writeDB(db);
        return res.json(db.adminSettings);
      }
    }
  } catch (err: any) {
    console.log('[Supabase Info] Serving settings from local JSON store. Details:', err.message || String(err));
  }
  res.json(db.adminSettings);
});

app.post('/api/settings', async (req, res) => {
  const db = readDB();
  db.adminSettings = { ...db.adminSettings, ...req.body };
  writeDB(db);

  try {
    const supabase = getServerSupabase();
    if (supabase) {
      const dbRow = mapSettingsToSupabase(db.adminSettings);
      const { error } = await supabase
        .from('admin_settings')
        .upsert(dbRow);
      if (error) {
        console.log('[Supabase Info] Local settings updated, but Supabase upsert skipped:', error.message);
      }
    }
  } catch (err: any) {
    console.log('[Supabase Info] Local settings updated, but Supabase upsert skipped. Details:', err.message || String(err));
  }

  res.json({ success: true, settings: db.adminSettings });
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
        const mappedJobs = data.map((job: any) => ({
          id: job.id,
          title: job.title,
          companyName: job.company_name || job.companyName,
          companyLogoUrl: job.company_logo_url || job.companyLogoUrl || '',
          location: job.location,
          salary: job.salary,
          shortDescription: job.short_description || job.shortDescription || job.description,
          fullDescription: job.full_description || job.fullDescription || job.description,
          applyLink: job.apply_link || job.applyLink,
          datePosted: job.date_posted || job.datePosted,
          isLive: job.is_live !== undefined ? job.is_live : (job.isLive !== undefined ? job.isLive : true),
          createdAt: job.created_at || job.createdAt || new Date().toISOString(),
          category: job.category,
          experience: job.experience,
          contractType: job.contract_type || job.contractType,
        }));

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

  try {
    const supabase = getServerSupabase();
    if (supabase) {
      // Map only the columns supported by the user's Supabase jobs table
      const { error } = await supabase.from('jobs').insert([{
        job_id: newJob.id,
        title: newJob.title,
        company_name: newJob.companyName,
        location: newJob.location,
        description: newJob.fullDescription || newJob.shortDescription,
        apply_link: newJob.applyLink,
        company_logo_url: newJob.companyLogoUrl,
        date_posted: newJob.createdAt,
        status: newJob.isLive ? 'Live' : 'Inactive'
      }]);
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
        // Map only the columns supported by the user's Supabase jobs table
        const { error } = await supabase
          .from('jobs')
          .update({
            title: req.body.title,
            company_name: req.body.companyName,
            location: req.body.location,
            description: req.body.fullDescription || req.body.shortDescription,
            apply_link: req.body.applyLink,
            company_logo_url: req.body.companyLogoUrl,
            status: req.body.isLive ? 'Live' : 'Inactive'
          })
          .eq('job_id', req.params.id);
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
          .eq('job_id', req.params.id);
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
  const db = readDB();
  const localPosts = db.communityPosts || [];

  try {
    const supabase = getServerSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        const mappedPosts = data.map(mapPostFromSupabase);

        // Merge localPosts and mappedPosts by ID to prevent loss
        const mergedMap = new Map();
        mappedPosts.forEach((post: any) => mergedMap.set(post.id, post));
        localPosts.forEach((post: any) => mergedMap.set(post.id, post));

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
        
        return res.json(mergedPages.map((p: any) => {
          const visibility = p.isVisibleInFooter !== undefined ? p.isVisibleInFooter : (p.showInFooter !== undefined ? p.showInFooter : true);
          return {
            ...p,
            isVisibleInFooter: visibility,
            showInFooter: visibility
          };
        }));
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
      showInFooter: visibility
    };
  });
  res.json(pages);
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
          <div style="background-color: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: center; max-width: 400px;">
            <h1 style="color: #ef4444; margin-top: 0;">Authentication Error</h1>
            <p>No authorization code was returned from the sign-in provider.</p>
            <button onclick="window.close()" style="margin-top: 1rem; background-color: #ef4444; color: white; border: none; padding: 0.5rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: bold;">Close Window</button>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_FAILURE', error: 'No auth code found' }, '*');
              setTimeout(() => window.close(), 3000);
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

// 5. Payments (Cashfree Order & Verification)
app.post('/api/payments/create-order', async (req, res) => {
  const { userId, userEmail, amount, phone } = req.body;
  const db = readDB();
  const settings = db.adminSettings;

  const orderId = 'order_' + Date.now();

  // If Cashfree secrets are missing, we simulate
  if (!settings.cashfreeAppId || !settings.cashfreeSecretKey) {
    return res.json({
      isMock: true,
      order_id: orderId,
      order_amount: amount || settings.membershipPrice || 499,
      order_currency: settings.currency || 'INR',
      payment_session_id: 'session_mock_' + Math.random().toString(36).substr(2, 9),
      message: 'Cashfree Gateway is in Mock/Simulator Mode. Click Continue to proceed.'
    });
  }

  // Attempt real Cashfree Order Creation API (PostgreSQL / Cashfree backend integration)
  try {
    const isProd = !settings.cashfreeAppId.toLowerCase().includes('test');
    const cashfreeUrl = isProd 
      ? 'https://api.cashfree.com/pg/orders' 
      : 'https://sandbox.cashfree.com/pg/orders';

    const response = await fetch(cashfreeUrl, {
      method: 'POST',
      headers: {
        'x-client-id': settings.cashfreeAppId,
        'x-client-secret': settings.cashfreeSecretKey,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: Number(amount || settings.membershipPrice || 499).toFixed(2),
        order_currency: settings.currency || 'INR',
        customer_details: {
          customer_id: userId || 'cust_anonymous',
          customer_email: userEmail || 'guest@example.com',
          customer_phone: phone || '9999999999'
        },
        order_meta: {
          // Point back to app preview URL if available, otherwise localhost
          return_url: `${process.env.APP_URL || 'http://localhost:3000'}/?payment_status=verify&order_id=${orderId}`
        }
      })
    });

    const result = await response.json();
    if (response.ok && result.payment_session_id) {
      res.json({
        isMock: false,
        order_id: result.order_id,
        order_amount: result.order_amount,
        order_currency: result.order_currency,
        payment_session_id: result.payment_session_id
      });
    } else {
      console.error('Cashfree API failure:', result);
      // Fallback to beautiful simulator gracefully instead of crashing
      res.json({
        isMock: true,
        order_id: orderId,
        order_amount: amount || settings.membershipPrice || 499,
        order_currency: settings.currency || 'INR',
        payment_session_id: 'session_mock_' + Math.random().toString(36).substr(2, 9),
        warning: 'Cashfree API returned an error, running in Mock Simulator Mode.',
        errorDetail: result.message || 'Check Cashfree Keys configuration.'
      });
    }
  } catch (err: any) {
    console.error('Cashfree connection error:', err);
    res.json({
      isMock: true,
      order_id: orderId,
      order_amount: amount || settings.membershipPrice || 499,
      order_currency: settings.currency || 'INR',
      payment_session_id: 'session_mock_err_' + Math.random().toString(36).substr(2, 9),
      warning: 'Cashfree connection failed, fell back to Mock Simulator Mode.'
    });
  }
});

// Verify payment / callback webhook
app.post('/api/payments/verify', async (req, res) => {
  const { orderId, status, userId, userEmail, amount, txId } = req.body;
  const db = readDB();

  // Create payment log
  const newLog = {
    id: txId || 'tx_' + Date.now(),
    userId: userId || 'unknown_user',
    userEmail: userEmail || 'unknown@example.com',
    amount: amount || db.adminSettings.membershipPrice || 499,
    status: status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
    txId: txId || 'CF_TX_' + Math.floor(Math.random() * 100000000),
    createdAt: new Date().toISOString()
  };

  db.paymentLogs.unshift(newLog);

  let updatedUserObj: any = null;

  // If success, activate user's subscription
  if (status === 'SUCCESS') {
    const userIndex = db.users.findIndex((u: any) => u.email.toLowerCase() === userEmail.toLowerCase() || u.id === userId);
    if (userIndex !== -1) {
      db.users[userIndex].subscriptionStatus = 'Active';
      // Calculate 30 days from current timestamp
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
      // 1. Sync payment log
      await supabase.from('payment_logs').insert([mapPaymentLogToSupabase(newLog)]);
      // 2. Sync user profile with active status if updated
      if (updatedUserObj) {
        await supabase.from('users').upsert(mapUserToSupabase(updatedUserObj));
      }
    }
  } catch (err: any) {
    console.log('[Supabase Info] Local payment verified successfully, but Supabase sync was skipped:', err.message || String(err));
  }

  res.json({ success: true, log: newLog });
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

// Vite Setup for Development and static handling in Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on http://localhost:${PORT}`);
  });
}

startServer();
