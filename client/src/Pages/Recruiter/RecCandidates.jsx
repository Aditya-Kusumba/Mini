import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    User,
    Star,
    Briefcase,
    GraduationCap,
    BookOpen,
    ClipboardList,
    Layers,
    Shield,
    ArrowLeft,
    Loader2,
    AlertTriangle
} from 'lucide-react';

// --- Helper Component for Star Rating ---
const StarRating = ({ rating = 0 }) => {
    const totalStars = 5;
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = totalStars - fullStars - (halfStar ? 1 : 0);

    return (
        <div className="star-rating">
            {[...Array(fullStars)].map((_, i) => <Star key={`full-${i}`} size={16} className="star-icon full-star" />)}
            {halfStar && <Star key="half" size={16} className="star-icon half-star" style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0% 100%)' }} />}
            {[...Array(emptyStars)].map((_, i) => <Star key={`empty-${i}`} size={16} className="star-icon empty-star" />)}
            <span className="rating-text">{rating}</span>
        </div>
    );
};

// --- Helper Component for Detail Sections ---
const DetailSection = ({ icon: Icon, title, children }) => (
    <div className="detail-section">
        <h3 className="detail-section-title"><Icon size={16} className="detail-section-icon" />{title}</h3>
        {children}
    </div>
);

// --- Re-usable Main Candidate Card Component ---
const CandidateCard = ({ candidate }) => (
    <div className="candidate-card">
        <div className="candidate-card-header">
            <div className="header-top">
                <h2 className="candidate-name">{candidate.name}</h2>
                <User size={24} className="candidate-icon" />
            </div>
            <div className="header-rating">
                <StarRating rating={candidate.rating} />
            </div>
        </div>
        <div className="candidate-card-body">
            <div className="badges">
                <span className="badge domain-badge"><Layers size={14} className="badge-icon" /> Domain: {candidate.domainId || 'N/A'}</span>
                <span className="badge tier-badge"><Shield size={14} className="badge-icon" /> Tier: {candidate.tierId || 'N/A'}</span>
            </div>
            <DetailSection icon={ClipboardList} title="Skills">
                <div className="skills-list">
                    {/* ✅ FIX: Robust mapping for skills array */}
                    {Array.isArray(candidate.skills) ? (
                        candidate.skills.map((skill, index) => {
                            // Check if skill is an object with id/name
                            if (typeof skill === 'object' && skill !== null && skill.id) {
                                return (
                                    <span key={skill.id} className="skill-tag">
                                        {skill.name}
                                    </span>
                                );
                            }
                            // Fallback for if skill is just a string
                            if (typeof skill === 'string') {
                                return (
                                    <span key={index} className="skill-tag">
                                        {skill}
                                    </span>
                                );
                            }
                            return null;
                        })
                    ) : (
                        <span className="skill-tag">No skills listed</span>
                    )}
                </div>
            </DetailSection>
            <DetailSection icon={Briefcase} title="Experience">
                <ul className="detail-list">
                    {Array.isArray(candidate.experience) && candidate.experience.map((exp, i) => (
                        <li key={i} className="detail-list-item">
                            <strong className="item-title">{exp.role}</strong> at {exp.company}<span className="item-subtitle">{exp.duration}</span>
                        </li>
                    ))}
                </ul>
            </DetailSection>
            <DetailSection icon={GraduationCap} title="Education">
                <ul className="detail-list">
                    {Array.isArray(candidate.education) && candidate.education.map((edu, i) => (
                        <li key={i} className="detail-list-item">
                            <strong className="item-title">{edu.degree}</strong><span className="item-subtitle">{edu.school} ({edu.year})</span>
                        </li>
                    ))}
                </ul>
            </DetailSection>
            <DetailSection icon={BookOpen} title="Projects">
                <ul className="detail-list">
                    {Array.isArray(candidate.projects) && candidate.projects.map((proj, i) => (
                        <li key={i} className="detail-list-item">
                            <strong className="item-title">{proj.title}</strong><p className="item-description">{proj.description}</p>
                        </li>
                    ))}
                </ul>
            </DetailSection>
        </div>
    </div>
);

