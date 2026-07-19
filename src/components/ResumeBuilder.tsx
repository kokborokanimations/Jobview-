/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, AdminSettings } from '../types';
import { 
  Sparkles, Plus, Trash2, Printer, RefreshCw, Eye, Edit3, 
  Copy, Check, FileText, Download, Briefcase, GraduationCap, 
  Terminal, ShieldAlert, Award, FileUp, ListRestart, HelpCircle,
  ZoomIn, ZoomOut, Phone, Mail, Globe, MapPin, Save, FolderOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ResumeBuilderProps {
  user: User | null;
  settings: AdminSettings;
  onLoginTrigger?: () => void;
}

interface SavedResume {
  id: string;
  name: string;
  timestamp: string;
  data: ResumeData;
  template: TemplateType;
}

interface ResumeData {
  title: string;
  personal: {
    fullName: string;
    title: string;
    email: string;
    phone: string;
    website: string;
    location: string;
    summary: string;
    photo?: string;
    fatherName?: string;
    gender?: string;
    dob?: string;
    maritalStatus?: string;
    religion?: string;
    nationality?: string;
    languagesKnown?: string;
    teachingSkills?: string;
    computerKnowledge?: string;
    address?: string;
    declaration?: string;
    place?: string;
    date?: string;
    signature?: string;
  };
  experience: {
    id: string;
    company: string;
    position: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }[];
  education: {
    id: string;
    school: string;
    degree: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }[];
  skills: string;
  languages?: string;
  references?: {
    id: string;
    name: string;
    position: string;
    phone: string;
    email: string;
  }[];
  projects: {
    id: string;
    name: string;
    description: string;
    technologies: string;
    link: string;
  }[];
}

const DEFAULT_RESUME_DATA: ResumeData = {
  title: 'My Professional Resume',
  personal: {
    fullName: 'Donna Stroupe',
    title: 'Sales Representative',
    email: 'hello@reallygreatsite.com',
    phone: '+123-456-7890',
    website: 'https://reallygreatsite.com',
    location: '123 Anywhere St., Any City, ST 12345',
    summary: 'I am a Sales Representative, a professional who initializes and manages relationships with customers. They serve as their point of contact and lead from initial outreach through the making of the final purchase by them or someone in their household.',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400'
  },
  experience: [
    {
      id: 'exp-1',
      company: 'Timmerman Industries',
      position: 'Consumer Goods Seller',
      location: 'Any City, ST',
      startDate: '2029-08',
      endDate: 'Present',
      current: true,
      description: '• Offer consumer goods packages to corporate and retail clients\n• Meet with clients every quarter to update or renew services\n• Train junior sales agents in strategic account management'
    },
    {
      id: 'exp-2',
      company: 'Timmerman Industries',
      position: 'FMCG Sales Agent',
      location: 'Any City, ST',
      startDate: '2026-07',
      endDate: '2029-08',
      current: false,
      description: '• Visited corporate client offices to offer latest consumer products\n• Built relationships with clients to maintain sales goals and create new opportunities'
    },
    {
      id: 'exp-3',
      company: 'Timmerman Industries',
      position: 'Sales Agent',
      location: 'Any City, ST',
      startDate: '2023-08',
      endDate: '2026-07',
      current: false,
      description: '• Visited corporate client offices to offer latest consumer products'
    }
  ],
  education: [
    {
      id: 'edu-1',
      school: 'Wardiere University',
      degree: 'BA Sales and Commerce',
      location: 'Any City, ST',
      startDate: '2019',
      endDate: '2023',
      current: false,
      description: 'Graduated with honors. Active member of Commerce & Economics Union.'
    },
    {
      id: 'edu-2',
      school: 'Wardiere University',
      degree: 'BA Sales and Commerce',
      location: 'Any City, ST',
      startDate: '2015',
      endDate: '2019',
      current: false,
      description: 'Graduated with top marks. Specialized in business administration.'
    }
  ],
  skills: 'Fast-moving Consumer Goods, Packaged Consumer Goods Sales, Corporate sales account management, Experience in retail sales, Relationship building, Strategic communication',
  languages: 'English (Fluent), Spanish (Conversational), French (Basic)',
  references: [
    {
      id: 'ref-1',
      name: 'Estelle Darcy',
      position: 'Wardiere Inc. / CEO',
      phone: '+123-456-7890',
      email: 'hello@reallygreatsite.com'
    },
    {
      id: 'ref-2',
      name: 'Harper Russo',
      position: 'Wardiere Inc. / CEO',
      phone: '+123-456-7890',
      email: 'hello@reallygreatsite.com'
    }
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'Corporate Sales Campaign',
      description: 'Led a regional outreach initiative that signed 15+ new enterprise accounts within 6 months, exceeding standard performance targets.',
      technologies: 'Sales CRM, Lead Generation',
      link: 'https://reallygreatsite.com'
    }
  ]
};

type TemplateType = 'donna-elegant' | 'lorna-minimalist' | 'olivia-modern' | 'indian-biodata' | 'classic-blue-biodata';

// Persistent cache for converted oklch stylesheets to prevent freezing during multiple PDF downloads
const patchedStylesCache = new Map<HTMLStyleElement, string>();

interface InlineEditProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  children?: React.ReactNode;
}

function InlineEdit({
  value,
  onChange,
  placeholder = '',
  className = '',
  multiline = false,
  children
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) {
      setTempValue(value);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          if (!multiline && inputRef.current instanceof HTMLInputElement) {
            inputRef.current.select();
          }
        }
      }, 30);
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    onChange(tempValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      setIsEditing(false);
      onChange(tempValue);
    }
    if (e.key === 'Escape') {
      setTempValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`w-full bg-amber-50/70 text-slate-950 border border-amber-400 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans text-[11px] font-normal leading-normal`}
          placeholder={placeholder}
          rows={3}
        />
      );
    }
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full bg-amber-50/70 text-slate-950 border border-amber-400 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans text-[11px] font-normal leading-normal`}
        placeholder={placeholder}
      />
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-amber-100/50 hover:ring-1 hover:ring-amber-400/50 rounded px-1 py-0.5 transition-all inline-block group relative ${className}`}
      title="Click to edit directly"
    >
      {children ? children : (value || <span className="text-slate-400 italic font-normal">{placeholder || 'Click to enter...'}</span>)}
      {/* Small Edit icon badge on hover */}
      <span className="absolute -top-3 -right-3 bg-amber-600 text-white rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 hidden sm:inline-flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
        </svg>
      </span>
    </span>
  );
}

