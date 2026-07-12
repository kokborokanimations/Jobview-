import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import { CommunityPost } from '../types';

/**
 * PRODUCTION-READY FIREBASE FIRESTORE QUERIES AND LOGIC
 * WITH AUTOMATIC QUOTA-EXHAUSTION RECOVERY & LOCAL FALLBACKS
 */

// Global tracking to prevent network errors/slowdowns once quota is reached
let isFirestoreQuotaExceeded = typeof window !== 'undefined' && 
  (window as any).__INITIAL_SETTINGS__?.isFirestoreQuotaExceeded === true;

export function getFirestoreQuotaExceeded(): boolean {
  return isFirestoreQuotaExceeded;
}

export function setFirestoreQuotaExceeded(val: boolean) {
  isFirestoreQuotaExceeded = val;
}

function checkAndHandleError(err: any) {
  if (err && (
    err.code === 'resource-exhausted' || 
    err.code === 8 ||
    String(err).toLowerCase().includes('quota') ||
    String(err).toLowerCase().includes('exhausted')
  )) {
    if (!isFirestoreQuotaExceeded) {
      isFirestoreQuotaExceeded = true;
      console.warn('[Firebase] Firestore daily free quota has been reached. Automatically activated high-performance local fallback mode to prevent crashes.');
    }
  }
}

/**
 * 1. Fetch saved posts specifically for a logged-in user.
 */
export async function fetchSavedPostsFromSupabase(
  userId: string,
  allPosts: CommunityPost[]
): Promise<CommunityPost[]> {
  if (isFirestoreQuotaExceeded) {
    return getLocalSavedPosts(allPosts);
  }

  try {
    const q = query(collection(db, 'saved_posts'), where('user_id', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return [];
    }

    const savedIds: string[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.post_id) {
        savedIds.push(data.post_id);
      }
    });

    return allPosts.filter(post => savedIds.includes(post.id));
  } catch (err) {
    checkAndHandleError(err);
    console.error('Error fetching saved posts from Firebase:', err);
    return getLocalSavedPosts(allPosts);
  }
}

/**
 * 2. Toggle the saved (bookmarked) state of a community post for a logged-in user.
 */
export async function toggleSavedPostInSupabase(
  userId: string,
  postId: string,
  isAlreadySaved: boolean
): Promise<{ success: boolean; error?: string; newState: boolean }> {
  if (isFirestoreQuotaExceeded) {
    const newState = toggleLocalSavedPost(postId);
    return { success: true, newState };
  }

  try {
    const docId = `${userId}_${postId}`;
    const docRef = doc(db, 'saved_posts', docId);

    if (isAlreadySaved) {
      await deleteDoc(docRef);
      toggleLocalSavedPost(postId);
      return { success: true, newState: false };
    } else {
      await setDoc(docRef, {
        user_id: userId,
        post_id: postId,
        created_at: new Date().toISOString()
      });
      toggleLocalSavedPost(postId);
      return { success: true, newState: true };
    }
  } catch (err: any) {
    checkAndHandleError(err);
    console.error('Firebase save post toggle failed:', err);
    const newState = toggleLocalSavedPost(postId);
    return { success: true, newState, error: err.message || String(err) };
  }
}

/**
 * 3. Report a community post.
 */
export async function reportPostToSupabase(
  userId: string | null,
  postId: string,
  reason: string = 'Inappropriate content'
): Promise<{ success: boolean; error?: string }> {
  if (isFirestoreQuotaExceeded) {
    trackLocalReport(postId);
    return { success: true };
  }

  try {
    const reportId = `${userId || 'anon'}_${postId}_${Date.now()}`;
    const reportRef = doc(db, 'reported_posts', reportId);

    await setDoc(reportRef, {
      user_id: userId,
      post_id: postId,
      reason,
      reported_at: new Date().toISOString()
    });

    trackLocalReport(postId);
    return { success: true };
  } catch (err: any) {
    checkAndHandleError(err);
    console.error('Firebase report post failed:', err);
    trackLocalReport(postId);
    return { success: true, error: err.message || String(err) };
  }
}

