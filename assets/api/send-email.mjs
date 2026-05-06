/**
 * /netlify/functions/send-email.mjs
 *
 * Sends transactional emails via Resend API.
 * Triggered by: signup, mission limit reached, payment success.
 *
 * POST /api/send-email
 * Body: { type, to, data }
 * Types: 'welcome' | 'limit_reached' | 'payment_success'
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const FROM = process.env.RESEND_FROM_EMAIL || 'Mi-Assignment <noreply@mi-assignment.com>';
const BASE_URL = process.env.URL || 'https://www.mi-assignment.com';

function welcomeEmail(data) {
  const { name, isAr } = data;
  return {
    subject: isAr ? '🎓 أهلاً في Mi-Assignment — ٣ مهام مجانية في انتظارك' : '🎓 Welcome to Mi-Assignment — Your 3 free missions await',
    html: isAr ? `
      <div dir="rtl" style="font-family:Cairo,Arial,sans-serif;background:#020617;color:#E2E8F0;padding:40px 20px;max-width:560px;margin:0 auto;border-radius:16px">
        <div style="text-align:center;margin-bottom:32px">
          <span style="font-size:32px;font-weight:900;color:#22D3EE;letter-spacing:-1px">Mi</span>
          <span style="font-size:32px;font-weight:900;color:#fff;letter-spacing:-1px">-Assignment</span>
        </div>
        <h1 style="font-size:24px;font-weight:900;color:#fff;margin-bottom:12px">أهلاً ${name || 'بيك'} 👋</h1>
        <p style="color:#94A3B8;line-height:1.7;margin-bottom:24px">
          حساب Mi بتاعك جاهز! عندك ٣ مهام مجانية تقدر تبدأ بيها دلوقتي.<br>
          بعت لينا أي واجب — مقال، بروزنتيشن، كود، رياضيات — وMi يخلص في ثواني.
        </p>
        <a href="${BASE_URL}/app" style="display:inline-block;background:#22D3EE;color:#000;font-weight:900;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:14px">
          ابدأ أول مهمة →
        </a>
        <hr style="border:none;border-top:1px solid #1E293B;margin:32px 0">
        <p style="font-size:12px;color:#475569;text-align:center">
          Mi-Assignment · <a href="${BASE_URL}" style="color:#22D3EE">${BASE_URL}</a>
        </p>
      </div>
    ` : `
      <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#020617;color:#E2E8F0;padding:40px 20px;max-width:560px;margin:0 auto;border-radius:16px">
        <div style="text-align:center;margin-bottom:32px">
          <span style="font-size:32px;font-weight:900;color:#22D3EE;letter-spacing:-1px">Mi</span>
          <span style="font-size:32px;font-weight:900;color:#fff;letter-spacing:-1px">-Assignment</span>
        </div>
        <h1 style="font-size:24px;font-weight:900;color:#fff;margin-bottom:12px">Welcome ${name || 'aboard'} 👋</h1>
        <p style="color:#94A3B8;line-height:1.7;margin-bottom:24px">
          Your Mi account is ready! You have 3 free missions waiting.<br>
          Send us any assignment — essay, presentation, code, math — and Mi handles it in seconds.
        </p>
        <a href="${BASE_URL}/app" style="display:inline-block;background:#22D3EE;color:#000;font-weight:900;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:14px">
          Start your first mission →
        </a>
        <hr style="border:none;border-top:1px solid #1E293B;margin:32px 0">
        <p style="font-size:12px;color:#475569;text-align:center">
          Mi-Assignment · <a href="${BASE_URL}" style="color:#22D3EE">${BASE_URL}</a>
        </p>
      </div>
    `,
  };
}

function limitReachedEmail(data) {
  const { isAr, plan, missionsUsed } = data;
  const upgradeUrl = `${BASE_URL}/pricing`;
  return {
    subject: isAr ? '⚡ وصلت للحد — رقّي حسابك للاستمرار' : '⚡ You\'ve hit your mission limit — upgrade to continue',
    html: isAr ? `
      <div dir="rtl" style="font-family:Cairo,Arial,sans-serif;background:#020617;color:#E2E8F0;padding:40px 20px;max-width:560px;margin:0 auto;border-radius:16px">
        <h1 style="font-size:22px;font-weight:900;color:#fff;margin-bottom:12px">⚡ خلصت مهامك المجانية</h1>
        <p style="color:#94A3B8;line-height:1.7;margin-bottom:8px">
          استخدمت ${missionsUsed} مهمة على خطة ${plan === 'free' ? 'المجانية' : 'الحالية'}.
        </p>
        <p style="color:#94A3B8;line-height:1.7;margin-bottom:24px">
          رقّي لـ Pro واستمر بدون انقطاع — من ١٠٠٠ جنيه للربع (أقل من ٣٤ جنيه يومياً).
        </p>
        <a href="${upgradeUrl}" style="display:inline-block;background:#A855F7;color:#fff;font-weight:900;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:14px">
          رقّي دلوقتي →
        </a>
        <p style="font-size:12px;color:#475569;margin-top:24px">أو شارك رابط الإحالة بتاعك وكسب مهام مجانية إضافية.</p>
      </div>
    ` : `
      <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#020617;color:#E2E8F0;padding:40px 20px;max-width:560px;margin:0 auto;border-radius:16px">
        <h1 style="font-size:22px;font-weight:900;color:#fff;margin-bottom:12px">⚡ You've hit your limit</h1>
        <p style="color:#94A3B8;line-height:1.7;margin-bottom:8px">
          You've used ${missionsUsed} missions on your ${plan === 'free' ? 'free' : 'current'} plan.
        </p>
        <p style="color:#94A3B8;line-height:1.7;margin-bottom:24px">
          Upgrade to Pro and keep going — from 37 SAR / quarter (less than $0.50/day).
        </p>
        <a href="${upgradeUrl}" style="display:inline-block;background:#A855F7;color:#fff;font-weight:900;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:14px">
          Upgrade now →
        </a>
        <p style="font-size:12px;color:#475569;margin-top:24px">Or share your referral link to earn extra free missions.</p>
      </div>
    `,
  };
}

function paymentSuccessEmail(data) {
  const { isAr, plan, expiresAt } = data;
  const planName = { pro_monthly: isAr ? 'شهري' : 'Monthly', pro_quarterly: isAr ? 'ربع سنوي' : 'Quarterly', pro_yearly: isAr ? 'سنوي' : 'Yearly' }[plan] || plan;
  const expiry = expiresAt ? new Date(expiresAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB') : '';
  return {
    subject: isAr ? `✅ تم تفعيل Mi Pro — ${planName}` : `✅ Mi Pro ${planName} activated`,
    html: isAr ? `
      <div dir="rtl" style="font-family:Cairo,Arial,sans-serif;background:#020617;color:#E2E8F0;padding:40px 20px;max-width:560px;margin:0 auto;border-radius:16px">
        <h1 style="font-size:22px;font-weight:900;color:#10B981;margin-bottom:12px">✅ تم تفعيل Pro بنجاح!</h1>
        <p style="color:#94A3B8;line-height:1.7;margin-bottom:24px">
          خطتك: <strong style="color:#fff">Pro ${planName}</strong><br>
          ${expiry ? `تنتهي في: <strong style="color:#fff">${expiry}</strong>` : ''}
        </p>
        <a href="${BASE_URL}/app" style="display:inline-block;background:#22D3EE;color:#000;font-weight:900;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:14px">
          ابدأ مهامك الآن →
        </a>
      </div>
    ` : `
      <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#020617;color:#E2E8F0;padding:40px 20px;max-width:560px;margin:0 auto;border-radius:16px">
        <h1 style="font-size:22px;font-weight:900;color:#10B981;margin-bottom:12px">✅ Mi Pro activated!</h1>
        <p style="color:#94A3B8;line-height:1.7;margin-bottom:24px">
          Plan: <strong style="color:#fff">Pro ${planName}</strong><br>
          ${expiry ? `Expires: <strong style="color:#fff">${expiry}</strong>` : ''}
        </p>
        <a href="${BASE_URL}/app" style="display:inline-block;background:#22D3EE;color:#000;font-weight:900;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:14px">
          Start your missions →
        </a>
      </div>
    `,
  };
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { Object.entries(CORS).forEach(([k,v]) => res.setHeader(k,v)); return res.status(200).end(); }
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — email sending skipped');
    Object.entries(CORS).forEach(([k,v]) => res.setHeader(k,v)); return res.status(200).json({ sent: false, reason: 'no_key' });
  }

  try {
    const { type, to, data = {} } = req.body;

    if (!to || !type) {
      Object.entries(CORS).forEach(([k,v]) => res.setHeader(k,v)); return res.status(400).json({ error: 'Missing to or type' });
    }

    const templates = { welcome: welcomeEmail, limit_reached: limitReachedEmail, payment_success: paymentSuccessEmail };
    const template = templates[type];
    if (!template) {
      Object.entries(CORS).forEach(([k,v]) => res.setHeader(k,v)); return res.status(400).json({ error: `Unknown email type: ${type}` });
    }

    const { subject, html } = template(data);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Resend error:', err);
      throw new Error(err.message || 'Email send failed');
    }

    const result = await res.json();
    Object.entries(CORS).forEach(([k,v]) => res.setHeader(k,v)); return res.status(200).json({ sent: true, id: result.id });
  } catch (e) {
    console.error('send-email error:', e.message);
    Object.entries(CORS).forEach(([k,v]) => res.setHeader(k,v)); return res.status(500).json({ error: e.message });
  }
};
