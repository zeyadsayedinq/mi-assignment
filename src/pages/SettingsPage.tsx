import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, User, Shield, Loader2, LogOut, CreditCard, Globe, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { ReferralWidget } from '../components/ReferralWidget';
import { getSubscriptionStatus, type SubscriptionStatus } from '../lib/subscription';

const OWNER_EMAIL = 'zeyadsayedinq@gmail.com';
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || '';

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || user?.email?.split('@')[0] || '');
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);

  // Admin panel state (owner only)
  const [adminEmail, setAdminEmail] = useState('');
  const [adminAction, setAdminAction] = useState<'grant' | 'revoke'>('grant');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMsg, setAdminMsg] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
      getSubscriptionStatus(user.id, user.email).then(setSub);
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await supabase.auth.updateUser({ data: { full_name: displayName } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setIsSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleAdminAction = async () => {
    if (!adminEmail.trim()) return;
    setAdminLoading(true);
    setAdminMsg('');
    try {
      // Look up user ID by email via Supabase (admin client on server)
      // We call the admin grant/revoke endpoint
      const backendUrl = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
    const res = await fetch(`${backendUrl}/api/admin/users-by-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
        body: JSON.stringify({ email: adminEmail.trim() }),
      });
      if (!res.ok) throw new Error('User not found');
      const { userId } = await res.json();

      const res2 = await fetch(`${backendUrl}/api/admin/users/${userId}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
        body: JSON.stringify({ action: adminAction, plan: 'pro_quarterly', durationDays: 90 }),
      });
      const d = await res2.json();
      if (d.success) {
        setAdminMsg(`✅ ${adminAction === 'grant' ? 'Pro granted' : 'Revoked'} for ${adminEmail}`);
        setAdminEmail('');
      } else {
        setAdminMsg(`❌ ${d.error || 'Failed'}`);
      }
    } catch (e: any) {
      setAdminMsg(`❌ ${e.message}`);
    }
    setAdminLoading(false);
  };

  const isOwner = user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();

  const planLabel = () => {
    if (sub?.role === 'owner') return isAr ? 'خطة المؤسس (غير محدودة)' : 'Founder Plan (Unlimited)';
    if (sub?.plan?.startsWith('pro_quarterly')) return isAr ? 'برو ربع سنوي' : 'Pro Quarterly';
    if (sub?.plan?.startsWith('pro_monthly')) return isAr ? 'برو شهري' : 'Pro Monthly';
    if (sub?.plan?.startsWith('pro_yearly')) return isAr ? 'برو سنوي' : 'Pro Yearly';
    return isAr ? 'مجاني' : 'Free';
  };

  return (
    <div className={cn('w-full min-h-screen bg-[#020617] text-white font-sans p-5 lg:p-8', isAr && 'font-[Cairo]')}
      dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-2xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-1">⚙️ {isAr ? 'الإعدادات' : 'Settings'}</h1>
          <p className="text-gray-500 text-sm">{isAr ? 'إدارة حسابك وتفضيلاتك' : 'Manage your account and preferences'}</p>
        </div>

        <div className="space-y-4">

          {/* Profile */}
          <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#22D3EE]" />
                <h2 className="text-white font-bold text-sm">{isAr ? 'الملف الشخصي' : 'Profile'}</h2>
              </div>
              {isOwner && (
                <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[10px] font-black uppercase tracking-widest">
                  Founder
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
                <div className="flex items-center gap-2 bg-[#050608] border border-gray-800 rounded-xl px-4 py-2.5">
                  <span className="text-gray-400 text-sm flex-1">{user?.email || '—'}</span>
                  <span className="text-[10px] text-gray-600 border border-gray-800 px-2 py-0.5 rounded-full">
                    {user?.app_metadata?.provider || 'email'}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">{isAr ? 'الاسم' : 'Display Name'}</label>
                <div className="flex gap-2">
                  <input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="flex-1 bg-[#050608] border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#22D3EE] transition-all"
                  />
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2 bg-[#22D3EE] text-black font-bold rounded-xl hover:bg-white transition-all text-sm disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : null}
                    {saved ? (isAr ? 'تم ✓' : 'Saved') : (isAr ? 'حفظ' : 'Save')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Language */}
          <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-[#A855F7]" />
              <h2 className="text-white font-bold text-sm">{isAr ? 'اللغة' : 'Language'}</h2>
            </div>
            <LanguageSwitcher />
          </div>

          {/* Subscription */}
          <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4 text-yellow-400" />
              <h2 className="text-white font-bold text-sm">{isAr ? 'الاشتراك' : 'Subscription'}</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-sm">{planLabel()}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {sub?.role === 'owner' || sub?.plan?.startsWith('pro_')
                    ? (isAr ? 'مهام غير محدودة ♾️' : 'Unlimited missions ♾️')
                    : (isAr ? `${sub?.missionsLeft ?? 3} من ${sub?.missionsLimit ?? 3} مهام متبقية` : `${sub?.missionsLeft ?? 3} / ${sub?.missionsLimit ?? 3} missions left`)}
                </p>
                {sub?.expiresAt && (
                  <p className="text-gray-600 text-xs mt-0.5">
                    {isAr ? 'ينتهي في' : 'Expires'}: {new Date(sub.expiresAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
              {sub && sub.role !== 'owner' && !sub.plan?.startsWith('pro_') && (
                <button
                  onClick={() => navigate('/pricing')}
                  className="px-4 py-2 bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-black font-bold rounded-xl text-xs hover:opacity-90 transition-all"
                >
                  {isAr ? 'اشترك برو' : 'Upgrade to Pro'}
                </button>
              )}
            </div>
          </div>

          {/* Referral */}
          <div className="space-y-2">
            <ReferralWidget isAr={isAr} />
          </div>

          {/* Sign Out */}
          <div className="bg-[#0A0B0E] border border-red-900/30 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-red-400" />
              <h2 className="text-white font-bold text-sm">{isAr ? 'منطقة الخطر' : 'Danger Zone'}</h2>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2.5 border border-red-500/30 text-red-400 rounded-xl text-sm hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
              {isAr ? 'تسجيل الخروج' : 'Sign Out'}
            </button>
          </div>

          {/* Owner Panel — real API calls, no localStorage */}
          {isOwner && (
            <div className="bg-[#0A0B0E] border border-yellow-500/30 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-5">
                <Shield className="w-4 h-4 text-yellow-400" />
                <h2 className="text-white font-bold text-sm">Owner — Grant / Revoke Pro</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">User Email</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-[#050608] border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500/50 transition-all"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setAdminAction('grant')}
                    className={cn('flex-1 py-2 rounded-xl text-xs font-bold transition-all border',
                      adminAction === 'grant' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-[#050608] border-gray-800 text-gray-500')}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5" />Grant Pro (90 days)
                  </button>
                  <button
                    onClick={() => setAdminAction('revoke')}
                    className={cn('flex-1 py-2 rounded-xl text-xs font-bold transition-all border',
                      adminAction === 'revoke' ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-[#050608] border-gray-800 text-gray-500')}
                  >
                    <XCircle className="w-3.5 h-3.5 inline mr-1.5" />Revoke
                  </button>
                </div>

                <button
                  onClick={handleAdminAction}
                  disabled={adminLoading || !adminEmail.trim()}
                  className="w-full py-2.5 bg-yellow-500 text-black font-black rounded-xl hover:bg-white transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {adminLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {adminLoading ? 'Processing...' : `Execute — ${adminAction === 'grant' ? 'Grant Pro' : 'Revoke Pro'}`}
                </button>

                {adminMsg && (
                  <p className={cn('text-xs px-3 py-2 rounded-xl border', adminMsg.startsWith('✅') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400')}>
                    {adminMsg}
                  </p>
                )}

                <p className="text-gray-700 text-[10px]">
                  Uses the real admin API. Changes take effect immediately. Also accessible at <a href="/admin" className="text-yellow-500/50 hover:text-yellow-400">/admin</a>
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
