import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Code2, ChevronRight } from 'lucide-react';
import api from '../../utils/api';

const DIFF = { Easy: 'badge-green', Medium: 'badge-amber', Hard: 'badge-red' };

export default function ProblemLobby() {
  const [problems, setProblems] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');

  useEffect(() => {
    api.get('/api/exam/problems')
      .then(r => setProblems(r.data?.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all'
    ? problems
    : problems.filter(p => p.difficulty.toLowerCase() === filter);

  const count = (d) => d === 'all'
    ? problems.length
    : problems.filter(p => p.difficulty.toLowerCase() === d).length;

  if (loading) return (
    <div className="page-loading">
      <span className="loading-spinner" /> Loading problems…
    </div>
  );

  return (
    <div className="fade-up" style={{ maxWidth: 740, margin: '0 auto' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Problems</h1>
          <p className="page-sub">Solve coding challenges and track your progress.</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="tabs">
        {['all','easy','medium','hard'].map(f => (
          <button key={f} className={`tab-btn${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)} ({count(f)})
          </button>
        ))}
      </div>

      {/* Problem list */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-3)', fontSize: 14 }}>No problems found.</p>
          <button className="btn btn-primary" style={{ marginTop: 14 }}
            onClick={() => api.post('/api/exam/seed').then(() => window.location.reload())}>
            Load sample problems
          </button>
        </div>
      ) : filtered.map((p, i) => (
        <Link key={p.id} to={`/problem/${p.id}`}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '13px 16px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', marginBottom: 8,
            textDecoration: 'none', color: 'inherit',
            transition: 'all var(--t)',
            animationDelay: `${i * 0.04}s`,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateX(2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'var(--bg-2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Code2 size={15} color="var(--text-3)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{p.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              {p.domainName || 'General'}
            </div>
          </div>
          <span className={`badge ${DIFF[p.difficulty]}`}>{p.difficulty}</span>
          <ChevronRight size={14} color="var(--text-3)" />
        </Link>
      ))}
    </div>
  );
}