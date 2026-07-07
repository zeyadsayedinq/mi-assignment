import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Search, MessageCircle, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';

interface FAQ { q_en: string; a_en: string; q_ar: string; a_ar: string; }

const FAQS: FAQ[] = [
  {
    q_en: 'How many free missions do I get?',
    a_en: 'Every new account gets 3 free missions to try Mi-Assignment. These are a one-time trial, not a monthly reset. After that, upgrade to Pro for more.',
    q_ar: 'كام مهمة مجانية بياخدها الحساب؟',
    a_ar: 'كل حساب جديد بياخد ٣ مهام مجانية يجربها. دي تجربة لمرة واحدة، مش بتتجدد كل شهر. بعد كده اشترك في Pro.',
  },
  {
    q_en: 'What do I get with Pro?',
    a_en: 'Pro Quarterly gives you 60 missions over 3 months — enough for a full semester. Pro Monthly gives you 25 missions over 30 days.',
    q_ar: 'إيه اللي بياخده مع Pro؟',
    a_ar: 'برو ربع سنوي بياخد ٦٠ مهمة على ٣ شهور — تكفي ترم كامل. برو الشهري بياخد ٢٥ مهمة على ٣٠ يوم.',
  },
  {
    q_en: 'How do I pay?',
    a_en: 'In Egypt: InstaPay, Vodafone Cash, Meeza, and Fawry. In Saudi Arabia and the Gulf: card payments. Go to Pricing and follow the checkout steps. If you need help, message us on WhatsApp.',
    q_ar: 'إزاي أدفع؟',
    a_ar: 'في مصر: InstaPay و فودافون كاش و ميزة و فوري. في السعودية والخليج: الدفع بالكارت. روح لصفحة الأسعار واتبع خطوات الدفع. لو محتاج مساعدة كلمنا على واتساب.',
  },
  {
    q_en: 'My assignment is in Arabic — will the output be in Arabic?',
    a_en: 'Yes. Choose Arabic as your submission language on the Terminal and the entire solution is written in proper Modern Standard Arabic. Note: for Arabic content, use the Word (DOCX) file — the PDF cannot render Arabic correctly.',
    q_ar: 'واجبي بالعربي — هيطلع الحل بالعربي؟',
    a_ar: 'أيوة. اختار العربي كلغة التسليم في التيرمينال وهيتكتب الحل كله بعربي فصيح سليم. ملاحظة: للمحتوى العربي استخدم ملف Word — ملف PDF مبيظهرش العربي صح.',
  },
  {
    q_en: 'Why does the PDF not show Arabic properly?',
    a_en: 'This is a known limitation of the PDF engine with Arabic text. For any Arabic assignment, use the Word (DOCX) file included in your package — it renders Arabic perfectly and is fully editable.',
    q_ar: 'ليه ملف PDF مبيظهرش العربي كويس؟',
    a_ar: 'دي مشكلة معروفة في محرك PDF مع النص العربي. لأي واجب عربي استخدم ملف Word اللي في الحزمة — بيظهر العربي مظبوط وينفع تعدّل عليه.',
  },
  {
    q_en: 'The assignment failed or timed out. What do I do?',
    a_en: 'Complex assignments occasionally need a second attempt. Tap "Try Again" first. If it keeps failing, send us a screenshot on WhatsApp and we\'ll sort it out fast — and we won\'t count a failed mission against your quota.',
    q_ar: 'المهمة فشلت أو أخدت وقت طويل. أعمل إيه؟',
    a_ar: 'الواجبات المعقدة أحياناً محتاجة محاولة تانية. اضغط "حاول تاني" الأول. لو فضلت تفشل، ابعتلنا سكرين شوت على واتساب وهنحلها بسرعة — والمهمة الفاشلة مش بتتحسب عليك.',
  },
  {
    q_en: 'Can I re-download an old assignment?',
    a_en: 'Yes. Every completed mission is saved in your Vault. Open the Vault, find the mission, and download the package again any time.',
    q_ar: 'ينفع أنزّل واجب قديم تاني؟',
    a_ar: 'أيوة. كل مهمة خلصت بتتحفظ في الـ Vault. افتح الـ Vault، دوّر على المهمة، ونزّل الحزمة تاني في أي وقت.',
  },
  {
    q_en: 'How does the referral program work?',
    a_en: 'Share your referral link from the Account page. When a friend signs up using it, you both get +2 free missions. There is no limit on how many friends you can invite.',
    q_ar: 'إزاي بيشتغل نظام الدعوة؟',
    a_ar: 'شارك رابط الدعوة من صفحة الحساب. لما صاحبك يسجّل بيه، انت وهو تاخدوا +٢ مهمة مجانية. مفيش حد أقصى لعدد الأصحاب.',
  },
  {
    q_en: 'Is using Mi-Assignment allowed at my university?',
    a_en: 'Mi-Assignment is a study aid designed to help you understand and structure your work. You are responsible for using it in line with your institution\'s academic integrity policy. Use the step-by-step breakdown to learn the material, not just to submit.',
    q_ar: 'استخدام Mi-Assignment مسموح في جامعتي؟',
    a_ar: 'Mi-Assignment أداة مذاكرة بتساعدك تفهم وتنظّم شغلك. انت مسؤول إنك تستخدمها بما يتوافق مع سياسة النزاهة الأكاديمية في جامعتك. استخدم الشرح خطوة بخطوة علشان تتعلم، مش بس تسلّم.',
  },
  {
    q_en: 'How do I cancel my subscription?',
    a_en: 'There is no automatic recurring charge — each period is renewed manually. To stop renewing, simply don\'t renew, or message us on WhatsApp before your expiry date.',
    q_ar: 'إزاي ألغي الاشتراك؟',
    a_ar: 'مفيش خصم تلقائي متكرر — كل فترة بتتجدد يدوياً. علشان توقف التجديد، بس ماتجددش، أو كلمنا على واتساب قبل تاريخ الانتهاء.',
  },
];

