import { createClient } from '@supabase/supabase-js';

export function getSupabaseCredentials() {
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('VITE_SUPABASE_URL') : null;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('VITE_SUPABASE_ANON_KEY') : null;
  
  return {
    supabaseUrl: localUrl || (import.meta as any).env.VITE_SUPABASE_URL || 'https://crdmccidgzknnylyggbf.supabase.co',
    supabaseAnonKey: localKey || (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZG1jY2lkZ3prbm55bHlnZ2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NDg1NjAsImV4cCI6MjA5ODAyNDU2MH0.gPwgKSe-0lSFZf4holpBctmYSGrTYsv5cwpKcgLODBs'
  };
}

let activeClient: any = null;
let lastUrl = '';
let lastKey = '';

export function getSupabaseClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();
  if (!supabaseUrl || !supabaseAnonKey) return null;
  
  if (!activeClient || lastUrl !== supabaseUrl || lastKey !== supabaseAnonKey) {
    lastUrl = supabaseUrl;
    lastKey = supabaseAnonKey;
    activeClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return activeClient;
}

// Export a Proxy that always acts as the active client
export const supabase = new Proxy({} as any, {
  get(target, prop) {
    const client = getSupabaseClient();
    if (!client) return undefined;
    const val = Reflect.get(client, prop);
    if (typeof val === 'function') {
      return val.bind(client);
    }
    return val;
  }
});

