import axios from "axios";
import { query as queryMainDb } from "./db.js";

app.get("/api/problems", async (req, res) => {
    try {
        const result = await queryMainDb('SELECT id, title, category FROM Problems ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error("❌ Error in /api/problems:", err);
        res.status(500).json({ error: "Failed to fetch problems." });
    }
});

app.get("/api/problems/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const problemRes = await queryMainDb(
            `SELECT id, title, category, description, input_format, output_format, constraints, explanation, setup_query, initial_files, test_files
             FROM Problems WHERE id = $1`, [id]
        );
        if (problemRes.rows.length === 0) {
            return res.status(404).json({ error: "Problem not found." });
        }
        const testCasesRes = await queryMainDb('SELECT input, expected_output FROM TestCases WHERE problem_id = $1 AND is_hidden = FALSE', [id]);
        const allProblemIdsRes = await queryMainDb('SELECT id FROM Problems ORDER BY id ASC');
        const problemData = problemRes.rows[0];
        problemData.visibleTestCases = testCasesRes.rows;
        const allProblemIds = allProblemIdsRes.rows.map(row => row.id);
        res.json({ problemData, allProblemIds });
    } catch (err) {
        console.error("❌ DATABASE ERROR in /api/problems/:id:", err.stack);
        res.status(500).json({ error: "Failed to fetch problem details due to a server error." });
    }
});

app.get("/api/submissions/:problemId", async (req, res) => {
    try {
        const { problemId } = req.params;
        const submissionsRes = await queryMainDb(
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

app.post("/api/run", async (req, res) => {
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

app.post("/api/submit", async (req, res) => {
    const { problemId, language, code } = req.body;
    try {
        const testCasesRes = await queryMainDb("SELECT * FROM TestCases WHERE problem_id = $1 AND is_hidden = TRUE", [problemId]);
        const testCases = testCasesRes.rows;
        if (testCases.length === 0) {
            return res.status(400).json({ message: "No hidden test cases for this problem." });
        }
        let passedCount = 0;
        for (const tc of testCases) {
            const { data } = await axios.post("https://emkc.org/api/v2/piston/execute", { language, version: "*", files: [{ content: code }], stdin: tc.input });
            const output = (data.run.stdout || "").trim();
            if (output === tc.expected_output.trim() && !data.run.stderr) {
                passedCount++;
            }
        }
        const score = (passedCount / testCases.length) * 100;
        const status = score === 100 ? "Accepted" : "Wrong Answer";
        await queryMainDb(
            "INSERT INTO Submissions (problem_id, code, language, status, score) VALUES ($1, $2, $3, $4, $5)",
            [problemId, code, language, status, score]
        );
        res.json({ score: score.toFixed(0), passedCount, totalCount: testCases.length });
    } catch (err) {
        console.error("❌ Error in /api/submit:", err.stack);
        res.status(500).json({ error: "An error occurred during submission." });
    }
});

app.post("/api/submit/sql", async (req, res) => {
    const { problemId, userQuery } = req.body;
    const judgePool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await judgePool.connect();

    try {
        const problemRes = await queryMainDb("SELECT setup_query, solution_query FROM Problems WHERE id = $1", [problemId]);
        if (problemRes.rows.length === 0) {
            return res.status(404).json({ error: "Problem not found." });
        }
        const { setup_query, solution_query } = problemRes.rows[0];

        await client.query("BEGIN");
        if (setup_query) await client.query(setup_query);

        const userResult = await client.query(userQuery);
        const solutionResult = await client.query(solution_query);

        const normalize = (rows) => JSON.stringify(rows.map((row) => Object.entries(row).sort()).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))));
        const isCorrect = normalize(userResult.rows) === normalize(solutionResult.rows);
        const status = isCorrect ? "Accepted" : "Wrong Answer";
        const score = isCorrect ? 100 : 0;

        await queryMainDb(
            "INSERT INTO Submissions (problem_id, code, language, status, score) VALUES ($1, $2, $3, $4, $5)",
            [problemId, userQuery, "sql", status, score]
        );
        res.json({ status, result: userResult.rows });
    } catch (err) {
        console.error("❌ SQL ERROR:", err.stack);
        await queryMainDb(
            "INSERT INTO Submissions (problem_id, code, language, status, score) VALUES ($1, $2, $3, $4, $5)",
            [problemId, userQuery, "sql", "Error", 0]
        );
        res.status(500).json({ status: "Error", error: err.message, result: [] });
    } finally {
        await client.query("ROLLBACK");
        client.release();
    }
});

app.post("/api/submit/react-client", async (req, res) => {
    const { problemId, score, status, files } = req.body;
    try {
        await queryMainDb(
            'INSERT INTO Submissions (problem_id, code, language, status, score) VALUES ($1, $2, $3, $4, $5)',
            [problemId, JSON.stringify(files), 'react', status, score]
        );
        res.status(200).json({ message: "Submission saved successfully." });
    } catch (err) {
        console.error("Failed to save React submission:", err);
        res.status(500).json({ error: "Failed to save submission." });
    }
});

app.post("/api/submit/react", async (req, res) => {
    res.status(501).json({ message: "Server-side React judging is not yet implemented." });
});