import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError }      from '../utils/ApiError.js';
import { ApiResponse }   from '../utils/ApiResponse.js';
import axios             from 'axios';
import {
  getAllProblems, getProblemById, getAllTestCases,
  saveSubmission, getCandidateSubmissions, seedDummyProblems,
} from '../db/examQueries.js';

// ── Piston language map ───────────────────────────────────────
const PISTON = {
  python: { language: 'python',     version: '3.10.0' },
  java:   { language: 'java',       version: '15.0.2'  },
  cpp:    { language: 'c++',        version: '10.2.0'  },
  c:      { language: 'c',          version: '10.2.0'  },
  js:     { language: 'javascript', version: '18.15.0' },
};

// ── Execute via Piston ────────────────────────────────────────
const runOnPiston = async (code, language, stdin = '') => {
  const lang = PISTON[language];
  if (!lang) throw new Error(`Unsupported language: ${language}`);

  const res = await axios.post(
    'https://emkc.org/api/v2/piston/execute',
    {
      language: lang.language,
      version:  lang.version,
      files:    [{ content: code }],
      stdin,
      run_timeout:      10000,
      compile_timeout:  15000,
      run_memory_limit: 128000000,
    },
    { headers: { 'Content-Type': 'application/json' }, timeout: 25000 }
  );
  return res.data;
};

// ── Parse Piston response ─────────────────────────────────────
const parseResult = (r) => {
  // compile error
  if (r.compile && r.compile.code !== 0) {
    return {
      ok: false,
      output: '',
      error: `Compile error:\n${r.compile.stderr || r.compile.output || ''}`.trim(),
    };
  }
  const run = r.run || {};
  // TLE
  if (run.signal === 'SIGKILL') {
    return { ok: false, output: '', error: 'Time limit exceeded (10s)' };
  }
  // runtime error
  if (run.code !== 0 && run.stderr) {
    return {
      ok: false,
      output: run.stdout || '',
      error: `Runtime error (exit ${run.code}):\n${run.stderr}`.trim(),
    };
  }
  return { ok: true, output: run.stdout || '', error: null };
};

// ── Normalise output before comparing ────────────────────────
const norm = (s) =>
  (s || '').trim().replace(/\r\n/g, '\n').replace(/[^\S\n]+$/gm, '');

// ─────────────────────────────────────────────────────────────
// Controllers
// ─────────────────────────────────────────────────────────────

// POST /api/exam/seed
export const seedProblems = asyncHandler(async (req, res) => {
  const result = await seedDummyProblems();
  return res.status(200).json(new ApiResponse(200, result, 'Seed done'));
});

// GET /api/exam/problems?domainId=1
export const listProblems = asyncHandler(async (req, res) => {
  const problems = await getAllProblems(req.query.domainId || null);
  return res.status(200).json(new ApiResponse(200, problems, 'OK'));
});

// GET /api/exam/problems/:problemId
export const getProblem = asyncHandler(async (req, res) => {
  const problem = await getProblemById(req.params.problemId);
  if (!problem) throw new ApiError(404, 'Problem not found');
  return res.status(200).json(new ApiResponse(200, problem, 'OK'));
});

// POST /api/exam/run  { code, language, problemId }
// Runs against sample test cases only — fast feedback
export const runCode = asyncHandler(async (req, res) => {
  const { code, language, problemId } = req.body;
  if (!code?.trim())      throw new ApiError(400, 'Code is required');
  if (!PISTON[language])  throw new ApiError(400, `Unsupported language: ${language}`);

  const problem = await getProblemById(problemId);
  if (!problem) throw new ApiError(404, 'Problem not found');

  const results = [];
  for (const tc of problem.sampleTestCases) {
    try {
      const pistonRes          = await runOnPiston(code, language, tc.input);
      const { ok, output, error } = parseResult(pistonRes);
      const passed             = ok && norm(output) === norm(tc.expected_output);
      results.push({
        testCaseId: tc.id,
        input:      tc.input,
        expected:   tc.expected_output,
        actual:     ok ? norm(output) : '',
        passed,
        error,
        runtime: pistonRes.run?.wall_time ? `${pistonRes.run.wall_time}ms` : null,
      });
    } catch (err) {
      results.push({
        testCaseId: tc.id, input: tc.input,
        expected: tc.expected_output, actual: '',
        passed: false, error: err.message,
      });
    }
  }
  return res.status(200).json(new ApiResponse(200, { results }, 'Run complete'));
});

// POST /api/exam/submit  { code, language, problemId }
// Runs against ALL test cases, scores, saves submission
export const submitCode = asyncHandler(async (req, res) => {
  const candidateId          = req.user.id;
  const { code, language, problemId } = req.body;
  if (!code?.trim())     throw new ApiError(400, 'Code is required');
  if (!PISTON[language]) throw new ApiError(400, `Unsupported language: ${language}`);

  const allTC = await getAllTestCases(problemId);
  if (!allTC.length) throw new ApiError(404, 'No test cases found for this problem');

  let totalPoints  = 0;
  let earnedPoints = 0;
  const results    = [];

  for (const tc of allTC) {
    totalPoints += tc.points || 10;
    try {
      const pistonRes          = await runOnPiston(code, language, tc.input);
      const { ok, output, error } = parseResult(pistonRes);
      const passed             = ok && norm(output) === norm(tc.expected_output);
      if (passed) earnedPoints += tc.points || 10;

      results.push({
        testCaseId: tc.id,
        passed,
        isSample:  tc.is_sample,
        // only reveal details for sample cases
        input:    tc.is_sample ? tc.input              : '***hidden***',
        expected: tc.is_sample ? tc.expected_output    : '***hidden***',
        actual:   tc.is_sample ? (ok ? norm(output) : '') : (passed ? '✓ Correct' : '✗ Wrong'),
        error:    ok ? null : error,
        runtime:  pistonRes.run?.wall_time ? `${pistonRes.run.wall_time}ms` : null,
      });
    } catch (err) {
      results.push({
        testCaseId: tc.id, passed: false,
        isSample: tc.is_sample, error: err.message,
      });
    }
  }

  const score  = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const status = results.every(r => r.passed) ? 'Solved'
    : earnedPoints > 0 ? 'Attempted' : 'Wrong Answer';

  const submission = await saveSubmission({
    candidateId, problemId, language, code, status, score, results,
  });

  return res.status(200).json(new ApiResponse(200, {
    submissionId: submission.id,
    status, score,
    passed:       results.filter(r => r.passed).length,
    total:        results.length,
    earnedPoints, totalPoints,
    results,
  }, 'Submission complete'));
});

// GET /api/exam/submissions/:problemId
export const mySubmissions = asyncHandler(async (req, res) => {
  const subs = await getCandidateSubmissions(req.user.id, req.params.problemId);
  return res.status(200).json(new ApiResponse(200, subs, 'OK'));
});