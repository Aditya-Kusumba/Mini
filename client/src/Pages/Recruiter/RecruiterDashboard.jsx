import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Ensure this path is correct
import {
    Briefcase,
    Building,
    Users,
    Globe,
    PlusCircle,
    ArrowRight,
    X
} from 'lucide-react';
import './RecruiterDashboard.css'; // Ensure this path is correct

const RecruiterDashboard = () => {
    const { user, loading: authLoading } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- State for the Modal and Form ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newJob, setNewJob] = useState({
        title: '',
        description: '',
        domain_id: '',
        target_tier_id: '',
        requirements: '',
        location: '',
        salary_range: ''
    });

    // In a real app, you'd fetch these from your API
    const [domains, setDomains] = useState([]);
    const [tiers, setTiers] = useState([]);

    const fetchDashboardData = async () => {
        if (!dashboardData) setLoading(true);
        try {
            const response = await fetch(`/api/users/getRecData`, { credentials: 'include' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to fetch dashboard data");
            }
            const result = await response.json();
            setDashboardData(result.data);

            // Mock data - replace with API call if needed
            setDomains([{ domain_id: 1, domain_name: 'Frontend' }, { domain_id: 2, domain_name: 'Backend' }, { domain_id: 3, domain_name: 'Data Analyst' }, { domain_id: 4, domain_name: 'ML' }]);
            setTiers([{ tier_id: 1, tier_name: 'Platinum' }, { tier_id: 2, tier_name: 'Gold' }, { tier_id: 3, tier_name: 'Silver' }]);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        if (!user?.id) {
            setLoading(false);
            setError("Authentication required. Please log in.");
            return;
        }
        fetchDashboardData();
    }, [user, authLoading]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewJob(prev => ({ ...prev, [name]: value }));
    };

    const handlePostJob = async (e) => {
        e.preventDefault();
        if (!newJob.title || !newJob.description || !newJob.domain_id || !newJob.target_tier_id) {
            alert("Please fill all required fields.");
            return;
        }
        try {
            const response = await fetch('/api/recruiters/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(newJob)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Failed to post job");

            setIsModalOpen(false);
            fetchDashboardData();
            // Reset form state
            setNewJob({
                title: '', description: '', domain_id: '', target_tier_id: '',
                requirements: '', location: '', salary_range: ''
            });

        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    if (authLoading || loading) {
        return <div className="loading-state">Loading Recruiter Dashboard...</div>;
    }
    if (error) {
        return <div className="error-state">Error: {error}</div>;
    }
    if (!dashboardData) {
        return <div className="loading-state">No dashboard data found.</div>;
    }

    const { recruiterInfo = {}, stats = {}, jobs = [], recentApplications = [] } = dashboardData;

    return (
        <>
            <div className="recruiter-dashboard">
                <div className="dashboard-header">
                    <h1>Welcome back, {recruiterInfo.fullName}!</h1>
                    <p>Here's what's happening with your job postings today.</p>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <Briefcase size={24} className="stat-icon" />
                        <div className="stat-content">
                            <span className="stat-value">{stats.activeJobs || 0}</span>
                            <span className="stat-title">Active Jobs</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <Users size={24} className="stat-icon" />
                        <div className="stat-content">
                            <span className="stat-value">{stats.totalApplications || 0}</span>
                            <span className="stat-title">Total Applications</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <Building size={24} className="stat-icon" />
                        <div className="stat-content">
                            <span className="stat-value">{stats.totalJobs || 0}</span>
                            <span className="stat-title">Total Jobs Posted</span>
                        </div>
                    </div>
                </div>

                <div className="dashboard-main-content">
                    <div className="dashboard-section">
                        <div className="section-header">
                            <h2>Your Job Postings</h2>
                            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
                                <PlusCircle size={16} /> Post New Job
                            </button>
                        </div>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Job Title</th>
                                        <th>Status</th>
                                        <th>Applications</th>
                                        <th>Posted On</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {jobs.map(job => (
                                        <tr key={job.job_id}>
                                            <td>{job.title}</td>
                                            <td><span className={job.is_active ? 'status-active' : 'status-inactive'}>{job.is_active ? 'Active' : 'Inactive'}</span></td>
                                            <td>{job.application_count}</td>
                                            <td>{new Date(job.posted_at).toLocaleDateString()}</td>
                                            <td><Link to={`/recruiter/jobs/${job.job_id}`} className="details-link">View <ArrowRight size={16} /></Link></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Post a New Job</h2>
                            <button onClick={() => setIsModalOpen(false)} className="modal-close-btn"><X size={24} /></button>
                        </div>
                        <form onSubmit={handlePostJob} className="modal-form">
                            <div className="form-group">
                                <label htmlFor="title">Job Title</label>
                                <input type="text" id="title" name="title" value={newJob.title} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea id="description" name="description" value={newJob.description} onChange={handleInputChange} required rows="3"></textarea>
                            </div>
                            <div className="form-group">
                                <label htmlFor="requirements">Requirements (Comma-separated)</label>
                                <textarea id="requirements" name="requirements" value={newJob.requirements} onChange={handleInputChange} placeholder="e.g., React, Node.js, PostgreSQL" rows="3"></textarea>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="location">Location</label>
                                    <input type="text" id="location" name="location" value={newJob.location} onChange={handleInputChange} placeholder="e.g., Hyderabad, India" />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="salary_range">Salary Range</label>
                                    <input type="text" id="salary_range" name="salary_range" value={newJob.salary_range} onChange={handleInputChange} placeholder="e.g., ₹12 - ₹15 LPA" />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="domain_id">Domain</label>
                                    <select id="domain_id" name="domain_id" value={newJob.domain_id} onChange={handleInputChange} required>
                                        <option value="" disabled>Select a domain</option>
                                        {domains.map(d => <option key={d.domain_id} value={d.domain_id}>{d.domain_name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="target_tier_id">Target Tier</label>
                                    <select id="target_tier_id" name="target_tier_id" value={newJob.target_tier_id} onChange={handleInputChange} required>
                                        <option value="" disabled>Select a tier</option>
                                        {tiers.map(t => <option key={t.tier_id} value={t.tier_id}>{t.tier_name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                {/* ✅ ADDED: Cancel Button */}
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">Post Job</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default RecruiterDashboard;