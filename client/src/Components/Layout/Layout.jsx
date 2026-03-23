import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Globe, Code2, Trophy, Clock,
  User, LogOut, Sun, Moon, Menu, X,
  Users, BarChart3, Award, ChevronDown,
} from 'lucide-react';
import { useAuth }  from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import './Layout.css';

const CANDIDATE_NAV = [
  { label: 'Dashboard',        to: '/dashboard',         icon: LayoutDashboard },
  { label: 'Domains',          to: '/domain/selection',  icon: Globe },
  { label: 'Problems',         to: '/problems',          icon: Code2 },
];

const ADMIN_NAV = [
  { label: 'Overview',  to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Students',  to: '/admin/students',  icon: Users },
  { label: 'Analytics', to: '/admin/analytics', icon: BarChart3 },
  { label: 'Placement', to: '/admin/placement', icon: Award },
];

const RECRUITER_NAV = [
  { label: 'Dashboard',   to: '/recruiter/dashboard',   icon: LayoutDashboard },
  { label: 'Candidates',  to: '/recruiter/candidates',  icon: Users },
];

export default function Layout() {
  const { user, logout }  = useAuth();
  const { theme, toggle } = useTheme();
  const navigate          = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const menuRef = useRef(null);

  const role     = user?.role;
  const isAdmin  = role === 'ADMIN';
  const isRec    = role === 'RECRUITER';
  const navItems = isAdmin ? ADMIN_NAV : isRec ? RECRUITER_NAV : CANDIDATE_NAV;
  const initials = (user?.fullName || user?.username || 'U').slice(0, 2).toUpperCase();

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const doLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleLabel = isAdmin ? 'Admin' : isRec ? 'Recruiter' : null;

  return (
    <>
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="navbar-brand">
          <button className="navbar-hamburger" onClick={() => setSidebarOpen(o => !o)}>
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <Link to={isAdmin ? '/admin/dashboard' : isRec ? '/recruiter/dashboard' : '/dashboard'} className="navbar-logo">
            <div className="navbar-logo-mark">
              <svg viewBox="0 0 14 14" fill="none">
                <path d="M1 11L7 3l6 8H1z" fill="white" opacity=".9"/>
                <circle cx="7" cy="9.5" r="1.8" fill="white"/>
              </svg>
            </div>
            <span className="navbar-logo-text">Commit2Code</span>
          </Link>
          {roleLabel && (
            <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: 4 }}>
              {roleLabel}
            </span>
          )}
        </div>

        <div className="navbar-right">
          <button className="theme-btn" onClick={toggle} title="Toggle theme">
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          <div className="user-chip" ref={menuRef} onClick={() => setMenuOpen(m => !m)}>
            <div className="user-avatar">{initials}</div>
            <span className="user-chip-name">{user?.username || 'User'}</span>
            <ChevronDown size={12} style={{ color: 'var(--text-3)', transition: 'transform var(--t)', transform: menuOpen ? 'rotate(180deg)' : 'none' }} />

            {menuOpen && (
              <div className="user-menu" onClick={e => e.stopPropagation()}>
                <div className="user-menu-header">
                  <div className="user-menu-name">{user?.fullName || user?.username}</div>
                  <div className="user-menu-email">{user?.email}</div>
                </div>
                <NavLink to={isAdmin ? '/admin/dashboard' : '/profile'} className="user-menu-item" onClick={() => setMenuOpen(false)}>
                  <User size={13} /> {isAdmin ? 'Admin panel' : 'Profile'}
                </NavLink>
                <div className="menu-sep" />
                <button className="user-menu-item danger" onClick={doLogout}>
                  <LogOut size={13} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ── Sidebar ── */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sb-section">
          <span className="sb-group-label">Navigation</span>
          {navItems.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sb-link${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={14} /> {label}
            </NavLink>
          ))}
        </div>

        <div className="sb-bottom">
          <button className="sb-link" style={{ color: 'var(--red)' }} onClick={doLogout}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Page ── */}
      <main className="main-content">
        <Outlet />
      </main>
    </>
  );
}