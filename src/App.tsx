import './lib/i18n';
import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TheTerminal } from './pages/TheTerminal';
import { TheHQ } from './pages/TheHQ';
import { TheVault } from './pages/TheVault';
import { TheAcademy } from './pages/TheAcademy';
import { AssignmentTypeGuide } from './pages/AssignmentTypeGuide';
import { SOPs } from './pages/SOPs';
import { AdminDashboard } from './pages/AdminDashboard';
import { SettingsPage } from './pages/SettingsPage';
import { PricingPage } from './pages/PricingPage';
import { AuthPage } from './pages/AuthPage';
import { LandingPage } from './pages/LandingPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { Sidebar } from './components/Sidebar';
import { UsageBanner } from './components/UsageBanner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ExplosionProvider } from './contexts/ExplosionContext';
import { IntroSequence } from './components/IntroSequence';
import { SEO } from './components/SEO';
import { OnboardingFlow } from './components/OnboardingFlow';
import { cn } from './lib/utils';

// PWA service worker
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () =>
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  );
}

// Welcome email disabled (no backend) - tracked locally
function maybeSendWelcome(userId: string, email: string, language: string) {
  const key = `mi_welcome_${userId}`;
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, '1');
}

// Loading spinner
function Spinner() {
  return (
    <div className="h-screen w-screen bg-[#020617] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#22D3EE]/20 border-t-[#22D3EE] rounded-full animate-spin" />
    </div>
  );
}

// Route guard
function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { session, user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/auth" replace />;
  if (adminOnly && user?.email !== 'zeyadsayedinq@gmail.com') return <Navigate to="/app" replace />;
  return <>{children}</>;
}

// Stores referral code from URL then redirects to auth
function RefHandler() {
  const { code } = useParams();
  React.useEffect(() => {
    if (code) localStorage.setItem('mi_ref_code', code.toUpperCase());
  }, [code]);
  return <Navigate to="/auth" replace />;
}

// Public pages — no sidebar, no auth required
function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      {/* Public app pages accessible without auth */}
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/intelligence-bureau" element={<AssignmentTypeGuide />} />
      <Route path="/sops" element={<SOPs />} />
      {/* Redirect everything else into the main app */}
      <Route path="/ref/:code" element={<RefHandler />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}

// App shell — sidebar + authenticated routes
function AppShell() {
  const { session, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (localStorage.getItem('mi_onboarded')) return false;
    if (!session) return false;
    // Only show for genuinely new accounts (created within last 2 minutes)
    const createdAt = session.user?.created_at;
    if (!createdAt) return false;
    const ageSeconds = (Date.now() - new Date(createdAt).getTime()) / 1000;
    return ageSeconds < 120; // new account = created less than 2 minutes ago
  });

  useEffect(() => {
    if (session && user?.email) {
      const lang = localStorage.getItem('mi_lang') || 'en';
      maybeSendWelcome(user.id, user.email, lang);
    }
  }, [session, user]);

  return (
    <div className="bg-[#020617] h-screen text-white font-sans selection:bg-[#22D3EE] selection:text-black flex flex-col lg:flex-row overflow-hidden relative">
      {showOnboarding && session && <OnboardingFlow onComplete={() => setShowOnboarding(false)} />}
      <SEO />

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 w-full z-50 bg-[#020617]/90 backdrop-blur border-b border-[#22D3EE]/20 h-16 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#22D3EE] to-[#A855F7] flex items-center justify-center">
            <span className="font-black text-black text-[10px]">Mi</span>
          </div>
          <span className="font-black text-white text-sm">Mi-Assignment</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-[#22D3EE] p-2"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      <Sidebar isMobileOpen={isSidebarOpen} closeMobile={() => setIsSidebarOpen(false)} />

      <main className="flex-1 overflow-y-auto relative w-full bg-[#050608] pt-16 lg:pt-0 min-w-0">
        <Routes>
          <Route path="/app" element={<TheHQ />} />
          <Route path="/terminal" element={<ProtectedRoute><TheTerminal /></ProtectedRoute>} />
          <Route path="/vault" element={<ProtectedRoute><TheVault /></ProtectedRoute>} />
          <Route path="/academy" element={<ProtectedRoute><TheAcademy /></ProtectedRoute>} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/intelligence-bureau" element={<AssignmentTypeGuide />} />
          <Route path="/sops" element={<SOPs />} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          {/* Fallback — send to HQ */}
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </main>

      <UsageBanner />
    </div>
  );
}

// Root — decides which shell to use based on path
function RootRouter() {
  const location = useLocation();

  // Show intro once on first /app visit
  const [showIntro, setShowIntro] = useState(() =>
    !localStorage.getItem('mi_intro_seen') && location.pathname === '/app'
  );
  useEffect(() => {
    if (!showIntro) localStorage.setItem('mi_intro_seen', '1');
  }, [showIntro]);

  if (showIntro) return <IntroSequence onComplete={() => setShowIntro(false)} />;

  // Public-only paths — no sidebar shell
  const PUBLIC_PATHS = ['/', '/auth', '/terms', '/privacy', '/pricing', '/intelligence-bureau', '/sops'];
  const isPublicPath = PUBLIC_PATHS.includes(location.pathname);

  if (isPublicPath) return <PublicRoutes />;

  // Everything else uses the app shell
  return <AppShell />;
}


function PaymentSuccessPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  React.useEffect(() => {
    // Clear subscription cache so next check fetches fresh data
    Object.keys(localStorage)
      .filter(k => k.startsWith('mi_sub_') || k === 'mi_plan')
      .forEach(k => localStorage.removeItem(k));
  }, []);
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center text-center p-6">
      <div className="max-w-md">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-4xl font-black text-white mb-3">
          {isAr ? 'أهلاً بك في Pro!' : 'Welcome to Pro!'}
        </h1>
        <p className="text-gray-400 mb-8 text-lg">
          {isAr ? 'اشتراكك فعّال. ابدأ مهمتك الأولى.' : 'Your subscription is now active. Check your email for a receipt.'}
        </p>
        <a href="/terminal"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-black font-black rounded-xl hover:opacity-90 transition-all">
          {isAr ? 'ابدأ الآن ←' : 'Launch Terminal →'}
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ExplosionProvider>
        <RootRouter />
      </ExplosionProvider>
    </AuthProvider>
  );
}
