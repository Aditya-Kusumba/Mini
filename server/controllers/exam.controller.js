import { asyncHandler }  from '../utils/asyncHandler.js';
import { ApiError }       from '../utils/ApiError.js';
import { ApiResponse }    from '../utils/ApiResponse.js';
import axios              from 'axios';
import {
  getAllProblems, getProblemById, getAllTestCases,
  saveSubmission, getCandidateSubmissions,
  getProblemLeaderboard, seedDummyProblems,
} from '../db/examQueries.js';

// ── Piston config ─────────────────────────────────────────────
const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';

const PISTON_LANGS = {
  python: { language: 'python',     version: '3.10.0'  },
  java:   { language: 'java',       version: '15.0.2'  },
  cpp:    { language: 'c++',        version: '10.2.0'  },
  c:      { language: 'c',          version: '10.2.0'  },
  js:     { language: 'javascript', version: '18.15.0' },
};

// ── Execute one test case via Piston ──────────────────────────
const executePiston = async (code, language, stdin = '') => {
  const lang = PISTON_LANGS[language];
  if (!lang) throw new Error(`Unsupported language: ${language}`);

  const res = await axios.post(
    PISTON_URL,
    {
      language: lang.language,
      version:  lang.version,
      files:    [{ content: code }],
      stdin,
      run_timeout:      10000,
      compile_timeout:  15000,
      run_memory_limit: 128000000,
    },
    { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }
  );
  return res.data;
};

// ── Parse Piston response ─────────────────────────────────────
const getStatus = (r) => {
  const run = r.run;
  if (!run) return { ok: false, error: 'No run result from Piston' };
  if (r.compile?.code !== undefined && r.compile.code !== 0)
    return { ok: false, error: `Compile error:\n${r.compile.stderr || r.compile.output}` };
  if (run.code !== 0 && run.stderr)
    return { ok: false, error: `Runtime error (exit ${run.code}):\n${run.stderr}` };
  if (run.signal === 'SIGKILL')
    return { ok: false, error: 'Time limit exceeded (10s)' };
  return { ok: true, output: run.stdout || '' };
};

// ── Normalise output ──────────────────────────────────────────
const norm = (s) => (s || '').trim().replace(/\r\n/g, '\n').replace(/[^\S\n]+$/gm, '');

// ─────────────────────────────────────────────────────────────
// CONTROLLERS
// ─────────────────────────────────────────────────────────────

export const seedProblems = asyncHandler(async (req, res) => {
  const result = await seedDummyProblems();
  return res.status(200).json(new ApiResponse(200, result, 'Seed complete'));
});

export const getLanguages = asyncHandler(async (req, res) => {
  const langs = Object.entries(PISTON_LANGS).map(([key, val]) => ({
    key,
    label:    key === 'cpp' ? 'C++' : key === 'js' ? 'JavaScript' : key.charAt(0).toUpperCase() + key.slice(1),
    language: val.language,
    version:  val.version,
  }));
  return res.status(200).json(new ApiResponse(200, langs, 'Languages fetched'));
});

export const listProblems = asyncHandler(async (req, res) => {
  const problems = await getAllProblems(req.query.domainId || null);
  return res.status(200).json(new ApiResponse(200, problems, 'Problems fetched'));
});

export const getProblem = asyncHandler(async (req, res) => {
  const problem = await getProblemById(req.params.problemId);
  if (!problem) throw new ApiError(404, 'Problem not found');
  return res.status(200).json(new ApiResponse(200, problem, 'Problem fetched'));
});

// Run code — sample test cases only (fast feedback)
export const runCode = asyncHandler(async (req, res) => {
  const { code, language, problemId } = req.body;
  if (!code?.trim()) throw new ApiError(400, 'code is required');
  if (!PISTON_LANGS[language]) throw new ApiError(400, `Unsupported language: ${language}`);

  const problem = await getProblemById(problemId);
  if (!problem) throw new ApiError(404, 'Problem not found');

  const results = [];
  for (const tc of problem.sampleTestCases) {
    try {
      const pistonRes = await executePiston(code, language, tc.input);
      const { ok, output, error } = getStatus(pistonRes);
      const passed = ok && norm(output) === norm(tc.expected_output);
      results.push({
        testCaseId: tc.id,
        input:      tc.input,
        expected:   tc.expected_output,
        actual:     ok ? norm(output) : '',
        passed,
        isSample:   true,
        error:      ok ? null : error,
        runtime:    pistonRes.run?.wall_time ? `${pistonRes.run.wall_time}ms` : null,
      });
    } catch (err) {
      results.push({ testCaseId: tc.id, input: tc.input, expected: tc.expected_output, actual: '', passed: false, isSample: true, error: err.message });
    }
  }

  return res.status(200).json(new ApiResponse(200, { results }, 'Run complete'));
});

// Submit code — ALL test cases + score
export const submitCode = asyncHandler(async (req, res) => {
  const candidateId = req.user.id;
  const { code, language, problemId } = req.body;
  if (!code?.trim()) throw new ApiError(400, 'code is required');
  if (!PISTON_LANGS[language]) throw new ApiError(400, `Unsupported language: ${language}`);

  const allTestCases = await getAllTestCases(problemId);
  if (!allTestCases.length) throw new ApiError(404, 'No test cases found');

  let totalPoints = 0, earnedPoints = 0;
  const results = [];

  for (const tc of allTestCases) {
    totalPoints += tc.points || 10;
    try {
      const pistonRes = await executePiston(code, language, tc.input);
      const { ok, output, error } = getStatus(pistonRes);
      const passed = ok && norm(output) === norm(tc.expected_output);
      if (passed) earnedPoints += tc.points || 10;

      results.push({
        testCaseId:  tc.id,
        passed,
        isSample:    tc.is_sample,
        input:       tc.is_sample ? tc.input           : '***hidden***',
        expected:    tc.is_sample ? tc.expected_output  : '***hidden***',
        actual:      tc.is_sample ? (ok ? norm(output) : '') : (passed ? '✓ Correct' : '✗ Wrong'),
        error:       ok ? null : error,
        runtime:     pistonRes.run?.wall_time ? `${pistonRes.run.wall_time}ms` : null,
      });
    } catch (err) {
      results.push({ testCaseId: tc.id, passed: false, isSample: tc.is_sample, error: err.message });
    }
  }

  const score   = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const allPass = results.every(r => r.passed);
  const status  = allPass ? 'Solved' : earnedPoints > 0 ? 'Attempted' : 'Wrong Answer';

  const submission = await saveSubmission({ candidateId, problemId, language, code, status, score, results });

  return res.status(200).json(new ApiResponse(200, {
    submissionId: submission.id,
    status, score,
    passed:       results.filter(r => r.passed).length,
    total:        results.length,
    earnedPoints, totalPoints,
    results,
  }, 'Submission complete'));
});

export const mySubmissions = asyncHandler(async (req, res) => {
  const subs = await getCandidateSubmissions(req.user.id, req.params.problemId);
  return res.status(200).json(new ApiResponse(200, subs, 'Submissions fetched'));
});

export const leaderboard = asyncHandler(async (req, res) => {
  const board = await getProblemLeaderboard(req.params.problemId);
  return res.status(200).json(new ApiResponse(200, board, 'Leaderboard fetched'));
});