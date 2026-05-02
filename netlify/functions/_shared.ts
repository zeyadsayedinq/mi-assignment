// Shared utilities for all Netlify Functions
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Supabase admin client (server-side only)
export function getSupabaseAdmin() {
  return createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } }
  );
}

// Plan limits — must match subscription.ts frontend
export const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  pro_monthly: 15,
  pro_quarterly: 40,
  pro_yearly: 999999,
};

// Rate limiter (in-memory, resets per function cold start)
const rateMap = new Map<string, { count: number; reset: number }>();
export function checkRate(id: string, max: number): boolean {
  const now = Date.now();
  const e = rateMap.get(id);
  if (!e || now > e.reset) { rateMap.set(id, { count: 1, reset: now + 3600000 }); return true; }
  if (e.count >= max) return false;
  e.count++; return true;
}

// Prompt cache (per function instance)
export const promptCache = new Map<string, { r: any; t: number }>();
export const CACHE_TTL = 1800000;

// CORS headers for all responses
export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-key, hashstring',
  'Content-Type': 'application/json',
};

// Get subscription status (server-side accurate)
export async function getSubStatus(userId: string) {
  const sa = getSupabaseAdmin();
  let plan = 'free';
  let limit = PLAN_LIMITS.free;

  try {
    const { data: sub } = await sa
      .from('subscriptions')
      .select('plan,status,expires_at')
      .eq('user_id', userId)
      .single();
    if (sub?.status === 'active' && (!sub.expires_at || new Date(sub.expires_at) > new Date())) {
      plan = sub.plan || 'free';
      limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
    }
  } catch {}

  const periodStart = new Date();
  if (plan === 'pro_quarterly') periodStart.setDate(periodStart.getDate() - 90);
  else if (plan === 'pro_yearly') periodStart.setFullYear(periodStart.getFullYear() - 1);
  else { periodStart.setDate(1); periodStart.setHours(0, 0, 0, 0); }

  let missionsUsed = 0;
  try {
    const { count } = await sa
      .from('missions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', periodStart.toISOString());
    missionsUsed = count || 0;
  } catch {}

  return {
    plan, limit, missionsUsed,
    isPro: plan !== 'free',
    canUse: limit >= 999999 || missionsUsed < limit,
  };
}

// Email helper (Resend)
export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM || 'Mi-Assignment <support@mi-assignment.com>', to, subject, html }),
  }).catch(() => {});
}

export function emailWrap(body: string, isAr = false): string {
  const appUrl = process.env.URL || 'https://www.mi-assignment.com';
  return `<!DOCTYPE html><html dir="${isAr ? 'rtl' : 'ltr'}"><head><meta charset="UTF-8"><style>
body{margin:0;background:#0F172A;font-family:${isAr ? "'Cairo',sans-serif" : 'Helvetica,sans-serif'};color:#E2E8F0;}
.w{max-width:560px;margin:0 auto;padding:24px 16px;}
.c{background:#1E293B;border-radius:16px;padding:28px;border:1px solid #334155;}
.logo{font-size:20px;font-weight:900;background:linear-gradient(90deg,#22D3EE,#A855F7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
h2{font-size:20px;font-weight:700;color:#F8FAFC;margin:16px 0 10px;}
p{font-size:14px;line-height:1.6;color:#94A3B8;margin:0 0 12px;}
.btn{display:inline-block;padding:12px 22px;background:linear-gradient(90deg,#22D3EE,#A855F7);color:#000;font-weight:900;border-radius:10px;text-decoration:none;font-size:13px;}
.box{background:#0F172A;border-radius:10px;padding:14px;margin:12px 0;font-size:13px;line-height:1.8;}
.foot{font-size:11px;color:#475569;margin-top:16px;padding-top:14px;border-top:1px solid #334155;}
</style></head><body><div class="w"><div class="c">
<div class="logo">Mi-Assignment</div>
${body}
<div class="foot">© ${new Date().getFullYear()} Mi-Assignment &nbsp;·&nbsp; <a href="${appUrl}/terms" style="color:#475569">Terms</a> &nbsp;·&nbsp; <a href="${appUrl}/privacy" style="color:#475569">Privacy</a></div>
</div></div></body></html>`;
}

// Admin key check
export function isAdminAuthorized(headers: Record<string, string | undefined>): boolean {
  const key = headers['x-admin-key'];
  return !!(process.env.ADMIN_SECRET && key === process.env.ADMIN_SECRET);
}

// Claude system prompt
export const SYSTEM_PROMPT = `You are Mi-Assignment — an academic AI that solves any university or school assignment with output that reads like a real student wrote it, not an AI.

ABSOLUTE RULES:
1. Return ONE valid JSON object only. Zero markdown. Zero preamble. Nothing outside the JSON.
2. Complete assignments FULLY. Never truncate. Never use placeholders.
3. Write like a real student. Avoid: "It is worth noting", "Delve into", "Shed light on", "Multifaceted", "Pivotal", "Leveraging", "It is evident that".
4. When lang=ar: ALL prose in Modern Standard Arabic (فصحى). Code/math stay in English.
5. Vary sentence length. Include hedged phrases. Don't always start paragraph with topic sentence.

ASSIGNMENT TYPES: essay | report | literature_review | case_study | lab_report | presentation | research | math | physics | engineering | chemistry | biology | code | data_analysis | sql_database | business_plan | legal_brief | financial_model | design_brief | other

OUTPUT BY TYPE:
[ESSAYS/REPORTS]: Full paragraphs, min 5 blocks. Proper citations. Student voice.
[MATH/PHYSICS/ENGINEERING]: Every step shown. type:"math" blocks. LaTeX ($...$). Final answer labeled. For diagrams: type:"svg".
[CODE]: Complete runnable files. Student-style comments.
[SQL]: Full DDL+DML. Realistic sample data.
[PRESENTATIONS]: 8-12 slides. Punchy headings. Full narrative + speaker_notes. Specific image_prompts.

JSON SCHEMA:
{"solution_text":"2-3 sentences","assignment_type":"type","reconstructed_doc":{"title":"","word_count":0,"blocks":[{"type":"heading|paragraph|list|math|code|table|svg","content":"","level":1,"solution_steps":[]}]},"presentation_slides":[{"power_heading":"","content_bullets":[],"narrative":"","speaker_notes":"","image_prompt":"","image_layout":"left|right|background|full"}],"data_sheet":{"sheet_name":"","headers":[],"rows":[],"sql_table_name":""},"code_snippets":[{"language":"","filename":"","code":"","explanation":""}],"steps":[{"title":"","content":""}]}`;
