import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe, Layers, Brain, Code2, Upload, X, Plus,
  ChevronDown, CheckCircle, GraduationCap, Briefcase,
  FolderGit2, Wrench, FileText, ArrowRight, Check,
} from 'lucide-react';
import api from '../../utils/api';
import './ProfileSetup.css';

/* ── Domain meta ── */
const DOMAINS = [
  { name: 'Frontend', emoji: '🌐', icon: Globe,  color: '#2563eb', bg: 'rgba(37,99,235,.08)'  },
  { name: 'Backend',  emoji: '⚙️', icon: Layers, color: '#16a34a', bg: 'rgba(22,163,74,.08)'  },
  { name: 'AIML',     emoji: '🤖', icon: Brain,  color: '#7c3aed', bg: 'rgba(124,58,237,.08)' },
  { name: 'DSA',      emoji: '🧩', icon: Code2,  color: '#d97706', bg: 'rgba(217,119,6,.08)'  },
];

/* ── Collapsible Section ── */
function Section({ icon, iconBg, iconColor, title, count, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="ps-section">
      <div className="ps-section-header" onClick={() => setOpen(o => !o)}>
        <div className="ps-section-header-left">
          <div className="ps-section-icon" style={{ background: iconBg }}>
            {icon && <icon.type size={16} color={iconColor} {...icon.props} />}
          </div>
          <div>
            <div className="ps-section-title">{title}</div>
            {count !== undefined && (
              <div className="ps-section-count">{count === 0 ? 'Not added yet' : `${count} added`}</div>
            )}
          </div>
        </div>
        <ChevronDown size={15} className={`ps-section-chevron${open ? ' open' : ''}`} />
      </div>
      <div className={`ps-section-body${open ? '' : ' collapsed'}`}>{children}</div>
    </div>
  );
}

