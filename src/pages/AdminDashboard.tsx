import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Shield, RefreshCw, AlertCircle, FileText, TrendingUp,
  Crown, DollarSign, BarChart2, Bell, CheckCircle, Users,
  Activity,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

const ADMIN_EMAILS = ['zeyadsayedinq@gmail.com', 'ranafaraj30@gmail.com'];

// ─── Revenue constants ────────────────────────────────────────────────────────
const PRO_MONTHLY_EGP   = 350;
const PRO_QUARTERLY_EGP = 1000;

function StatCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5 flex flex-col gap-2">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', color)}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
      {sub && <p className="text-gray-600 text-xs">{sub}</p>}
    </div>
  );
}

export function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'overview' | 'activate' | 'users' | 'missions'>('overview');
  const [missions, setMissions]       = useState<any[]>([]);
  const [subscriptions, setSubs]      = useState<any[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  // User management
  const [activateEmail, setActivateEmail] = useState('');
  const [activatePlan,  setActivatePlan]  = useState<'pro_monthly' | 'pro_quarterly' | 'pro_yearly'>('pro_quarterly');
  const [activating,    setActivating]    = useState(false);
  const [activateMsg,   setActivateMsg]   = useState('');
  // Looked-up user card
  const [lookupResult,  setLookupResult]  = useState<any | null>(null);
  const [lookingUp,     setLookingUp]     = useState(false);
  const [bonusAmount,   setBonusAmount]   = useState(5);

  // ── Fetch all data ──────────────────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [{ data: m, error: mErr }, { data: s, error: sErr }] = await Promise.all([
        supabase.from('missions').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('subscriptions').select('*').order('started_at', { ascending: false }),
      ]);
      if (mErr) throw mErr;
      if (sErr) throw sErr;
      setMissions(m || []);
      setSubs(s || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Derived metrics ─────────────────────────────────────────────────────────
  const now      = new Date();
  const last24h  = missions.filter(m => (now.getTime() - new Date(m.created_at).getTime()) < 86_400_000).length;
  const last7d   = missions.filter(m => (now.getTime() - new Date(m.created_at).getTime()) < 7 * 86_400_000).length;

  const activeSubs  = subscriptions.filter(s => s.status === 'active');
  const activePro   = activeSubs.length;

  // Revenue: sum per subscription plan
  const revEGP = subscriptions.reduce((acc, s) => {
    if (s.plan === 'pro_monthly')   return acc + PRO_MONTHLY_EGP;
    if (s.plan === 'pro_quarterly') return acc + PRO_QUARTERLY_EGP;
    return acc;
  }, 0);
  const revUSD = Math.round(revEGP / 50);

  // Expiring within 7 days
  const in7days     = new Date(now.getTime() + 7 * 86_400_000);
  const expiringSubs = activeSubs.filter(s => {
    if (!s.expires_at) return false;
    const exp = new Date(s.expires_at);
    return exp > now && exp <= in7days;
  });
  const expiringSoon = expiringSubs.length;

  // Plan breakdown
  const plans: Record<string, number> = {};
  subscriptions.forEach(s => { plans[s.plan] = (plans[s.plan] || 0) + 1; });

  // Mission domain breakdown
  const domainCount: Record<string, number> = {};
  missions.forEach(m => {
    const d = m.solution_data?.domain || 'GENERAL';
    domainCount[d] = (domainCount[d] || 0) + 1;
  });
  const topDomains = Object.entries(domainCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // ── Admin user actions (all via the email-based admin-users endpoint) ────────
  const adminHeaders = () => ({
    'Content-Type': 'application/json',
    'x-caller-email': user?.email || '',
  });

  // Look up a user by email → shows plan, missions, bonus
  const handleLookup = async () => {
    if (!activateEmail.trim()) { setActivateMsg('Enter an email.'); return; }
    setLookingUp(true); setActivateMsg(''); setLookupResult(null);
    try {
      const res = await fetch(`/api/admin-users?email=${encodeURIComponent(activateEmail.trim())}`, {
        headers: adminHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'User not found');
      setLookupResult(data);
    } catch (e: any) {
      setActivateMsg(`❌ ${e.message}`);
    } finally {
      setLookingUp(false);
    }
  };

  const runAction = async (action: 'grant' | 'revoke' | 'bonus', extra: Record<string, any> = {}) => {
    if (!activateEmail.trim()) { setActivateMsg('Enter an email.'); return; }
    setActivating(true); setActivateMsg('');
    try {
      const res = await fetch('/api/admin-users', {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ email: activateEmail.trim(), action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      if (action === 'grant')  setActivateMsg(`✅ ${activateEmail} activated on ${extra.plan}`);
      if (action === 'revoke') setActivateMsg(`✅ ${activateEmail} reverted to Free`);
      if (action === 'bonus')  setActivateMsg(`✅ Granted ${extra.days} bonus missions to ${activateEmail}`);
      await handleLookup(); // refresh the user card
      fetchAll();
    } catch (e: any) {
      setActivateMsg(`❌ ${e.message}`);
    } finally {
      setActivating(false);
    }
  };

  const handleActivate = () => runAction('grant', { plan: activatePlan, days: activatePlan === 'pro_monthly' ? 30 : activatePlan === 'pro_yearly' ? 365 : 90 });
  const handleRevoke   = () => runAction('revoke');
  const handleBonus    = () => runAction('bonus', { days: bonusAmount });

  // ── CSV download ────────────────────────────────────────────────────────────
  const downloadCSV = (rows: any[][], filename: string) => {
    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
  };

  // ── Guard ───────────────────────────────────────────────────────────────────
  if (!ADMIN_EMAILS.includes(user?.email || '')) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-white font-bold text-xl mb-2">Access Denied</h2>
        <p className="text-gray-500">Restricted to platform admins only.</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 text-white">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] uppercase tracking-widest mb-3">
            <Shield className="w-3 h-3" /> Admin — {user?.email}
          </div>
          <h1 className="text-3xl font-black">Mi-Assignment Admin</h1>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#0A0B0E] border border-gray-800 rounded-xl text-sm text-gray-400 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </p>
        </div>
      )}

      {/* ── EXPIRING SOON ALERT — always rendered for admins ─────────────────── */}
      {expiringSoon > 0 ? (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3">
          <Bell className="w-4 h-4 text-yellow-400 shrink-0" />
          <div>
            <p className="text-yellow-300 text-sm font-bold">
              ⚠️ {expiringSoon} subscription{expiringSoon > 1 ? 's' : ''} expiring within 7 days
            </p>
            <p className="text-yellow-600 text-xs mt-0.5">
              {expiringSubs.map(s => s.user_id).join(', ')} — consider reaching out to renew.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-emerald-400 text-sm font-semibold">
            No subscriptions expiring in the next 7 days — all good.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'overview',  label: '📊 Overview' },
          { key: 'activate',  label: '⚡ Manage Users' },
          { key: 'users',     label: '👥 Subscriptions' },
          { key: 'missions',  label: '📋 Missions' },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all',
              tab === t.key
                ? 'bg-[#22D3EE] text-black'
                : 'bg-[#0A0B0E] border border-gray-800 text-gray-400 hover:border-gray-600',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-[#0A0B0E] border border-gray-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* ── Stat cards — revenue always present ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Total Missions"
                  value={missions.length}
                  sub={`${last24h} today · ${last7d} this week`}
                  icon={FileText}
                  color="bg-[#22D3EE]/10 text-[#22D3EE]"
                />
                <StatCard
                  label="Active Pro Users"
                  value={activePro}
                  sub={expiringSoon > 0 ? `⚠️ ${expiringSoon} expiring soon` : 'all subscriptions healthy'}
                  icon={Crown}
                  color="bg-[#A855F7]/10 text-[#A855F7]"
                />
                <StatCard
                  label="Missions (7 days)"
                  value={last7d}
                  sub={`${last24h} in last 24h`}
                  icon={TrendingUp}
                  color="bg-emerald-500/10 text-emerald-400"
                />
                {/* ── Revenue card — always rendered ── */}
                <StatCard
                  label="Est. Revenue (EGP)"
                  value={`${revEGP.toLocaleString()} EGP`}
                  sub={`≈ $${revUSD} USD · ${subscriptions.length} total subscriptions`}
                  icon={DollarSign}
                  color="bg-yellow-500/10 text-yellow-400"
                />
              </div>

              {/* Secondary row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Plan breakdown */}
                <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5">
                  <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-[#22D3EE]" /> Plans
                  </h3>
                  {Object.keys(plans).length === 0 ? (
                    <p className="text-gray-600 text-xs">No subscriptions yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(plans).map(([plan, count]) => (
                        <div key={plan} className="flex items-center justify-between">
                          <span className="text-gray-400 text-xs capitalize">{plan.replace('_', ' ')}</span>
                          <span className="text-white font-bold text-sm">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top domains */}
                <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5">
                  <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#A855F7]" /> Top Domains
                  </h3>
                  <div className="space-y-2">
                    {topDomains.map(([domain, count]) => (
                      <div key={domain} className="flex items-center justify-between">
                        <span className="text-gray-400 text-xs">{domain}</span>
                        <span className="text-white font-bold text-xs">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Revenue breakdown */}
                <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5">
                  <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-yellow-400" /> Revenue Breakdown
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-xs">Monthly subs</span>
                      <span className="text-white font-bold text-xs">
                        {plans['pro_monthly'] || 0} × {PRO_MONTHLY_EGP} EGP
                        = {((plans['pro_monthly'] || 0) * PRO_MONTHLY_EGP).toLocaleString()} EGP
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-xs">Quarterly subs</span>
                      <span className="text-white font-bold text-xs">
                        {plans['pro_quarterly'] || 0} × {PRO_QUARTERLY_EGP} EGP
                        = {((plans['pro_quarterly'] || 0) * PRO_QUARTERLY_EGP).toLocaleString()} EGP
                      </span>
                    </div>
                    <div className="border-t border-gray-800 pt-2 flex justify-between">
                      <span className="text-gray-300 text-xs font-bold">Total</span>
                      <span className="text-yellow-400 font-black text-sm">{revEGP.toLocaleString()} EGP</span>
                    </div>
                    <p className="text-gray-600 text-xs">≈ ${revUSD} USD</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── ACTIVATE USER ─────────────────────────────────────────────────────── */}
      {tab === 'activate' && (
        <div className="max-w-2xl space-y-5">
          <div>
            <h2 className="text-white font-bold text-lg">User Management</h2>
            <p className="text-gray-500 text-xs mt-1">Look up any student by email, then activate, revoke, or grant bonus missions.</p>
          </div>

          {/* Search bar */}
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="student@email.com"
              value={activateEmail}
              onChange={e => { setActivateEmail(e.target.value); setLookupResult(null); }}
              onKeyDown={e => { if (e.key === 'Enter') handleLookup(); }}
              className="flex-1 bg-[#0A0B0E] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#22D3EE]"
            />
            <button onClick={handleLookup} disabled={lookingUp}
              className="px-5 py-3 bg-[#0A0B0E] border border-gray-700 text-gray-300 font-bold rounded-xl text-sm hover:border-[#22D3EE]/50 transition-all disabled:opacity-50">
              {lookingUp ? 'Searching…' : '🔍 Look up'}
            </button>
          </div>

          {activateMsg && (
            <p className={cn('text-sm font-semibold', activateMsg.startsWith('✅') ? 'text-emerald-400' : 'text-red-400')}>
              {activateMsg}
            </p>
          )}

          {/* User card — appears after lookup */}
          {lookupResult && (
            <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-white font-bold text-sm">{lookupResult.email}</p>
                  <p className="text-gray-600 text-xs font-mono mt-0.5">{lookupResult.userId?.slice(0, 12)}…</p>
                </div>
                <span className={cn('px-3 py-1 rounded-full text-[10px] font-black uppercase',
                  lookupResult.subscription?.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-gray-800 text-gray-500')}>
                  {lookupResult.subscription?.plan || 'free'} · {lookupResult.subscription?.status || 'inactive'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#050608] rounded-xl p-3">
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider">Missions</p>
                  <p className="text-white font-black text-lg">{lookupResult.totalMissions ?? 0}</p>
                </div>
                <div className="bg-[#050608] rounded-xl p-3">
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider">Bonus</p>
                  <p className="text-[#A855F7] font-black text-lg">+{lookupResult.bonus ?? 0}</p>
                </div>
                <div className="bg-[#050608] rounded-xl p-3">
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider">Expires</p>
                  <p className="text-gray-300 font-bold text-xs mt-1">
                    {lookupResult.subscription?.expires_at
                      ? new Date(lookupResult.subscription.expires_at).toLocaleDateString('en-GB')
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5 space-y-4">
            {/* Grant plan */}
            <div>
              <label className="block text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-2">Activate / change plan</label>
              <div className="flex gap-2">
                <select
                  value={activatePlan}
                  onChange={e => setActivatePlan(e.target.value as any)}
                  className="flex-1 bg-[#050608] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#22D3EE]"
                >
                  <option value="pro_monthly">Pro Monthly (350 EGP · 25 missions · 30d)</option>
                  <option value="pro_quarterly">Pro Quarterly (1,000 EGP · 60 missions · 90d)</option>
                  <option value="pro_yearly">Pro Yearly (unlimited · 365d)</option>
                </select>
                <button onClick={handleActivate} disabled={activating}
                  className="px-5 py-3 bg-[#22D3EE] text-black font-black rounded-xl text-sm hover:bg-white transition-all disabled:opacity-50 whitespace-nowrap">
                  ⚡ Activate
                </button>
              </div>
            </div>

            {/* Bonus + Revoke row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-2">Grant bonus missions</label>
                <div className="flex gap-2">
                  <input type="number" min={1} max={100} value={bonusAmount}
                    onChange={e => setBonusAmount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-20 bg-[#050608] border border-gray-800 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-[#A855F7]" />
                  <button onClick={handleBonus} disabled={activating}
                    className="flex-1 py-3 bg-[#A855F7]/15 border border-[#A855F7]/30 text-[#A855F7] font-bold rounded-xl text-sm hover:bg-[#A855F7]/25 transition-all disabled:opacity-50">
                    🎁 Grant +{bonusAmount}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-2">Revoke access</label>
                <button onClick={handleRevoke} disabled={activating}
                  className="w-full py-3 bg-red-500/10 border border-red-500/30 text-red-400 font-bold rounded-xl text-sm hover:bg-red-500/20 transition-all disabled:opacity-50">
                  ⛔ Revoke to Free
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SUBSCRIPTIONS ─────────────────────────────────────────────────────── */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <Users className="w-4 h-4 text-[#A855F7]" /> Subscriptions ({subscriptions.length})
            </h2>
            <button
              onClick={() => downloadCSV(
                [['user_id', 'plan', 'status', 'started_at', 'expires_at'],
                 ...subscriptions.map(s => [s.user_id, s.plan, s.status, s.started_at, s.expires_at])],
                'subscriptions.csv',
              )}
              className="text-xs text-gray-500 hover:text-white border border-gray-800 px-3 py-1.5 rounded-lg transition-all"
            >
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-xs">
              <thead className="bg-[#0A0B0E]">
                <tr>
                  {['User ID', 'Plan', 'Status', 'Started', 'Expires'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-gray-500 font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900">
                {subscriptions.map(s => {
                  const isExpiring = (() => {
                    if (!s.expires_at || s.status !== 'active') return false;
                    const exp = new Date(s.expires_at);
                    return exp > now && exp <= in7days;
                  })();
                  return (
                    <tr key={s.id} className={cn('hover:bg-[#0A0B0E]/50 transition-colors', isExpiring && 'bg-yellow-500/5')}>
                      <td className="px-4 py-3 text-gray-400 font-mono">{s.user_id?.slice(0, 8)}…</td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                          s.plan === 'pro_quarterly' ? 'bg-[#22D3EE]/10 text-[#22D3EE]'
                          : s.plan === 'pro_monthly' ? 'bg-[#A855F7]/10 text-[#A855F7]'
                          : 'bg-gray-800 text-gray-500',
                        )}>
                          {s.plan?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold',
                          s.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-800 text-gray-500',
                        )}>
                          {s.status}
                        </span>
                        {isExpiring && <span className="ml-2 text-yellow-400 text-[10px] font-bold">⚠️ EXPIRING</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{s.started_at ? new Date(s.started_at).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MISSIONS ──────────────────────────────────────────────────────────── */}
      {tab === 'missions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#22D3EE]" /> Missions ({missions.length})
            </h2>
            <button
              onClick={() => downloadCSV(
                [['id', 'user_id', 'payload_name', 'university', 'course', 'assignment_type', 'status', 'lang', 'created_at'],
                 ...missions.map(m => [m.id, m.user_id, m.payload_name, m.university, m.course, m.assignment_type, m.status, m.lang, m.created_at])],
                'missions.csv',
              )}
              className="text-xs text-gray-500 hover:text-white border border-gray-800 px-3 py-1.5 rounded-lg transition-all"
            >
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-xs">
              <thead className="bg-[#0A0B0E]">
                <tr>
                  {['Name', 'University', 'Type', 'Lang', 'Status', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-gray-500 font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900">
                {missions.slice(0, 100).map(m => (
                  <tr key={m.id} className="hover:bg-[#0A0B0E]/50 transition-colors">
                    <td className="px-4 py-3 text-gray-200 max-w-[180px] truncate">{m.payload_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[120px] truncate">{m.university || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{m.assignment_type || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 uppercase">{m.lang || 'en'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold',
                        m.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400'
                        : m.status === 'failed' ? 'bg-red-500/10 text-red-400'
                        : 'bg-gray-800 text-gray-500',
                      )}>
                        {m.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{m.created_at ? new Date(m.created_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {missions.length > 100 && (
              <p className="text-center text-gray-600 text-xs py-3">Showing latest 100 of {missions.length} missions</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
