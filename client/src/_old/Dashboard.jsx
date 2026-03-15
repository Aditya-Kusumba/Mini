import React, { useState, useEffect, useRef } from 'react'; // 1. Import useRef
import api from '../axiosConfig';
import './Dashboard.css';

// --- (All sub-components like ThemeToggle, ProfileHeader, etc. remain the same) ---
const ThemeToggle = ({ theme, toggleTheme }) => (
  <div className="theme-switch-wrapper">
    <label className="theme-switch" htmlFor="theme-checkbox">
      <input
        type="checkbox"
        id="theme-checkbox"
        onChange={toggleTheme}
        checked={theme === 'dark'}
      />
      <div className="slider round">
        <span className="sun-icon">☀️</span>
        <span className="moon-icon">🌙</span>
      </div>
    </label>
  </div>
);

const ProfileHeader = ({ candidate, theme, toggleTheme }) => (
  <header className="dashboard-header">
    <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
    <img src={candidate.profilePicUrl || 'https://i.pravatar.cc/150'} alt="Profile" className="profile-pic" />
    <div className="header-info">
      <h1>Welcome back, {candidate.fullName}!</h1>
      <p>Status: <span className={`status ${candidate.status?.toLowerCase()}`}>{candidate.status}</span></p>
    </div>
    <div className="header-actions">
      <button>Edit Full Profile</button>
      <button>View Public Profile</button>
    </div>
  </header>
);

const TierStatusCard = ({ domain }) => (
    <div className="card tier-card">
      <h3>{domain.name}</h3>
      <p className="tier-level">Tier {domain.tier}</p>
      <p className="tier-rank">Rank: {domain.rank}/{domain.totalInTier}</p>
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${domain.progress}%` }}></div>
      </div>
      <small>{domain.progress}% to next tier threshold</small>
    </div>
);

const UpcomingEventsCard = () => (
    <div className="card">
        <h3>Upcoming Events</h3>
        <div className="event">
            <p><strong>Next Shifting Test</strong></p>
            <p className="countdown">18 days, 9 hours</p>
            <button className="participate-btn">Register Now</button>
        </div>
        <div className="event">
            <p><strong>Next Internal Contest</strong></p>
            <p className="countdown">2 days, 4 hours</p>
            <button className="participate-btn">Join</button>
        </div>
    </div>
);

const MockInterviewCard = () => (
    <div className="card cta-card">
        <h3>Mock Interview Hub</h3>
        <p>Your Interview Readiness Score: <strong>8/10</strong></p>
        <p>You're showing strong problem-solving skills. Test them in a live environment.</p>
        <button className="cta-button">Go to Mock Interview Page</button>
    </div>
);

const DomainNewsCard = ({ news }) => (
    <div className="card">
        <h3>Domain & Tier News</h3>
        <ul className="news-feed">
            {news.map(item => (
                <li key={item.id}>
                    <strong>{item.title}:</strong> {item.body}
                    <small>{new Date(item.timestamp).toLocaleDateString()}</small>
                </li>
            ))}
        </ul>
    </div>
);

const ProfileDetails = ({ candidate }) => {
    const [activeTab, setActiveTab] = useState('skills');
    const renderList = (items) => {
        if (Array.isArray(items) && items.length > 0) {
            return items.map((item, index) => (
                <li key={index}>{item.name || item.role || item.title || item.degree || JSON.stringify(item)}</li>
            ));
        }
        return <li>No items to display.</li>;
    };
    const renderSkillsList = (items) => {
        if (Array.isArray(items) && items.length > 0) {
            return items.map((item, index) => (
                <li key={index}>{item.name || JSON.stringify(item)}</li>
            ));
        }
        return <li>No skills added yet.</li>;
    };
    return (
        <div className="card">
            <div className="tabs">
                <button onClick={() => setActiveTab('bio')} className={activeTab === 'bio' ? 'active' : ''}>Bio</button>
                <button onClick={() => setActiveTab('skills')} className={activeTab === 'skills' ? 'active' : ''}>Skills</button>
                <button onClick={() => setActiveTab('experience')} className={activeTab === 'experience' ? 'active' : ''}>Experience</button>
                <button onClick={() => setActiveTab('projects')} className={activeTab === 'projects' ? 'active' : ''}>Projects</button>
                <button onClick={() => setActiveTab('education')} className={activeTab === 'education' ? 'active' : ''}>Education</button>
            </div>
            <div className="tab-content">
                {activeTab === 'bio' && <p>{candidate.bio || 'No bio available.'}</p>}
                {activeTab === 'skills' && <ul className="profile-list skills-list">{renderSkillsList(candidate.skills)}</ul>}
                {activeTab === 'experience' && <ul className="profile-list">{renderList(candidate.experience)}</ul>}
                {activeTab === 'projects' && <ul className="profile-list">{renderList(candidate.projects)}</ul>}
                {activeTab === 'education' && <ul className="profile-list">{renderList(candidate.education)}</ul>}
            </div>
        </div>
    );
};

const JourneyTimeline = ({ events }) => (
    <div className="card">
        <h3>Your Journey</h3>
        <div className="timeline">
            {events.map(event => (
                <div className="timeline-item" key={event.id}>
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                        <div className="timeline-date">{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        <p>{event.description}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);


// --- Main Dashboard Component ---
function Dashboard() {
  const [candidateData, setCandidateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('light');
  const dashboardRef = useRef(null);

  const toggleTheme = () => {
      setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    if (dashboardRef.current) {
        dashboardRef.current.setAttribute('data-theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    const fetchCandidateData = async () => {
      try {
        const response = await api.get('/api/users/getData');
        setCandidateData(response.data.data);
      } catch (err) {
        console.error("Failed to fetch candidate data:", err);
        setError("Could not load dashboard data. Please try refreshing the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchCandidateData();
  }, []);

  if (loading) {
    return <div className="loading-spinner">Loading Your Dashboard...</div>;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!candidateData) {
    return <div className="error-message">No candidate data found.</div>;
  }

  // 4. Attach the ref to the main element here
  return (
    <main ref={dashboardRef} className="dashboard-container">
      <ProfileHeader candidate={candidateData} theme={theme} toggleTheme={toggleTheme} />
      <div className="dashboard-grid">
        <section className="main-content">
          <h2>Tier Status</h2>
          <div className="tier-grid">
            {candidateData.domains.map(domain => (
              <TierStatusCard key={domain.id} domain={domain} />
            ))}
          </div>
          <h2>Profile Summary</h2>
          <ProfileDetails candidate={candidateData} />
          <JourneyTimeline events={candidateData.timelineEvents} />
        </section>
        <aside className="sidebar">
          <UpcomingEventsCard />
          <MockInterviewCard />
          <DomainNewsCard news={candidateData.domainNews} />
        </aside>
      </div>
    </main>
  );
}

export default Dashboard;