export default function ResumeBuilder({ user, settings, onLoginTrigger }: ResumeBuilderProps) {
  // Persistence key
  const storageKey = user ? `sebok_resume_${user.id}` : 'sebok_resume_guest';

  // Load Initial state
  const [resume, setResume] = useState<ResumeData>(() => {
    const saved = localStorage.getItem(storageKey) || localStorage.getItem(user ? `jobview_resume_${user.id}` : 'jobview_resume_guest');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved resume', e);
      }
    }
    // Pre-fill user details if guest or empty
    const data = { ...DEFAULT_RESUME_DATA };
    if (user) {
      data.personal.fullName = user.name || data.personal.fullName;
      data.personal.email = user.email || data.personal.email;
    }
    return data;
  });

  const [activeTemplate, setActiveTemplate] = useState<TemplateType>('indian-biodata');
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [activeMode, setActiveMode] = useState<'edit' | 'preview'>('edit'); // Mode toggle for mobile
  const [copied, setCopied] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  
  // Multiple draft persistence states
  const savedListStorageKey = user ? `sebok_saved_resumes_${user.id}` : 'sebok_saved_resumes_guest';
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>(() => {
    const saved = localStorage.getItem(savedListStorageKey) || localStorage.getItem(user ? `jobview_saved_resumes_${user.id}` : 'jobview_saved_resumes_guest');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [saveTitle, setSaveTitle] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSavedList, setShowSavedList] = useState(false);
  const [showPdfGuideModal, setShowPdfGuideModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Sync saved resumes list with localStorage
  useEffect(() => {
    localStorage.setItem(savedListStorageKey, JSON.stringify(savedResumes));
  }, [savedResumes, savedListStorageKey]);

  // Load saved resumes from the full-stack API (which synchronizes with Supabase)
  useEffect(() => {
    const userId = user ? user.id : 'guest';
    fetch(`/api/resumes?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.resumes && data.resumes.length > 0) {
          const formatted: SavedResume[] = data.resumes.map((row: any) => ({
            id: row.id,
            name: row.name,
            timestamp: row.timestamp || new Date(row.updated_at || row.created_at || Date.now()).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }),
            data: row.data,
            template: row.template || 'indian-biodata'
          }));
          setSavedResumes(formatted);
        } else {
          // fallback to localStorage if API has nothing
          const saved = localStorage.getItem(savedListStorageKey);
          setSavedResumes(saved ? JSON.parse(saved) : []);
        }
      })
      .catch(err => {
        console.warn('Failed to load resumes from API, falling back to localStorage:', err);
        const saved = localStorage.getItem(savedListStorageKey);
        setSavedResumes(saved ? JSON.parse(saved) : []);
      });
  }, [user, savedListStorageKey]);

  // Generate a valid UUID for database compatibility (avoiding invalid uuid syntax errors in Postgres)
  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      try {
        return crypto.randomUUID();
      } catch (e) {
        // fallback
      }
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Handle explicit saving of current resume state
  const handleSaveResume = async (titleToSave: string) => {
    const cleanTitle = titleToSave.trim() || resume.personal.fullName || 'My Resume Draft';
    const newSave: SavedResume = {
      id: generateUUID(),
      name: cleanTitle,
      timestamp: new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      data: JSON.parse(JSON.stringify(resume)), // Deep copy
      template: activeTemplate
    };

    setSavedResumes(prev => [newSave, ...prev]);
    setShowSaveModal(false);
    setSaveTitle('');
    
    // Save to server-side Express API (which handles local db.json and Supabase sync)
    try {
      const response = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newSave.id,
          userId: user ? user.id : 'guest',
          name: newSave.name,
          timestamp: newSave.timestamp,
          data: newSave.data,
          template: newSave.template
        })
      });
      if (!response.ok) {
        console.warn('Could not save resume draft via express server API');
      }
    } catch (err) {
      console.warn('API save error:', err);
    }

    if (window.showSuccessToast) {
      window.showSuccessToast(`"${cleanTitle}" saved to your drafts!`);
    } else {
      alert(`"${cleanTitle}" saved successfully!`);
    }
  };

  const handleLoadResume = (saved: SavedResume) => {
    setResume(saved.data);
    setActiveTemplate(saved.template);
    setShowSavedList(false);
    if (window.showSuccessToast) {
      window.showSuccessToast(`Loaded "${saved.name}"`);
    }
  };

  const handlePerformDelete = async (id: string, name: string) => {
    setSavedResumes(prev => prev.filter(item => item.id !== id));
    setDeleteConfirmId(null);
    
    // Delete from server-side Express API
    try {
      const response = await fetch(`/api/resumes/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        console.warn('Could not delete resume draft via express server API');
      }
    } catch (err) {
      console.warn('API delete error:', err);
    }

    if (window.showSuccessToast) {
      window.showSuccessToast(`Deleted "${name}"`);
    }
  };
  
  // AI enhancement states
  const [aiLoading, setAiLoading] = useState<string | null>(null); // section id or "summary", etc.
  const [aiError, setAiError] = useState<string | null>(null);

  // Sync with localStorage on change
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(resume));
  }, [resume, storageKey]);

  // Sync personal details when user logs in
  useEffect(() => {
    if (user) {
      setResume(prev => ({
        ...prev,
        personal: {
          ...prev.personal,
          fullName: prev.personal.fullName === DEFAULT_RESUME_DATA.personal.fullName ? user.name : prev.personal.fullName,
          email: prev.personal.email === DEFAULT_RESUME_DATA.personal.email ? user.email : prev.personal.email,
        }
      }));
    }
  }, [user]);

  // Handle Input Changes
  const handlePersonalChange = (key: keyof ResumeData['personal'], value: string) => {
    setResume(prev => ({
      ...prev,
      personal: {
        ...prev.personal,
        [key]: value
      }
    }));
  };

  // Work Experience Operations
  const handleExperienceChange = (id: string, key: string, value: any) => {
    setResume(prev => ({
      ...prev,
      experience: prev.experience.map(exp => {
        if (exp.id === id) {
          const updated = { ...exp, [key]: value };
          if (key === 'current' && value === true) {
            updated.endDate = 'Present';
          }
          return updated;
        }
        return exp;
      })
    }));
  };

  const addExperience = () => {
    const newExp = {
      id: `exp-${Date.now()}`,
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    };
    setResume(prev => ({
      ...prev,
      experience: [...prev.experience, newExp]
    }));
  };

  const deleteExperience = (id: string) => {
    setResume(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }));
  };

  // Education Operations
  const handleEducationChange = (id: string, key: string, value: any) => {
    setResume(prev => ({
      ...prev,
      education: prev.education.map(edu => {
        if (edu.id === id) {
          const updated = { ...edu, [key]: value };
          if (key === 'current' && value === true) {
            updated.endDate = 'Present';
          }
          return updated;
        }
        return edu;
      })
    }));
  };

  const addEducation = () => {
    const newEdu = {
      id: `edu-${Date.now()}`,
      school: '',
      degree: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    };
    setResume(prev => ({
      ...prev,
      education: [...prev.education, newEdu]
    }));
  };

  const deleteEducation = (id: string) => {
    setResume(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  // Projects Operations
  const handleProjectChange = (id: string, key: string, value: string) => {
    setResume(prev => ({
      ...prev,
      projects: prev.projects.map(proj => proj.id === id ? { ...proj, [key]: value } : proj)
    }));
  };

  const addProject = () => {
    const newProj = {
      id: `proj-${Date.now()}`,
      name: '',
      description: '',
      technologies: '',
      link: ''
    };
    setResume(prev => ({
      ...prev,
      projects: [...prev.projects, newProj]
    }));
  };

  const deleteProject = (id: string) => {
    setResume(prev => ({
      ...prev,
      projects: prev.projects.filter(proj => proj.id !== id)
    }));
  };

  // References Operations
  const handleReferenceChange = (id: string, key: string, value: string) => {
    setResume(prev => ({
      ...prev,
      references: (prev.references || []).map(ref => ref.id === id ? { ...ref, [key]: value } : ref)
    }));
  };

  const addReference = () => {
    const newRef = {
      id: `ref-${Date.now()}`,
      name: '',
      position: '',
      phone: '',
      email: ''
    };
    setResume(prev => ({
      ...prev,
      references: [...(prev.references || []), newRef]
    }));
  };

  const deleteReference = (id: string) => {
    setResume(prev => ({
      ...prev,
      references: (prev.references || []).filter(ref => ref.id !== id)
    }));
  };

  // Reset to default sample resume
  const handleReset = () => {
    if (confirm('Are you sure you want to reset your resume data to the sample draft? Any custom edits will be lost.')) {
      const data = { ...DEFAULT_RESUME_DATA };
      if (user) {
        data.personal.fullName = user.name;
        data.personal.email = user.email;
      }
      setResume(data);
    }
  };

  // Clear all fields
  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all resume fields to start completely fresh?')) {
      setResume({
        title: 'New Resume',
        personal: {
          fullName: '',
          title: '',
          email: '',
          phone: '',
          website: '',
          location: '',
          summary: '',
          photo: ''
        },
        experience: [],
        education: [],
        skills: '',
        languages: '',
        references: [],
        projects: []
      });
    }
  };

  // Copy Plain Text version
  const copyPlainText = () => {
    const text = `
${resume.personal.fullName.toUpperCase()}
${resume.personal.title}
Email: ${resume.personal.email} | Phone: ${resume.personal.phone}
Website: ${resume.personal.website} | Location: ${resume.personal.location}

PROFESSIONAL SUMMARY
${resume.personal.summary}

WORK EXPERIENCE
${resume.experience.map(exp => `
- ${exp.position} at ${exp.company} (${exp.location})
  ${exp.startDate} - ${exp.endDate}
  ${exp.description}
`).join('\n')}

EDUCATION
${resume.education.map(edu => `
- ${edu.degree}
  ${edu.school} | ${edu.startDate} - ${edu.endDate}
  ${edu.description}
`).join('\n')}

TECHNICAL SKILLS
${resume.skills}

LANGUAGES
${resume.languages || ''}

PROJECTS
${resume.projects.map(proj => `
- ${proj.name} (${proj.technologies})
  ${proj.description}
  Link: ${proj.link}
`).join('\n')}

REFERENCES
${(resume.references || []).map(ref => `
- ${ref.name} (${ref.position})
  Phone: ${ref.phone} | Email: ${ref.email}
`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Direct Browser Printing (Formatted to A4 sheet)
  const triggerPrint = () => {
    const originalTitle = document.title;
    const userName = resume.personal.fullName || 'Resume';
    // Format name cleanly, replacing spaces with underscores and keeping only safe characters
    const cleanName = userName.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
    document.title = `${cleanName}_Resume`;
    
    window.print();
    
    // Restore original title after print dialog closes
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  // Client-side PDF downloader using html2pdf.js loaded dynamically
  const downloadPDF = () => {
    const element = document.getElementById('resume-print-area');
    if (!element) return;

    setPdfDownloading(true);

    const generate = async (html2pdfLib: any) => {
      // Temporarily remove zoom scale for perfect rendering ratio
      const previousZoom = zoomScale;
      setZoomScale(100);

      // Temporarily override resume-print-area properties to match exact standard A4 layout dimensions
      // Maintain the exact 32px (p-8) padding to prevent dimension shift and guarantee screen-to-PDF layout match
      element.style.setProperty('padding', '32px', 'important');
      element.style.setProperty('width', '794px', 'important');
      element.style.setProperty('max-width', '794px', 'important');

      // Arrays to store original style states for perfect restoration
      const restoredStyles: { element: HTMLElement; originalContent?: string; href?: string }[] = [];
      const originalInlineStyles = new Map<Element, string>();

      // Temporarily disable all transition animations to prevent layout-thrashing and freezing during PDF rendering
      const disableTransitionsStyle = document.createElement('style');
      disableTransitionsStyle.id = 'temp-disable-transitions';
      disableTransitionsStyle.innerHTML = `
        * {
          transition: none !important;
          transition-duration: 0s !important;
          animation: none !important;
          animation-duration: 0s !important;
        }
      `;
      document.head.appendChild(disableTransitionsStyle);

      try {
        // 1. Convert all inline <style> tags containing oklch or oklab
        const styleTags = Array.from(document.querySelectorAll('style'));
        for (const tag of styleTags) {
          if (tag.id === 'temp-disable-transitions') continue;
          const css = tag.innerHTML;
          if (css.includes('oklch') || css.includes('oklab')) {
            restoredStyles.push({ element: tag, originalContent: css });
            
            // Check cache to avoid extremely heavy regex computation which stalls/freezes the browser
            let patched = patchedStylesCache.get(tag);
            if (!patched) {
              patched = replaceOklabWithRgb(replaceOklchWithRgb(css));
              patchedStylesCache.set(tag, patched);
            }
            tag.innerHTML = patched;
          }
        }

        // 2. Process same-origin external <link rel="stylesheet"> tags containing oklch or oklab
        const linkTags = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
        for (const link of linkTags) {
          try {
            const isSameOrigin = !link.href || link.href.startsWith(window.location.origin) || !link.href.startsWith('http');
            if (isSameOrigin) {
              const sheet = link.sheet;
              let hasModernColor = false;
              try {
                if (sheet) {
                  for (let i = 0; i < sheet.cssRules.length; i++) {
                    const ruleText = sheet.cssRules[i].cssText;
                    if (ruleText.includes('oklch') || ruleText.includes('oklab')) {
                      hasModernColor = true;
                      break;
                    }
                  }
                }
              } catch (e) {
                // Fallback to true if we cannot inspect the cssRules due to security rules
                hasModernColor = true;
              }

              if (hasModernColor && link.href) {
                const response = await fetch(link.href);
                const cssText = await response.text();
                if (cssText.includes('oklch') || cssText.includes('oklab')) {
                  const patchedCss = replaceOklabWithRgb(replaceOklchWithRgb(cssText));
                  
                  // Injected converted/patched stylesheet
                  const tempStyle = document.createElement('style');
                  tempStyle.id = 'temp-patched-stylesheet';
                  tempStyle.innerHTML = patchedCss;
                  document.head.appendChild(tempStyle);

                  // Disable the original link
                  link.disabled = true;
                  restoredStyles.push({ element: link, href: link.href });
                }
              }
            }
          } catch (err) {
            console.warn('Failed to preprocess linked stylesheet:', link.href, err);
          }
        }

        // 3. Process inline 'style' attributes on any elements in the resume print area
        const elementsWithInlineStyle = element.querySelectorAll('[style]');
        elementsWithInlineStyle.forEach(el => {
          const styleAttr = el.getAttribute('style');
          if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('oklab'))) {
            originalInlineStyles.set(el, styleAttr);
            el.setAttribute('style', replaceOklabWithRgb(replaceOklchWithRgb(styleAttr)));
          }
        });
      } catch (styleErr) {
        console.warn('Error during style preprocessing for PDF:', styleErr);
      }

      // Cleanup and restore function
      const restoreStyles = () => {
        try {
          // Restore original resume-print-area properties
          element.style.removeProperty('padding');
          element.style.removeProperty('width');
          element.style.removeProperty('max-width');

          // Remove temp disable transitions stylesheet
          const disableStyle = document.getElementById('temp-disable-transitions');
          if (disableStyle) disableStyle.remove();

          // Restore <style> tag content
          for (const item of restoredStyles) {
            if (item.originalContent !== undefined) {
              item.element.innerHTML = item.originalContent;
            } else if (item.href !== undefined) {
              (item.element as HTMLLinkElement).disabled = false;
            }
          }

          // Remove temp style sheets
          const tempStyles = document.querySelectorAll('#temp-patched-stylesheet');
          tempStyles.forEach(el => el.remove());

          // Restore inline style attributes
          originalInlineStyles.forEach((style, el) => {
            el.setAttribute('style', style);
          });
        } catch (restoreErr) {
          console.error('Error during style restoration after PDF download:', restoreErr);
        }
      };

      // Ensure all custom web fonts are fully loaded before rendering to prevent dimension shifts or line wrapping issues
      try {
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready;
        }
      } catch (fontErr) {
        console.warn('Font loading check skipped:', fontErr);
      }

      // Short delay is sufficient because animations/transitions are disabled immediately
      setTimeout(() => {
        const userName = resume.personal.fullName || 'Resume';
        const cleanName = userName.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
        
        const opt = {
          margin: 0,
          filename: `${cleanName}_Resume.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true,
            logging: false,
            letterRendering: true,
            scrollX: 0,
            scrollY: 0,
            windowWidth: 794 // Enforces a fixed simulated viewport width of 794px (Standard A4 width) during capture to guarantee identical mobile & desktop layout dimensions
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        html2pdfLib()
          .from(element)
          .set(opt)
          .save()
          .then(() => {
            restoreStyles();
            setPdfDownloading(false);
            setZoomScale(previousZoom);
          })
          .catch((err: any) => {
            console.error('PDF Generation Error:', err);
            restoreStyles();
            setPdfDownloading(false);
            setZoomScale(previousZoom);
            alert('An error occurred during PDF generation. Please try again or use the browser Print / PDF button.');
          });
      }, 150);
    };

    // Dynamically load html2pdf if not available on window
    if ((window as any).html2pdf) {
      generate((window as any).html2pdf);
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => {
        generate((window as any).html2pdf);
      };
      script.onerror = () => {
        setPdfDownloading(false);
        alert('Could not load the PDF conversion library from CDN. Please check your network connection or try opening the app in a new tab.');
      };
      document.body.appendChild(script);
    }
  };

  // AI-powered Gemini Enhancer
  const callGeminiEnhance = async (section: string, text: string, idToUpdate?: string) => {
    if (!text.trim()) {
      alert('Please enter some text draft first before asking the AI to enhance it!');
      return;
    }
    
    setAiLoading(idToUpdate || section);
    setAiError(null);

    try {
      const res = await fetch('/api/resume/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section,
          text,
          role: resume.personal.title || 'Professional'
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'AI enhancement server request failed');
      }

      const data = await res.json();
      if (data.enhancedText) {
        // Automatically apply the enhanced text
        if (section === 'summary') {
          handlePersonalChange('summary', data.enhancedText);
        } else if (section === 'skills') {
          setResume(prev => ({ ...prev, skills: data.enhancedText }));
        } else if (section === 'experience' && idToUpdate) {
          handleExperienceChange(idToUpdate, 'description', data.enhancedText);
        }
        
        if (window.showSuccessToast) {
          window.showSuccessToast('AI polished successfully!');
        }
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Could not connect to Gemini service.');
      alert(`AI Polish Error: ${err.message || 'Make sure GEMINI_API_KEY is configured under Settings > Secrets'}`);
    } finally {
      setAiLoading(null);
    }
  };

  const parsedSkills = resume.skills
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 animate-fade-in relative">
      
      {/* Dynamic media print stylesheet specifically for this page */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          /* Hide bottom navigation bar and any layout wrappers */
          header, #bottom-navigation-container, .no-print, button, form, nav, footer, .print-hide, .no-print * {
            display: none !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
          }
          body, html {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .min-h-screen, main, #root {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            min-height: 0 !important;
          }
          #resume-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            display: block !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .resume-container-sheet {
            zoom: 1 !important;
            transform: none !important;
            width: 210mm !important;
            height: auto !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
          }
        }
      `}</style>

      {/* Hero Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6 print-hide">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 rounded-2xl border border-teal-100 dark:border-teal-900/30">
            <FileText size={24} className="stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">
              Smart Resume Builder
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Draft, style, and polish with Gemini AI magic
            </p>
          </div>
        </div>

        {/* Action Button Strip */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => {
              setSaveTitle(resume.personal.fullName || 'My Resume');
              setShowSaveModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950/10 cursor-pointer"
            title="Save current resume state to your saved drafts list"
            id="btn-save-resume-draft"
          >
            <Save size={14} />
            <span>Save Draft</span>
          </button>

          <button
            onClick={() => setShowSavedList(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200/80 cursor-pointer relative"
            title="View and load your previously saved resume drafts"
            id="btn-view-resume-drafts"
          >
            <FolderOpen size={14} />
            <span>My Drafts</span>
            {savedResumes.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-[10px] font-black text-white ml-0.5">
                {savedResumes.length}
              </span>
            )}
          </button>




        </div>
      </div>

      {/* Guest Login Suggestion Banner */}
      {!user && (
        <div className="mb-6 bg-amber-50/70 border border-amber-200/50 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print-hide">
          <div className="flex gap-2.5">
            <span className="text-xl">💡</span>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-900">Sign in to save your progress permanently</p>
              <p className="text-[10px] text-slate-500">You are currently drafting as Guest. Log in to sync details and access your draft from any browser.</p>
            </div>
          </div>
          {onLoginTrigger && (
            <button
              onClick={onLoginTrigger}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all shrink-0 cursor-pointer"
            >
              Log In Now
            </button>
          )}
        </div>
      )}

      {/* Mobile View Toggles (Form vs Live Preview) */}
      <div className="flex md:hidden items-center border border-slate-200/80 bg-white p-1 rounded-2xl mb-6 print-hide">
        <button
          onClick={() => setActiveMode('edit')}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeMode === 'edit' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Edit3 size={14} />
          <span>Edit Details</span>
        </button>
        <button
          onClick={() => setActiveMode('preview')}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeMode === 'preview' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Eye size={14} />
          <span>Live Preview</span>
        </button>
      </div>

      {/* Split Layout Body */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form Inputs */}
        <div className={`md:col-span-6 space-y-6 print-hide ${activeMode === 'edit' ? 'block' : 'hidden md:block'}`}>
          
          {/* Section: Personal Info */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-800 font-display flex items-center gap-1.5">
                <span>👤</span>
                Personal Details (Bio-Data)
              </h2>
            </div>

            {/* Profile Photo Uploader */}
            <div className="border-b border-slate-100 pb-4 mb-2">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                  {resume.personal.photo ? (
                    <img src={resume.personal.photo} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-xl text-slate-400">👤</span>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all">
                      <span>Upload Photo</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              handlePersonalChange('photo', reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden" 
                      />
                    </label>
                    {resume.personal.photo && (
                      <button
                        type="button"
                        onClick={() => handlePersonalChange('photo', '')}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 border border-rose-100 rounded-lg transition-all cursor-pointer"
                        title="Remove Photo"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  <p className="text-[9px] text-slate-400">Upload your own photo or select a high-res professional headshot preset.</p>
                </div>
              </div>
            </div>

            {/* Traditional Aligned Key-Value Form Fields */}
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-4 gap-y-1.5 items-center pb-2 border-b border-slate-50">
                <span className="text-xs font-bold text-slate-700">Full Name</span>
                <input
                  type="text"
                  value={resume.personal.fullName}
                  onChange={(e) => handlePersonalChange('fullName', e.target.value)}
                  placeholder="Manasa Vaddadhi"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition-all font-medium text-slate-800 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-4 gap-y-1.5 items-center pb-2 border-b border-slate-50">
                <span className="text-xs font-bold text-slate-700">Father's Name</span>
                <input
                  type="text"
                  value={resume.personal.fatherName ?? ''}
                  onChange={(e) => handlePersonalChange('fatherName', e.target.value)}
                  placeholder="Raghuram"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition-all font-medium text-slate-800 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-4 gap-y-1.5 items-center pb-2 border-b border-slate-50">
                <span className="text-xs font-bold text-slate-700">Mobile</span>
                <input
                  type="text"
                  value={resume.personal.phone}
                  onChange={(e) => handlePersonalChange('phone', e.target.value)}
                  placeholder="9425XXXX70"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition-all font-medium text-slate-800 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-4 gap-y-1.5 items-center pb-2 border-b border-slate-50">
                <span className="text-xs font-bold text-slate-700">Email ID</span>
                <input
                  type="email"
                  value={resume.personal.email}
                  onChange={(e) => handlePersonalChange('email', e.target.value)}
                  placeholder="manasavdxx@gmail.com"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition-all font-medium text-slate-800 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-4 gap-y-1.5 items-center pb-2 border-b border-slate-50">
                <span className="text-xs font-bold text-slate-700">Gender</span>
                <input
                  type="text"
                  value={resume.personal.gender ?? ''}
                  onChange={(e) => handlePersonalChange('gender', e.target.value)}
                  placeholder="Female"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition-all font-medium text-slate-800 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-4 gap-y-1.5 items-center pb-2 border-b border-slate-50">
                <span className="text-xs font-bold text-slate-700">Date of Birth</span>
                <input
                  type="text"
                  value={resume.personal.dob ?? ''}
                  onChange={(e) => handlePersonalChange('dob', e.target.value)}
                  placeholder="15 March 1999"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition-all font-medium text-slate-800 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-4 gap-y-1.5 items-center pb-2 border-b border-slate-50">
                <span className="text-xs font-bold text-slate-700">Marital Status</span>
                <input
                  type="text"
                  value={resume.personal.maritalStatus ?? ''}
                  onChange={(e) => handlePersonalChange('maritalStatus', e.target.value)}
                  placeholder="Married"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition-all font-medium text-slate-800 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-4 gap-y-1.5 items-center pb-2 border-b border-slate-50">
                <span className="text-xs font-bold text-slate-700">Religion</span>
                <input
                  type="text"
                  value={resume.personal.religion ?? ''}
                  onChange={(e) => handlePersonalChange('religion', e.target.value)}
                  placeholder="Hindu"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition-all font-medium text-slate-800 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-4 gap-y-1.5 items-center pb-2 border-b border-slate-50">
                <span className="text-xs font-bold text-slate-700">Nationality</span>
                <input
                  type="text"
                  value={resume.personal.nationality ?? ''}
                  onChange={(e) => handlePersonalChange('nationality', e.target.value)}
                  placeholder="India"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition-all font-medium text-slate-800 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-4 gap-y-1.5 items-center pb-2 border-b border-slate-50">
                <span className="text-xs font-bold text-slate-700">Languages Known</span>
                <input
                  type="text"
                  value={resume.personal.languagesKnown ?? ''}
                  onChange={(e) => handlePersonalChange('languagesKnown', e.target.value)}
                  placeholder="English, Hindi & Telugu"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition-all font-medium text-slate-800 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-4 gap-y-1.5 items-center pb-2 border-b border-slate-50">
                <span className="text-xs font-bold text-slate-700">Computer Knowledge</span>
                <input
                  type="text"
                  value={resume.personal.computerKnowledge ?? ''}
                  onChange={(e) => handlePersonalChange('computerKnowledge', e.target.value)}
                  placeholder="MS Office, PowerPoint"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition-all font-medium text-slate-800 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-4 gap-y-1.5 items-start pb-2 border-b border-slate-50">
                <span className="text-xs font-bold text-slate-700 pt-1">Permanent Address</span>
                <textarea
                  value={resume.personal.address ?? ''}
                  onChange={(e) => handlePersonalChange('address', e.target.value)}
                  placeholder="PM Palem, Madhurawada, Visakhapatnam 530045"
                  rows={2}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition-all font-medium text-slate-800 bg-white resize-none"
                />
              </div>
            </div>

            {/* Section: Declaration Details */}
            <div className="border-t border-slate-100 pt-4 mt-4 space-y-3.5">
              <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Declaration Details</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-4 gap-y-1.5 items-start pb-2 border-b border-slate-50">
                <span className="text-xs font-bold text-slate-700 pt-1">Declaration Text</span>
                <textarea
                  value={resume.personal.declaration ?? ''}
                  onChange={(e) => handlePersonalChange('declaration', e.target.value)}
                  placeholder="I do hereby declare that the above information is true to the best of my knowledge"
                  rows={2}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition-all font-medium text-slate-800 bg-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-4 gap-y-1.5 items-center pb-2 border-b border-slate-50">
                <span className="text-xs font-bold text-slate-700">Place</span>
                <input
                  type="text"
                  value={resume.personal.place ?? ''}
                  onChange={(e) => handlePersonalChange('place', e.target.value)}
                  placeholder="Visakhapatnam"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition-all font-medium text-slate-800 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-4 gap-y-1.5 items-center pb-2 border-b border-slate-50">
                <span className="text-xs font-bold text-slate-700">Date</span>
                <input
                  type="text"
                  value={resume.personal.date ?? ''}
                  onChange={(e) => handlePersonalChange('date', e.target.value)}
                  placeholder="07 Feb 2026"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition-all font-medium text-slate-800 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-4 gap-y-2 items-center pt-1.5">
                <span className="text-xs font-bold text-slate-700">Signature</span>
                <div className="flex items-center gap-4 flex-wrap">
                  {resume.personal.signature ? (
                    <div className="relative group/form-sig w-28 h-12 border border-slate-200 bg-slate-50 rounded-xl flex items-center justify-center p-1 overflow-hidden shadow-sm">
                      <img src={resume.personal.signature} alt="Signature" className="max-h-full max-w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => handlePersonalChange('signature', '')}
                        className="absolute top-1 right-1 p-1 bg-white hover:bg-rose-50 text-rose-500 rounded-lg shadow-sm border border-slate-100 transition-all cursor-pointer"
                        title="Remove Signature"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ) : (
                    <label className="px-3.5 py-2 bg-slate-950 hover:bg-slate-850 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1 shadow-sm">
                      <Plus size={12} className="stroke-[2.5]" />
                      <span>Upload Signature Image</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              handlePersonalChange('signature', reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden" 
                      />
                    </label>
                  )}
                  <p className="text-[9.5px] text-slate-400 font-medium">Attach an image of your handwritten signature (PNG/JPG).</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Experience */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-800 font-display flex items-center gap-1.5">
                <Briefcase size={14} className="text-teal-600" />
                Work Experience (कार्य अनुभव)
              </h2>
              <button
                onClick={addExperience}
                className="text-[9px] font-black uppercase tracking-wider text-teal-600 hover:text-teal-700 flex items-center gap-1 border border-teal-100 hover:border-teal-200 px-2.5 py-1.5 rounded-lg bg-teal-50/20 hover:bg-teal-50/50 transition-all cursor-pointer"
              >
                <Plus size={11} className="stroke-[3]" />
                <span>Add Experience</span>
              </button>
            </div>

            {resume.experience.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">No work experience added yet.</p>
            ) : (
              <div className="space-y-4 divide-y divide-slate-100">
                {resume.experience.map((exp, idx) => (
                  <div key={exp.id} className={`space-y-3 ${idx > 0 ? 'pt-4' : ''}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-teal-700 uppercase tracking-wider">Experience #{idx + 1}</span>
                      <button
                        onClick={() => deleteExperience(exp.id)}
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Designation / Job Title (पद)</label>
                        <input
                          type="text"
                          value={exp.position}
                          onChange={(e) => handleExperienceChange(exp.id, 'position', e.target.value)}
                          placeholder="e.g. High School Teacher"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Organization / Company Name (संस्था)</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => handleExperienceChange(exp.id, 'company', e.target.value)}
                          placeholder="e.g. Sri Venkateswara High School"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Start Date / Year (आरंभ तिथि)</label>
                        <input
                          type="text"
                          value={exp.startDate}
                          onChange={(e) => handleExperienceChange(exp.id, 'startDate', e.target.value)}
                          placeholder="e.g. 01 Mar 2023 or 2023"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">End Date / Year (समाप्ति तिथि)</label>
                        <input
                          type="text"
                          disabled={exp.current}
                          value={exp.current ? 'Present' : exp.endDate}
                          onChange={(e) => handleExperienceChange(exp.id, 'endDate', e.target.value)}
                          placeholder="e.g. 31 Jan 2026 or Present"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium text-slate-800 disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 py-1">
                      <input
                        type="checkbox"
                        id={`exp-curr-${exp.id}`}
                        checked={exp.current}
                        onChange={(e) => handleExperienceChange(exp.id, 'current', e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />
                      <label htmlFor={`exp-curr-${exp.id}`} className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer">I currently work here</label>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Responsibilities / Description (दायित्व)</label>
                        <button
                          onClick={() => callGeminiEnhance('experience', exp.description, exp.id)}
                          disabled={aiLoading !== null}
                          className="text-[9px] font-extrabold text-teal-600 hover:text-teal-700 flex items-center gap-1 border border-teal-100 hover:border-teal-200 bg-teal-50/50 hover:bg-teal-50 px-1.5 py-0.5 rounded-md transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {aiLoading === exp.id ? (
                            <div className="w-2.5 h-2.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Sparkles size={10} className="stroke-[2.5]" />
                          )}
                          <span>Polish bullets</span>
                        </button>
                      </div>
                      <textarea
                        value={exp.description}
                        onChange={(e) => handleExperienceChange(exp.id, 'description', e.target.value)}
                        placeholder="e.g. Taught science subjects, managed student activities, graded exams..."
                        rows={3}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium text-slate-800 leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Education */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-800 font-display flex items-center gap-1.5">
                <GraduationCap size={15} className="text-teal-600" />
                Education Details (शैक्षणिक योग्यता)
              </h2>
              <button
                onClick={addEducation}
                className="text-[9px] font-black uppercase tracking-wider text-teal-600 hover:text-teal-700 flex items-center gap-1 border border-teal-100 hover:border-teal-200 px-2.5 py-1.5 rounded-lg bg-teal-50/20 hover:bg-teal-50/50 transition-all cursor-pointer"
              >
                <Plus size={11} className="stroke-[3]" />
                <span>Add Education</span>
              </button>
            </div>

            {resume.education.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">No education entries yet.</p>
            ) : (
              <div className="space-y-4 divide-y divide-slate-100">
                {resume.education.map((edu, idx) => (
                  <div key={edu.id} className={`space-y-3 ${idx > 0 ? 'pt-4' : ''}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-teal-700 uppercase tracking-wider">Education #{idx + 1}</span>
                      <button
                        onClick={() => deleteEducation(edu.id)}
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Qualification / Degree (डिग्री/कक्षा)</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => handleEducationChange(edu.id, 'degree', e.target.value)}
                          placeholder="e.g. B.Sc (Mathematics & Physics)"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Institution Name (स्कूल/कॉलेज)</label>
                        <input
                          type="text"
                          value={edu.school}
                          onChange={(e) => handleEducationChange(edu.id, 'school', e.target.value)}
                          placeholder="e.g. Andhra University"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Passing Year (उत्तीर्ण वर्ष)</label>
                        <input
                          type="text"
                          value={edu.endDate}
                          onChange={(e) => handleEducationChange(edu.id, 'endDate', e.target.value)}
                          placeholder="e.g. 2020"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Marks / Percentage / CGPA (अंक %)</label>
                        <input
                          type="text"
                          value={edu.description}
                          onChange={(e) => handleEducationChange(edu.id, 'description', e.target.value)}
                          placeholder="e.g. 73% or 8.5 CGPA"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>


        </div>

        {/* Right Column: Style Selector & Live Preview Sheet */}
        <div className={`md:col-span-6 space-y-6 ${activeMode === 'preview' ? 'block' : 'hidden md:block'}`}>
          
          {/* Template Style Switcher */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs print-hide">
            <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Choose Sheet Design Style</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setActiveTemplate('indian-biodata');
                  if (!resume.personal.photo) {
                    handlePersonalChange('photo', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400');
                  }
                }}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                  activeTemplate === 'indian-biodata'
                    ? 'border-amber-500 bg-amber-50/50 text-amber-900 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <span className="block text-xs font-black">Indian Bio Data (Amber)</span>
                  <span className="block text-[9px] font-medium text-amber-600">Traditional aligned key-value</span>
                </div>
                {activeTemplate === 'indian-biodata' && <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 ml-2" />}
              </button>

              <button
                onClick={() => {
                  setActiveTemplate('classic-blue-biodata');
                  if (!resume.personal.photo) {
                    handlePersonalChange('photo', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400');
                  }
                }}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                  activeTemplate === 'classic-blue-biodata'
                    ? 'border-blue-500 bg-blue-50/50 text-blue-900 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <span className="block text-xs font-black">Classic Blue Bio Data</span>
                  <span className="block text-[9px] font-medium text-blue-600">Top blue header band with aligned grid</span>
                </div>
                {activeTemplate === 'classic-blue-biodata' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 ml-2" />}
              </button>
            </div>
          </div>

          {/* Scrollable A4 Preview Frame Container */}
          <div className="bg-slate-50 dark:bg-slate-900/10 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-4 sm:p-6 space-y-4 print:p-0 print:border-none print:bg-transparent">
            {/* Header / Info Badge - hidden during printing */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-lg">📄</span>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">A4 Document Preview</h3>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">Perfectly optimized for standard 210mm x 297mm printout</p>
                </div>
              </div>

              {/* Zoom & Action Controls Row */}
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 bg-teal-50 text-teal-700 border border-teal-100 rounded-lg hidden lg:inline-flex shrink-0">
                  ✨ Perfect A4 Aspect Ratio
                </span>

                {/* Unified controls bar containing zoom controls AND download button in one elegant pill */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/85 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setZoomScale(prev => Math.max(50, prev - 10))}
                    disabled={zoomScale <= 50}
                    className="p-1 px-2 hover:bg-white dark:hover:bg-slate-750 hover:text-teal-600 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-current transition-all cursor-pointer flex items-center justify-center"
                    title="Zoom Out"
                  >
                    <ZoomOut size={13} className="stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomScale(100)}
                    className="px-2.5 py-0.5 hover:bg-white dark:hover:bg-slate-750 hover:text-teal-600 rounded-lg text-[9.5px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 transition-all cursor-pointer min-w-[55px] text-center"
                    title="Reset Zoom to 100%"
                  >
                    {zoomScale}%
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomScale(prev => Math.min(150, prev + 10))}
                    disabled={zoomScale >= 150}
                    className="p-1 px-2 hover:bg-white dark:hover:bg-slate-750 hover:text-teal-600 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-current transition-all cursor-pointer flex items-center justify-center"
                    title="Zoom In"
                  >
                    <ZoomIn size={13} className="stroke-[2.5]" />
                  </button>

                  {/* Vertical Divider */}
                  <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

                  {/* Integrated Download PDF Button */}
                  <button
                    type="button"
                    onClick={() => setShowPdfGuideModal(true)}
                    disabled={pdfDownloading}
                    title="Download PDF Options"
                    className="p-1 px-2.5 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-600 rounded-lg text-xs font-bold text-teal-600 dark:text-teal-400 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Download size={13} className="stroke-[2.5]" />
                    <span className="text-[10px] font-black uppercase tracking-wider">PDF</span>
                  </button>
                </div>
              </div>
            </div>



            {/* Scroll wrapper */}
            <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 print:overflow-visible print:pb-0">
              <div className="flex justify-start lg:justify-center p-1 print:p-0 print:block">
                {/* Physical A4 Sheet Representation */}
                <div 
                  className="w-[794px] shrink-0 bg-white shadow-xl rounded-2xl border border-slate-200/50 overflow-hidden print:w-full print:shadow-none print:border-none print:rounded-none print:overflow-visible transition-all duration-300 origin-top resume-container-sheet"
                  style={{
                    zoom: zoomScale / 100,
                  }}
                >
                  <div 
                    id="resume-print-area" 
                    className="w-full p-8 bg-white font-sans transition-all duration-300 print:p-0"
                  >
            {/* Indian Bio Data Template */}
            {activeTemplate === 'indian-biodata' && (
              <div className="text-slate-800 font-sans leading-relaxed text-[11px] bg-white p-8 print:pt-14 print:px-12 print:pb-12">
                {/* Centered Heading */}
                <div className="text-center mb-8 select-none">
                  <h1 className="text-3xl font-black tracking-[0.12em] text-slate-900 uppercase border-b-2 border-slate-900 pb-1.5 inline-block font-serif">
                    BIO DATA
                  </h1>
                </div>

                {/* Top Section: Aligned Details + Photo */}
                <div className="flex justify-between items-start gap-6 mb-8">
                  {/* Key-Value Details */}
                  <div className="flex-1 grid grid-cols-[180px_20px_1fr] gap-y-2.5 text-[12px] text-slate-800 font-medium font-sans">
                    <div className="font-bold text-slate-900 font-sans">Name</div>
                    <div>:</div>
                    <div>
                      <InlineEdit
                        value={resume.personal.fullName}
                        onChange={(val) => handlePersonalChange('fullName', val)}
                        placeholder="Manasa Vaddadhi"
                        className="font-bold text-slate-950 w-full font-sans"
                      />
                    </div>

                    <div className="font-bold text-slate-900 font-sans">Father's Name</div>
                    <div>:</div>
                    <div>
                      <InlineEdit
                        value={resume.personal.fatherName ?? 'Raghuram'}
                        onChange={(val) => handlePersonalChange('fatherName', val)}
                        placeholder="Raghuram"
                        className="w-full text-slate-800 font-sans"
                      />
                    </div>

                    <div className="font-bold text-slate-900 font-sans">Mobile</div>
                    <div>:</div>
                    <div>
                      <InlineEdit
                        value={resume.personal.phone}
                        onChange={(val) => handlePersonalChange('phone', val)}
                        placeholder="9425XXXX70"
                        className="w-full text-slate-800 font-sans"
                      />
                    </div>

                    <div className="font-bold text-slate-900 font-sans">Email ID</div>
                    <div>:</div>
                    <div className="break-all font-sans">
                      <InlineEdit
                        value={resume.personal.email}
                        onChange={(val) => handlePersonalChange('email', val)}
                        placeholder="manasavdxx@gmail.com"
                        className="w-full text-slate-800 break-all font-sans"
                      />
                    </div>

                    <div className="font-bold text-slate-900 font-sans">Gender</div>
                    <div>:</div>
                    <div>
                      <InlineEdit
                        value={resume.personal.gender ?? 'Female'}
                        onChange={(val) => handlePersonalChange('gender', val)}
                        placeholder="Female"
                        className="w-full text-slate-800 font-sans"
                      />
                    </div>

                    <div className="font-bold text-slate-900 font-sans">Date of Birth</div>
                    <div>:</div>
                    <div>
                      <InlineEdit
                        value={resume.personal.dob ?? '15 March 1999'}
                        onChange={(val) => handlePersonalChange('dob', val)}
                        placeholder="15 March 1999"
                        className="w-full text-slate-800 font-sans"
                      />
                    </div>

                    <div className="font-bold text-slate-900 font-sans">Marital Status</div>
                    <div>:</div>
                    <div>
                      <InlineEdit
                        value={resume.personal.maritalStatus ?? 'Married'}
                        onChange={(val) => handlePersonalChange('maritalStatus', val)}
                        placeholder="Married"
                        className="w-full text-slate-800 font-sans"
                      />
                    </div>

                    <div className="font-bold text-slate-900 font-sans">Religion</div>
                    <div>:</div>
                    <div>
                      <InlineEdit
                        value={resume.personal.religion ?? 'Hindu'}
                        onChange={(val) => handlePersonalChange('religion', val)}
                        placeholder="Hindu"
                        className="w-full text-slate-800 font-sans"
                      />
                    </div>

                    <div className="font-bold text-slate-900 font-sans">Nationality</div>
                    <div>:</div>
                    <div>
                      <InlineEdit
                        value={resume.personal.nationality ?? 'India'}
                        onChange={(val) => handlePersonalChange('nationality', val)}
                        placeholder="India"
                        className="w-full text-slate-800 font-sans"
                      />
                    </div>

                    <div className="font-bold text-slate-900 font-sans">Languages Known</div>
                    <div>:</div>
                    <div>
                      <InlineEdit
                        value={resume.personal.languagesKnown ?? 'English, Hindi & Telugu'}
                        onChange={(val) => handlePersonalChange('languagesKnown', val)}
                        placeholder="English, Hindi & Telugu"
                        className="w-full text-slate-800 font-sans"
                      />
                    </div>
                  </div>

                  {/* Photo Frame */}
                  <div className="w-[125px] h-[155px] shrink-0 border-2 border-slate-300 bg-amber-50/10 p-1 rounded shadow-sm flex items-center justify-center relative select-none">
                    {resume.personal.photo ? (
                      <img 
                        src={resume.personal.photo} 
                        alt="Profile" 
                        className="w-full h-full object-cover animate-fade-in rounded-xs" 
                        referrerPolicy="no-referrer" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-350 font-bold text-3xl font-sans">👤</div>
                    )}
                  </div>
                </div>

                {/* Education Section */}
                <div className="mb-6">
                  <h3 className="text-[13px] font-bold text-slate-900 mb-2 font-sans">Education:</h3>
                  <table className="w-full border-collapse border border-slate-300 text-[11px] text-slate-800">
                    <thead>
                      <tr className="bg-amber-300/95 font-bold text-slate-900">
                        <th className="border border-slate-300 px-3 py-1.5 text-left w-[30%]">Qualification</th>
                        <th className="border border-slate-300 px-3 py-1.5 text-center w-[15%]">Year</th>
                        <th className="border border-slate-300 px-3 py-1.5 text-left w-[40%]">Institution Name</th>
                        <th className="border border-slate-300 px-3 py-1.5 text-center w-[15%]">Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resume.education.map((edu) => (
                        <tr key={edu.id} className="relative group/edu">
                          <td className="border border-slate-300 px-3 py-1.5">
                            <InlineEdit
                              value={edu.degree}
                              onChange={(val) => handleEducationChange(edu.id, 'degree', val)}
                              placeholder="B.Sc (Mathematics & Physics)"
                              className="w-full font-medium font-sans"
                            />
                          </td>
                          <td className="border border-slate-300 px-3 py-1.5 text-center">
                            <InlineEdit
                              value={edu.endDate}
                              onChange={(val) => handleEducationChange(edu.id, 'endDate', val)}
                              placeholder="2020"
                              className="w-full text-center font-sans"
                            />
                          </td>
                          <td className="border border-slate-300 px-3 py-1.5">
                            <InlineEdit
                              value={edu.school}
                              onChange={(val) => handleEducationChange(edu.id, 'school', val)}
                              placeholder="Andhra University"
                              className="w-full font-sans"
                            />
                          </td>
                          <td className="border border-slate-300 px-3 py-1.5 text-center font-semibold">
                            <InlineEdit
                              value={edu.description}
                              onChange={(val) => handleEducationChange(edu.id, 'description', val)}
                              placeholder="73%"
                              className="w-full text-center font-sans"
                            />
                          </td>
                          {/* Row delete button */}
                          <td className="absolute -right-6 top-1/2 -translate-y-1/2 select-none print:hidden border-none p-0">
                            <button
                              onClick={() => deleteEducation(edu.id)}
                              className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded opacity-0 group-hover/edu:opacity-100 transition-opacity cursor-pointer"
                              title="Delete qualification row"
                            >
                              <Trash2 size={10} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    onClick={addEducation}
                    className="mt-2 text-[9.5px] font-extrabold text-teal-800 hover:text-teal-950 flex items-center gap-1 cursor-pointer select-none print:hidden opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <Plus size={11} /> Add Education
                  </button>
                </div>

                {/* Work Experience Section */}
                {resume.experience.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-[13px] font-bold text-slate-900 mb-2 font-sans">Work Experience:</h3>
                    <table className="w-full border-collapse border border-slate-300 text-[11px] text-slate-800 font-sans">
                      <thead>
                        <tr className="bg-amber-300/95 font-bold text-slate-900">
                          <th className="border border-slate-300 px-3 py-1.5 text-left w-[25%]">Designation</th>
                          <th className="border border-slate-300 px-3 py-1.5 text-left w-[25%]">Organization</th>
                          <th className="border border-slate-300 px-3 py-1.5 text-center w-[20%]">Job Period</th>
                          <th className="border border-slate-300 px-3 py-1.5 text-left w-[30%]">Responsibilities</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resume.experience.map((exp) => (
                          <tr key={exp.id} className="relative group/exp">
                            <td className="border border-slate-300 px-3 py-1.5">
                              <InlineEdit
                                value={exp.position}
                                onChange={(val) => handleExperienceChange(exp.id, 'position', val)}
                                placeholder="High School Teacher"
                                className="w-full font-medium font-sans"
                              />
                            </td>
                            <td className="border border-slate-300 px-3 py-1.5">
                              <InlineEdit
                                value={exp.company}
                                onChange={(val) => handleExperienceChange(exp.id, 'company', val)}
                                placeholder="Sri Venkateswara High School"
                                className="w-full font-sans"
                              />
                            </td>
                            <td className="border border-slate-300 px-3 py-1.5 text-center">
                              <div className="flex flex-col items-center justify-center gap-0.5">
                                <InlineEdit
                                  value={exp.startDate}
                                  onChange={(val) => handleExperienceChange(exp.id, 'startDate', val)}
                                  placeholder="01 Mar 2023"
                                  className="w-full text-center font-sans"
                                />
                                <span className="text-[9px] text-slate-400">to</span>
                                <InlineEdit
                                  value={exp.endDate}
                                  onChange={(val) => handleExperienceChange(exp.id, 'endDate', val)}
                                  placeholder="31 Jan 2026"
                                  className="w-full text-center font-sans"
                                />
                              </div>
                            </td>
                            <td className="border border-slate-300 px-3 py-1.5">
                              <InlineEdit
                                value={exp.description}
                                onChange={(val) => handleExperienceChange(exp.id, 'description', val)}
                                placeholder="- Teaching Maths & Physics&#10;- Preparing lesson plans"
                                multiline
                                className="w-full font-sans"
                              >
                                {exp.description ? (
                                  <ul className="list-disc pl-4 space-y-0.5 text-left font-sans">
                                    {exp.description.split('\n').map((bullet, bIdx) => {
                                      const cleaned = bullet.replace(/^[•\-\s*]+/, '').trim();
                                      if (!cleaned) return null;
                                      return <li key={bIdx}>{cleaned}</li>;
                                    })}
                                  </ul>
                                ) : (
                                  <span className="text-slate-400 italic">Click to enter responsibilities...</span>
                                )}
                              </InlineEdit>
                            </td>
                            {/* Row delete button */}
                            <td className="absolute -right-6 top-1/2 -translate-y-1/2 select-none print:hidden border-none p-0">
                              <button
                                onClick={() => deleteExperience(exp.id)}
                                className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded opacity-0 group-hover/exp:opacity-100 transition-opacity cursor-pointer"
                                title="Delete experience row"
                              >
                                <Trash2 size={10} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button
                      onClick={addExperience}
                      className="mt-2 text-[9.5px] font-extrabold text-teal-800 hover:text-teal-950 flex items-center gap-1 cursor-pointer select-none print:hidden opacity-50 hover:opacity-100 transition-opacity"
                    >
                      <Plus size={11} /> Add Experience
                    </button>
                  </div>
                )}

                {/* Additional Skills, Address Key-Value Grid */}
                <div className="grid grid-cols-[180px_20px_1fr] gap-y-2.5 text-[12px] text-slate-800 font-medium font-sans mb-6">
                  <div className="font-bold text-slate-900 font-sans">Computer Knowledge</div>
                  <div>:</div>
                  <div>
                    <InlineEdit
                      value={resume.personal.computerKnowledge ?? 'MS Office, PowerPoint'}
                      onChange={(val) => handlePersonalChange('computerKnowledge', val)}
                      placeholder="MS Office, PowerPoint"
                      className="w-full text-slate-800 animate-fade-in font-sans"
                    />
                  </div>

                  <div className="font-bold text-slate-900 font-sans">Address</div>
                  <div>:</div>
                  <div>
                    <InlineEdit
                      value={resume.personal.address ?? 'PM Palem, Madhurawada, Visakhapatnam 530045'}
                      onChange={(val) => handlePersonalChange('address', val)}
                      placeholder="PM Palem, Madhurawada, Visakhapatnam 530045"
                      multiline
                      className="w-full text-slate-800 animate-fade-in font-sans"
                    />
                  </div>
                </div>

                {/* Declaration Block */}
                <div className="mb-8 font-sans">
                  <h4 className="text-[12px] font-bold text-slate-900 underline mb-2 font-sans">Declaration</h4>
                  <p className="text-[11.5px] text-slate-800 leading-relaxed font-medium font-sans">
                    <InlineEdit
                      value={resume.personal.declaration ?? 'I do hereby declare that the above information is true to the best of my knowledge'}
                      onChange={(val) => handlePersonalChange('declaration', val)}
                      placeholder="I do hereby declare that the above information is true to the best of my knowledge"
                      multiline
                      className="w-full font-sans"
                    />
                  </p>
                </div>

                {/* Footer Section: Place, Date, Signature */}
                <div className="flex justify-between items-end text-[12px] text-slate-800 font-medium font-sans pt-4">
                  <div className="space-y-1 font-sans">
                    <p className="flex items-center gap-1 font-sans">
                      <span>Place:</span>
                      <InlineEdit
                        value={resume.personal.place ?? 'Visakhapatnam'}
                        onChange={(val) => handlePersonalChange('place', val)}
                        placeholder="Visakhapatnam"
                        className="font-bold text-slate-900 font-sans animate-fade-in"
                      />
                    </p>
                    <p className="flex items-center gap-1 font-sans">
                      <span>Date:</span>
                      <InlineEdit
                        value={resume.personal.date ?? '07 Feb 2026'}
                        onChange={(val) => handlePersonalChange('date', val)}
                        placeholder="07 Feb 2026"
                        className="font-bold text-slate-900 font-sans animate-fade-in"
                      />
                    </p>
                  </div>
                  <div className="text-right pr-4 font-sans flex flex-col items-center select-none">
                    {resume.personal.signature ? (
                      <div className="relative group/sig mb-1 h-12 w-28 flex items-center justify-center">
                        <img src={resume.personal.signature} alt="Signature" className="max-h-full max-w-full object-contain" />
                        <button
                          type="button"
                          onClick={() => handlePersonalChange('signature', '')}
                          className="absolute -top-1 -right-4 p-1 bg-rose-50 text-rose-600 rounded opacity-0 group-hover/sig:opacity-100 transition-opacity print:hidden cursor-pointer"
                          title="Delete signature"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ) : (
                      <div className="print:hidden mb-2">
                        <label className="text-[10px] text-teal-700 font-extrabold cursor-pointer hover:underline uppercase tracking-wider flex items-center gap-1">
                          <Plus size={10} className="stroke-[3]" />
                          <span>Add Signature</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  handlePersonalChange('signature', reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden" 
                          />
                        </label>
                      </div>
                    )}
                    <p className={`font-bold border-t border-slate-400 pt-1 px-4 inline-block text-slate-900 font-sans ${resume.personal.signature ? 'mt-1' : 'mt-8'}`}>
                      Signature
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Classic Blue Bio Data Template */}
            {activeTemplate === 'classic-blue-biodata' && (
              <div className="text-slate-800 font-sans leading-relaxed text-[11px] bg-white pb-8">
                {/* Header Blue Band */}
                <div className="bg-[#2c75b8] text-white p-6 text-center select-none mb-8 rounded-t-lg print:rounded-none">
                  <h1 className="text-2xl font-black tracking-[0.1em] uppercase font-sans mb-1.5">
                    <InlineEdit
                      value={resume.personal.fullName}
                      onChange={(val) => handlePersonalChange('fullName', val)}
                      placeholder="Manasa Vaddadhi"
                      className="text-white text-center font-sans block mx-auto text-2xl font-black bg-transparent"
                    />
                  </h1>
                  <p className="text-[12px] font-semibold font-sans mb-0.5">
                    Mobile No: <InlineEdit
                      value={resume.personal.phone}
                      onChange={(val) => handlePersonalChange('phone', val)}
                      placeholder="9425XXXX70"
                      className="text-white inline-block text-left bg-transparent"
                    />
                  </p>
                  <p className="text-[12px] font-semibold font-sans">
                    Email id: <InlineEdit
                      value={resume.personal.email}
                      onChange={(val) => handlePersonalChange('email', val)}
                      placeholder="manasavdxx@gmail.com"
                      className="text-white inline-block text-left bg-transparent break-all"
                    />
                  </p>
                </div>

                {/* Top Section: Aligned Details + Photo */}
                <div className="flex justify-between items-start gap-6 mb-8 px-6">
                  {/* Key-Value Details */}
                  <div className="flex-1 grid grid-cols-[160px_20px_1fr] gap-y-2.5 text-[12px] text-slate-800 font-medium font-sans">
                    <div className="font-bold text-slate-950 font-sans">Date of Birth</div>
                    <div className="font-sans">:</div>
                    <div>
                      <InlineEdit
                        value={resume.personal.dob ?? '12 March 2005'}
                        onChange={(val) => handlePersonalChange('dob', val)}
                        placeholder="12 March 2005"
                        className="w-full text-slate-800 font-sans bg-transparent"
                      />
                    </div>

                    <div className="font-bold text-slate-950 font-sans">Gender</div>
                    <div className="font-sans">:</div>
                    <div>
                      <InlineEdit
                        value={resume.personal.gender ?? 'Male'}
                        onChange={(val) => handlePersonalChange('gender', val)}
                        placeholder="Male"
                        className="w-full text-slate-800 font-sans bg-transparent"
                      />
                    </div>

                    <div className="font-bold text-slate-950 font-sans">Father's Name</div>
                    <div className="font-sans">:</div>
                    <div>
                      <InlineEdit
                        value={resume.personal.fatherName ?? 'Aarnav Kumar'}
                        onChange={(val) => handlePersonalChange('fatherName', val)}
                        placeholder="Aarnav Kumar"
                        className="w-full text-slate-800 font-sans bg-transparent"
                      />
                    </div>

                    <div className="font-bold text-slate-950 font-sans">Religion</div>
                    <div className="font-sans">:</div>
                    <div>
                      <InlineEdit
                        value={resume.personal.religion ?? 'Hindu'}
                        onChange={(val) => handlePersonalChange('religion', val)}
                        placeholder="Hindu"
                        className="w-full text-slate-800 font-sans bg-transparent"
                      />
                    </div>

                    <div className="font-bold text-slate-950 font-sans">Nationality</div>
                    <div className="font-sans">:</div>
                    <div>
                      <InlineEdit
                        value={resume.personal.nationality ?? 'Indian'}
                        onChange={(val) => handlePersonalChange('nationality', val)}
                        placeholder="Indian"
                        className="w-full text-slate-800 font-sans bg-transparent"
                      />
                    </div>

                    <div className="font-bold text-slate-950 font-sans">Marital Status</div>
                    <div className="font-sans">:</div>
                    <div>
                      <InlineEdit
                        value={resume.personal.maritalStatus ?? 'Unmarried'}
                        onChange={(val) => handlePersonalChange('maritalStatus', val)}
                        placeholder="Unmarried"
                        className="w-full text-slate-800 font-sans bg-transparent"
                      />
                    </div>

                    <div className="font-bold text-slate-950 font-sans">Languages Known</div>
                    <div className="font-sans">:</div>
                    <div>
                      <InlineEdit
                        value={resume.personal.languagesKnown ?? 'English & Telugu'}
                        onChange={(val) => handlePersonalChange('languagesKnown', val)}
                        placeholder="English & Telugu"
                        className="w-full text-slate-800 font-sans bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Photo Frame */}
                  <div className="w-[125px] h-[155px] shrink-0 border border-slate-300 p-1 bg-white rounded-xs shadow-xs flex items-center justify-center relative select-none">
                    {resume.personal.photo ? (
                      <img 
                        src={resume.personal.photo} 
                        alt="Profile" 
                        className="w-full h-full object-cover rounded-xs" 
                        referrerPolicy="no-referrer" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-350 font-bold text-3xl font-sans">👤</div>
                    )}
                  </div>
                </div>

                {/* Education Section */}
                <div className="mb-6 px-6">
                  <h3 className="text-[13px] font-bold text-slate-900 mb-2 font-sans">Education Details:</h3>
                  <table className="w-full border-collapse border border-slate-300 text-[11px] text-slate-800">
                    <thead>
                      <tr className="bg-slate-50 font-bold text-slate-900 border-b border-slate-300">
                        <th className="border border-slate-300 px-3 py-1.5 text-left w-[30%]">Education</th>
                        <th className="border border-slate-300 px-3 py-1.5 text-left w-[40%]">University/College</th>
                        <th className="border border-slate-300 px-3 py-1.5 text-center w-[15%]">Year of Pass</th>
                        <th className="border border-slate-300 px-3 py-1.5 text-center w-[15%]">Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resume.education.map((edu) => (
                        <tr key={edu.id} className="relative group/edu">
                          <td className="border border-slate-300 px-3 py-1.5">
                            <InlineEdit
                              value={edu.degree}
                              onChange={(val) => handleEducationChange(edu.id, 'degree', val)}
                              placeholder="B. Com Computers"
                              className="w-full font-medium font-sans"
                            />
                          </td>
                          <td className="border border-slate-300 px-3 py-1.5">
                            <InlineEdit
                              value={edu.school}
                              onChange={(val) => handleEducationChange(edu.id, 'school', val)}
                              placeholder="Nizam Degree College"
                              className="w-full font-sans"
                            />
                          </td>
                          <td className="border border-slate-300 px-3 py-1.5 text-center">
                            <InlineEdit
                              value={edu.endDate}
                              onChange={(val) => handleEducationChange(edu.id, 'endDate', val)}
                              placeholder="2022"
                              className="w-full text-center font-sans"
                            />
                          </td>
                          <td className="border border-slate-300 px-3 py-1.5 text-center font-semibold">
                            <InlineEdit
                              value={edu.description}
                              onChange={(val) => handleEducationChange(edu.id, 'description', val)}
                              placeholder="8 GPA"
                              className="w-full text-center font-sans"
                            />
                          </td>
                          {/* Row delete button */}
                          <td className="absolute -right-6 top-1/2 -translate-y-1/2 select-none print:hidden border-none p-0">
                            <button
                              onClick={() => deleteEducation(edu.id)}
                              className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded opacity-0 group-hover/edu:opacity-100 transition-opacity cursor-pointer"
                              title="Delete qualification row"
                            >
                              <Trash2 size={10} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    onClick={addEducation}
                    className="mt-2 text-[9.5px] font-extrabold text-teal-800 hover:text-teal-950 flex items-center gap-1 cursor-pointer select-none print:hidden opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <Plus size={11} /> Add Education
                  </button>
                </div>

                {/* Experience & Address Details Section */}
                <div className="grid grid-cols-[160px_20px_1fr] gap-y-3 text-[12px] text-slate-800 font-medium font-sans mb-8 px-6">
                  <div className="font-bold text-slate-900 font-sans">Experience</div>
                  <div className="font-sans">:</div>
                  <div className="font-sans">
                    {resume.experience && resume.experience.length > 0 ? (
                      <div className="space-y-1">
                        {resume.experience.map((exp) => (
                          <div key={exp.id} className="relative group/exp text-slate-800 font-sans">
                            <span className="font-bold text-slate-900">{exp.position}</span> at {exp.company} ({exp.startDate} - {exp.endDate})
                            <InlineEdit
                              value={exp.description}
                              onChange={(val) => handleExperienceChange(exp.id, 'description', val)}
                              placeholder="- Responsibilities"
                              multiline
                              className="w-full text-slate-600 pl-2 text-[11px] font-sans"
                            />
                            <button
                              onClick={() => deleteExperience(exp.id)}
                              className="absolute -right-6 top-0 p-1 bg-red-50 text-red-600 rounded opacity-0 group-hover/exp:opacity-100 transition-opacity print:hidden cursor-pointer"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={addExperience}
                          className="text-[9.5px] font-extrabold text-teal-800 hover:text-teal-950 flex items-center gap-1 cursor-pointer select-none print:hidden opacity-50 hover:opacity-100 transition-opacity mt-1"
                        >
                          <Plus size={11} /> Add Experience
                        </button>
                      </div>
                    ) : (
                      <div className="font-sans text-slate-800 flex items-center gap-2">
                        <span>Fresher</span>
                        <button
                          onClick={addExperience}
                          className="text-[9.5px] font-extrabold text-teal-800 hover:text-teal-950 flex items-center gap-1 cursor-pointer select-none print:hidden opacity-50 hover:opacity-100 transition-opacity"
                        >
                          <Plus size={11} /> Switch to Experienced
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="font-bold text-slate-900 font-sans">Computer Knowledge</div>
                  <div className="font-sans">:</div>
                  <div className="font-sans">
                    <InlineEdit
                      value={resume.personal.computerKnowledge ?? 'MS Office, PowerPoint'}
                      onChange={(val) => handlePersonalChange('computerKnowledge', val)}
                      placeholder="MS Office, PowerPoint"
                      className="w-full text-slate-800 font-sans bg-transparent"
                    />
                  </div>

                  <div className="font-bold text-slate-900 font-sans">Address</div>
                  <div className="font-sans">:</div>
                  <div className="font-sans">
                    <InlineEdit
                      value={resume.personal.address ?? '5-7-168, Krish Nagar, Vellon Main Road, Vellore, Tamil Nadu 500012.'}
                      onChange={(val) => handlePersonalChange('address', val)}
                      placeholder="5-7-168, Krish Nagar, Vellon Main Road, Vellore, Tamil Nadu 500012."
                      multiline
                      className="w-full text-slate-800 leading-relaxed font-sans bg-transparent"
                    />
                  </div>
                </div>

                {/* Declaration Section */}
                <div className="mb-10 font-sans px-6">
                  <p className="text-[11.5px] text-slate-800 leading-relaxed font-sans">
                    <strong className="font-bold text-slate-900 font-sans">Declaration: </strong>
                    <span className="italic font-sans">
                      <InlineEdit
                        value={resume.personal.declaration ?? 'I hereby declare that all the above information is true to the best of my knowledge and belief.'}
                        onChange={(val) => handlePersonalChange('declaration', val)}
                        placeholder="I hereby declare that all the above information is true to the best of my knowledge and belief."
                        multiline
                        className="inline font-sans bg-transparent"
                      />
                    </span>
                  </p>
                </div>

                {/* Footer Section: Place, Date, Signature */}
                <div className="flex justify-between items-end text-[12px] text-slate-800 font-medium font-sans pt-4 px-6">
                  <div className="space-y-1.5 font-sans">
                    <p className="flex items-center gap-1 font-sans">
                      <span className="font-bold text-slate-900 font-sans">Place:</span>
                      <InlineEdit
                        value={resume.personal.place ?? 'Vellore'}
                        onChange={(val) => handlePersonalChange('place', val)}
                        placeholder="Vellore"
                        className="font-bold text-slate-900 font-sans bg-transparent"
                      />
                    </p>
                    <p className="flex items-center gap-1 font-sans">
                      <span className="font-bold text-slate-900 font-sans">Date:</span>
                      <InlineEdit
                        value={resume.personal.date ?? '08 March 2023'}
                        onChange={(val) => handlePersonalChange('date', val)}
                        placeholder="08 March 2023"
                        className="font-bold text-slate-900 font-sans bg-transparent"
                      />
                    </p>
                  </div>
                  <div className="text-right font-sans flex flex-col items-center select-none">
                    {resume.personal.signature ? (
                      <div className="relative group/sig mb-1 h-12 w-28 flex items-center justify-center">
                        <img src={resume.personal.signature} alt="Signature" className="max-h-full max-w-full object-contain" />
                        <button
                          type="button"
                          onClick={() => handlePersonalChange('signature', '')}
                          className="absolute -top-1 -right-4 p-1 bg-rose-50 text-rose-600 rounded opacity-0 group-hover/sig:opacity-100 transition-opacity print:hidden cursor-pointer"
                          title="Delete signature"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ) : (
                      <div className="print:hidden mb-2">
                        <label className="text-[10px] text-teal-700 font-extrabold cursor-pointer hover:underline uppercase tracking-wider flex items-center gap-1">
                          <Plus size={10} className="stroke-[3]" />
                          <span>Add Signature</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  handlePersonalChange('signature', reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden" 
                          />
                        </label>
                      </div>
                    )}
                    <p className={`font-bold text-slate-900 font-sans text-[13px] ${resume.personal.signature ? 'mt-1' : 'mt-8'}`}>Signature</p>
                  </div>
                </div>
              </div>
            )}

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 1. Save Resume Draft Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[11000] flex items-center justify-center bg-slate-950/50 backdrop-blur-[2.px] p-4 print-hide"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-4"
            >
              <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Save size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Save Resume Draft</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Save multiple drafts and switch anytime</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Draft Name</label>
                <input
                  type="text"
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder={resume.personal.fullName || 'My Professional Resume'}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 dark:text-slate-100"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveResume(saveTitle);
                    }
                  }}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveResume(saveTitle)}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-950/10 transition-all cursor-pointer"
                >
                  Save Draft
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Saved Drafts List Manager Drawer/Modal */}
      <AnimatePresence>
        {showSavedList && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[11000] flex items-center justify-center bg-slate-950/50 backdrop-blur-[2.px] p-4 print-hide"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-4 max-h-[85vh]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">
                    <FolderOpen size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">My Saved Resumes</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Load and customize previously saved drafts</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSavedList(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-150 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer text-xs font-bold"
                >
                  Close
                </button>
              </div>

              {/* Saved Drafts List Container */}
              <div className="flex-1 overflow-y-auto min-h-[250px] max-h-[50vh] pr-1 space-y-2.5 scrollbar-thin">
                {savedResumes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-12 px-4 gap-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 text-lg">
                      📁
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No saved drafts yet</p>
                      <p className="text-[10px] text-slate-400 max-w-[240px]">Create or fill out the form above, then click the "Save Draft" button to save your resume.</p>
                    </div>
                  </div>
                ) : (
                  savedResumes.map((draft) => (
                    <div
                      key={draft.id}
                      onClick={() => handleLoadResume(draft)}
                      className="group flex items-center justify-between p-4 bg-slate-50 hover:bg-teal-50/40 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-100 hover:border-teal-200 dark:border-slate-900 dark:hover:border-teal-900/40 rounded-xl cursor-pointer transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white dark:bg-slate-900 text-slate-500 group-hover:text-teal-600 rounded-lg border border-slate-200/60 dark:border-slate-800 transition-all shadow-sm">
                          <FileText size={16} />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-all">
                            {draft.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                            <span>{draft.timestamp}</span>
                            <span>•</span>
                            <span className="text-teal-600 dark:text-teal-400">{draft.template.replace('-', ' ')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-all">
                        {deleteConfirmId === draft.id ? (
                          <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/20 p-1 rounded-lg border border-rose-100 dark:border-rose-900/50">
                            <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 px-1 uppercase tracking-wider">Delete?</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePerformDelete(draft.id, draft.name);
                              }}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[9px] font-bold uppercase transition-all cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(null);
                              }}
                              className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[9px] font-bold uppercase transition-all cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLoadResume(draft);
                              }}
                              className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-teal-600 hover:text-white text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                            >
                              Load
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(draft.id);
                              }}
                              title="Delete draft"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer animate-fade-in"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 text-[10px] text-slate-400 text-center font-bold uppercase tracking-wider">
                Resumes are saved securely to your browser storage
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. High Quality PDF Download Guide Modal */}
      <AnimatePresence>
        {showPdfGuideModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[11000] flex items-center justify-center bg-slate-950/50 backdrop-blur-[2px] p-4 print-hide"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 rounded-xl">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Download High-Quality PDF</h3>
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider">Vector/Text Format — Fully Selectable & Editable</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPdfGuideModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-150 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer text-xs font-bold"
                >
                  Close
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-teal-50/60 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30 rounded-xl p-4">
                  <div className="bg-white/80 dark:bg-slate-950/80 rounded-lg p-3 text-[11px] font-semibold text-slate-600 dark:text-slate-400 border border-teal-100/40 dark:border-teal-900/10 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="bg-teal-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">1</span>
                      <span>Niche <strong>"Open High-Quality Print to PDF"</strong> button par click karein.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="bg-teal-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">2</span>
                      <span>Aapke device ka Print window open hoga. Wahan <strong>Destination (डेस्टिनेशन)</strong> ko badal kar <strong>"Save as PDF"</strong> choose karein.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="bg-teal-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">3</span>
                      <span><strong>Save</strong> button par click karke High-Quality PDF apne computer/phone me download karein!</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    onClick={() => {
                      setShowPdfGuideModal(false);
                      triggerPrint();
                    }}
                    className="w-full px-5 py-3 text-xs font-extrabold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-xl shadow-lg shadow-teal-950/10 transition-all cursor-pointer flex items-center justify-center gap-2 border border-teal-500"
                  >
                    <Printer size={15} className="stroke-[2.5]" />
                    Open High-Quality Print to PDF
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper to convert OKLCH to sRGB color
function oklchToRgb(l: number, c: number, h: number, alpha?: number): string {
  // h is in degrees, convert to radians
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  // OKLab to LMS
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const lLin = l_ * l_ * l_;
  const mLin = m_ * m_ * m_;
  const sLin = s_ * s_ * s_;

  // LMS to linear RGB
  const rLin = +4.0767416621 * lLin - 3.3077115913 * mLin + 0.2309699292 * sLin;
  const gLin = -1.2684380046 * lLin + 2.6097574011 * mLin - 0.3413193965 * sLin;
  const bLin = -0.0041960863 * lLin - 0.7034186147 * mLin + 1.7076147010 * sLin;

  // Linear RGB to sRGB
  const transfer = (x: number) => {
    return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  };

  const red = Math.round(Math.max(0, Math.min(1, transfer(rLin))) * 255);
  const green = Math.round(Math.max(0, Math.min(1, transfer(gLin))) * 255);
  const blue = Math.round(Math.max(0, Math.min(1, transfer(bLin))) * 255);

  if (alpha !== undefined) {
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }
  return `rgb(${red}, ${green}, ${blue})`;
}

// Replaces oklch(...) color function instances in a string with standard rgb/rgba strings
function replaceOklchWithRgb(cssText: string): string {
  return cssText.replace(/oklch\(\s*([0-9.]+%?)\s+([0-9.]+%?)\s+([0-9.]+(?:deg|rad|grad|turn)?%?)(?:\s*\/\s*([0-9.]+%?))?\s*\)/gi, (match, lStr, cStr, hStr, aStr) => {
    try {
      const l = lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr);
      const c = cStr.endsWith('%') ? parseFloat(cStr) / 100 : parseFloat(cStr);
      
      let h = parseFloat(hStr);
      if (hStr.includes('rad')) {
        h = (h * 180) / Math.PI;
      } else if (hStr.includes('grad')) {
        h = h * 0.9;
      } else if (hStr.includes('turn')) {
        h = h * 360;
      }

      let alpha: number | undefined = undefined;
      if (aStr) {
        alpha = aStr.endsWith('%') ? parseFloat(aStr) / 100 : parseFloat(aStr);
      }

      return oklchToRgb(l, c, h, alpha);
    } catch (e) {
      console.error('Failed to parse oklch color:', match, e);
      return match;
    }
  });
}

// Helper to convert OKLab to sRGB color
function oklabToRgb(l: number, a: number, b: number, alpha?: number): string {
  // OKLab to LMS
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const lLin = l_ * l_ * l_;
  const mLin = m_ * m_ * m_;
  const sLin = s_ * s_ * s_;

  // LMS to linear RGB
  const rLin = +4.0767416621 * lLin - 3.3077115913 * mLin + 0.2309699292 * sLin;
  const gLin = -1.2684380046 * lLin + 2.6097574011 * mLin - 0.3413193965 * sLin;
  const bLin = -0.0041960863 * lLin - 0.7034186147 * mLin + 1.7076147010 * sLin;

  // Linear RGB to sRGB
  const transfer = (x: number) => {
    return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  };

  const red = Math.round(Math.max(0, Math.min(1, transfer(rLin))) * 255);
  const green = Math.round(Math.max(0, Math.min(1, transfer(gLin))) * 255);
  const blue = Math.round(Math.max(0, Math.min(1, transfer(bLin))) * 255);

  if (alpha !== undefined) {
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }
  return `rgb(${red}, ${green}, ${blue})`;
}

// Replaces oklab(...) color function instances in a string with standard rgb/rgba strings
function replaceOklabWithRgb(cssText: string): string {
  return cssText.replace(/oklab\(\s*(-?[0-9.]+%?)\s+(-?[0-9.]+%?)\s+(-?[0-9.]+%?)(?:\s*\/\s*([0-9.]+%?))?\s*\)/gi, (match, lStr, aStr, bStr, alphaStr) => {
    try {
      const l = lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr);
      // In CSS Color Module Level 4 oklab(), 100% corresponds to 0.4 for a and b axes
      const a = aStr.endsWith('%') ? (parseFloat(aStr) / 100) * 0.4 : parseFloat(aStr);
      const b = bStr.endsWith('%') ? (parseFloat(bStr) / 100) * 0.4 : parseFloat(bStr);

      let alpha: number | undefined = undefined;
      if (alphaStr) {
        alpha = alphaStr.endsWith('%') ? parseFloat(alphaStr) / 100 : parseFloat(alphaStr);
      }

      return oklabToRgb(l, a, b, alpha);
    } catch (e) {
      console.error('Failed to parse oklab color:', match, e);
      return match;
    }
  });
}