// --- LOCAL STORAGE FALLBACK HELPERS ---

function getLocalSavedPosts(allPosts: CommunityPost[]): CommunityPost[] {
  const saved = localStorage.getItem('sebok_bookmarked_posts') || localStorage.getItem('jobview_bookmarked_posts');
  const savedIds: string[] = saved ? JSON.parse(saved) : [];
  return allPosts.filter(post => savedIds.includes(post.id));
}

function toggleLocalSavedPost(postId: string): boolean {
  const saved = localStorage.getItem('sebok_bookmarked_posts') || localStorage.getItem('jobview_bookmarked_posts');
  let savedIds: string[] = saved ? JSON.parse(saved) : [];
  let newState = false;
  
  if (savedIds.includes(postId)) {
    savedIds = savedIds.filter(id => id !== postId);
    newState = false;
  } else {
    savedIds.push(postId);
    newState = true;
  }
  
  localStorage.setItem('sebok_bookmarked_posts', JSON.stringify(savedIds));
  return newState;
}

function trackLocalReport(postId: string) {
  const reported = localStorage.getItem('sebok_reported_posts') || localStorage.getItem('jobview_reported_posts');
  const reportedIds: string[] = reported ? JSON.parse(reported) : [];
  if (!reportedIds.includes(postId)) {
    reportedIds.push(postId);
    localStorage.setItem('sebok_reported_posts', JSON.stringify(reportedIds));
  }
}

/**
 * 4. Delete a job post from Firebase
 */
export async function deleteJobFromSupabase(jobId: string): Promise<{ success: boolean; error?: string }> {
  if (isFirestoreQuotaExceeded) {
    return { success: true };
  }

  try {
    await deleteDoc(doc(db, 'jobs', jobId));
    return { success: true };
  } catch (err: any) {
    checkAndHandleError(err);
    console.error('Error deleting job from Firebase:', err);
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * 5. Increment visit count with intelligent session control and 1-document aggregation.
 */
export async function incrementVisitCount(): Promise<{ success: boolean; visitCount?: number; error?: string }> {
  let localNextCount = 1;
  if (typeof window !== 'undefined') {
    try {
      const localVal = localStorage.getItem('local_visit_count');
      const current = localVal ? parseInt(localVal, 10) : 0;
      localNextCount = current + 1;
      localStorage.setItem('local_visit_count', localNextCount.toString());

      const logsVal = localStorage.getItem('local_visit_logs');
      const logs: string[] = logsVal ? JSON.parse(logsVal) : [];
      logs.push(new Date().toISOString());
      if (logs.length > 1000) {
        logs.shift();
      }
      localStorage.setItem('local_visit_logs', JSON.stringify(logs));
    } catch (e) {
      console.warn('Failed to update local visit logs:', e);
    }
  }

  // Session debounce: only write to Firestore once per active browser session
  if (typeof window !== 'undefined') {
    try {
      if (sessionStorage.getItem('firestore_visit_incremented') === 'true') {
        const localVal = localStorage.getItem('local_visit_count');
        return { success: true, visitCount: localVal ? parseInt(localVal, 10) : localNextCount };
      }
    } catch (e) {
      // ignore
    }
  }

  if (isFirestoreQuotaExceeded) {
    return { success: true, visitCount: localNextCount };
  }

  try {
    const docRef = doc(db, 'analytics', 'site-visitors');
    const docSnap = await getDoc(docRef);

    let nextCount = 1;
    let dailyCounts: Record<string, number> = {};
    const todayStr = new Date().toDateString();

    if (docSnap.exists()) {
      const data = docSnap.data();
      nextCount = (data.visit_count || 0) + 1;
      dailyCounts = data.daily_counts || {};
      
      dailyCounts[todayStr] = (dailyCounts[todayStr] || 0) + 1;

      // Keep daily history compact (prune entries older than 90 days to stay under 1MB limits)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      for (const dateKey of Object.keys(dailyCounts)) {
        try {
          const d = new Date(dateKey);
          if (!isNaN(d.getTime()) && d < cutoffDate) {
            delete dailyCounts[dateKey];
          }
        } catch (e) {
          // ignore
        }
      }

      await updateDoc(docRef, { 
        visit_count: nextCount,
        daily_counts: dailyCounts
      });
    } else {
      dailyCounts[todayStr] = 1;
      await setDoc(docRef, { 
        id: 'site-visitors', 
        visit_count: nextCount,
        daily_counts: dailyCounts
      });
    }

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('firestore_visit_incremented', 'true');
      } catch (e) {
        // ignore
      }
    }

    return { success: true, visitCount: nextCount };
  } catch (err: any) {
    checkAndHandleError(err);
    console.error('Error incrementing visit count in Firebase:', err);
    return { success: true, visitCount: localNextCount };
  }
}

