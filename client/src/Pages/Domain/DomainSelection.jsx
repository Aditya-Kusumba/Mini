import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Layers, Brain, Code2, Check, ArrowRight, BookOpen } from 'lucide-react';
import api from '../../utils/api';
import './DomainSelection.css';

const META = {
  Frontend: { icon: Globe,    color: '#2d4aff', bg: 'rgba(45,74,255,.1)',  desc: 'HTML, CSS, JavaScript, React, UI/UX' },
  Backend:  { icon: Layers,   color: '#16a34a', bg: '#dcfce7',             desc: 'Node.js, REST APIs, Databases, Auth, DevOps' },
  AIML:     { icon: Brain,    color: '#7c3aed', bg: '#ede9fe',             desc: 'Python, ML, Deep Learning, NLP, Computer Vision' },
  DSA:      { icon: Code2,    color: '#d97706', bg: '#fef3c7',             desc: 'Arrays, Trees, Graphs, DP, Sorting Algorithms' },
};

export default function DomainSelection() {
  const navigate = useNavigate();
  const [all,      setAll]      = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [busy,     setBusy]     = useState(null);
  const [toast,    setToast]    = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/api/v1/candidate/domains/all'),
      api.get('/api/v1/candidate/domains'),
    ]).then(([a, m]) => {
      setAll(a.data?.data || []);
      setEnrolled((m.data?.data || []).map(d => d.id));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2800); };

  const handleClick = async (domain) => {
    if (enrolled.includes(domain.id)) { navigate(`/domain/${domain.id}`); return; }
    setBusy(domain.id);
    try {
      await api.post('/api/v1/candidate/domains/enroll', { domainId: domain.id });
      setEnrolled(e => [...e, domain.id]);
      showToast(`Enrolled in ${domain.name}!`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Enrollment failed');
    } finally { setBusy(null); }
  };

  if (loading) return <div className="page-loading"><span className="loading-spinner" /> Loading domains…</div>;

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1 className="page-title">Choose your domains</h1>
        <p className="page-sub">Enroll in domains to start tracking your progress and earning your placement tier.</p>
      </div>

      {toast && <div className="toast">{toast}</div>}

      <div className="ds-grid">
        {all.map(domain => {
          const m    = META[domain.name] || { icon: BookOpen, color: 'var(--accent)', bg: 'rgba(var(--accent-rgb),.1)', desc: '' };
          const Icon = m.icon;
          const isIn = enrolled.includes(domain.id);
          const busy2 = busy === domain.id;

          return (
            <div key={domain.id} className={`ds-card card${isIn ? ' in' : ''}`}>
              {isIn && <div className="ds-enrolled"><Check size={10} /> Enrolled</div>}

              <div className="ds-icon" style={{ background: m.bg }}>
                <Icon size={30} color={m.color} />
              </div>

              <h3 className="ds-name">{domain.name}</h3>
              <p className="ds-desc">{m.desc || domain.description}</p>

              {domain.total_topics > 0 && (
                <p className="ds-meta"><BookOpen size={11} /> {domain.total_topics} topics</p>
              )}

              <button
                className={`btn btn-full${isIn ? ' btn-secondary' : ' btn-primary'}`}
                onClick={() => handleClick(domain)}
                disabled={busy2}
              >
                {busy2
                  ? <span className="loading-spinner" style={{ width: 14, height: 14 }} />
                  : isIn
                    ? <><ArrowRight size={13} /> Open dashboard</>
                    : 'Enroll now'
                }
              </button>
            </div>
          );
        })}
      </div>

      {enrolled.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 36 }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')}>
            Go to dashboard <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}