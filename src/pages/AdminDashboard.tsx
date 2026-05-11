import React, { useState, useEffect } from 'react';
import {
  Users, Shield, FileText, Search, RefreshCw,
  CheckCircle2, XCircle, Crown, TrendingUp, DollarSign,
  AlertCircle, Calendar, Copy, MessageCircle, Bell,
  BarChart2, Zap, Clock, ChevronRight, Download
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

const ADMIN_EMAILS = ['zeyadsayedinq@gmail.com', 'ranafaraj30@gmail.com'];

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

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="text-gray-600 hover:text-[#22D3EE] transition-colors ml-1">
      {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" /> : <Copy className="w-3 h-3 inline" />}
    </button>
  );
}

export function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'overview' | 'users' | 'missions' | 'activate'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [missions, setMissions] = useState<any[]>([]);
  const [subscriptions, setSubs] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  // Grant state
  const [grantUserId, setGrantUserId] = useState('');
  const [grantPlan, setGrantPlan] = useState('pro_quarterly');
  const [grantDays, setGrantDays] = useState(90);
  const [grantMsg, setGrantMsg] = useState('');
  const [grantLoading, setGrantLoading] = useState(false);

  // Activate by email state
  const [activateEmail, setActivateEmail] = useState('');
  const [activateNote, setActivateNote] = useState('');
  const [activateMsg, setActivateMsg] = useState('');
  const [activateLoading, setActivateLoading] = useState(false);

  // Announcement state
  const [announcementText, setAnnouncementText] = useState('');

  const fetchAll = async () => {
    setLoading(true); setError(null);
    try {
      const { data: m, error: me } = await supabase
        .from('missions')
        .select('id,created_at,assignment_type,university,course,status,user_id,lang')
        .order('created_at', { ascending: false })
        .limit(300);
      if (me) throw me;
      setMissions(m || []);

      const { data: s, error: se } = await supabase
        .from('subscriptions')
        .select('user_id,plan,status,expires_at,started_at,tap_charge_id')
        .order('started_at', { ascending: false });
      if (se) throw se;
      setSubs(s || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load. Check Supabase RLS policies.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (ADMIN_EMAILS.includes(user?.email || '')) fetchAll();
    else setLoading(false);
  }, [user]);

  // Grant/Revoke by User ID
  const handleGrant = async (action: 'grant' | 'revoke') => {
    setGrantLoading(true); setGrantMsg('');
    try {
      if (!grantUserId.trim()) { setGrantMsg('❌ Enter a User ID.'); setGrantLoading(false); return; }
      if (action === 'revoke') {
        const { error } = await supabase.from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('user_id', grantUserId.trim());
        if (error) throw error;
        setGrantMsg(`✅ Revoked for ${grantUserId.slice(0, 12)}...`);
      } else {
        const exp = new Date();
        exp.setDate(exp.getDate() + grantDays);
        const { error } = await supabase.from('subscriptions').upsert({
          user_id: grantUserId.trim(),
          plan: grantPlan,
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: exp.toISOString(),
          tap_charge_id: `manual_${Date.now()}`,
        }, { onConflict: 'user_id' });
        if (error) throw error;
        setGrantMsg(`✅ ${grantPlan} granted until ${exp.toLocaleDateString()}`);
      }
      fetchAll();
    } catch (e: any) { setGrantMsg(`❌ ${e.message}`); }
    setGrantLoading(false);
  };

  // Activate by email — looks up user_id from missions table
  const handleActivateByEmail = async () => {
    setActivateLoading(true); setActivateMsg('');
    try {
      if (!activateEmail.trim()) { setActivateMsg('❌ Enter email'); setActivateLoading(false); return; }

      // Look up user by email via admin API
      const { data: adminData, error: adminErr } = await supabase.auth.admin
        ? (supabase as any).auth.admin.listUsers()
        : { data: null, error: { message: 'No admin access — use User ID instead' } };

      if (adminErr || !adminData) {
        // Fallback: search missions for this email pattern
        // Try to find user_id from missions table where billing_email matches
        const { data: missionWithEmail } = await supabase
          .from('missions')
          .select('user_id')
          .eq('billing_email', activateEmail.trim())
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (missionWithEmail?.user_id) {
          // Found user via billing email in missions
          const uid = missionWithEmail.user_id;
          const exp2 = new Date();
          exp2.setDate(exp2.getDate() + grantDays);
          const { error: e2 } = await supabase.from('subscriptions').upsert({
            user_id: uid,
            plan: grantPlan,
            status: 'active',
            started_at: new Date().toISOString(),
            expires_at: exp2.toISOString(),
            tap_charge_id: `manual_${Date.now()}`,
          }, { onConflict: 'user_id' });
          if (e2) throw e2;
          setActivateMsg(`✅ ${grantPlan} activated via mission history for ${activateEmail}`);
          setActivateEmail(''); setActivateNote('');
          fetchAll();
          setActivateLoading(false);
          return;
        }
        setActivateMsg('⚠️ User not found in mission history. Find their User ID in the Missions tab → click it → use Grant Pro in Overview tab.');
        setActivateLoading(false);
        return;
      }

      const foundUser = adminData.users?.find((u: any) => u.email === activateEmail.trim());
      if (!foundUser) { setActivateMsg('❌ User not found. Have they signed up?'); setActivateLoading(false); return; }

      const exp = new Date();
      exp.setDate(exp.getDate() + grantDays);
      const { error } = await supabase.from('subscriptions').upsert({
        user_id: foundUser.id,
        plan: grantPlan,
        status: 'active',
        started_at: new Date().toISOString(),
        expires_at: exp.toISOString(),
        tap_charge_id: `manual_${Date.now()}`,
      }, { onConflict: 'user_id' });
      if (error) throw error;
      setActivateMsg(`✅ ${grantPlan} activated for ${activateEmail} until ${exp.toLocaleDateString()}`);
      setActivateEmail(''); setActivateNote('');
      fetchAll();
    } catch (e: any) { setActivateMsg(`❌ ${e.message}`); }
    setActivateLoading(false);
  };

  // Stats
  const activePro = subscriptions.filter(s => s.status === 'active').length;
  const expiringSoon = subscriptions.filter(s => {
    if (s.status !== 'active' || !s.expires_at) return false;
    const days = (new Date(s.expires_at).getTime() - Date.now()) / 86400000;
    return days <= 7 && days > 0;
  }).length;

  const plans = subscriptions.filter(s => s.status === 'active').reduce((a: any, s) => {
    a[s.plan] = (a[s.plan] || 0) + 1; return a;
  }, {});
  const revEGP = (plans.pro_quarterly || 0) * 1000 + (plans.pro_monthly || 0) * 350;
  const last7d = missions.filter(m => new Date(m.created_at) > new Date(Date.now() - 604800000)).length;
  const last24h = missions.filter(m => new Date(m.created_at) > new Date(Date.now() - 86400000)).length;
  const typeBreakdown = missions.reduce((a: any, m) => {
    a[m.assignment_type || 'other'] = (a[m.assignment_type || 'other'] || 0) + 1; return a;
  }, {});
  const uniBreakdown = missions.reduce((a: any, m) => {
    if (m.university) a[m.university] = (a[m.university] || 0) + 1; return a;
  }, {});
  const langBreakdown = missions.reduce((a: any, m) => {
    a[m.lang || 'en'] = (a[m.lang || 'en'] || 0) + 1; return a;
  }, {});

  const filteredSubs = subscriptions.filter(s =>
    s.user_id?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredMissions = missions.filter(m =>
    !search || m.user_id?.toLowerCase().includes(search.toLowerCase())
      || m.university?.toLowerCase().includes(search.toLowerCase())
      || m.assignment_type?.toLowerCase().includes(search.toLowerCase())
  );

  // Export CSV
  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(row =>
      headers.map(h => JSON.stringify(row[h] ?? '')).join(',')
    )].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  };

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
        <button onClick={fetchAll} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#0A0B0E] border border-gray-800 rounded-xl text-sm text-gray-400 hover:text-white transition-all disabled:opacity-50">
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

      {/* Expiring soon alert */}
      {expiringSoon > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3">
          <Bell className="w-4 h-4 text-yellow-400 shrink-0" />
          <p className="text-yellow-300 text-sm font-bold">{expiringSoon} subscription{expiringSoon > 1 ? 's' : ''} expiring within 7 days — consider reaching out to renew.</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'overview', label: '📊 Overview' },
          { key: 'activate', label: '⚡ Activate User' },
          { key: 'users', label: '👥 Subscriptions' },
          { key: 'missions', label: '📋 Missions' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn('px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all',
              tab === t.key ? 'bg-[#22D3EE] text-black' : 'bg-[#0A0B0E] border border-gray-800 text-gray-400 hover:border-gray-600')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-[#0A0B0E] border border-gray-800 rounded-2xl animate-pulse" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Missions" value={missions.length} sub={`${last24h} today · ${last7d} this week`} icon={FileText} color="bg-[#22D3EE]/10 text-[#22D3EE]" />
                <StatCard label="Active Pro Users" value={activePro} sub={expiringSoon > 0 ? `⚠️ ${expiringSoon} expiring soon` : 'all good'} icon={Crown} color="bg-[#A855F7]/10 text-[#A855F7]" />
                <StatCard label="Missions (7 days)" value={last7d} sub={`${last24h} in last 24h`} icon={TrendingUp} color="bg-emerald-500/10 text-emerald-400" />
                <StatCard label="Est. Revenue" value={`${revEGP.toLocaleString()} EGP`} sub={`≈ $${Math.round(revEGP / 50)} USD / quarter`} icon={DollarSign} color="bg-yellow-500/10 text-yellow-400" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Plan breakdown */}
                <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5">
                  <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-[#22D3EE]" /> Plans</h3>
                  {Object.keys(plans).length === 0
                    ? <p className="text-gray-600 text-sm">No active subs yet.</p>
                    : Object.entries(plans).map(([plan, count]: any) => (
                      <div key={plan} className="flex items-center justify-between mb-3">
                        <span className="text-gray-400 text-sm capitalize">{plan.replace(/_/g, ' ')}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-[#22D3EE] rounded-full" style={{ width: `${(count / activePro) * 100}%` }} />
                          </div>
                          <span className="text-white font-bold text-sm">{count}</span>
                        </div>
                      </div>
                    ))
                  }
                </div>

                {/* Top assignment types */}
                <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5">
                  <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-[#A855F7]" /> Top Types</h3>
                  {Object.entries(typeBreakdown).sort(([,a],[,b]) => (b as number) - (a as number)).slice(0, 7).map(([type, count]: any) => (
                    <div key={type} className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-xs capitalize">{type}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1 bg-gray-800 rounded overflow-hidden">
                          <div className="h-full bg-[#A855F7]" style={{ width: `${(count / missions.length) * 100 * 3}%` }} />
                        </div>
                        <span className="text-white font-mono text-xs">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Top universities + lang */}
                <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5">
                  <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-emerald-400" /> Top Universities</h3>
                  {Object.entries(uniBreakdown).sort(([,a],[,b]) => (b as number) - (a as number)).slice(0, 6).map(([uni, count]: any) => (
                    <div key={uni} className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-xs truncate max-w-[140px]">{uni}</span>
                      <span className="text-white font-mono text-xs">{count}</span>
                    </div>
                  ))}
                  <div className="mt-3 pt-3 border-t border-gray-800 flex gap-3">
                    {Object.entries(langBreakdown).map(([lang, count]: any) => (
                      <span key={lang} className="text-xs text-gray-500">{lang === 'ar' ? '🇪🇬 AR' : '🌍 EN'}: <span className="text-white">{count}</span></span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grant by User ID */}
              <div className="bg-[#0A0B0E] border border-yellow-500/20 rounded-2xl p-5">
                <h3 className="text-white font-bold text-sm mb-1 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-400" /> Grant / Revoke by User ID
                </h3>
                <p className="text-gray-600 text-xs mb-4">Find User ID in the Missions tab, click it to auto-fill here.</p>
                <div className="space-y-3">
                  <input type="text" placeholder="User ID (e.g. a1b2c3d4-...)"
                    value={grantUserId} onChange={e => setGrantUserId(e.target.value)}
                    className="w-full bg-[#050608] border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500/50 font-mono" />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Plan</label>
                      <select value={grantPlan} onChange={e => setGrantPlan(e.target.value)}
                        className="w-full bg-[#050608] border border-gray-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none">
                        <option value="pro_quarterly">Pro Quarterly (90d)</option>
                        <option value="pro_monthly">Pro Monthly (30d)</option>
                        <option value="pro_yearly">Pro Yearly (365d)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Days</label>
                      <input type="number" value={grantDays} onChange={e => setGrantDays(Number(e.target.value))}
                        className="w-full bg-[#050608] border border-gray-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
                        min={1} max={365} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleGrant('grant')} disabled={grantLoading || !grantUserId.trim()}
                      className="flex-1 py-2.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl text-sm hover:bg-emerald-500/30 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />{grantLoading ? '...' : 'Grant Pro'}
                    </button>
                    <button onClick={() => handleGrant('revoke')} disabled={grantLoading || !grantUserId.trim()}
                      className="flex-1 py-2.5 bg-red-500/20 border border-red-500/30 text-red-400 font-bold rounded-xl text-sm hover:bg-red-500/30 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                      <XCircle className="w-4 h-4" />{grantLoading ? '...' : 'Revoke'}
                    </button>
                  </div>
                  {grantMsg && <p className={cn('text-xs px-3 py-2 rounded-xl border', grantMsg.startsWith('✅') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400')}>{grantMsg}</p>}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── ACTIVATE USER ── */}
      {tab === 'activate' && (
        <div className="space-y-4 max-w-xl">
          <div className="bg-[#0A0B0E] border border-[#22D3EE]/20 rounded-2xl p-6 space-y-4">
            <h3 className="text-white font-bold flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-green-400" /> Activate After WhatsApp Payment
            </h3>
            <p className="text-gray-500 text-xs">When a student sends payment proof on WhatsApp, paste their email here to activate instantly.</p>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Student Email</label>
              <input type="email" placeholder="student@university.edu"
                value={activateEmail} onChange={e => setActivateEmail(e.target.value)}
                className="w-full bg-[#050608] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#22D3EE]/50" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Plan</label>
                <select value={grantPlan} onChange={e => setGrantPlan(e.target.value)}
                  className="w-full bg-[#050608] border border-gray-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none">
                  <option value="pro_quarterly">Pro Quarterly — 1,000 EGP</option>
                  <option value="pro_monthly">Pro Monthly — 350 EGP</option>
                  <option value="pro_yearly">Pro Yearly — 3,500 EGP</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Duration (days)</label>
                <input type="number" value={grantDays} onChange={e => setGrantDays(Number(e.target.value))}
                  className="w-full bg-[#050608] border border-gray-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none"
                  min={1} max={365} />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Note (optional)</label>
              <input type="text" placeholder="e.g. InstaPay screenshot confirmed 13 May"
                value={activateNote} onChange={e => setActivateNote(e.target.value)}
                className="w-full bg-[#050608] border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#22D3EE]/50" />
            </div>

            <button onClick={handleActivateByEmail} disabled={activateLoading || !activateEmail.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-black font-black rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" />
              {activateLoading ? 'Activating...' : 'Activate Now'}
            </button>

            {activateMsg && (
              <p className={cn('text-xs px-4 py-3 rounded-xl border',
                activateMsg.startsWith('✅') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : activateMsg.startsWith('⚠️') ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400')}>
                {activateMsg}
              </p>
            )}
          </div>

          {/* WhatsApp activation message template */}
          <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5">
            <h3 className="text-white font-bold text-sm mb-3">WhatsApp Reply Template</h3>
            <div className="bg-[#050608] rounded-xl p-4 text-sm text-gray-300 leading-relaxed relative">
              <p>تم تفعيل اشتراكك في Mi-Assignment ✅</p>
              <p className="mt-1">ادخل على www.mi-assignment.com وابدأ أول مهمة 🚀</p>
              <p className="mt-1 text-gray-500 text-xs">أي مشكلة كلمنا هنا 🙌</p>
              <CopyBtn text={"تم تفعيل اشتراكك في Mi-Assignment ✅\nادخل على www.mi-assignment.com وابدأ أول مهمة 🚀\nأي مشكلة كلمنا هنا 🙌"} />
            </div>
          </div>
        </div>
      )}

      {/* ── SUBSCRIPTIONS ── */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input type="text" placeholder="Search user ID..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#0A0B0E] border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#22D3EE] transition-all" />
            </div>
            <span className="text-gray-500 text-xs">{filteredSubs.length} subscriptions</span>
            <button onClick={() => exportCSV(subscriptions, 'mi-subscriptions.csv')}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#0A0B0E] border border-gray-800 rounded-xl text-xs text-gray-400 hover:text-white transition-all">
              <Download className="w-3 h-3" /> Export CSV
            </button>
          </div>

          <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-800 bg-[#050608]">
                  {['User ID', 'Plan', 'Status', 'Started', 'Expires', 'Payment', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-500 font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {loading ? [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-4 bg-white/5 rounded animate-pulse" /></td></tr>
                )) : filteredSubs.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-600">No subscriptions yet.</td></tr>
                ) : filteredSubs.map((s, i) => {
                  const daysLeft = s.expires_at ? Math.ceil((new Date(s.expires_at).getTime() - Date.now()) / 86400000) : null;
                  const expiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
                  return (
                    <tr key={i} className={cn('hover:bg-white/[0.02] transition-colors', expiringSoon && 'bg-yellow-500/5')}>
                      <td className="px-4 py-3">
                        <span className="text-gray-400 text-[10px] font-mono cursor-pointer hover:text-[#22D3EE] transition-colors"
                          onClick={() => { setGrantUserId(s.user_id); setTab('overview'); }}
                          title="Click to use in Grant/Revoke">
                          {s.user_id?.slice(0, 14)}…
                        </span>
                        <CopyBtn text={s.user_id} />
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
                      <td className="px-4 py-3 text-xs">
                        <span className={cn(expiringSoon ? 'text-yellow-400 font-bold' : 'text-gray-500')}>
                          {s.expires_at ? `${new Date(s.expires_at).toLocaleDateString('en-GB')}${expiringSoon ? ` (${daysLeft}d!)` : ''}` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-[10px] font-mono">
                        {s.tap_charge_id?.startsWith('manual') ? '✍️ manual' : s.tap_charge_id ? '💳 tap' : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => { setGrantUserId(s.user_id); setTab('overview'); }}
                          className="text-[10px] text-[#22D3EE] hover:underline flex items-center gap-0.5">
                          Edit <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MISSIONS ── */}
      {tab === 'missions' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input type="text" placeholder="Filter by type, university, user..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#0A0B0E] border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#22D3EE] transition-all" />
            </div>
            <span className="text-gray-500 text-xs">{filteredMissions.length} missions</span>
            <button onClick={() => exportCSV(missions, 'mi-missions.csv')}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#0A0B0E] border border-gray-800 rounded-xl text-xs text-gray-400 hover:text-white transition-all">
              <Download className="w-3 h-3" /> Export CSV
            </button>
          </div>

          <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-800 bg-[#050608]">
                  {['Time', 'Type', 'University', 'Lang', 'User ID'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-500 font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {loading ? [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-4 py-4"><div className="h-4 bg-white/5 rounded animate-pulse" /></td></tr>
                )) : filteredMissions.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-600">No missions yet.</td></tr>
                ) : filteredMissions.map((m, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono whitespace-nowrap">
                      {new Date(m.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-[#22D3EE]/10 text-[#22D3EE] text-[10px] font-bold rounded uppercase">
                        {m.assignment_type || 'other'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[140px] truncate">{m.university || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{m.lang === 'ar' ? '🇪🇬' : '🌍'}</td>
                    <td className="px-4 py-3">
                      <span className="text-gray-600 text-[10px] font-mono cursor-pointer hover:text-[#22D3EE] transition-colors"
                        onClick={() => { setGrantUserId(m.user_id); setTab('overview'); }}
                        title="Click to grant/revoke">
                        {m.user_id?.slice(0, 14)}…
                      </span>
                      <CopyBtn text={m.user_id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
