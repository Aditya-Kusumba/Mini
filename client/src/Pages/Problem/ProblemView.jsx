import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Play, Send, RotateCcw, CheckCircle, XCircle,
  AlertCircle, List, ChevronRight, Clock,
} from 'lucide-react';
import api from '../../utils/api';
import './Exam.css';

// ── Language configs ──────────────────────────────────────────
const LANGS = [
  { key: 'python', label: 'Python 3'   },
  { key: 'java',   label: 'Java'       },
  { key: 'cpp',    label: 'C++'        },
  { key: 'c',      label: 'C'          },
  { key: 'js',     label: 'JavaScript' },
];

// ── Starter code templates ────────────────────────────────────
const STARTERS = {
  python: `import sys

def solve():
    data = sys.stdin.read().strip().split('\\n')
    # data[0] is first line, data[1] is second line, etc.
    
    # Write your solution here
    result = ""
    print(result)

solve()
`,
  java: `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        // String line = br.readLine();
        // int n = Integer.parseInt(line.trim());
        
        // Write your solution here
        System.out.println("output");
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Read input: string s; getline(cin, s);
    // int n; cin >> n;
    
    // Write your solution here
    cout << "output" << endl;
    return 0;
}
`,
  c: `#include <stdio.h>
#include <string.h>
#include <stdlib.h>

int main() {
    // char line[1000]; fgets(line, sizeof(line), stdin);
    // int n; scanf("%d", &n);
    
    // Write your solution here
    printf("output\\n");
    return 0;
}
`,
  js: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
// lines[0], lines[1] etc. are input lines
// const nums = lines[0].split(' ').map(Number);

// Write your solution here
const result = "output";
console.log(result);
`,
};

// ── Difficulty badge ──────────────────────────────────────────
const DIFF = { Easy: 'badge-green', Medium: 'badge-amber', Hard: 'badge-red' };

// ── Timer (counts up from 0) ──────────────────────────────────
function Timer() {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSec(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
      color: 'var(--text-2)',
      background: 'var(--bg-2)', border: '1px solid var(--border)',
      borderRadius: 6, padding: '4px 10px',
    }}>
      <Clock size={12} /> {m}:{s}
    </div>
  );
}

export default function ProblemView() {
  const { problemId } = useParams();
  const taRef = useRef(null);

  const [problem,     setProblem]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [lang,        setLang]        = useState('python');
  const [code,        setCode]        = useState(STARTERS.python);
  const [leftTab,     setLeftTab]     = useState('problem');
  const [rightTab,    setRightTab]    = useState('cases');
  const [running,     setRunning]     = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [runResults,  setRunResults]  = useState(null);
  const [submitRes,   setSubmitRes]   = useState(null);
  const [submissions, setSubmissions] = useState([]);

  // Load problem
  useEffect(() => {
    api.get(`/api/exam/problems/${problemId}`)
      .then(r => setProblem(r.data?.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [problemId]);

  // Change language
  const changeLang = (l) => {
    if (code !== STARTERS[lang]) {
      if (!window.confirm(`Switch to ${LANGS.find(x => x.key === l)?.label}? Starter template will replace your code.`)) return;
    }
    setLang(l); setCode(STARTERS[l]);
    setRunResults(null); setSubmitRes(null);
  };

  // Tab key → 2 spaces
  const onKeyDown = (e) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const { selectionStart: s, selectionEnd: en } = e.target;
    const next = code.slice(0, s) + '  ' + code.slice(en);
    setCode(next);
    requestAnimationFrame(() => {
      taRef.current.selectionStart = s + 2;
      taRef.current.selectionEnd   = s + 2;
    });
  };

  // Run (sample cases)
  const handleRun = async () => {
    if (!code.trim() || running) return;
    setRunning(true); setRightTab('output');
    setRunResults(null); setSubmitRes(null);
    try {
      const r = await api.post('/api/exam/run', { code, language: lang, problemId });
      setRunResults(r.data?.data?.results || []);
    } catch (err) {
      setRunResults([{
        passed: false,
        error: err.response?.data?.message || 'Execution failed',
        testCaseId: 0,
      }]);
    } finally { setRunning(false); }
  };

  // Submit (all cases)
  const handleSubmit = async () => {
    if (!code.trim() || submitting) return;
    if (!window.confirm('Submit? This will run against all test cases and be scored.')) return;
    setSubmitting(true); setRightTab('output');
    setRunResults(null); setSubmitRes(null);
    try {
      const r = await api.post('/api/exam/submit', { code, language: lang, problemId });
      setSubmitRes(r.data?.data);
      loadSubmissions();
    } catch (err) {
      setSubmitRes({ error: err.response?.data?.message || 'Submission failed' });
    } finally { setSubmitting(false); }
  };

  const loadSubmissions = useCallback(async () => {
    try {
      const r = await api.get(`/api/exam/submissions/${problemId}`);
      setSubmissions(r.data?.data || []);
    } catch {}
  }, [problemId]);

  useEffect(() => {
    if (leftTab === 'submissions') loadSubmissions();
  }, [leftTab, loadSubmissions]);

  // ── Render loading ──
  if (loading) return (
    <div className="page-loading"><span className="loading-spinner" /> Loading…</div>
  );
  if (!problem) return (
    <div className="page-loading">
      Problem not found. <Link to="/problems" style={{ color: 'var(--accent)' }}>Back</Link>
    </div>
  );

  const scoreColor = submitRes?.score === 100 ? 'var(--green)'
    : submitRes?.score > 0 ? 'var(--amber)' : 'var(--red)';

  return (
    <div className="exam-root">
      {/* ── Top bar ── */}
      <div className="exam-bar">
        <Link to="/problems" className="exam-bar-logo">TierHire</Link>
        <ChevronRight size={13} className="exam-bar-sep" />
        <span className="exam-bar-title">{problem.title}</span>
        <div className="exam-bar-right">
          <span className={`badge ${DIFF[problem.difficulty]}`}>{problem.difficulty}</span>
          {submitRes && !submitRes.error && (
            <span className="badge" style={{
              background: 'rgba(var(--accent-rgb),.1)',
              color: scoreColor, fontWeight: 700,
            }}>
              {submitRes.score}%
            </span>
          )}
          <Timer />
          <Link to="/problems" className="btn btn-secondary btn-sm">← Back</Link>
        </div>
      </div>

      <div className="exam-body">
        {/* ── LEFT ── */}
        <div className="exam-left">
          <div className="exam-tabs">
            {[
              { key: 'problem',     label: 'Problem' },
              { key: 'submissions', label: 'Submissions' },
            ].map(t => (
              <button key={t.key}
                className={`exam-tab${leftTab === t.key ? ' active' : ''}`}
                onClick={() => setLeftTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="exam-scroll">
            {/* Problem tab */}
            {leftTab === 'problem' && (
              <>
                <h2 className="prob-title">{problem.title}</h2>
                <div className="prob-meta">
                  <span className={`badge ${DIFF[problem.difficulty]}`}>{problem.difficulty}</span>
                  {problem.domainName && <span className="badge badge-gray">{problem.domainName}</span>}
                  <span className="badge badge-blue">{problem.totalPoints} pts</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 'auto' }}>
                    {problem.totalTestCases} test cases · {problem.sampleTestCases?.length} visible
                  </span>
                </div>

                <div className="prob-desc">{problem.description}</div>

                {problem.sampleTestCases?.length > 0 && (
                  <>
                    <div className="prob-samples-label">Sample test cases</div>
                    {problem.sampleTestCases.map((tc, i) => (
                      <div key={tc.id} className="tc-block">
                        <div className="tc-label">Example {i + 1}</div>
                        {tc.input && (
                          <div className="tc-row">
                            <span className="tc-key">Input</span>
                            <span className="tc-val">{tc.input}</span>
                          </div>
                        )}
                        <div className="tc-row">
                          <span className="tc-key">Output</span>
                          <span className="tc-val">{tc.expected_output}</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}

            {/* Submissions tab */}
            {leftTab === 'submissions' && (
              <>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
                  My submissions
                </div>
                {submissions.length === 0 ? (
                  <div className="empty-state"><p>No submissions yet.</p></div>
                ) : submissions.map(s => (
                  <div key={s.id} className="sub-row">
                    <span className={`badge ${s.status === 'Solved' ? 'badge-green' : s.status === 'Attempted' ? 'badge-amber' : 'badge-red'}`}>
                      {s.status}
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 13 }}>
                      {s.score}%
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      {LANGS.find(l => l.key === s.language)?.label || s.language}
                    </span>
                    <span className="sub-time">
                      {new Date(s.submittedAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="exam-right">
          {/* Editor toolbar */}
          <div className="editor-bar">
            <select className="lang-select" value={lang} onChange={e => changeLang(e.target.value)}>
              {LANGS.map(l => (
                <option key={l.key} value={l.key}>{l.label}</option>
              ))}
            </select>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
              Powered by Piston · free execution
            </span>
            <div className="editor-bar-spacer" />
            <button className="btn btn-ghost btn-sm" onClick={() => {
              if (window.confirm('Reset to starter template?')) {
                setCode(STARTERS[lang]);
                setRunResults(null); setSubmitRes(null);
              }
            }}>
              <RotateCcw size={12} /> Reset
            </button>
          </div>

          {/* Code editor */}
          <div className="code-area">
            <textarea
              ref={taRef}
              className="code-textarea"
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={onKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              placeholder={`Write your ${LANGS.find(l => l.key === lang)?.label} solution here…`}
            />
          </div>

          {/* Action bar */}
          <div className="action-bar">
            <button className="btn btn-run btn-sm" onClick={handleRun}
              disabled={running || submitting}>
              {running
                ? <><span className="idle-spinner" style={{ display: 'inline-block' }} /> Running…</>
                : <><Play size={13} /> Run</>}
            </button>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
              Runs sample cases only
            </span>
            <div style={{ flex: 1 }} />
            <button className="btn btn-submit" onClick={handleSubmit}
              disabled={running || submitting}>
              {submitting
                ? <><span className="idle-spinner" style={{ display: 'inline-block', borderTopColor: '#fff', borderColor: 'rgba(255,255,255,.3)' }} /> Submitting…</>
                : <><Send size={13} /> Submit</>}
            </button>
          </div>

          {/* Results panel */}
          <div className="results-panel">
            <div className="results-tabs">
              <button className={`results-tab${rightTab === 'cases' ? ' active' : ''}`}
                onClick={() => setRightTab('cases')}>
                <List size={11} /> Test cases
              </button>
              <button className={`results-tab${rightTab === 'output' ? ' active' : ''}`}
                onClick={() => setRightTab('output')}>
                {submitRes?.status === 'Solved'
                  ? <CheckCircle size={11} color="var(--green)" />
                  : submitRes ? <XCircle size={11} color="var(--red)" />
                  : <Play size={11} />}
                {' '}Output
                {submitRes && !submitRes.error && (
                  <span style={{ marginLeft: 4, fontWeight: 700, color: scoreColor }}>
                    {submitRes.score}%
                  </span>
                )}
              </button>
            </div>

            <div className="results-body">
              {/* Test cases tab */}
              {rightTab === 'cases' && (
                <>
                  {!runResults && !running && (
                    <div className="idle-msg"><Play size={14} /> Click Run to test against sample cases</div>
                  )}
                  {running && (
                    <div className="idle-msg"><span className="idle-spinner" /> Executing on Piston…</div>
                  )}
                  {runResults && runResults.map((r, i) => (
                    <div key={i} className={`tc-result ${r.passed ? 'pass' : 'fail'}`}>
                      <div className="tc-result-icon">
                        {r.passed
                          ? <CheckCircle size={14} color="var(--green)" />
                          : <XCircle    size={14} color="var(--red)" />}
                      </div>
                      <div className="tc-result-content">
                        <div className="tc-result-title">
                          Test {i + 1} — {r.passed ? 'Passed ✓' : r.error ? 'Error' : 'Wrong Answer'}
                        </div>
                        {r.error
                          ? <div className="tc-err">{r.error}</div>
                          : (
                            <div className="tc-result-grid">
                              {r.input && <>
                                <span className="tc-result-key">Input</span>
                                <span className="tc-result-val">{r.input}</span>
                              </>}
                              <span className="tc-result-key">Expected</span>
                              <span className="tc-result-val">{r.expected}</span>
                              <span className="tc-result-key">Got</span>
                              <span className="tc-result-val" style={{ color: r.passed ? 'var(--green)' : 'var(--red)' }}>
                                {r.actual !== undefined ? (r.actual || '(empty)') : '—'}
                              </span>
                            </div>
                          )}
                        {r.runtime && <div className="tc-meta">{r.runtime}</div>}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Output tab */}
              {rightTab === 'output' && (
                <>
                  {!submitRes && !submitting && (
                    <div className="idle-msg"><Send size={14} /> Submit your solution to see results</div>
                  )}
                  {submitting && (
                    <div className="idle-msg"><span className="idle-spinner" /> Running all test cases…</div>
                  )}
                  {submitRes?.error && (
                    <div style={{
                      display: 'flex', gap: 8, padding: 12,
                      background: 'var(--red-bg)', border: '1px solid rgba(220,38,38,.2)',
                      borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--red)',
                    }}>
                      <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                      {submitRes.error}
                    </div>
                  )}
                  {submitRes && !submitRes.error && (
                    <>
                      {/* Score summary */}
                      <div className="score-card">
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', marginBottom: 6 }}>
                            Score
                          </div>
                          <div className={`score-number ${submitRes.score === 100 ? 'full' : submitRes.score > 0 ? 'partial' : 'zero'}`}>
                            {submitRes.score}%
                          </div>
                        </div>
                        <div className="score-detail">
                          <div className="score-detail-row">
                            Test cases <strong>{submitRes.passed}/{submitRes.total}</strong>
                          </div>
                          <div className="score-detail-row">
                            Points <strong>{submitRes.earnedPoints}/{submitRes.totalPoints}</strong>
                          </div>
                          <span className={`badge ${submitRes.status === 'Solved' ? 'badge-green' : submitRes.status === 'Attempted' ? 'badge-amber' : 'badge-red'}`}
                            style={{ marginTop: 8, display: 'inline-block' }}>
                            {submitRes.status}
                          </span>
                        </div>
                      </div>

                      {/* Per-test results */}
                      {submitRes.results?.map((r, i) => (
                        <div key={i} className={`tc-result ${r.passed ? 'pass' : 'fail'}`}>
                          <div className="tc-result-icon">
                            {r.passed
                              ? <CheckCircle size={14} color="var(--green)" />
                              : <XCircle    size={14} color="var(--red)" />}
                          </div>
                          <div className="tc-result-content">
                            <div className="tc-result-title">
                              Test {i + 1} {r.isSample ? '(sample)' : '(hidden)'} —{' '}
                              {r.passed ? 'Passed' : r.error ? 'Error' : 'Wrong Answer'}
                            </div>
                            {r.error
                              ? <div className="tc-err">{r.error}</div>
                              : r.isSample && (
                                <div className="tc-result-grid">
                                  {r.input && r.input !== '***hidden***' && <>
                                    <span className="tc-result-key">Input</span>
                                    <span className="tc-result-val">{r.input}</span>
                                  </>}
                                  <span className="tc-result-key">Expected</span>
                                  <span className="tc-result-val">{r.expected !== '***hidden***' ? r.expected : '—'}</span>
                                  <span className="tc-result-key">Got</span>
                                  <span className="tc-result-val" style={{ color: r.passed ? 'var(--green)' : 'var(--red)' }}>
                                    {r.actual || '(empty)'}
                                  </span>
                                </div>
                              )}
                            {r.runtime && <div className="tc-meta">{r.runtime}</div>}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}