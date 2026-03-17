import { query } from '../db.js';

// ============================================================
// STUDENT MANAGEMENT
// ============================================================

export const findCandidateByUsername = async (username) => {
  const result = await query(
    `SELECT id, username, "fullName", email FROM "Candidates" WHERE username = $1`,
    [username]
  );
  return result.rows[0] || null;
};

export const addStudentToCollege = async (collegeId, candidateId, adminId) => {
  const result = await query(
    `INSERT INTO "College_Students" ("collegeId","candidateId","addedBy")
     VALUES ($1,$2,$3)
     ON CONFLICT ("collegeId","candidateId") DO NOTHING
     RETURNING *`,
    [collegeId, candidateId, adminId]
  );
  return result.rows[0] || null;
};

export const bulkAddStudents = async (collegeId, usernames, adminId) => {
  const added = [], alreadyExists = [], notFound = [];

  for (const username of usernames) {
    const candidate = await findCandidateByUsername(username);
    if (!candidate) { notFound.push(username); continue; }

    const result = await query(
      `INSERT INTO "College_Students" ("collegeId","candidateId","addedBy")
       VALUES ($1,$2,$3)
       ON CONFLICT ("collegeId","candidateId") DO NOTHING
       RETURNING *`,
      [collegeId, candidate.id, adminId]
    );

    if (result.rows.length > 0) added.push({ username, candidateId: candidate.id });
    else alreadyExists.push(username);
  }

  return { added, alreadyExists, notFound };
};

export const removeStudentFromCollege = async (collegeId, candidateId) => {
  const result = await query(
    `DELETE FROM "College_Students"
     WHERE "collegeId"=$1 AND "candidateId"=$2
     RETURNING *`,
    [collegeId, candidateId]
  );
  return result.rows[0] || null;
};

export const getCollegeStudents = async (collegeId) => {
  const result = await query(
    `SELECT
       c.id, c.username, c."fullName", c.email, c."isVerified",
       cs."addedAt",
       COUNT(DISTINCT cd."domainId") AS "domainsEnrolled",
       ps.score AS "placementScore",
       ps.tier
     FROM "College_Students" cs
     JOIN "Candidates" c ON cs."candidateId" = c.id
     LEFT JOIN "Candidate_Domain" cd ON cd."candidateId" = c.id
     LEFT JOIN "Placement_Scores" ps
       ON ps."candidateId" = c.id AND ps."collegeId" = $1
     WHERE cs."collegeId" = $1
     GROUP BY c.id, c.username, c."fullName", c.email,
              c."isVerified", cs."addedAt", ps.score, ps.tier
     ORDER BY cs."addedAt" DESC`,
    [collegeId]
  );
  return result.rows;
};

export const getStudentProfile = async (collegeId, candidateId) => {
  const check = await query(
    `SELECT 1 FROM "College_Students"
     WHERE "collegeId"=$1 AND "candidateId"=$2`,
    [collegeId, candidateId]
  );
  if (check.rows.length === 0) return null;

  const profile = await query(
    `SELECT id, username, "fullName", email, bio, "cvUrl",
            education, skills, projects, "isVerified", "created_at"
     FROM "Candidates" WHERE id = $1`,
    [candidateId]
  );

  const domains = await query(
    `SELECT d.id, d."domainName" AS name,
            COUNT(DISTINCT cdp.id) AS "topicsAttempted",
            AVG(cdp.performance)   AS "avgScore"
     FROM "Candidate_Domain" cd
     JOIN "Domains" d ON cd."domainId" = d.id
     LEFT JOIN "Candidate_Domain_Performance" cdp
       ON cdp."candiadateId" = $1
     WHERE cd."candidateId" = $1
     GROUP BY d.id, d."domainName"`,
    [candidateId]
  );

  const problems = await query(
    `SELECT
       COUNT(*) FILTER (WHERE status='Solved')    AS solved,
       COUNT(*) FILTER (WHERE status='Attempted') AS attempted
     FROM "Problem_Submissions" WHERE "candidateId"=$1`,
    [candidateId]
  );

  const placement = await query(
    `SELECT score, tier, breakdown, "computedAt"
     FROM "Placement_Scores"
     WHERE "candidateId"=$1 AND "collegeId"=$2`,
    [candidateId, collegeId]
  );

  return {
    profile:   profile.rows[0],
    domains:   domains.rows,
    problems:  problems.rows[0],
    placement: placement.rows[0] || null,
  };
};

// ============================================================
// DOMAIN ASSIGNMENT
// ============================================================

export const assignDomainToStudent = async (candidateId, domainId, collegeId) => {
  const result = await query(
    `INSERT INTO "Candidate_Domain" ("candidateId","domainId","CollegeId")
     VALUES ($1,$2,$3)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [candidateId, domainId, collegeId]
  );
  return result.rows[0] || null;
};

export const bulkAssignDomain = async (candidateIds, domainId, collegeId) => {
  const assigned = [], skipped = [];

  for (const candidateId of candidateIds) {
    const result = await query(
      `INSERT INTO "Candidate_Domain" ("candidateId","domainId","CollegeId")
       VALUES ($1,$2,$3)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [candidateId, domainId, collegeId]
    );
    if (result.rows.length > 0) assigned.push(candidateId);
    else skipped.push(candidateId);
  }

  return { assigned, skipped };
};

