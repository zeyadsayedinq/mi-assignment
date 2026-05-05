-- =========================================================
-- Mi-Assignment — Supabase Schema
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New query
-- =========================================================

-- ─── MISSIONS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS missions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payload_name  TEXT NOT NULL DEFAULT 'Mission',
  university    TEXT,
  course        TEXT,
  assignment_type TEXT DEFAULT 'other',
  status        TEXT DEFAULT 'SUCCESS',
  summary       TEXT DEFAULT '',
  solution_data JSONB,
  lang          TEXT DEFAULT 'en',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS missions_user_id_idx ON missions(user_id);
CREATE INDEX IF NOT EXISTS missions_created_at_idx ON missions(created_at DESC);

-- RLS
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own missions"  ON missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own missions" ON missions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own missions" ON missions FOR DELETE USING (auth.uid() = user_id);


-- ─── SUBSCRIPTIONS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan          TEXT NOT NULL DEFAULT 'free',  -- 'free' | 'pro_monthly' | 'pro_quarterly' | 'pro_yearly'
  status        TEXT NOT NULL DEFAULT 'inactive', -- 'active' | 'inactive' | 'cancelled'
  expires_at    TIMESTAMPTZ,
  tap_charge_id TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
-- Only service_role (Netlify function) can insert/update subscriptions
CREATE POLICY "Service role can manage subscriptions" ON subscriptions FOR ALL USING (auth.role() = 'service_role');


-- ─── REFERRALS ────────────────────────────────────────────
-- One row per referrer. ref_code is unique.
-- referred_ids stores array of user_ids who used this code.
CREATE TABLE IF NOT EXISTS referrals (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ref_code      TEXT NOT NULL UNIQUE,
  referred_ids  UUID[] DEFAULT '{}',
  status        TEXT DEFAULT 'pending',  -- 'pending' | 'converted'
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS referrals_referrer_id_idx ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS referrals_ref_code_idx ON referrals(ref_code);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own referral row" ON referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Users can insert their own referral row" ON referrals FOR INSERT WITH CHECK (auth.uid() = referrer_id);
-- Updates (adding referred_ids) are done by service_role via Netlify function
CREATE POLICY "Service role can update referrals" ON referrals FOR UPDATE USING (auth.role() = 'service_role');


-- ─── BONUS MISSIONS ───────────────────────────────────────
-- Tracks awarded bonus missions (referral rewards).
-- check-quota.mjs sums these up and adds to the user's effective limit.
CREATE TABLE IF NOT EXISTS bonus_missions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bonus      INTEGER NOT NULL DEFAULT 2,
  reason     TEXT DEFAULT 'referral_signup',  -- 'referral_signup' | 'referral_reward' | 'promo'
  ref_code   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bonus_missions_user_id_idx ON bonus_missions(user_id);

ALTER TABLE bonus_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own bonuses" ON bonus_missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert bonuses" ON bonus_missions FOR INSERT WITH CHECK (auth.role() = 'service_role');


-- ─── PAYMENT EVENTS ───────────────────────────────────────
-- Audit log of all payment events received from Tap webhooks.
CREATE TABLE IF NOT EXISTS payment_events (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plan       TEXT,
  charge_id  TEXT NOT NULL,
  amount     NUMERIC,
  currency   TEXT,
  status     TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payment_events_user_id_idx ON payment_events(user_id);
CREATE INDEX IF NOT EXISTS payment_events_charge_id_idx ON payment_events(charge_id);

ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage payment_events" ON payment_events FOR ALL USING (auth.role() = 'service_role');


-- ─── UPDATE check-quota to factor in bonus missions ───────
-- NOTE: The Netlify check-quota.mjs function is updated separately (see that file).
-- This comment documents the intended logic:
--   effective_limit = PLAN_LIMITS[plan] + SUM(bonus_missions.bonus) WHERE user_id = userId
--   canUse = missionsUsed < effective_limit


-- ─── HELPER: Count total bonus missions for a user ────────
CREATE OR REPLACE FUNCTION get_bonus_missions(p_user_id UUID)
RETURNS INTEGER
LANGUAGE SQL STABLE
AS $$
  SELECT COALESCE(SUM(bonus), 0)::INTEGER
  FROM bonus_missions
  WHERE user_id = p_user_id;
$$;
