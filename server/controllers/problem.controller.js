import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { query } from "../db.js";
import axios from 'axios';

// Get all problems
const getAllProblems = asyncHandler(async (req, res) => {
  try {
    const query = `
      SELECT 
        p.*,
        d.domain_name,
        COUNT(s.submission_id) as total_submissions
      FROM "problems" p
      LEFT JOIN "Domains" d ON p.domain_id = d.domain_id
      LEFT JOIN "Submissions" s ON p.problem_id = s.problem_id
      GROUP BY p.problem_id, p.title, p.description, p.difficulty, p.domain_id, p.created_at, d.domain_name
      ORDER BY p.created_at DESC
    `;
    
    const result = await query(query);
    
    return res.status(200).json(
      new ApiResponse(200, result.rows, "Problems fetched successfully")
    );
  } catch (error) {
    console.error("Error fetching problems:", error);
    throw new ApiError(500, "Failed to fetch problems");
  }
});

// Get problem by ID
const getProblemById = asyncHandler(async (req, res) => {
  const { problemId } = req.params;
  
  try {
    const query1 = `
      SELECT 
        p.*,
        d.domain_name,
        t.test_cases
      FROM "problems" p
      LEFT JOIN "Domains" d ON p.domain_id = d.domain_id
      LEFT JOIN "testcases" t ON p.problem_id = t.problem_id
      WHERE p.problem_id = $1
    `;
    
    const result = await query(query1, [problemId]);
    
    if (result.rows.length === 0) {
      throw new ApiError(404, "Problem not found");
    }
    
    const problem = result.rows[0];
    
    return res.status(200).json(
      new ApiResponse(200, { 
        problemData: problem,
        allProblemIds: [] // This would be populated with actual problem IDs
      }, "Problem fetched successfully")
    );
  } catch (error) {
    console.error("Error fetching problem:", error);
    throw error;
  }
});

// Submit solution
const submitSolution = asyncHandler(async (req, res) => {
    // Destructure all possible fields from the body
    const { problemId, code, language, contestId, userQuery, files, status: clientStatus, score: clientScore } = req.body;
    const candidateId = req.user?.id;

    if (!candidateId) {
        throw new ApiError(401, "User not authenticated.");
    }
    if (!problemId) {
        throw new ApiError(400, "Problem ID is required for a submission.");
    }

    let submissionData = {};
    let problemScore = 0;
    let finalStatus = "Pending";
    let responseData = {};

    // --- Step 1: Judge the submission based on its type ---
    if (code && language) { // This is a DSA submission
        const testCasesRes = await query(`SELECT * FROM "testcases" WHERE problem_id = $1 AND is_hidden = TRUE`, [problemId]);
        const testCases = testCasesRes.rows;
        if (testCases.length === 0) {
            throw new ApiError(400, "No hidden test cases for this problem.");
        }

        let passedCount = 0;
        for (const tc of testCases) {
            try {
                const { data } = await axios.post("https://emkc.org/api/v2/piston/execute", {
                    language, version: "*", files: [{ content: code }], stdin: tc.input
                });
                const output = (data.run.stdout || "").trim();
                if (output === tc.expected_output.trim() && !data.run.stderr) {
                    passedCount++;
                }
            } catch (e) {
                console.error("Error executing code with Piston API:", e.message);
            }
        }

        problemScore = (passedCount / testCases.length) * 100;
        finalStatus = problemScore === 100 ? "Accepted" : "Wrong Answer";
        submissionData = { code: code, language: language };
        responseData = { passedCount, totalCount: testCases.length }; // Add test case data to response

    } else if (userQuery) { // This is an SQL submission
        // (Your SQL judging logic would go here)
        problemScore = clientScore || 0;
        finalStatus = clientStatus || "Submitted";
        submissionData = { code: userQuery, language: 'sql' };

    } else if (files) { // This is a React submission
        // (React judging happens on the client, so we trust the score)
        problemScore = clientScore || 0;
        finalStatus = clientStatus || "Submitted";
        submissionData = { code: JSON.stringify(files), language: 'react' };
    } else {
        throw new ApiError(400, "Invalid submission payload.");
    }

    // --- Step 2: Save the individual submission ---
    // The 'contestId' will be NULL if it's undefined, which is perfect.
    await query(
        `INSERT INTO "submissions" (problem_id, candidate_id, contest_id, code, language, status, score) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [problemId, candidateId, contestId || null, submissionData.code, submissionData.language, finalStatus, problemScore]
    );

    // --- Step 3: (Conditional Logic) If this is part of a contest, update the contest score ---
    if (contestId) {
        // Recalculate the TOTAL contest score based on the BEST submission for EACH problem
        const totalScoreQuery = `
            WITH best_scores AS (
                SELECT 
                    problem_id, 
                    MAX(score) as max_score
                FROM "submissions"
                WHERE candidate_id = $1 AND contest_id = $2
                GROUP BY problem_id
            )
            SELECT SUM(max_score) as new_total_score FROM best_scores;
        `;
        const totalScoreResult = await query(totalScoreQuery, [candidateId, contestId]);
        const newTotalContestScore = totalScoreResult.rows[0].new_total_score || 0;

        // Update the main Contest_Participations table with the new total score
        await query(
            `UPDATE "Contest_Participations" SET score = $1 WHERE candidate_id = $2 AND contest_id = $3`,
            [newTotalContestScore, candidateId, contestId]
        );
        
        responseData.newTotalContestScore = newTotalContestScore;
    }

    // Add the final problem score and status to the response
    responseData.score = problemScore.toFixed(0);
    responseData.status = finalStatus;

    return res.status(200).json(new ApiResponse(200, responseData, "Submission processed successfully."));
});

// Get user submissions for a problem
const getSubmissions = asyncHandler(async (req, res) => {
  const { problemId } = req.params;
  const userId = req.user.id;
  
  try {
    const query = `
      SELECT 
        s.*,
        p.title as problem_title
      FROM "Submissions" s
      LEFT JOIN "Problems" p ON s.problem_id = p.problem_id
      WHERE s.problem_id = $1 AND s.user_id = $2
      ORDER BY s.submitted_at DESC
    `;
    
    const result = await query(query, [problemId, userId]);
    
    return res.status(200).json(
      new ApiResponse(200, result.rows, "Submissions fetched successfully")
    );
  } catch (error) {
    console.error("Error fetching submissions:", error);
    throw new ApiError(500, "Failed to fetch submissions");
  }
});

// Run code (for testing)
const runCode = asyncHandler(async (req, res) => {
  const { code, language, input } = req.body;
  
  try {
    // This would integrate with a code execution service like Piston API
    // For now, we'll return a mock response
    
    const mockOutput = `Code executed successfully with ${language}!\nInput: ${input || 'none'}\nOutput: Hello, World!`;
    
    return res.status(200).json({
      success: true,
      output: mockOutput,
      error: null,
      executionTime: Math.random() * 1000
    });
  } catch (error) {
    console.error("Error running code:", error);
    return res.status(500).json({
      success: false,
      output: null,
      error: "Failed to execute code"
    });
  }
});

export { 
  getAllProblems, 
  getProblemById, 
  submitSolution, 
  getSubmissions, 
  runCode 
};
