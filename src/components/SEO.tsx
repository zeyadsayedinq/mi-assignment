import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
}

const PAGE_META: Record<string, { title: string; description: string; keywords?: string }> = {
  '/': {
    title: 'Mi-Assignment — AI Homework & Assignment Solver | Better Than ChatGPT for Students',
    description: 'Mi-Assignment solves any university assignment in 15 seconds. Essays, presentations, code, math, engineering, law, medical — delivered as PDF, Word, PPTX. Free to start. Better than ChatGPT for students. Instagram: @mi.assignment',
    keywords: 'AI assignment solver, homework AI, assignment helper, essay writer AI, AI homework solver, best AI for assignments, ChatGPT alternative students, Gemini alternative assignments, assignment solver free, AI essay writer, AI presentation maker, university assignment AI, Mi-Assignment, mi-assignment.com, حل الواجبات, مساعد أكاديمي, ذكاء اصطناعي للطلاب',
  },
  '/terminal': {
    title: 'Solve Your Assignment Now — Mi-Assignment AI | حل واجبك الآن',
    description: 'Paste your assignment and get a complete PDF, PowerPoint, or Word document in 15 seconds. Engineering, essays, code, math, law — all domains. Free to start.',
    keywords: 'solve assignment AI, homework solver, assignment AI tool, حل واجب, AI homework help, instant assignment solver',
  },
  '/pricing': {
    title: 'Mi-Assignment Pricing — From Free | $7/month for Unlimited Homework AI',
    description: 'Free tier with 3 missions. Pro from $7/month (350 EGP) for 25 missions. Full semester plan $20 (1,000 EGP). No credit card for free tier. Pay via Visa, InstaPay, Vodafone Cash.',
    keywords: 'Mi-Assignment pricing, homework AI cost, assignment solver price, student AI subscription, واجبات اشتراك',
  },
  '/checkout': {
    title: 'Upgrade to Mi-Assignment Pro | Checkout',
    description: 'Complete your Mi-Assignment Pro subscription securely via Paymob. Visa, Mastercard, InstaPay, Vodafone Cash accepted.',
  },
  '/academy': {
    title: 'Mi-Academy — Understand Every Solution | Learn With Your AI Assignment',
    description: 'Mi-Academy breaks down every assignment solution: step-by-step explanation, key concepts, defense Q&A, and common mistakes. Learn while you submit.',
    keywords: 'understand assignment solution, AI tutor, academic explanation, Mi-Academy, شرح الواجبات',
  },
  '/vault': {
    title: 'Mi-Vault — Your Assignment Archive | Saved Homework Library',
    description: 'All your solved assignments saved, searchable, and downloadable. Mi-Vault keeps your academic history organized.',
  },
  '/intelligence-bureau': {
    title: 'Assignment Types Guide — Mi-Assignment | All Academic Domains',
    description: 'Complete guide to every assignment type Mi-Assignment solves: engineering, medical, law, CS, business, math, humanities. With examples and output previews.',
    keywords: 'assignment types AI, what can AI solve, academic domains, engineering assignment, medical case study AI, law IRAC AI',
  },
  '/sops': {
    title: 'Help & FAQ — Mi-Assignment | How to Use the AI Assignment Solver',
    description: 'Answers to common questions about Mi-Assignment: how it works, assignment types, pricing, output formats, and tips for best results.',
    keywords: 'Mi-Assignment FAQ, how to use homework AI, assignment solver help, student AI guide',
  },
  '/terms': {
    title: 'Terms of Service — Mi-Assignment',
    description: 'Mi-Assignment terms of service covering subscription, refunds, academic integrity policy, and usage rights.',
  },
  '/privacy': {
    title: 'Privacy Policy — Mi-Assignment | GDPR Compliant',
    description: 'How Mi-Assignment collects, uses, and protects your data. GDPR compliant, Saudi data law compliant.',
  },
  '/app': {
    title: 'Dashboard — Mi-Assignment | Your Academic AI Hub',
    description: 'Mi-Assignment dashboard. Start a new mission, view your solved assignments, and manage your subscription.',
  },
};

export function SEO({ title, description, canonical, noindex = false }: SEOProps) {
  const location = useLocation();
  const meta = PAGE_META[location.pathname] || PAGE_META['/'];
  const finalTitle = title || meta.title;
  const finalDesc = description || meta.description;
  const finalCanonical = canonical || `https://www.mi-assignment.com${location.pathname}`;

  useEffect(() => {
    document.title = finalTitle;

    const setMeta = (selector: string, content: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement;
      if (el) el.content = content;
    };

    setMeta('meta[name="description"]', finalDesc);
    setMeta('meta[property="og:title"]', finalTitle);
    setMeta('meta[property="og:description"]', finalDesc);
    setMeta('meta[property="og:url"]', finalCanonical);
    setMeta('meta[name="twitter:title"]', finalTitle);
    setMeta('meta[name="twitter:description"]', finalDesc);

    const keywords = (meta as any).keywords;
    if (keywords) {
      let kwMeta = document.querySelector('meta[name="keywords"]') as HTMLMetaElement;
      if (!kwMeta) { kwMeta = document.createElement('meta'); kwMeta.name = 'keywords'; document.head.appendChild(kwMeta); }
      kwMeta.content = keywords;
    }

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = finalCanonical;

    let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (noindex && robots) robots.content = 'noindex,nofollow';
  }, [finalTitle, finalDesc, finalCanonical, noindex]);

  return null;
}
