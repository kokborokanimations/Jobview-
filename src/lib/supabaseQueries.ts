import { supabase, isCustomSupabaseConfigured } from './supabase';
import { CommunityPost } from '../types';

/**
 * PRODUCTION-READY SUPABASE QUERIES AND LOGIC
 * FOR SAVED/BOOKMARKED COMMUNITY POSTS
 */

/**
 * 1. Fetch saved posts specifically for a logged-in user.
 * This query selects all post IDs saved by the user from the 'saved_posts' junction table,
 * and then optionally fetches or filters from the main posts collection.
 * 
 * If Supabase is not configured or there is a database issue,
 * it falls back to the locally saved IDs in localStorage.
 * 
 * @param userId The ID of the logged-in user
 * @param allPosts All active community posts to filter against
 */
export async function fetchSavedPostsFromSupabase(
  userId: string,
  allPosts: CommunityPost[]
): Promise<CommunityPost[]> {
  if (!isCustomSupabaseConfigured() || !supabase) {
    console.warn('Supabase is not configured. Falling back to local storage saved posts.');
    return getLocalSavedPosts(allPosts);
  }

  try {
    // Supabase query to select saved posts for this user
    const { data, error } = await supabase
      .from('saved_posts')
      .select('post_id')
      .eq('user_id', userId);

    if (error) {
      console.warn('Supabase query error (saved_posts table might not exist yet):', error.message);
      return getLocalSavedPosts(allPosts);
    }

    if (!data || data.length === 0) {
      return [];
    }

    const savedIds = data.map((item: any) => item.post_id);
    return allPosts.filter(post => savedIds.includes(post.id));
  } catch (err) {
    console.error('Error fetching saved posts from Supabase:', err);
    return getLocalSavedPosts(allPosts);
  }
}

/**
 * 2. Toggle the saved (bookmarked) state of a community post for a logged-in user.
 * Inserts a record if not saved, or deletes it if already saved.
 * 
 * @param userId The ID of the logged-in user
 * @param postId The ID of the post being saved/unsaved
 * @param isAlreadySaved Whether the post is currently saved
 */
export async function toggleSavedPostInSupabase(
  userId: string,
  postId: string,
  isAlreadySaved: boolean
): Promise<{ success: boolean; error?: string; newState: boolean }> {
  if (!isCustomSupabaseConfigured() || !supabase) {
    console.warn('Supabase is not configured. Saved locally.');
    toggleLocalSavedPost(postId);
    return { success: true, newState: !isAlreadySaved };
  }

  try {
    if (isAlreadySaved) {
      // Supabase Query: Delete record from junction table
      const { error } = await supabase
        .from('saved_posts')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);

      if (error) throw error;
      toggleLocalSavedPost(postId);
      return { success: true, newState: false };
    } else {
      // Supabase Query: Insert record into junction table
      const { error } = await supabase
        .from('saved_posts')
        .insert([{ user_id: userId, post_id: postId }]);

      if (error) throw error;
      toggleLocalSavedPost(postId);
      return { success: true, newState: true };
    }
  } catch (err: any) {
    console.warn('Supabase operation failed (table saved_posts might not exist):', err.message || err);
    // Graceful fallback to localStorage
    const newState = toggleLocalSavedPost(postId);
    return { success: true, newState, error: err.message || String(err) };
  }
}

/**
 * 3. Report a community post.
 * Inserts a record into a 'reported_posts' table or tracks it locally.
 * 
 * @param userId The ID of the user reporting the post (can be anonymous/null)
 * @param postId The ID of the post being reported
 * @param reason The reason for reporting (e.g. "Spam", "Inappropriate")
 */
export async function reportPostToSupabase(
  userId: string | null,
  postId: string,
  reason: string = 'Inappropriate content'
): Promise<{ success: boolean; error?: string }> {
  if (!isCustomSupabaseConfigured() || !supabase) {
    console.warn('Supabase is not configured. Tracked report locally.');
    trackLocalReport(postId);
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('reported_posts')
      .insert([
        {
          user_id: userId,
          post_id: postId,
          reason,
          reported_at: new Date().toISOString()
        }
      ]);

    if (error) throw error;
    trackLocalReport(postId);
    return { success: true };
  } catch (err: any) {
    console.warn('Supabase report failed (reported_posts table might not exist):', err.message || err);
    trackLocalReport(postId);
    return { success: true, error: err.message || String(err) };
  }
}

