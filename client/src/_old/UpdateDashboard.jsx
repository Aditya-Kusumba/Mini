// UpdateDashboard.jsx
import React, { useState, useEffect } from 'react';
import api from '../axiosConfig';
import { useNavigate } from 'react-router-dom';

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
);
const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
);
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);
const ProjectIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="5" cy="6" r="3"></circle>
    <circle cx="19" cy="6" r="3"></circle>
    <path d="M5 9v4a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3V9"></path>
    <line x1="9" y1="20" x2="15" y2="20"></line>
    <line x1="12" y1="16" x2="12" y2="20"></line>
  </svg>
);
const EducationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
    <path d="M6 12v5c0 1.7.8 3.2 2.1 4.2C9.4 22.2 10.7 23 12 23s2.6-.8 3.9-1.8c1.3-1 2.1-2.5 2.1-4.2v-5"></path>
  </svg>
);
const ExperienceIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
  </svg>
);

const InfoSection = ({
  icon,
  title,
  items,
  handleAddItem,
  handleRemoveItem,
  handleEditItem,
  inputFields,
  currentItem,
  setCurrentItem
}) => {
  const isEditing = currentItem && currentItem.id;

  const onSubmit = (e) => {
    e.preventDefault();
    handleAddItem();
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div style={styles.sectionCard}>
      <h3 style={styles.sectionTitle}>{icon} {title}</h3>
      <div style={styles.listContainer}>
        {items && items.length > 0 ? (
          items.map(item => (
            <div key={item.id} style={styles.listItem}>
              <div>
                {Object.entries(item).map(([k, v]) => {
                  if (k === 'id') return null;
                  return (
                    <div key={k}>
                      <strong>{k.charAt(0).toUpperCase() + k.slice(1)}:</strong> {v}
                    </div>
                  );
                })}
              </div>
              <div style={styles.listActions}>
                <button
                  type="button"
                  onClick={() => handleEditItem(item)}
                  style={styles.iconBtn}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  style={styles.iconBtn}
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p style={styles.placeholderText}>No {title.toLowerCase()} added yet.</p>
        )}
      </div>

      <form onSubmit={onSubmit} style={styles.formGrid}>
        {inputFields.map(f => (
          <input
            key={f.name}
            name={f.name}
            type={f.type || 'text'}
            placeholder={f.placeholder}
            value={currentItem[f.name] || ''}
            onChange={onChange}
            style={styles.inputField}
            required
          />
        ))}
        <button type="submit" style={styles.addBtn}>
          {isEditing ? 'Update' : 'Add'}
        </button>
      </form>
    </div>
  );
};

const UpdateDashboard = () => {
  const navigate = useNavigate();

  const [theme, setTheme] = useState('dark');
  const domains = ['frontend', 'backend', 'data analyst', 'ML'];

  const [formData, setFormData] = useState({
    domains: [],
    cv: null,
    skills: [],
    projects: [],
    education: [],
    experience: []
  });

  const [currentSkill, setCurrentSkill] = useState({ name: '' });
  const [currentProject, setCurrentProject] = useState({ title: '', description: '' });
  const [currentEducation, setCurrentEducation] = useState({ degree: '', institution: '', year: '' });
  const [currentExperience, setCurrentExperience] = useState({ role: '', company: '', duration: '' });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('dashboardTheme');
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    localStorage.setItem('dashboardTheme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleDomainToggle = (dm) => {
    setFormData(prev => {
      let arr = prev.domains;
      if (arr.includes(dm)) arr = arr.filter(d => d !== dm);
      else arr = [...arr, dm];
      return { ...prev, domains: arr };
    });
  };

  const handleCvChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, cv: e.target.files[0] }));
    }
  };

  const createHandlers = (key, currentItem, setCur, blank) => ({
    handleAddItem: () => {
      const allFilled = Object.keys(blank).every(k => currentItem[k] && currentItem[k].toString().trim() !== '');
      if (!allFilled) {
        alert('Please fill all fields');
        return;
      }
      setFormData(prev => {
        const arr = prev[key] || [];
        let newArr;
        if (currentItem.id) {
          newArr = arr.map(it => it.id === currentItem.id ? currentItem : it);
        } else {
          newArr = [...arr, { ...currentItem, id: Date.now() }];
        }
        return { ...prev, [key]: newArr };
      });
      setCur(blank);
    },
    handleRemoveItem: (id) => {
      setFormData(prev => {
        const arr = prev[key].filter(it => it.id !== id);
        return { ...prev, [key]: arr };
      });
    },
    handleEditItem: (item) => {
      setCur(item);
    }
  });

  const skillH = createHandlers('skills', currentSkill, setCurrentSkill, { name: '' });
  const projH = createHandlers('projects', currentProject, setCurrentProject, { title: '', description: '' });
  const eduH = createHandlers('education', currentEducation, setCurrentEducation, { degree: '', institution: '', year: '' });
  const expH = createHandlers('experience', currentExperience, setCurrentExperience, { role: '', company: '', duration: '' });

  const handleSubmitAll = async () => {
    if (formData.domains.length === 0 || !formData.cv) {
      alert('Select domain & upload CV');
      return;
    }

    setIsSubmitting(true);
    const fd = new FormData();
    fd.append('resume', formData.cv);
    const mapping = { frontend:1, backend:2, 'data analyst':3, ML:4 };
    const dm = formData.domains.map(d => mapping[d]);
    const payload = {
      domains: dm,
      skills: formData.skills,
      projects: formData.projects,
      education: formData.education,
      experience: formData.experience
    };
    console.log(formData.projects)
    fd.append('data', JSON.stringify(payload));

    try {
      console.log(fd);
      const resp = await api.post('/api/users/updateDashboard', fd);
      if (resp.status === 200) {
        alert('Submitted Successfully');
        navigate('/dashboard');
      } else {
        alert('Submission failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error during submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={theme === 'dark' ? styles.darkContainer : styles.lightContainer}>
      <div style={styles.background}></div>

      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.userProfile}>
            <div style={styles.avatar}>{/* could insert user initial or icon */}</div>
            <div>
              <div style={styles.userName}>Prahlad</div>
              <div style={styles.userHandle}>@prahlad_in</div>
            </div>
          </div>
        </div>
        <div>
          <h2 style={styles.logo}>MyDashboard</h2>
        </div>
        <div style={styles.headerRight}>
          <label style={styles.themeSwitch}>
            <input
              type="checkbox"
              checked={theme === 'light'}
              onChange={toggleTheme}
              style={{ display: 'none' }}
            />
            <span style={styles.slider}>
              <span style={{ opacity: theme === 'light' ? 1 : 0 }}>
                <SunIcon />
              </span>
              <span style={{ opacity: theme === 'light' ? 0 : 1 }}>
                <MoonIcon />
              </span>
            </span>
          </label>
        </div>
      </header>

      <main style={styles.main}>
        <section style={styles.domainsSection}>
          <h1 style={styles.sectionHeader}>Select Domains</h1>
          <p style={styles.sectionSub}>Which domains would you like to add?</p>
          <div style={styles.domainsGrid}>
            {domains.map(d => {
              const sel = formData.domains.includes(d);
              return (
                <div
                  key={d}
                  onClick={() => handleDomainToggle(d)}
                  style={{
                    ...styles.domainCard,
                    color : "white",
                    borderColor: sel ? styles.accentColor : styles.cardBorder,
                    boxShadow: sel ? `0 0 10px ${styles.accentColor}` : 'none'
                  }}
                >
                  <div style={styles.domainIcon}>{/* optionally icon */}</div>
                  <h3 style={styles.domainName}>{d}</h3>
                  {sel && <div style={styles.checkIcon}><CheckIcon /></div>}
                </div>
              );
            })}
          </div>
        </section>

        <section style={styles.uploadSection}>
          <h3 style={styles.sectionTitle}><ProjectIcon /> Upload CV</h3>
          <label style={styles.fileUploadLabel}>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleCvChange}
              style={{ display: 'none' }}
            />
            Choose File
          </label>
          {formData.cv && <p style={styles.fileName}>Selected: {formData.cv.name}</p>}
        </section>

        <div style={styles.infoSections}>
          <InfoSection
            icon={<SunIcon />}
            title="Skills"
            items={formData.skills}
            {...skillH}
            inputFields={[{ name: 'name', placeholder: 'e.g. React.js' }]}
            currentItem={currentSkill}
            setCurrentItem={setCurrentSkill}
          />
          <InfoSection
            icon={<ProjectIcon />}
            title="Projects"
            items={formData.projects}
            {...projH}
            inputFields={[
              { name: 'title', placeholder: 'Project Title' },
              { name: 'description', placeholder: 'Brief Description' },
            ]}
            currentItem={currentProject}
            setCurrentItem={setCurrentProject}
          />
          <InfoSection
            icon={<EducationIcon />}
            title="Education"
            items={formData.education}
            {...eduH}
            inputFields={[
              { name: 'degree', placeholder: 'Degree' },
              { name: 'institution', placeholder: 'Institution' },
              { name: 'year', placeholder: 'Year' }
            ]}
            currentItem={currentEducation}
            setCurrentItem={setCurrentEducation}
          />
          <InfoSection
            icon={<ExperienceIcon />}
            title="Experience"
            items={formData.experience}
            {...expH}
            inputFields={[
              { name: 'role', placeholder: 'Role' },
              { name: 'company', placeholder: 'Company' },
              { name: 'duration', placeholder: 'e.g. 2021–2023' }
            ]}
            currentItem={currentExperience}
            setCurrentItem={setCurrentExperience}
          />
        </div>

        <button
          onClick={handleSubmitAll}
          disabled={isSubmitting}
          style={styles.submitBtn}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </main>
    </div>
  );
};

