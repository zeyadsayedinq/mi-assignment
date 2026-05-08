-- ═══════════════════════════════════════════════════════════
--  Mi-Assignment v2.1 — Supabase Database Schema
--  Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Subscriptions table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan          TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  started_at    TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ,
  tap_charge_id TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ── Missions table (enhanced) ──────────────────────────────
CREATE TABLE IF NOT EXISTS missions (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  payload_name    TEXT NOT NULL,
  university      TEXT,
  course          TEXT,
  assignment_type TEXT DEFAULT 'other',
  status          TEXT DEFAULT 'SUCCESS',
  summary         TEXT,
  solution_data   JSONB,
  lang            TEXT DEFAULT 'en'
);

-- ── Usage tracking ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usage_events (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event      TEXT NOT NULL,
  properties JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS Policies ───────────────────────────────────────────
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own subscription
CREATE POLICY "Users read own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only read their own missions
CREATE POLICY "Users read own missions" ON missions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own missions
CREATE POLICY "Users insert own missions" ON missions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own missions
CREATE POLICY "Users delete own missions" ON missions
  FOR DELETE USING (auth.uid() = user_id);

-- Service role bypasses all RLS (for server-side operations)

-- ── Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS missions_user_id_idx ON missions(user_id);
CREATE INDEX IF NOT EXISTS missions_created_at_idx ON missions(created_at DESC);
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);

-- ── Auto-update updated_at ─────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Referrals System ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referrals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ref_code      TEXT NOT NULL UNIQUE,
  referred_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'pending', -- pending | converted
  bonus_granted BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  converted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS referrals_code_idx ON referrals(ref_code);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Users can read their own referrals (to see count, stats)
CREATE POLICY "Users read own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id);

-- Allow insert of referred_id during signup (via service role in server)
-- Server uses service role key which bypasses RLS

-- ── Public mission counter (no auth required) ──────────────────────────────────
-- This view exposes only the count, no user data
CREATE OR REPLACE VIEW public_mission_count AS
  SELECT COUNT(*) AS total FROM missions;

-- Allow anonymous reads of the counter
GRANT SELECT ON public_mission_count TO anon;

-- ── OWNER RLS POLICIES (run these in Supabase SQL Editor) ────────────────────
-- These allow the owner email to read ALL data directly from the browser
-- without needing the service role key or a backend server.

-- Allow owner to read all missions
CREATE POLICY "Owner reads all missions" ON missions
  FOR SELECT USING (
    auth.jwt() ->> 'email' = 'zeyadsayedinq@gmail.com'
  );

-- Allow owner to read all subscriptions
CREATE POLICY "Owner reads all subscriptions" ON subscriptions
  FOR SELECT USING (
    auth.jwt() ->> 'email' = 'zeyadsayedinq@gmail.com'
  );

-- Allow owner to UPDATE subscriptions (grant/revoke Pro)
CREATE POLICY "Owner updates subscriptions" ON subscriptions
  FOR UPDATE USING (
    auth.jwt() ->> 'email' = 'zeyadsayedinq@gmail.com'
  );

-- Allow owner to INSERT subscriptions (new grant)
CREATE POLICY "Owner inserts subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'email' = 'zeyadsayedinq@gmail.com'
  );