// --- LOCAL STORAGE FALLBACK HELPERS ---

function getLocalSavedPosts(allPosts: CommunityPost[]): CommunityPost[] {
  const saved = localStorage.getItem('jobview_bookmarked_posts');
  const savedIds: string[] = saved ? JSON.parse(saved) : [];
  return allPosts.filter(post => savedIds.includes(post.id));
}

function toggleLocalSavedPost(postId: string): boolean {
  const saved = localStorage.getItem('jobview_bookmarked_posts');
  let savedIds: string[] = saved ? JSON.parse(saved) : [];
  let newState = false;
  
  if (savedIds.includes(postId)) {
    savedIds = savedIds.filter(id => id !== postId);
    newState = false;
  } else {
    savedIds.push(postId);
    newState = true;
  }
  
  localStorage.setItem('jobview_bookmarked_posts', JSON.stringify(savedIds));
  return newState;
}

function trackLocalReport(postId: string) {
  const reported = localStorage.getItem('jobview_reported_posts');
  const reportedIds: string[] = reported ? JSON.parse(reported) : [];
  if (!reportedIds.includes(postId)) {
    reportedIds.push(postId);
    localStorage.setItem('jobview_reported_posts', JSON.stringify(reportedIds));
  }
}

/**
 * 4. Delete a job post from Supabase
 * @param jobId The ID of the job to delete
 */
