import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import api from "./axiosConfig";

// Helper component to render a table from the query result
const ResultTable = ({ result }) => {
    if (!result || result.length === 0) return <p className="no-results">Query executed successfully, but returned no rows.</p>;
    const headers = Object.keys(result[0]);
    return (
        <div className="result-table-container">
            <table>
                <thead>
                    <tr>{headers.map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                    {result.map((row, i) => (
                        <tr key={i}>{headers.map(h => <td key={h}>{JSON.stringify(row[h])}</td>)}</tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default function SqlExam({ problem, allProblemIds }) {
    const { problemId } = useParams();
    const [query, setQuery] = useState(`-- Write your SQL query here`);
    const [submissionResult, setSubmissionResult] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // ✅ FIX: Add state for tabs and submissions history
    const [activeTab, setActiveTab] = useState('problem');
    const [submissions, setSubmissions] = useState([]);

    // Reset component state when the problem prop changes
    useEffect(() => {
        if (problem) {
            setQuery(`-- Write your SQL query for problem #${problem.id} here\nSELECT * FROM Employees;`);
            setActiveTab('problem');
            setSubmissions([]);
            setSubmissionResult(null);
        }
    }, [problem]);
    
    // Navigation Logic
    const currentIndex = allProblemIds.indexOf(parseInt(problemId));
    const prevProblemId = currentIndex > 0 ? allProblemIds[currentIndex - 1] : null;
    const nextProblemId = currentIndex < allProblemIds.length - 1 ? allProblemIds[currentIndex + 1] : null;

    // ✅ FIX: Add function to fetch submissions
    const fetchSubmissions = async () => {
        if (submissions.length > 0 && activeTab === 'submissions') return;
        try {
            const { data } = await api.get(`/api/submissions/${problemId}`);
            setSubmissions(data);
        } catch (error) {
            console.error("Failed to fetch submissions", error);
        }
    };
    
    // ✅ FIX: Add handler for tab clicks
    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
        if (tabName === 'submissions') {
            fetchSubmissions();
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setSubmissionResult(null);
        try {
            const { data } = await api.post(`/api/submit/sql`, {
                problemId,
                userQuery: query,
            });
            setSubmissionResult(data);
            // After submitting, refresh the submissions list automatically
            const refreshedSubmissions = await api.get(`/api/submissions/${problemId}`);
            setSubmissions(refreshedSubmissions.data);
        } catch (error) {
            setSubmissionResult({ status: 'Error', error: 'Failed to submit query to the server.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="problem-panel">
                <div className="panel-header">
                    {/* ✅ FIX: Add full tab navigation */}
                    <div className="tab-navigation">
                        <button className={activeTab === 'problem' ? 'active' : ''} onClick={() => handleTabClick('problem')}>Problem</button>
                        <button className={activeTab === 'submissions' ? 'active' : ''} onClick={() => handleTabClick('submissions')}>Submissions</button>
                    </div>
                    <div className="problem-nav">
                        {prevProblemId && <Link to={`/exam/${prevProblemId}`} className="nav-arrow">{'< Prev'}</Link>}
                        {nextProblemId && <Link to={`/exam/${nextProblemId}`} className="nav-arrow">{'Next >'}</Link>}
                    </div>
                </div>
                <div className="tab-content">
                    {/* ✅ FIX: Conditional rendering based on activeTab */}
                    {activeTab === 'problem' && (
                        <>
                            <h2 className="problem-title-main">{problem.title}</h2>
                            <p className="problem-description">{problem.description}</p>
                            {problem.input_format && <div className="problem-section"><h3 className="section-title">Table Schema</h3><pre className="section-content code-style">{problem.input_format}</pre></div>}
                            {problem.output_format && <div className="problem-section"><h3 className="section-title">Output Format</h3><p className="section-content">{problem.output_format}</p></div>}
                        </>
                    )}
                    {activeTab === 'submissions' && (
                         <div className="submissions-list">
                            <h3>Recent Submissions</h3>
                            {submissions.length > 0 ? (
                                <table>
                                    <thead><tr><th>Status</th><th>Language</th><th>Score</th><th>Submitted On</th></tr></thead>
                                    <tbody>
                                        {submissions.map(sub => (
                                            <tr key={sub.id}>
                                                <td className={`status-${sub.status.toLowerCase().replace(' ', '-')}`}>{sub.status}</td>
                                                <td>{sub.language}</td>
                                                <td>{sub.score}%</td>
                                                <td>{new Date(sub.created_at).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (<p>You have no recent submissions for this problem.</p>)}
                        </div>
                    )}
                </div>
            </div>

            <div className="editor-console-panel">
                <Editor height="40vh" theme="vs-dark" language="sql" value={query} onChange={setQuery} options={{ minimap: { enabled: false } }} />
                <div className="action-buttons">
                    <button onClick={handleSubmit} disabled={isSubmitting} className="submit-btn">{isSubmitting ? "Running..." : "Run & Submit"}</button>
                </div>
                {submissionResult && (
                    <div className="sql-result-panel">
                        <h3>Result: <span className={`status-${submissionResult.status?.toLowerCase().replace(' ', '-')}`}>{submissionResult.status}</span></h3>
                        {submissionResult.error && <pre className="error-output">{submissionResult.error}</pre>}
                        {submissionResult.result && <ResultTable result={submissionResult.result} />}
                    </div>
                )}
            </div>
        </>
    );
}