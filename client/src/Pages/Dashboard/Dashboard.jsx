import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Target, Zap, BarChart3, ArrowRight, Code2, Trophy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import './Dashboard.css';

const EMOJI = { Frontend: '🌐', Backend: '⚙️', AIML: '🤖', DSA: '🧩' };

const hour = new Date().getHours();
const GREET = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

export default function Dashboard() {
  const { user } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/v1/candidate/dashboard')
      .then(r => setData(r.data?.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><span className="loading-spinner" /> Loading…</div>;

  const s       = data?.stats    || {};
  const domains = data?.domains  || [];

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1 className="page-title">{GREET}, {user?.fullName?.split(' ')[0] || user?.username} 👋</h1>
        <p className="page-sub">Here's your learning progress at a glance.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Domains enrolled',  value: s.domainsEnrolled  ?? 0,         icon: Globe,     color: '#2d4aff', bg: 'rgba(45,74,255,.1)' },
          { label: 'Topics started',    value: s.topicsStarted    ?? 0,         icon: Target,    color: '#16a34a', bg: '#dcfce7' },
          { label: 'Topics attempted',  value: s.topicsAttempted  ?? 0,         icon: Zap,       color: '#d97706', bg: '#fef3c7' },
          { label: 'Avg score',         value: `${s.avgScore      ?? '0.00'}%`, icon: BarChart3, color: '#7c3aed', bg: '#ede9fe' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div className="stat-icon" style={{ background: bg }}><Icon size={17} color={color} /></div>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>
          </div>
        ))}
      </div>

      {/* Enrolled domains */}
      <div style={{ marginBottom: 28 }}>
        <div className="section-header">
          <span className="section-title">Your domains</span>
          <Link to="/domain/selection" className="section-link">Manage →</Link>
        </div>

        {domains.length === 0 ? (
          <div className="card empty-state">
            <p style={{ marginBottom: 14 }}>You haven't enrolled in any domains yet.</p>
            <Link to="/domain/selection" className="btn btn-primary">Choose domains</Link>
          </div>
        ) : (
          <div className="domain-cards">
            {domains.map(d => (
              <div key={d.id} className="domain-card card">
                <div className="dc-head">
                  <span className="dc-emoji">{EMOJI[d.name] || '📚'}</span>
                  <span className="dc-name">{d.name}</span>
                  {d.tier && <span className="badge badge-blue">{d.tier}</span>}
                </div>
                <div className="dc-stats">
                  <div className="dc-stat">
                    <span className="stat-label">Score</span>
                    <strong>{d.score ?? 0}</strong>
                  </div>
                  {d.rank && (
                    <div className="dc-stat">
                      <span className="stat-label">Rank</span>
                      <strong>#{d.rank}</strong>
                    </div>
                  )}
                </div>
                <Link to={`/domain/${d.id}`} className="btn btn-secondary btn-sm btn-full">
                  Open dashboard <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links + recent activity */}
      <div className="two-col">
        <div className="card" style={{ padding: 20 }}>
          <div className="section-title" style={{ marginBottom: 14 }}>Quick actions</div>
          {[
            { label: 'Solve a problem',   to: '/problems',        icon: Code2 },
            { label: 'Update profile',    to: '/profile',         icon: Target },
          ].map(({ label, to, icon: Icon }) => (
            <Link key={to} to={to} className="qa-item">
              <Icon size={14} color="var(--accent)" />
              <span>{label}</span>
              <ArrowRight size={12} color="var(--text-3)" style={{ marginLeft: 'auto' }} />
            </Link>
          ))}
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div className="section-title" style={{ marginBottom: 14 }}>Recent activity</div>
          {(data?.recentActivity || []).length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <p>No recent activity yet.</p>
              <p style={{ marginTop: 6, fontSize: 12 }}>Start solving problems to see history here.</p>
            </div>
          ) : (
            (data?.recentActivity || []).slice(0, 6).map((a, i) => (
              <div key={i} className="act-item">
                <div className="act-dot" />
                <span className="act-text">{a.title || a.domain_name || 'Activity'}</span>
                {a.score && <span className="act-meta">{a.score}pts</span>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}