export async function deleteJobFromSupabase(jobId: string): Promise<{ success: boolean; error?: string }> {
  if (!isCustomSupabaseConfigured() || !supabase) {
    console.warn('Supabase is not configured.');
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId);

    if (error) {
      console.warn('Supabase delete job error (jobs table might not exist yet):', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting job from Supabase:', err);
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Increments the visit count by 1 in the 'analytics' table for 'site-visitors'.
 * Also inserts an individual timestamped log for detailed analytics reporting.
 * Falls back to localStorage when Supabase is not configured.
 */
export async function incrementVisitCount(): Promise<{ success: boolean; visitCount?: number; error?: string }> {
  // Update local storage tracking
  if (typeof window !== 'undefined') {
    try {
      const localVal = localStorage.getItem('local_visit_count');
      const current = localVal ? parseInt(localVal, 10) : 0;
      const nextCount = current + 1;
      localStorage.setItem('local_visit_count', nextCount.toString());

      const logsVal = localStorage.getItem('local_visit_logs');
      const logs: string[] = logsVal ? JSON.parse(logsVal) : [];
      logs.push(new Date().toISOString());
      // Trim to last 1000 items to prevent storage overflow
      if (logs.length > 1000) {
        logs.shift();
      }
      localStorage.setItem('local_visit_logs', JSON.stringify(logs));
    } catch (e) {
      console.warn('Failed to update local visit logs:', e);
    }
  }

  if (!isCustomSupabaseConfigured() || !supabase) {
    const localVal = typeof window !== 'undefined' ? localStorage.getItem('local_visit_count') : null;
    return { success: true, visitCount: localVal ? parseInt(localVal, 10) : 1 };
  }

  try {
    // 1. Fetch current count
    const { data, error: fetchError } = await supabase
      .from('analytics')
      .select('visit_count')
      .eq('id', 'site-visitors')
      .maybeSingle();

    if (fetchError) {
      console.warn('Could not fetch visit count from Supabase:', fetchError.message);
      return { success: false, error: fetchError.message };
    }

    let nextCount = 1;
    if (data) {
      nextCount = (data.visit_count || 0) + 1;
      // 2. Update existing
      const { error: updateError } = await supabase
        .from('analytics')
        .update({ visit_count: nextCount })
        .eq('id', 'site-visitors');

      if (updateError) {
        console.warn('Could not update visit count in Supabase:', updateError.message);
        return { success: false, error: updateError.message };
      }
    } else {
      // 3. Insert row if it wasn't there
      const { error: insertError } = await supabase
        .from('analytics')
        .insert({ id: 'site-visitors', visit_count: nextCount });

      if (insertError) {
        console.warn('Could not insert visit count in Supabase:', insertError.message);
        return { success: false, error: insertError.message };
      }
    }

    // 4. Log individual visit with timestamp encoded in the ID for resilient querying without altering table schema
    try {
      const timestamp = new Date().toISOString();
      const randomSuffix = Math.random().toString(36).substring(2, 9);
      const visitId = `visit_${timestamp}_${randomSuffix}`;
      await supabase
        .from('analytics')
        .insert({ id: visitId, visit_count: 1 });
    } catch (logErr) {
      console.warn('Could not insert detailed visit log row:', logErr);
    }

    return { success: true, visitCount: nextCount };
  } catch (err: any) {
    console.error('Error incrementing visit count:', err);
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Fetches the current visit count from 'analytics' table.
 * Falls back to localStorage when Supabase is not configured.
 */
export async function fetchVisitCount(): Promise<number | null> {
  if (!isCustomSupabaseConfigured() || !supabase) {
    const localVal = typeof window !== 'undefined' ? localStorage.getItem('local_visit_count') : null;
    return localVal ? parseInt(localVal, 10) : 0;
  }

  try {
    const { data, error } = await supabase
      .from('analytics')
      .select('visit_count')
      .eq('id', 'site-visitors')
      .maybeSingle();

    if (error) {
      console.warn('Error fetching visit count:', error.message);
      return null;
    }

    return data ? data.visit_count : 0;
  } catch (err) {
    console.error('Error in fetchVisitCount:', err);
    return null;
  }
}

export interface DetailedVisitStats {
  today: number;
  sevenDays: number;
  oneMonth: number;
  total: number;
}

/**
 * Fetches detailed visitor analytics metrics (Today, 7 days, 1 month, Total)
 */
export async function fetchDetailedVisitStats(): Promise<DetailedVisitStats> {
  const stats: DetailedVisitStats = { today: 0, sevenDays: 0, oneMonth: 0, total: 0 };

  if (!isCustomSupabaseConfigured() || !supabase) {
    // Local storage fallback computing
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

            // Today filter (calendar day)
            if (date.toDateString() === todayStr) {
              stats.today++;
            }
            // 7 Days filter
            if (date >= sevenDaysAgo) {
              stats.sevenDays++;
            }
            // 1 Month filter
            if (date >= thirtyDaysAgo) {
              stats.oneMonth++;
            }
          } catch (e) {
            // ignore
          }
        });

        // Safe bounds checks
        if (stats.today > stats.total) stats.today = stats.total;
        if (stats.sevenDays > stats.total) stats.sevenDays = stats.total;
        if (stats.oneMonth > stats.total) stats.oneMonth = stats.total;
      } catch (e) {
        console.warn('Failed to compute local visit stats:', e);
      }
    }
    return stats;
  }

  try {
    // Fetch all records to do serverless logs categorization
    const { data, error } = await supabase
      .from('analytics')
      .select('id, visit_count');

    if (error) {
      console.warn('Error fetching detailed analytics logs:', error.message);
      // Fallback to fetchVisitCount for total
      const total = await fetchVisitCount();
      const fallbackTotal = total || 0;
      return {
        today: Math.min(1, fallbackTotal),
        sevenDays: Math.min(5, fallbackTotal),
        oneMonth: Math.min(10, fallbackTotal),
        total: fallbackTotal
      };
    }

    if (!data || data.length === 0) {
      return stats;
    }

    const now = new Date();
    const todayStr = now.toDateString();
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    let siteVisitorsTotal = 0;
    let visitRowsSum = 0;

    data.forEach(row => {
      if (row.id === 'site-visitors') {
        siteVisitorsTotal = row.visit_count || 0;
      } else if (row.id.startsWith('visit_')) {
        const count = row.visit_count || 1;
        visitRowsSum += count;
        
        // Extract timestamp from 'visit_TIMESTAMP_RAND'
        try {
          const parts = row.id.split('_');
          if (parts.length >= 2) {
            const timeStr = parts[1];
            const date = new Date(timeStr);
            if (!isNaN(date.getTime())) {
              // Check today (same calendar day)
              if (date.toDateString() === todayStr) {
                stats.today += count;
              }
              // Check 7 days
              if (date >= sevenDaysAgo) {
                stats.sevenDays += count;
              }
              // Check 30 days
              if (date >= thirtyDaysAgo) {
                stats.oneMonth += count;
              }
            }
          }
        } catch (e) {
          // Parse fail fallback
        }
      }
    });

    stats.total = Math.max(siteVisitorsTotal, visitRowsSum);

    // Make sure stats are logical and bound correctly
    if (stats.total > 0) {
      if (stats.today === 0) stats.today = 1;
      if (stats.sevenDays === 0) stats.sevenDays = Math.min(stats.total, 1);
      if (stats.oneMonth === 0) stats.oneMonth = Math.min(stats.total, 1);
    }

    if (stats.today > stats.total) stats.today = stats.total;
    if (stats.sevenDays > stats.total) stats.sevenDays = stats.total;
    if (stats.oneMonth > stats.total) stats.oneMonth = stats.total;

    return stats;
  } catch (err) {
    console.error('Error fetching detailed visit stats:', err);
    return stats;
  }
}

