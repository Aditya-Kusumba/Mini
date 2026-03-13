import { query } from "../db.js";

// ─────────────────────────────────────────────
// DOMAIN DASHBOARD — main data fetch
// Returns everything the frontend needs in one call
// ─────────────────────────────────────────────
export const getDomainDashboardData = async (candidateId, domainId) => {

  // 1. Domain info + enrollment check
  const domainResult = await query(`
    SELECT
      d.id,
      d."domainName"   AS name,
      d.description,
      cd."created_at"  AS "enrolledAt"
    FROM "Domains" d
    JOIN "Candidate_Domain" cd
      ON cd."domainId" = d.id AND cd."candidateId" = $1
    WHERE d.id = $2
  `, [candidateId, domainId]);

  if (domainResult.rows.length === 0) return null; // not enrolled

  // 2. Performance: avg score across topics in this domain
  const perfResult = await query(`
    SELECT
      COUNT(cdp.id)        AS "topicsAttempted",
      AVG(cdp.performance) AS "avgScore"
    FROM "Candidate_Domain_Performance" cdp
    JOIN "Topics" t ON cdp."topicId" = t.id
    WHERE cdp."candiadateId" = $1 AND t."domainId" = $2
  `, [candidateId, domainId]);

  // 3. Topics — covered vs total
  const topicsResult = await query(`
    SELECT
      t.id,
      t."topicName"     AS name,
      cdp.performance   AS score,
      CASE WHEN cdp.id IS NOT NULL THEN true ELSE false END AS covered
    FROM "Topics" t
    LEFT JOIN "Candidate_Domain_Performance" cdp
      ON cdp."topicId" = t.id AND cdp."candiadateId" = $1
    WHERE t."domainId" = $2
    ORDER BY t."created_at" ASC
  `, [candidateId, domainId]);

  // 4. Problem history — solved problems with solution links
  const historyResult = await query(`
    SELECT
      p.id,
      p.title,
      p.difficulty,
      p."topicId",
      p."solutionUrl",
      t."topicName",
      ps.status,
      ps."solvedAt",
      ps."attemptCount"
    FROM "Problem_Submissions" ps
    JOIN "Problems" p  ON ps."problemId" = p.id
    JOIN "Topics"   t  ON p."topicId"    = t.id
    WHERE ps."candidateId" = $1 AND p."domainId" = $2
    ORDER BY ps."solvedAt" DESC
  `, [candidateId, domainId]);

  // 5. Stats: total solved / attempted
  const statsResult = await query(`
    SELECT
      COUNT(*) FILTER (WHERE ps.status = 'Solved')    AS solved,
      COUNT(*) FILTER (WHERE ps.status = 'Attempted') AS attempted,
      COUNT(*) FILTER (WHERE ps.status = 'Skipped')   AS skipped
    FROM "Problem_Submissions" ps
    JOIN "Problems" p ON ps."problemId" = p.id
    WHERE ps."candidateId" = $1 AND p."domainId" = $2
  `, [candidateId, domainId]);

  const perf  = perfResult.rows[0];
  const stats = statsResult.rows[0];

  return {
    domain: domainResult.rows[0],
    performance: {
      avgScore:        perf.avgScore ? parseFloat(perf.avgScore).toFixed(2) : "0.00",
      topicsAttempted: parseInt(perf.topicsAttempted) || 0,
      topicsTotal:     topicsResult.rows.length,
    },
    topics: topicsResult.rows,
    problemHistory: historyResult.rows,
    stats: {
      solved:    parseInt(stats.solved)    || 0,
      attempted: parseInt(stats.attempted) || 0,
      skipped:   parseInt(stats.skipped)   || 0,
    },
  };
};