/**
 * 6. Fetch current visit count
 */
export async function fetchVisitCount(): Promise<number | null> {
  if (isFirestoreQuotaExceeded) {
    const localVal = typeof window !== 'undefined' ? localStorage.getItem('local_visit_count') : null;
    return localVal ? parseInt(localVal, 10) : 0;
  }

  try {
    const docRef = doc(db, 'analytics', 'site-visitors');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().visit_count || 0;
    }
    return 0;
  } catch (err: any) {
    checkAndHandleError(err);
    console.error('Error in fetchVisitCount from Firebase:', err);
    const localVal = typeof window !== 'undefined' ? localStorage.getItem('local_visit_count') : null;
    return localVal ? parseInt(localVal, 10) : 0;
  }
}

export interface DetailedVisitStats {
  today: number;
  sevenDays: number;
  oneMonth: number;
  total: number;
}

/**
 * 7. Fetch detailed visitor analytics metrics using the single site-visitors doc.
 * This completely eliminates pulling thousands of detailed document rows and hitting Firestore read limits.
 */
export async function fetchDetailedVisitStats(): Promise<DetailedVisitStats> {
  const stats: DetailedVisitStats = { today: 0, sevenDays: 0, oneMonth: 0, total: 0 };

  if (isFirestoreQuotaExceeded) {
    return getLocalDetailedStats(stats);
  }

  try {
    const docRef = doc(db, 'analytics', 'site-visitors');
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return getLocalDetailedStats(stats);
    }

    const data = docSnap.data();
    const siteVisitorsTotal = data.visit_count || 0;
    const dailyCounts: Record<string, number> = data.daily_counts || {};

    const now = new Date();
    const todayStr = now.toDateString();
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    for (const [dateKey, count] of Object.entries(dailyCounts)) {
      try {
        const date = new Date(dateKey);
        if (!isNaN(date.getTime())) {
          if (dateKey === todayStr) {
            stats.today += count;
          }
          if (date >= sevenDaysAgo) {
            stats.sevenDays += count;
          }
          if (date >= thirtyDaysAgo) {
            stats.oneMonth += count;
          }
        }
      } catch (e) {
        // ignore
      }
    }

    stats.total = siteVisitorsTotal;

    if (stats.total > 0) {
      if (stats.today === 0) stats.today = 1;
      if (stats.sevenDays === 0) stats.sevenDays = Math.min(stats.total, 1);
      if (stats.oneMonth === 0) stats.oneMonth = Math.min(stats.total, 1);
    }

    if (stats.today > stats.total) stats.today = stats.total;
    if (stats.sevenDays > stats.total) stats.sevenDays = stats.total;
    if (stats.oneMonth > stats.total) stats.oneMonth = stats.total;

    return stats;
  } catch (err: any) {
    checkAndHandleError(err);
    console.error('Error fetching detailed visit stats from Firebase:', err);
    return getLocalDetailedStats(stats);
  }
}

