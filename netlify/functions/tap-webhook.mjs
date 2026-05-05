/**
 * /netlify/functions/tap-webhook.mjs
 *
 * Receives Tap Payments webhook on payment completion.
 * Verifies the charge status and activates the user's Pro subscription in Supabase.
 *
 * Tap sends a POST to this URL after payment completes (success or failure).
 */

import { createClient } from '@supabase/supabase-js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// How long each plan lasts in days
const PLAN_DURATIONS = {
  pro_monthly: 30,
  pro_quarterly: 90,
  pro_yearly: 365,
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };

  const TAP_SECRET_KEY = process.env.TAP_SECRET_KEY;
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } }
  );

  try {
    const body = JSON.parse(event.body || '{}');

    // Tap sends the charge object directly as the webhook body
    const chargeId = body?.id;
    const status = body?.status;

    if (!chargeId) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'No charge ID in webhook' }) };
    }

    // Verify the charge directly with Tap API (never trust webhook body alone)
    const verifyResponse = await fetch(`https://api.tap.company/v2/charges/${chargeId}`, {
      headers: { Authorization: `Bearer ${TAP_SECRET_KEY}` },
    });

    if (!verifyResponse.ok) {
      throw new Error('Failed to verify charge with Tap API');
    }

    const charge = await verifyResponse.json();

    // Only activate subscription if payment genuinely captured
    if (charge.status !== 'CAPTURED') {
      console.log(`Webhook received for charge ${chargeId} with status ${charge.status} — no action taken`);
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ received: true, action: 'none' }) };
    }

    const { userId, plan } = charge.metadata || {};

    if (!userId || !plan) {
      console.error('Missing userId or plan in charge metadata', charge.metadata);
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing metadata' }) };
    }

    // Calculate expiry date
    const durationDays = PLAN_DURATIONS[plan] || 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    // Upsert subscription — update existing or create new
    const { error: upsertError } = await supabase
      .from('subscriptions')
      .upsert(
        {
          user_id: userId,
          plan,
          status: 'active',
          expires_at: expiresAt.toISOString(),
          tap_charge_id: chargeId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (upsertError) {
      console.error('Supabase upsert error:', upsertError);
      throw new Error(`Failed to activate subscription: ${upsertError.message}`);
    }

    // Log the payment event for audit trail
    await supabase.from('payment_events').insert({
      user_id: userId,
      plan,
      charge_id: chargeId,
      amount: charge.amount,
      currency: charge.currency,
      status: 'captured',
      created_at: new Date().toISOString(),
    }).then(() => {}, (e) => console.warn('payment_events insert failed (non-critical):', e.message));

    console.log(`✅ Pro subscription activated: userId=${userId}, plan=${plan}, expires=${expiresAt.toISOString()}`);

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ received: true, action: 'subscription_activated', plan, userId }),
    };
  } catch (e) {
    console.error('tap-webhook error:', e.message);
    // Return 200 to prevent Tap from retrying indefinitely for non-transient errors
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ received: true, error: e.message }),
    };
  }
};
