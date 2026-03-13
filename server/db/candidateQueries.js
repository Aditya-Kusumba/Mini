import { query } from "../db.js";

// ============================================================
// DOMAINS
// ============================================================

/**
 * Get all available domains
 */
export const getAllDomains = async () => {
  const result = await query(`
    SELECT 
      d.id,
      d."domainName" AS name,
      d.description,
      COUNT(t.id) AS total_topics
    FROM "Domains" d
    LEFT JOIN "Topics" t ON d.id = t."domainId"
    GROUP BY d.id, d."domainName", d.description
    ORDER BY d."domainName" ASC
  `);
  return result.rows;
};

/**
 * Get domains a candidate is enrolled in (via Candidate_Domain table)
 */
export const getCandidateEnrolledDomains = async (candidateId) => {
  const result = await query(`
    SELECT
      d.id,
      d."domainName"  AS name,
      d.description,
      cd."created_at" AS "enrolledAt"
    FROM "Candidate_Domain" cd
    JOIN "Domains" d ON cd."domainId" = d.id
    WHERE cd."candidateId" = $1
    ORDER BY cd."created_at" ASC
  `, [candidateId]);
  return result.rows;
};

/**
 * Check if candidate is enrolled in a domain
 */
export const checkDomainEnrollment = async (candidateId, domainId) => {
  const result = await query(`
    SELECT 1 FROM "Candidate_Domain"
    WHERE "candidateId" = $1 AND "domainId" = $2
  `, [candidateId, domainId]);
  return result.rows.length > 0;
};

/**
 * Enroll candidate in a domain
 */
export const enrollCandidateInDomain = async (candidateId, domainId, CollegeId) => {
  const result = await query(`
    INSERT INTO "Candidate_Domain" ("candidateId", "domainId", "CollegeId")
    VALUES ($1, $2, $3)
    RETURNING *
  `, [candidateId, domainId, CollegeId]);
  return result.rows[0];
};

/**
 * Unenroll candidate from a domain
 */
export const unenrollCandidateFromDomain = async (candidateId, domainId) => {
  const result = await query(`
    DELETE FROM "Candidate_Domain"
    WHERE "candidateId" = $1 AND "domainId" = $2
    RETURNING *
  `, [candidateId, domainId]);
  return result.rows[0];
};

// ============================================================
// TOPICS
// ============================================================

/**
 * Get all topics for a domain
 */
export const getTopicsByDomain = async (domainId) => {
  const result = await query(`
    SELECT
      id,
      "topicName" AS name,
      "domainId",
      "created_at"
    FROM "Topics"
    WHERE "domainId" = $1
    ORDER BY "created_at" ASC
  `, [domainId]);
  return result.rows;
};

/**
 * Get topics a candidate has started
 * NOTE: Table name in DB is "Candiate_Topics" (typo in your DB — keeping as-is)
 */
export const getCandidateTopics = async (candidateId) => {
  const result = await query(`
    SELECT
      ct.id,
      ct."candidateId",
      ct."domainId",
      d."domainName",
      ct."created_at" AS "startedAt"
    FROM "Candiate_Topics" ct
    JOIN "Domains" d ON ct."domainId" = d.id
    WHERE ct."candidateId" = $1
    ORDER BY ct."created_at" DESC
  `, [candidateId]);
  return result.rows;
};

/**
 * Mark a domain as started for a candidate
 */
export const startCandidateTopic = async (candidateId, domainId) => {
  const exists = await query(`
    SELECT 1 FROM "Candiate_Topics"
    WHERE "candidateId" = $1 AND "domainId" = $2
  `, [candidateId, domainId]);

  if (exists.rows.length > 0) {
    return { alreadyExists: true };
  }

  const result = await query(`
    INSERT INTO "Candiate_Topics" ("candidateId", "domainId")
    VALUES ($1, $2)
    RETURNING *
  `, [candidateId, domainId]);

  return { alreadyExists: false, data: result.rows[0] };
};

// ============================================================
// PERFORMANCE
// NOTE: Candidate_Domain_Performance columns: candiadateId, topicId, performance
// Performance is tracked per TOPIC (not per domain directly)
// ============================================================

/**
 * Get full performance summary — all topics attempted, grouped by domain
 */
