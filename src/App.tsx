import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, useParams, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ExplosionProvider } from './contexts/ExplosionContext';
import { Sidebar } from './components/Sidebar';
import { IntroSequence } from './components/IntroSequence';
import { SEO } from './components/SEO';
import { ErrorBoundary } from './components/ErrorBoundary';
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
const RefundPage = lazy(() => import('./pages/RefundPage').then(m => ({ default: m.RefundPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage').then(m => ({ default: m.PaymentSuccessPage })));
const SOPs = lazy(() => import('./pages/SOPs').then(m => ({ default: m.SOPs })));
const AssignmentTypeGuide = lazy(() => import('./pages/AssignmentTypeGuide').then(m => ({ default: m.AssignmentTypeGuide })));

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function LoadingFallback() {
  return (
    <div className="h-screen w-screen bg-[#020617] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#22D3EE] to-[#A855F7] flex items-center justify-center animate-pulse">
        <span className="font-black text-black text-lg">Mi</span>
      </div>
      <div className="w-32 h-1 bg-[#0A0B0E] rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#22D3EE] to-[#A855F7] rounded-full animate-[loading_1.2s_ease-in-out_infinite]" style={{width:'60%',animation:'slideRight 1.2s ease-in-out infinite'}} />
      </div>
    </div>
  );
}

// Captures /ref/:code → stores in localStorage → redirects to auth
function RefCodeHandler() {
  const { refCode } = useParams<{ refCode: string }>();
  React.useEffect(() => {
    if (refCode) localStorage.setItem('mi_ref_code', refCode.toUpperCase());
    window.location.href = '/auth?next=/app';
  }, []);
  return null;
}

function AppContent() {
  const { session, loading } = useAuth();
  const [showIntro, setShowIntro] = useState(() => !localStorage.getItem('mi_intro_done'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  if (loading) return <LoadingFallback />;

  // Don't show intro for sub-pages if already seen or requested
  const isLanding = location.pathname === '/';

  const handleIntroComplete = () => {
    setShowIntro(false);
    localStorage.setItem('mi_intro_done', 'true');
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
        {session && !['/', '/pricing', '/terms', '/privacy', '/refund', '/contact', '/auth', '/checkout'].includes(location.pathname) && (
          <Sidebar isMobileOpen={mobileMenuOpen} closeMobile={() => setMobileMenuOpen(false)} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(c => !c)} />
        )}
        
        {session && !['/', '/pricing', '/terms', '/privacy', '/refund', '/contact', '/auth', '/checkout'].includes(location.pathname) && (
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
              <Route path="/auth" element={session ? <Navigate to="/terminal" replace /> : <AuthPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/refund" element={<Suspense fallback={<LoadingFallback />}><RefundPage /></Suspense>} />
              <Route path="/contact" element={<Suspense fallback={<LoadingFallback />}><ContactPage /></Suspense>} />
              <Route path="/checkout" element={<Suspense fallback={<LoadingFallback />}><CheckoutPage /></Suspense>} />
              <Route path="/sops" element={<SOPs />} />
              <Route path="/intelligence-bureau" element={<AssignmentTypeGuide />} />
              
              {/* Protected Routes — wrapped in ErrorBoundary so crashes don't white-screen */}
              <Route path="/app" element={session ? <ErrorBoundary><TheHQ /></ErrorBoundary> : <Navigate to="/auth" replace />} />
              <Route path="/terminal" element={session ? <ErrorBoundary><TheTerminal /></ErrorBoundary> : <Navigate to="/auth" replace />} />
              <Route path="/vault" element={session ? <ErrorBoundary><TheVault /></ErrorBoundary> : <Navigate to="/auth" replace />} />
              <Route path="/academy" element={session ? <ErrorBoundary><TheAcademy /></ErrorBoundary> : <Navigate to="/auth" replace />} />
              <Route path="/settings" element={session ? <ErrorBoundary><SettingsPage /></ErrorBoundary> : <Navigate to="/auth" replace />} />
              <Route path="/admin" element={session ? <AdminDashboard /> : <Navigate to="/auth" replace />} />
              
              {/* Fallback */}
              <Route path="/ref/:refCode" element={<RefCodeHandler />} />
              <Route path="/payment-success" element={session ? <Suspense fallback={<LoadingFallback />}><PaymentSuccessPage /></Suspense> : <Navigate to="/auth" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
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
