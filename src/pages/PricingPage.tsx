import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, Zap, Check, Star, Lock, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useAuth } from '../contexts/AuthContext';
import { getSubscriptionStatus, createTapCharge, type SubscriptionStatus } from '../lib/subscription';
import { Analytics } from '../lib/analytics';
import { cn } from '../lib/utils';

// ─── Pricing matrix — EGP quarterly = 1000 EGP as instructed ────────────────
const CURRENCIES = [
  {
    code: 'EGP', symbol: 'ج.م', label: 'مصر 🇪🇬', flag: '🇪🇬',
    monthly: 390,    // ~$8
    quarterly: 1000, // instructed exact price
    yearly: 3500,    // ~$70
    quarterSaving: 14, // vs monthly×3
    yearSaving: 25,
  },
  {
    code: 'SAR', symbol: 'ر.س', label: 'السعودية 🇸🇦', flag: '🇸🇦',
    monthly: 37,
    quarterly: 99,
    yearly: 349,
    quarterSaving: 11,
    yearSaving: 21,
  },
  {
    code: 'AED', symbol: 'د.إ', label: 'الإمارات 🇦🇪', flag: '🇦🇪',
    monthly: 37,
    quarterly: 99,
    yearly: 349,
    quarterSaving: 11,
    yearSaving: 21,
  },
  {
    code: 'KWD', symbol: 'د.ك', label: 'الكويت 🇰🇼', flag: '🇰🇼',
    monthly: 3,
    quarterly: 8,
    yearly: 28,
    quarterSaving: 11,
    yearSaving: 22,
  },
  {
    code: 'BHD', symbol: 'د.ب', label: 'البحرين 🇧🇭', flag: '🇧🇭',
    monthly: 4,
    quarterly: 11,
    yearly: 37,
    quarterSaving: 8,
    yearSaving: 23,
  },
  {
    code: 'JOD', symbol: 'JD', label: 'الأردن 🇯🇴', flag: '🇯🇴',
    monthly: 4.5,
    quarterly: 13.5,
    yearly: 47,
    quarterSaving: 10,
    yearSaving: 13,
  },
  {
    code: 'USD', symbol: '$', label: 'دولي 🌍', flag: '🌍',
    monthly: 10,
    quarterly: 27,
    yearly: 95,
    quarterSaving: 10,
    yearSaving: 21,
  },
];

type Billing = 'monthly' | 'quarterly' | 'yearly';

const FREE_FEATURES_AR = [
  '٣ مهام مجانية للتجربة',
  'كل أنواع الواجبات',
  'عارض الشرائح',
  'مختبر الصور',
  'أرشيف Mi-Vault',
];

const PRO_FEATURES_AR = [
  '٦٠ مهمة / ترم (ربع سنوي) ♾️',
  'كل أنواع الواجبات (+٢٠ نوع)',
  'تصدير: PDF · Word (.docx) · PowerPoint (.pptx)',
  'تصدير: Excel (.xlsx) · CSV · SQL (.sql)',
  'تصدير: ملفات كود (.py .js .cpp .java .c .r .m)',
  'تصدير: مواقع HTML · رسوم SVG · ملفات ZIP',
  'بروزنتيشن مع صور AI',
  'رياضيات وهندسة بخطوات LaTeX',
  'Mi-Vault كامل + بحث',
  'Mi-Academy شرح تفصيلي',
  'معالجة أسرع (٣x)',
  'دعم مباشر',
  'واجهة عربية كاملة RTL',
];

const FREE_FEATURES_EN = [
  '3 free missions to try',
  'All assignment types',
  'Slide deck viewer',
  'Image Lab',
  'Mi-Vault archive',
];

const PRO_FEATURES_EN = [
  '60 missions / quarter · Unlimited on yearly ♾️',
  'All 20+ assignment types',
  'Export: PDF · Word (.docx) · PowerPoint (.pptx)',
  'Export: Excel (.xlsx) · CSV · SQL (.sql)',
  'Export: Code files (.py .js .cpp .java .c .r .m)',
  'Export: HTML websites · SVG diagrams · ZIP packages',
  'Presentations with AI-generated images',
  'Math & engineering with step-by-step LaTeX',
  'Full Mi-Vault archive + search',
  'Mi-Academy learning breakdowns',
  'Priority AI processing (3x faster)',
  'Direct support',
  'Full Arabic RTL interface',
];

