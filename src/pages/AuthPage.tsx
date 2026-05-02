import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Shield, Lock, Mail, Loader2, Sparkles, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { Analytics } from '../lib/analytics';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

type Mode = 'login' | 'signup' | 'magic' | 'reset' | 'update';

export function AuthPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>((searchParams.get('mode') as Mode) || 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  const next = searchParams.get('next') || '/app';

  // Handle password recovery link from email
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery') || hash.includes('type=invite')) {
      setMode('update');
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (session && mode !== 'update') navigate(next);
  }, [session, navigate, next, mode]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(null);

    try {
      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}${next}` },
        });
        if (error) throw error;
        setSuccess(isAr ? 'شوف إيميلك — بعتنالك رابط الدخول!' : 'Check your email — we sent you a magic login link!');
        Analytics.authCompleted('magic_link');
        return;
      }

      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=update`,
        });
        if (error) throw error;
        setSuccess(isAr ? 'شوف إيميلك لرابط إعادة تعيين كلمة المرور.' : 'Check your email for a password reset link.');
        return;
      }

      if (mode === 'update') {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setSuccess(isAr ? 'تم تحديث كلمة المرور بنجاح.' : 'Password updated successfully.');
        setTimeout(() => { setMode('login'); navigate('/auth'); }, 2000);
        return;
      }

      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        Analytics.authCompleted('email_login');
        navigate(next);
      } else {
        // signup
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}${next}` },
        });
        if (error) throw error;
        setSuccess(isAr ? 'شوف إيميلك لتأكيد الحساب!' : 'Check your email to confirm your account!');
        Analytics.authCompleted('email_signup');
      }
    } catch (err: any) {
      setError(err.message || (isAr ? 'فشل تسجيل الدخول.' : 'Authentication failed.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true); setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}${next}` },
      });
      if (error) throw error;
      Analytics.authCompleted('google_oauth');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const TABS: { id: Mode; label: string }[] = [
    { id: 'login', label: isAr ? 'دخول' : 'Sign In' },
    { id: 'signup', label: isAr ? 'حساب جديد' : 'Sign Up' },
    { id: 'magic', label: isAr ? '✨ Magic' : '✨ Magic' },
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#020617]"
      dir={isAr ? 'rtl' : 'ltr'}>
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#22D3EE]/6 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#A855F7]/6 rounded-full blur-[120px]" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#22D3EE] to-[#A855F7] flex items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.3)]">
              <span className="font-black text-black text-lg">Mi</span>
            </div>
          </Link>
          <h1 className="text-2xl font-black text-white tracking-tight">Mi-Assignment</h1>
          <p className="text-gray-500 text-sm mt-1">{isAr ? 'مساعدك الأكاديمي الذكي' : 'Your AI Academic Helper'}</p>
        </div>

        <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-7">
          {/* Mode tabs — hide in update/reset mode */}
          {mode !== 'update' && mode !== 'reset' && (
            <div className="flex bg-[#050608] rounded-xl p-1 mb-6">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => { setMode(tab.id); setError(null); setSuccess(null); }}
                  className={cn('flex-1 py-2 text-xs font-bold rounded-lg transition-all',
                    mode === tab.id ? 'bg-[#22D3EE] text-black' : 'text-gray-500 hover:text-white')}>
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Google OAuth */}
          {(mode === 'login' || mode === 'signup') && (
            <>
              <button onClick={handleGoogle} disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-all mb-4 text-sm disabled:opacity-50">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {isAr ? 'الدخول بـ Google' : 'Continue with Google'}
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-800" />
                <span className="text-gray-600 text-xs">{isAr ? 'أو' : 'or'}</span>
                <div className="flex-1 h-px bg-gray-800" />
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            {/* Email */}
            {mode !== 'update' && (
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  {isAr ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <div className="relative">
                  <Mail className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600', isAr ? 'right-3' : 'left-3')} />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder={isAr ? 'student@university.edu' : 'student@university.edu'}
                    className={cn('w-full bg-[#050608] border border-gray-800 rounded-xl py-3 text-white text-sm focus:outline-none focus:border-[#22D3EE] transition-all', isAr ? 'pr-10 pl-4' : 'pl-10 pr-4')} />
                </div>
              </div>
            )}

            {/* Password */}
            {(mode === 'login' || mode === 'signup' || mode === 'update') && (
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  {isAr ? 'كلمة المرور' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600', isAr ? 'right-3' : 'left-3')} />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="••••••••"
                    className={cn('w-full bg-[#050608] border border-gray-800 rounded-xl py-3 text-white text-sm focus:outline-none focus:border-[#22D3EE] transition-all', isAr ? 'pr-10 pl-4' : 'pl-10 pr-4')} />
                </div>
                {mode === 'login' && (
                  <button type="button" onClick={() => setMode('reset')}
                    className="text-xs text-gray-600 hover:text-[#22D3EE] mt-1.5 transition-colors">
                    {isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                  </button>
                )}
              </div>
            )}

            {/* Magic link info */}
            {mode === 'magic' && (
              <p className="text-gray-500 text-xs bg-[#050608] border border-gray-900 rounded-xl px-4 py-3">
                {isAr ? 'هنبعتلك رابط دخول على إيميلك. مش محتاج كلمة مرور.' : "We'll send a one-click login link to your email. No password needed."}
              </p>
            )}

            {/* Reset info */}
            {mode === 'reset' && (
              <p className="text-gray-500 text-xs bg-[#050608] border border-gray-900 rounded-xl px-4 py-3">
                {isAr ? 'هنبعتلك رابط لإعادة تعيين كلمة المرور.' : "We'll send a password reset link to your email."}
              </p>
            )}

            {/* Messages */}
            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-red-400 text-xs bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
                  {error}
                </motion.p>
              )}
              {success && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-emerald-400 text-xs bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3">
                  {success}
                </motion.p>
              )}
            </AnimatePresence>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-black font-black rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm uppercase tracking-widest">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> :
                mode === 'magic' ? <><Zap className="w-4 h-4" />{isAr ? 'أرسل الرابط' : 'Send Link'}</> :
                mode === 'reset' ? <>{isAr ? 'أرسل رابط الاسترداد' : 'Send Reset Link'}</> :
                mode === 'update' ? <>{isAr ? 'تحديث كلمة المرور' : 'Update Password'}</> :
                mode === 'login' ? <><Shield className="w-4 h-4" />{isAr ? 'دخول' : 'Sign In'}</> :
                <><Sparkles className="w-4 h-4" />{isAr ? 'إنشاء حساب' : 'Create Account'}</>
              }
            </button>
          </form>
        </div>

        <div className="mt-4 flex justify-center">
          <LanguageSwitcher />
        </div>
      </motion.div>
    </div>
  );
}
