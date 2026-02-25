import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
    SandpackProvider,
    SandpackLayout,
    SandpackCodeEditor,
    SandpackPreview,
    SandpackFileExplorer,
    useSandpack,
} from "@codesandbox/sandpack-react";
import api from "./axiosConfig";

// A component that handles the testing logic from within the Sandpack context
const TestRunner = ({ problem, onTestComplete }) => {
    const { sandpack } = useSandpack();
    const [isTesting, setIsTesting] = useState(false); // State to trigger the test run

    // ✅ THE DEFINITIVE FIX:
    // This useEffect hook listens to Sandpack's internal status.
    // It will only run the tests when 'isTesting' is true AND Sandpack is 'idle'.
    useEffect(() => {
        if (isTesting && sandpack.status === 'idle') {
            const runAllTests = async () => {
                const testResults = [];
                const tests = problem.test_files?.tests || [];

                if (tests.length === 0) {
                    onTestComplete({ score: 0, results: [{ description: "No tests found for this problem.", passed: false }] });
                    setIsTesting(false);
                    return;
                }

                // Run each test sequentially
                for (const test of tests) {
                    try {
                        const result = await sandpack.evaluate(test.code);
                        testResults.push({ description: test.description, passed: result === true });
                    } catch (e) {
                        testResults.push({ description: test.description, passed: false, error: e.message });
                    }
                }

                const passedCount = testResults.filter(r => r.passed).length;
                const score = (passedCount / tests.length) * 100;
                onTestComplete({ score, results: testResults, files: sandpack.files });
                setIsTesting(false); // Reset the trigger
            };

            runAllTests();
        }
    }, [isTesting, sandpack.status]);


    const startTests = () => {
        // This function now only does two things:
        // 1. Reset the Sandpack environment to its initial state.
        // 2. Set the 'isTesting' flag to true, which triggers the useEffect hook.
        sandpack.resetAllFiles();
        setIsTesting(true);
    };

    return (
        <button onClick={startTests} disabled={isTesting} className="submit-btn react-submit-btn">
            {isTesting ? "Running Tests..." : "Run & Submit"}
        </button>
    );
};

export default function ReactExam({ problem, allProblemIds }) {
    const { problemId } = useParams();
    const [activeTab, setActiveTab] = useState('problem');
    const [submissions, setSubmissions] = useState([]);
    const [testReport, setTestReport] = useState(null);

    // This effect runs only when the problem prop itself changes, resetting state
    useEffect(() => {
        setTestReport(null);
        setActiveTab('problem');
        setSubmissions([]);
    }, [problem]);

    const handleTestComplete = async (report) => {
        setTestReport(report);
        const status = report.score === 100 ? 'Accepted' : 'Wrong Answer';
        try {
            await api.post('/api/submit/react-client', {
                problemId,
                score: report.score,
                status: status,
                files: report.files
            });
            fetchSubmissions(true);
        } catch (error) {
            console.error("Failed to save submission:", error);
        }
    };

    const fetchSubmissions = async (forceRefresh = false) => {
        if (submissions.length > 0 && !forceRefresh) return;
        try {
            const { data } = await api.get(`/api/submissions/${problemId}`);
            setSubmissions(data);
        } catch (error) {
            console.error("❌ Failed to fetch submissions", error);
        }
    };

    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
        if (tabName === 'submissions') {
            fetchSubmissions();
        }
    };

    const currentIndex = allProblemIds.indexOf(parseInt(problemId));
    const prevProblemId = currentIndex > 0 ? allProblemIds[currentIndex - 1] : null;
    const nextProblemId = currentIndex < allProblemIds.length - 1 ? allProblemIds[currentIndex + 1] : null;

    return (
        <SandpackProvider
            template="react"
            theme="dark"
            files={problem.initial_files}
            options={{ autorun: false, autoReload: false }} // Turn off autorun for more control
            key={problem.id}
        >
            <div className="problem-panel react-problem-panel">
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
                            <TestRunner problem={problem} onTestComplete={handleTestComplete} />
                            {testReport && (
                                <div className="test-results-panel">
                                    <h3>Test Results: {testReport.score === 100 ? '✅' : '❌'} {testReport.score.toFixed(0)}%</h3>
                                    <ul>
                                        {testReport.results.map((result, index) => (
                                            <li key={index} className={result.passed ? 'passed' : 'failed'}>
                                                {result.passed ? '✅' : '❌'} {result.description}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    )}
                    {activeTab === 'submissions' && (
                       <div className="submissions-list">
                            <h3>Recent Submissions</h3>
                            {submissions.length > 0 ? (
                                <table>
                                    <thead><tr><th>Status</th><th>Score</th><th>Submitted On</th></tr></thead>
                                    <tbody>
                                        {submissions.map(sub => (
                                            <tr key={sub.id}>
                                                <td className={`status-${sub.status.toLowerCase().replace(' ', '-')}`}>{sub.status}</td>
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
            <SandpackLayout className="sandpack-layout-panel">
                <SandpackFileExplorer />
                <SandpackCodeEditor closableTabs wrapContent />
                <SandpackPreview />
            </SandpackLayout>
        </SandpackProvider>
    );
}