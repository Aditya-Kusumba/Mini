import React, { useState, useEffect } from 'react';
import './AdminAcess.css'; // Assuming this is your stylesheet

const CreateEvent = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'INTERNAL_CONTEST',
        start_time: '',
        duration_minutes: '90',
        domain_id: '',
        problemIds: []
    });
    const [allProblems, setAllProblems] = useState([]);
    const [filteredProblems, setFilteredProblems] = useState([]);
    const [domains, setDomains] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // New state for contests and sorting
    const [contests, setContests] = useState([]);
    const [sortStatus, setSortStatus] = useState({}); // key: contest_id, value: "loading" | "success" | "error"

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setDomains([
                    { domain_id: 1, domain_name: 'Frontend' }, 
                    { domain_id: 2, domain_name: 'Backend' },
                    { domain_id: 3, domain_name: 'Data Analysis' },
                    { domain_id: 4, domain_name: 'ML' }
                ]);
                setAllProblems([
                    { id: 1, title: 'Two Sum', domain_id: 2 },
                    { id: 2, title: 'Reverse a String', domain_id: 2 },
                    { id: 5, title: 'FizzBuzz', domain_id: 2 },
                    { id: 10, title: 'Build a Counter Hook', domain_id: 1 },
                    { id: 11, title: 'Implement a CSS Grid', domain_id: 1 },
                    { id: 12, title: 'Validate Palindrome', domain_id: 2 },
                ]);
                await fetchContests(); // fetch all contests on mount
            } catch (err) {
                setError("Failed to load initial data.");
            }
        };
        fetchInitialData();
    }, []);

    const fetchContests = async () => {
        try {
            const res = await fetch('/api/contests', {
                method: 'GET',
                credentials: 'include'
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || 'Failed to fetch contests');
            setContests(result.data || []);
        } catch (err) {
            console.error(err);
            setError("Error fetching contests: " + err.message);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            if (name === 'domain_id') {
                newState.problemIds = [];
                setFilteredProblems(allProblems.filter(p => p.domain_id === parseInt(value)));
            }
            return newState;
        });
    };

    const handleProblemSelect = (e) => {
        const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value));
        setFormData(prev => ({ ...prev, problemIds: selectedIds }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');
        try {
            const response = await fetch('/api/contests/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            setMessage(`Successfully created event with ID: ${result.data.contest_id}`);
            setFormData({
                title: '',
                description: '',
                type: 'INTERNAL_CONTEST',
                start_time: '',
                duration_minutes: '90',
                domain_id: '',
                problemIds: []
            });
            setFilteredProblems([]);
            fetchContests(); // refresh contest list after creation
        } catch (err) {
            setError(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = async (contestId) => {
        setSortStatus(prev => ({ ...prev, [contestId]: 'loading' }));
        try {
            const res = await fetch(`/api/contests/sort/${contestId}`, {
                method: 'GET',
                credentials: 'include'
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            setSortStatus(prev => ({ ...prev, [contestId]: 'success' }));
        } catch (err) {
            console.error(err);
            setSortStatus(prev => ({ ...prev, [contestId]: 'error' }));
        }
    };

    return (
        <div className="create-event-form-container">
            <h2>Create New Exam or Contest</h2>
            {message && <p className="message success">{message}</p>}
            {error && <p className="message error">{error}</p>}

            <form onSubmit={handleSubmit} className="create-event-form">
                <div className="form-group">
                    <label>Event Type</label>
                    <select name="type" value={formData.type} onChange={handleInputChange}>
                        <option value="INTERNAL_CONTEST">Contest (Competitive, Scheduled)</option>
                        <option value="SHIFTING_TEST">Exam (Solo, On-Demand)</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Title</label>
                    <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                    <label>Description</label>
                    <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3"></textarea>
                </div>
                <div className="form-row">
                    {formData.type === 'INTERNAL_CONTEST' && (
                        <div className="form-group">
                            <label>Start Time</label>
                            <input
                                type="datetime-local"
                                name="start_time"
                                value={formData.start_time}
                                onChange={handleInputChange}
                                required={formData.type === 'INTERNAL_CONTEST'}
                            />
                        </div>
                    )}
                    <div className="form-group">
                        <label>Duration (in minutes)</label>
                        <input
                            type="number"
                            name="duration_minutes"
                            value={formData.duration_minutes}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label>Domain</label>
                    <select name="domain_id" value={formData.domain_id} onChange={handleInputChange} required>
                        <option value="" disabled>Select a domain</option>
                        {domains.map(d => (
                            <option key={d.domain_id} value={d.domain_id}>
                                {d.domain_name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Select Problems (Hold Ctrl/Cmd to select multiple)</label>
                    <select
                        name="problemIds"
                        multiple
                        value={formData.problemIds}
                        onChange={handleProblemSelect}
                        required
                        size="8"
                        disabled={!formData.domain_id}
                    >
                        {filteredProblems.length > 0 ? (
                            filteredProblems.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.title}
                                </option>
                            ))
                        ) : (
                            <option disabled>
                                {formData.domain_id
                                    ? 'No problems found for this domain'
                                    : 'Please select a domain first'}
                            </option>
                        )}
                    </select>
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Event'}
                </button>
            </form>

            {/* 🟨 Contests list section */}
            <div className="contest-list">
                <h2>All Contests</h2>
                {contests.length === 0 ? (
                    <p>No contests found.</p>
                ) : (
                    <ul className="contest-items">
                        {contests.map((contest) => (
                            <li key={contest.contest_id} className="contest-item">
                                <div>
                                    <strong>{contest.title}</strong> (ID: {contest.contest_id})<br />
                                    Type: {contest.type} | Domain ID: {contest.domain_id}<br />
                                    Start: {contest.start_time || 'N/A'} | Duration: {contest.duration_minutes} min
                                </div>
                                <button onClick={() => handleSort(contest.contest_id)} disabled={sortStatus[contest.contest_id] === 'loading'}>
                                    {sortStatus[contest.contest_id] === 'loading' && 'Sorting...'}
                                    {sortStatus[contest.contest_id] === 'success' && '✅ Sorted'}
                                    {sortStatus[contest.contest_id] === 'error' && '❌ Failed - Retry'}
                                    {!sortStatus[contest.contest_id] && 'Sort Participants'}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default CreateEvent;
