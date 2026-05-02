import React, { useState, useEffect } from 'react';
import { Share2, Copy, Check, Users, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { generateReferralCode, getReferralLink, shareReferralLink, getReferralStats } from '../lib/referral';
import { cn } from '../lib/utils';

export function ReferralWidget({ isAr = false, compact = false }: { isAr?: boolean; compact?: boolean }) {
  const { user } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, converted: 0, bonusMissions: 0 });
  const [copied, setCopied] = useState(false);
  const [shareResult, setShareResult] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    // Code is deterministic — instant, no loading
    setCode(generateReferralCode(user.id));
    // Stats from DB in background
    getReferralStats(user.id).then(setStats).catch(() => {});
  }, [user?.id]);

  if (!user) {
    return (
      <div className={cn('bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5 text-center', compact && 'p-4')}>
        <p className="text-gray-400 text-sm mb-3">
          {isAr ? 'سجّل دخول للحصول على رابط الإحالة' : 'Sign in to get your referral link'}
        </p>
        <a href="/auth" className="px-4 py-2 bg-[#22D3EE] text-black font-bold rounded-xl text-sm hover:bg-white transition-all inline-block">
          {isAr ? 'سجّل دخول' : 'Sign In'}
        </a>
      </div>
    );
  }

  const link = code ? getReferralLink(code) : '';

  const handleCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleShare = async () => {
    if (!code) return;
    const result = await shareReferralLink(code, isAr);
    setShareResult(result === 'shared' ? (isAr ? 'تم المشاركة! ✓' : 'Shared! ✓') : result === 'copied' ? (isAr ? 'تم النسخ! ✓' : 'Copied! ✓') : null);
    setTimeout(() => setShareResult(null), 2000);
  };

  if (compact) {
    return (
      <div className="bg-[#0A0B0E] border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white font-bold text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-[#22D3EE]" />
            {isAr ? 'رابط الإحالة' : 'Your referral link'}
          </span>
          {stats.converted > 0 && (
            <span className="text-[10px] text-emerald-400 font-bold">
              +{stats.bonusMissions} {isAr ? 'مهام مجانية' : 'bonus missions'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 bg-[#050608] border border-gray-800 rounded-lg px-3 py-2">
          <span className="flex-1 text-gray-400 text-xs font-mono truncate">{link || '...'}</span>
          <button onClick={handleCopy} className="text-[#22D3EE] hover:text-white transition-colors shrink-0">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#22D3EE]/10 to-[#A855F7]/5 border border-[#22D3EE]/20 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/20 flex items-center justify-center">
          <Users className="w-5 h-5 text-[#22D3EE]" />
        </div>
        <div>
          <h3 className="text-white font-bold">{isAr ? '🎁 شارك وكسب مهام مجانية' : '🎁 Refer friends, earn free missions'}</h3>
          <p className="text-gray-500 text-xs">{isAr ? 'كل صديق يسجّل = ٢ مهام مجانية لكل واحد' : 'Every friend who signs up = 2 free missions each'}</p>
        </div>
      </div>

      {/* Stats */}
      {stats.converted > 0 && (
        <div className="flex gap-3 mb-4">
          <div className="flex-1 bg-[#050608] border border-gray-800 rounded-xl p-3 text-center">
            <p className="text-white font-black text-xl">{stats.converted}</p>
            <p className="text-gray-600 text-[10px]">{isAr ? 'أصدقاء سجّلوا' : 'friends joined'}</p>
          </div>
          <div className="flex-1 bg-[#050608] border border-gray-800 rounded-xl p-3 text-center">
            <p className="text-emerald-400 font-black text-xl">+{stats.bonusMissions}</p>
            <p className="text-gray-600 text-[10px]">{isAr ? 'مهام مجانية' : 'bonus missions'}</p>
          </div>
        </div>
      )}

      {/* Link */}
      <div className="flex items-center gap-2 bg-[#050608] border border-gray-800 rounded-xl px-4 py-3 mb-4">
        <Share2 className="w-4 h-4 text-gray-600 shrink-0" />
        <span className="flex-1 text-gray-300 text-xs font-mono truncate">{link || 'Loading...'}</span>
        <button onClick={handleCopy} className="text-[#22D3EE] hover:text-white transition-colors shrink-0">
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex gap-2">
        <button onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#22D3EE] text-black font-bold rounded-xl hover:bg-white transition-all text-sm">
          <Share2 className="w-4 h-4" />
          {shareResult || (isAr ? 'شارك الرابط' : 'Share link')}
        </button>
        <button onClick={handleCopy}
          className="px-4 py-2.5 border border-gray-800 text-gray-400 font-bold rounded-xl hover:border-gray-600 hover:text-white transition-all text-sm">
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