// You can tune these colors as you like
const styles = {
  accentColor: '#5c5df0',  // bluish accent
  cardBgDark: 'rgba(255,255,255,0.07)',
  cardBgLight: 'rgba(255,255,255,0.9)',
  textDark: '#f5f5fb',
  textLight: '#1f1f25',
  bgDark: '#0e0e24',
  bgLight: '#f5f6fa',
  borderDark: 'rgba(255,255,255,0.15)',
  borderLight: 'rgba(0,0,0,0.1)',

  // Style objects
  darkContainer: {
    position: 'relative',
    minHeight: '100vh',
    background: '#0e0e24',
    color: '#f5f5fb',
    padding: '20px',
    overflow: 'hidden',
  },
  lightContainer: {
    position: 'relative',
    minHeight: '100vh',
    background: '#f5f6fa',
    color: '#1f1f25',
    padding: '20px',
    overflow: 'hidden',
  },
  background: {
    position: 'fixed',
    top: 0, left: 0,
    width: '100vw', height: '100vh',
    background: `radial-gradient(circle at 10% 20%, rgba(92,93,240,0.3), transparent 40%),
                 radial-gradient(circle at 80% 90%, rgba(219,39,119,0.3), transparent 40%)`,
    filter: 'blur(80px)',
    zIndex: -1,
    animation: 'rotateBg 20s linear infinite'
  },
  header: {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 40px)',
    maxWidth: '900px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    zIndex: 10,
    background: 'inherit'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center'
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  avatar: {
    width: '40px', height: '40px',
    borderRadius: '50%',
    background: '#5c5df0'
  },
  userName: {
    fontWeight: 600
  },
  userHandle: {
    fontSize: '0.85em',
    color: '#aaa'
  },
  logo: {
    margin: 0,
    fontWeight: 700
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center'
  },
  themeSwitch: {
    position: 'relative',
    width: '60px',
    height: '34px',
    cursor: 'pointer'
  },
  slider: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#e4e4ebff',
    borderRadius: '34px',
    transition: '0.4s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 8px'
  },
  main: {
    maxWidth: '900px',
    margin: '100px auto 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '30px'
  },
  domainsSection: {
    padding: '20px',
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.15)',
    color : '#fff'
  },
  sectionHeader: {
    margin: 0,
    fontSize: '2rem',
    color : '#fff'
  },
  sectionSub: {
    color: '#fcfcfcff'
  },
  domainsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '20px',
    marginTop: '20px'
  },
  domainCard: {
    padding: '20px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.07)',
    border: '2px solid rgba(255,255,255,0.15)',
    cursor: 'pointer',
    position: 'relative',
    textAlign: 'center',
    transition: 'all 0.3s'
  },
  domainName: {
    marginTop: '10px',
    textTransform: 'capitalize',
    color : 'white'
  },
  checkIcon: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    color: '#22c55e'
  },
  uploadSection: {
    padding: '20px',
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.15)'
  },
  fileUploadLabel: {
    display: 'inline-block',
    padding: '10px 20px',
    background: '#5c5df0',
    color: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 500
  },
  fileName: {
    marginTop: '10px',
    fontStyle: 'italic',
    color: '#bbb'
  },
  infoSections: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px'
  },
  sectionCard: {
    padding: '20px',
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.15)'
  },
  sectionTitle: {
    fontSize: '1.5rem',
    marginBottom: '20px',
    color : 'white'
  },
  listContainer: {
    marginBottom: '20px'
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    background: 'rgba(0,0,0,0.2)',
    padding: '12px',
    borderRadius: '10px',
    marginBottom: '10px'
  },
  listActions: {
    display: 'flex',
    gap: '10px'
  },
  placeholderText: {
    color: '#fffbfbff',
    fontStyle: 'italic'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '10px'
  },
  inputField: {
    padding: '10px 15px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(0,0,0,0.2)',
    color: '#f5f5fb'
  },
  addBtn: {
    padding: '10px 20px',
    background: '#5c5df0',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600
  },
  iconBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#bbb'
  },
  submitBtn: {
    padding: '15px',
    background: '#5c5df0',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1.2rem',
    cursor: 'pointer',
    fontWeight: 700,
    alignSelf: 'center',
    minWidth: '200px'
  }
};

// CSS keyframes injection
const styleSheet = document.styleSheets[0];
const keyframes = `@keyframes rotateBg {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}`;
styleSheet.insertRule(keyframes, styleSheet.cssRules.length);

export default UpdateDashboard;