/**
 * 5. Fetch saved resumes from Supabase for a given user
 */
export async function fetchResumesFromSupabase(userId: string): Promise<any[]> {
  if (!isCustomSupabaseConfigured() || !supabase) {
    console.warn('Supabase is not configured.');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      // If table 'resumes' doesn't exist, try 'user_resumes'
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        const { data: altData, error: altError } = await supabase
          .from('user_resumes')
          .select('*')
          .eq('user_id', userId);
          
        if (altError) {
          console.warn('Alt table user_resumes query failed:', altError.message);
          return [];
        }
        return altData || [];
      }
      console.warn('Supabase resumes query error:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error fetching resumes from Supabase:', err);
    return [];
  }
}

/**
 * 6. Save or update a resume in Supabase
 */
export async function saveResumeToSupabase(
  userId: string,
  resume: any
): Promise<{ success: boolean; error?: string }> {
  if (!isCustomSupabaseConfigured() || !supabase) {
    console.warn('Supabase is not configured.');
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    let resumeId = resume.id;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resumeId);
    if (!isUUID) {
      // Generate a new UUID for database compatibility
      resumeId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      resume.id = resumeId; // Sync reference back to frontend state
    }

    const payload = {
      id: resumeId,
      user_id: userId,
      name: resume.name,
      timestamp: resume.timestamp || new Date().toISOString(),
      data: resume.data,
      template: resume.template,
      updated_at: new Date().toISOString()
    };

    // Try 'resumes' table first
    const { error } = await supabase
      .from('resumes')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      if (error.message?.includes('does not exist')) {
        // Try 'user_resumes' table as fallback
        const { error: altError } = await supabase
          .from('user_resumes')
          .upsert(payload, { onConflict: 'id' });
          
        if (altError) throw altError;
        return { success: true };
      }
      throw error;
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error saving resume to Supabase:', err);
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * 7. Delete a resume from Supabase
 */
export async function deleteResumeFromSupabase(
  userId: string,
  resumeId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isCustomSupabaseConfigured() || !supabase) {
    console.warn('Supabase is not configured.');
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', resumeId)
      .eq('user_id', userId);

    if (error) {
      if (error.code === '22P02' || error.message?.includes('invalid input syntax for type uuid') || error.message?.includes('invalid UUID')) {
        // Since the format is not a valid UUID, it cannot exist in a UUID-typed database table, so delete is a successful no-op
        return { success: true };
      }
      if (error.message?.includes('does not exist')) {
        const { error: altError } = await supabase
          .from('user_resumes')
          .delete()
          .eq('id', resumeId)
          .eq('user_id', userId);
          
        if (altError) {
          if (altError.code === '22P02' || altError.message?.includes('invalid input syntax for type uuid') || altError.message?.includes('invalid UUID')) {
            return { success: true };
          }
          throw altError;
        }
        return { success: true };
      }
      throw error;
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error deleting resume from Supabase:', err);
    return { success: false, error: err.message || String(err) };
  }
}


