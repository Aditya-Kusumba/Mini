// server/controllers/problem.controller.js
import { supabase } from "../db.js"; // adjust import to your supabase client
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ── GET /api/problems/:problemId ──────────────────────────────────────────────
export const getProblemById = asyncHandler(async (req, res) => {
  const { problemId } = req.params;

  // Fetch problem with topic & domain name
  const { data: problem, error: probErr } = await supabase
    .from("Problems")
    .select(`
      id, title, description, difficulty, points,
      constraints, input_format, output_format, hints,
      createdAt,
      Domains ( domainName ),
      Topics ( topicName )
    `)
    .eq("id", problemId)
    .single();

  if (probErr || !problem) {
    throw new ApiError(404, "Problem not found");
  }

  // Fetch test cases (return only sample ones to frontend for display)
  const { data: testCases, error: tcErr } = await supabase
    .from("Test_Cases")
    .select("id, input, expected_output, is_sample, explanation, points")
    .eq("problemId", problemId)
    .order("id", { ascending: true });

  if (tcErr) {
    throw new ApiError(500, "Failed to fetch test cases");
  }

  const formattedProblem = {
    ...problem,
    domain_name: problem.Domains?.domainName,
    topic_name: problem.Topics?.topicName,
  };

  return res.status(200).json(
    new ApiResponse(200, { problem: formattedProblem, testCases }, "Problem fetched")
  );
});

// ── POST /api/problems/:problemId/submit ──────────────────────────────────────
export const submitProblem = asyncHandler(async (req, res) => {
  const { problemId } = req.params;
  const { code, language } = req.body;
  const candidateId = req.user?.id;

  if (!code || !language) {
    throw new ApiError(400, "Code and language are required");
  }

  // Fetch ALL test cases for submission
  const { data: testCases, error: tcErr } = await supabase
    .from("Test_Cases")
    .select("id, input, expected_output, points")
    .eq("problemId", problemId)
    .order("id", { ascending: true });

  if (tcErr || !testCases || testCases.length === 0) {
    throw new ApiError(404, "No test cases found for this problem");
  }

  // Map language to Piston API values
  const LANG_MAP = {
    javascript: { language: "javascript", version: "18.15.0" },
    python:     { language: "python",     version: "3.10.0"  },
    java:       { language: "java",       version: "15.0.2"  },
    cpp:        { language: "c++",        version: "10.2.0"  },
    c:          { language: "c",          version: "10.2.0"  },
  };

  const lang = LANG_MAP[language];
  if (!lang) throw new ApiError(400, `Unsupported language: ${language}`);

  // Run code against all test cases via Piston
  const results = await Promise.all(
    testCases.map(async (tc) => {
      try {
        const res = await fetch("https://emkc.org/api/v2/piston/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language: lang.language,
            version: lang.version,
            files: [{ content: code }],
            stdin: tc.input || "",
          }),
        });
        const data = await res.json();
        const actual = (data.run?.stdout || "").trim();
        const expected = (tc.expected_output || "").trim();
        const passed = actual === expected;
        return {
          testCaseId: tc.id,
          input: tc.input,
          expected,
          actual,
          passed,
          points: passed ? (tc.points || 10) : 0,
          stderr: data.run?.stderr || "",
        };
      } catch (e) {
        return {
          testCaseId: tc.id,
          passed: false,
          points: 0,
          error: e.message,
        };
      }
    })
  );

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const score = results.reduce((sum, r) => sum + r.points, 0);
  const allPassed = passed === total;
  const status = allPassed ? "Solved" : passed > 0 ? "Attempted" : "Attempted";

  // Save submission to DB
  if (candidateId) {
    await supabase.from("Code_Submissions").insert({
      candidateId,
      problemId: parseInt(problemId),
      language,
      code,
      status,
      score,
      results,
      submittedAt: new Date().toISOString(),
    });

    // Also upsert Problem_Submissions
    const { data: existing } = await supabase
      .from("Problem_Submissions")
      .select("id, status")
      .eq("candidateId", candidateId)
      .eq("problemId", problemId)
      .single();

    if (existing) {
      await supabase
        .from("Problem_Submissions")
        .update({
          status: allPassed ? "Solved" : existing.status === "Solved" ? "Solved" : "Attempted",
          attemptCount: (existing.attemptCount || 1) + 1,
          solvedAt: allPassed ? new Date().toISOString() : existing.solvedAt,
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("Problem_Submissions").insert({
        candidateId,
        problemId: parseInt(problemId),
        status,
        solvedAt: new Date().toISOString(),
        attemptCount: 1,
      });
    }
  }

  return res.status(200).json(
    new ApiResponse(200, { allPassed, passed, total, score, results }, "Submission complete")
  );
});

// ── GET /api/problems/:problemId/submissions ──────────────────────────────────
export const getProblemSubmissions = asyncHandler(async (req, res) => {
  const { problemId } = req.params;
  const candidateId = req.user?.id;

  const { data: submissions, error } = await supabase
    .from("Code_Submissions")
    .select("id, language, status, score, submittedAt")
    .eq("candidateId", candidateId)
    .eq("problemId", problemId)
    .order("submittedAt", { ascending: false })
    .limit(20);

  if (error) throw new ApiError(500, "Failed to fetch submissions");

  return res.status(200).json(
    new ApiResponse(200, { submissions }, "Submissions fetched")
  );
});