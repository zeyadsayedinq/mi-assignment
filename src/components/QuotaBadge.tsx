import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Zap, Infinity as InfinityIcon } from 'lucide-react';
import { useQuota } from '../contexts/QuotaContext';
import { cn } from '../lib/utils';

/**
 * Always-visible mission counter for the app header/sidebar.
 * Shows "X missions left", turns amber when ≤1, and offers an upgrade tap for free users.
 */
export function QuotaBadge({ compact = false }: { compact?: boolean }) {
  const { quota, loading } = useQuota();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  if (loading && !quota) {
    return (
      <div className="h-8 w-28 rounded-lg bg-white/5 animate-pulse" />
    );
  }
  if (!quota) return null;

  if (quota.unlimited) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#A855F7]/10 border border-[#A855F7]/25 text-[#A855F7]">
        <InfinityIcon className="w-3.5 h-3.5" />
        <span className="text-xs font-bold">{isAr ? 'غير محدود' : 'Unlimited'}</span>
      </div>
    );
  }

  const remaining = quota.remaining;
  const isLow = remaining <= 1;
  const isFree = quota.plan === 'free';

  return (
    <button
      onClick={() => navigate('/pricing')}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all',
        isLow
          ? 'bg-orange-500/10 border-orange-500/30 text-orange-300 hover:bg-orange-500/20'
          : 'bg-[#22D3EE]/8 border-[#22D3EE]/25 text-[#22D3EE] hover:bg-[#22D3EE]/15',
      )}
      title={isAr ? 'اضغط للترقية' : 'Tap to upgrade'}
    >
      <Zap className="w-3.5 h-3.5 shrink-0" />
      {!compact && (
        <span className="text-xs font-bold whitespace-nowrap">
          {remaining} / {quota.limit} {isAr ? 'مهمة' : 'left'}
        </span>
      )}
      {compact && (
        <span className="text-xs font-bold">{remaining}</span>
      )}
      {isFree && isLow && !compact && (
        <span className="text-[10px] font-black bg-orange-500 text-black px-1.5 py-0.5 rounded-full ml-1">
          {isAr ? 'ترقية' : 'UPGRADE'}
        </span>
      )}
    </button>
  );
}