export default function ProfileSetup() {
  const navigate  = useNavigate();
  const fileRef   = useRef(null);

  /* ── State ── */
  const [selectedDomainIds, setSelectedDomainIds] = useState([]);
  const [cvFile,   setCvFile]   = useState(null);
  const [skills,   setSkills]   = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [projects, setProjects] = useState([]);
  const [education,setEducation]= useState([]);
  const [experience,setExp]     = useState([]);

  /* Add-form states */
  const [projForm, setProjForm] = useState({ title: '', desc: '' });
  const [eduForm,  setEduForm]  = useState({ degree: '', institution: '', year: '' });
  const [expForm,  setExpForm]  = useState({ role: '', company: '', duration: '' });

  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);

  /* ── Domains ── */
  const toggleDomain = (name) =>
    setSelectedDomainIds(d => d.includes(name) ? d.filter(x => x !== name) : [...d, name]);

  /* ── Skills ── */
  const addSkill = () => {
    const s = skillInput.trim();
    if (!s || skills.includes(s)) return;
    setSkills(sk => [...sk, s]); setSkillInput('');
  };
  const onSkillKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(); }
    if (e.key === 'Backspace' && !skillInput && skills.length)
      setSkills(sk => sk.slice(0, -1));
  };

  /* ── Projects ── */
  const addProject = () => {
    if (!projForm.title.trim()) return;
    setProjects(p => [...p, { ...projForm, id: Date.now() }]);
    setProjForm({ title: '', desc: '' });
  };

  /* ── Education ── */
  const addEducation = () => {
    if (!eduForm.degree.trim()) return;
    setEducation(e => [...e, { ...eduForm, id: Date.now() }]);
    setEduForm({ degree: '', institution: '', year: '' });
  };

  /* ── Experience ── */
  const addExp = () => {
    if (!expForm.role.trim()) return;
    setExp(e => [...e, { ...expForm, id: Date.now() }]);
    setExpForm({ role: '', company: '', duration: '' });
  };

  /* ── CV file ── */
  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setError('CV must be under 5MB'); return; }
    setCvFile(f); setError('');
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      // First: fetch domain IDs from backend for selected names
      let domainIds = [];
      try {
        const domainsRes = await api.get('/api/v1/candidate/domains/all');
        const allDomains = domainsRes.data?.data || [];
        domainIds = allDomains
          .filter(d => selectedDomainIds.includes(d.name))
          .map(d => d.id);
      } catch { /* non-fatal */ }

      // Build payload matching backend updateCandidateProfile format
      const payload = {
        data: JSON.stringify({
          domains:    domainIds,
          education:  education.map(({ id, ...rest }) => rest),
          experience: experience.map(({ id, ...rest }) => rest),
          projects:   projects.map(({ id, ...rest }) => rest),
          skills:     skills,
        }),
      };

      // If CV file, use FormData
      if (cvFile) {
        const fd = new FormData();
        fd.append('data', payload.data);
        fd.append('resume', cvFile);
        await api.put('/api/users/update-profile', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.put('/api/users/update-profile', payload);
      }

      // Enroll in selected domains
      for (const domainId of domainIds) {
        try { await api.post('/api/v1/candidate/domains/enroll', { domainId }); }
        catch { /* already enrolled is fine */ }
      }

      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile. Please try again.');
    } finally { setLoading(false); }
  };

  /* ── Progress tracking ── */
  const steps = [
    { label: 'Domains',    done: selectedDomainIds.length > 0 },
    { label: 'CV',         done: !!cvFile },
    { label: 'Skills',     done: skills.length > 0 },
    { label: 'Education',  done: education.length > 0 },
  ];
  const completedCount = steps.filter(s => s.done).length;

  if (success) {
    return (
      <div className="profile-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="ps-success">
          <div className="ps-success-icon"><CheckCircle size={28} /></div>
          <h2 className="ps-success-title">Profile saved!</h2>
          <p className="ps-success-sub">Taking you to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Set up your profile</h1>
          <p className="page-sub">Help recruiters and the platform understand your background.</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>
          Skip for now
        </button>
      </div>

      {/* Stepper */}
      <div className="ps-stepper">
        {steps.map((s, i) => (
          <div key={s.label} className={`ps-step${s.done ? ' done' : i === steps.findIndex(x => !x.done) ? ' active' : ''}`}>
            <div className="ps-step-dot">
              {s.done ? <Check size={12} /> : i + 1}
            </div>
            <span className="ps-step-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── 1. Domains ── */}
      <Section
        icon={<Globe />} iconBg="rgba(37,99,235,.08)" iconColor="#2563eb"
        title="Select domains" count={selectedDomainIds.length} defaultOpen
      >
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 14 }}>
          Choose the domains you want to learn and be evaluated in.
        </p>
        <div className="domain-grid">
          {DOMAINS.map(d => (
            <div
              key={d.name}
              className={`domain-chip${selectedDomainIds.includes(d.name) ? ' selected' : ''}`}
              onClick={() => toggleDomain(d.name)}
            >
              <span className="domain-chip-icon">{d.emoji}</span>
              <span className="domain-chip-name">{d.name}</span>
              {selectedDomainIds.includes(d.name) && (
                <Check size={12} color="var(--accent)" />
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* ── 2. CV ── */}
      <Section
        icon={<FileText />} iconBg="rgba(217,119,6,.08)" iconColor="#d97706"
        title="Upload CV / Resume" count={cvFile ? 1 : 0}
      >
        <div className="cv-dropzone" onClick={() => fileRef.current?.click()}>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFile} />
          <div className="cv-dropzone-icon"><Upload size={22} /></div>
          <div className="cv-dropzone-text">Click to upload your CV</div>
          <div className="cv-dropzone-sub">PDF, DOC, DOCX — max 5MB</div>
        </div>
        {cvFile && (
          <div className="cv-file-attached">
            <FileText size={14} />
            <span className="cv-file-name">{cvFile.name}</span>
            <button className="ps-item-remove" onClick={() => setCvFile(null)}><X size={13} /></button>
          </div>
        )}
      </Section>

      {/* ── 3. Skills ── */}
      <Section
        icon={<Wrench />} iconBg="rgba(124,58,237,.08)" iconColor="#7c3aed"
        title="Skills" count={skills.length}
      >
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 10 }}>
          Add your technical and soft skills.
        </p>
        <div className="tag-input-wrap" onClick={() => document.getElementById('skill-inp')?.focus()}>
          {skills.map(s => (
            <span key={s} className="skill-tag">
              {s}
              <button className="skill-tag-remove" onClick={() => setSkills(sk => sk.filter(x => x !== s))}>×</button>
            </span>
          ))}
          <input
            id="skill-inp"
            className="tag-input"
            placeholder={skills.length === 0 ? 'e.g. React, Node.js, Python…' : 'Add more…'}
            value={skillInput}
            onChange={e => setSkillInput(e.target.value)}
            onKeyDown={onSkillKey}
            onBlur={addSkill}
          />
        </div>
        <p className="tag-hint">Press Enter or comma to add each skill</p>
      </Section>

      {/* ── 4. Projects ── */}
      <Section
        icon={<FolderGit2 />} iconBg="rgba(22,163,74,.08)" iconColor="#16a34a"
        title="Projects" count={projects.length}
      >
        {projects.length > 0 && (
          <div className="ps-items-list">
            {projects.map(p => (
              <div key={p.id} className="ps-item">
                <div className="ps-item-body">
                  <div className="ps-item-title">{p.title}</div>
                  {p.desc && <div className="ps-item-sub">{p.desc}</div>}
                </div>
                <button className="ps-item-remove" onClick={() => setProjects(pr => pr.filter(x => x.id !== p.id))}>
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="ps-add-form two-col">
          <input className="input" placeholder="Project title" value={projForm.title}
            onChange={e => setProjForm(f => ({ ...f, title: e.target.value }))} />
          <input className="input" placeholder="Brief description (optional)" value={projForm.desc}
            onChange={e => setProjForm(f => ({ ...f, desc: e.target.value }))} />
          <div className="ps-add-actions" style={{ gridColumn: '1/-1' }}>
            <button className="btn btn-secondary btn-sm" onClick={addProject} disabled={!projForm.title.trim()}>
              <Plus size={13} /> Add project
            </button>
          </div>
        </div>
      </Section>

      {/* ── 5. Education ── */}
      <Section
        icon={<GraduationCap />} iconBg="rgba(37,99,235,.06)" iconColor="#2563eb"
        title="Education" count={education.length}
      >
        {education.length > 0 && (
          <div className="ps-items-list">
            {education.map(e => (
              <div key={e.id} className="ps-item">
                <div className="ps-item-body">
                  <div className="ps-item-title">{e.degree}</div>
                  <div className="ps-item-sub">{[e.institution, e.year].filter(Boolean).join(' · ')}</div>
                </div>
                <button className="ps-item-remove" onClick={() => setEducation(ed => ed.filter(x => x.id !== e.id))}>
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="ps-add-form two-col">
          <input className="input" placeholder="Degree / Course" value={eduForm.degree}
            onChange={e => setEduForm(f => ({ ...f, degree: e.target.value }))} />
          <input className="input" placeholder="Institution" value={eduForm.institution}
            onChange={e => setEduForm(f => ({ ...f, institution: e.target.value }))} />
          <input className="input" placeholder="Year (e.g. 2024)" value={eduForm.year}
            onChange={e => setEduForm(f => ({ ...f, year: e.target.value }))}
            style={{ gridColumn: '1/-1' }} />
          <div className="ps-add-actions" style={{ gridColumn: '1/-1' }}>
            <button className="btn btn-secondary btn-sm" onClick={addEducation} disabled={!eduForm.degree.trim()}>
              <Plus size={13} /> Add education
            </button>
          </div>
        </div>
      </Section>

      {/* ── 6. Experience ── */}
      <Section
        icon={<Briefcase />} iconBg="rgba(217,119,6,.06)" iconColor="#d97706"
        title="Experience" count={experience.length}
      >
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12 }}>Optional — add internships or jobs.</p>
        {experience.length > 0 && (
          <div className="ps-items-list">
            {experience.map(e => (
              <div key={e.id} className="ps-item">
                <div className="ps-item-body">
                  <div className="ps-item-title">{e.role}</div>
                  <div className="ps-item-sub">{[e.company, e.duration].filter(Boolean).join(' · ')}</div>
                </div>
                <button className="ps-item-remove" onClick={() => setExp(ex => ex.filter(x => x.id !== e.id))}>
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="ps-add-form two-col">
          <input className="input" placeholder="Role / Title" value={expForm.role}
            onChange={e => setExpForm(f => ({ ...f, role: e.target.value }))} />
          <input className="input" placeholder="Company" value={expForm.company}
            onChange={e => setExpForm(f => ({ ...f, company: e.target.value }))} />
          <input className="input" placeholder="Duration (e.g. 2023–2024)" value={expForm.duration}
            onChange={e => setExpForm(f => ({ ...f, duration: e.target.value }))}
            style={{ gridColumn: '1/-1' }} />
          <div className="ps-add-actions" style={{ gridColumn: '1/-1' }}>
            <button className="btn btn-secondary btn-sm" onClick={addExp} disabled={!expForm.role.trim()}>
              <Plus size={13} /> Add experience
            </button>
          </div>
        </div>
      </Section>

      {/* ── Submit bar ── */}
      <div className="ps-submit-bar">
        <div className="ps-submit-info">
          <strong>{completedCount} of {steps.length}</strong> sections completed
          {completedCount < steps.length && (
            <span style={{ marginLeft: 8 }}>
              · Missing: {steps.filter(s => !s.done).map(s => s.label).join(', ')}
            </span>
          )}
        </div>
        <div className="ps-submit-actions">
          {error && <span style={{ fontSize: 13, color: 'var(--red)' }}>{error}</span>}
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>
            Skip
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading
              ? <span className="loading-spinner" style={{ borderColor: 'rgba(255,255,255,.3)', borderTopColor: '#fff' }} />
              : <><CheckCircle size={14} /> Save & continue <ArrowRight size={13} /></>
            }
          </button>
        </div>
      </div>
    </div>
  );
}