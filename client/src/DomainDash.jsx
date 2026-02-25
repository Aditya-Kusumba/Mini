import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import {
    BarChart2,
    Trophy,
    Target,
    Users,
    ArrowRight,
    PlayCircle,
    BookOpen
} from 'lucide-react';
import './DomainDash.css';

const DomainDash = () => {
    const { domainId } = useParams();
    const { user, loading: authLoading } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [leaderboard, setLeaderboard] = useState([
        { candidate_id: 1, current_rank: 1, fullName: 'Aditya', total_score: 1230 },
        { candidate_id: 2, current_rank: 2, fullName: 'Darvish', total_score: 1200 },
    ]);
    const [appliedJobs, setAppliedJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (authLoading) return; // Wait for authentication check to complete

        if (!user) {
            setError("Authentication required. Please log in.");
            setLoading(false);
            return;
        }

        const fetchDomainData = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/domains/${domainId}`, {
                    credentials: 'include'
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || "Failed to fetch domain data");
                }
                const result = await response.json();
                setDashboardData(result.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        const fetchAppliedJobs = async () => {
            try {
                const response = await fetch(`/api/users/job-applications/${domainId}`, {
                    credentials: 'include'
                });

                if (response.ok) {
                    const result = await response.json();
                    setAppliedJobs(result.data);
                }
            } catch (err) {
                console.error("Error fetching applied jobs:", err);
            }
        };
        const fetchLeaderboard = async () => {
            try {
                const response = await fetch(`/api/domains/${domainId}/leaderboard`, {
                    credentials: 'include'
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || "Failed to fetch leaderboard");
                }
                const result = await response.json();
                setLeaderboard(result.data);
            } catch (err) {
                // Don't set the main error for a failed leaderboard, just log it
                console.error("Error fetching leaderboard:", err);
            }
        };

        fetchDomainData();
        fetchAppliedJobs();
        fetchLeaderboard();

    }, [domainId, user, authLoading]);

    const handleApply = async (jobId) => {
        try {
            const response = await fetch('/api/users/job-applications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    job_id: jobId,
                    candidate_id: user.id
                }),
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to apply for the job');
            }

            // Update applied jobs in the state after successful application
            const result = await response.json();
            setAppliedJobs((prevAppliedJobs) => [
                ...prevAppliedJobs,
                // Ensure the added job has a job_id for the conditional check to work immediately
                { ...result.data, job_id: jobId } 
            ]);
        } catch (err) {
            setError(err.message);
        }
    };

    if (authLoading || loading) {
        return <div className="loading-state">Loading Domain Dashboard...</div>;
    }

    if (error) {
        return <div className="error-state">Error: {error}</div>;
    }

    if (!dashboardData) {
        return <div className="loading-state">No data found for this domain.</div>;
    }

    const { domainDetails, candidatePerformance, availableJobs } = dashboardData;

    return (
        <div className="domain-dash">
            <div className="dash-header">
                <div>
                    <h1>{domainDetails.domain_name} Dashboard</h1>
                    <p>{domainDetails.description || 'Your central hub for this domain.'}</p>
                </div>
                <Link to="/contests" className="btn btn-primary">
                    <PlayCircle size={18} /> Join a Contest
                </Link>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <Trophy size={24} className="stat-icon gold" />
                    <div className="stat-content">
                        <span className="stat-title">Your Rank</span>
                        <span className="stat-value">#{candidatePerformance?.current_rank || 'N/A'}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <BarChart2 size={24} className="stat-icon blue" />
                    <div className="stat-content">
                        <span className="stat-title">Your Score</span>
                        <span className="stat-value">{candidatePerformance?.total_score || 0}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <Target size={24} className="stat-icon green" />
                    <div className="stat-content">
                        <span className="stat-title">Your Tier</span>
                        <span className="stat-value">{candidatePerformance?.tier_name || 'Unranked'}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <Users size={24} className="stat-icon purple" />
                    <div className="stat-content">
                        <span className="stat-title">Active Candidates</span>
                        <span className="stat-value">{domainDetails.active_candidates}</span>
                    </div>
                </div>
            </div>
            <div className="domain-dash-sidebar">
                    <div className="dash-section leaderboard-section">
                        <div className="section-header">
                            <h3>Domain Leaderboard</h3>
                        </div>
                        <ul
  className="leaderboard-list"
  style={{
    listStyle: "none",
    padding: 0,
    margin: 0,
    fontFamily: "sans-serif",
    maxWidth: "400px",
    border: "1px solid #eee",
    borderRadius: "8px",
    overflow: "hidden",
  }}
>
  {leaderboard.map((entry, index) => (
    <li
      key={entry.candidate_id}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "12px 16px",
        backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9",
      }}
    >
      <span
        className="rank"
        style={{
          fontWeight: "bold",
          color: "#0d6efd",
          flexBasis: "50px",
          fontSize: "0.9rem",
        }}
      >
        #{entry.current_rank}
      </span>
      <span
        className="name"
        style={{
          fontWeight: "500",
          color: "#333",
          flexGrow: 1,
          padding: "0 1rem",
        }}
      >
        {entry.username || 'Anonymous'}
      </span>
      <span
        className="score"
        style={{
          fontWeight: "600",
          color: "#555",
          fontFamily: "monospace",
          fontSize: "0.9rem",
        }}
      >
        {entry.rating} pts
      </span>
    </li>
  ))}
</ul>
                    </div>
                </div>
            <div className="dash-main-content">
                {/* --- Available Jobs Section --- */}
                <div className="dash-section">
                    <div className="section-header">
                        <h2>Jobs for Your Tier ({candidatePerformance?.tier_name || 'N/A'})</h2>
                    </div>
                    <div className="jobs-list">
                        {availableJobs && availableJobs.length > 0 ? (
                            availableJobs.map(job => {
                                // 1. Check if the job ID exists in the appliedJobs array
                                const isJobApplied = appliedJobs.some(
                                    appliedJob => appliedJob.job_id === job.job_id
                                );

                                return (
                                    <div key={job.job_id} className="job-card">

                                        {/* CRITICAL: Left Column (2fr) for Title and Facts */}
                                        <div className="job-info-column"> 
                                            
                                            {/* HEADER */}
                                            <div className="job-header">
                                                <h3 className="job-title">{job.title}</h3>
                                                <p className="job-company-location">
                                                    <span className="job-company">{job.company_name}</span>
                                                    <span className="separator"> | </span>
                                                    <span className="job-location">{job.location || 'Remote'}</span>
                                                </p>
                                                <div className="job-meta">
                                                    <span className={`job-status status-${job.status.toLowerCase()}`}>{job.status}</span>
                                                    <span className="separator"> | </span>
                                                </div>
                                            </div>

                                            {/* QUICK FACTS */}
                                            <div className="job-quick-facts">
                                                <div className="fact-item">
                                                    <strong>Salary Range:</strong> 
                                                    <p>{job.salary_range || 'Competitive'}</p>
                                                </div>
                                                <div className="fact-item">
                                                    <strong>Posted:</strong> 
                                                    <p>{new Date(job.posted_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>

                                        </div> 
                                        
                                        {/* Right Column (1fr) for Description and Requirements */}
                                        <div className="job-details">
                                            <h4>Job Description</h4>
                                            <p className="job-description">{job.description}</p>
                                            
                                            <h4>Requirements</h4>
                                            <p className="job-requirements">{job.requirements}</p>
                                        </div>

                                        {/* Apply Button (Absolute Positioned) */}
                                        <div className="job-actions">
                                            <button
                                                onClick={() => handleApply(job.job_id)}
                                                // Conditionally set class and disabled state
                                                className={`btn ${isJobApplied ? 'btn-applied' : 'btn-primary'}`}
                                                disabled={isJobApplied}
                                            >
                                                {isJobApplied ? 'Applied' : 'Apply Now'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })) : (
                                <p className="empty-state">No jobs currently available for your tier in this domain. Keep improving your rank!</p>
                            )}
                    </div>
                </div>

                {/* --- Applied Jobs Section --- */}
                <div className="dash-section">
                    <div className="section-header">
                        <h2>Applied Jobs</h2>
                    </div>
                    <div className="jobs-list">
                        {appliedJobs && appliedJobs.length > 0 ? (
                            appliedJobs.map(job => (
                                // Use a simplified structure for the applied list to avoid clutter
                                <div key={job.application_id} className="job-card applied-job-card">
                                    <div className="job-info-column" style={{ gridColumn: '1 / span 2', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                                        <div>
                                            {/* Note: job.title should be available, company_name might need adjustment based on appliedJobs API response */}
                                            <h3 className="job-title" style={{fontSize: '1.2rem', margin: 0}}>{job.title}</h3>
                                            <p className="job-company" style={{margin: '0'}}>{job.company_name || 'N/A'}</p> 
                                        </div>
                                        {/* Assuming job.status is part of the appliedJobs response */}
                                        <span className={`job-status status-${job.status ? job.status.toLowerCase() : 'pending'}`}>{job.status || 'Pending'}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="empty-state">You have not applied for any jobs yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DomainDash;