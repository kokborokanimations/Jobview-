-- =========================================================================
-- SUPABASE POSTGRESQL SCHEMA FOR JOBS TABLE (FRESH RECREATION)
-- =========================================================================
-- Run this script inside your Supabase project's SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
--
-- WARNING: This will DELETE the existing 'jobs' table and create a fresh one
-- with all correct columns (whatsapp, email, phone, qualifications, etc.).
-- =========================================================================

-- 1. DROP the old 'jobs' table if it exists (cascade to clean up old dependent policies)
DROP TABLE IF EXISTS public.jobs CASCADE;

-- 2. Create the clean, complete 'jobs' table
CREATE TABLE public.jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    company_logo_url TEXT DEFAULT '',
    company_logo_index INTEGER DEFAULT 0,
    location TEXT NOT NULL,
    salary TEXT DEFAULT '',
    short_description TEXT DEFAULT '',
    full_description TEXT DEFAULT '',
    description TEXT DEFAULT '',
    apply_link TEXT DEFAULT '',
    date_posted TEXT DEFAULT '',
    is_live BOOLEAN DEFAULT true,
    category TEXT DEFAULT '',
    experience TEXT DEFAULT '',
    contract_type TEXT DEFAULT '',
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    whatsapp TEXT DEFAULT '',
    whatsapp_enabled BOOLEAN DEFAULT true,
    call_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT true,
    apply_enabled BOOLEAN DEFAULT true,
    qualifications TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- 4. Create public access policies so anyone can view live job posts
DROP POLICY IF EXISTS "Anyone can read live jobs" ON public.jobs;
CREATE POLICY "Anyone can read live jobs" ON public.jobs
    FOR SELECT USING (true);

-- 5. Create service role / authenticated write policies for admin management
DROP POLICY IF EXISTS "Admin can manage jobs" ON public.jobs;
CREATE POLICY "Admin can manage jobs" ON public.jobs
    FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- SQL Execution finished. Your 'jobs' table has been recreated from scratch
-- with all columns (Whatsapp, Phone, Email, Logo Presets, etc.)!
-- =========================================================================