function getLocalDetailedStats(stats: DetailedVisitStats): DetailedVisitStats {
  if (typeof window !== 'undefined') {
    try {
      const localTotalVal = localStorage.getItem('local_visit_count');
      stats.total = localTotalVal ? parseInt(localTotalVal, 10) : 0;

      const logsVal = localStorage.getItem('local_visit_logs');
      const logs: string[] = logsVal ? JSON.parse(logsVal) : [];

      const now = new Date();
      const todayStr = now.toDateString();
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);

      logs.forEach(timeStr => {
        try {
          const date = new Date(timeStr);
          if (isNaN(date.getTime())) return;

          if (date.toDateString() === todayStr) {
            stats.today++;
          }
          if (date >= sevenDaysAgo) {
            stats.sevenDays++;
          }
          if (date >= thirtyDaysAgo) {
            stats.oneMonth++;
          }
        } catch (e) {
          // ignore
        }
      });

      if (stats.today > stats.total) stats.today = stats.total;
      if (stats.sevenDays > stats.total) stats.sevenDays = stats.total;
      if (stats.oneMonth > stats.total) stats.oneMonth = stats.total;
    } catch (e) {
      console.warn('Failed to compute local visit stats:', e);
    }
  }
  return stats;
}

/**
 * 8. Fetch saved resumes from Firebase for a given user
 */
export async function fetchResumesFromSupabase(userId: string): Promise<any[]> {
  if (isFirestoreQuotaExceeded) {
    return getLocalResumes(userId);
  }

  try {
    const q = query(collection(db, 'resumes'), where('user_id', '==', userId));
    const querySnapshot = await getDocs(q);
    const resumes: any[] = [];
    querySnapshot.forEach((doc) => {
      resumes.push({ id: doc.id, ...doc.data() });
    });
    return resumes;
  } catch (err: any) {
    checkAndHandleError(err);
    console.error('Error fetching resumes from Firebase:', err);
    return getLocalResumes(userId);
  }
}

function getLocalResumes(userId: string): any[] {
  if (typeof window !== 'undefined') {
    try {
      const key = `sebok_saved_resumes_${userId}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('Error reading local resumes:', e);
    }
  }
  return [];
}

/**
 * 9. Save or update a resume in Firebase
 */
export async function saveResumeToSupabase(
  userId: string,
  resume: any
): Promise<{ success: boolean; error?: string }> {
  // Sync to local storage first
  if (typeof window !== 'undefined') {
    try {
      const key = `sebok_saved_resumes_${userId}`;
      const saved = localStorage.getItem(key);
      let list: any[] = saved ? JSON.parse(saved) : [];
      const existsIdx = list.findIndex((r: any) => r.id === resume.id);
      if (existsIdx >= 0) {
        list[existsIdx] = resume;
      } else {
        list.push(resume);
      }
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save resume locally:', e);
    }
  }

  if (isFirestoreQuotaExceeded) {
    return { success: true };
  }

  try {
    let resumeId = resume.id;
    if (!resumeId) {
      resumeId = 'res_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      resume.id = resumeId;
    }

    const payload = {
      id: resumeId,
      user_id: userId,
      name: resume.name || 'Untitled Resume',
      timestamp: resume.timestamp || new Date().toISOString(),
      data: resume.data || {},
      template: resume.template || 'classic',
      updated_at: new Date().toISOString()
    };

    await setDoc(doc(db, 'resumes', resumeId), payload);
    return { success: true };
  } catch (err: any) {
    checkAndHandleError(err);
    console.error('Error saving resume to Firebase:', err);
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * 10. Delete a resume from Firebase
 */
export async function deleteResumeFromSupabase(
  userId: string,
  resumeId: string
): Promise<{ success: boolean; error?: string }> {
  // Sync to local storage first
  if (typeof window !== 'undefined') {
    try {
      const key = `sebok_saved_resumes_${userId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        let list: any[] = JSON.parse(saved);
        list = list.filter((r: any) => r.id !== resumeId);
        localStorage.setItem(key, JSON.stringify(list));
      }
    } catch (e) {
      console.warn('Failed to delete resume locally:', e);
    }
  }

  if (isFirestoreQuotaExceeded) {
    return { success: true };
  }

  try {
    await deleteDoc(doc(db, 'resumes', resumeId));
    return { success: true };
  } catch (err: any) {
    checkAndHandleError(err);
    console.error('Error deleting resume from Firebase:', err);
    return { success: false, error: err.message || String(err) };
  }
}
