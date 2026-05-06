import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getSubscriptionStatus, getLocalMissionCount, type SubscriptionStatus } from '../lib/subscription';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

export function UsageBanner() {
  const { i18n, t } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAuth();
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (user) {
      getSubscriptionStatus(user.id, user.email).then(setSub);
    } else {
      // Anonymous usage tracking
      const count = getLocalMissionCount(user?.id);
      setSub({
        plan: 'free', role: 'user', missionsUsed: count, missionsLimit: 3,
        missionsLeft: Math.max(0, 3 - count), isActive: false,
        expiresAt: null, canUseMission: count < 3,
      });
    }
  }, [user]);

  if (!sub || sub.role === 'owner' || sub.plan.startsWith('pro_') || dismissed) return null;
  if (sub.missionsLeft > 2) return null; // Only show when 2 or fewer missions left

  const isExhausted = sub.missionsLeft === 0;
  const isWarning = sub.missionsLeft <= 1;

  return (
    <div className={cn(
      'fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-2xl text-sm font-medium max-w-md w-[calc(100%-2rem)]',
      isExhausted
        ? 'bg-red-950/90 border-red-500/40 text-red-200 backdrop-blur-sm'
        : 'bg-[#0A0B0E]/90 border-yellow-500/30 text-yellow-200 backdrop-blur-sm'
    )}>
      {isExhausted ? (
        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
      ) : (
        <Zap className="w-4 h-4 text-yellow-400 shrink-0" />
      )}
      <span className="flex-1 text-xs">
        {!user 
          ? (isAr ? 'سجّل دخول لمتابعة استخدام Mi' : 'Sign in to continue using Mi')
          : (isExhausted
            ? t('pricing.limitReached')
            : t('pricing.missionsLeft', { count: sub.missionsLeft }))
        }
      </span>
      <Link
        to={!user ? "/auth" : "/pricing"}
        className="shrink-0 px-3 py-1 bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-black text-xs font-black rounded-lg hover:opacity-90 transition-all"
      >
        {!user ? (isAr ? 'دخول' : 'Sign In') : t('pricing.upgradePro')}
      </Link>
      <button onClick={() => setDismissed(true)} className="text-gray-500 hover:text-white shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
