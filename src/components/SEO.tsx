import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
}

// Per-page SEO metadata
const PAGE_META: Record<string, { title: string; description: string; keywords?: string }> = {
  '/': {
    title: 'Mi-Assignment — حل الواجبات بالذكاء الاصطناعي | AI Homework Helper MENA',
    description: 'Mi-Assignment يحل أي واجب جامعي في ثوانٍ. مقالات، بروزنتيشن، كود، رياضيات، هندسة، قانون. بالعربي والإنجليزي. مجاني للبدء.',
    keywords: 'حل الواجبات, واجبات جامعية, ذكاء اصطناعي, مساعد أكاديمي, AI homework, assignment solver, GUC, AUC, Cairo University',
  },
  '/terminal': {
    title: 'حل واجبك الآن — Mi-Assignment | Submit Your Assignment',
    description: 'ارفع واجبك واحصل على حل كامل خلال ١٥-٤٠ ثانية. مقالات، كود، رياضيات، قانون، بروزنتيشن.',
    keywords: 'حل واجب, حل اسايمنت, AI assignment solver, homework help Egypt',
  },
  '/pricing': {
    title: 'أسعار Mi-Assignment | ١٠٠٠ جنيه للترم كامل — Pricing',
    description: 'اشترك في Mi-Assignment Pro: ٦٠ مهمة في الترم. ١٠٠٠ جنيه ربع سنوي لمصر. متاح بالريال، الدرهم، الدينار.',
    keywords: 'اشتراك, أسعار, Mi-Assignment Pro, واجبات, subscription Egypt students',
  },
  '/checkout': {
    title: 'إتمام الاشتراك — Mi-Assignment | Checkout',
    description: 'أكمل اشتراكك في Mi-Assignment Pro بأمان عبر Paymob.',
  },
  '/academy': {
    title: 'Mi-Academy — افهم الحل وادافع عنه أمام الدكتور',
    description: 'شرح تفصيلي لكل واجب: خطوات الحل، المفاهيم الأساسية، أسئلة الدفاع، والأخطاء الشائعة.',
    keywords: 'شرح الواجبات, فهم الحل, دفاع عن الواجب, Mi-Academy',
  },
  '/vault': {
    title: 'Mi-Vault — أرشيف واجباتك المحفوظة | Your Saved Assignments',
    description: 'كل واجباتك محفوظة ومرتبة. حمّل، ابحث، وراجع أي حل سابق.',
  },
  '/contact': {
    title: 'تواصل مع Mi-Assignment | Contact Us',
    description: 'تواصل مع فريق Mi-Assignment عبر واتساب أو البريد الإلكتروني. نرد خلال ساعة.',
    keywords: 'تواصل, دعم, support, Mi-Assignment contact',
  },
  '/refund': {
    title: 'سياسة الاسترداد — Mi-Assignment | Refund Policy',
    description: 'سياسة الاسترداد الخاصة بـ Mi-Assignment. اقرأ الشروط والاستثناءات قبل الاشتراك.',
  },
  '/terms': {
    title: 'الشروط والأحكام — Mi-Assignment | Terms of Service',
    description: 'شروط استخدام Mi-Assignment تشمل سياسة النزاعات الأكاديمية وشروط الاشتراك والاسترداد.',
  },
  '/privacy': {
    title: 'سياسة الخصوصية — Mi-Assignment | Privacy Policy',
    description: 'كيف يجمع Mi-Assignment بياناتك ويستخدمها ويحميها. متوافق مع GDPR والقانون السعودي.',
  },
  '/sops': {
    title: 'مساعدة وأسئلة شائعة — Mi-Assignment | Help & FAQ',
    description: 'إجابات على أكثر الأسئلة شيوعاً عن Mi-Assignment: كيف يعمل، أنواع الواجبات، الأسعار.',
  },
  '/app': {
    title: 'لوحة التحكم — Mi-Assignment',
    description: 'لوحة تحكم Mi-Assignment. ابدأ مهمة جديدة أو استعرض واجباتك المحفوظة.',
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
    // Keywords per page
    const keywords = (meta as any).keywords;
    if (keywords) {
      let kwMeta = document.querySelector('meta[name="keywords"]') as HTMLMetaElement;
      if (!kwMeta) { kwMeta = document.createElement('meta'); kwMeta.name = 'keywords'; document.head.appendChild(kwMeta); }
      kwMeta.content = keywords;
    }

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