export const removeDomainFromStudent = async (candidateId, domainId) => {
  const result = await query(
    `DELETE FROM "Candidate_Domain"
     WHERE "candidateId"=$1 AND "domainId"=$2
     RETURNING *`,
    [candidateId, domainId]
  );
  return result.rows[0] || null;
};

// ============================================================
// ANALYTICS
// ============================================================

export const getCollegeOverview = async (collegeId) => {
  const students = await query(
    `SELECT COUNT(*) AS total FROM "College_Students" WHERE "collegeId"=$1`,
    [collegeId]
  );

  const placement = await query(
    `SELECT
       COUNT(*) FILTER (WHERE tier='Elite')        AS elite,
       COUNT(*) FILTER (WHERE tier='Advanced')     AS advanced,
       COUNT(*) FILTER (WHERE tier='Intermediate') AS intermediate,
       COUNT(*) FILTER (WHERE tier='Beginner')     AS beginner,
       AVG(score) AS "avgScore"
     FROM "Placement_Scores" WHERE "collegeId"=$1`,
    [collegeId]
  );

  const domains = await query(
    `SELECT d."domainName" AS name, COUNT(cd."candidateId") AS students
     FROM "Candidate_Domain" cd
     JOIN "Domains" d ON cd."domainId" = d.id
     WHERE cd."CollegeId"=$1
     GROUP BY d.id, d."domainName"
     ORDER BY students DESC`,
    [collegeId]
  );

  const problems = await query(
    `SELECT COUNT(*) AS total
     FROM "Problem_Submissions" ps
     JOIN "College_Students" cs ON ps."candidateId" = cs."candidateId"
     WHERE cs."collegeId"=$1 AND ps.status='Solved'`,
    [collegeId]
  );

  const p = placement.rows[0];
  return {
    totalStudents:       parseInt(students.rows[0].total) || 0,
    avgPlacementScore:   p.avgScore ? parseFloat(p.avgScore).toFixed(2) : '0.00',
    tierBreakdown: {
      elite:        parseInt(p.elite)        || 0,
      advanced:     parseInt(p.advanced)     || 0,
      intermediate: parseInt(p.intermediate) || 0,
      beginner:     parseInt(p.beginner)     || 0,
    },
    domainPopularity:    domains.rows,
    totalProblemsSolved: parseInt(problems.rows[0].total) || 0,
  };
};

export const getDomainAnalytics = async (collegeId, domainId) => {
  const result = await query(
    `SELECT
       c.id, c.username, c."fullName",
       AVG(cdp.performance) AS "avgScore",
       COUNT(DISTINCT ps.id) FILTER (WHERE ps.status='Solved') AS "problemsSolved"
     FROM "College_Students" cs
     JOIN "Candidates" c ON cs."candidateId" = c.id
     JOIN "Candidate_Domain" cd
       ON cd."candidateId" = c.id AND cd."domainId" = $2
     LEFT JOIN "Candidate_Domain_Performance" cdp ON cdp."candiadateId" = c.id
     LEFT JOIN "Problem_Submissions" ps ON ps."candidateId" = c.id
     WHERE cs."collegeId" = $1
     GROUP BY c.id, c.username, c."fullName"
     ORDER BY "avgScore" DESC NULLS LAST`,
    [collegeId, domainId]
  );
  return result.rows;
};

export const getLeaderboard = async (collegeId) => {
  const result = await query(
    `SELECT
       ROW_NUMBER() OVER (ORDER BY ps.score DESC) AS rank,
       c.id, c.username, c."fullName",
       ps.score, ps.tier, ps.breakdown
     FROM "Placement_Scores" ps
     JOIN "Candidates" c ON ps."candidateId" = c.id
     WHERE ps."collegeId"=$1
     ORDER BY ps.score DESC`,
    [collegeId]
  );
  return result.rows;
};

// ============================================================
// BATCH MANAGEMENT
// ============================================================

export const createBatch = async (collegeId, batchName, year) => {
  const result = await query(
    `INSERT INTO "Batches" ("collegeId","batchName",year)
     VALUES ($1,$2,$3) RETURNING *`,
    [collegeId, batchName, year]
  );
  return result.rows[0];
};

export const getCollegeBatches = async (collegeId) => {
  const result = await query(
    `SELECT b.*, COUNT(bs."candidateId") AS "studentCount"
     FROM "Batches" b
     LEFT JOIN "Batch_Students" bs ON bs."batchId" = b.id
     WHERE b."collegeId"=$1
     GROUP BY b.id
     ORDER BY b.year DESC`,
    [collegeId]
  );
  return result.rows;
};

export const addStudentsToBatch = async (batchId, candidateIds) => {
  const added = [], skipped = [];

  for (const candidateId of candidateIds) {
    const result = await query(
      `INSERT INTO "Batch_Students" ("batchId","candidateId")
       VALUES ($1,$2)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [batchId, candidateId]
    );
    if (result.rows.length > 0) added.push(candidateId);
    else skipped.push(candidateId);
  }

  return { added, skipped };
};

export const getBatchStudents = async (batchId) => {
  const result = await query(
    `SELECT
       c.id, c.username, c."fullName", c.email,
       ps.score AS "placementScore", ps.tier,
       bs."addedAt"
     FROM "Batch_Students" bs
     JOIN "Candidates" c ON bs."candidateId" = c.id
     LEFT JOIN "Placement_Scores" ps ON ps."candidateId" = c.id
     WHERE bs."batchId"=$1
     ORDER BY ps.score DESC NULLS LAST`,
    [batchId]
  );
  return result.rows;
};