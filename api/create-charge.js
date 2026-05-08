/**
 * /netlify/functions/create-charge.mjs
 * 
 * Handles Tap Payments charge creation server-side.
 * TAP_SECRET_KEY lives only in Netlify environment variables — never in the browser bundle.
 *
 * POST /api/create-charge
 * Body: { plan, userId, email, currency }
 * Returns: { chargeUrl, chargeId }
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// Plan pricing in each currency (fils/halalas — smallest unit × 100)
const PLAN_PRICES = {
  pro_monthly: { EGP: 39000, SAR: 3700, AED: 5000 },   // 390 EGP / 37 SAR / 50 AED
  pro_quarterly: { EGP: 100000, SAR: 9900, AED: 14000 }, // 1000 EGP / 99 SAR / 140 AED
  pro_yearly: { EGP: 350000, SAR: 34900, AED: 47000 },  // 3500 EGP / 349 SAR / 470 AED
};

// Human-readable plan names
const PLAN_NAMES = {
  pro_monthly: 'Mi-Assignment Pro — Monthly',
  pro_quarterly: 'Mi-Assignment Pro — Quarterly',
  pro_yearly: 'Mi-Assignment Pro — Yearly',
};

function setCORS(res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
}


async function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body; // already parsed
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { setCORS(res); return res.status(200).end(); }
  if (req.method !== 'POST') { setCORS(res); return res.status(405).end('Method Not Allowed'); }

  const TAP_SECRET_KEY = process.env.TAP_SECRET_KEY;
  if (!TAP_SECRET_KEY) {
    console.error('TAP_SECRET_KEY not set in environment variables');
    setCORS(res); return res.status(500).send(JSON.stringify({ error: 'Payment service not configured. Contact support.' }),);
  }

  try {
    const { plan, userId, email, currency = 'EGP' } = await parseBody(req);

    if (!plan || !userId || !email) {
      setCORS(res); return res.status(400).send(JSON.stringify({ error: 'Missing required fields: plan, userId, email' }),);
    }

    if (!PLAN_PRICES[plan]) {
      setCORS(res); return res.status(400).send(JSON.stringify({ error: `Invalid plan: ${plan}` }),);
    }

    if (!['EGP', 'SAR', 'AED'].includes(currency)) {
      setCORS(res); return res.status(400).send(JSON.stringify({ error: `Invalid currency: ${currency}` }),);
    }

    const amountInLowestUnit = PLAN_PRICES[plan][currency];
    const amountDecimal = (amountInLowestUnit / 100).toFixed(2);

    // Determine redirect URLs based on environment
    const baseUrl = process.env.URL || 'https://www.mi-assignment.com';
    const redirectUrl = `${baseUrl}/payment-success?plan=${plan}&userId=${userId}`;
    const cancelUrl = `${baseUrl}/pricing?cancelled=1`;

    // Create Tap charge
    const tapPayload = {
      amount: parseFloat(amountDecimal),
      currency,
      customer_initiated: true,
      threeDSecure: true,
      save_card: false,
      description: PLAN_NAMES[plan],
      statement_descriptor: 'MI-ASSIGNMENT',
      metadata: {
        userId,
        plan,
        email,
      },
      reference: {
        transaction: `mi_${userId.slice(0, 8)}_${Date.now()}`,
        order: `ord_${plan}_${Date.now()}`,
      },
      receipt: {
        email: true,
        sms: false,
      },
      customer: {
        email,
      },
      source: {
        id: 'src_all', // Accept all payment methods available in Tap
      },
      redirect: {
        url: redirectUrl,
      },
      post: {
        url: `${baseUrl}/.netlify/functions/tap-webhook`,
      },
    };

    const tapResponse = await fetch('https://api.tap.company/v2/charges', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TAP_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tapPayload),
    });

    if (!tapResponse.ok) {
      const tapError = await tapResponse.json().catch(() => ({}));
      console.error('Tap API error:', tapError);
      throw new Error(tapError?.errors?.[0]?.description || 'Tap payment creation failed');
    }

    const charge = await tapResponse.json();

    setCORS(res); return res.status(200).send(JSON.stringify({
        chargeId: charge.id,
        chargeUrl: charge.transaction?.url || charge.redirect?.url,
        status: charge.status,
      }),);
  } catch (e) {
    console.error('create-charge error:', e.message);
    setCORS(res); return res.status(500).send(JSON.stringify({ error: e.message || 'Payment failed. Please try again.' }),);
  }
};
