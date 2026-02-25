import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './ExamLobby.css';

export default function ExamLobby() {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/problems');
                setProblems(response.data);
            } catch (err) {
                setError('Failed to load problems. Is the backend server running?');
            } finally {
                setLoading(false);
            }
        };
        fetchProblems();
    }, []);

    if (loading) return <div className="lobby-container"><h1>Loading Exams...</h1></div>;
    if (error) return <div className="lobby-container"><h1>{error}</h1></div>;

    return (
        <div className="lobby-container">
            <h1>Available Coding Challenges</h1>
            <ul className="problem-list">
                {problems.map(problem => (
                    <li key={problem.id} className="problem-item">
                        <Link to={`/exam/${problem.id}`}>
                            <span className="problem-title">{problem.id}. {problem.title}</span>
                            <span className={`problem-category ${problem.category}`}>{problem.category}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}