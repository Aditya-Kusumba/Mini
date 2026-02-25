import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Trophy, 
  Target, 
  Code, 
  TrendingUp, 
  Calendar,
  Award,
  ArrowRight,
  BarChart3,
  CheckCircle
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [performance, setPerformance] = useState(0);
  // State for general dashboard stats
  const [stats, setStats] = useState({
    totalProblems: 0,
    solvedProblems: 0,
    contestsParticipated: 0
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingContests, setUpcomingContests] = useState([]);
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [domainsLoading, setDomainsLoading] = useState(true);
  const [domainsError, setDomainsError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchSelectedDomains();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/users/getstats', { withCredentials: true });
      const { problems, contests } = response.data;
      setStats({
        totalProblems: 150,
        solvedProblems: problems,
        contestsParticipated: contests,
      });

      const performance = Math.round(((problems / 150) * 100 + contests * 3.2) * 100) / 100;
      setPerformance(performance);

      setRecentActivity([
        // { id: 1, type: 'problem_solved', title: 'Two Sum', points: 10, time: '2 hours ago' },
        // { id: 2, type: 'contest_joined', title: 'Weekly Coding Contest', points: 150, time: '1 day ago' },
        // { id: 3, type: 'tier_upgraded', title: 'Moved to Silver Tier', points: 0, time: '3 days ago' }
      ]);

      setUpcomingContests([
        { id: 1, title: 'Weekly Coding Contest', date: 'Tomorrow', time: '2:00 PM' },
        { id: 2, title: 'DSA Challenge', date: 'Friday', time: '6:00 PM' }
      ]);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  const fetchSelectedDomains = async () => {
    try {
      setDomainsLoading(true);
      const response = await axios.get('/api/domains/domains', {withCredentials : true});
      const result = await response.data;
      setSelectedDomains(result.data);
    } catch (err) {
      setDomainsError(err.message);
    } finally {
      setDomainsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const statCards = [
    { icon: Code, title: 'Problems Solved', value: stats.solvedProblems, total: stats.totalProblems, link: '/problems' },
    { icon: Calendar, title: 'Contests Joined', value: stats.contestsParticipated, link: '/contests' },
    { icon: BarChart3, title: 'Performance', value: `${performance}%` }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1 className="dashboard-title">
            {getGreeting()}, {user?.username}! 👋
          </h1>
          <p className="dashboard-subtitle">
            Ready to tackle some coding challenges today?
          </p>
        </div>
        <div className="dashboard-actions">
          <Link to="/problems" className="btn btn-primary">
            Start Coding <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link key={index} to={stat.link} className="stat-card card">
              <div className="stat-icon"><Icon size={24} /></div>
              <div className="stat-content">
                <h3 className="stat-title">{stat.title}</h3>
                <p className="stat-value">{stat.value}</p>
                {stat.total && <p className="stat-total">out of {stat.total}</p>}
              </div>
              <ArrowRight size={16} className="stat-arrow" />
            </Link>
          );
        })}
      </div>

      <div className="dashboard-content">
        {/* Recent Activity */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title" style={{color : 'red'}}>Recent Activity</h2>
            <Link to="/profile" className="section-link">View All <ArrowRight size={16} /></Link>
          </div>
          <div className="activity-list">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  {activity.type === 'problem_solved' && <CheckCircle size={20} />}
                  {activity.type === 'contest_joined' && <Trophy size={20} />}
                  {activity.type === 'tier_upgraded' && <Award size={20} />}
                </div>
                <div className="activity-content">
                  <h4 className="activity-title">{activity.title}</h4>
                  <p className="activity-time">{activity.time}</p>
                </div>
                {activity.points > 0 && <div className="activity-points">+{activity.points}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Contests */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title" style={{color : 'red'}}>Upcoming Contests</h2>
            <Link to="/contests" className="section-link">View All <ArrowRight size={16} /></Link>
          </div>
          <div className="contest-list">
            {upcomingContests.map((contest) => (
              <div key={contest.id} className="contest-item card">
                <div className="contest-icon"><Calendar size={20} /></div>
                <div className="contest-content">
                  <h4 className="contest-title">{contest.title}</h4>
                  <p className="contest-time">{contest.date} at {contest.time}</p>
                </div>
                <button className="btn btn-secondary btn-sm">Join</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title" style={{color : 'red'}}>Selected Domains</h2>
          <Link to="/domain/selection" className="section-link">
            Manage Domains <ArrowRight size={16} />
          </Link>
        </div>

        {domainsLoading && <p>Loading your domains...</p>}
        
        {domainsError && <p className="error-text">Error: {domainsError}</p>}

        {!domainsLoading && !domainsError && (
          <div className="domains-grid">
            {selectedDomains.length > 0 ? (
              selectedDomains.map(domain => (
                <div key={domain.domain_id} className="domain-card card">
                  <div className="domain-card-header">
                    <Target size={20} />
                    <h3 className="domain-card-title">{domain.domain_name}</h3>
                  </div>
                  <div className="domain-card-stats">
                    <div className="stat-item">
                      <span className="stat-label">Tier</span>
                      <span className="stat-value tier">{domain.tier_name}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Rank</span>
                      <span className="stat-value">#{domain.current_rank}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Score</span>
                      <span className="stat-value">{domain.rating}</span>
                    </div>
                  </div>
                  <Link to={`/domain/${domain.domain_id}`} className="btn btn-secondary btn-block">
                    View Dashboard <ArrowRight size={16} />
                  </Link>
                </div>
              ))
            ) : (
              <p>You haven't selected any domains yet. Choose a domain to start competing!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;