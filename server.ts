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
        content: '<h2>Contact Us</h2><p>Have questions or feedback? Reach out to our 24/7 support team at support@jobview.com or call us at +91 99999 99999.</p>',
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
app.get('/api/settings', (req, res) => {
  const db = readDB();
  res.json(db.adminSettings);
});

app.post('/api/settings', (req, res) => {
  const db = readDB();
  db.adminSettings = { ...db.adminSettings, ...req.body };
  writeDB(db);
  res.json({ success: true, settings: db.adminSettings });
});

// 2. Jobs endpoints
app.get('/api/jobs', (req, res) => {
  const db = readDB();
  res.json(db.jobs);
});

app.post('/api/jobs', (req, res) => {
  const db = readDB();
  const newJob = {
    id: 'job-' + Date.now(),
    createdAt: new Date().toISOString(),
    isLive: true,
    ...req.body
  };
  db.jobs.unshift(newJob);
  writeDB(db);
  res.json({ success: true, job: newJob });
});

app.put('/api/jobs/:id', (req, res) => {
  const db = readDB();
  const index = db.jobs.findIndex((j: any) => j.id === req.params.id);
  if (index !== -1) {
    db.jobs[index] = { ...db.jobs[index], ...req.body };
    writeDB(db);
    res.json({ success: true, job: db.jobs[index] });
  } else {
    res.status(404).json({ error: 'Job not found' });
  }
});

app.delete('/api/jobs/:id', (req, res) => {
  const db = readDB();
  const initialLen = db.jobs.length;
  const targetId = String(req.params.id).trim().toLowerCase();
  
  db.jobs = db.jobs.filter((j: any) => {
    if (!j || !j.id) return false;
    return String(j.id).trim().toLowerCase() !== targetId;
  });

  if (db.jobs.length < initialLen) {
    writeDB(db);
    res.json({ success: true });
  } else {
    // Fallback search to ensure if it already doesn't exist, we don't throw 404 unnecessarily, or we log it
    res.status(404).json({ error: 'Job not found in database' });
  }
});

// 3. Community posts endpoints
app.get('/api/posts', (req, res) => {
  const db = readDB();
  res.json(db.communityPosts);
});

app.post('/api/posts', (req, res) => {
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
  res.json({ success: true, post: newPost });
});

app.put('/api/posts/:id/approve', (req, res) => {
  const db = readDB();
  const post = db.communityPosts.find((p: any) => p.id === req.params.id);
  if (post) {
    post.status = 'Live';
    writeDB(db);
    res.json({ success: true, post });
  } else {
    res.status(404).json({ error: 'Post not found' });
  }
});

app.post('/api/posts/:id/bookmark', (req, res) => {
  const db = readDB();
  const post = db.communityPosts.find((p: any) => p.id === req.params.id);
  if (post) {
    post.bookmarksCount = (post.bookmarksCount || 0) + 1;
    writeDB(db);
    res.json({ success: true, bookmarksCount: post.bookmarksCount });
  } else {
    res.status(404).json({ error: 'Post not found' });
  }
});

app.post('/api/posts/:id/share', (req, res) => {
  const db = readDB();
  const post = db.communityPosts.find((p: any) => p.id === req.params.id);
  if (post) {
    post.sharesCount = (post.sharesCount || 0) + 1;
    writeDB(db);
    res.json({ success: true, sharesCount: post.sharesCount });
  } else {
    res.status(404).json({ error: 'Post not found' });
  }
});

