import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import fs from "fs";
import { exec } from "child_process";
import {
  getAllProblems, getProblemById, getAllTestCases,
  saveSubmission, getCandidateSubmissions, seedDummyProblems,
} from '../db/examQueries.js';

// ── Supported Languages ───────────────────────────────────────
const LANGUAGES = {
  python: true,
  java: true,
  cpp: true,
  c: true,
  js: true,
};

// ── Execute using Docker ──────────────────────────────────────
const runInDocker = (code, language, stdin = '') => {
  return new Promise((resolve) => {
    const fileMap = {
      python: "temp.py",
      js: "temp.js",
      java: "Main.java",
      cpp: "temp.cpp",
      c: "temp.c",
    };

    const file = fileMap[language];
    if (!file) {
      return resolve({ run: { stdout: "", stderr: "Unsupported language", code: 1 } });
    }

    fs.writeFileSync(file, code);

    let command = "";

    if (language === "python") {
      command = `docker run --rm -i -v ${process.cwd()}:/app -w /app python:3.10 python ${file}`;
    }

    else if (language === "js") {
      command = `docker run --rm -i -v ${process.cwd()}:/app -w /app node:18 node ${file}`;
    }

    else if (language === "java") {
      command = `docker run --rm -i -v ${process.cwd()}:/app -w /app openjdk:17 bash -c "javac ${file} && java Main"`;
    }

    else if (language === "cpp") {
      command = `docker run --rm -i -v ${process.cwd()}:/app -w /app gcc bash -c "g++ ${file} -o out && ./out"`;
    }

    else if (language === "c") {
      command = `docker run --rm -i -v ${process.cwd()}:/app -w /app gcc bash -c "gcc ${file} -o out && ./out"`;
    }

    const processExec = exec(command, { timeout: 8000 }, (error, stdout, stderr) => {
      resolve({
        run: {
          stdout,
          stderr: stderr || (error ? error.message : ""),
          code: error ? 1 : 0,
        },
      });
    });

    if (stdin) {
      processExec.stdin.write(stdin);
      processExec.stdin.end();
    }
  });
};

// ── Parse Result ──────────────────────────────────────────────
const parseResult = (r) => {
  const run = r.run || {};

  if (run.code !== 0 && run.stderr) {
    return {
      ok: false,
      output: run.stdout || '',
      error: run.stderr,
    };
  }

  return { ok: true, output: run.stdout || '', error: null };
};

// ── Normalize Output ──────────────────────────────────────────
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

// GET /api/exam/problems
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

// POST /api/exam/run
export const runCode = asyncHandler(async (req, res) => {
  const { code, language, problemId } = req.body;
  console.log("LANGUAGE RECEIVED:", language);

  if (!code?.trim()) throw new ApiError(400, 'Code is required');
  if (!LANGUAGES[language]) throw new ApiError(400, `Unsupported language: ${language}`);

  const problem = await getProblemById(problemId);
  if (!problem) throw new ApiError(404, 'Problem not found');

  const results = [];

  for (const tc of problem.sampleTestCases) {
    try {
      const execRes = await runInDocker(code, language, tc.input);
      const { ok, output, error } = parseResult(execRes);
      const passed = ok && norm(output) === norm(tc.expected_output);

      results.push({
        testCaseId: tc.id,
        input: tc.input,
        expected: tc.expected_output,
        actual: ok ? norm(output) : '',
        passed,
        error,
      });
    } catch (err) {
      results.push({
        testCaseId: tc.id,
        input: tc.input,
        expected: tc.expected_output,
        actual: '',
        passed: false,
        error: err.message,
      });
    }
  }

  return res.status(200).json(new ApiResponse(200, { results }, 'Run complete'));
});

// POST /api/exam/submit
export const submitCode = asyncHandler(async (req, res) => {
  const candidateId = req.user.id;
  const { code, language, problemId } = req.body;

  if (!code?.trim()) throw new ApiError(400, 'Code is required');
  if (!LANGUAGES[language]) throw new ApiError(400, `Unsupported language: ${language}`);

  const allTC = await getAllTestCases(problemId);
  if (!allTC.length) throw new ApiError(404, 'No test cases found');

  let totalPoints = 0;
  let earnedPoints = 0;
  const results = [];

  for (const tc of allTC) {
    totalPoints += tc.points || 10;

    try {
      const execRes = await runInDocker(code, language, tc.input);
      const { ok, output } = parseResult(execRes);
      const passed = ok && norm(output) === norm(tc.expected_output);

      if (passed) earnedPoints += tc.points || 10;

      results.push({
        testCaseId: tc.id,
        passed,
        isSample: tc.is_sample,
        input: tc.is_sample ? tc.input : '***hidden***',
        expected: tc.is_sample ? tc.expected_output : '***hidden***',
        actual: tc.is_sample ? norm(output) : (passed ? '✓ Correct' : '✗ Wrong'),
      });
    } catch (err) {
      results.push({
        testCaseId: tc.id,
        passed: false,
        error: err.message,
      });
    }
  }

  const score = totalPoints ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const status = results.every(r => r.passed)
    ? 'Solved'
    : earnedPoints > 0
    ? 'Attempted'
    : 'Wrong Answer';

  const submission = await saveSubmission({
    candidateId,
    problemId,
    language,
    code,
    status,
    score,
    results,
  });

  return res.status(200).json(new ApiResponse(200, {
    submissionId: submission.id,
    status,
    score,
    passed: results.filter(r => r.passed).length,
    total: results.length,
    earnedPoints,
    totalPoints,
    results,
  }, 'Submission complete'));
});

// GET /api/exam/submissions/:problemId
export const mySubmissions = asyncHandler(async (req, res) => {
  const subs = await getCandidateSubmissions(req.user.id, req.params.problemId);
  return res.status(200).json(new ApiResponse(200, subs, 'OK'));
});