import express from "express";
import { verifyJWT } from "../middlewares/auth.js";
import axios from "axios";
import { 
  getAllProblems, 
  submitSolution, 
  runCode 
} from "../controllers/problem.controller.js";
import { query } from "../db.js";
const router = express.Router();
// --- backend/routes/problem.routes.js ---
import { Router } from "express";
import { 
    getProblemById, 
    getSubmissions
} from "../controllers/problem.controller.js"; // You will create this file

// router.route("/submit").post(submitDsaCode);
// router.route("/submit/sql").post(submitSqlCode);

// Get all problems
router.get("/", async (req, res) => {
    try {
        const result = await query('SELECT id, title, category FROM problems ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error("❌ Error in /api/problems:", err);
        res.status(500).json({ error: "Failed to fetch problems." });
    }
});

// Submit SQL solution
router.post("/submit/sql", verifyJWT, submitSolution);

// Submit React solution
router.post("/submit/react-client", verifyJWT, submitSolution);

// Get user submissions for a problem
router.get("/submissions/:problemId", verifyJWT, getSubmissions);

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const problemRes = await query(
            `SELECT id, title, category, description, input_format, output_format, constraints, explanation, setup_query, initial_files, test_files
             FROM Problems WHERE id = $1`, [id]
        );
        if (problemRes.rows.length === 0) {
            return res.status(404).json({ error: "Problem not found." });
        }
        const testCasesRes = await query('SELECT input, expected_output FROM TestCases WHERE problem_id = $1 AND is_hidden = FALSE', [id]);
        const allProblemIdsRes = await query('SELECT id FROM Problems ORDER BY id ASC');
        const problemData = problemRes.rows[0];
        problemData.visibleTestCases = testCasesRes.rows;
        const allProblemIds = allProblemIdsRes.rows.map(row => row.id);
        res.json({ problemData, allProblemIds });
    } catch (err) {
        console.error("❌ DATABASE ERROR in /api/problems/:id:", err.stack);
        res.status(500).json({ error: "Failed to fetch problem details due to a server error." });
    }
});

// GET submission history for a problem
router.get("/:problemId/submissions", async (req, res) => {
    try {
        const { problemId } = req.params;
        const submissionsRes = await query(
            `SELECT id, language, status, score, created_at
             FROM Submissions WHERE problem_id = $1
             ORDER BY created_at DESC LIMIT 15`, [problemId]
        );
        res.json(submissionsRes.rows);
    } catch (err) {
        console.error("❌ Error in /api/submissions:", err);
        res.status(500).json({ error: "Failed to fetch submissions." });
    }
});

// Endpoint for running DSA code against custom input
router.post("/run", async (req, res) => {
    const { language, code, input } = req.body;
    try {
        const payload = { language, version: "*", files: [{ content: code }], stdin: input || "" };
        const { data } = await axios.post("https://emkc.org/api/v2/piston/execute", payload);
        res.json({ output: data.run.stdout, error: data.run.stderr });
    } catch (err) {
        console.error("❌ Error in /api/run:", err.message);
        res.status(500).json({ error: "An error occurred while running the code." });
    }
});

// Endpoint for final DSA submission
router.route("/submit").post(verifyJWT, submitSolution);

// Endpoint to run and judge SQL queries
router.post("/api/submit/sql", async (req, res) => {
    const { problemId, userQuery } = req.body;
    const judgePool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await judgePool.connect();

    try {
        const problemRes = await query("SELECT setup_query, solution_query FROM Problems WHERE id = $1", [problemId]);
        if (problemRes.rows.length === 0) {
            return res.status(404).json({ error: "Problem not found." });
        }
        const { setup_query, solution_query } = problemRes.rows[0];

        await query("BEGIN");
        if (setup_query) await query(setup_query);

        const userResult = await query(userQuery);
        const solutionResult = await query(solution_query);

        const normalize = (rows) => JSON.stringify(rows.map((row) => Object.entries(row).sort()).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))));
        const isCorrect = normalize(userResult.rows) === normalize(solutionResult.rows);
        const status = isCorrect ? "Accepted" : "Wrong Answer";
        const score = isCorrect ? 100 : 0;

        await query(
            "INSERT INTO Submissions (problem_id, code, language, status, score) VALUES ($1, $2, $3, $4, $5)",
            [problemId, userQuery, "sql", status, score]
        );
        res.json({ status, result: userResult.rows });
    } catch (err) {
        console.error("❌ SQL ERROR:", err.stack);
        await query(
            "INSERT INTO Submissions (problem_id, code, language, status, score) VALUES ($1, $2, $3, $4, $5)",
            [problemId, userQuery, "sql", "Error", 0]
        );
        res.status(500).json({ status: "Error", error: err.message, result: [] });
    } finally {
        await query("ROLLBACK");
    }
});

// Endpoint to save client-side React test results
router.post("/api/submit/react-client", async (req, res) => {
    const { problemId, score, status, files } = req.body;
    try {
        await query(
            'INSERT INTO Submissions (problem_id, code, language, status, score) VALUES ($1, $2, $3, $4, $5)',
            [problemId, JSON.stringify(files), 'react', status, score]
        );
        res.status(200).json({ message: "Submission saved successfully." });
    } catch (err) {
        console.error("Failed to save React submission:", err);
        res.status(500).json({ error: "Failed to save submission." });
    }
});

// Conceptual endpoint for a future server-side React judge
router.post("/api/submit/react", async (req, res) => {
    // This is a placeholder for a future, more complex server-side implementation
    // using Jest and Puppeteer. It is not currently used by the frontend.
    res.status(501).json({ message: "Server-side React judging is not yet implemented." });
});

export default router;
