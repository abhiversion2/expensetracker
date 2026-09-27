-- ====================================================================
-- Supabase Schema for Apna Gang Expense Tracker
-- Copy and run this script in the Supabase Dashboard -> SQL Editor
-- ====================================================================

-- 1. Create tables
CREATE TABLE IF NOT EXISTS public.groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Apna Gang',
  currency TEXT DEFAULT '₹',
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.members (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_color TEXT,
  initials TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

-- 2. Turn on Row Level Security (RLS) and allow public collaboration
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access for groups" ON public.groups;
DROP POLICY IF EXISTS "Public access for members" ON public.members;
DROP POLICY IF EXISTS "Public access for expenses" ON public.expenses;

CREATE POLICY "Public access for groups" ON public.groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for members" ON public.members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

-- 3. Set Replica Identity to FULL so Realtime events contain complete data
ALTER TABLE public.groups REPLICA IDENTITY FULL;
ALTER TABLE public.members REPLICA IDENTITY FULL;
ALTER TABLE public.expenses REPLICA IDENTITY FULL;

-- 4. Enable Supabase Realtime safely
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.members;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
  EXCEPTION WHEN others THEN NULL;
  END;
END $$;