export const getCandidatePerformanceSummary = async (candidateId) => {
  const result = await query(`
    SELECT
      t.id            AS "topicId",
      t."topicName"   AS topic,
      d.id            AS "domainId",
      d."domainName"  AS domain,
      cdp.performance AS score
    FROM "Candidate_Domain_Performance" cdp
    JOIN "Topics"  t ON cdp."topicId"     = t.id
    JOIN "Domains" d ON t."domainId"      = d.id
    WHERE cdp."candiadateId" = $1
    ORDER BY d."domainName", t."topicName"
  `, [candidateId]);
  return result.rows;
};

/**
 * Get performance for all topics within one specific domain
 */
export const getCandidateDomainPerformance = async (candidateId, domainId) => {
  const result = await query(`
    SELECT
      t.id            AS "topicId",
      t."topicName"   AS topic,
      d.id            AS "domainId",
      d."domainName"  AS domain,
      cdp.performance AS score,
      cdp."created_at"
    FROM "Candidate_Domain_Performance" cdp
    JOIN "Topics"  t ON cdp."topicId" = t.id
    JOIN "Domains" d ON t."domainId"  = d.id
    WHERE cdp."candiadateId" = $1
      AND d.id = $2
    ORDER BY t."topicName"
  `, [candidateId, domainId]);

  if (result.rows.length === 0) return null;

  return {
    domainId:   parseInt(domainId),
    domainName: result.rows[0].domain,
    topics: result.rows.map(r => ({
      topicId: r.topicId,
      topic:   r.topic,
      score:   r.score,
    })),
    avgScore: (
      result.rows.reduce((sum, r) => sum + (r.score || 0), 0) / result.rows.length
    ).toFixed(2),
  };
};

/**
 * Update performance score for a specific topic
 */
export const updateCandidateTopicScore = async (candidateId, topicId, newScore) => {
  const result = await query(`
    UPDATE "Candidate_Domain_Performance"
    SET performance = $3
    WHERE "candiadateId" = $1 AND "topicId" = $2
    RETURNING *
  `, [candidateId, topicId, newScore]);
  return result.rows[0];
};

// ============================================================
// DASHBOARD
// ============================================================

/**
 * Full candidate dashboard — profile + stats + domains + topics
 */
export const getCandidateDashboard = async (candidateId) => {
  // Profile — only columns that exist in your Candidates table
  const profileResult = await query(`
    SELECT
      id,
      username,
      "fullName",
      bio,
      "cvUrl",
      education,
      skills,
      projects,
      "isVerified",
      "created_at" AS "joinedAt"
    FROM "Candidates"
    WHERE id = $1
  `, [candidateId]);

  if (profileResult.rows.length === 0) return null;
  const profile = profileResult.rows[0];

  // Enrolled domains
  const domainsResult = await query(`
    SELECT
      d.id,
      d."domainName" AS name,
      d.description
    FROM "Candidate_Domain" cd
    JOIN "Domains" d ON cd."domainId" = d.id
    WHERE cd."candidateId" = $1
    ORDER BY cd."created_at" ASC
  `, [candidateId]);

  // Topics started
  const topicsResult = await query(`
    SELECT COUNT(*) AS "topicsStarted"
    FROM "Candiate_Topics"
    WHERE "candidateId" = $1
  `, [candidateId]);

  // Performance stats
  const perfResult = await query(`
    SELECT
      COUNT(*)         AS "topicsAttempted",
      AVG(performance) AS "avgScore"
    FROM "Candidate_Domain_Performance"
    WHERE "candiadateId" = $1
  `, [candidateId]);

  const perf = perfResult.rows[0];

  return {
    profile: {
      ...profile,
      education: profile.education || {},
      skills:    profile.skills    || {},
      projects:  profile.projects  || {},
    },
    stats: {
      domainsEnrolled: domainsResult.rows.length,
      topicsStarted:   parseInt(topicsResult.rows[0].topicsStarted) || 0,
      topicsAttempted: parseInt(perf.topicsAttempted) || 0,
      avgScore:        perf.avgScore ? parseFloat(perf.avgScore).toFixed(2) : "0.00",
    },
    domains: domainsResult.rows,
  };
};