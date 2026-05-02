import React, { useState, useEffect } from 'react';
import {
  Users, Shield, FileText, Search, RefreshCw,
  CheckCircle2, XCircle, Crown, TrendingUp, DollarSign,
  AlertCircle, ChevronDown, ChevronUp, Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

const OWNER_EMAIL = 'zeyadsayedinq@gmail.com';

const PLAN_LIMITS: Record<string, number> = {
  free: 3, pro_monthly: 15, pro_quarterly: 40, pro_yearly: 999999,
};

function StatCard({ label, value, sub, icon: Icon, color }: any) {
  return (
    <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-3xl font-black text-white">{value}</p>
      {sub && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
    </div>
  );
}

export function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'overview' | 'users' | 'missions'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [missions, setMissions] = useState<any[]>([]);
  const [subscriptions, setSubs] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  // Grant/revoke state
  const [grantUserId, setGrantUserId] = useState('');
  const [grantEmail, setGrantEmail] = useState('');
  const [grantPlan, setGrantPlan] = useState('pro_quarterly');
  const [grantDays, setGrantDays] = useState(90);
  const [grantMsg, setGrantMsg] = useState('');
  const [grantLoading, setGrantLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true); setError(null);
    try {
      // Missions — readable with anon key if RLS allows owner
      const { data: m, error: me } = await supabase
        .from('missions')
        .select('id,created_at,assignment_type,university,course,status,user_id')
        .order('created_at', { ascending: false })
        .limit(200);
      if (me) throw me;
      setMissions(m || []);

      // Subscriptions
      const { data: s, error: se } = await supabase
        .from('subscriptions')
        .select('user_id,plan,status,expires_at,started_at,tap_charge_id')
        .order('started_at', { ascending: false });
      if (se) throw se;
      setSubs(s || []);

    } catch (e: any) {
      setError(e.message || 'Failed to load data. Make sure RLS policies allow owner access.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user?.email === OWNER_EMAIL) fetchAll();
    else setLoading(false);
  }, [user]);

  // Grant Pro directly via Supabase (no backend needed)
  const handleGrant = async (action: 'grant' | 'revoke') => {
    setGrantLoading(true); setGrantMsg('');
    try {
      let targetId = grantUserId.trim();

      // If email provided, look up user in subscriptions by email match
      // (we store user_id, so we need to cross-reference)
      if (!targetId && grantEmail.trim()) {
        // Try to find in subscriptions by checking missions table
        const { data } = await supabase
          .from('missions')
          .select('user_id')
          .limit(1);
        // Can't look up by email without service role — show instructions
        setGrantMsg('⚠️ Enter the User ID (not email). Find it in the Missions tab.');
        setGrantLoading(false);
        return;
      }

      if (!targetId) {
        setGrantMsg('❌ Enter a User ID first.');
        setGrantLoading(false);
        return;
      }

      if (action === 'revoke') {
        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('user_id', targetId);
        if (error) throw error;
        setGrantMsg(`✅ Pro revoked for ${targetId.slice(0, 12)}...`);
      } else {
        const exp = new Date();
        exp.setDate(exp.getDate() + grantDays);
        const { error } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: targetId,
            plan: grantPlan,
            status: 'active',
            started_at: new Date().toISOString(),
            expires_at: exp.toISOString(),
            tap_charge_id: `manual_${Date.now()}`,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
        if (error) throw error;
        setGrantMsg(`✅ ${grantPlan} granted until ${exp.toLocaleDateString()}`);
      }
      fetchAll();
    } catch (e: any) {
      setGrantMsg(`❌ ${e.message}`);
    }
    setGrantLoading(false);
  };

  // Stats
  const activePro = subscriptions.filter(s => s.status === 'active').length;
  const plans = subscriptions.filter(s => s.status === 'active').reduce((a: any, s) => {
    a[s.plan] = (a[s.plan] || 0) + 1; return a;
  }, {});
  const revEGP = (plans.pro_quarterly || 0) * 1000 + (plans.pro_monthly || 0) * 390 + (plans.pro_yearly || 0) * 3500;
  const last7d = missions.filter(m => new Date(m.created_at) > new Date(Date.now() - 604800000)).length;
  const typeBreakdown = missions.reduce((a: any, m) => {
    a[m.assignment_type || 'other'] = (a[m.assignment_type || 'other'] || 0) + 1; return a;
  }, {});

  const filteredSubs = subscriptions.filter(s =>
    s.user_id?.toLowerCase().includes(search.toLowerCase())
  );

  if (user?.email !== OWNER_EMAIL) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-white font-bold text-xl mb-2">Access Denied</h2>
        <p className="text-gray-500">Restricted to platform owner only.</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 text-white">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] uppercase tracking-widest mb-3">
            <Shield className="w-3 h-3" /> Owner Dashboard — Supabase Direct
          </div>
          <h1 className="text-3xl font-black">Mi-Assignment Admin</h1>
          <p className="text-gray-500 text-sm mt-1">
            Reading directly from Supabase · No backend required
          </p>
        </div>
        <button onClick={fetchAll} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#0A0B0E] border border-gray-800 rounded-xl text-sm text-gray-400 hover:text-white transition-all disabled:opacity-50">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </p>
          <p className="text-red-400/60 text-xs mt-2">
            Tip: Add a Supabase RLS policy to allow owner email to read all tables.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['overview', 'users', 'missions'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all',
              tab === t ? 'bg-[#22D3EE] text-black' : 'bg-[#0A0B0E] border border-gray-800 text-gray-400 hover:border-gray-600')}>
            {t === 'overview' ? '📊 Overview' : t === 'users' ? '👥 Subscriptions' : '📋 Missions'}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-[#0A0B0E] border border-gray-800 rounded-2xl animate-pulse" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Missions" value={missions.length} icon={FileText} color="bg-[#22D3EE]/10 text-[#22D3EE]" />
                <StatCard label="Active Pro" value={activePro} icon={Crown} color="bg-[#A855F7]/10 text-[#A855F7]" />
                <StatCard label="Missions (7d)" value={last7d} icon={TrendingUp} color="bg-emerald-500/10 text-emerald-400" />
                <StatCard label="Est. Revenue" value={`${revEGP.toLocaleString()} EGP`} sub="active subs" icon={DollarSign} color="bg-yellow-500/10 text-yellow-400" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Plan breakdown */}
                <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5">
                  <h3 className="text-white font-bold text-sm mb-4">Plan Breakdown</h3>
                  {Object.keys(plans).length === 0 ? (
                    <p className="text-gray-600 text-sm">No active subscriptions yet.</p>
                  ) : Object.entries(plans).map(([plan, count]: any) => (
                    <div key={plan} className="flex items-center justify-between mb-3">
                      <span className="text-gray-400 text-sm capitalize">{plan.replace(/_/g, ' ')}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-[#22D3EE] rounded-full" style={{ width: `${(count / activePro) * 100}%` }} />
                        </div>
                        <span className="text-white font-bold text-sm w-4 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Assignment type breakdown */}
                <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5">
                  <h3 className="text-white font-bold text-sm mb-4">Top Assignment Types</h3>
                  {Object.entries(typeBreakdown).sort(([,a],[,b]) => (b as number) - (a as number)).slice(0, 7).map(([type, count]: any) => (
                    <div key={type} className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-xs capitalize">{type}</span>
                      <span className="text-white font-mono font-bold text-xs">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grant / Revoke Pro — works directly via Supabase */}
              <div className="bg-[#0A0B0E] border border-yellow-500/20 rounded-2xl p-5">
                <h3 className="text-white font-bold text-sm mb-1 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-400" /> Grant / Revoke Pro
                </h3>
                <p className="text-gray-600 text-xs mb-4">
                  Find the User ID in the Missions tab, then paste it below.
                </p>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="User ID (e.g. a1b2c3d4-...)"
                    value={grantUserId}
                    onChange={e => setGrantUserId(e.target.value)}
                    className="w-full bg-[#050608] border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500/50 font-mono"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Plan</label>
                      <select value={grantPlan} onChange={e => setGrantPlan(e.target.value)}
                        className="w-full bg-[#050608] border border-gray-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#22D3EE]">
                        <option value="pro_quarterly">Pro Quarterly (90 days)</option>
                        <option value="pro_monthly">Pro Monthly (30 days)</option>
                        <option value="pro_yearly">Pro Yearly (365 days)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Duration (days)</label>
                      <input type="number" value={grantDays} onChange={e => setGrantDays(Number(e.target.value))}
                        className="w-full bg-[#050608] border border-gray-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#22D3EE]"
                        min={1} max={365} />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => handleGrant('grant')} disabled={grantLoading || !grantUserId.trim()}
                      className="flex-1 py-2.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl text-sm hover:bg-emerald-500/30 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {grantLoading ? 'Processing...' : 'Grant Pro'}
                    </button>
                    <button onClick={() => handleGrant('revoke')} disabled={grantLoading || !grantUserId.trim()}
                      className="flex-1 py-2.5 bg-red-500/20 border border-red-500/30 text-red-400 font-bold rounded-xl text-sm hover:bg-red-500/30 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                      <XCircle className="w-4 h-4" />
                      {grantLoading ? '...' : 'Revoke'}
                    </button>
                  </div>

                  {grantMsg && (
                    <p className={cn('text-xs px-3 py-2 rounded-xl border',
                      grantMsg.startsWith('✅') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : grantMsg.startsWith('⚠️') ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/10 border-red-500/20 text-red-400')}>
                      {grantMsg}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* SUBSCRIPTIONS */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input type="text" placeholder="Search user ID..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#0A0B0E] border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#22D3EE] transition-all" />
            </div>
            <span className="text-gray-500 text-xs">{filteredSubs.length} subscriptions</span>
          </div>

          <p className="text-gray-600 text-xs">
            💡 To find a user's email, search their user_id in Supabase → Authentication → Users.
            Copy the User ID from here to grant/revoke Pro in the Overview tab.
          </p>

          <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-[#050608]">
                  {['User ID', 'Plan', 'Status', 'Started', 'Expires', 'Ref'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-500 font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {loading ? [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="h-4 bg-white/5 rounded animate-pulse" /></td></tr>
                )) : filteredSubs.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-600">No subscriptions yet.</td></tr>
                ) : filteredSubs.map((s, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-gray-400 text-[10px] font-mono cursor-pointer hover:text-white transition-colors"
                        onClick={() => { setGrantUserId(s.user_id); setTab('overview'); }}
                        title="Click to use in Grant/Revoke">
                        {s.user_id?.slice(0, 16)}…
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                        s.plan?.includes('pro') ? 'bg-[#A855F7]/10 text-[#A855F7] border border-[#A855F7]/20' : 'bg-gray-800 text-gray-400')}>
                        {s.plan || 'free'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('flex items-center gap-1 text-[10px] font-bold',
                        s.status === 'active' ? 'text-emerald-400' : 'text-gray-500')}>
                        {s.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {s.status || 'inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {s.started_at ? new Date(s.started_at).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {s.expires_at ? new Date(s.expires_at).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-[10px] font-mono">
                      {s.tap_charge_id?.startsWith('manual') ? '✍️ manual' : s.tap_charge_id ? '💳 tap' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MISSIONS */}
      {tab === 'missions' && (
        <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-[#050608]">
                {['Time', 'Type', 'University', 'Course', 'User ID'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-500 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-4 py-4"><div className="h-4 bg-white/5 rounded animate-pulse" /></td></tr>
              )) : missions.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-600">No missions yet.</td></tr>
              ) : missions.map((m, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono whitespace-nowrap">
                    {new Date(m.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-[#22D3EE]/10 text-[#22D3EE] text-[10px] font-bold rounded uppercase">
                      {m.assignment_type || 'other'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{m.university || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{m.course || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-gray-600 text-[10px] font-mono cursor-pointer hover:text-[#22D3EE] transition-colors"
                      onClick={() => { setGrantUserId(m.user_id); setTab('overview'); }}
                      title="Click to use in Grant/Revoke">
                      {m.user_id?.slice(0, 14)}…
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
