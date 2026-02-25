import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import api from "./axiosConfig";

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

export default function DsaExam({ problem, allProblemIds = [] }) {
  const { problemId } = useParams();

  // State Management - ALL hooks must be called at top level, unconditionally
  const [submissions, setSubmissions] = useState([]);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [customInput, setCustomInput] = useState("");
  const [runOutput, setRunOutput] = useState({ text: "", isError: false });
  const [isRunLoading, setIsRunLoading] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("problem");

  // Helper function to generate a unique key for localStorage
  const getCodeStorageKey = (pId, lang) => `code-${pId}-${lang}`;

  // This effect runs whenever the `problem` changes
  useEffect(() => {
    if (problem) {
      const currentLanguage = "python";
      setLanguage(currentLanguage);

      const savedCode = localStorage.getItem(getCodeStorageKey(problem.id, currentLanguage));
      setCode(savedCode || boilerplateConfig[currentLanguage]);

      if (problem.visibleTestCases?.length > 0) {
        setCustomInput(problem.visibleTestCases[0].input || "");
      }

      setActiveTab("problem");
      setSubmissions([]);
      setSubmissionResult(null);
      setRunOutput({ text: "", isError: false });
    }
  }, [problem]);

  // Fetch submissions for the problem
  const fetchSubmissions = async () => {
    if (submissions.length > 0 && activeTab === "submissions") return; // Avoid refetch

    try {
      const { data } = await api.get(`/submissions/${problemId}`);
      setSubmissions(data);
    } catch (error) {
      console.error("Failed to fetch submissions", error);
    }
  };

  // Handle tab switching
  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    if (tabName === "submissions") {
      fetchSubmissions();
    }
  };

  // Language selection change
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    const savedCode = localStorage.getItem(getCodeStorageKey(problemId, newLanguage));
    setCode(savedCode || boilerplateConfig[newLanguage]);
  };

  // Code editor change handler
  const handleCodeChange = (value) => {
    setCode(value);
    localStorage.setItem(getCodeStorageKey(problemId, language), value);
  };

  // Run code with custom input
  const handleRunCode = async () => {
    setIsRunLoading(true);
    setRunOutput({ text: "", isError: false });
    try {
      const { data } = await api.post("/run", { language, code, input: customInput });
      setRunOutput({ text: data.error || data.output || "Execution finished with no output.", isError: !!data.error });
    } catch (err) {
      setRunOutput({ text: err.response?.data?.error || "An unexpected error occurred.", isError: true });
    } finally {
      setIsRunLoading(false);
    }
  };

  // Submit code for judging
  const handleSubmitCode = async () => {
    setIsSubmitLoading(true);
    setSubmissionResult(null);
    try {
      const { data } = await api.post("/submit", { problemId, code, language });
      setSubmissionResult(data);

      // Refresh submissions list
      const refreshedData = await api.get(`/submissions/${problemId}`);
      setSubmissions(refreshedData.data);
    } catch (err) {
      setSubmissionResult({ error: "Submission failed. The server might be down or there was an error." });
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Navigation between problems
  const currentIndex = allProblemIds.indexOf(parseInt(problemId));
  const prevProblemId = currentIndex > 0 ? allProblemIds[currentIndex - 1] : null;
  const nextProblemId = currentIndex < allProblemIds.length - 1 ? allProblemIds[currentIndex + 1] : null;

  // Early return for loading state AFTER hooks
  if (!problem) {
    return <div>Loading problem data...</div>;
  }

  // JSX Render
  return (
    <>
      <div className="problem-panel">
        <div className="panel-header">
          <div className="tab-navigation">
            <button className={activeTab === "problem" ? "active" : ""} onClick={() => handleTabClick("problem")}>
              Problem
            </button>
            <button className={activeTab === "submissions" ? "active" : ""} onClick={() => handleTabClick("submissions")}>
              Submissions
            </button>
          </div>
          <div className="problem-nav">
            {prevProblemId && (
              <Link to={`/exam/${prevProblemId}`} className="nav-arrow">
                {"< Prev"}
              </Link>
            )}
            {nextProblemId && (
              <Link to={`/exam/${nextProblemId}`} className="nav-arrow">
                {"Next >"}
              </Link>
            )}
          </div>
        </div>
        <div className="tab-content">
          {activeTab === "problem" && (
            <>
              <h2 className="problem-title-main">{problem.title}</h2>
              <p className="problem-description">{problem.description}</p>
              {problem.input_format && (
                <div className="problem-section">
                  <h3 className="section-title">Input Format</h3>
                  <p className="section-content">{problem.input_format}</p>
                </div>
              )}
              {problem.output_format && (
                <div className="problem-section">
                  <h3 className="section-title">Output Format</h3>
                  <p className="section-content">{problem.output_format}</p>
                </div>
              )}
              {problem.constraints && (
                <div className="problem-section">
                  <h3 className="section-title">Constraints</h3>
                  <pre className="section-content code-style">{problem.constraints}</pre>
                </div>
              )}
              {problem.visibleTestCases?.map((tc, index) => (
                <div key={index} className="problem-section">
                  <h3 className="section-title">Example {index + 1}</h3>
                  <div className="io-box">
                    <span className="io-label">Input</span>
                    <pre>{tc.input}</pre>
                  </div>
                  <div className="io-box">
                    <span className="io-label">Output</span>
                    <pre>{tc.expected_output}</pre>
                  </div>
                </div>
              ))}
              {problem.explanation && (
                <div className="problem-section">
                  <h3 className="section-title">Explanation</h3>
                  <p className="section-content">{problem.explanation}</p>
                </div>
              )}
            </>
          )}
          {activeTab === "submissions" && (
            <div className="submissions-list">
              <h3>Recent Submissions</h3>
              {submissions.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Language</th>
                      <th>Score</th>
                      <th>Submitted On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub) => (
                      <tr key={sub.id}>
                        <td className={`status-${sub.status.toLowerCase().replace(" ", "-")}`}>{sub.status}</td>
                        <td>{sub.language}</td>
                        <td>{sub.score}%</td>
                        <td>{new Date(sub.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>You have no recent submissions for this problem.</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="editor-console-panel">
        <div className="editor-settings">
          <select value={language} onChange={(e) => handleLanguageChange(e.target.value)} className="language-select">
            {languageOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <Editor height="55vh" theme="vs-dark" language={language} value={code} onChange={handleCodeChange} options={{ minimap: { enabled: false } }} />
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
              <pre className={runOutput.isError ? "error-output" : "success-output"}>{runOutput.text}</pre>
            </div>
          )}
        </div>
        <div className="action-buttons">
          <button onClick={handleRunCode} disabled={isRunLoading || isSubmitLoading} className="run-btn">
            {isRunLoading ? "Running..." : "Run"}
          </button>
          <button onClick={handleSubmitCode} disabled={isRunLoading || isSubmitLoading} className="submit-btn">
            {isSubmitLoading ? "Submitting..." : "Submit"}
          </button>
        </div>
        {submissionResult && (
          <div className={`final-result-panel ${submissionResult.error || submissionResult.score < 100 ? "failed" : "accepted"}`}>
            {submissionResult.error ? (
              <h3>{submissionResult.error}</h3>
            ) : (
              <>
                <h3>Final Result: {submissionResult.score === 100 ? "✅ Accepted" : "❌ Failed"}</h3>
                <pre>
                  Score: {submissionResult.score}% ({submissionResult.passedCount}/{submissionResult.totalCount} hidden cases)
                </pre>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