export function PricingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';
  const { session, user } = useAuth();
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [currency, setCurrency] = useState(CURRENCIES[0]); // default Egypt
  const [billing, setBilling] = useState<Billing>('quarterly');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) getSubscriptionStatus(user.id, user.email).then(setSub);
    // Auto-detect
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.includes('Riyadh') || tz.includes('Saudi')) setCurrency(CURRENCIES[1]);
    else if (tz.includes('Dubai') || tz.includes('Abu_Dhabi')) setCurrency(CURRENCIES[2]);
    else if (tz.includes('Kuwait')) setCurrency(CURRENCIES[3]);
    else if (tz.includes('Bahrain')) setCurrency(CURRENCIES[4]);
    else if (tz.includes('Amman') || tz.includes('Jordan')) setCurrency(CURRENCIES[5]);
    else if (!tz.includes('Cairo') && !tz.includes('Africa/Cairo')) setCurrency(CURRENCIES[6]);
    // else stays Egypt (default)
  }, [user]);

  const getPrice = () => {
    if (billing === 'monthly') return currency.monthly;
    if (billing === 'quarterly') return currency.quarterly;
    return currency.yearly;
  };

  const getPeriodLabel = () => {
    if (billing === 'monthly') return isAr ? t('pricing.perMonth') : '/mo';
    if (billing === 'quarterly') return isAr ? t('pricing.perQuarter') : '/quarter';
    return isAr ? t('pricing.perYear') : '/year';
  };

  const getSaving = () => {
    if (billing === 'quarterly') return currency.quarterSaving;
    if (billing === 'yearly') return currency.yearSaving;
    return 0;
  };

  const handleUpgrade = async () => {
    if (!session || !user) { navigate('/auth?next=/pricing'); return; }
    setIsLoading(true); setError('');
    Analytics.upgradeClicked('pricing_page');
    try {
      const planId = billing === 'monthly' ? 'pro_monthly' : billing === 'quarterly' ? 'pro_quarterly' : 'pro_yearly';
      const { chargeUrl } = await createTapCharge({
        amount: getPrice(),
        currency: currency.code as any,
        userId: user.id,
        email: user.email || '',
        firstName: user.email?.split('@')[0] || 'Student',
        plan: planId as any,
        redirectUrl: `${window.location.origin}/payment-success`,
      });
      window.location.href = chargeUrl;
    } catch (err: any) {
      setError(err.message || (isAr ? 'في مشكلة في الدفع، حاول تاني' : 'Payment failed. Try again.'));
    } finally { setIsLoading(false); }
  };

  const isPro = sub?.role === 'owner' || (sub?.plan && sub.plan.startsWith('pro_'));
  const freeFeatures = isAr ? FREE_FEATURES_AR : FREE_FEATURES_EN;
  const proFeatures = isAr ? PRO_FEATURES_AR : PRO_FEATURES_EN;

  return (
    <div className={cn('w-full min-h-screen relative bg-[#020617] text-white font-sans p-6 lg:p-10', isAr && 'font-[Cairo]')} dir={isAr ? 'rtl' : 'ltr'}>
      <Link to="/" className="absolute top-6 left-6 z-20 flex items-center justify-center w-10 h-10 rounded-xl bg-[#0A0B0E] border border-gray-800 text-gray-500 hover:text-white hover:border-gray-600 transition-all">
        <Home className="w-5 h-5" />
      </Link>

      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10 flex flex-col items-center">
          <Link to="/" className="mb-6 hover:opacity-80 transition-opacity flex flex-col items-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#22D3EE] to-[#A855F7] mb-3 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
              <span className="font-black text-black text-lg">Mi</span>
            </div>
            <span className="font-black text-white tracking-tight">Mi-Assignment</span>
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22D3EE]/10 border border-[#22D3EE]/20 text-[#22D3EE] font-mono text-[10px] uppercase tracking-widest mb-4">
            <Shield className="w-3 h-3" />
            {isAr ? 'خطط Mi-Assignment' : 'Mi-Assignment Access Tiers'}
          </div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-3">
            {isAr ? 'اختار خطتك' : 'Choose Your Plan'}
          </h1>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">
            {isAr
              ? 'أسعار مدروسة لطلاب مصر والسعودية والإمارات والخليج'
              : 'Designed for MENA students — fair pricing, real results'}
          </p>
        </div>

        {/* Currency selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {CURRENCIES.map(c => (
            <button
              key={c.code}
              onClick={() => setCurrency(c)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-bold transition-all',
                currency.code === c.code
                  ? 'bg-[#22D3EE]/10 border-[#22D3EE]/50 text-[#22D3EE]'
                  : 'bg-[#0A0B0E] border-gray-800 text-gray-500 hover:border-gray-600 hover:text-white'
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-2 mb-10 flex-wrap">
          {(['monthly', 'quarterly', 'yearly'] as Billing[]).map(b => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={cn(
                'relative px-5 py-2.5 rounded-xl border text-sm font-bold transition-all',
                billing === b
                  ? 'bg-[#22D3EE] border-[#22D3EE] text-black'
                  : 'bg-[#0A0B0E] border-gray-800 text-gray-400 hover:border-gray-600'
              )}
            >
              {isAr
                ? b === 'monthly' ? 'شهري' : b === 'quarterly' ? 'ربع سنوي' : 'سنوي'
                : b === 'monthly' ? 'Monthly' : b === 'quarterly' ? 'Quarterly' : 'Yearly'}
              {b !== 'monthly' && (
                <span className={cn(
                  'absolute -top-2.5 -end-2.5 text-[9px] font-black px-1.5 py-0.5 rounded-full',
                  billing === b ? 'bg-black text-[#22D3EE]' : 'bg-emerald-500 text-white'
                )}>
                  -{b === 'quarterly' ? currency.quarterSaving : currency.yearSaving}%
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Egypt special callout */}
        {currency.code === 'EGP' && billing === 'quarterly' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto mb-6 bg-gradient-to-r from-emerald-500/10 to-[#22D3EE]/5 border border-emerald-500/30 rounded-2xl px-5 py-3 text-center"
          >
            <p className="text-emerald-400 font-bold text-sm">
              {isAr ? '🇪🇬 خاص لطلاب مصر — ١٠٠٠ ج.م بس لكل ترم 🎓' : '🇪🇬 Egypt special — 1000 EGP per academic quarter'}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              {isAr ? 'يكفيك طول الترم بالكامل 💪' : 'Covers your full university semester'}
            </p>
          </motion.div>
        )}

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">

          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-8"
          >
            <div className="mb-6">
              <p className="text-gray-400 font-bold text-sm uppercase tracking-widest mb-3">
                {isAr ? 'مجاني' : 'Free'}
              </p>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black text-white">0</span>
                <span className="text-gray-500 text-sm pb-2">{getPeriodLabel()}</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {freeFeatures.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-400 text-sm">
                  <Check className="w-4 h-4 text-gray-600 shrink-0" /> {f}
                </li>
              ))}
            </ul>
            {sub?.plan === 'free' && (
              <p className="text-center text-[#22D3EE] text-xs font-mono mb-4">
                {isAr
                  ? `${sub.missionsLeft} / ${sub.missionsLimit ?? 3} مهام متبقية`
                  : `${sub.missionsLeft} / ${sub.missionsLimit ?? 3} missions left`}
              </p>
            )}
            {!session || !user ? (
              <button 
                onClick={() => navigate('/auth?next=/pricing')} 
                className="w-full py-3 bg-[#22D3EE]/10 text-[#22D3EE] hover:bg-[#22D3EE]/20 hover:text-white transition-colors rounded-xl font-bold text-sm text-center"
              >
                {isAr ? 'ابدأ مجاناً' : 'Start Free'}
              </button>
            ) : (
              <div className="w-full py-3 border border-gray-700 text-gray-500 rounded-xl font-bold text-sm text-center cursor-default">
                {isPro
                  ? (isAr ? 'خطة سابقة' : 'Downgraded')
                  : (isAr ? 'خطتك الحالية' : 'Current Plan')}
              </div>
            )}
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-gradient-to-b from-[#22D3EE]/10 via-[#0A0B0E] to-[#A855F7]/5 border border-[#22D3EE]/40 rounded-2xl p-8 relative overflow-hidden"
          >
            {/* Most popular badge */}
            <div className={cn(
              'absolute top-4 flex items-center gap-1 bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider',
              isAr ? 'left-4' : 'right-4'
            )}>
              <Star className="w-3 h-3" fill="currentColor" />
              {isAr ? 'الأكثر اختياراً' : 'Most Popular'}
            </div>

            <div className="mb-6 mt-4">
              <p className="text-[#22D3EE] font-bold text-sm uppercase tracking-widest mb-3">
                {isAr ? 'برو' : 'Pro'}
              </p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-gray-400">{currency.symbol}</span>
                <span className="text-5xl font-black text-white">{getPrice()}</span>
                <span className="text-gray-400 text-sm pb-2">{getPeriodLabel()}</span>
              </div>
              {getSaving() > 0 && (
                <p className="text-emerald-400 text-xs mt-1.5 font-medium">
                  {isAr ? `وفّر ${getSaving()}% مقارنة بالشهري` : `Save ${getSaving()}% vs monthly`}
                </p>
              )}
              {/* Per-month equivalent for quarterly/yearly */}
              {billing !== 'monthly' && (
                <p className="text-gray-600 text-xs mt-1">
                  ≈ {currency.symbol}{Math.round(getPrice() / (billing === 'quarterly' ? 3 : 12))}
                  {isAr ? ' / شهر' : ' / month'}
                </p>
              )}
            </div>

            <ul className="space-y-3 mb-8">
              {proFeatures.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-300 text-sm">
                  <Check className="w-4 h-4 text-[#22D3EE] shrink-0" /> {f}
                </li>
              ))}
            </ul>

            {error && (
              <p className="text-red-400 text-xs text-center mb-3 bg-red-500/5 border border-red-500/20 rounded-xl p-2">{error}</p>
            )}

            <button
              onClick={handleUpgrade}
              disabled={isLoading || isPro}
              className="w-full py-4 bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-black font-black rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : isPro ? (
                <><Shield className="w-4 h-4" /> {isAr ? 'خطتك الحالية' : 'Current Plan'}</>
              ) : (
                <><Zap className="w-4 h-4" /> {isAr ? 'اشترك الآن' : 'Subscribe Now'}</>
              )}
            </button>

            <p className="text-center text-gray-600 text-xs mt-3 flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3" />
              {isAr ? 'دفع آمن عبر Tap Payments — مفيش بيانات بتتحفظ' : 'Secured by Tap Payments · No card stored'}
            </p>
          </motion.div>
        </div>

        {/* Payment methods */}
        <div className="text-center space-y-4">
          <p className="text-gray-600 text-xs">
            {isAr ? 'وسائل الدفع المقبولة' : 'Accepted payment methods'}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Visa', 'Mastercard', 'Mada مدى', 'Apple Pay', 'KNET', 'Fawry فوري', 'Meeza ميزة'].map(m => (
              <span key={m} className="px-3 py-1.5 bg-[#0A0B0E] border border-gray-800 rounded-lg text-gray-500 text-xs font-mono">{m}</span>
            ))}
          </div>
          <p className="text-gray-700 text-xs mt-2">
            {isAr
              ? 'متاح في 🇪🇬 مصر · 🇸🇦 السعودية · 🇦🇪 الإمارات · 🇰🇼 الكويت · 🇧🇭 البحرين · 🇯🇴 الأردن'
              : 'Available in 🇪🇬 Egypt · 🇸🇦 KSA · 🇦🇪 UAE · 🇰🇼 Kuwait · 🇧🇭 Bahrain · 🇯🇴 Jordan'}
          </p>
        </div>

        {/* FAQ for MENA students */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          {(isAr ? [
            { q: 'الخطة ربع السنوية بتغطي إيه بالظبط؟', a: 'بتغطي ٣ شهور كاملة — ٦٠ مهمة في الترم. كافية لترم جامعي كامل وبيزيد.' },
            { q: 'ينفع أدفع ببطاقة فودافون كاش؟', a: 'دلوقتي بندعم فوري وميزة في مصر، وكل بطاقات الفيزا والماستركارد.' },
            { q: 'لو ما عجبنيش أقدر أسترجع؟', a: 'تقدر تتواصل معانا خلال ٧ أيام من الاشتراك وبنرجعلك فلوسك.' },
            { q: 'Mi بيحل بالعربي؟', a: 'أيوه! لما بتختار العربي في الإعدادات، Mi بيجاوب بالعربي الفصيح.' },
          ] : [
            { q: 'What does the quarterly plan cover?', a: 'Full 3 months — 60 missions per quarter. More than enough for a complete university semester.' },
            { q: 'Can I get a refund?', a: 'Yes — contact us within 7 days of subscribing for a full refund.' },
            { q: 'Does Mi respond in Arabic?', a: 'Yes! Set the language to Arabic in settings and Mi answers in Arabic.' },
            { q: 'Which universities are supported?', a: 'All universities worldwide — Cairo, AUC, GUC, CIC, KFUPM, AUS, and any global institution.' },
          ]).map((item, i) => (
            <div key={i} className="bg-[#0A0B0E] border border-gray-800 rounded-xl p-5">
              <p className="text-white font-bold text-sm mb-2">{item.q}</p>
              <p className="text-gray-500 text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
        
        {/* Legal links */}
        <div className="mt-8 text-center flex flex-col items-center gap-4 text-xs text-gray-700">
          <LanguageSwitcher compact />
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/terms" className="hover:text-gray-400 transition-colors">{isAr ? 'شروط الاستخدام' : 'Terms of Service'}</a>
            <a href="/privacy" className="hover:text-gray-400 transition-colors">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</a>
            <a href="/sops" className="hover:text-gray-400 transition-colors">{isAr ? 'المساعدة' : 'Help & FAQ'}</a>
            <a href="mailto:support@mi-assignment.com" className="hover:text-gray-400 transition-colors">support@mi-assignment.com</a>
          </div>
          <div className="max-w-2xl mt-4 border-t border-gray-800/50 pt-4">
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Mi-Assignment is designed as an educational aid. Please ensure any content you submit complies with your institution's academic integrity policy. Any use of this platform for academic misconduct is strictly prohibited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
