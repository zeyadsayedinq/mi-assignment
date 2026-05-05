import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate, useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ExplosionProvider } from './contexts/ExplosionContext';
import { Sidebar } from './components/Sidebar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { IntroSequence } from './components/IntroSequence';
import { SEO } from './components/SEO';
import { Menu } from 'lucide-react';

// Lazy load pages for performance
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const TheHQ = lazy(() => import('./pages/TheHQ').then(m => ({ default: m.TheHQ })));
const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })));
const TheTerminal = lazy(() => import('./pages/TheTerminal').then(m => ({ default: m.TheTerminal })));
const TheVault = lazy(() => import('./pages/TheVault').then(m => ({ default: m.TheVault })));
const TheAcademy = lazy(() => import('./pages/TheAcademy').then(m => ({ default: m.TheAcademy })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const PricingPage = lazy(() => import('./pages/PricingPage').then(m => ({ default: m.PricingPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const SOPs = lazy(() => import('./pages/SOPs').then(m => ({ default: m.SOPs })));
const AssignmentTypeGuide = lazy(() => import('./pages/AssignmentTypeGuide').then(m => ({ default: m.AssignmentTypeGuide })));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage').then(m => ({ default: m.PaymentSuccessPage })));

// ── Ref code handler ─────────────────────────────────────────────────────────

function RefHandler() {
  const { refCode } = useParams<{ refCode: string }>();
  const navigate = useNavigate();
  React.useEffect(() => {
    if (refCode) {
      localStorage.setItem('mi_ref_code', refCode.toUpperCase());
    }
    navigate('/auth?next=/app', { replace: true });
  }, [refCode, navigate]);
  return <LoadingFallback />;
}

function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'sans-serif', padding: '20px', textAlign: 'center' }}>
      <div style={{ fontSize: 64, fontWeight: 900, color: '#22D3EE', lineHeight: 1 }}>404</div>
      <div style={{ fontSize: 20, fontWeight: 700, margin: '16px 0 8px' }}>Page not found</div>
      <div style={{ fontSize: 14, color: '#475569', marginBottom: 28 }}>الصفحة دي مش موجودة.</div>
      <button onClick={() => navigate('/')} style={{ background: '#22D3EE', color: '#000', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
        Go Home
      </button>
    </div>
  );
}

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function LoadingFallback() {
  return (
    <div className="h-screen w-screen bg-[#020617] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#22D3EE]/20 border-t-[#22D3EE] rounded-full animate-spin" />
    </div>
  );
}

function AppContent() {
  const { session, loading } = useAuth();
  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem('mi_intro_done'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  if (loading) return <LoadingFallback />;

  // Don't show intro for sub-pages if already seen or requested
  const isLanding = location.pathname === '/';

  const handleIntroComplete = () => {
    setShowIntro(false);
    sessionStorage.setItem('mi_intro_done', 'true');
  };

  return (
    <>
      <ScrollToTop />
      <SEO />
      
      <AnimatePresence>
        {showIntro && isLanding && (
          <IntroSequence onComplete={handleIntroComplete} />
        )}
      </AnimatePresence>

      <div className="bg-[#020617] min-h-screen text-white font-sans flex flex-col lg:flex-row overflow-hidden relative">
        {session && <Sidebar isMobileOpen={mobileMenuOpen} closeMobile={() => setMobileMenuOpen(false)} />}
        
        {session && (
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden fixed top-4 right-4 z-40 p-2 bg-[#22D3EE]/10 border border-[#22D3EE]/20 rounded-xl text-[#22D3EE]"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <main className="flex-1 min-h-screen relative overflow-y-auto">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={session ? <Navigate to="/app" replace /> : <AuthPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/sops" element={<SOPs />} />
              <Route path="/intelligence-bureau" element={<AssignmentTypeGuide />} />
              
              {/* Protected Routes */}
              <Route path="/app" element={session ? <TheHQ /> : <Navigate to="/auth" replace />} />
              <Route path="/terminal" element={session ? <ErrorBoundary><TheTerminal /></ErrorBoundary> : <Navigate to="/auth" replace />} />
              <Route path="/vault" element={session ? <TheVault /> : <Navigate to="/auth" replace />} />
              <Route path="/academy" element={session ? <TheAcademy /> : <Navigate to="/auth" replace />} />
              <Route path="/settings" element={session ? <SettingsPage /> : <Navigate to="/auth" replace />} />
              <Route path="/admin" element={session ? <AdminDashboard /> : <Navigate to="/auth" replace />} />
              
              {/* Referral link handler — captures code and redirects to auth */}
              <Route path="/ref/:refCode" element={<RefHandler />} />

              {/* Payment success — shown after Tap payment completes */}
              <Route path="/payment-success" element={<PaymentSuccessPage />} />

              {/* Fallback */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ExplosionProvider>
        <AppContent />
      </ExplosionProvider>
    </AuthProvider>
  );
}
