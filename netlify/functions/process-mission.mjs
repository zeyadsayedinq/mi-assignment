const SYSTEM_PROMPT = `You are Mi-Assignment — an academic AI that solves any university assignment with output that reads like a real student wrote it, not an AI.

RULES:
1. Return ONE valid JSON object only. Zero markdown. Zero preamble. Nothing before {.
2. Complete assignments FULLY. Never truncate. Never use placeholders.
3. Write like a real student. AVOID: "It is worth noting", "Delve into", "Shed light on", "Multifaceted", "Pivotal", "Leveraging".
4. When lang=ar: ALL prose in Modern Standard Arabic (فصحى). Code/math in English.

TYPES: essay|report|literature_review|case_study|lab_report|presentation|research_paper|math|physics|engineering|chemistry|biology|computer_science|data_analysis|sql_database|business_plan|financial_model|legal_brief|design_brief|other

JSON SCHEMA:
{"solution_text":"summary","assignment_type":"type","reconstructed_doc":{"title":"","word_count":0,"blocks":[{"type":"heading|paragraph|list|math|code|table","content":"","level":1,"solution_steps":[]}]},"presentation_slides":[{"power_heading":"","content_bullets":[],"narrative":"","speaker_notes":"","image_prompt":"","image_layout":"left"}],"data_sheet":{"sheet_name":"","headers":[],"rows":[]},"code_snippets":[{"language":"","filename":"","code":"","explanation":""}],"steps":[{"title":"","content":""}]}`;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { prompt = '', university, course, system, reference, missionType, lang = 'en', files = [] } = body;

    const groqKey = process.env.GROQ_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

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

    // 1. Try Anthropic Claude (best quality)
    if (!raw && anthropicKey) {
      try {
        const content = [{ type: 'text', text: fullPrompt }];
        for (const f of files) {
          if (!f.data) continue;
          if (f.isText) {
            try { content.push({ type: 'text', text: `[FILE: ${f.name}]\n${Buffer.from(f.data, 'base64').toString('utf-8')}` }); } catch {}
          } else if (f.type === 'application/pdf') {
            content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: f.data } });
          } else if (f.type?.startsWith('image/')) {
            content.push({ type: 'image', source: { type: 'base64', media_type: f.type, data: f.data } });
          }
        }
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01', 'anthropic-beta': 'pdfs-2024-09-25' },
          body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 8000, system: SYSTEM_PROMPT, messages: [{ role: 'user', content }] }),
        });
        if (resp.ok) {
          const data = await resp.json();
          raw = data?.content?.[0]?.text || '';
        }
      } catch {}
    }

    // 2. Try Groq — completely free
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
          const data = await resp.json();
          raw = data?.choices?.[0]?.message?.content || '';
        }
      } catch {}
    }

    // 3. Try Gemini
    if (!raw && geminiKey) {
      const parts = [{ text: fullPrompt }];
      for (const f of files) {
        if (!f.data) continue;
        if (f.isText) {
           try { parts.push({ text: `[FILE: ${f.name}]\n${Buffer.from(f.data, 'base64').toString('utf-8')}` }); } catch {}
        } else if (f.type === 'application/pdf' || f.type?.startsWith('image/')) {
           parts.push({ inlineData: { mimeType: f.type, data: f.data } });
        } else {
           parts.push({ text: `[FILE: ${f.name} (${f.type})] — incorporate this content in your solution.` });
        }
      }

      for (const model of ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite']) {
        try {
          const resp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts }],
                systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
              }),
            }
          );
          if (resp.ok) {
            const data = await resp.json();
            raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (raw) break;
          } else {
            console.warn("Gemini Error:", await resp.text());
          }
        } catch (e) { console.warn("Gemini fetch failed:", e); continue; }
      }
    }

    if (!raw) {
      return {
        statusCode: 503,
        headers: CORS,
        body: JSON.stringify({ error: 'No AI service available. Add GEMINI_API_KEY to Netlify environment variables.' })
      };
    }

    // Parse JSON response
    let parsed;
    try {
      const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      const first = raw.indexOf('{'), last = raw.lastIndexOf('}');
      if (first !== -1 && last > first) {
        try { parsed = JSON.parse(raw.substring(first, last + 1)); } catch {}
      }
      if (!parsed) {
        return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Parse failed. Please retry.' }) };
      }
    }

    return { statusCode: 200, headers: CORS, body: JSON.stringify(parsed) };

  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message || 'Internal error' }) };
  }
};
