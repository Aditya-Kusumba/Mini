import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Trophy, Briefcase, Globe, Code2, Users } from 'lucide-react';
import './Home.css';

const FEATURES = [
  {
    icon: BarChart3,
    color: '#1e3a5f',
    iconColor: '#3b82f6',
    title: 'Track real progress',
    desc: 'Daily questions, topic coverage, and domain performance tracked continuously.',
  },
  {
    icon: Trophy,
    color: '#1a2e1a',
    iconColor: '#4ade80',
    title: 'Earn your tier',
    desc: 'Compete from Beginner to Elite based on real skill — not just exam scores.',
  },
  {
    icon: Briefcase,
    color: '#2d1f3d',
    iconColor: '#a78bfa',
    title: 'Get discovered',
    desc: 'Recruiters find you by domain expertise and placement readiness score.',
  },
  {
    icon: Globe,
    color: '#1e2d1e',
    iconColor: '#34d399',
    title: 'Choose your domains',
    desc: 'Frontend, Backend, AIML, DSA — pick what matters to your career.',
  },
  {
    icon: Code2,
    color: '#2a1e1e',
    iconColor: '#f87171',
    title: 'Solve real problems',
    desc: 'Multi-language coding interface with automated test case validation.',
  },
  {
    icon: Users,
    color: '#1e2535',
    iconColor: '#60a5fa',
    title: 'College analytics',
    desc: 'T&P teams track batch-wise readiness and compute placement scores.',
  },
];

const STATS = [
  { value: '4',    label: 'Domains' },
  { value: '70+',  label: 'Languages supported' },
  { value: '3',    label: 'User roles' },
  { value: '100%', label: 'Free to use' },
];

export default function Home() {
  return (
    <div className="home-root">
      {/* Navbar */}
      <nav className="home-nav">
        <Link to="/" className="home-nav-logo">
          <div className="home-nav-mark">
            <svg viewBox="0 0 18 18" fill="none" width="14" height="14">
              <path d="M2 14L9 4l7 10H2z" fill="white" opacity=".9"/>
              <circle cx="9" cy="12" r="2.5" fill="white"/>
            </svg>
          </div>
          <span className="home-nav-name">Commit2Code</span>
        </Link>
        <div className="home-nav-spacer" />
        <div className="home-nav-actions">
          <Link to="/login"    className="home-btn-ghost">Sign in</Link>
          <Link to="/register" className="home-btn-solid">Get started free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="home-hero">
        <div className="home-grid-bg" />
        <div className="home-glow" />

        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Continuous evaluation platform
        </div>

        <h1 className="hero-heading">
          Your skills,<br />your <span className="hero-accent">tier</span>.
        </h1>

        <p className="hero-sub">
          A fair, continuous framework that tracks real learning progress —<br />
          not just exam scores. Built for students, colleges, and recruiters.
        </p>

        <div className="hero-actions">
          <Link to="/register" className="home-btn-solid hero-cta">
            Get started free <ArrowRight size={15} />
          </Link>
          <Link to="/login" className="home-btn-outline">
            Sign in
          </Link>
        </div>

        {/* Stats row */}
        <div className="hero-stats">
          {STATS.map(s => (
            <div key={s.label} className="hero-stat">
              <span className="hero-stat-val">{s.value}</span>
              <span className="hero-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="home-features">
        <div className="home-section-label">What you get</div>
        <h2 className="home-section-heading">Everything you need to grow</h2>
        <div className="features-grid">
          {FEATURES.map(({ icon: Icon, color, iconColor, title, desc }) => (
            <div key={title} className="feat-card">
              <div className="feat-icon" style={{ background: color }}>
                <Icon size={18} color={iconColor} />
              </div>
              <h3 className="feat-title">{title}</h3>
              <p className="feat-desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="home-cta-banner">
        <div className="home-grid-bg" style={{ opacity: .15 }} />
        <div className="cta-inner">
          <h2 className="cta-heading">Ready to level up?</h2>
          <p className="cta-sub">Join as a candidate, manage your college, or hire top talent.</p>
          <div className="cta-actions">
            <Link to="/register" className="home-btn-solid hero-cta">
              Create account <ArrowRight size={15} />
            </Link>
            <Link to="/login" className="home-btn-outline">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-nav-logo" style={{ textDecoration: 'none' }}>
          <div className="home-nav-mark">
            <svg viewBox="0 0 18 18" fill="none" width="14" height="14">
              <path d="M2 14L9 4l7 10H2z" fill="white" opacity=".9"/>
              <circle cx="9" cy="12" r="2.5" fill="white"/>
            </svg>
          </div>
          <span className="home-nav-name">Commit2Code</span>
        </div>
        <span className="footer-copy">© 2025 · Built for T&P teams and candidates</span>
        <div className="footer-links">
          <Link to="/register">Register</Link>
          <Link to="/login">Login</Link>
          <Link to="/recruiter/register">Recruiters</Link>
        </div>
      </footer>
    </div>
  );
}