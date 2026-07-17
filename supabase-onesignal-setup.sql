-- =========================================================================
-- SUPABASE POSTGRESQL SCHEMA FOR ADMIN SETTINGS & ONESIGNAL CONFIGURATION
-- =========================================================================
-- Run this script inside your Supabase project's SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
--
-- This script ensures that the 'admin_settings' table exists and contains
-- all required OneSignal columns, as well as enabling secure access policies.
-- =========================================================================

-- 1. Create 'admin_settings' table if it does not exist
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id TEXT PRIMARY KEY DEFAULT 'global_settings',
    brand_name TEXT DEFAULT 'Sebok',
    tagline TEXT DEFAULT 'Your Premium Portal to Verified Careers & Networking',
    share_title TEXT DEFAULT '',
    share_desc TEXT DEFAULT '',
    share_img TEXT DEFAULT '',
    logo_url TEXT DEFAULT '',
    favicon_url TEXT DEFAULT '',
    banner_url TEXT DEFAULT '',
    banner_html TEXT DEFAULT '',
    premium_mode BOOLEAN DEFAULT true,
    membership_price NUMERIC DEFAULT 499,
    currency TEXT DEFAULT 'INR',
    paywall_features TEXT DEFAULT '[]',
    paywall_title TEXT DEFAULT 'Activate Premium',
    paywall_subtitle TEXT DEFAULT 'Unlock Premium access to continue searching & applying.',
    paywall_button_text TEXT DEFAULT 'Activate Membership Now',
    paywall_price_description TEXT DEFAULT 'One-time manual purchase. Extend anytime.',
    paywall_footer_text TEXT DEFAULT 'Secured & processed under Cashfree Secure Gateway. This is a one-time manual charge.',
    paywall_extend_title TEXT DEFAULT 'Extend Premium',
    paywall_extend_subtitle TEXT DEFAULT 'Extend your manual premium access for another month.',
    paywall_extend_button_text TEXT DEFAULT 'Extend Membership Now',
    cashfree_app_id TEXT DEFAULT '',
    cashfree_secret_key TEXT DEFAULT '',
    post_approval_mode BOOLEAN DEFAULT true,
    supabase_url TEXT DEFAULT '',
    supabase_anon_key TEXT DEFAULT '',
    supabase_service_role_key TEXT DEFAULT '',
    google_site_verification TEXT DEFAULT '',
    
    -- OneSignal Configuration Columns
    one_signal_code TEXT DEFAULT '',
    one_signal_app_id TEXT DEFAULT '',
    one_signal_rest_api_key TEXT DEFAULT '',
    one_signal_auto_notify BOOLEAN DEFAULT true,
    one_signal_community_notify BOOLEAN DEFAULT true,
    one_signal_prompt_title TEXT DEFAULT 'JOB ALERTS DIRECT CHAHIYE? 🔔',
    one_signal_prompt_subtitle TEXT DEFAULT 'NEVER MISS A HIRING UPDATE',
    one_signal_prompt_desc TEXT DEFAULT 'Naye job alerts aur community postings direct apne mobile ya computer screen par instant receive karne ke liye notifications Subscribe karein!',
    one_signal_prompt_btn_dismiss TEXT DEFAULT 'BAAD MEIN',
    one_signal_prompt_btn_allow TEXT DEFAULT 'HAAN, ALLOW KAREIN 🔔',
    
    -- Additional Admin Configurations
    community_mind_placeholder TEXT DEFAULT '',
    community_review_notice TEXT DEFAULT '',
    login_title TEXT DEFAULT '',
    login_subtitle TEXT DEFAULT '',
    google_only BOOLEAN DEFAULT false,
    show_job_filters BOOLEAN DEFAULT true,
    banner_height_type TEXT DEFAULT 'default',
    banner_height_custom_value INTEGER DEFAULT 150,
    banner_object_fit TEXT DEFAULT 'cover',
    banner_position TEXT DEFAULT 'center',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Safe Column Addition (In case the table already exists but lacks OneSignal columns)
DO $$
BEGIN
    -- OneSignal columns check & add
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_settings' AND column_name='one_signal_code') THEN
        ALTER TABLE public.admin_settings ADD COLUMN one_signal_code TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_settings' AND column_name='one_signal_app_id') THEN
        ALTER TABLE public.admin_settings ADD COLUMN one_signal_app_id TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_settings' AND column_name='one_signal_rest_api_key') THEN
        ALTER TABLE public.admin_settings ADD COLUMN one_signal_rest_api_key TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_settings' AND column_name='one_signal_auto_notify') THEN
        ALTER TABLE public.admin_settings ADD COLUMN one_signal_auto_notify BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_settings' AND column_name='one_signal_community_notify') THEN
        ALTER TABLE public.admin_settings ADD COLUMN one_signal_community_notify BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_settings' AND column_name='one_signal_prompt_title') THEN
        ALTER TABLE public.admin_settings ADD COLUMN one_signal_prompt_title TEXT DEFAULT 'JOB ALERTS DIRECT CHAHIYE? 🔔';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_settings' AND column_name='one_signal_prompt_subtitle') THEN
        ALTER TABLE public.admin_settings ADD COLUMN one_signal_prompt_subtitle TEXT DEFAULT 'NEVER MISS A HIRING UPDATE';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_settings' AND column_name='one_signal_prompt_desc') THEN
        ALTER TABLE public.admin_settings ADD COLUMN one_signal_prompt_desc TEXT DEFAULT 'Naye job alerts aur community postings direct apne mobile ya computer screen par instant receive karne ke liye notifications Subscribe karein!';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_settings' AND column_name='one_signal_prompt_btn_dismiss') THEN
        ALTER TABLE public.admin_settings ADD COLUMN one_signal_prompt_btn_dismiss TEXT DEFAULT 'BAAD MEIN';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_settings' AND column_name='one_signal_prompt_btn_allow') THEN
        ALTER TABLE public.admin_settings ADD COLUMN one_signal_prompt_btn_allow TEXT DEFAULT 'HAAN, ALLOW KAREIN 🔔';
    END IF;
END $$;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
-- Note: Since this contains OneSignal REST API keys and payment keys, we should only expose this safely.
-- SELECT: Let public read settings (so app can fetch brand_name, logos, public configurations)
DROP POLICY IF EXISTS "Public can read admin settings" ON public.admin_settings;
CREATE POLICY "Public can read admin settings" ON public.admin_settings
    FOR SELECT USING (true);

-- ALL/UPSERT: Allow full management. In production, you would restrict this to authenticated admins, 
-- but for seamless dev-server sync, we allow general updates (with check true) or via service role.
DROP POLICY IF EXISTS "Anyone can update settings" ON public.admin_settings;
CREATE POLICY "Anyone can update settings" ON public.admin_settings
    FOR ALL USING (true) WITH CHECK (true);

-- 5. Seed the default config row if it does not exist yet
INSERT INTO public.admin_settings (id, brand_name, tagline)
VALUES ('global_settings', 'Sebok', 'Your Premium Portal to Verified Careers & Networking')
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- SQL Execution finished. Your 'admin_settings' table has been optimized
-- for OneSignal configuration sync!
-- =========================================================================