// ─────────────────────────────────────────────
// DAILY QUESTION
// One problem per candidate per domain per day
// If already assigned today, return existing
// ─────────────────────────────────────────────
export const getDailyQuestion = async (candidateId, domainId) => {
  const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

  // Check if already assigned today
  const existing = await query(`
    SELECT
      dq.id,
      dq."isCompleted",
      p.id          AS "problemId",
      p.title,
      p.difficulty,
      p.description,
      p."solutionUrl",
      t."topicName"
    FROM "Daily_Questions" dq
    JOIN "Problems" p ON dq."problemId" = p.id
    LEFT JOIN "Topics" t ON p."topicId" = t.id
    WHERE dq."candidateId" = $1
      AND dq."domainId"    = $2
      AND dq."assignedDate" = $3
  `, [candidateId, domainId, today]);

  if (existing.rows.length > 0) return existing.rows[0];

  // Assign a new one — pick a problem not yet solved by this candidate in this domain
  const newProblem = await query(`
    SELECT p.id, p.title, p.difficulty, p.description, p."solutionUrl", t."topicName"
    FROM "Problems" p
    LEFT JOIN "Topics" t ON p."topicId" = t.id
    WHERE p."domainId" = $1
      AND p.id NOT IN (
        SELECT ps."problemId"
        FROM "Problem_Submissions" ps
        WHERE ps."candidateId" = $2 AND ps.status = 'Solved'
      )
    ORDER BY RANDOM()
    LIMIT 1
  `, [domainId, candidateId]);

  if (newProblem.rows.length === 0) {
    return { message: "All problems solved in this domain! Check back for new ones." };
  }

  const problem = newProblem.rows[0];

  // Save today's assignment
  await query(`
    INSERT INTO "Daily_Questions" ("candidateId", "problemId", "domainId", "assignedDate")
    VALUES ($1, $2, $3, $4)
    ON CONFLICT ("candidateId", "domainId", "assignedDate") DO NOTHING
  `, [candidateId, problem.id, domainId, today]);

  return { ...problem, isCompleted: false };
};

// Mark daily question as completed
export const completeDailyQuestion = async (candidateId, domainId) => {
  const today = new Date().toISOString().split("T")[0];
  const result = await query(`
    UPDATE "Daily_Questions"
    SET "isCompleted" = true
    WHERE "candidateId" = $1 AND "domainId" = $2 AND "assignedDate" = $3
    RETURNING *
  `, [candidateId, domainId, today]);
  return result.rows[0];
};

// ─────────────────────────────────────────────
// STRENGTHEN TOPIC
// Find the weakest topic → return unsolved problems from it
// ─────────────────────────────────────────────
export const getStrengthenTopic = async (candidateId, domainId) => {

  // Find weakest topic (lowest score, or unattempted)
  const weakResult = await query(`
    SELECT
      t.id          AS "topicId",
      t."topicName" AS name,
      cdp.performance AS score
    FROM "Topics" t
    LEFT JOIN "Candidate_Domain_Performance" cdp
      ON cdp."topicId" = t.id AND cdp."candiadateId" = $1
    WHERE t."domainId" = $2
    ORDER BY cdp.performance ASC NULLS FIRST
    LIMIT 1
  `, [candidateId, domainId]);

  if (weakResult.rows.length === 0) return null;

  const weakTopic = weakResult.rows[0];

  // Get 3 unsolved problems from that topic
  const problems = await query(`
    SELECT
      p.id,
      p.title,
      p.difficulty,
      p.description,
      p."solutionUrl"
    FROM "Problems" p
    WHERE p."topicId" = $1
      AND p.id NOT IN (
        SELECT ps."problemId"
        FROM "Problem_Submissions" ps
        WHERE ps."candidateId" = $2 AND ps.status = 'Solved'
      )
    ORDER BY
      CASE p.difficulty WHEN 'Easy' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END
    LIMIT 3
  `, [weakTopic.topicId, candidateId]);

  return {
    topic: weakTopic,
    problems: problems.rows,
  };
};

// ─────────────────────────────────────────────
// SUBMIT A PROBLEM
// Upsert — update if already attempted
// ─────────────────────────────────────────────
export const submitProblem = async (candidateId, problemId, status) => {
  const result = await query(`
    INSERT INTO "Problem_Submissions" ("candidateId", "problemId", status, "solvedAt", "attemptCount")
    VALUES ($1, $2, $3, NOW(), 1)
    ON CONFLICT ("candidateId", "problemId")
    DO UPDATE SET
      status        = EXCLUDED.status,
      "solvedAt"    = CASE WHEN EXCLUDED.status = 'Solved' THEN NOW() ELSE "Problem_Submissions"."solvedAt" END,
      "attemptCount" = "Problem_Submissions"."attemptCount" + 1
    RETURNING *
  `, [candidateId, problemId, status]);
  return result.rows[0];
};

// ─────────────────────────────────────────────
// PROBLEMS LIST — all problems in a domain
// ─────────────────────────────────────────────
export const getDomainProblems = async (candidateId, domainId) => {
  const result = await query(`
    SELECT
      p.id,
      p.title,
      p.difficulty,
      p."topicId",
      p."solutionUrl",
      t."topicName",
      ps.status       AS "submissionStatus",
      ps."attemptCount"
    FROM "Problems" p
    LEFT JOIN "Topics" t ON p."topicId" = t.id
    LEFT JOIN "Problem_Submissions" ps
      ON ps."problemId" = p.id AND ps."candidateId" = $1
    WHERE p."domainId" = $2
    ORDER BY t."topicName", p.difficulty, p.title
  `, [candidateId, domainId]);
  return result.rows;
};