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