app.delete('/api/posts/:id', (req, res) => {
  const db = readDB();
  const initialLen = db.communityPosts.length;
  db.communityPosts = db.communityPosts.filter((p: any) => p.id !== req.params.id);
  if (db.communityPosts.length < initialLen) {
    writeDB(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Post not found' });
  }
});

// 4. Users endpoints
app.get('/api/users', (req, res) => {
  const db = readDB();
  res.json(db.users);
});

// Update specific user profile details (Name, Avatar, Bio)
app.put('/api/users/:id', (req, res) => {
  const { name, avatar, bio } = req.body;
  const db = readDB();
  const index = db.users.findIndex((u: any) => u.id === req.params.id);
  if (index !== -1) {
    if (name !== undefined) db.users[index].name = name;
    if (avatar !== undefined) db.users[index].avatar = avatar;
    if (bio !== undefined) db.users[index].bio = bio;
    writeDB(db);
    res.json({ success: true, user: db.users[index] });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// 5. Custom Footer Pages endpoints
app.get('/api/pages', (req, res) => {
  const db = readDB();
  const pages = (db.pages || []).map((p: any) => {
    const visibility = p.isVisibleInFooter !== undefined ? p.isVisibleInFooter : (p.showInFooter !== undefined ? p.showInFooter : true);
    return {
      ...p,
      isVisibleInFooter: visibility,
      showInFooter: visibility
    };
  });
  res.json(pages);
});

app.post('/api/pages', (req, res) => {
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
  res.json({ success: true, page });
});

app.put('/api/pages/:id', (req, res) => {
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
    res.json({ success: true, page: db.pages[index] });
  } else {
    res.status(404).json({ error: 'Page not found' });
  }
});

app.delete('/api/pages/:id', (req, res) => {
  const db = readDB();
  if (!db.pages) db.pages = [];
  const pageIndex = db.pages.findIndex((p: any) => p.id === req.params.id);
  if (pageIndex !== -1) {
    if (db.pages[pageIndex].isSystem) {
      return res.status(400).json({ error: 'Cannot delete system pages' });
    }
    db.pages.splice(pageIndex, 1);
    writeDB(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Page not found' });
  }
});

// Lazy-initialize Supabase on the server
let serverSupabaseClient: any = null;
function getServerSupabase() {
  if (!serverSupabaseClient) {
    const url = process.env.VITE_SUPABASE_URL || 'https://crdmccidgzknnylyggbf.supabase.co';
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZG1jY2lkZ3prbm55bHlnZ2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NDg1NjAsImV4cCI6MjA5ODAyNDU2MH0.gPwgKSe-0lSFZf4holpBctmYSGrTYsv5cwpKcgLODBs';
    if (!url || !anonKey) {
      throw new Error('Supabase configuration missing (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required)');
    }
    serverSupabaseClient = createClient(url, anonKey);
  }
  return serverSupabaseClient;
}

let adminSupabaseClient: any = null;
function getAdminSupabase() {
  if (!adminSupabaseClient) {
    const url = process.env.VITE_SUPABASE_URL || 'https://crdmccidgzknnylyggbf.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
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
app.post('/api/users/sync', (req, res) => {
  const { name, email, avatar } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required to sync user' });
  }

  const db = readDB();
  let user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    // Create new user with 30 days trial
    const now = new Date();
    const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    // Check if designated admin email, auto-make Active
    const isAdmin = email.toLowerCase() === 'kokborokanimations@gmail.com';

    user = {
      id: 'user-' + Date.now(),
      name: name || email.split('@')[0],
      email: email.toLowerCase(),
      avatar: avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email)}`,
      joinDate: now.toISOString(),
      created_at: now.toISOString(),
      trialExpiryDate: expiry.toISOString(),
      subscriptionStatus: isAdmin ? 'Active' : 'Free Trial'
    };

    db.users.push(user);
    writeDB(db);
  } else {
    // Check trial expiration unless Active (already subscribed)
    if (user.subscriptionStatus === 'Free Trial') {
      const now = new Date();
      const expiry = new Date(user.trialExpiryDate);
      if (now > expiry) {
        user.subscriptionStatus = 'Expired';
        writeDB(db);
      }
    }
  }

  res.json(user);
});

// Override subscription
app.put('/api/users/:id/subscription', (req, res) => {
  const { subscriptionStatus, trialExpiryDate } = req.body;
  const db = readDB();
  const index = db.users.findIndex((u: any) => u.id === req.params.id);
  if (index !== -1) {
    if (subscriptionStatus) {
      db.users[index].subscriptionStatus = subscriptionStatus;
    }
    if (trialExpiryDate) {
      db.users[index].trialExpiryDate = trialExpiryDate;
    }
    writeDB(db);
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
app.post('/api/payments/verify', (req, res) => {
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

  // If success, activate user's subscription
  if (status === 'SUCCESS') {
    const userIndex = db.users.findIndex((u: any) => u.email.toLowerCase() === userEmail.toLowerCase() || u.id === userId);
    if (userIndex !== -1) {
      db.users[userIndex].subscriptionStatus = 'Active';
    }
  }

  writeDB(db);
  res.json({ success: true, log: newLog });
});

// Get payment logs
app.get('/api/payments/logs', (req, res) => {
  const db = readDB();
  res.json(db.paymentLogs);
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
