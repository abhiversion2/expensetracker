-- ====================================================================
-- Supabase Schema for Apna Gang Expense Tracker
-- Copy and run this script in the Supabase Dashboard -> SQL Editor
-- ====================================================================

-- 1. Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Apna Gang',
  currency TEXT DEFAULT '₹',
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create members table
CREATE TABLE IF NOT EXISTS public.members (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_color TEXT,
  initials TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  paid_by TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT,
  category TEXT,
  notes TEXT,
  participants JSONB DEFAULT '[]'::jsonb,
  split_type TEXT DEFAULT 'equal',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (RLS) and allow public collaboration
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Clean up any existing duplicate policies if re-running
DROP POLICY IF EXISTS "Public access for groups" ON public.groups;
DROP POLICY IF EXISTS "Public access for members" ON public.members;
DROP POLICY IF EXISTS "Public access for expenses" ON public.expenses;

-- Allow read, insert, update, and delete with anon public key (no password required for friends)
CREATE POLICY "Public access for groups" ON public.groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for members" ON public.members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

-- 5. Enable Realtime updates for live phone syncing
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.groups, public.members, public.expenses;
COMMIT;
