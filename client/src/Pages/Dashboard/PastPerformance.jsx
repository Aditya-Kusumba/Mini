import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BarChart, Calendar, Award, Star } from 'lucide-react';

const PastPerformance = () => {
    const [performances, setPerformances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth(); // To get the user's ID for the API call

    useEffect(() => {
        if (!user) {
            setLoading(false);
            setError("Please log in to see your performance history.");
            return;
        }

        const fetchPerformanceHistory = async () => {
            setLoading(true);
            try {
                // This is a new, dedicated endpoint to get a user's full performance history.
                // We will need to create this on the backend.
                const response = await fetch(`/api/users/me/performancehistory`, {
                    credentials: 'include'
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch performance history');
                }
                const result = await response.json();
                setPerformances(result.data || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPerformanceHistory();
    }, [user]);

    if (loading) {
        return <div className="performance-loading">Loading performance history...</div>;
    }

    if (error) {
        return <div className="performance-error">Error: {error}</div>;
    }

    return (
        <>
            <style>
                {`
                .performance-history-container {
                    max-width: 900px;
                    margin: 2rem auto;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                .performance-history-container h2 {
                    font-size: 1.75rem;
                    font-weight: 600;
                    color: #343a40;
                    margin-bottom: 1.5rem;
                }
                .performance-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .performance-card {
                    display: grid;
                    grid-template-columns: auto 1fr auto auto;
                    gap: 1.5rem;
                    align-items: center;
                    padding: 1.5rem;
                    background-color: #fff;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                .event-icon {
                    padding: 0.75rem;
                    border-radius: 50%;
                }
                .type-contest { background-color: #cfe2ff; color: #0d6efd; }
                .type-exam { background-color: #d1e7dd; color: #198754; }

                .event-info h3 {
                    margin: 0;
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #212529;
                }
                .event-info p {
                    margin: 0.25rem 0 0 0;
                    font-size: 0.9rem;
                    color: #6c757d;
                }
                .event-stat {
                    text-align: right;
                }
                .stat-label {
                    font-size: 0.8rem;
                    color: #6c757d;
                    margin-bottom: 0.25rem;
                    display: block;
                }
                .stat-value {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #212529;
                }
                .empty-state {
                    text-align: center;
                    padding: 3rem;
                    color: #6c757d;
                    font-size: 1.1rem;
                }
                .performance-loading, .performance-error {
                    text-align: center;
                    font-size: 1.2rem;
                    padding: 4rem;
                    color: #6c757d;
                }
                .performance-error {
                    color: #dc3545;
                }
                `}
            </style>
            <div className="performance-history-container">
                <h2>Performance History</h2>
                <div className="performance-list">
                    {performances.length > 0 ? (
                        performances.map(item => (
                            <Link to={`/contest/${item.contest_id}`} key={item.participation_id} className="performance-card" style={{textDecoration: 'none'}}>
                                <div className={`event-icon ${item.type === 'INTERNAL_CONTEST' ? 'type-contest' : 'type-exam'}`}>
                                    {item.type === 'INTERNAL_CONTEST' ? <Trophy size={24} /> : <Star size={24} />}
                                </div>
                                <div className="event-info">
                                    <h3>{item.title}</h3>
                                    <p>{item.domain_name} | {new Date(item.start_time).toLocaleDateString()}</p>
                                </div>
                                <div className="event-stat">
                                    <span className="stat-label">Your Score</span>
                                    <span className="stat-value">{parseInt(item.score)}%</span>
                                </div>
                                <div className="event-stat">
                                    <span className="stat-label">Your Rank</span>
                                    <span className="stat-value">#{item.rank || 'N/A'}</span>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="empty-state">
                            You have no participation history yet.
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default PastPerformance;
