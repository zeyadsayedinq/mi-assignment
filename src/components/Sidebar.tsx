import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Shield, Terminal, Database, GraduationCap, BookOpen, Settings, LogOut, X, Sparkles, CreditCard, Lock, PanelLeftClose, PanelLeftOpen, User } from 'lucide-react';
import { QuotaBadge } from './QuotaBadge';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { MILogo3D } from './MILogo3D';
import { GlitchText } from './GlitchText';
import { useExplosion } from '../contexts/ExplosionContext';

const NAV_ITEMS = [
  { path: '/app',                labelKey: 'nav.dashboard', icon: Shield,       exact: false },
  { path: '/terminal',           labelKey: 'nav.terminal',  icon: Terminal },
  { path: '/vault',              labelKey: 'nav.vault',     icon: Database },
  { path: '/academy',            labelKey: 'nav.academy',   icon: GraduationCap },
  { path: '/intelligence-bureau',labelKey: 'nav.intel',     icon: BookOpen },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  closeMobile?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ isMobileOpen, closeMobile, collapsed = false, onToggleCollapse }: SidebarProps) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { session, user, signOut } = useAuth();
  const ADMIN_EMAILS = ['zeyadsayedinq@gmail.com', 'ranafaraj30@gmail.com'];
  const isAdmin   = ADMIN_EMAILS.includes(user?.email || '');
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { explode } = useExplosion();

  const handleSignOut = async () => { await signOut(); navigate('/auth'); closeMobile?.(); };
  const handleNavClick = (e: React.MouseEvent, path: string) => { explode(e.clientX, e.clientY, '#22D3EE'); closeMobile?.(); };
  const isActive = (path: string, exact?: boolean) => exact ? location.pathname === path : location.pathname === path;

  return (
    <>
      {/* Mobile backdrop */}
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
        'fixed lg:relative z-50 h-screen bg-[#020617] border-r border-[#22D3EE]/10 flex flex-col transition-all duration-300 shrink-0 top-0 left-0',
        collapsed ? 'w-[60px]' : 'w-64',
        // mobile: hidden off-screen unless open; desktop: always visible
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        !session && 'hidden'
      )}>

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-[#22D3EE]/10 shrink-0">
          {!collapsed && (
            <Link
              to="/"
              onClick={e => handleNavClick(e, '/')}
              className="flex items-center gap-2.5 min-w-0 flex-1"
            >
              <MILogo3D size={32} autoSpin={false} />
              <div className="min-w-0">
                <GlitchText text="Mi-Assignment" className="font-black text-white text-sm tracking-tight block truncate" triggerOnHover speed={30} />
                <p className="text-[9px] text-gray-600 font-mono tracking-widest">v2.1 MI</p>
              </div>
            </Link>
          )}

          {collapsed && (
            <Link to="/" onClick={e => handleNavClick(e, '/')} className="flex items-center justify-center w-full">
              <MILogo3D size={28} autoSpin={false} />
            </Link>
          )}

          {/* Collapse toggle — desktop only */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex shrink-0 items-center justify-center w-7 h-7 rounded-lg text-gray-600 hover:text-[#22D3EE] hover:bg-[#22D3EE]/10 transition-all"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed
                ? <PanelLeftOpen  className="w-3.5 h-3.5" />
                : <PanelLeftClose className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Close — mobile only */}
          <button onClick={closeMobile} className="lg:hidden shrink-0 p-1 text-gray-600 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Nav ──────────────────────────────────────────────── */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ path, labelKey, icon: Icon, exact }) => {
            const active = isActive(path, exact);
            return (
              <Link
                key={path}
                to={path}
                title={collapsed ? t(labelKey) : undefined}
                onClick={e => handleNavClick(e, path)}
                className={cn(
                  'flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all text-sm relative overflow-hidden group',
                  collapsed && 'justify-center px-0',
                  active
                    ? 'bg-[#22D3EE]/10 border border-[#22D3EE]/20 text-[#22D3EE]'
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                )}
              >
                {active && (
                  <motion.div
                    layoutId="navShimmer"
                    className="absolute inset-0 bg-gradient-to-r from-[#22D3EE]/5 to-transparent rounded-xl"
                  />
                )}
                <Icon className="w-4 h-4 shrink-0 relative z-10" />
                {!collapsed && <span className="font-medium relative z-10 truncate">{t(labelKey)}</span>}
                {active && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#22D3EE] shrink-0 relative z-10" />}
              </Link>
            );
          })}

          {/* Admin */}
          {isAdmin && (
            <Link
              to="/admin"
              title={collapsed ? 'Admin' : undefined}
              onClick={e => handleNavClick(e, '/admin')}
              className={cn(
                'flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all text-sm relative overflow-hidden',
                collapsed && 'justify-center px-0',
                isActive('/admin')
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/5'
              )}
            >
              <Lock className="w-4 h-4 shrink-0 relative z-10" />
              {!collapsed && <span className="font-bold relative z-10 uppercase tracking-tighter truncate">{t('nav.admin')}</span>}
            </Link>
          )}

          {/* Quota badge — visible on every app page */}
          {!collapsed && (
            <div className="px-1 py-2">
              <QuotaBadge />
            </div>
          )}

          {/* Secondary nav */}
          <div className="pt-2 mt-1 border-t border-gray-900 space-y-0.5">
            {[
              { to: '/terminal', state: { openImageLab: true }, label: t('nav.imageLab'), icon: Sparkles,    hoverClass: 'hover:text-[#A855F7] hover:bg-[#A855F7]/5', color: '#A855F7' },
              { to: '/pricing',  state: undefined,               label: 'Pricing',         icon: CreditCard,  hoverClass: 'hover:text-[#A855F7] hover:bg-[#A855F7]/5', color: '#A855F7' },
              { to: '/account',  state: undefined,               label: isAr ? 'حسابي' : 'Account', icon: User,   hoverClass: 'hover:text-[#22D3EE] hover:bg-[#22D3EE]/5', color: '#22D3EE' },
              { to: '/settings', state: undefined,               label: t('nav.settings'), icon: Settings,    hoverClass: 'hover:text-white hover:bg-white/5',          color: '#22D3EE' },
            ].map(item => (
              <Link
                key={item.to + item.label}
                to={item.to}
                state={item.state}
                title={collapsed ? item.label : undefined}
                onClick={e => { explode(e.clientX, e.clientY, item.color); closeMobile?.(); }}
                className={cn(
                  'flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm text-gray-500 transition-all',
                  collapsed && 'justify-center px-0',
                  item.hoverClass
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            ))}
          </div>
        </nav>

        {/* ── Bottom area — hide most in collapsed mode ─────────── */}
        {!collapsed && (
          <>
            <div className="px-4 pb-2 flex gap-3 flex-wrap">
              {['Terms','Refund','Contact','Privacy','Help'].map(l => (
                <a key={l} href={`/${l.toLowerCase()}`} className="text-[10px] text-gray-700 hover:text-gray-400 transition-colors font-mono">{l}</a>
              ))}
            </div>
            <div className="px-4 pb-3">
              <p className="text-[9px] text-gray-600 leading-tight">
                Mi-Assignment is an educational aid. Please ensure usage complies with your institution's academic integrity policy.
              </p>
            </div>
          </>
        )}

        {/* Language switcher */}
        <div className={cn('border-t border-gray-900', collapsed ? 'px-1 py-3' : 'px-4 py-3')}>
          {collapsed ? (
            <div className="flex justify-center">
              <span className="text-[10px] text-gray-600 font-mono">EN</span>
            </div>
          ) : (
            <LanguageSwitcher />
          )}
        </div>

        {/* Auth */}
        <div className={cn('pb-4 space-y-2', collapsed ? 'px-1' : 'px-3')}>
          {session ? (
            <>
              {!collapsed && (
                <div className="px-3 py-2 bg-[#0A0B0E] border border-gray-800 rounded-xl">
                  <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Operative</p>
                  <p className="text-white text-xs font-medium truncate mt-0.5">{user?.email}</p>
                </div>
              )}
              <button
                onClick={handleSignOut}
                title={collapsed ? 'Sign out' : undefined}
                className={cn(
                  'w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all',
                  collapsed && 'justify-center px-0'
                )}
              >
                <LogOut className="w-4 h-4" />
                {!collapsed && <span>{t('nav.signOut')}</span>}
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              onClick={e => { explode(e.clientX, e.clientY, '#22D3EE'); closeMobile?.(); }}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#22D3EE]/10 border border-[#22D3EE]/20 text-[#22D3EE] rounded-xl text-sm font-bold hover:bg-[#22D3EE]/20 transition-all',
                collapsed && 'px-2'
              )}
            >
              <Shield className="w-4 h-4" />
              {!collapsed && t('nav.signIn')}
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
