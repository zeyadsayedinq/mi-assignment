/**
 * /netlify/functions/apply-referral.mjs
 *
 * Called on new user signup when a referral code is present in localStorage.
 * Awards +2 bonus missions to both the new user and the referrer.
 *
 * POST /api/apply-referral
 * Body: { newUserId, refCode }
 */

import { createClient } from '@supabase/supabase-js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const BONUS_MISSIONS = 2;

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { Object.entries(CORS).forEach(([k,v]) => res.setHeader(k,v)); return res.status(200).end(); }
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } }
  );

  try {
    const { newUserId, refCode } = req.body;

    if (!newUserId || !refCode) {
      Object.entries(CORS).forEach(([k,v]) => res.setHeader(k,v)); return res.status(400).json({ error: 'Missing newUserId or refCode' });
    }

    // Prevent self-referral: derive what the new user's own code would be
    // (generateReferralCode is deterministic — same logic as frontend)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const hex = newUserId.replace(/-/g, '');
    let ownCode = '';
    for (let i = 0; i < 6; i++) {
      ownCode += chars[parseInt(hex.slice(i * 2, i * 2 + 2), 16) % chars.length];
    }
    if (refCode.toUpperCase() === ownCode) {
      Object.entries(CORS).forEach(([k,v]) => res.setHeader(k,v)); return res.status(400).json({ error: 'Cannot refer yourself' });
    }

    // Find the referrer by their code
    const { data: referralRow, error: findError } = await supabase
      .from('referrals')
      .select('referrer_id, ref_code, referred_ids')
      .eq('ref_code', refCode.toUpperCase())
      .single();

    if (findError || !referralRow) {
      Object.entries(CORS).forEach(([k,v]) => res.setHeader(k,v)); return res.status(404).json({ error: 'Referral code not found' });
    }

    const referrerId = referralRow.referrer_id;

    // Prevent using the same referral code twice
    const alreadyReferred = (referralRow.referred_ids || []).includes(newUserId);
    if (alreadyReferred) {
      Object.entries(CORS).forEach(([k,v]) => res.setHeader(k,v)); return res.status(409).json({ error: 'Referral already applied' });
    }

    // Add newUserId to the referred_ids array in referrals table
    const updatedIds = [...(referralRow.referred_ids || []), newUserId];
    await supabase
      .from('referrals')
      .update({ referred_ids: updatedIds, status: 'converted' })
      .eq('ref_code', refCode.toUpperCase());

    // Award bonus missions: upsert bonus_missions for both users
    // Using a separate table to track bonus missions cleanly
    const bonusInserts = [
      { user_id: newUserId, bonus: BONUS_MISSIONS, reason: 'referral_signup', ref_code: refCode.toUpperCase() },
      { user_id: referrerId, bonus: BONUS_MISSIONS, reason: 'referral_reward', ref_code: refCode.toUpperCase() },
    ];

    const { error: bonusError } = await supabase
      .from('bonus_missions')
      .insert(bonusInserts);

    if (bonusError) {
      // Non-fatal: log but don't fail the referral
      console.warn('bonus_missions insert error (non-fatal):', bonusError.message);
    }

    console.log(`✅ Referral applied: code=${refCode}, referrer=${referrerId}, newUser=${newUserId}, bonus=${BONUS_MISSIONS} each`);

    Object.entries(CORS).forEach(([k,v]) => res.setHeader(k,v)); return res.status(200).send(JSON.stringify({
        success: true,
        bonusAwarded: BONUS_MISSIONS,
        referrerId,
        message: `+${BONUS_MISSIONS} bonus missions awarded to both you and your referrer!`,
      }),);
  } catch (e) {
    console.error('apply-referral error:', e.message);
    Object.entries(CORS).forEach(([k,v]) => res.setHeader(k,v)); return res.status(500).json({ error: e.message });
  }
};
