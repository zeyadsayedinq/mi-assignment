-- Run this entire script in Supabase → SQL Editor → New query → Run
-- This lets the owner email read and write all data directly from the browser

-- 1. Owner can read ALL missions (to see dashboard stats)
CREATE POLICY "Owner reads all missions" ON missions
  FOR SELECT USING (
    auth.jwt() ->> 'email' = 'zeyadsayedinq@gmail.com'
  );

-- 2. Owner can read ALL subscriptions
CREATE POLICY "Owner reads all subscriptions" ON subscriptions
  FOR SELECT USING (
    auth.jwt() ->> 'email' = 'zeyadsayedinq@gmail.com'
  );

-- 3. Owner can UPDATE subscriptions (revoke Pro)
CREATE POLICY "Owner updates subscriptions" ON subscriptions
  FOR UPDATE USING (
    auth.jwt() ->> 'email' = 'zeyadsayedinq@gmail.com'
  );

-- 4. Owner can INSERT subscriptions (grant Pro)
CREATE POLICY "Owner inserts subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'email' = 'zeyadsayedinq@gmail.com'
  );
