import type { Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  return Response.json({
    status: 'ready',
    claude: !!process.env.ANTHROPIC_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
    gemini: !!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY),
    supabase: !!process.env.VITE_SUPABASE_URL,
    activeAI: process.env.ANTHROPIC_API_KEY ? 'claude' : process.env.GROQ_API_KEY ? 'groq' : process.env.GEMINI_API_KEY ? 'gemini' : 'none',
  }, {
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
  });
};

export const config = { path: '/api/health' };
