'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Wifi, Menu, X,
  Zap, ChevronRight, LogOut, Bell, Radio, Shield
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord', exact: true },
  { href: '/dashboard/clients', icon: Users, label: 'Clients' },
  { href: '/dashboard/portals', icon: Wifi, label: 'Portails' },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('treetronix_session');
    if (stored) setSession(JSON.parse(stored));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('treetronix_session');
    router.push('/login');
  };

  const isActive = (item) => item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div className="animated-bg" />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40, display: 'none' }}
          className="mobile-overlay"
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 240,
        minHeight: '100vh',
        background: 'rgba(6, 9, 24, 0.8)',
        borderRight: '1px solid var(--border-color)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        flexShrink: 0,
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, padding: '0 8px' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
            flexShrink: 0,
          }}>
            <Radio size={20} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>Treetronix</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>Portal Manager</div>
          </div>
        </div>

        {/* Nav section label */}
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 8px', marginBottom: 8 }}>
          Navigation
        </div>

        {/* Nav items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div className={`sidebar-item ${active ? 'active' : ''}`}>
                  <Icon size={18} className="sidebar-icon" />
                  <span>{item.label}</span>
                  {active && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
                </div>
              </Link>
            );
          })}

          <div style={{ borderTop: '1px solid var(--border-color)', margin: '16px 0' }} />

          {/* AI Badge */}
          <div style={{
            padding: '12px 14px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.1))',
            border: '1px solid rgba(139,92,246,0.2)',
            marginBottom: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Zap size={14} style={{ color: '#a78bfa' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a78bfa' }}>Assistant IA</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Gemini AI activé dans l'éditeur de portail.
            </p>
          </div>

          {/* API status */}
          <a href="/api/portal/carrefour" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <div className="sidebar-item">
              <Wifi size={18} />
              <span>API GlobalNet</span>
              <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
            </div>
          </a>
        </nav>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            onClick={handleLogout}
            className="sidebar-item w-full text-left"
            style={{ color: '#f87171', cursor: 'pointer', background: 'transparent', border: 'none' }}
          >
            <LogOut size={16} />
            <span style={{ fontSize: '0.8rem' }}>Déconnexion</span>
          </button>
          <div style={{ padding: '4px 8px 0', fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Treetronix v1.0.0 • Stage 2026
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <header style={{
          height: 64,
          background: 'rgba(6, 9, 24, 0.7)',
          borderBottom: '1px solid var(--border-color)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 28px',
          gap: 16,
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 1 }}>
              {NAV_ITEMS.find(i => isActive(i))?.label || 'Dashboard'}
            </div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              {pathname === '/dashboard' && 'Vue d\'ensemble'}
              {pathname === '/dashboard/clients' && 'Gestion des clients'}
              {pathname.startsWith('/dashboard/portals') && 'Éditeur de portail'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn-secondary" style={{ padding: '6px 10px', borderRadius: 8 }}>
              <Bell size={16} />
            </button>
            {/* Admin Avatar + Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.8rem',
                boxShadow: '0 0 12px rgba(139, 92, 246, 0.4)',
              }}>
                <Shield size={16} color="white" />
              </div>
              <div style={{ lineHeight: 1.3 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {session?.user || 'Admin'}
                </div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Administrateur</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '28px', overflowX: 'hidden' }} className="fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
