import { query } from '../db.js';

// ============================================================
// PLACEMENT READINESS SCORE
// Formula (out of 100):
//   40% — avg domain performance score
//   25% — problems solved ratio
//   20% — topics covered ratio
//   15% — daily question completion rate (last 30 days)
// ============================================================

const WEIGHTS = {
  domainPerformance: 0.40,
  problemsSolved:    0.25,
  topicsCovered:     0.20,
  dailyCompletion:   0.15,
};

// ── Compute score for ONE candidate ──────────────────────────
export const computePlacementScore = async (candidateId, collegeId) => {

  // 1. Avg domain performance (0–100)
  const perfResult = await query(
    `SELECT AVG(cdp.performance) AS avg
     FROM "Candidate_Domain_Performance" cdp
     WHERE cdp."candiadateId" = $1`,
    [candidateId]
  );
  const avgPerformance = parseFloat(perfResult.rows[0]?.avg) || 0;

  // 2. Problems solved ratio
  const probResult = await query(
    `SELECT
       COUNT(*) FILTER (WHERE ps.status = 'Solved') AS solved,
       COUNT(DISTINCT p.id)                          AS total
     FROM "Candidate_Domain" cd
     JOIN "Problems" p ON p."domainId" = cd."domainId"
     LEFT JOIN "Problem_Submissions" ps
       ON ps."problemId" = p.id AND ps."candidateId" = $1
     WHERE cd."candidateId" = $1`,
    [candidateId]
  );
  const prob = probResult.rows[0];
  const problemRatio = parseInt(prob?.total) > 0
    ? (parseInt(prob.solved) / parseInt(prob.total)) * 100
    : 0;

  // 3. Topics covered ratio
  const topicResult = await query(
    `SELECT
       COUNT(DISTINCT ct."domainId") AS covered,
       COUNT(DISTINCT t.id)          AS total
     FROM "Candidate_Domain" cd
     JOIN "Topics" t ON t."domainId" = cd."domainId"
     LEFT JOIN "Candiate_Topics" ct
       ON ct."domainId" = t."domainId" AND ct."candidateId" = $1
     WHERE cd."candidateId" = $1`,
    [candidateId]
  );
  const topic = topicResult.rows[0];
  const topicRatio = parseInt(topic?.total) > 0
    ? (parseInt(topic.covered) / parseInt(topic.total)) * 100
    : 0;

  // 4. Daily question completion rate (last 30 days)
  const dailyResult = await query(
    `SELECT
       COUNT(*) FILTER (WHERE "isCompleted" = true) AS completed,
       COUNT(*)                                      AS total
     FROM "Daily_Questions"
     WHERE "candidateId" = $1
       AND "assignedDate" >= CURRENT_DATE - INTERVAL '30 days'`,
    [candidateId]
  );
  const daily = dailyResult.rows[0];
  const dailyRate = parseInt(daily?.total) > 0
    ? (parseInt(daily.completed) / parseInt(daily.total)) * 100
    : 0;

  // Final weighted score
  const score = (
    avgPerformance * WEIGHTS.domainPerformance +
    problemRatio   * WEIGHTS.problemsSolved    +
    topicRatio     * WEIGHTS.topicsCovered     +
    dailyRate      * WEIGHTS.dailyCompletion
  );

  const finalScore = parseFloat(score.toFixed(2));

  const tier =
    finalScore >= 80 ? 'Elite'        :
    finalScore >= 60 ? 'Advanced'     :
    finalScore >= 40 ? 'Intermediate' : 'Beginner';

  const breakdown = {
    avgDomainScore:  parseFloat(avgPerformance.toFixed(2)),
    problemsSolved:  parseFloat(problemRatio.toFixed(2)),
    topicsCovered:   parseFloat(topicRatio.toFixed(2)),
    dailyCompletion: parseFloat(dailyRate.toFixed(2)),
  };

  // Upsert into Placement_Scores
  await query(
    `INSERT INTO "Placement_Scores"
       ("candidateId","collegeId",score,tier,breakdown,"computedAt")
     VALUES ($1,$2,$3,$4,$5,NOW())
     ON CONFLICT ("candidateId","collegeId")
     DO UPDATE SET
       score        = EXCLUDED.score,
       tier         = EXCLUDED.tier,
       breakdown    = EXCLUDED.breakdown,
       "computedAt" = NOW()`,
    [candidateId, collegeId, finalScore, tier, JSON.stringify(breakdown)]
  );

  return { candidateId, score: finalScore, tier, breakdown };
};

// ── Compute scores for ALL students in a college ─────────────
export const computeAllPlacementScores = async (collegeId) => {
  const students = await query(
    `SELECT "candidateId" FROM "College_Students" WHERE "collegeId" = $1`,
    [collegeId]
  );

  const results = [];
  for (const row of students.rows) {
    try {
      const result = await computePlacementScore(row.candidateId, collegeId);
      results.push(result);
    } catch (err) {
      console.error(`Score computation failed for candidate ${row.candidateId}:`, err.message);
      results.push({ candidateId: row.candidateId, error: err.message });
    }
  }
  return results;
};

// ── Get all placement scores for a college ───────────────────
export const getPlacementScores = async (collegeId) => {
  const result = await query(
    `SELECT
       c.id, c.username, c."fullName",
       ps.score, ps.tier, ps.breakdown, ps."computedAt"
     FROM "Placement_Scores" ps
     JOIN "Candidates" c ON ps."candidateId" = c.id
     WHERE ps."collegeId" = $1
     ORDER BY ps.score DESC`,
    [collegeId]
  );
  return result.rows;
};

// ── Get placement score for one student ──────────────────────
export const getStudentPlacementScore = async (candidateId, collegeId) => {
  const result = await query(
    `SELECT
       c.id, c.username, c."fullName",
       ps.score, ps.tier, ps.breakdown, ps."computedAt"
     FROM "Placement_Scores" ps
     JOIN "Candidates" c ON ps."candidateId" = c.id
     WHERE ps."candidateId" = $1 AND ps."collegeId" = $2`,
    [candidateId, collegeId]
  );
  return result.rows[0] || null;
};

// ── Get students grouped by tier ─────────────────────────────
export const getStudentsByTier = async (collegeId) => {
  const result = await query(
    `SELECT
       ps.tier,
       COUNT(*) AS count,
       json_agg(
         json_build_object(
           'id',       c.id,
           'username', c.username,
           'fullName', c."fullName",
           'score',    ps.score
         ) ORDER BY ps.score DESC
       ) AS students
     FROM "Placement_Scores" ps
     JOIN "Candidates" c ON ps."candidateId" = c.id
     WHERE ps."collegeId" = $1
     GROUP BY ps.tier
     ORDER BY
       CASE ps.tier
         WHEN 'Elite'        THEN 1
         WHEN 'Advanced'     THEN 2
         WHEN 'Intermediate' THEN 3
         ELSE 4
       END`,
    [collegeId]
  );
  return result.rows;
};