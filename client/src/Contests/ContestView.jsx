import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DsaExam from '../Exam/DsaExam';
import SqlExam from '../Exam/SqlExam';
import ReactExam from '../Exam/ReactExam';
import './ContestView.css';

const ContestView = () => {
    const { contestId } = useParams();
    const navigate = useNavigate(); // Hook for navigation
    const [contest, setContest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProblem, setSelectedProblem] = useState(null);
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const fetchContest = async () => {
            if (!contestId) {
                setError('Contest ID is missing!');
                setLoading(false);
                return;
            }
            try {
                // This request hits your "smart" getContestById controller
                const response = await fetch(`/api/contests/${contestId}`, { credentials: 'include' });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch contest data.');
                }
                const result = await response.json();
                setContest(result.data);

                // Automatically select the first problem to display
                if (result.data.problems && result.data.problems.length > 0) {
                    setSelectedProblem(result.data.problems[0]);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchContest();
    }, [contestId]);

    // Timer effect with auto-redirect
    useEffect(() => {
        // Don't start the timer until the contest data (with its end_time) is loaded
        if (!contest || !contest.end_time) {
            return;
        }

        const interval = setInterval(() => {
            const now = new Date();
            const end = new Date(contest.end_time);
            const diff = end - now;

            if (diff <= 0) {
                setTimeLeft('00:00:00');
                clearInterval(interval);
                // ✅ FIX: Redirect to dashboard when time is up
                alert("Time's up! You will now be redirected to the dashboard.");
                navigate('/dashboard');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [contest, navigate]);

    // This function dynamically renders the correct exam component based on the problem's category
    const renderExamComponent = () => {
        if (!selectedProblem) {
            return <div className="view-loading">Select a problem to begin.</div>;
        }

        const commonProps = {
            problem: selectedProblem,
            allProblemIds: contest.problems.map((p) => p.id),
            contestId: contest.contest_id, // Pass the contestId to the exam component
        };

        switch (selectedProblem.category) {
            case 'dsa':
                return <DsaExam {...commonProps} />;
            case 'sql':
                return <SqlExam {...commonProps} />;
            case 'react':
                return <ReactExam {...commonProps} />;
            default:
                return <div>Unsupported problem category: {selectedProblem.category}</div>;
        }
    };

    if (loading) return <div className="view-loading">Loading Contest...</div>;
    if (error) return <div className="view-error">Error: {error}</div>;
    if (!contest) return <div>Contest not found.</div>;

    // Handle the submit button click event (navigating to the dashboard)
    const handleSubmitContest = () => {
        if (window.confirm("Are you sure you want to submit the entire contest? This action cannot be undone.")) {
            navigate('/dashboard'); // Navigating to the dashboard route
        }
    };

    return (
        <div className="contest-view-layout">
            <div className="contest-sidebar">
                <div className="contest-header">
                    <h2>{contest.title}</h2>
                    <div className="timer">{timeLeft || 'Calculating...'}</div>
                </div>
                <div className="problem-list">
                    <h4>Problems</h4>
                    <ul>
                        {contest.problems.map((prob, index) => (
                            <li
                                key={prob.id}
                                className={selectedProblem?.id === prob.id ? 'active' : ''}
                                onClick={() => setSelectedProblem(prob)}
                            >
                                {index + 1}. {prob.title}
                            </li>
                        ))}
                    </ul>
                </div>
                <button
                    className="submit-contest-button"
                    onClick={handleSubmitContest}
                >
                    Submit Contest
                </button>
            </div>
            <div className="contest-main">
                {renderExamComponent()}
            </div>
        </div>
    );
};

export default ContestView;