// --- Parent Component: JobApplicantsDashboard ---
const JobApplicantsDashboard = () => {
    const [jobsWithApplicants, setJobsWithApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchJobData = async () => {
            setLoading(true);
            setError(null);
            
            const API_URL = `/api/recruiters//jobs/candidates`;
            console.log(`Fetching data from: ${API_URL}`);

            try {
                const response = await fetch(API_URL, { credentials: 'include' });
                if (!response.ok) {
                   // ✅ FIX: Correctly parse the error message before throwing
                   const errorData = await response.json(); 
                   throw new Error(errorData.message || 'Failed to fetch job applicants');
                }
                const result = await response.json();
                setJobsWithApplicants(result.data);
            } catch (err) {
                console.error("API call failed:", err);
                setError(err.message || 'An unknown error occurred.');
            } finally {
                setLoading(false);
            }
        };

        fetchJobData();
    }, []);

    if (loading) {
        return (
            <div className="loading-container">
                <Loader2 size={48} className="loading-spinner" />
                <span className="loading-text">Loading your job applications...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <AlertTriangle size={48} className="error-icon" />
                <h2 className="error-title">Error Loading Data</h2>
                <p className="error-message">{error}</p>
                <Link to="/recruiter/dashboard" className="btn btn-primary btn-back">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <>
            <div className="candidates-page">
                <div className="container">
                    <div className="page-header">
                        <Link to="/recruiter/dashboard" className="back-link">
                            <ArrowLeft size={16} /> Back to Dashboard
                        </Link>
                        <h1 className="page-title">All Job Applications</h1>
                        <p className="page-subtitle">
                            Here are all the applications for your active and inactive job postings.
                        </p>
                    </div>

                    {jobsWithApplicants.length > 0 ? (
                        <div className="job-groups-container">
                            {jobsWithApplicants.map(job => (
                                <section key={job.job_id} className="job-group-section">
                                    <div className="job-group-header">
                                        <h2 className="job-group-title">{job.title}</h2>
                                        <span className={`job-status-chip ${job.is_active ? 'active' : 'inactive'}`}>
                                            {job.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <p className="job-group-subtitle">
                                        {job.candidates.length} {job.candidates.length === 1 ? 'Applicant' : 'Applicants'}
                                    </p>
                                    
                                    {job.candidates.length > 0 ? (
                                        <div className="candidates-grid">
                                            {job.candidates.map(candidate => (
                                                <CandidateCard key={candidate.id} candidate={candidate} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="no-candidates-container" style={{padding: '1.5rem', minHeight: 'auto'}}>
                                            <p className="no-candidates-text" style={{marginTop: 0}}>No applications for this job yet.</p>
                                        </div>
                                    )}
                                </section>
                            ))}
                        </div>
                    ) : (
                        <div className="no-candidates-container">
                            <h3 className="no-candidates-title">No Jobs Found</h3>
                            <p className="no-candidates-text">You have not posted any jobs yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- CSS STYLES --- */}
            <style>{`
                /* Global styles */
                .candidates-page {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    min-height: 100vh;
                    background-color: #f4f7f6;
                    padding: 2rem 1rem;
                }
                .container { max-width: 1280px; margin: 0 auto; }

                /* Page Header */
                .page-header { margin-bottom: 2rem; }
                .back-link {
                    display: inline-flex; align-items: center; gap: 0.5rem;
                    font-size: 0.875rem; color: #2563eb; text-decoration: none; margin-bottom: 0.5rem;
                }
                .back-link:hover { text-decoration: underline; }
                .page-title { font-size: 2.25rem; font-weight: 700; color: #1f2937; }
                .page-subtitle { margin-top: 0.25rem; font-size: 1.125rem; color: #4b5563; }
                .count-highlight { font-weight: 700; color: #2563eb; }

                /* Loading / Error States */
                .loading-container, .error-container {
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    min-height: 100vh; background-color: #f9fafb; color: #374151;
                }
                .loading-spinner { color: #3b82f6; animation: spin 1s linear infinite; }
                .loading-text { margin-top: 1rem; font-size: 1.25rem; font-weight: 600; }
                .error-icon { color: #ef4444; }
                .error-title { margin-top: 1rem; font-size: 1.25rem; font-weight: 600; color: #dc2626; }
                .error-message { color: #4b5563; }
                .btn-primary.btn-back {
                    margin-top: 1.5rem; display: inline-flex; align-items: center; gap: 0.5rem;
                    padding: 0.5rem 1rem; background-color: #2563eb; color: white; border: none;
                    border-radius: 0.5rem; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
                    cursor: pointer; transition: background-color 0.2s; text-decoration: none; font-weight: 500;
                }
                .btn-primary.btn-back:hover { background-color: #1d4ed8; }

                /* --- NEW Job Group Styling --- */
                .job-groups-container { display: flex; flex-direction: column; gap: 2.5rem; }
                .job-group-section {
                    background-color: #ffffff;
                    border-radius: 0.75rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    overflow: hidden;
                }
                .job-group-header {
                    padding: 1.5rem 1.5rem 1rem 1.5rem;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .job-group-title { font-size: 1.5rem; font-weight: 600; color: #1f2937; margin: 0; }
                .job-status-chip {
                    font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.75rem;
                    border-radius: 9999px; text-transform: uppercase;
                }
                .job-status-chip.active { background-color: #d1e7dd; color: #0f5132; }
                .job-status-chip.inactive { background-color: #e5e7eb; color: #374151; }
                
                .job-group-subtitle {
                    font-size: 1rem; color: #6b7280;
                    margin: 0; padding: 1rem 1.5rem;
                }

                /* Candidates Grid */
                .candidates-grid {
                    display: grid; grid-template-columns: 1fr;
                    gap: 1.5rem; padding: 0 1.5rem 1.5rem 1.5rem;
                }
                @media (min-width: 1024px) { .candidates-grid { grid-template-columns: repeat(2, 1fr); } }
                @media (min-width: 1280px) { .candidates-grid { grid-template-columns: repeat(3, 1fr); } }
                
                .no-candidates-container {
                    text-align: center; background-color: white; padding: 2.5rem;
                    border-radius: 0.5rem;
                }
                .no-candidates-title { font-size: 1.25rem; font-weight: 600; color: #374151; }
                .no-candidates-text { color: #6b7280; margin-top: 0.5rem; }

                /* Candidate Card */
                .candidate-card {
                    background-color: white; border-radius: 0.75rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    overflow: hidden; transition: all 0.3s ease; border: 1px solid #e5e7eb;
                }
                .candidate-card:hover {
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    transform: translateY(-2px);
                }
                .candidate-card-header {
                    padding: 1.25rem; border-bottom: 1px solid #e5e7eb;
                    background-color: #f9fafb;
                }
                .header-top { display: flex; justify-content: space-between; align-items: center; }
                .candidate-name { font-size: 1.25rem; font-weight: 700; color: #1f2937; }
                .candidate-icon { color: #3b82f6; }
                .header-rating { margin-top: 0.5rem; }
                .candidate-card-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 1.25rem; }

                /* Star Rating */
                .star-rating { display: flex; align-items: center; }
                .star-icon { color: #facc15; }
                .star-icon.full-star { fill: #facc15; }
                .star-icon.half-star { fill: #facc15; }
                .star-icon.empty-star { fill: #e5e7eb; color: #e5e7eb; }
                .rating-text { margin-left: 0.5rem; font-size: 0.875rem; font-weight: 500; color: #4b5563; }

                /* Badges */
                .badges { display: flex; flex-wrap: wrap; gap: 0.75rem; }
                .badge {
                    display: inline-flex; align-items: center; gap: 0.375rem;
                    padding: 0.25rem 0.75rem; font-size: 0.75rem; font-weight: 500; border-radius: 9999px;
                }
                .badge-icon { margin-right: 0.125rem; }
                .domain-badge { color: #1e40af; background-color: #dbeafe; }
                .tier-badge { color: #5b21b6; background-color: #ede9fe; }

                /* Detail Section */
                .detail-section { display: flex; flex-direction: column; gap: 0.5rem; }
                .detail-section-title {
                    display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem;
                    font-weight: 600; color: #4b5563; text-transform: uppercase; margin: 0;
                }
                .detail-section-icon { color: #6b7280; }

                /* Skills */
                .skills-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
                .skill-tag {
                    padding: 0.125rem 0.625rem; font-size: 0.875rem; background-color: #e5e7eb;
                    color: #1f2937; border-radius: 0.375rem; font-weight: 500;
                }

                /* Detail Lists (Exp, Edu, Proj) */
                .detail-list { padding-left: 0; list-style-type: none; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
                .detail-list-item { color: #374151; line-height: 1.4; }
                .item-title { font-weight: 600; color: #1f2937; }
                .item-subtitle { display: block; font-size: 0.75rem; color: #6b7280; }
                .item-description { font-size: 0.875rem; color: #4b5563; margin: 0.25rem 0 0 0; }

                /* Keyframes for spinner */
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
};

export default JobApplicantsDashboard;

