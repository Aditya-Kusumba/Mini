import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Play, Send, ChevronRight } from "lucide-react";
import Editor from "@monaco-editor/react";
import api from "../../utils/api";
import "./Exam.css";

const LANGS = [
  { key: "python", label: "Python 3" },
  { key: "javascript", label: "JavaScript" },
  { key: "java", label: "Java" }
];

export default function ProblemView() {
  const { problemId } = useParams();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);

  const [lang, setLang] = useState("python");
  const [code, setCode] = useState("");

  const [runResults, setRunResults] = useState(null);
  const [submitResults, setSubmitResults] = useState(null);

  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [leftWidth, setLeftWidth] = useState(50);
  const isResizing = useRef(false);

  // 🔥 NEW STATES
  const [submissions, setSubmissions] = useState([]);
  const [timer, setTimer] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const [leftTab, setLeftTab] = useState("desc");
  const [rightTab, setRightTab] = useState("testcases");

  const [expandedSubmission, setExpandedSubmission] = useState(null);

  // ── FETCH ─────────────────
  useEffect(() => {
    api.get(`/api/problems/${problemId}`)
      .then(res => {
        const data = res.data.data;

        const formatted = {
          ...data.problem,
          sampleTestCases: data.testCases?.filter(tc => tc.is_sample) || [],
          allTestCases: data.testCases || []
        };

        setProblem(formatted);
        setCode(formatted.boilerplate?.[lang] || "");

        if (data.meta) {
          setTimer(data.meta);
          setSubmissions(data.meta.submissions || []);
        }
      })
      .finally(() => setLoading(false));
  }, [problemId]);

  // ── TIMER ─────────────────
  useEffect(() => {
    if (!timer?.start_time) return;

    const start = new Date(timer.start_time).getTime();
    const end = timer.end_time ? new Date(timer.end_time).getTime() : null;

    const interval = setInterval(() => {
      const now = end || Date.now();
      setTimeElapsed(Math.floor((now - start) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
  };

  // ── RUN ─────────────────
  const handleRun = async () => {
    setRunning(true);
    setRunResults(null);

    try {
      const res = await api.post(`/api/problems/${problemId}/run`, {
        code,
        language: lang
      });

      setRunResults(res.data.data.results);
      setRightTab("results");
    } catch {
      setRunResults([{ passed: false, error: "Run failed" }]);
    }

    setRunning(false);
  };

  // ── SUBMIT ─────────────────
  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      await api.post(`/api/problems/${problemId}/submit`, {
        code,
        language: lang
      });

      const fresh = await api.get(`/api/problems/${problemId}`);
      const meta = fresh.data.data.meta;

      setSubmissions(meta.submissions || []);
      setTimer(meta);
      setLeftTab("submissions");

    } catch {
      alert("Submit failed");
    }

    setSubmitting(false);
  };

  if (loading) return <div>Loading...</div>;
  if (!problem) return <div>Problem not found</div>;

  return (
    <div className="exam-root">

      {/* TOP */}
      <div className="exam-bar">
        <Link to="/problems">Problems</Link>
        <ChevronRight size={12} />
        {problem.title}

        <div style={{ marginLeft: "auto", fontWeight: "bold" }}>
          ⏱ {formatTime(timeElapsed)}
        </div>
      </div>

      <div className="exam-body">

        {/* LEFT */}
        <div className="exam-left" style={{ width: `${leftWidth}%` }}>

          <div className="exam-tabs">
            <button className={`exam-tab ${leftTab === "desc" ? "active" : ""}`}
              onClick={() => setLeftTab("desc")}>
              Description
            </button>

            <button className={`exam-tab ${leftTab === "submissions" ? "active" : ""}`}
              onClick={() => setLeftTab("submissions")}>
              Submissions
            </button>
          </div>

          <div className="exam-scroll">

            {leftTab === "desc" && (
              <>
                <div className="prob-title">{problem.title}</div>
                <div className="prob-desc">{problem.description}</div>

                <div className="section">
                  <div className="section-title">Examples</div>

                  {problem.sampleTestCases.map((tc, i) => (
                    <div key={i} className="example-block">
                      <div className="example-num">Example {i + 1}</div>

                      <div className="example-row">
                        <span className="example-label">Input</span>
                        <pre className="example-code">
                          {JSON.stringify(tc.input_json, null, 2)}
                        </pre>
                      </div>

                      <div className="example-row">
                        <span className="example-label">Output</span>
                        <pre className="example-code">
                          {JSON.stringify(tc.expected_output_json)}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {leftTab === "submissions" && (
              <>
                {submissions.length === 0 && <div>No submissions</div>}

                {submissions.map((s, i) => (
                  <div key={s.id} className="sub-row">
                    <b>{s.status}</b>
                    <span>Score: {s.score}</span>

                    <button onClick={() =>
                      setExpandedSubmission(expandedSubmission === s.id ? null : s.id)
                    }>
                      Code
                    </button>

                    <span className="sub-time">
                      {new Date(s.submittedAt).toLocaleString()}
                    </span>

                    {expandedSubmission === s.id && (
                      <pre>{s.code}</pre>
                    )}
                  </div>
                ))}
              </>
            )}

          </div>
        </div>

        <div className="resize-handle" />

        {/* RIGHT */}
        <div className="exam-right">

          <div className="editor-bar">
            <select value={lang} onChange={e => setLang(e.target.value)}>
              {LANGS.map(l => (
                <option key={l.key} value={l.key}>{l.label}</option>
              ))}
            </select>

            <button onClick={handleRun}><Play size={12}/> Run</button>
            <button onClick={handleSubmit}><Send size={12}/> Submit</button>
          </div>

          <Editor height="60%" language={lang} value={code}
            onChange={(v)=>setCode(v||"")} theme="vs-dark" />

          <div className="results-panel">

            <div className="results-tabs">
              <button className={`results-tab ${rightTab==="testcases"?"active":""}`}
                onClick={()=>setRightTab("testcases")}>
                Testcases
              </button>

              <button className={`results-tab ${rightTab==="results"?"active":""}`}
                onClick={()=>setRightTab("results")}>
                Results
              </button>
            </div>

            <div className="results-body">

              {/* TESTCASES */}
              {rightTab==="testcases" && (
                problem.sampleTestCases.map((tc,i)=>(
                  <div key={i} className="example-block">
                    <b>Input</b>
                    <pre>{JSON.stringify(tc.input_json,null,2)}</pre>
                    <b>Expected</b>
                    <pre>{JSON.stringify(tc.expected_output_json)}</pre>
                  </div>
                ))
              )}

              {/* RESULTS */}
              {rightTab==="results" && (
                <>
                  {running && <div>Running...</div>}

                  {runResults && runResults.map((r,i)=>(
                    <div key={i} className={`tc-result ${r.passed?"pass":"fail"}`}>
                      <div className="tc-result-title">
                        Testcase {i+1} {r.passed?"✅":"❌"}
                      </div>

                      {r.error ? (
                        <div className="tc-err">{r.error}</div>
                      ) : (
                        <div className="tc-result-grid">
                          <div className="tc-result-key">Input</div>
                          <div className="tc-result-val">{JSON.stringify(r.input)}</div>

                          <div className="tc-result-key">Expected</div>
                          <div className="tc-result-val">{JSON.stringify(r.expected)}</div>

                          <div className="tc-result-key">Output</div>
                          <div className="tc-result-val">{JSON.stringify(r.actual)}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}