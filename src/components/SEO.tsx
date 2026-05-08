import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
}

// Per-page SEO metadata
const PAGE_META: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Mi-Assignment — AI Homework Helper for MENA Students',
    description: 'Mi-Assignment solves any university assignment in seconds — essays, presentations, code, math, engineering. Written like a real student. Arabic & English. Free to start.',
  },
  '/app': {
    title: 'Dashboard — Mi-Assignment',
    description: 'Your Mi-Assignment dashboard. Start a new mission, view your vault, or check Mi-Academy.',
  },
  '/terminal': {
    title: 'Submit Assignment — Mi-Assignment',
    description: 'Upload your assignment and get a complete, AI-powered solution in 15-40 seconds.',
  },
  '/pricing': {
    title: 'Pricing — Mi-Assignment | 1,000 EGP / Semester',
    description: 'Mi-Assignment Pro: 40 missions per semester. 1,000 EGP quarterly for Egypt. SAR, AED, KWD, JOD also available.',
  },
  '/intelligence-bureau': {
    title: 'Assignment Type Guide — Mi-Assignment',
    description: 'Learn how to get the best results from Mi-Assignment for every assignment type: essays, math, code, presentations, and more.',
  },
  '/vault': {
    title: 'Mi-Vault — Your Saved Assignments',
    description: 'All your completed assignments, saved and searchable. Download, star, and revisit any previous solution.',
  },
  '/academy': {
    title: 'Mi-Academy — Learn From Every Solution',
    description: 'Step-by-step breakdowns of every assignment Mi solved for you. Understand the reasoning, not just the answer.',
  },
  '/terms': {
    title: 'Terms of Service — Mi-Assignment',
    description: 'Mi-Assignment terms of service including academic integrity policy, subscription terms, and refund policy.',
  },
  '/privacy': {
    title: 'Privacy Policy — Mi-Assignment',
    description: 'How Mi-Assignment collects, uses, and protects your data. GDPR and Saudi PDPL compliant.',
  },
  '/sops': {
    title: 'Help & FAQ — Mi-Assignment',
    description: 'Answers to common questions about Mi-Assignment: how it works, assignment types, pricing, and more.',
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

    // Canonical link
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = finalCanonical;

    // Noindex
    let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (noindex && robots) robots.content = 'noindex,nofollow';
  }, [finalTitle, finalDesc, finalCanonical, noindex]);

  return null;
}
