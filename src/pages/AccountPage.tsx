import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Crown, Zap, Calendar, Gift, Copy, Check, ArrowUpRight,
  Infinity as InfinityIcon, CreditCard, LifeBuoy,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useQuota } from '../contexts/QuotaContext';
import { useToast } from '../contexts/ToastContext';
import { cn } from '../lib/utils';

const PLAN_LABELS: Record<string, { en: string; ar: string }> = {
  free:          { en: 'Free',          ar: 'مجاني' },
  pro_monthly:   { en: 'Pro Monthly',   ar: 'برو شهري' },
  pro_quarterly: { en: 'Pro Quarterly', ar: 'برو ربع سنوي' },
  pro_yearly:    { en: 'Pro Yearly',    ar: 'برو سنوي' },
  owner:         { en: 'Owner',         ar: 'المالك' },
};

export function AccountPage() {
  const { user } = useAuth();
  const { quota, refresh } = useQuota();
  const { success } = useToast();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [copied, setCopied] = useState(false);

  useEffect(() => { refresh(); }, [refresh]);

  // Referral code = stable slice of the user id (matches /ref/:code capture in App.tsx)
  const refCode = (user?.id || '').replace(/-/g, '').slice(0, 8).toUpperCase();
  const refLink = `${typeof window !== 'undefined' ? window.location.origin : 'https://www.mi-assignment.com'}/ref/${refCode}`;

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(refLink);
      setCopied(true);
      success(isAr ? 'اتنسخ رابط الدعوة!' : 'Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — select fallback
      window.prompt(isAr ? 'انسخ الرابط:' : 'Copy this link:', refLink);
    }
  };

  const planLabel = quota ? (PLAN_LABELS[quota.plan] || PLAN_LABELS.free) : PLAN_LABELS.free;
  const isFree = quota?.plan === 'free';
  const usedPct = quota && quota.limit > 0 && !quota.unlimited
    ? Math.min(100, Math.round((quota.missionsUsed / quota.limit) * 100))
    : 0;

  const expiryText = quota?.expiresAt
    ? new Date(quota.expiresAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className={cn('min-h-screen bg-[#050608] text-white p-4 lg:p-8', isAr && 'font-[Cairo]')} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-black">{isAr ? 'حسابي والاشتراك' : 'Account & Billing'}</h1>
          <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
        </div>

        {/* Current plan card */}
        <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center',
                isFree ? 'bg-gray-800' : 'bg-gradient-to-br from-[#22D3EE]/20 to-[#A855F7]/20 border border-[#22D3EE]/30')}>
                {quota?.unlimited ? <InfinityIcon className="w-5 h-5 text-[#A855F7]" /> : <Crown className={cn('w-5 h-5', isFree ? 'text-gray-500' : 'text-[#22D3EE]')} />}
              </div>
              <div>
                <p className={cn('text-gray-500 text-xs', isAr ? '' : 'uppercase tracking-wider')}>{isAr ? 'خطتك الحالية' : 'Current plan'}</p>
                <p className="text-xl font-black">{isAr ? planLabel.ar : planLabel.en}</p>
              </div>
            </div>
            {isFree && (
              <button onClick={() => navigate('/pricing')}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-black font-black rounded-xl hover:opacity-90 transition-all text-sm">
                <Zap className="w-4 h-4" /> {isAr ? 'اشترك في Pro' : 'Upgrade to Pro'}
              </button>
            )}
          </div>

          {/* Usage bar */}
          {quota && !quota.unlimited && (
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">{isAr ? 'المهام المستخدمة' : 'Missions used'}</span>
                <span className="font-bold">{quota.missionsUsed} / {quota.limit}</span>
              </div>
              <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all',
                  usedPct >= 100 ? 'bg-gradient-to-r from-orange-500 to-red-500'
                  : usedPct >= 70 ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                  : 'bg-gradient-to-r from-[#22D3EE] to-[#A855F7]')}
                  style={{ width: `${usedPct}%` }} />
              </div>
              <p className="text-gray-600 text-xs mt-2">
                {quota.remaining > 0
                  ? (isAr ? `باقي ${quota.remaining} مهمة في الفترة الحالية.` : `${quota.remaining} missions remaining this period.`)
                  : (isAr ? 'خلصت مهامك لهذه الفترة.' : 'You\'ve used all missions for this period.')}
                {quota.bonus > 0 && (isAr ? ` (منهم ${quota.bonus} مكافأة)` : ` (includes ${quota.bonus} bonus)`)}
              </p>
            </div>
          )}
          {quota?.unlimited && (
            <p className="mt-6 text-[#A855F7] text-sm font-semibold">{isAr ? 'مهام غير محدودة ✨' : 'Unlimited missions ✨'}</p>
          )}

          {/* Expiry */}
          {expiryText && (
            <div className="mt-5 flex items-center gap-2 text-sm text-gray-400 border-t border-gray-800 pt-4">
              <Calendar className="w-4 h-4 text-gray-500" />
              {isAr ? `الاشتراك ساري حتى ${expiryText}` : `Renews / expires on ${expiryText}`}
            </div>
          )}
        </div>

        {/* Referral card */}
        <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-5 h-5 text-[#A855F7]" />
            <h2 className="text-lg font-bold">{isAr ? 'ادعي أصحابك' : 'Invite friends'}</h2>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            {isAr
              ? 'كل صاحب يسجّل برابطك — انت وهو تاخدوا +٢ مهمة مجانية. من غير حد أقصى.'
              : 'For every friend who signs up with your link, you both get +2 free missions. No cap.'}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#050608] border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-300 font-mono truncate" dir="ltr">
              {refLink}
            </div>
            <button onClick={copyRef}
              className={cn('flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all shrink-0',
                copied ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-[#22D3EE] text-black hover:bg-white')}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? (isAr ? 'اتنسخ' : 'Copied') : (isAr ? 'انسخ' : 'Copy')}
            </button>
          </div>
        </div>

        {/* Manage / support */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={() => navigate('/pricing')}
            className="flex items-center justify-between bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5 hover:border-gray-600 transition-all text-left">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-[#22D3EE]" />
              <div>
                <p className="font-bold text-sm">{isAr ? 'إدارة الاشتراك' : 'Manage subscription'}</p>
                <p className="text-gray-600 text-xs">{isAr ? 'ترقية أو تجديد' : 'Upgrade or renew'}</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-600" />
          </button>

          <a href="https://wa.me/201107743984" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5 hover:border-emerald-500/40 transition-all text-left">
            <div className="flex items-center gap-3">
              <LifeBuoy className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="font-bold text-sm">{isAr ? 'الدعم' : 'Support'}</p>
                <p className="text-gray-600 text-xs">{isAr ? 'كلمنا على واتساب' : 'Chat on WhatsApp'}</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-600" />
          </a>
        </div>

        {/* Cancellation note — required for a subscription product */}
        <p className="text-gray-600 text-xs text-center leading-relaxed">
          {isAr
            ? 'لإلغاء التجديد، كلمنا على واتساب قبل تاريخ انتهاء الاشتراك. مفيش خصم تلقائي متكرر — كل فترة بتتجدد يدوياً.'
            : 'To cancel renewal, message us on WhatsApp before your expiry date. There is no automatic recurring charge — each period is renewed manually.'}
        </p>
      </div>
    </div>
  );
}
