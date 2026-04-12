import { client } from "../db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import { exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

// ─────────────────────────────────────────────
// 🟡 LANGUAGE NORMALIZATION
// ─────────────────────────────────────────────
const normalizeLang = (lang) => {
  return (lang || "").toLowerCase();
};

// ─────────────────────────────────────────────
// 🟡 BUILD EXECUTION CODE (ONLY FOR PYTHON)
// ─────────────────────────────────────────────
const buildPythonWrapper = ({ userCode, funcName, input }) => {
  return `
import json

${userCode}

try:
    inputs = ${JSON.stringify(input)}
    result = ${funcName}(**inputs)
    print(json.dumps(result))
except Exception as e:
    print("ERROR:", str(e))
`;
};

// ─────────────────────────────────────────────
// 🔵 EXECUTE (DOCKER MULTI-LANGUAGE)
// ─────────────────────────────────────────────
const executeCode = async (code, language) => {
  return new Promise((resolve) => {
    const lang = normalizeLang(language);

    const tmpDir = os.tmpdir();
    let fileName = "";
    let command = "";

    // 🧠 Choose language
    if (lang === "python") {
      fileName = `code_${Date.now()}.py`;
      fs.writeFileSync(path.join(tmpDir, fileName), code);

      command = `docker run --rm -v ${tmpDir}:/app -w /app python:3.10 python ${fileName}`;
    }

    else if (lang === "javascript" || lang === "js") {
      fileName = `code_${Date.now()}.js`;
      fs.writeFileSync(path.join(tmpDir, fileName), code);

      command = `docker run --rm -v ${tmpDir}:/app -w /app node:18 node ${fileName}`;
    }

    else if (lang === "java") {
      fileName = `Main.java`;
      fs.writeFileSync(path.join(tmpDir, fileName), code);

      command = `docker run --rm -v ${tmpDir}:/app -w /app eclipse-temurin:17 bash -c "javac Main.java && java Main"`;
    }

    else if (lang === "cpp") {
      fileName = `code.cpp`;
      fs.writeFileSync(path.join(tmpDir, fileName), code);

      command = `docker run --rm -v ${tmpDir}:/app -w /app gcc bash -c "g++ code.cpp -o out && ./out"`;
    }

    else if (lang === "c") {
      fileName = `code.c`;
      fs.writeFileSync(path.join(tmpDir, fileName), code);

      command = `docker run --rm -v ${tmpDir}:/app -w /app gcc bash -c "gcc code.c -o out && ./out"`;
    }

    else {
      return resolve({ error: "Unsupported language" });
    }

    exec(command, { timeout: 8000 }, (error, stdout, stderr) => {
      try {
        fs.unlinkSync(path.join(tmpDir, fileName));
      } catch {}

      if (error) {
        return resolve({ error: stderr || error.message });
      }

      if (!stdout) {
        return resolve({ error: "No output returned" });
      }

      let actual;
      try {
        actual = JSON.parse(stdout);
      } catch {
        actual = stdout.trim();
      }

      resolve({ actual });
    });
  });
};

import { generateProblemWithLLM } from "../services/llmService.js";

