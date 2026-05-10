import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Shield, Terminal, Database, GraduationCap, BookOpen, Settings, LogOut, X, Sparkles, CreditCard, Lock } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { MILogo3D } from './MILogo3D';
import { GlitchText } from './GlitchText';
import { useExplosion } from '../contexts/ExplosionContext';

const NAV_ITEMS = [
  { path: '/app', labelKey: 'nav.dashboard', icon: Shield, exact: false },
  { path: '/terminal', labelKey: 'nav.terminal', icon: Terminal },
  { path: '/vault', labelKey: 'nav.vault', icon: Database },
  { path: '/academy', labelKey: 'nav.academy', icon: GraduationCap },
  { path: '/intelligence-bureau', labelKey: 'nav.intel', icon: BookOpen },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  closeMobile?: () => void;
}

export function Sidebar({ isMobileOpen, closeMobile }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, user, signOut } = useAuth();
  const isAdmin = user?.email === 'zeyadsayedinq@gmail.com';
  const { t } = useTranslation();
  const { explode } = useExplosion();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
    closeMobile?.();
  };

  const handleNavClick = (e: React.MouseEvent, path: string) => {
    explode(e.clientX, e.clientY, '#22D3EE');
    closeMobile?.();
  };

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname === path;

  return (
    <>
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        'fixed lg:relative z-50 h-screen w-64 bg-[#020617] border-r border-[#22D3EE]/10 flex flex-col transition-transform duration-300 shrink-0 top-0',
        session ? (isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0') : 'hidden'
      )} style={{ left: 0 }}>
        {/* Logo — spinning 3D cube */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#22D3EE]/10">
          <Link to="/" onClick={e => handleNavClick(e, '/')} className="flex items-center gap-3 ml-2 mt-1.5">
            <MILogo3D size={36} autoSpin={false} />
            <div>
              <GlitchText text="Mi-Assignment" className="font-black text-white text-sm tracking-tight block" triggerOnHover speed={30} />
              <p className="text-[9px] text-gray-600 font-mono tracking-widest -mt-0.5">v2.1 MI</p>
            </div>
          </Link>
          <button onClick={closeMobile} className="lg:hidden p-1 text-gray-600 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ path, labelKey, icon: Icon, exact }) => {
            const active = isActive(path, exact);
            return (
              <Link
                key={path}
                to={path}
                onClick={e => handleNavClick(e, path)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm relative overflow-hidden group',
                  active ? 'bg-[#22D3EE]/10 border border-[#22D3EE]/20 text-[#22D3EE]' : 'text-gray-500 hover:text-white hover:bg-white/5'
                )}
              >
                {/* Active shimmer */}
                {active && (
                  <motion.div
                    layoutId="navShimmer"
                    className="absolute inset-0 bg-gradient-to-r from-[#22D3EE]/5 to-transparent rounded-xl"
                  />
                )}
                <Icon className="w-4 h-4 shrink-0 relative z-10" />
                <span className="font-medium relative z-10 truncate">{t(labelKey)}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#22D3EE] shrink-0 relative z-10" />}
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              to="/admin"
              onClick={e => handleNavClick(e, '/admin')}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-[11px] lg:text-sm relative overflow-hidden group',
                isActive('/admin') ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/5'
              )}
            >
              <Lock className="w-4 h-4 shrink-0 relative z-10" />
              <span className="font-bold relative z-10 uppercase tracking-tighter truncate">{t('nav.admin')}</span>
            </Link>
          )}

          <div className="pt-2 mt-2 border-t border-gray-900 space-y-1">
            {[
              { to: '/terminal', state: { openImageLab: true }, label: t('nav.imageLab'), icon: Sparkles, hoverClass: 'hover:text-[#A855F7] hover:bg-[#A855F7]/5', explodeColor: '#A855F7' },
              { to: '/pricing', state: undefined, label: 'Pricing', icon: CreditCard, hoverClass: 'hover:text-[#A855F7] hover:bg-[#A855F7]/5', explodeColor: '#A855F7' },
              { to: '/settings', state: undefined, label: t('nav.settings'), icon: Settings, hoverClass: 'hover:text-white hover:bg-white/5', explodeColor: '#22D3EE' },
            ].map(item => (
              <Link
                key={item.to + item.label}
                to={item.to}
                state={item.state}
                onClick={e => { explode(e.clientX, e.clientY, item.explodeColor); closeMobile?.(); }}
                className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 transition-all', item.hoverClass)}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Legal links */}
        <div className="px-4 pb-2 flex gap-3 flex-wrap">
          <a href="/terms" className="text-[10px] text-gray-700 hover:text-gray-400 transition-colors font-mono">
            Terms
          </a>
          <a href="/refund" className="text-[10px] text-gray-700 hover:text-gray-400 transition-colors font-mono">
            Refund
          </a>
          <a href="/contact" className="text-[10px] text-gray-700 hover:text-gray-400 transition-colors font-mono">
            Contact
          </a>
          <a href="/privacy" className="text-[10px] text-gray-700 hover:text-gray-400 transition-colors font-mono">
            Privacy
          </a>
          <a href="/sops" className="text-[10px] text-gray-700 hover:text-gray-400 transition-colors font-mono">
            Help
          </a>
        </div>

        {/* Disclaimer */}
        <div className="px-4 pb-3">
          <p className="text-[9px] text-gray-600 leading-tight">
            Mi-Assignment is an educational aid. Please ensure usage complies with your institution's academic integrity policy.
          </p>
        </div>

        {/* Language switcher */}
        <div className="px-4 py-3 border-t border-gray-900">
          <LanguageSwitcher />
        </div>

        {/* Auth */}
        <div className="px-3 pb-4 space-y-2">
          {session ? (
            <>
              <div className="px-3 py-2 bg-[#0A0B0E] border border-gray-800 rounded-xl">
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Operative</p>
                <p className="text-white text-xs font-medium truncate mt-0.5">{user?.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('nav.signOut')}</span>
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              onClick={e => { explode(e.clientX, e.clientY, '#22D3EE'); closeMobile?.(); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#22D3EE]/10 border border-[#22D3EE]/20 text-[#22D3EE] rounded-xl text-sm font-bold hover:bg-[#22D3EE]/20 transition-all"
            >
              <Shield className="w-4 h-4" /> {t('nav.signIn')}
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
