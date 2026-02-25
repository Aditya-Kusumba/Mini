import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ContestLobby = () => {
    const navigate = useNavigate();
    const [allEvents, setAllEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [userParticipations, setUserParticipations] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // Fetch all contests/exams. This now includes the domain_name
                const eventsRes = await fetch('/api/contests', { credentials: 'include' });
                if (!eventsRes.ok) throw new Error('Failed to fetch events.');
                const eventsResult = await eventsRes.json();
                
                // Fetch the user's participation history to know what they've completed
                const participationRes = await fetch('/api/users/me/participations', { credentials: 'include' });
                if (!participationRes.ok) throw new Error('Failed to fetch user participation data.');
                const participationResult = await participationRes.json();
                
                // Create a Set of domain IDs where the user has a "passing" score in a SHIFTING_TEST
                // We'll assume any score > 0 counts as "completed".
                const completedSoloDomains = new Set(
                    participationResult.data
                        .filter(p => p.type === 'SHIFTING_TEST' && p.score > 0) 
                        .map(p => p.domain_id)
                );
                
                setUserParticipations(completedSoloDomains);
                setAllEvents(eventsResult.data || []);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    // This effect filters the events based on the user's completion status
    useEffect(() => {
        const filtered = allEvents.filter(event => {
            // Rule 1: Always show Solo Exams (SHIFTING_TEST)
            if (event.type === 'SHIFTING_TEST') {
                return true;
            }
            // Rule 2: Only show Competitive Contests if the user has passed the solo exam for that domain
            if (event.type === 'INTERNAL_CONTEST') {
                return userParticipations.has(event.domain_id);
            }
            return false;
        });
        setFilteredEvents(filtered);
    }, [allEvents, userParticipations]);

    // Group the filtered events by their domain_name
    const groupedEvents = useMemo(() => {
        return filteredEvents.reduce((acc, event) => {
            const domainName = event.domain_name || 'Backend';
            if (!acc[domainName]) {
                acc[domainName] = [];
            }
            acc[domainName].push(event);
            return acc;
        }, {});
    }, [filteredEvents]);

    const handleStartExam = async (examId) => {
        try {
            const response = await fetch(`/api/exams/start/${examId}`, {
                method: 'POST',
                credentials: 'include'
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            navigate(`/contest/${examId}`);
        } catch (err) {
            alert(`Error starting exam: ${err.message}`);
        }
    };

    const getStatus = (event) => {
        const { start_time, end_time, type, domain_id } = event;

        // Check completion status for Solo Exams
        if (type === 'SHIFTING_TEST') {
            return userParticipations.has(domain_id)
                ? { text: 'Completed', class: 'finished' }
                : { text: 'Practice Exam', class: 'practice' };
        }
        
        // Check time status for Competitive Contests
        const now = new Date();
        const start = new Date(start_time);
        const end = new Date(end_time);

        if (now < start) return { text: 'Upcoming', class: 'upcoming' };
        if (now >= start && now <= end) return { text: 'Live', class: 'live' };
        return { text: 'Finished', class: 'finished' };
    };

    if (loading) return <div className="lobby-loading">Loading Events...</div>;
    if (error) return <div className="lobby-error">Error: {error}</div>;

    return (
        <>
            <style>
                {`
                .contest-lobby-container {
                    max-width: 1200px;
                    margin: 2rem auto;
                    padding: 0 1rem;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                .contest-lobby-container h1 {
                    font-size: 2.25rem;
                    font-weight: 700;
                    color: #212529;
                    margin-bottom: 2rem;
                }

                /* Domain Group Styling */
                .domain-group {
                    margin-bottom: 3rem;
                }
                .domain-group-header {
                    font-size: 1.75rem;
                    font-weight: 600;
                    color: #343a40;
                    padding-bottom: 0.75rem;
                    border-bottom: 2px solid #0d6efd;
                    margin-bottom: 1.5rem;
                }

                .event-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                    gap: 1.5rem;
                }
                .event-card {
                    background: #fff;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                    transition: box-shadow 0.2s, transform 0.2s;
                }
                .event-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 16px rgba(0,0,0,0.07);
                }
                .event-card.disabled {
                    background-color: #f8f9fa;
                    opacity: 0.7;
                }
                .status-badge {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    padding: 0.3rem 0.7rem;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    text-transform: capitalize;
                }
                .live { background-color: #dc3545; color: white; }
                .upcoming { background-color: #ffc107; color: #343a40; }
                .finished { background-color: #6c757d; color: white; }
                .practice { background-color: #0dcaf0; color: #000; }
                .event-card h3 {
                    margin: 0;
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin-bottom: 0.75rem;
                    padding-right: 70px; /* Space for the badge */
                }
                .event-description {
                    color: #6c757d;
                    font-size: 0.9rem;
                    flex-grow: 1;
                    line-height: 1.5;
                }
                .event-details {
                    font-size: 0.85rem;
                    color: #495057;
                    margin: 1rem 0;
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                .participate-btn {
                    display: block;
                    text-align: center;
                    padding: 0.75rem;
                    background-color: #0d6efd;
                    color: white;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: 500;
                    margin-top: auto;
                    border: none;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                .participate-btn:hover {
                    background-color: #0b5ed7;
                }
                .start-exam {
                    background-color: #198754;
                }
                .start-exam:hover {
                    background-color: #157347;
                }
                .participate-btn:disabled {
                    background-color: #6c757d;
                    cursor: not-allowed;
                }
                .lobby-loading, .lobby-error {
                    text-align: center;
                    font-size: 1.2rem;
                    padding: 4rem;
                    color: #6c757d;
                }
                .lobby-error {
                    color: #dc3545;
                }
                `}
            </style>
            <div className="contest-lobby-container">
                <h1>Exams & Contests</h1>
                
                {Object.keys(groupedEvents).length > 0 ? (
                    Object.entries(groupedEvents).map(([domainName, eventsInGroup]) => (
                        <div key={domainName} className="domain-group">
                            <h2 className="domain-group-header">{domainName}</h2>
                            <div className="event-grid">
                                {eventsInGroup.map(event => {
                                    const status = getStatus(event);
                                    const isDisabled = event.type === 'SHIFTING_TEST' && userParticipations.has(event.domain_id);

                                    return (
                                        <div key={event.contest_id} className={`event-card ${isDisabled ? 'disabled' : ''}`}>
                                            <div className={`status-badge ${status.class}`}>{status.text}</div>
                                            <h3>{event.title}</h3>
                                            <p className="event-description">{event.description}</p>
                                            <div className="event-details">
                                                <span><strong>Type:</strong> {event.type.replace('_', ' ')}</span>
                                                <span><strong>Duration:</strong> {event.duration_minutes} minutes</span>
                                            </div>

                                            {event.type === 'SHIFTING_TEST' ? (
                                                <button 
                                                    onClick={() => handleStartExam(event.contest_id)} 
                                                    className="participate-btn start-exam"
                                                    disabled={isDisabled}
                                                >
                                                    {isDisabled ? 'Completed' : 'Start Exam'}
                                                </button>
                                            ) : (
                                                <Link to={`/contest/${event.contest_id}`} className="participate-btn">
                                                    View Contest
                                                </Link>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="lobby-loading">No events available for you at this time. Complete more Practice Exams to unlock new contests!</div>
                )}
            </div>
        </>
    );
};

export default ContestLobby;