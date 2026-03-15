import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, Zap, ExternalLink } from 'lucide-react';
import api from '../../utils/api';
import './DomainDashboard.css';

const DIFF   = { Easy: 'badge-green', Medium: 'badge-amber', Hard: 'badge-red' };
const STATUS = { Solved: 'badge-green', Attempted: 'badge-amber', Skipped: 'badge-red' };

function ProblemList({ problems, busy, onSubmit, showBtn }) {
  return (
    <div className="prob-list">
      {problems.map((p, i) => (
        <div key={i} className="prob-row">
          <span className="prob-name">{p.title}</span>
          {p.topicName && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{p.topicName}</span>}
          <span className={`badge ${DIFF[p.difficulty] || 'badge-blue'}`}>{p.difficulty}</span>
          {(p.status || p.submissionStatus) && (
            <span className={`badge ${STATUS[p.status || p.submissionStatus] || 'badge-blue'}`}>
              {p.status || p.submissionStatus}
            </span>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {showBtn && (p.status || p.submissionStatus) !== 'Solved' && (
              <button className="btn btn-primary btn-sm" onClick={() => onSubmit(p.id, 'Solved')} disabled={busy === p.id}>
                {busy === p.id ? <span className="loading-spinner" style={{ width: 12, height: 12 }} /> : 'Solved'}
              </button>
            )}
            {p.solutionUrl && (
              <a href={p.solutionUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DomainDashboard() {
  const { domainId } = useParams();
  const [data,       setData]       = useState(null);
  const [daily,      setDaily]      = useState(null);
  const [strengthen, setStrengthen] = useState(null);
  const [problems,   setProblems]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState('overview');
  const [busy,       setBusy]       = useState(null);
  const [toast,      setToast]      = useState('');

  useEffect(() => {
    const b = `/api/v1/candidate/domain/${domainId}`;
    Promise.all([
      api.get(`${b}/dashboard`),
      api.get(`${b}/daily`),
      api.get(`${b}/strengthen`),
      api.get(`${b}/problems`),
    ]).then(([d, dq, st, pr]) => {
      setData(d.data?.data);
      setDaily(dq.data?.data);
      setStrengthen(st.data?.data);
      setProblems(pr.data?.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [domainId]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const submit = async (problemId, status) => {
    setBusy(problemId);
    try {
      await api.post(`/api/v1/candidate/problems/${problemId}/submit`, { status });
      setProblems(p => p.map(x => x.id === problemId ? { ...x, submissionStatus: status } : x));
      if (daily?.problemId === problemId && status === 'Solved') {
        await api.post(`/api/v1/candidate/domain/${domainId}/daily/complete`);
        setDaily(d => ({ ...d, isCompleted: true }));
      }
      showToast(`Marked as ${status}`);
    } catch { showToast('Failed to submit'); }
    finally { setBusy(null); }
  };

  if (loading) return <div className="page-loading"><span className="loading-spinner" /> Loading domain…</div>;
  if (!data)   return (
    <div className="page-loading">
      Not enrolled in this domain. <Link to="/domain/selection" style={{ color: 'var(--accent)' }}>Go back</Link>
    </div>
  );

  const { domain, performance, topics, problemHistory, stats } = data;
  const covered = topics.filter(t => t.covered).length;
  const pct     = topics.length ? Math.round(covered / topics.length * 100) : 0;

  return (
    <div className="fade-up">
      {toast && <div className="toast">{toast}</div>}

      {/* Header */}
      <Link to="/domain/selection" className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}>
        <ArrowLeft size={13} /> All domains
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <h1 className="page-title">{domain.name}</h1>
        <span className="badge badge-blue">Enrolled {new Date(domain.enrolledAt).toLocaleDateString()}</span>
      </div>
      <p className="page-sub" style={{ marginBottom: 24 }}>{domain.description}</p>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 16 }}>
        {[
          { label: 'Avg score',       value: `${performance.avgScore}%` },
          { label: 'Topics covered',  value: `${covered} / ${performance.topicsTotal}` },
          { label: 'Solved',          value: stats.solved },
          { label: 'Attempted',       value: stats.attempted },
        ].map(({ label, value }) => (
          <div key={label} className="stat-card">
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={{ fontSize: 22 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Topic coverage</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{pct}%</span>
        </div>
        <div className="prog-bg"><div className="prog-fill" style={{ width: `${pct}%` }} /></div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {['overview', 'problems', 'strengthen'].map(t => (
          <button key={t} className={`tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && (
        <div className="dd-overview">
          {/* Daily question */}
          {daily && (
            <div className="card dd-daily">
              <div className="dd-daily-top">
                <Clock size={15} color="var(--amber)" />
                <span className="dd-daily-label">Daily question</span>
                {daily.isCompleted && <span className="badge badge-green"><CheckCircle size={10} /> Done</span>}
              </div>
              {daily.message ? (
                <p style={{ fontSize: 13, color: 'var(--text-3)' }}>{daily.message}</p>
              ) : (
                <>
                  <p className="dd-pname">{daily.title}</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className={`badge ${DIFF[daily.difficulty]}`}>{daily.difficulty}</span>
                    {daily.topicName && <span className="badge badge-blue">{daily.topicName}</span>}
                  </div>
                  {!daily.isCompleted && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button className="btn btn-primary btn-sm" onClick={() => submit(daily.problemId, 'Solved')} disabled={busy === daily.problemId}>
                        {busy === daily.problemId
                          ? <span className="loading-spinner" style={{ width: 12, height: 12 }} />
                          : <><CheckCircle size={12} /> Mark solved</>}
                      </button>
                      {daily.solutionUrl && (
                        <a href={daily.solutionUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                          <ExternalLink size={12} /> Solution
                        </a>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Topics */}
          <div className="card" style={{ padding: 20 }}>
            <div className="section-title" style={{ marginBottom: 14 }}>Topics</div>
            <div className="topics-list">
              {topics.map((t, i) => (
                <div key={i} className="topic-row">
                  <div className={`topic-dot${t.covered ? ' done' : ''}`} />
                  <span className="topic-name">{t.name}</span>
                  {t.covered && t.score != null && <span className="topic-score">{t.score}pts</span>}
                </div>
              ))}
            </div>
          </div>

          {/* History */}
          <div className="card" style={{ padding: 20, gridColumn: '1 / -1' }}>
            <div className="section-title" style={{ marginBottom: 14 }}>Problem history</div>
            {problemHistory.length === 0
              ? <div className="empty-state"><p>No problems attempted yet.</p></div>
              : <ProblemList problems={problemHistory.slice(0, 10)} busy={busy} onSubmit={submit} showBtn={false} />}
          </div>
        </div>
      )}

      {/* ── Problems ── */}
      {tab === 'problems' && (
        <div className="card" style={{ padding: 20 }}>
          <div className="section-title" style={{ marginBottom: 14 }}>All problems — {domain.name}</div>
          {problems.length === 0
            ? <div className="empty-state"><p>No problems available yet.</p></div>
            : <ProblemList problems={problems} busy={busy} onSubmit={submit} showBtn />}
        </div>
      )}

      {/* ── Strengthen ── */}
      {tab === 'strengthen' && (
        <div className="card" style={{ padding: 24 }}>
          {!strengthen ? (
            <div className="empty-state"><p>No strengthen data available.</p></div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Zap size={20} color="var(--amber)" />
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>
                    Strengthen: {strengthen.topic.name}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
                    Score: {strengthen.topic.score ?? 'Not attempted'} — Weakest topic
                  </div>
                </div>
              </div>
              {strengthen.problems.length === 0
                ? <p style={{ fontSize: 14, color: 'var(--text-3)' }}>All problems in this topic are solved! 🎉</p>
                : <ProblemList problems={strengthen.problems} busy={busy} onSubmit={submit} showBtn />}
            </>
          )}
        </div>
      )}
    </div>
  );
}