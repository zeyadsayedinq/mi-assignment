import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import {
  Home, CreditCard, Phone, Mail, Shield, ChevronRight,
  Lock, CheckCircle2, AlertCircle, Copy, MessageCircle, ArrowLeft
} from 'lucide-react';
import { cn } from '../lib/utils';

const PLANS: Record<string, {
  nameEn: string; nameAr: string;
  price: number; currency: string;
  missions: number; period: string; periodAr: string;
}> = {
  pro_monthly: {
    nameEn: 'Pro Monthly', nameAr: 'برو شهري',
    price: 350, currency: 'EGP', missions: 25,
    period: 'month', periodAr: 'شهر',
  },
  pro_quarterly: {
    nameEn: 'Pro Quarterly', nameAr: 'برو ربع سنوي',
    price: 1000, currency: 'EGP', missions: 60,
    period: 'quarter', periodAr: 'ربع سنة',
  },
};

function validatePhone(phone: string): boolean {
  const clean = phone.replace(/[\s\-\(\)]/g, '');
  return /^01[0-9]{9}$/.test(clean) || /^\+[1-9]\d{7,14}$/.test(clean) || /^05[0-9]{8}$/.test(clean);
}

type Step = 'form' | 'payment';

export function CheckoutPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { session, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan') || 'pro_quarterly';
  const plan = PLANS[planId] || PLANS.pro_quarterly;

  const [step, setStep] = useState<Step>('form');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState('');

  useEffect(() => { if (user?.email) setEmail(user.email); }, [user?.email]);
  useEffect(() => { if (!session) navigate('/auth?next=/checkout?plan=' + planId); }, [session]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = isAr ? 'مطلوب' : 'Required';
    if (!lastName.trim()) errs.lastName = isAr ? 'مطلوب' : 'Required';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = isAr ? 'بريد إلكتروني غير صحيح' : 'Invalid email';
    if (!phone.trim() || !validatePhone(phone))
      errs.phone = isAr ? 'أدخل رقم هاتف صحيح (مثال: 01001234567)' : 'Enter a valid phone number (e.g. 01001234567)';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/create-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session?.user?.id,
          plan: planId,
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          currency: plan.currency,
          amount: plan.price,
        }),
      });
      const data = await res.json();
      if (data?.url) {
        // Tap returned a payment URL — redirect directly
        window.location.href = data.url;
      } else {
        // Tap not configured yet — show manual payment step
        setStep('payment');
      }
    } catch {
      // Fallback to manual payment
      setStep('payment');
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const PlanSummary = () => (
    <div className="bg-[#0A0B0E] border border-[#22D3EE]/30 rounded-2xl p-5 mb-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">
            {isAr ? 'الخطة المختارة' : 'Selected Plan'}
          </p>
          <p className="text-white font-black text-lg">{isAr ? plan.nameAr : plan.nameEn}</p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-gray-500 text-xs">
              <CheckCircle2 className="w-3 h-3 text-[#22D3EE]" />
              {plan.missions} {isAr ? 'مهمة' : 'missions'}
            </span>
            <span className="flex items-center gap-1 text-gray-500 text-xs">
              <CheckCircle2 className="w-3 h-3 text-[#22D3EE]" />
              {isAr ? 'كل أنواع الواجبات' : 'All assignment types'}
            </span>
          </div>
        </div>
        <div className="text-end shrink-0">
          <p className="text-[#22D3EE] font-black text-3xl">{plan.price.toLocaleString()}</p>
          <p className="text-gray-500 text-xs">{plan.currency} / {isAr ? plan.periodAr : plan.period}</p>
        </div>
      </div>
    </div>
  );

  // ── STEP 1: Billing Form ────────────────────────────────────────────────────
  if (step === 'form') {
    return (
      <div className="min-h-screen bg-[#020617] text-white py-8 px-4" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="max-w-lg mx-auto">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-8 text-xs text-gray-600">
            <Link to="/" className="hover:text-[#22D3EE] transition-colors flex items-center gap-1">
              <Home className="w-3 h-3" /> {isAr ? 'الرئيسية' : 'Home'}
            </Link>
            <ChevronRight className={cn('w-3 h-3', isAr && 'rotate-180')} />
            <Link to="/pricing" className="hover:text-[#22D3EE] transition-colors">
              {isAr ? 'الأسعار' : 'Pricing'}
            </Link>
            <ChevronRight className={cn('w-3 h-3', isAr && 'rotate-180')} />
            <span className="text-gray-400">{isAr ? 'بيانات الطلب' : 'Your Details'}</span>
          </nav>

          {/* Steps indicator */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#22D3EE] flex items-center justify-center text-black font-black text-xs">1</div>
              <span className="text-white text-sm font-medium">{isAr ? 'بياناتك' : 'Your Details'}</span>
            </div>
            <div className="flex-1 h-px bg-gray-800" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-gray-600 font-black text-xs">2</div>
              <span className="text-gray-600 text-sm">{isAr ? 'الدفع' : 'Payment'}</span>
            </div>
          </div>

          <h1 className="text-2xl font-black mb-2">{isAr ? 'أدخل بياناتك' : 'Enter Your Details'}</h1>
          <p className="text-gray-500 text-sm mb-6">
            {isAr ? 'ستُستخدم هذه البيانات لإصدار الفاتورة وتفعيل اشتراكك.' : 'Used for your invoice and to activate your subscription.'}
          </p>

          <PlanSummary />

          <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-6">
            <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'firstName', label: isAr ? 'الاسم الأول' : 'First Name', value: firstName, set: setFirstName, ph: isAr ? 'محمد' : 'John' },
                  { id: 'lastName', label: isAr ? 'الاسم الأخير' : 'Last Name', value: lastName, set: setLastName, ph: isAr ? 'أحمد' : 'Smith' },
                ].map(f => (
                  <div key={f.id}>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                      {f.label} <span className="text-red-400">*</span>
                    </label>
                    <input value={f.value} onChange={e => { f.set(e.target.value); setFieldErrors(p => ({ ...p, [f.id]: '' })); }}
                      placeholder={f.ph} autoComplete={f.id}
                      className={cn('w-full bg-[#050608] border rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-all',
                        fieldErrors[f.id] ? 'border-red-500/60' : 'border-gray-800 focus:border-[#22D3EE]/50')} />
                    {fieldErrors[f.id] && <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors[f.id]}</p>}
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                  {isAr ? 'البريد الإلكتروني' : 'Email'} <span className="text-red-400">*</span>
                </label>
                <input value={email} onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: '' })); }}
                  type="email" dir="ltr" placeholder="student@university.edu" autoComplete="email"
                  className={cn('w-full bg-[#050608] border rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-all',
                    fieldErrors.email ? 'border-red-500/60' : 'border-gray-800 focus:border-[#22D3EE]/50')} />
                {fieldErrors.email && <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.email}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                  {isAr ? 'رقم الهاتف' : 'Phone Number'} <span className="text-red-400">*</span>
                </label>
                <input value={phone} onChange={e => { setPhone(e.target.value); setFieldErrors(p => ({ ...p, phone: '' })); }}
                  type="tel" dir="ltr" placeholder="01XXXXXXXXX" autoComplete="tel"
                  className={cn('w-full bg-[#050608] border rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none transition-all',
                    fieldErrors.phone ? 'border-red-500/60' : 'border-gray-800 focus:border-[#22D3EE]/50')} />
                {fieldErrors.phone
                  ? <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.phone}</p>
                  : <p className="text-gray-700 text-[10px] mt-1">{isAr ? 'مصر: 01XXXXXXXXX · السعودية/الإمارات: +966XXXXXXXXX' : 'Egypt: 01XXXXXXXXX · KSA/UAE: +966XXXXXXXXX'}</p>}
              </div>

              <p className="text-gray-600 text-[10px] leading-relaxed">
                {isAr ? 'بالمتابعة توافق على ' : 'By continuing you agree to our '}
                <Link to="/terms" className="text-[#22D3EE] hover:underline">{isAr ? 'الشروط' : 'Terms'}</Link>
                {isAr ? ' و' : ' and '}
                <Link to="/refund" className="text-[#22D3EE] hover:underline">{isAr ? 'سياسة الاسترداد' : 'Refund Policy'}</Link>.
              </p>

              {error && (
                <div className="flex items-start gap-2 text-red-400 text-xs bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-black font-black rounded-xl hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm touch-manipulation">
                {loading
                  ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />{isAr ? 'جاري المعالجة...' : 'Processing...'}</>
                  : <>{isAr ? 'التالي — اختيار طريقة الدفع' : 'Next — Choose Payment Method'}<ChevronRight className={cn('w-4 h-4', isAr && 'rotate-180')} /></>
                }
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 2: Payment Options ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#020617] text-white py-8 px-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-lg mx-auto">

        {/* Back */}
        <button onClick={() => setStep('form')}
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm mb-8">
          <ArrowLeft className={cn('w-4 h-4', isAr && 'rotate-180')} />
          {isAr ? 'تعديل البيانات' : 'Edit details'}
        </button>

        {/* Steps indicator */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#22D3EE]/20 border border-[#22D3EE]/40 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-[#22D3EE]" />
            </div>
            <span className="text-gray-500 text-sm">{isAr ? 'بياناتك' : 'Your Details'}</span>
          </div>
          <div className="flex-1 h-px bg-[#22D3EE]/40" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#22D3EE] flex items-center justify-center text-black font-black text-xs">2</div>
            <span className="text-white text-sm font-medium">{isAr ? 'الدفع' : 'Payment'}</span>
          </div>
        </div>

        <h1 className="text-2xl font-black mb-2">{isAr ? 'اختر طريقة الدفع' : 'Choose Payment Method'}</h1>
        <p className="text-gray-500 text-sm mb-6">
          {isAr
            ? `مرحباً ${firstName}! اختر طريقة الدفع المناسبة لك.`
            : `Hey ${firstName}! Choose your preferred payment method.`}
        </p>

        <PlanSummary />

        <div className="space-y-3">

          {/* InstaPay */}
          <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/20 flex items-center justify-center shrink-0">
                <span className="text-[#22D3EE] font-black text-xs">IP</span>
              </div>
              <div>
                <p className="text-white font-bold text-sm">InstaPay</p>
                <p className="text-gray-500 text-xs">{isAr ? 'فوري — بدون رسوم إضافية' : 'Instant — no extra fees'}</p>
              </div>
            </div>
            <div className="bg-[#050608] rounded-xl p-4 flex items-center justify-between mb-3">
              <div>
                <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-1">{isAr ? 'رقم InstaPay' : 'InstaPay Handle'}</p>
                <p className="text-white font-mono font-bold text-lg">zeyadsayedinq</p>
              </div>
              <button onClick={() => copyText('zeyadsayedinq', 'instapay')}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#22D3EE]/10 border border-[#22D3EE]/20 rounded-xl text-[#22D3EE] text-xs font-bold hover:bg-[#22D3EE]/20 transition-all">
                {copied === 'instapay' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'instapay' ? (isAr ? 'تم!' : 'Copied!') : (isAr ? 'نسخ' : 'Copy')}
              </button>
            </div>
            <div className="bg-[#050608] rounded-xl p-4 flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-1">{isAr ? 'المبلغ' : 'Amount'}</p>
                <p className="text-[#22D3EE] font-mono font-black text-lg">{plan.price} {plan.currency}</p>
              </div>
              <button onClick={() => copyText(String(plan.price), 'amount')}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#22D3EE]/10 border border-[#22D3EE]/20 rounded-xl text-[#22D3EE] text-xs font-bold hover:bg-[#22D3EE]/20 transition-all">
                {copied === 'amount' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'amount' ? (isAr ? 'تم!' : 'Copied!') : (isAr ? 'نسخ' : 'Copy')}
              </button>
            </div>
            <a href={`https://wa.me/201107743984?text=${encodeURIComponent(
              isAr
                ? `مرحبا، اسمي ${firstName} ${lastName} (${email}) ودفعت ${plan.price} جنيه اشتراك Mi-Assignment ${plan.nameAr} على InstaPay. بانتظار التفعيل.`
                : `Hi, my name is ${firstName} ${lastName} (${email}). I just paid ${plan.price} EGP for Mi-Assignment ${plan.nameEn} via InstaPay. Please activate my account.`
            )}`}
              target="_blank" rel="noopener noreferrer"
              className="w-full py-3 bg-green-500 hover:bg-green-400 text-black font-black rounded-xl flex items-center justify-center gap-2 text-sm transition-all">
              <MessageCircle className="w-4 h-4" />
              {isAr ? 'ابعت إثبات الدفع على واتساب ←' : 'Send Payment Proof on WhatsApp →'}
            </a>
          </div>

          {/* Vodafone Cash */}
          <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <span className="text-red-400 font-black text-xs">VC</span>
              </div>
              <div>
                <p className="text-white font-bold text-sm">{isAr ? 'فودافون كاش' : 'Vodafone Cash'}</p>
                <p className="text-gray-500 text-xs">{isAr ? 'تحويل فوري' : 'Instant transfer'}</p>
              </div>
            </div>
            <div className="bg-[#050608] rounded-xl p-4 flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-1">{isAr ? 'رقم الهاتف' : 'Phone Number'}</p>
                <p className="text-white font-mono font-bold text-lg">01107743984</p>
              </div>
              <button onClick={() => copyText('01107743984', 'vodafone')}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all">
                {copied === 'vodafone' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'vodafone' ? (isAr ? 'تم!' : 'Copied!') : (isAr ? 'نسخ' : 'Copy')}
              </button>
            </div>
            <a href={`https://wa.me/201107743984?text=${encodeURIComponent(
              isAr
                ? `مرحبا، اسمي ${firstName} ${lastName} (${email}) ودفعت ${plan.price} جنيه اشتراك Mi-Assignment ${plan.nameAr} على فودافون كاش. بانتظار التفعيل.`
                : `Hi, my name is ${firstName} ${lastName} (${email}). I just paid ${plan.price} EGP for Mi-Assignment ${plan.nameEn} via Vodafone Cash. Please activate my account.`
            )}`}
              target="_blank" rel="noopener noreferrer"
              className="w-full py-3 bg-green-500 hover:bg-green-400 text-black font-black rounded-xl flex items-center justify-center gap-2 text-sm transition-all">
              <MessageCircle className="w-4 h-4" />
              {isAr ? 'ابعت إثبات الدفع على واتساب ←' : 'Send Payment Proof on WhatsApp →'}
            </a>
          </div>

          {/* Security note */}
          <div className="flex items-start gap-3 bg-[#0A0B0E] border border-gray-800 rounded-2xl p-4">
            <Lock className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-white text-xs font-bold mb-1">{isAr ? 'دفع آمن ومعتمد' : 'Safe & Verified Payment'}</p>
              <p className="text-gray-600 text-[10px] leading-relaxed">
                {isAr
                  ? 'بعد الدفع، ابعت السكرين شوت على واتساب وهنفعّل حسابك خلال ساعة واحدة كحد أقصى.'
                  : 'After payment, send the screenshot on WhatsApp. We\'ll activate your account within 1 hour maximum.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
