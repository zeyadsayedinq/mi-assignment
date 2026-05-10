import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Home, CreditCard, Phone, Mail, Shield, ChevronRight, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

// Tap Payments accepted methods — required to display per their merchant agreement
const PAYMENT_METHODS = [
  { name: 'Visa', img: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg' },
  { name: 'Mastercard', img: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg' },
  { name: 'Mada', label: 'mada' },
  { name: 'Meeza', label: 'meeza' },
  { name: 'Apple Pay', label: '🍎' },
  { name: 'KNET', label: 'KNET' },
  { name: 'Fawry', label: 'Fawry' },
];

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

// Validate phone: Egyptian (01x) or Saudi (+966 / 05x) or UAE (+971 / 05x) or any +intl
function validatePhone(phone: string): boolean {
  const clean = phone.replace(/[\s\-\(\)]/g, '');
  // Egyptian: 01[0-9]{9}
  if (/^01[0-9]{9}$/.test(clean)) return true;
  // International with +
  if (/^\+[1-9]\d{7,14}$/.test(clean)) return true;
  // Saudi 05x
  if (/^05[0-9]{8}$/.test(clean)) return true;
  // UAE 05x
  if (/^05[0-9]{8}$/.test(clean)) return true;
  return false;
}

export function CheckoutPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { session, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan') || 'pro_quarterly';
  const plan = PLANS[planId] || PLANS.pro_quarterly;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Pre-fill email from session
  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!session) navigate('/auth?next=/checkout?plan=' + planId);
  }, [session]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = isAr ? 'مطلوب' : 'Required';
    if (!lastName.trim()) errs.lastName = isAr ? 'مطلوب' : 'Required';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = isAr ? 'بريد إلكتروني غير صحيح' : 'Invalid email';
    if (!phone.trim() || !validatePhone(phone))
      errs.phone = isAr
        ? 'أدخل رقم هاتف صحيح (مثال: 01001234567 أو +966501234567)'
        : 'Enter a valid phone number (e.g. 01001234567 or +966501234567)';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        window.location.href = data.url;
      } else {
        setError(data?.error || (isAr ? 'حدث خطأ. جرب مرة أخرى.' : 'Something went wrong. Please try again.'));
      }
    } catch {
      setError(isAr
        ? 'تعذّر الاتصال بخادم الدفع. جرب InstaPay أو تواصل معنا.'
        : 'Could not connect to payment server. Try InstaPay or contact us.');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({
    id, label, value, onChange, type = 'text', placeholder, dir: fieldDir, error: fieldError, required = true
  }: {
    id: string; label: string; value: string;
    onChange: (v: string) => void; type?: string;
    placeholder?: string; dir?: string;
    error?: string; required?: boolean;
  }) => (
    <div>
      <label htmlFor={id} className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        id={id} type={type} value={value} dir={fieldDir}
        onChange={e => { onChange(e.target.value); setFieldErrors(prev => ({ ...prev, [id]: '' })); }}
        placeholder={placeholder} required={required} autoComplete={id}
        className={cn(
          'w-full bg-[#050608] border rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-all',
          fieldError ? 'border-red-500/60 focus:border-red-500' : 'border-gray-800 focus:border-[#22D3EE]/50'
        )}
      />
      {fieldError && (
        <p className="flex items-center gap-1 text-red-400 text-[10px] mt-1">
          <AlertCircle className="w-3 h-3 shrink-0" /> {fieldError}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white py-8 px-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-lg mx-auto">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-8 text-xs text-gray-600" aria-label="breadcrumb">
          <Link to="/" className="hover:text-[#22D3EE] transition-colors flex items-center gap-1">
            <Home className="w-3 h-3" /> {isAr ? 'الرئيسية' : 'Home'}
          </Link>
          <ChevronRight className={cn('w-3 h-3', isAr && 'rotate-180')} />
          <Link to="/pricing" className="hover:text-[#22D3EE] transition-colors">{isAr ? 'الأسعار' : 'Pricing'}</Link>
          <ChevronRight className={cn('w-3 h-3', isAr && 'rotate-180')} />
          <span className="text-gray-400">{isAr ? 'إتمام الطلب' : 'Checkout'}</span>
        </nav>

        {/* Page title */}
        <h1 className="text-2xl font-black mb-6">{isAr ? 'إتمام الاشتراك' : 'Complete Your Subscription'}</h1>

        {/* Plan summary — required by Tap for transparency */}
        <div className="bg-[#0A0B0E] border border-[#22D3EE]/30 rounded-2xl p-5 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">
                {isAr ? 'الخطة المختارة' : 'Selected Plan'}
              </p>
              <p className="text-white font-black text-lg">{isAr ? plan.nameAr : plan.nameEn}</p>
              <div className="flex items-center gap-3 mt-1.5">
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
            <div className={cn('text-end', isAr && 'text-start')}>
              <p className="text-[#22D3EE] font-black text-3xl">{plan.price.toLocaleString()}</p>
              <p className="text-gray-500 text-xs">{plan.currency} / {isAr ? plan.periodAr : plan.period}</p>
            </div>
          </div>
        </div>

        {/* Billing form */}
        <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-6 mb-5">
          <h2 className="text-white font-bold text-sm mb-5 uppercase tracking-widest">
            {isAr ? 'بيانات الدفع' : 'Billing Information'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <InputField
                id="firstName"
                label={isAr ? 'الاسم الأول' : 'First Name'}
                value={firstName} onChange={setFirstName}
                placeholder={isAr ? 'محمد' : 'John'}
                error={fieldErrors.firstName}
              />
              <InputField
                id="lastName"
                label={isAr ? 'الاسم الأخير' : 'Last Name'}
                value={lastName} onChange={setLastName}
                placeholder={isAr ? 'أحمد' : 'Smith'}
                error={fieldErrors.lastName}
              />
            </div>

            {/* Email */}
            <InputField
              id="email" type="email" dir="ltr"
              label={isAr ? 'البريد الإلكتروني' : 'Email Address'}
              value={email} onChange={setEmail}
              placeholder="student@university.edu"
              error={fieldErrors.email}
            />

            {/* Phone — with country hint */}
            <div>
              <label htmlFor="phone" className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                {isAr ? 'رقم الهاتف' : 'Phone Number'} <span className="text-red-400">*</span>
              </label>
              <input
                id="phone" type="tel" value={phone} dir="ltr"
                onChange={e => { setPhone(e.target.value); setFieldErrors(prev => ({ ...prev, phone: '' })); }}
                placeholder={isAr ? '+20 01XXXXXXXXX' : '+20 01XXXXXXXXX or +966 5XXXXXXXX'}
                autoComplete="tel"
                className={cn(
                  'w-full bg-[#050608] border rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none transition-all',
                  fieldErrors.phone ? 'border-red-500/60' : 'border-gray-800 focus:border-[#22D3EE]/50'
                )}
              />
              {fieldErrors.phone
                ? <p className="flex items-center gap-1 text-red-400 text-[10px] mt-1"><AlertCircle className="w-3 h-3" /> {fieldErrors.phone}</p>
                : <p className="text-gray-700 text-[10px] mt-1">{isAr ? 'مصر: 01XXXXXXXXX — السعودية/الإمارات: +966XXXXXXXXX' : 'Egypt: 01XXXXXXXXX · KSA/UAE: +966XXXXXXXXX'}</p>
              }
            </div>

            {/* Terms consent — required by Tap */}
            <p className="text-gray-600 text-[10px] leading-relaxed">
              {isAr
                ? 'بالمتابعة، أنت توافق على '
                : 'By continuing, you agree to our '}
              <Link to="/terms" className="text-[#22D3EE] hover:underline">
                {isAr ? 'الشروط والأحكام' : 'Terms of Service'}
              </Link>
              {isAr ? ' و' : ' and '}
              <Link to="/refund" className="text-[#22D3EE] hover:underline">
                {isAr ? 'سياسة الاسترداد' : 'Refund Policy'}
              </Link>
              {isAr ? '.' : '.'}
            </p>

            {error && (
              <div className="flex items-start gap-2 text-red-400 text-xs bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-black font-black rounded-xl hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm touch-manipulation">
              {loading
                ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />{isAr ? 'جاري المعالجة...' : 'Processing...'}</>
                : <><CreditCard className="w-4 h-4" />{isAr ? 'المتابعة للدفع الآمن' : 'Proceed to Secure Payment'}<ChevronRight className={cn('w-4 h-4', isAr && 'rotate-180')} /></>
              }
            </button>
          </form>
        </div>

        {/* Security + Payment methods — required by Tap */}
        <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-green-400" />
            <span className="text-white font-bold text-xs uppercase tracking-widest">
              {isAr ? 'دفع آمن ومشفّر' : 'Secure & Encrypted Payment'}
            </span>
          </div>
          <p className="text-gray-600 text-[10px] mb-4 leading-relaxed">
            {isAr
              ? 'بياناتك محمية بتشفير SSL 256-bit. لا نحتفظ ببيانات بطاقتك — يتولى ذلك مزود الدفع المعتمد.'
              : 'Your data is protected by 256-bit SSL encryption. We never store card details — handled entirely by our certified payment provider.'}
          </p>
          <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-3">
            {isAr ? 'وسائل الدفع المقبولة' : 'Accepted Payment Methods'}
          </p>
          <div className="flex flex-wrap gap-2">
            {['Visa', 'Mastercard', 'Mada', 'Meeza', 'Apple Pay', 'KNET', 'Fawry'].map(method => (
              <span key={method}
                className="px-2.5 py-1 bg-white/5 border border-gray-800 rounded-lg text-xs text-gray-400 font-medium">
                {method}
              </span>
            ))}
          </div>
        </div>

        {/* Manual payment fallback */}
        <div className="text-center">
          <p className="text-gray-600 text-xs mb-2">
            {isAr ? 'تفضّل الدفع اليدوي؟' : 'Prefer manual payment?'}
          </p>
          <div className="flex items-center justify-center gap-4">
            <a href="https://wa.me/201107743984"
              target="_blank" rel="noopener noreferrer"
              className="text-green-400 text-xs hover:underline">
              {isAr ? 'واتساب' : 'WhatsApp'}
            </a>
            <span className="text-gray-800">·</span>
            <span className="text-gray-600 text-xs">InstaPay: zeyadsayedinq</span>
          </div>
        </div>
      </div>
    </div>
  );
}
