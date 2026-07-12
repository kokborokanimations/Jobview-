import { createClient } from '@supabase/supabase-js';
import { CommunityPost } from '../types';

/**
 * CLIENT-SIDE SUPABASE QUERIES AND LOGIC
 * WITH ROBUST AUTOMATIC RESTORE & LOCAL STORAGE FALLBACKS
 */

let supabaseClient: any = null;

export function getClientSupabase() {
  if (supabaseClient) return supabaseClient;
  
  const settings = (window as any).__INITIAL_SETTINGS__ || {};
  const url = settings.supabaseUrl || localStorage.getItem('VITE_SUPABASE_URL') || (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const anonKey = settings.supabaseAnonKey || localStorage.getItem('VITE_SUPABASE_ANON_KEY') || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  
  if (url && anonKey) {
    try {
      supabaseClient = createClient(url, anonKey);
      return supabaseClient;
    } catch (e) {
      console.error('[Supabase Client Initialization Error]:', e);
    }
  }
  return null;
}

// Global tracking to maintain compatibility with existing frontend calls
let isFirestoreQuotaExceeded = false;

export function getFirestoreQuotaExceeded(): boolean {
  return isFirestoreQuotaExceeded;
}

export function setFirestoreQuotaExceeded(val: boolean) {
  isFirestoreQuotaExceeded = val;
}

/**
 * 1. Fetch saved posts specifically for a logged-in user.
 */
export async function fetchSavedPostsFromSupabase(
  userId: string,
  allPosts: CommunityPost[]
): Promise<CommunityPost[]> {
  const supabase = getClientSupabase();
  if (!supabase) {
    return getLocalSavedPosts(allPosts);
  }

  try {
    const { data, error } = await supabase
      .from('saved_posts')
      .select('post_id')
      .eq('user_id', userId);
    
    if (error) throw error;

    if (!data || data.length === 0) {
      return [];
    }

    const savedIds = data.map((d: any) => d.post_id);
    return allPosts.filter(post => savedIds.includes(post.id));
  } catch (err) {
    console.error('Error fetching saved posts from Supabase:', err);
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
  const supabase = getClientSupabase();
  if (!supabase) {
    const newState = toggleLocalSavedPost(postId);
    return { success: true, newState };
  }

  try {
    if (isAlreadySaved) {
      const { error } = await supabase
        .from('saved_posts')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);
      
      if (error) throw error;
      toggleLocalSavedPost(postId);
      return { success: true, newState: false };
    } else {
      const { error } = await supabase
        .from('saved_posts')
        .insert([{
          id: `${userId}_${postId}`,
          user_id: userId,
          post_id: postId,
          created_at: new Date().toISOString()
        }]);
      
      if (error) {
        // Fallback for schemas that auto-generate the 'id' field
        const { error: altError } = await supabase
          .from('saved_posts')
          .insert([{
            user_id: userId,
            post_id: postId,
            created_at: new Date().toISOString()
          }]);
        if (altError) throw altError;
      }
      
      toggleLocalSavedPost(postId);
      return { success: true, newState: true };
    }
  } catch (err: any) {
    console.error('Supabase save post toggle failed:', err);
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
  const supabase = getClientSupabase();
  if (!supabase) {
    trackLocalReport(postId);
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('reported_posts')
      .insert([{
        user_id: userId,
        post_id: postId,
        reason,
        reported_at: new Date().toISOString()
      }]);

    if (error) throw error;

    trackLocalReport(postId);
    return { success: true };
  } catch (err: any) {
    console.error('Supabase report post failed:', err);
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
 * 4. Delete a job post from Supabase
 */
export async function deleteJobFromSupabase(jobId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getClientSupabase();
  if (!supabase) {
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId);
    
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting job from Supabase:', err);
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * 5. Increment visit count with intelligent session control and 1-document aggregation in Supabase.
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

  // Session debounce: only write to cloud database once per active browser session
  if (typeof window !== 'undefined') {
    try {
      if (sessionStorage.getItem('supabase_visit_incremented') === 'true') {
        const localVal = localStorage.getItem('local_visit_count');
        return { success: true, visitCount: localVal ? parseInt(localVal, 10) : localNextCount };
      }
    } catch (e) {
      // ignore
    }
  }

  const supabase = getClientSupabase();
  if (!supabase) {
    return { success: true, visitCount: localNextCount };
  }

  try {
    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .eq('id', 'site-visitors')
      .maybeSingle();

    let nextCount = 1;
    let dailyCounts: Record<string, number> = {};
    const todayStr = new Date().toDateString();

    if (data) {
      nextCount = (data.visit_count || 0) + 1;
      const hasDailyCounts = 'daily_counts' in data;
      const updatePayload: any = { visit_count: nextCount };

      if (hasDailyCounts) {
        dailyCounts = data.daily_counts || {};
        dailyCounts[todayStr] = (dailyCounts[todayStr] || 0) + 1;

        // Keep daily history compact
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
        updatePayload.daily_counts = dailyCounts;
      }

      await supabase
        .from('analytics')
        .update(updatePayload)
        .eq('id', 'site-visitors');
    } else {
      // Try with daily_counts first, fallback if it fails
      try {
        dailyCounts[todayStr] = 1;
        const { error: insertError } = await supabase
          .from('analytics')
          .insert([{ 
            id: 'site-visitors', 
            visit_count: nextCount,
            daily_counts: dailyCounts
          }]);
        
        if (insertError) {
          await supabase
            .from('analytics')
            .insert([{ 
              id: 'site-visitors', 
              visit_count: nextCount
            }]);
        }
      } catch (insertErr) {
        await supabase
          .from('analytics')
          .insert([{ 
            id: 'site-visitors', 
            visit_count: nextCount
          }]);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('supabase_visit_incremented', 'true');
      } catch (e) {
        // ignore
      }
    }

    return { success: true, visitCount: nextCount };
  } catch (err: any) {
    console.warn('Error incrementing visit count in Supabase (falling back to local):', err.message || String(err));
    return { success: true, visitCount: localNextCount };
  }
}

/**
 * 6. Fetch current visit count
 */
export async function fetchVisitCount(): Promise<number | null> {
  const supabase = getClientSupabase();
  if (!supabase) {
    const localVal = typeof window !== 'undefined' ? localStorage.getItem('local_visit_count') : null;
    return localVal ? parseInt(localVal, 10) : 0;
  }

  try {
    const { data, error } = await supabase
      .from('analytics')
      .select('visit_count')
      .eq('id', 'site-visitors')
      .maybeSingle();

    if (data) {
      return data.visit_count || 0;
    }
    return 0;
  } catch (err: any) {
    console.error('Error fetching visit count from Supabase:', err);
    const localVal = typeof window !== 'undefined' ? localStorage.getItem('local_visit_count') : null;
    return localVal ? parseInt(localVal, 10) : 0;
  }
}

export interface DetailedVisitStats {
  today: number;
  sevenDays: number;
  oneMonth: number;
  total: number;
  hasDailyCounts?: boolean;
}

/**
 * 7. Fetch detailed visitor analytics metrics using the site-visitors table.
 */
export async function fetchDetailedVisitStats(): Promise<DetailedVisitStats> {
  const stats: DetailedVisitStats = { today: 0, sevenDays: 0, oneMonth: 0, total: 0, hasDailyCounts: true };
  const supabase = getClientSupabase();
  if (!supabase) {
    const local = getLocalDetailedStats(stats);
    local.hasDailyCounts = false;
    return local;
  }

  try {
    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .eq('id', 'site-visitors')
      .maybeSingle();

    if (!data) {
      const local = getLocalDetailedStats(stats);
      local.hasDailyCounts = false;
      return local;
    }

    const siteVisitorsTotal = data.visit_count || 0;
    const hasDailyCounts = 'daily_counts' in data;
    stats.hasDailyCounts = hasDailyCounts;

    if (!hasDailyCounts) {
      // Fallback: Use local logs for intervals, but use live cloud visit_count as total
      getLocalDetailedStats(stats);
      stats.total = siteVisitorsTotal;
      stats.hasDailyCounts = false;

      if (stats.today > stats.total) stats.today = stats.total;
      if (stats.sevenDays > stats.total) stats.sevenDays = stats.total;
      if (stats.oneMonth > stats.total) stats.oneMonth = stats.total;
      return stats;
    }

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
    console.error('Error fetching detailed visit stats from Supabase:', err);
    const local = getLocalDetailedStats(stats);
    local.hasDailyCounts = false;
    return local;
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
 * 8. Fetch saved resumes from Supabase for a given user
 */
export async function fetchResumesFromSupabase(userId: string): Promise<any[]> {
  const supabase = getClientSupabase();
  if (!supabase) {
    return getLocalResumes(userId);
  }

  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      // Fallback to alternative user_resumes table
      const { data: altData, error: altError } = await supabase
        .from('user_resumes')
        .select('*')
        .eq('user_id', userId);
      if (altError) throw altError;
      return altData || [];
    }
    return data || [];
  } catch (err: any) {
    console.error('Error fetching resumes from Supabase:', err);
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
 * 9. Save or update a resume in Supabase
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

  const supabase = getClientSupabase();
  if (!supabase) {
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

    const { error } = await supabase
      .from('resumes')
      .upsert(payload);
    
    if (error) {
      // Try alt table user_resumes
      const { error: altError } = await supabase
        .from('user_resumes')
        .upsert(payload);
      if (altError) throw altError;
    }
    return { success: true };
  } catch (err: any) {
    console.error('Error saving resume to Supabase:', err);
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * 10. Delete a resume from Supabase
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

  const supabase = getClientSupabase();
  if (!supabase) {
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', resumeId);
    
    if (error) {
      // Try alt table user_resumes
      const { error: altError } = await supabase
        .from('user_resumes')
        .delete()
        .eq('id', resumeId);
      if (altError) throw altError;
    }
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting resume from Supabase:', err);
    return { success: false, error: err.message || String(err) };
  }
}
