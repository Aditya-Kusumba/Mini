import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import "./DsaExam.css"; // Import the updated stylesheet

// Configuration for language-specific boilerplate code
const boilerplateConfig = {
    python: `# Start your Python code here`,
    javascript: `// Start your JavaScript code here`,
    java: `public class Main {\n    public static void main(String[] args) {\n        // Start your Java code here\n    }\n}`,
    cpp: `#include <iostream>\n\nint main() {\n    // Start your C++ code here\n    return 0;\n}`,
};

// Options for the language dropdown menu
const languageOptions = [
    { value: "python", label: "Python" },
    { value: "javascript", label: "JavaScript (Node.js)" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
];

// The contestId is passed down from the parent ContestView component
export default function DsaExam({ problem, allProblemIds = [], contestId }) {
    console.log("Contest Id : ", contestId);
    const { problemId: problemIdFromUrl } = useParams();
    // Use the ID from the prop if available (in ContestView), otherwise use the one from the URL (in ExamView)
    const problemId = problem?.id || problemIdFromUrl;

    // State Management
    const [submissions, setSubmissions] = useState([]);
    const [code, setCode] = useState("");
    const [language, setLanguage] = useState("python");
    const [customInput, setCustomInput] = useState("");
    const [runOutput, setRunOutput] = useState({ text: "", isError: false });
    const [isRunLoading, setIsRunLoading] = useState(false);
    const [submissionResult, setSubmissionResult] = useState(null);
    const [isSubmitLoading, setIsSubmitLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("problem");

    const getCodeStorageKey = (pId, lang) => `code-${pId}-${lang}`;

    useEffect(() => {
        if (problem) {
            const currentLanguage = "python";
            setLanguage(currentLanguage);
            const savedCode = localStorage.getItem(getCodeStorageKey(problem.id, currentLanguage));
            setCode(savedCode || boilerplateConfig[currentLanguage] || "");
            if (problem.visibleTestCases?.length > 0) {
                setCustomInput(problem.visibleTestCases[0].input || "");
            }
            // Reset state for the new problem
            setActiveTab("problem");
            setSubmissions([]);
            setSubmissionResult(null);
            setRunOutput({ text: "", isError: false });
        }
    }, [problem]);

    const fetchSubmissions = async () => {
        if (!problemId) return;
        try {
            const response = await fetch(`http://localhost:5000/api/problems/${problemId}/submissions`, { credentials: 'include' });
            if (!response.ok) throw new Error("Network response was not ok");
            const result = await response.json();
            setSubmissions(result.data || []);
        } catch (error) {
            console.error("Failed to fetch submissions", error);
        }
    };
    
    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
        if (tabName === "submissions") {
            fetchSubmissions();
        }
    };

    const handleLanguageChange = (newLanguage) => {
        if (!problemId) return;
        setLanguage(newLanguage);
        const savedCode = localStorage.getItem(getCodeStorageKey(problemId, newLanguage));
        setCode(savedCode || boilerplateConfig[newLanguage] || "");
    };

    const handleCodeChange = (value) => {
        if (!problemId) return;
        setCode(value);
        localStorage.setItem(getCodeStorageKey(problemId, language), value);
    };

    const handleRunCode = async () => {
        setIsRunLoading(true);
        setRunOutput({ text: "", isError: false });
        try {
            const response = await fetch("http://localhost:5000/api/problems/run", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language, code, input: customInput })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'An error occurred');
            setRunOutput({ text: data.error || data.output || "Execution finished with no output.", isError: !!data.error });
        } catch (err) {
            setRunOutput({ text: err.message || "An unexpected error occurred.", isError: true });
        } finally {
            setIsRunLoading(false);
        }
    };

    const handleSubmitCode = async () => {
        setIsSubmitLoading(true);
        setSubmissionResult(null);
        try {
            const response = await fetch("http://localhost:5000/api/problems/submit", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ problemId, code, language, contestId })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Submission failed');
            
            // ✅ FIX: Correctly set the submission result from the API response's data property
            setSubmissionResult(data.data); 
            
            await fetchSubmissions();
        } catch (err) {
            setSubmissionResult({ error: err.message || "Submission failed." });
        } finally {
            setIsSubmitLoading(false);
        }
    };

    const currentIndex = allProblemIds.indexOf(parseInt(problemId));
    const prevProblemId = currentIndex > 0 ? allProblemIds[currentIndex - 1] : null;
    const nextProblemId = currentIndex < allProblemIds.length - 1 ? allProblemIds[currentIndex + 1] : null;

    if (!problem) {
        return <div className="loading-container">Loading problem...</div>;
    }

    return (
        <div className="dsa-exam-layout">
            <div className="problem-panel">
                <div className="panel-header">
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
                    {activeTab === 'problem' && (
                        <>
                            <h2 className="problem-title-main">{problem.title}</h2>
                            <p className="problem-description">{problem.description}</p>
                            {/* ... (full problem details JSX) ... */}
                        </>
                    )}
                    {activeTab === 'submissions' && (
                        <div className="submissions-list">
                           {/* ... (submissions table JSX) ... */}
                        </div>
                    )}
                </div>
            </div>

            <div className="editor-console-panel">
                <div className="editor-header">
                    <div className="editor-settings">
                        <select value={language} onChange={(e) => handleLanguageChange(e.target.value)} className="language-select">
                            {languageOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                    <div className="action-buttons">
                        <button onClick={handleRunCode} disabled={isRunLoading || isSubmitLoading} className="run-btn">
                            {isRunLoading ? "Running..." : "Run"}
                        </button>
                        <button onClick={handleSubmitCode} disabled={isRunLoading || isSubmitLoading} className="submit-btn">
                            {isSubmitLoading ? "Submitting..." : "Submit"}
                        </button>
                    </div>
                </div>
                <Editor
                    height="55vh"
                    theme="vs-dark"
                    language={language}
                    value={code}
                    onChange={handleCodeChange}
                    options={{ minimap: { enabled: false } }}
                />
                <div className="custom-test-console">
                    <textarea
                        className="custom-input-textarea"
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="Enter custom input..."
                    />
                    {runOutput.text && (
                        <div className="console-output-box">
                            <strong>Output:</strong>
                            <pre className={runOutput.isError ? 'error-output' : 'success-output'}>
                                {runOutput.text}
                            </pre>
                        </div>
                    )}
                </div>
                {/* ✅ FIX: The result panel is now fully implemented */}
                {submissionResult && (
                    <div className={`final-result-panel ${submissionResult.error || parseInt(submissionResult.score) < 100 ? 'failed' : 'accepted'}`}>
                        {submissionResult.error ? (
                            <h3>{submissionResult.error}</h3>
                        ) : (
                            <>
                                <h3>
                                    {parseInt(submissionResult.score) === 100 ? "✅ Accepted" : "❌ Failed"}
                                </h3>
                                <p className="result-details">
                                    You passed {submissionResult.passedCount} out of {submissionResult.totalCount} hidden test cases.
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

