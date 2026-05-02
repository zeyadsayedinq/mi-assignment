import { GoogleGenAI } from '@google/genai';
try {
  new GoogleGenAI({ apiKey: "" });
} catch (e) {
  console.log(e.message);
}
