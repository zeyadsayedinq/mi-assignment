import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getSubscriptionStatus } from '../lib/subscription';
import { useTranslation } from 'react-i18next';

const PLAN_LABELS: Record<string, { en: string; ar: string; missions: string }> = {
  pro_monthly:   { en: 'Pro Monthly',   ar: 'برو شهري',        missions: '25' },
  pro_quarterly: { en: 'Pro Quarterly', ar: 'برو ربع سنوي',    missions: '60' },
  pro_yearly:    { en: 'Pro Yearly',    ar: 'برو سنوي',         missions: 'Unlimited ♾️' },
};

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const plan = params.get('plan') || 'pro_quarterly';
  const tapId = params.get('tap_id') || params.get('charge_id') || '';
  const planInfo = PLAN_LABELS[plan] || PLAN_LABELS.pro_quarterly;

  const [checking, setChecking] = useState(true);
  const [activated, setActivated] = useState(false);
  const [fraudBlock, setFraudBlock] = useState(!tapId); // No tap_id = direct navigation attempt

  useEffect(() => {
    if (!user?.id || fraudBlock) { setChecking(false); return; }
    // Poll for up to 15 seconds for subscription to activate via webhook
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      try {
        const sub = await getSubscriptionStatus(user.id, user.email);
        if (sub.plan !== 'free' && sub.isActive) {
          setActivated(true);
          setChecking(false);
          clearInterval(poll);
          return;
        }
      } catch {}
      if (attempts >= 5) {
        setChecking(false);
        clearInterval(poll);
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [user, fraudBlock]);

  // Block direct navigation attempts (no tap_id in URL)
  if (fraudBlock) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white p-6">
        <div className="max-w-sm text-center">
          <p className="text-gray-500 text-sm">Invalid payment session.</p>
          <button onClick={() => navigate('/pricing')} className="mt-4 text-[#22D3EE] text-sm hover:underline">
            View Pricing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#020617] flex flex-col items-center justify-center px-5 text-white"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-md text-center">

        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
          {checking ? (
            <Loader2 className="w-9 h-9 text-emerald-400 animate-spin" />
          ) : (
            <CheckCircle2 className="w-9 h-9 text-emerald-400" />
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black text-white mb-3">
          {checking
            ? (isAr ? 'جاري التفعيل...' : 'Activating your Pro...')
            : (isAr ? '✅ تم التفعيل بنجاح!' : '✅ Pro Activated!')}
        </h1>

        {/* Plan info */}
        <div className="bg-[#0A0B0E] border border-emerald-500/20 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">{isAr ? 'الخطة' : 'Plan'}</span>
            <span className="text-white font-bold text-sm">
              {isAr ? planInfo.ar : planInfo.en}
            </span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">{isAr ? 'المهام المتاحة' : 'Missions'}</span>
            <span className="text-emerald-400 font-bold text-sm">{planInfo.missions}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">{isAr ? 'الحالة' : 'Status'}</span>
            <span className={`text-sm font-bold ${activated ? 'text-emerald-400' : 'text-yellow-400'}`}>
              {activated
                ? (isAr ? 'نشط ✓' : 'Active ✓')
                : (isAr ? 'جاري التحقق...' : 'Verifying...')}
            </span>
          </div>
        </div>

        {/* Message */}
        {!checking && (
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            {activated
              ? (isAr
                  ? 'حسابك Pro جاهز! ابدأ مهمتك الأولى دلوقتي.'
                  : 'Your Pro account is ready. Start your first mission now.')
              : (isAr
                  ? 'التفعيل بياخد ثواني. لو محتاج مساعدة راسلنا على support@mi-assignment.com'
                  : 'Activation takes a few seconds. If you need help email support@mi-assignment.com')}
          </p>
        )}

        {/* CTA */}
        {!checking && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/terminal')}
              className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-black font-black rounded-2xl hover:opacity-90 transition-all text-sm"
            >
              <Zap className="w-4 h-4" />
              {isAr ? 'ابدأ مهمتك الأولى' : 'Start Your First Mission'}
              <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={() => navigate('/app')}
              className="w-full py-3 border border-gray-800 text-gray-400 font-medium rounded-2xl hover:border-gray-600 hover:text-white transition-all text-sm"
            >
              {isAr ? 'روح للـ HQ' : 'Go to HQ'}
            </button>
          </div>
        )}

        {/* Support note */}
        <p className="text-gray-700 text-xs mt-6">
          {isAr ? 'محتاج مساعدة؟' : 'Need help?'}{' '}
          <a href="mailto:support@mi-assignment.com" className="text-[#22D3EE] hover:underline">
            support@mi-assignment.com
          </a>
        </p>
      </div>
    </div>
  );
}
