import { useState, useEffect } from 'react';
import { Plus, RefreshCw, X, Users, BarChart3, Trophy, Award } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import './AdminDashboard.css';

const TIER_BADGE = { Elite: 'badge-purple', Advanced: 'badge-blue', Intermediate: 'badge-green', Beginner: 'badge-amber' };

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab,       setTab]       = useState('students');
  const [overview,  setOverview]  = useState(null);
  const [students,  setStudents]  = useState([]);
  const [scores,    setScores]    = useState([]);
  const [tiers,     setTiers]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [bulk,      setBulk]      = useState(false);
  const [input,     setInput]     = useState('');
  const [modalMsg,  setModalMsg]  = useState('');
  const [computing, setComputing] = useState(false);
  const [toast,     setToast]     = useState('');

  useEffect(() => { loadAll(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [o, s, sc, t] = await Promise.all([
        api.get('/api/admin/analytics/overview'),
        api.get('/api/admin/students'),
        api.get('/api/admin/placement/scores'),
        api.get('/api/admin/placement/tiers'),
      ]);
      setOverview(o.data?.data);
      setStudents(s.data?.data  || []);
      setScores(sc.data?.data   || []);
      setTiers(t.data?.data     || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!input.trim()) return; setModalMsg('');
    try {
      if (bulk) {
        const usernames = input.split('\n').map(s => s.trim()).filter(Boolean);
        const r = await api.post('/api/admin/students/bulk', { usernames });
        const d = r.data?.data;
        setModalMsg(`Added ${d?.added?.length || 0}. Not found: ${d?.notFound?.length ? d.notFound.join(', ') : 'none'}`);
      } else {
        await api.post('/api/admin/students/add', { username: input.trim() });
        setModalMsg('Student added!');
      }
      setInput(''); loadAll();
    } catch (err) { setModalMsg(err.response?.data?.message || 'Failed'); }
  };

  const computeAll = async () => {
    setComputing(true);
    try {
      const r = await api.post('/api/admin/placement/compute/all');
      showToast(`Computed scores for ${r.data?.data?.length || 0} students`);
      loadAll();
    } catch { showToast('Computation failed'); }
    finally { setComputing(false); }
  };

  const closeModal = () => { setModal(false); setModalMsg(''); setInput(''); };

  if (loading) return <div className="page-loading"><span className="loading-spinner" /> Loading admin panel…</div>;

  return (
    <div className="fade-up">
      {toast && <div className="toast">{toast}</div>}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">College Dashboard</h1>
          <p className="page-sub">{user?.collegeName} · {overview?.totalStudents || 0} students</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal(true)}><Plus size={13} /> Add student</button>
          <button className="btn btn-primary btn-sm" onClick={computeAll} disabled={computing}>
            {computing ? <span className="loading-spinner" style={{ width: 12, height: 12 }} /> : <><RefreshCw size={13} /> Compute scores</>}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Total students',  value: overview?.totalStudents       ?? 0,         icon: Users,    color: '#2d4aff', bg: 'rgba(45,74,255,.1)' },
          { label: 'Avg placement',   value: `${overview?.avgPlacementScore ?? '0.00'}%`, icon: BarChart3, color: '#16a34a', bg: '#dcfce7' },
          { label: 'Problems solved', value: overview?.totalProblemsSolved  ?? 0,         icon: Trophy,   color: '#d97706', bg: '#fef3c7' },
          { label: 'Domains active',  value: overview?.domainPopularity?.length ?? 0,     icon: Award,    color: '#7c3aed', bg: '#ede9fe' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div className="stat-icon" style={{ background: bg }}><Icon size={17} color={color} /></div>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>
          </div>
        ))}
      </div>

      {/* Tier pills */}
      {overview?.tierBreakdown && (
        <div className="tier-row">
          {['Elite', 'Advanced', 'Intermediate', 'Beginner'].map(t => (
            <div key={t} className={`tier-card ${t.toLowerCase()}`}>
              <span className="tier-card-name">{t}</span>
              <span className="tier-card-count">{overview.tierBreakdown[t.toLowerCase()] ?? 0}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {['students', 'leaderboard', 'tiers', 'analytics'].map(t => (
          <button key={t} className={`tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Students ── */}
      {tab === 'students' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="data-table">
            <thead><tr><th>Student</th><th>Domains</th><th>Placement score</th><th>Tier</th><th>Added</th></tr></thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>
                  No students yet — click "Add student"
                </td></tr>
              ) : students.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{s.fullName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>@{s.username}</div>
                  </td>
                  <td>{s.domainsEnrolled}</td>
                  <td>{s.placementScore != null ? <strong style={{ color: 'var(--accent)' }}>{s.placementScore}%</strong> : '—'}</td>
                  <td>{s.tier ? <span className={`badge ${TIER_BADGE[s.tier]}`}>{s.tier}</span> : '—'}</td>
                  <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{new Date(s.addedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Leaderboard ── */}
      {tab === 'leaderboard' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="data-table">
            <thead><tr><th>#</th><th>Student</th><th>Score</th><th>Tier</th><th>Breakdown</th></tr></thead>
            <tbody>
              {scores.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>
                  No scores yet — click "Compute scores"
                </td></tr>
              ) : scores.map((s, i) => (
                <tr key={s.id}>
                  <td><span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: i < 3 ? 'var(--accent)' : 'var(--text-3)' }}>{i + 1}</span></td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{s.fullName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>@{s.username}</div>
                  </td>
                  <td><span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--accent)' }}>{s.score}%</span></td>
                  <td>{s.tier ? <span className={`badge ${TIER_BADGE[s.tier]}`}>{s.tier}</span> : '—'}</td>
                  <td>
                    {s.breakdown && (
                      <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.8 }}>
                        Domain: {s.breakdown.avgDomainScore}% · Problems: {s.breakdown.problemsSolved}% · Topics: {s.breakdown.topicsCovered}% · Daily: {s.breakdown.dailyCompletion}%
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tiers ── */}
      {tab === 'tiers' && (
        <div className="tiers-grid">
          {tiers.length === 0 ? (
            <div className="card empty-state" style={{ padding: 48 }}><p>No tier data. Compute scores first.</p></div>
          ) : tiers.map(tier => (
            <div key={tier.tier} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span className={`badge ${TIER_BADGE[tier.tier]}`} style={{ fontSize: 13, padding: '4px 12px' }}>{tier.tier}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800 }}>{tier.count}</span>
              </div>
              {(tier.students || []).slice(0, 6).map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-2)' }}>{s.fullName || s.username}</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{s.score}%</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── Analytics ── */}
      {tab === 'analytics' && (
        <div className="two-col">
          <div className="card" style={{ padding: 20 }}>
            <div className="section-title" style={{ marginBottom: 16 }}>Domain popularity</div>
            {(overview?.domainPopularity || []).length === 0 ? (
              <div className="empty-state"><p>No data yet.</p></div>
            ) : (overview?.domainPopularity || []).map(d => (
              <div key={d.name} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-2)' }}>{d.name}</span>
                  <span style={{ fontWeight: 600 }}>{d.students} students</span>
                </div>
                <div className="prog-bg">
                  <div className="prog-fill" style={{ width: `${Math.min(100, d.students / (overview.totalStudents || 1) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div className="section-title" style={{ marginBottom: 16 }}>Tier distribution</div>
            {overview?.tierBreakdown && ['Elite', 'Advanced', 'Intermediate', 'Beginner'].map(t => {
              const count = overview.tierBreakdown[t.toLowerCase()] || 0;
              const pct   = overview.totalStudents ? Math.round(count / overview.totalStudents * 100) : 0;
              return (
                <div key={t} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span className={`badge ${TIER_BADGE[t]}`}>{t}</span>
                    <span style={{ fontWeight: 600 }}>{count} ({pct}%)</span>
                  </div>
                  <div className="prog-bg"><div className="prog-fill" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add student modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add student{bulk ? 's' : ''}</h3>
              <button className="btn btn-ghost btn-sm" onClick={closeModal}><X size={15} /></button>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--text-2)', marginBottom: 14 }}>
              <input type="checkbox" checked={bulk} onChange={e => setBulk(e.target.checked)} />
              Bulk add (one username per line)
            </label>
            {bulk ? (
              <textarea className="input" rows={6} placeholder={"username1\nusername2\nusername3"}
                value={input} onChange={e => setInput(e.target.value)} style={{ resize: 'vertical' }} />
            ) : (
              <input className="input" placeholder="username" value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()} />
            )}
            {modalMsg && (
              <p style={{ fontSize: 13, marginTop: 10, color: modalMsg.includes('fail') || modalMsg.includes('Not') ? 'var(--amber)' : 'var(--green)' }}>
                {modalMsg}
              </p>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary" onClick={handleAdd}>Add</button>
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}