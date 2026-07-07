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

type TemplateType = 'donna-elegant' | 'lorna-minimalist' | 'olivia-modern';

export default function ResumeBuilder({ user, settings, onLoginTrigger }: ResumeBuilderProps) {
  // Persistence key
  const storageKey = user ? `jobview_resume_${user.id}` : 'jobview_resume_guest';

  // Load Initial state
  const [resume, setResume] = useState<ResumeData>(() => {
    const saved = localStorage.getItem(storageKey);
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

  const [activeTemplate, setActiveTemplate] = useState<TemplateType>('donna-elegant');
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [activeMode, setActiveMode] = useState<'edit' | 'preview'>('edit'); // Mode toggle for mobile
  const [copied, setCopied] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  
  // Multiple draft persistence states
  const savedListStorageKey = user ? `jobview_saved_resumes_${user.id}` : 'jobview_saved_resumes_guest';
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>(() => {
    const saved = localStorage.getItem(savedListStorageKey);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [saveTitle, setSaveTitle] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSavedList, setShowSavedList] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Sync saved resumes list with localStorage
  useEffect(() => {
    localStorage.setItem(savedListStorageKey, JSON.stringify(savedResumes));
  }, [savedResumes, savedListStorageKey]);

  // Load saved resumes from Supabase if user is logged in
  useEffect(() => {
    if (user) {
      import('../lib/supabaseQueries')
        .then(({ fetchResumesFromSupabase }) => fetchResumesFromSupabase(user.id))
        .then((dbResumes) => {
          if (dbResumes && dbResumes.length > 0) {
            const formatted: SavedResume[] = dbResumes.map((row: any) => ({
              id: row.id,
              name: row.name,
              timestamp: row.timestamp || new Date(row.updated_at || row.created_at || Date.now()).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }),
              data: row.data,
              template: row.template || 'donna-elegant'
            }));
            setSavedResumes(formatted);
          }
        })
        .catch(err => {
          console.warn('Failed to load resumes from Supabase:', err);
        });
    } else {
      // Guest user fallback to localStorage
      const saved = localStorage.getItem('jobview_saved_resumes_guest');
      setSavedResumes(saved ? JSON.parse(saved) : []);
    }
  }, [user]);

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
    
    // Save to Supabase if logged in
    if (user) {
      try {
        const { saveResumeToSupabase } = await import('../lib/supabaseQueries');
        const res = await saveResumeToSupabase(user.id, newSave);
        if (!res.success) {
          console.warn('Could not sync save to Supabase:', res.error);
        }
      } catch (err) {
        console.warn('Supabase save error:', err);
      }
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
    
    // Delete from Supabase if logged in
    if (user) {
      try {
        const { deleteResumeFromSupabase } = await import('../lib/supabaseQueries');
        const res = await deleteResumeFromSupabase(user.id, id);
        if (!res.success) {
          console.warn('Could not sync delete to Supabase:', res.error);
        }
      } catch (err) {
        console.warn('Supabase delete error:', err);
      }
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
    window.print();
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

      // Arrays to store original style states for perfect restoration
      const restoredStyles: { element: HTMLElement; originalContent?: string; href?: string }[] = [];
      const originalInlineStyles = new Map<Element, string>();

      try {
        // 1. Convert all inline <style> tags containing oklch or oklab
        const styleTags = Array.from(document.querySelectorAll('style'));
        for (const tag of styleTags) {
          const css = tag.innerHTML;
          if (css.includes('oklch') || css.includes('oklab')) {
            restoredStyles.push({ element: tag, originalContent: css });
            tag.innerHTML = replaceOklabWithRgb(replaceOklchWithRgb(css));
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

      // Simple delay to let React process zoom reset state before capturing
      setTimeout(() => {
        const opt = {
          margin: 0,
          filename: `${resume.personal.fullName.replace(/\s+/g, '_') || 'Resume'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true,
            logging: false,
            letterRendering: true
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
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
      }, 300);
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
                Personal Details
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={resume.personal.fullName}
                  onChange={(e) => handlePersonalChange('fullName', e.target.value)}
                  placeholder="Shyamchan Roy"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all font-medium text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Professional Title</label>
                <input
                  type="text"
                  value={resume.personal.title}
                  onChange={(e) => handlePersonalChange('title', e.target.value)}
                  placeholder="Senior React Developer"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all font-medium text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={resume.personal.email}
                  onChange={(e) => handlePersonalChange('email', e.target.value)}
                  placeholder="shyamchan25@gmail.com"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all font-medium text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={resume.personal.phone}
                  onChange={(e) => handlePersonalChange('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all font-medium text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Portfolio or Website</label>
                <input
                  type="text"
                  value={resume.personal.website}
                  onChange={(e) => handlePersonalChange('website', e.target.value)}
                  placeholder="https://shyamchan.dev"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all font-medium text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Location</label>
                <input
                  type="text"
                  value={resume.personal.location}
                  onChange={(e) => handlePersonalChange('location', e.target.value)}
                  placeholder="Kolkata, India"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all font-medium text-slate-800"
                />
              </div>
            </div>

            {/* Summary with AI enhancer */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Professional Summary</label>
                <button
                  onClick={() => callGeminiEnhance('summary', resume.personal.summary)}
                  disabled={aiLoading !== null}
                  className="text-[9px] font-extrabold text-teal-600 hover:text-teal-700 flex items-center gap-1 border border-teal-100 hover:border-teal-200 bg-teal-50/50 hover:bg-teal-50 px-2 py-1 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  {aiLoading === 'summary' ? (
                    <div className="w-2.5 h-2.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles size={10} className="stroke-[2.5]" />
                  )}
                  <span>AI Polish</span>
                </button>
              </div>
              <textarea
                value={resume.personal.summary}
                onChange={(e) => handlePersonalChange('summary', e.target.value)}
                placeholder="Brief summary of your professional expertise..."
                rows={4}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all font-medium text-slate-800 leading-relaxed"
              />
            </div>
          </div>

          {/* Section: Experience */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-800 font-display flex items-center gap-1.5">
                <Briefcase size={14} className="text-teal-600" />
                Work Experience
              </h2>
              <button
                onClick={addExperience}
                className="text-[9px] font-black uppercase tracking-wider text-teal-600 hover:text-teal-700 flex items-center gap-1 border border-teal-100 hover:border-teal-200 px-2.5 py-1.5 rounded-lg bg-teal-50/20 hover:bg-teal-50/50 transition-all cursor-pointer"
              >
                <Plus size={11} className="stroke-[3]" />
                <span>Add Position</span>
              </button>
            </div>

            {resume.experience.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">No work experience added yet.</p>
            ) : (
              <div className="space-y-4 divide-y divide-slate-100">
                {resume.experience.map((exp, idx) => (
                  <div key={exp.id} className={`space-y-3 ${idx > 0 ? 'pt-4' : ''}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Position #{idx + 1}</span>
                      <button
                        onClick={() => deleteExperience(exp.id)}
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Company Name</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => handleExperienceChange(exp.id, 'company', e.target.value)}
                          placeholder="e.g. Google India"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Job Title</label>
                        <input
                          type="text"
                          value={exp.position}
                          onChange={(e) => handleExperienceChange(exp.id, 'position', e.target.value)}
                          placeholder="e.g. Senior Product Designer"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Location</label>
                        <input
                          type="text"
                          value={exp.location}
                          onChange={(e) => handleExperienceChange(exp.id, 'location', e.target.value)}
                          placeholder="e.g. Mumbai, India"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Start Date</label>
                        <input
                          type="month"
                          value={exp.startDate}
                          onChange={(e) => handleExperienceChange(exp.id, 'startDate', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">End Date</label>
                        <input
                          type="text"
                          disabled={exp.current}
                          value={exp.current ? 'Present' : exp.endDate}
                          onChange={(e) => handleExperienceChange(exp.id, 'endDate', e.target.value)}
                          placeholder="YYYY-MM"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium text-slate-800 disabled:opacity-50"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 pt-4">
                        <input
                          type="checkbox"
                          id={`exp-curr-${exp.id}`}
                          checked={exp.current}
                          onChange={(e) => handleExperienceChange(exp.id, 'current', e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                        <label htmlFor={`exp-curr-${exp.id}`} className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer">I currently work here</label>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Achievements / Description</label>
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
                        placeholder="• Highlight key accomplishments with metrics...&#10;• Led design system implementation...&#10;• Handled 20% traffic scale..."
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
                Education
              </h2>
              <button
                onClick={addEducation}
                className="text-[9px] font-black uppercase tracking-wider text-teal-600 hover:text-teal-700 flex items-center gap-1 border border-teal-100 hover:border-teal-200 px-2.5 py-1.5 rounded-lg bg-teal-50/20 hover:bg-teal-50/50 transition-all cursor-pointer"
              >
                <Plus size={11} className="stroke-[3]" />
                <span>Add Degree</span>
              </button>
            </div>

            {resume.education.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">No education entries yet.</p>
            ) : (
              <div className="space-y-4 divide-y divide-slate-100">
                {resume.education.map((edu, idx) => (
                  <div key={edu.id} className={`space-y-3 ${idx > 0 ? 'pt-4' : ''}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Education #{idx + 1}</span>
                      <button
                        onClick={() => deleteEducation(edu.id)}
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">School / University</label>
                        <input
                          type="text"
                          value={edu.school}
                          onChange={(e) => handleEducationChange(edu.id, 'school', e.target.value)}
                          placeholder="e.g. IIT Kharagpur"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Degree / Stream</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => handleEducationChange(edu.id, 'degree', e.target.value)}
                          placeholder="e.g. Master in Design"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Location</label>
                        <input
                          type="text"
                          value={edu.location}
                          onChange={(e) => handleEducationChange(edu.id, 'location', e.target.value)}
                          placeholder="e.g. West Bengal, India"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Graduation Date</label>
                        <input
                          type="text"
                          value={edu.endDate}
                          onChange={(e) => handleEducationChange(edu.id, 'endDate', e.target.value)}
                          placeholder="e.g. 2021-06"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Additional info (optional)</label>
                      <input
                        type="text"
                        value={edu.description}
                        onChange={(e) => handleEducationChange(edu.id, 'description', e.target.value)}
                        placeholder="e.g. CGPA 9.2, President of Tech Club"
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium text-slate-800"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Skills */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-800 font-display flex items-center gap-1.5">
                <Award size={14} className="text-teal-600" />
                Technical Skills
              </h2>
              <button
                onClick={() => callGeminiEnhance('skills', resume.skills)}
                disabled={aiLoading !== null}
                className="text-[9px] font-extrabold text-teal-600 hover:text-teal-700 flex items-center gap-1 border border-teal-100 hover:border-teal-200 bg-teal-50/50 hover:bg-teal-50 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
              >
                {aiLoading === 'skills' ? (
                  <div className="w-2.5 h-2.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles size={10} className="stroke-[2.5]" />
                )}
                <span>Refine Keywords</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Skills (Comma-separated)</label>
              <textarea
                value={resume.skills}
                onChange={(e) => setResume(prev => ({ ...prev, skills: e.target.value }))}
                placeholder="React, TypeScript, CSS, UI Design..."
                rows={3}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all font-medium text-slate-800 leading-relaxed"
              />
              <p className="text-[9px] text-slate-400">Separate each skill keyword with a comma so they render as gorgeous tags.</p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Languages (Comma-separated)</label>
              <input
                type="text"
                value={resume.languages || ''}
                onChange={(e) => setResume(prev => ({ ...prev, languages: e.target.value }))}
                placeholder="English (Fluent), Spanish, French..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all font-medium text-slate-800"
              />
              <p className="text-[9px] text-slate-400">List the languages you speak, separated by commas.</p>
            </div>
          </div>

          {/* Section: Projects */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-800 font-display flex items-center gap-1.5">
                <Terminal size={14} className="text-teal-600" />
                Personal Projects
              </h2>
              <button
                onClick={addProject}
                className="text-[9px] font-black uppercase tracking-wider text-teal-600 hover:text-teal-700 flex items-center gap-1 border border-teal-100 hover:border-teal-200 px-2.5 py-1.5 rounded-lg bg-teal-50/20 hover:bg-teal-50/50 transition-all cursor-pointer"
              >
                <Plus size={11} className="stroke-[3]" />
                <span>Add Project</span>
              </button>
            </div>

            {resume.projects.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">No projects added yet.</p>
            ) : (
              <div className="space-y-4 divide-y divide-slate-100">
                {resume.projects.map((proj, idx) => (
                  <div key={proj.id} className={`space-y-3 ${idx > 0 ? 'pt-4' : ''}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Project #{idx + 1}</span>
                      <button
                        onClick={() => deleteProject(proj.id)}
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Project Name</label>
                        <input
                          type="text"
                          value={proj.name}
                          onChange={(e) => handleProjectChange(proj.id, 'name', e.target.value)}
                          placeholder="e.g. DeFi Payment Gateway"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Technologies Used</label>
                        <input
                          type="text"
                          value={proj.technologies}
                          onChange={(e) => handleProjectChange(proj.id, 'technologies', e.target.value)}
                          placeholder="e.g. Solidity, React, Ethers"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium text-slate-800"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Project Link / URL</label>
                        <input
                          type="text"
                          value={proj.link}
                          onChange={(e) => handleProjectChange(proj.id, 'link', e.target.value)}
                          placeholder="e.g. https://github.com/myusername/myproject"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Brief Description</label>
                      <textarea
                        value={proj.description}
                        onChange={(e) => handleProjectChange(proj.id, 'description', e.target.value)}
                        placeholder="Explain what you built and the core challenges you solved..."
                        rows={2}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium text-slate-800 leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: References */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-800 font-display flex items-center gap-1.5">
                <span>🤝</span>
                Professional References
              </h2>
              <button
                onClick={addReference}
                className="text-[9px] font-black uppercase tracking-wider text-teal-600 hover:text-teal-700 flex items-center gap-1 border border-teal-100 hover:border-teal-200 px-2.5 py-1.5 rounded-lg bg-teal-50/20 hover:bg-teal-50/50 transition-all cursor-pointer"
              >
                <Plus size={11} className="stroke-[3]" />
                <span>Add Reference</span>
              </button>
            </div>

            {(!resume.references || resume.references.length === 0) ? (
              <p className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">No references added yet.</p>
            ) : (
              <div className="space-y-4 divide-y divide-slate-100">
                {resume.references.map((ref, idx) => (
                  <div key={ref.id} className={`space-y-3 ${idx > 0 ? 'pt-4' : ''}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Reference #{idx + 1}</span>
                      <button
                        onClick={() => deleteReference(ref.id)}
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Reference Name</label>
                        <input
                          type="text"
                          value={ref.name}
                          onChange={(e) => handleReferenceChange(ref.id, 'name', e.target.value)}
                          placeholder="e.g. Estelle Darcy"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Company & Role</label>
                        <input
                          type="text"
                          value={ref.position}
                          onChange={(e) => handleReferenceChange(ref.id, 'position', e.target.value)}
                          placeholder="e.g. Wardiere Inc. / CEO"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Phone Number</label>
                        <input
                          type="text"
                          value={ref.phone}
                          onChange={(e) => handleReferenceChange(ref.id, 'phone', e.target.value)}
                          placeholder="e.g. +123-456-7890"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Email Address</label>
                        <input
                          type="email"
                          value={ref.email}
                          onChange={(e) => handleReferenceChange(ref.id, 'email', e.target.value)}
                          placeholder="e.g. hello@reallygreatsite.com"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setActiveTemplate('donna-elegant');
                  if (!resume.personal.photo) {
                    handlePersonalChange('photo', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400');
                  }
                }}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                  activeTemplate === 'donna-elegant'
                    ? 'border-teal-600 bg-teal-50/50 text-teal-800 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <span className="block text-xs font-black">Donna Elegant</span>
                  <span className="block text-[9px] font-medium text-teal-600">Premium split layout style</span>
                </div>
                {activeTemplate === 'donna-elegant' && <div className="w-2.5 h-2.5 rounded-full bg-teal-600 shrink-0 ml-2" />}
              </button>

              <button
                onClick={() => {
                  setActiveTemplate('lorna-minimalist');
                  if (!resume.personal.photo) {
                    handlePersonalChange('photo', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400');
                  }
                }}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                  activeTemplate === 'lorna-minimalist'
                    ? 'border-slate-900 bg-slate-50 text-slate-900 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <span className="block text-xs font-black">Lorna Minimalist</span>
                  <span className="block text-[9px] font-medium text-slate-500">Elegant centered circle layout</span>
                </div>
                {activeTemplate === 'lorna-minimalist' && <div className="w-2.5 h-2.5 rounded-full bg-slate-900 shrink-0 ml-2" />}
              </button>

              <button
                onClick={() => {
                  setActiveTemplate('olivia-modern');
                  if (!resume.personal.photo) {
                    handlePersonalChange('photo', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400');
                  }
                }}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                  activeTemplate === 'olivia-modern'
                    ? 'border-amber-700 bg-amber-50/55 text-amber-900 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <span className="block text-xs font-black">Olivia Modern</span>
                  <span className="block text-[9px] font-medium text-amber-700">Modern grey sidebar style</span>
                </div>
                {activeTemplate === 'olivia-modern' && <div className="w-2.5 h-2.5 rounded-full bg-amber-700 shrink-0 ml-2" />}
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
                    onClick={downloadPDF}
                    disabled={pdfDownloading}
                    title={pdfDownloading ? 'Downloading PDF...' : 'Download PDF'}
                    className={`p-1 px-2.5 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-600 rounded-lg text-xs font-bold text-teal-600 dark:text-teal-400 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-current transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                      pdfDownloading ? 'cursor-not-allowed opacity-80 animate-pulse' : ''
                    }`}
                  >
                    {pdfDownloading ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <Download size={13} className="stroke-[2.5]" />
                    )}
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
            {/* Donna Elegant Template */}
            {activeTemplate === 'donna-elegant' && (
              <div className="text-slate-800 font-sans leading-relaxed text-[11px] bg-white p-6 print:p-0">
                {/* Header layout: Donna Elegant Custom Crescent-Masked Banner */}
                <div className="relative flex items-stretch h-[140px] w-full mb-8 select-none print:mb-6">
                  {/* Background light blue-gray banner */}
                  <div className="absolute right-0 top-0 bottom-0 left-[18%] bg-[#dae1e7] rounded-r-2xl z-0 print:rounded-none" />
                  
                  {/* Elegant Crescent Cutting Circle (White Mask) */}
                  <div className="absolute left-[8%] top-1/2 -translate-y-1/2 w-36 h-36 rounded-full bg-white z-10 shadow-xs flex items-center justify-center">
                    {/* Inner Circular Portrait */}
                    <div className="w-28 h-28 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                      {resume.personal.photo ? (
                        <img src={resume.personal.photo} alt="Profile" className="w-full h-full object-cover animate-fade-in" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 font-bold text-2xl">👤</div>
                      )}
                    </div>
                  </div>

                  {/* Name & Title text block inside the banner */}
                  <div className="relative z-20 ml-[32%] flex flex-col justify-center pl-4 py-4">
                    <h1 className="text-2xl font-black tracking-[0.15em] text-slate-900 leading-none uppercase">
                      {resume.personal.fullName || 'DONNA STROUPE'}
                    </h1>
                    <p className="text-[11.5px] font-bold tracking-widest text-slate-600 uppercase mt-2.5">
                      {resume.personal.title || 'Sales Representative'}
                    </p>
                  </div>
                </div>

                {/* Body Columns layout */}
                <div className="grid grid-cols-12 gap-8 w-full">
                  {/* Left Sidebar Column - 33% (col-span-4) */}
                  <div className="col-span-4 bg-[#dae1e7] rounded-t-[40px] rounded-b-[24px] p-6 pt-8 space-y-6 flex flex-col self-start min-h-[620px] print:rounded-t-[40px] print:rounded-b-none">
                    {/* Contact details */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-slate-800 text-[10px] font-semibold">
                        <Phone size={13} className="text-slate-800 stroke-[2] shrink-0" />
                        <span>{resume.personal.phone || '+123-456-7890'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-800 text-[10px] font-semibold">
                        <Mail size={13} className="text-slate-800 stroke-[2] shrink-0" />
                        <span className="break-all">{resume.personal.email || 'hello@reallygreatsite.com'}</span>
                      </div>
                      {resume.personal.website && (
                        <div className="flex items-center gap-3 text-slate-800 text-[10px] font-semibold">
                          <Globe size={13} className="text-slate-800 stroke-[2] shrink-0" />
                          <span className="break-all">{resume.personal.website}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-slate-800 text-[10px] font-semibold">
                        <MapPin size={13} className="text-slate-800 stroke-[2] shrink-0" />
                        <span className="leading-tight">{resume.personal.location || '123 Anywhere St., Any City'}</span>
                      </div>
                    </div>

                    {/* Education section */}
                    {resume.education.length > 0 && (
                      <div className="space-y-2">
                        <div>
                          <h3 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-900">EDUCATION</h3>
                          <div className="border-t border-slate-400 mt-1 mb-3" />
                        </div>
                        <div className="space-y-4">
                          {resume.education.map((edu) => (
                            <div key={edu.id} className="space-y-1">
                              <p className="font-extrabold text-slate-900 leading-tight text-[10.5px]">{edu.degree || 'BA Sales and Commerce'}</p>
                              <p className="text-[10px] font-bold text-slate-700">{edu.school || 'Wardiere University'}</p>
                              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{edu.startDate && `${edu.startDate} - `}{edu.endDate || '20XX - 20XX'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills section */}
                    {parsedSkills.length > 0 && (
                      <div className="space-y-2">
                        <div>
                          <h3 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-900">SKILLS</h3>
                          <div className="border-t border-slate-400 mt-1 mb-3" />
                        </div>
                        <ul className="space-y-2 text-slate-800 font-semibold text-[10px]">
                          {parsedSkills.map((skill, sIdx) => (
                            <li key={sIdx} className="flex items-start gap-2">
                              <span className="text-slate-900 text-xs leading-none mt-0.5">•</span>
                              <span className="leading-tight">{skill}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Languages section */}
                    {resume.languages && (
                      <div className="space-y-2">
                        <div>
                          <h3 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-900">LANGUAGE</h3>
                          <div className="border-t border-slate-400 mt-1 mb-3" />
                        </div>
                        <ul className="space-y-2 text-slate-800 font-semibold text-[10.5px]">
                          {resume.languages.split(',').map((lang, lIdx) => (
                            <li key={lIdx} className="leading-tight">{lang.trim()}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Right Main Content Column - 67% (col-span-8) */}
                  <div className="col-span-8 bg-white space-y-6 pl-2">
                    {/* About me / Profile summary */}
                    {resume.personal.summary && (
                      <div className="space-y-2">
                        <div>
                          <h3 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-900">About Me</h3>
                          <div className="border-t border-slate-300 mt-1 mb-3" />
                        </div>
                        <p className="text-slate-700 leading-relaxed text-[10.5px] text-justify font-medium">
                          {resume.personal.summary}
                        </p>
                      </div>
                    )}

                    {/* Work Experience */}
                    {resume.experience.length > 0 && (
                      <div className="space-y-2">
                        <div>
                          <h3 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-900">WORK EXPERIENCE</h3>
                          <div className="border-t border-slate-300 mt-1 mb-3" />
                        </div>
                        <div className="space-y-4">
                          {resume.experience.map((exp) => (
                            <div key={exp.id} className="space-y-1">
                              <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider">
                                {exp.startDate || 'Aug 20XX'} — {exp.endDate || 'present'}
                              </p>
                              <p className="text-[10px] font-bold text-slate-500 italic">{exp.company || 'Timmerman Industries'}</p>
                              <h4 className="text-[11px] font-black text-slate-900 leading-snug">{exp.position || 'Consumer Goods Seller'}</h4>
                              {exp.description && (
                                <ul className="space-y-1 text-[10px] text-slate-700 leading-relaxed font-medium mt-1.5 pl-1.5">
                                  {exp.description.split('\n').map((bullet, bIdx) => {
                                    const cleaned = bullet.replace(/^[•\-\s*]+/, '').trim();
                                    if (!cleaned) return null;
                                    return (
                                      <li key={bIdx} className="flex items-start gap-2">
                                        <span className="text-slate-800 text-[10px] mt-0.5">•</span>
                                        <span>{cleaned}</span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Featured Projects (if any) */}
                    {resume.projects.length > 0 && (
                      <div className="space-y-2">
                        <div>
                          <h3 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-900">Featured Projects</h3>
                          <div className="border-t border-slate-300 mt-1 mb-3" />
                        </div>
                        <div className="space-y-4">
                          {resume.projects.map((proj) => (
                            <div key={proj.id} className="space-y-1">
                              <div className="flex justify-between items-baseline">
                                <h4 className="text-[10.5px] font-extrabold text-slate-900">{proj.name || 'Project Name'}</h4>
                                {proj.link && <span className="text-[9px] text-slate-400 font-mono">{proj.link}</span>}
                              </div>
                              {proj.technologies && <p className="text-[9px] text-slate-400 font-mono font-bold">Tech: {proj.technologies}</p>}
                              {proj.description && <p className="text-slate-700 text-[10px] leading-relaxed font-medium">{proj.description}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* References section */}
                    {resume.references && resume.references.length > 0 && (
                      <div className="space-y-2">
                        <div>
                          <h3 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-900">REFERENCES</h3>
                          <div className="border-t border-slate-300 mt-1 mb-3" />
                        </div>
                        <div className="grid grid-cols-2 gap-6 mt-3">
                          {resume.references.map((ref) => (
                            <div key={ref.id} className="space-y-1 font-medium text-[10px] text-slate-700">
                              <p className="font-extrabold text-slate-900 text-[11px]">{ref.name}</p>
                              <p className="text-slate-500 font-bold text-[9px] uppercase tracking-wider">{ref.position}</p>
                              <p className="text-slate-600 mt-1">
                                <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px] mr-1">Phone:</span>
                                {ref.phone}
                              </p>
                              <p className="text-slate-600 break-all">
                                <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px] mr-1">Email:</span>
                                {ref.email}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Lorna Minimalist Template */}
            {activeTemplate === 'lorna-minimalist' && (
              <div className="text-slate-800 font-sans leading-relaxed text-[11px] bg-white p-6 print:p-0">
                <div className="flex items-center w-full mb-8">
                  {/* Left line */}
                  <div className="w-12 h-[1px] bg-slate-300 shrink-0" />
                  {/* Photo with thin border/ring */}
                  <div className="w-24 h-24 rounded-full border border-slate-900 overflow-hidden shrink-0 mx-4 shadow-xs flex items-center justify-center bg-slate-50">
                    {resume.personal.photo ? (
                      <img src={resume.personal.photo} alt="Profile" className="w-full h-full object-cover animate-fade-in" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-350 font-bold text-xl">👤</div>
                    )}
                  </div>
                  {/* Name, Title, and the right line */}
                  <div className="flex-1 flex flex-col justify-end pr-2 relative">
                    <div className="pb-2.5 pl-4">
                      <h1 className="text-2xl font-bold tracking-[0.1em] text-slate-950 uppercase leading-none">
                        {resume.personal.fullName || 'LORNA ALVARADO'}
                      </h1>
                      <p className="text-[10.5px] font-medium text-slate-600 uppercase tracking-widest mt-1.5">
                        {resume.personal.title || 'Sales Representative'}
                      </p>
                    </div>
                    {/* The line going right */}
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-slate-300" />
                  </div>
                </div>

                {/* Two-column layout */}
                <div className="grid grid-cols-12 gap-8 pt-4">
                  {/* Left Sidebar (35% equivalent) */}
                  <div className="col-span-4 space-y-6 pr-2">
                    {/* Contact */}
                    <div className="space-y-2">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 mb-2">CONTACT</h3>
                      <div className="space-y-2 text-[9.5px] text-slate-600 font-semibold">
                        {resume.personal.phone && (
                          <p className="flex items-center gap-2">
                            <Phone size={11} className="text-slate-500 shrink-0" />
                            <span>{resume.personal.phone}</span>
                          </p>
                        )}
                        {resume.personal.email && (
                          <p className="flex items-center gap-2">
                            <Mail size={11} className="text-slate-500 shrink-0" />
                            <span className="break-all">{resume.personal.email}</span>
                          </p>
                        )}
                        {resume.personal.website && (
                          <p className="flex items-center gap-2">
                            <Globe size={11} className="text-slate-500 shrink-0" />
                            <span className="break-all">{resume.personal.website}</span>
                          </p>
                        )}
                        {resume.personal.location && (
                          <p className="flex items-center gap-2">
                            <MapPin size={11} className="text-slate-500 shrink-0" />
                            <span>{resume.personal.location}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Education */}
                    {resume.education.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 mb-2">EDUCATION</h3>
                        <div className="space-y-3.5 text-[9.5px]">
                          {resume.education.map((edu) => (
                            <div key={edu.id} className="space-y-0.5">
                              <p className="font-extrabold text-slate-900 leading-snug">{edu.school || 'Borcelle University'}</p>
                              <p className="text-slate-600 font-bold">{edu.degree || 'Bachelor of Business Management'}</p>
                              <p className="text-slate-400 font-bold text-[8.5px] tracking-wide">{edu.startDate || '2020'} - {edu.endDate || '2023'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills */}
                    {parsedSkills.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 mb-2">SKILLS</h3>
                        <ul className="list-disc pl-3.5 space-y-1.5 text-[9.5px] text-slate-600 font-semibold">
                          {parsedSkills.map((skill, sIdx) => (
                            <li key={sIdx} className="leading-tight">{skill}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Language */}
                    {resume.languages && (
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 mb-2">LANGUAGE</h3>
                        <ul className="list-disc pl-3.5 space-y-1.5 text-[9.5px] text-slate-600 font-semibold">
                          {resume.languages.split(',').map((lang, lIdx) => (
                            <li key={lIdx} className="leading-tight">{lang.trim()}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Right Main Content Column (65% equivalent) */}
                  <div className="col-span-8 space-y-6 pl-2">
                    {/* Summary */}
                    {resume.personal.summary && (
                      <div className="space-y-1.5">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 mb-1.5">SUMMARY</h3>
                        <p className="text-slate-700 leading-relaxed text-[10px] text-justify font-medium">
                          {resume.personal.summary}
                        </p>
                      </div>
                    )}

                    {/* Work Experience */}
                    {resume.experience.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 mb-2">WORK EXPERIENCE</h3>
                        <div className="space-y-4">
                          {resume.experience.map((exp) => (
                            <div key={exp.id} className="space-y-1">
                              <p className="text-[9px] text-slate-400 font-bold">
                                ({exp.startDate || '2020'} – {exp.endDate || '2023'})
                              </p>
                              <h4 className="text-[10.5px] font-black text-slate-900 leading-snug">
                                {exp.position || 'Sales Representative'} <span className="text-slate-350 font-normal mx-1">|</span> <span className="text-slate-700 font-bold">{exp.company || 'Timmerman Industries'}</span>
                              </h4>
                              {exp.description && (
                                <ul className="list-disc pl-3.5 space-y-1 text-[9.5px] text-slate-600 leading-relaxed font-semibold mt-1">
                                  {exp.description.split('\n').map((bullet, bIdx) => {
                                    const cleaned = bullet.replace(/^[•\-\s*]+/, '').trim();
                                    if (!cleaned) return null;
                                    return (
                                      <li key={bIdx}>
                                        {cleaned}
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Featured Projects (if any) */}
                    {resume.projects.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 mb-2">KEY INITIATIVES & PROJECTS</h3>
                        <div className="space-y-3.5">
                          {resume.projects.map((proj) => (
                            <div key={proj.id} className="space-y-0.5">
                              <div className="flex justify-between items-baseline">
                                <h4 className="text-[10.5px] font-black text-slate-900">{proj.name || 'Project Name'}</h4>
                                {proj.link && <span className="text-[9px] text-slate-400 font-mono">{proj.link}</span>}
                              </div>
                              {proj.technologies && <p className="text-[9px] text-slate-400 font-mono font-bold">Stack: {proj.technologies}</p>}
                              {proj.description && <p className="text-slate-700 text-[9.5px] leading-relaxed font-semibold">{proj.description}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* References */}
                    {resume.references && resume.references.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 mb-2">REFERENCES</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {resume.references.map((ref) => (
                            <div key={ref.id} className="space-y-0.5 text-[9.5px] text-slate-600 font-semibold">
                              <p className="font-extrabold text-slate-900 text-[10.5px]">{ref.name}</p>
                              <p className="text-slate-500 font-bold text-[8.5px] uppercase tracking-wider">{ref.position}</p>
                              <p className="text-slate-500 mt-1">
                                <span className="font-black text-slate-400 uppercase tracking-wider text-[7.5px] mr-1">Phone:</span>
                                {ref.phone}
                              </p>
                              <p className="text-slate-500 break-all">
                                <span className="font-black text-slate-400 uppercase tracking-wider text-[7.5px] mr-1">Email:</span>
                                {ref.email}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Olivia Modern Template */}
            {activeTemplate === 'olivia-modern' && (
              <div className="text-slate-800 font-sans leading-relaxed text-[11px] bg-white p-0 print:p-0">
                <div className="grid grid-cols-12 items-stretch min-h-[960px]">
                  {/* Left Sidebar Column - 33.3% (col-span-4) */}
                  <div className="col-span-4 bg-slate-50/90 border-r border-slate-100 p-5 pt-8 pb-8 space-y-6 flex flex-col">
                    {/* Circle Photo */}
                    <div className="flex justify-center mb-2">
                      <div className="w-24 h-24 rounded-full border-2 border-slate-300 overflow-hidden bg-white shadow-xs">
                        {resume.personal.photo ? (
                          <img src={resume.personal.photo} alt="Profile" className="w-full h-full object-cover animate-fade-in" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-350 font-bold text-2xl">👤</div>
                        )}
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-800 pb-1 border-b border-slate-300/80">Contact</h3>
                      <div className="space-y-2.5 text-[9.5px] text-slate-600 font-semibold pt-1">
                        {resume.personal.phone && (
                          <p className="flex items-center gap-2">
                            <Phone size={10} className="text-slate-500 shrink-0" />
                            <span>{resume.personal.phone}</span>
                          </p>
                        )}
                        {resume.personal.email && (
                          <p className="flex items-center gap-2">
                            <Mail size={10} className="text-slate-500 shrink-0" />
                            <span className="break-all">{resume.personal.email}</span>
                          </p>
                        )}
                        {resume.personal.website && (
                          <p className="flex items-center gap-2">
                            <Globe size={10} className="text-slate-500 shrink-0" />
                            <span className="break-all">{resume.personal.website}</span>
                          </p>
                        )}
                        {resume.personal.location && (
                          <p className="flex items-center gap-2">
                            <MapPin size={10} className="text-slate-500 shrink-0" />
                            <span>{resume.personal.location}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Education */}
                    {resume.education.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-800 pb-1 border-b border-slate-300/80">Education</h3>
                        <div className="space-y-3.5 text-[9.5px] pt-1">
                          {resume.education.map((edu) => (
                            <div key={edu.id} className="space-y-1">
                              <span className="px-2 py-0.5 rounded-sm bg-amber-100/70 text-amber-900 text-[8.5px] font-black tracking-wide inline-block">
                                {edu.startDate || '2020'} - {edu.endDate || '2023'}
                              </span>
                              <p className="font-extrabold text-slate-900 leading-snug">{edu.school || 'Borcelle University'}</p>
                              <p className="text-slate-600 font-bold text-[9px]">{edu.degree || 'Bachelor of Business Management'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills */}
                    {parsedSkills.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-800 pb-1 border-b border-slate-300/80">Skills</h3>
                        <div className="space-y-1.5 text-[9.5px] text-slate-600 font-bold pl-0.5 pt-1">
                          {parsedSkills.map((skill, sIdx) => (
                            <p key={sIdx} className="leading-tight">{skill}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Languages */}
                    {resume.languages && (
                      <div className="space-y-2">
                        <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-800 pb-1 border-b border-slate-300/80">Language</h3>
                        <div className="space-y-1.5 text-[9.5px] text-slate-600 font-bold pl-0.5 pt-1">
                          {resume.languages.split(',').map((lang, lIdx) => (
                            <p key={lIdx} className="leading-tight">{lang.trim()}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - 66.7% (col-span-8) */}
                  <div className="col-span-8 bg-white p-6 pt-8 pb-8 space-y-6 pl-5 flex flex-col">
                    {/* Header: Name and Title */}
                    <div className="mb-2 select-none">
                      <h1 className="text-2xl tracking-[0.1em] text-slate-900 uppercase">
                        <span className="font-light">{(resume.personal.fullName || 'OLIVIA SANCHEZ').split(' ')[0]}</span>{' '}
                        <span className="font-black">{(resume.personal.fullName || 'OLIVIA SANCHEZ').split(' ').slice(1).join(' ')}</span>
                      </h1>
                      <p className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-[0.2em] mt-1.5">
                        {resume.personal.title || 'Product Designer'}
                      </p>
                    </div>

                    {/* About me */}
                    {resume.personal.summary && (
                      <div className="space-y-2">
                        <div>
                          <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-900">About Me</h3>
                          <div className="border-t border-slate-300/80 mt-1 mb-2.5" />
                        </div>
                        <p className="text-slate-700 leading-relaxed text-[10px] text-justify font-medium">
                          {resume.personal.summary}
                        </p>
                      </div>
                    )}

                    {/* Experience */}
                    {resume.experience.length > 0 && (
                      <div className="space-y-2">
                        <div>
                          <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-900">Experience</h3>
                          <div className="border-t border-slate-300/80 mt-1 mb-2.5" />
                        </div>
                        <div className="space-y-4">
                          {resume.experience.map((exp) => (
                            <div key={exp.id} className="space-y-1">
                              <div className="flex justify-between items-baseline">
                                <h4 className="text-[11px] font-black text-slate-900 leading-snug">{exp.company || 'Arowwai Industries'}</h4>
                                <span className="text-[9.5px] font-bold text-slate-400">{exp.startDate} — {exp.endDate}</span>
                              </div>
                              <p className="text-[9px] font-bold text-slate-400 italic">{exp.position || 'Product Designer'} {exp.location ? `| ${exp.location}` : ''}</p>
                              {exp.description && (
                                <p className="text-slate-600 text-[9.5px] leading-relaxed font-semibold mt-1">
                                  {exp.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Featured Projects */}
                    {resume.projects.length > 0 && (
                      <div className="space-y-2">
                        <div>
                          <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-900">Featured Projects</h3>
                          <div className="border-t border-slate-300/80 mt-1 mb-2.5" />
                        </div>
                        <div className="space-y-3.5">
                          {resume.projects.map((proj) => (
                            <div key={proj.id} className="space-y-0.5">
                              <div className="flex justify-between items-baseline">
                                <h4 className="text-[10.5px] font-black text-slate-900">{proj.name || 'Project Name'}</h4>
                                {proj.link && <span className="text-[9px] text-slate-400 font-mono">{proj.link}</span>}
                              </div>
                              {proj.technologies && <p className="text-[9px] text-slate-400 font-mono font-bold">Tech: {proj.technologies}</p>}
                              {proj.description && <p className="text-slate-700 text-[9.5px] leading-relaxed font-semibold">{proj.description}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* References */}
                    {resume.references && resume.references.length > 0 && (
                      <div className="space-y-2">
                        <div>
                          <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-900">References</h3>
                          <div className="border-t border-slate-300/80 mt-1 mb-2.5" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-1">
                          {resume.references.map((ref) => (
                            <div key={ref.id} className="space-y-0.5 text-[9.5px] text-slate-600 font-semibold">
                              <p className="font-extrabold text-slate-900 text-[10.5px]">{ref.name}</p>
                              <p className="text-slate-500 font-bold text-[8.5px] uppercase tracking-wider">{ref.position}</p>
                              <p className="text-slate-500 mt-1">
                                <span className="font-black text-slate-400 uppercase tracking-wider text-[7.5px] mr-1">Phone:</span>
                                {ref.phone}
                              </p>
                              <p className="text-slate-500 break-all">
                                <span className="font-black text-slate-400 uppercase tracking-wider text-[7.5px] mr-1">Email:</span>
                                {ref.email}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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

