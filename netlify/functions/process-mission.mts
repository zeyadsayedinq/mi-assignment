import type { Context } from "@netlify/functions";

const SYSTEM_PROMPT = `You are Mi-Assignment — an academic AI that solves any university assignment with output that reads like a real student wrote it.

RULES:
1. Return ONE valid JSON object only. Zero markdown. Zero preamble.
2. Complete assignments FULLY. Never truncate.
3. Write like a real student. Avoid AI phrases: "It is worth noting", "Delve into", "Shed light on", "Multifaceted", "Pivotal".
4. When lang=ar: ALL prose in Modern Standard Arabic (فصحى). Code/math in English.

ASSIGNMENT TYPES: essay|report|literature_review|case_study|lab_report|presentation|research_paper|math|physics|engineering|chemistry|biology|computer_science|data_analysis|sql_database|business_plan|financial_model|legal_brief|design_brief|other

JSON SCHEMA:
{"solution_text":"summary","assignment_type":"type","reconstructed_doc":{"title":"","word_count":0,"blocks":[{"type":"heading|paragraph|list|math|code|table|svg","content":"","level":1,"solution_steps":[]}]},"presentation_slides":[{"power_heading":"","content_bullets":[],"narrative":"","speaker_notes":"","image_prompt":"","image_layout":"left"}],"data_sheet":{"sheet_name":"","headers":[],"rows":[]},"code_snippets":[{"language":"","filename":"","code":"","explanation":""}],"steps":[{"title":"","content":""}]}`;

export default async (req: Request, context: Context) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const body = await req.json();
    const { prompt, university, course, system, reference, missionType, lang, files } = body;

    const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    // Build context string
    const ctx = [
      university && `University: ${university}`,
      course && `Course: ${course}`,
      system && `Academic System: ${system}`,
      reference && `Reference Style: ${reference}`,
      missionType && `Assignment Type: ${missionType}`,
      lang === 'ar' && 'Language: Arabic — respond in Modern Standard Arabic (فصحى). Code/math in English.',
    ].filter(Boolean).join(' | ');

    const fullPrompt = `${ctx ? `[CONTEXT] ${ctx}\n\n` : ''}[MISSION] ${lang === 'ar' ? 'أجب باللغة العربية الفصحى. ' : ''}${prompt}`;

    let raw = '';

    // Try Anthropic Claude first (better quality)
    if (anthropicKey) {
      const content: any[] = [{ type: 'text', text: fullPrompt }];

      // Add files if present
      if (files?.length) {
        for (const f of files) {
          if (!f.data) continue;
          if (f.isText) {
            try { content.push({ type: 'text', text: `[FILE: ${f.name}]\n${atob(f.data)}` }); } catch {}
          } else if (f.type === 'application/pdf') {
            content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: f.data } });
          } else if (f.type?.startsWith('image/')) {
            content.push({ type: 'image', source: { type: 'base64', media_type: f.type, data: f.data } });
          }
        }
      }

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'pdfs-2024-09-25',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content }],
        }),
      });

      if (resp.ok) {
        const data: any = await resp.json();
        raw = data?.content?.[0]?.text || '';
      }
    }

    // Try Groq (free, fast — llama3)
    const groqKey = process.env.GROQ_API_KEY;
    if (!raw && groqKey) {
      try {
        const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: fullPrompt }
            ],
            temperature: 0.7,
            max_tokens: 8000,
          }),
        });
        if (resp.ok) {
          const data: any = await resp.json();
          raw = data?.choices?.[0]?.message?.content || '';
        }
      } catch {}
    }

    // Fallback to Gemini
    if (!raw && geminiKey) {
      const models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];
      for (const model of models) {
        try {
          const resp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
                systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
              }),
            }
          );
          if (resp.ok) {
            const data: any = await resp.json();
            raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (raw) break;
          } else {
            const err: any = await resp.json().catch(() => ({}));
            if (err?.error?.code === 429 || err?.error?.status === 'RESOURCE_EXHAUSTED') continue;
            break;
          }
        } catch { continue; }
      }
    }

    if (!raw) {
      return Response.json({
        error: 'No AI service available. Add ANTHROPIC_API_KEY or GEMINI_API_KEY to Netlify environment variables.'
      }, { status: 503, headers });
    }

    // Parse JSON
    let parsed: any;
    try {
      const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      const first = raw.indexOf('{'), last = raw.lastIndexOf('}');
      if (first !== -1 && last > first) {
        try { parsed = JSON.parse(raw.substring(first, last + 1)); } catch {}
      }
      if (!parsed) {
        return Response.json({ error: 'Parse failed. Please retry.' }, { status: 500, headers });
      }
    }

    return Response.json(parsed, { headers });

  } catch (e: any) {
    return Response.json({ error: e.message || 'Internal error' }, { status: 500, headers });
  }
};

export const config = { path: '/api/process-mission' };
