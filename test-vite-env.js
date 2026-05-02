import { loadEnv } from 'vite';
console.log(loadEnv('development', '.', '').GEMINI_API_KEY !== undefined);
console.log(process.env.GEMINI_API_KEY !== undefined);