export function HelpPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [open, setOpen] = useState<number | null>(0);
  const [query, setQuery] = useState('');

  const filtered = FAQS.filter(f => {
    if (!query.trim()) return true;
    const hay = `${f.q_en} ${f.a_en} ${f.q_ar} ${f.a_ar}`.toLowerCase();
    return hay.includes(query.toLowerCase());
  });

  return (
    <div className={cn('min-h-screen bg-[#050608] text-white p-4 lg:p-8', isAr && 'font-[Cairo]')} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl mx-auto space-y-6">

        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors text-sm">
          <ArrowLeft className={cn('w-4 h-4', isAr && 'rotate-180')} /> {isAr ? 'رجوع' : 'Back'}
        </button>

        <div>
          <h1 className="text-2xl lg:text-3xl font-black">{isAr ? 'مركز المساعدة' : 'Help Center'}</h1>
          <p className="text-gray-500 text-sm mt-1">{isAr ? 'أسئلة شائعة وإجابات سريعة' : 'Common questions, answered'}</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600', isAr ? 'right-4' : 'left-4')} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={isAr ? 'دوّر على سؤالك...' : 'Search for your question...'}
            className={cn('w-full bg-[#0A0B0E] border border-gray-800 rounded-xl py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#22D3EE]/50',
              isAr ? 'pr-11 pl-4' : 'pl-11 pr-4')}
          />
        </div>

        {/* FAQ list */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">{isAr ? 'مفيش نتيجة. جرّب كلمة تانية أو كلمنا على واتساب.' : 'No results. Try another word or message us on WhatsApp.'}</p>
          ) : filtered.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="bg-[#0A0B0E] border border-gray-800 rounded-xl overflow-hidden">
                <button onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left">
                  <span className="font-semibold text-sm">{isAr ? f.q_ar : f.q_en}</span>
                  <ChevronDown className={cn('w-4 h-4 text-gray-500 shrink-0 transition-transform', isOpen && 'rotate-180')} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4">
                    <p className="text-gray-400 text-sm leading-relaxed">{isAr ? f.a_ar : f.a_en}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still need help */}
        <div className="bg-gradient-to-br from-[#22D3EE]/10 to-[#A855F7]/5 border border-[#22D3EE]/20 rounded-2xl p-6 text-center">
          <MessageCircle className="w-8 h-8 text-[#22D3EE] mx-auto mb-3" />
          <h3 className="font-bold mb-1">{isAr ? 'لسه محتاج مساعدة؟' : 'Still need help?'}</h3>
          <p className="text-gray-400 text-sm mb-4">{isAr ? 'كلمنا على واتساب وهنرد عليك بسرعة.' : 'Message us on WhatsApp and we\'ll get back to you fast.'}</p>
          <a href="https://wa.me/201107743984" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#22D3EE] text-black font-bold rounded-xl hover:bg-white transition-all text-sm">
            <MessageCircle className="w-4 h-4" /> {isAr ? 'واتساب' : 'WhatsApp us'}
          </a>
        </div>
      </div>
    </div>
  );
}