export const generateAdaptiveProblem = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // 🔥 1. Get last 5 submissions
  const subRes = await client.query(`
    SELECT * FROM "Code_Submissions"
    WHERE "candidateId" = $1
    ORDER BY "submittedAt" DESC
    LIMIT 5
  `, [userId]);

  const submissions = subRes.rows;

  // 🔥 2. Build state
  const avg = arr => arr.length
    ? arr.reduce((a, b) => a + b, 0) / arr.length
    : 0.5;

  const skill = submissions.length
    ? avg(submissions.map(s => s.is_correct ? 1 : 0))
    : 0.5;

  const last_difficulty = submissions[0]?.difficulty || 0.5;

  const state = [
    skill,
    last_difficulty,
    0.5,
    0.5,
    skill
  ];

  // 🔥 3. Call RL
  const axios = (await import("axios")).default;

  const rlRes = await axios.post("http://127.0.0.1:8000/rl/next-difficulty", {
    skill: state[0],
    last_difficulty: state[1],
    avg_time: state[2],
    avg_attempts: state[3],
    recent_accuracy: state[4]
  });

  const difficulty = rlRes.data.difficulty;

  // 🔥 4. Get topic (basic for now)
  const topicRes = await client.query(`
    SELECT t."topicName" FROM "Topics" t
    JOIN "Problems" p ON p."topicId" = t.id
    LIMIT 1
  `);

  const topic = topicRes.rows[0]?.topicName || "Arrays";

  // 🔥 5. CALL LLM
  let llmProblem;
  try {
    llmProblem = await generateProblemWithLLM({
      difficulty,
      topic
    });
  } catch (e) {
    console.log("LLM ERROR:", e.message);
    throw new ApiError(500, "LLM generation failed");
  }

  // 🔥 6. SAVE PROBLEM
  const insertProblem = await client.query(`
    INSERT INTO "Problems"
(title, description, function_name, difficulty, "domainId")
VALUES ($1,$2,$3,$4,$5) returning *
  `, [
    llmProblem.title,
    llmProblem.description,
    llmProblem.function_name,
    difficulty < 0.3 ? "Easy" :
    difficulty < 0.6 ? "Medium" : "Hard",
    1
  ]);

  const selected = insertProblem.rows[0];

  // 🔥 7. SAVE TEST CASES
  for (let tc of llmProblem.test_cases) {
    await client.query(`
      INSERT INTO "Test_Cases"
      ("problemId", input_json, expected_output_json, is_sample, points)
      VALUES ($1,$2,$3,true,10)
    `, [
      selected.id,
      tc.input,
      tc.output
    ]);
  }

  await client.query(`
    INSERT INTO "Candidate_Problems"
    ("candidate_id", "problem_id", "submissions")
    VALUES ($1, $2, '[]'::jsonb)
    ON CONFLICT ("candidate_id", "problem_id")
    DO NOTHING
  `, [userId, selected.id]);

  return res.json(
    new ApiResponse(200, {
      problem: selected,
      difficulty
    })
  );
});

export const runProblem = asyncHandler(async (req, res) => {
  const { problemId } = req.params;
  const { code, language } = req.body;

  const lang = normalizeLang(language);

  const problemRes = await client.query(
    `SELECT function_name FROM "Problems" WHERE id = $1`,
    [problemId]
  );

  const funcName = problemRes.rows[0]?.function_name;

  const tcRes = await client.query(
    `SELECT * FROM "Test_Cases"
     WHERE "problemId" = $1 AND is_sample = true`,
    [problemId]
  );

  const results = await Promise.all(
    tcRes.rows.map(async (tc) => {
      let finalCode = code;

      // 🧠 Only Python needs wrapper
      if (lang === "python") {
        finalCode = buildPythonWrapper({
          userCode: code,
          funcName,
          input: tc.input_json,
        });
      }

      const exec = await executeCode(finalCode, lang);

      if (exec.error) {
        return {
          passed: false,
          error: exec.error,
          input: tc.input_json,
        };
      }

      const expected = tc.expected_output_json;

      return {
        passed:
          JSON.stringify(exec.actual) === JSON.stringify(expected),
        input: tc.input_json,
        expected,
        actual: exec.actual,
      };
    })
  );

  return res.json(new ApiResponse(200, { results }));
});

