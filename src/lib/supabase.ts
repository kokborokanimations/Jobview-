import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://crdmccidgzknnylyggbf.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZG1jY2lkZ3prbm55bHlnZ2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NDg1NjAsImV4cCI6MjA5ODAyNDU2MH0.gPwgKSe-0lSFZf4holpBctmYSGrTYsv5cwpKcgLODBs';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