// ─────────────────────────────────────────────
// 🔴 SUBMIT (ALL TEST CASES)
// ─────────────────────────────────────────────
export const submitProblem = asyncHandler(async (req, res) => {
  console.log("Submit request received with body:", req.body);
  const { problemId } = req.params;
  const { code, language, difficulty } = req.body;
  const userId = req.user?.id;

  const lang = normalizeLang(language);

  const problemRes = await client.query(
    `SELECT function_name FROM "Problems" WHERE id = $1`,
    [problemId]
  );

  const funcName = problemRes.rows[0]?.function_name;

  const tcRes = await client.query(
    `SELECT * FROM "Test_Cases"
     WHERE "problemId" = $1`,
    [problemId]
  );

  const results = await Promise.all(
    tcRes.rows.map(async (tc) => {
      let finalCode = code;

      if (lang === "python") {
        finalCode = buildPythonWrapper({
          userCode: code,
          funcName,
          input: tc.input_json,
        });
      }

      const exec = await executeCode(finalCode, lang);

      if (exec.error) {
        return {
          passed: false,
          error: exec.error,
          input: tc.is_sample ? tc.input_json : "***hidden***",
          points: 0,
        };
      }

      const expected = tc.expected_output_json;
      const passed =
        JSON.stringify(exec.actual) === JSON.stringify(expected);

      return {
        passed,
        input: tc.is_sample ? tc.input_json : "***hidden***",
        expected: tc.is_sample ? expected : "***hidden***",
        actual: exec.actual,
        points: passed ? tc.points : 0,
      };
    })
  );
  console.log("Hi", results);
  const score = results.reduce((s, r) => s + (r.points || 0), 0);
  const passedCount = results.filter((r) => r.passed).length;

  const status =
    passedCount === results.length ? "Accepted" : "Wrong Answer";
  const isCorrect = status === "Accepted";
  const submissionRes = await client.query(
    `INSERT INTO "Code_Submissions"
("candidateId", "problemId", "language", "status", "score", code, difficulty, is_correct)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING id`,
    [userId, problemId, language, status, score, code, difficulty, isCorrect]
  );

  const submissionId = Number(submissionRes.rows[0].id);

  await client.query(
    `INSERT INTO "Candidate_Problems"
     ("candidate_id", "problem_id", "submissions", "end_time")
     VALUES ($1, $2, to_jsonb(ARRAY[$3]), 
       CASE WHEN $4 = true THEN NOW() ELSE NULL END
     )
     ON CONFLICT ("candidate_id", "problem_id")
     DO UPDATE SET
       submissions = COALESCE("Candidate_Problems".submissions, '[]'::jsonb) || to_jsonb($3::int),
       end_time = CASE 
         WHEN $4 = true AND "Candidate_Problems".end_time IS NULL THEN NOW()
         ELSE "Candidate_Problems".end_time
       END`,
    [userId, problemId, submissionId, status === "Accepted"]
  );
  console.log("Submission recorded with ID:", submissionId);
  return res.json(
    new ApiResponse(200, {
      score,
      passed: passedCount,
      total: results.length,
      results,
    })
  );
});

export const getProblemById = asyncHandler(async (req, res) => {
  const { problemId } = req.params;
  const userId = req.user?.id;

  const problemRes = await client.query(
    `SELECT * FROM "Problems"
     WHERE id = $1
     AND ("userId" IS NULL OR "userId" = $2)`,
    [problemId, userId]
  );

  if (!problemRes.rows.length) {
    throw new ApiError(404, "Problem not found");
  }

  const problem = problemRes.rows[0];

  const tcRes = await client.query(
    `SELECT id, input_json, expected_output_json, is_sample, explanation, points
     FROM "Test_Cases"
     WHERE "problemId" = $1`,
    [problemId]
  );

  return res.json(
    new ApiResponse(200, {
      problem,
      testCases: tcRes.rows,
    })
  );
});

export const getProblemSubmissions = asyncHandler(async (req, res) => {
  const { problemId } = req.params;
  const userId = req.user?.id;

  const result = await client.query(
    `SELECT id, language, status, score, "submittedAt"
     FROM "Code_Submissions"
     WHERE "candidateId" = $1 AND "problemId" = $2
     ORDER BY "submittedAt" DESC`,
    [userId, problemId]
  );

  return res.json(new ApiResponse(200, result.rows));
});