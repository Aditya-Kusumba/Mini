import { query } from "../db.js";

// ============ CONTEST QUERIES ============

// Get all active contests
export const getActiveContests = async () => {
  const result = await query(`
    SELECT 
      c.contest_id,
      c.title,
      c.description,
      c.type,
      c.start_time,
      c.end_time,
      c.domain_id,
      c.max_participants,
      d.domain_name,
      COUNT(cp.participation_id) as current_participants
    FROM "Contests" c
    LEFT JOIN "Domains" d ON c.domain_id = d.domain_id
    LEFT JOIN "Contest_Participations" cp ON c.contest_id = cp.contest_id
    WHERE c.end_time > CURRENT_TIMESTAMP
    GROUP BY c.contest_id, d.domain_name
    ORDER BY c.start_time ASC
  `);
  return result.rows;
};

// Get contest by ID
export const getContestById = async (contestId) => {
  const result = await query(`
    SELECT 
      c.contest_id,
      c.title,
      c.description,
      c.type,
      c.start_time,
      c.end_time,
      c.domain_id,
      c.max_participants,
      d.domain_name,
      COUNT(cp.participation_id) as current_participants
    FROM "Contests" c
    LEFT JOIN "Domains" d ON c.domain_id = d.domain_id
    LEFT JOIN "Contest_Participations" cp ON c.contest_id = cp.contest_id
    WHERE c.contest_id = $1
    GROUP BY c.contest_id, d.domain_name
  `, [contestId]);
  return result.rows[0];
};

// Get contest leaderboard
export const getContestLeaderboard = async (contestId) => {
  const result = await query(`
    SELECT 
      cp.participation_id,
      cp.candidate_id,
      cp.score,
      cp.rank,
      cp.submission_time,
      c.fullName,
      c.username
    FROM "Contest_Participations" cp
    JOIN "Candidates" c ON cp.candidate_id = c.id
    WHERE cp.contest_id = $1
    ORDER BY cp.score DESC, cp.submission_time ASC
  `, [contestId]);
  return result.rows;
};

// Join contest
export const joinContest = async (candidateId, contestId) => {
  const result = await query(`
    INSERT INTO "Contest_Participations" 
    (candidate_id, contest_id, submission_time)
    VALUES ($1, $2, CURRENT_TIMESTAMP)
    RETURNING participation_id
  `, [candidateId, contestId]);
  return result.rows[0];
};

// Submit contest score
export const submitContestScore = async (participationId, score) => {
  const result = await query(`
    UPDATE "Contest_Participations"
    SET score = $2, submission_time = CURRENT_TIMESTAMP
    WHERE participation_id = $1
    RETURNING *
  `, [participationId, score]);
  return result.rows[0];
};

// Update contest rankings
export const updateContestRankings = async (contestId) => {
  const result = await query(`
    WITH ranked_participants AS (
      SELECT 
        participation_id,
        candidate_id,
        score,
        ROW_NUMBER() OVER (ORDER BY score DESC, submission_time ASC) as new_rank
      FROM "Contest_Participations"
      WHERE contest_id = $1
    )
    UPDATE "Contest_Participations"
    SET rank = rp.new_rank
    FROM ranked_participants rp
    WHERE "Contest_Participations".participation_id = rp.participation_id
    RETURNING "Contest_Participations".participation_id, "Contest_Participations".rank
  `, [contestId]);
  return result.rows;
};

// Get candidate's contest history
export const getCandidateContestHistory = async (candidateId) => {
  const result = await query(`
    SELECT 
      cp.participation_id,
      cp.contest_id,
      cp.score,
      cp.rank,
      cp.submission_time,
      c.title as contest_title,
      c.type as contest_type,
      c.domain_id,
      d.domain_name
    FROM "Contest_Participations" cp
    JOIN "Contests" c ON cp.contest_id = c.contest_id
    LEFT JOIN "Domains" d ON c.domain_id = d.domain_id
    WHERE cp.candidate_id = $1
    ORDER BY cp.submission_time DESC
  `, [candidateId]);
  return result.rows;
};

// Get candidate's contest participation status
export const getCandidateContestParticipation = async (candidateId, contestId) => {
  const result = await query(`
    SELECT *
    FROM "Contest_Participations"
    WHERE candidate_id = $1 AND contest_id = $2
  `, [candidateId, contestId]);
  return result.rows[0];
};

// Create new contest
export const createContest = async (contestData) => {
  const { title, description, type, start_time, end_time, domain_id, max_participants } = contestData;
  const result = await query(`
    INSERT INTO "Contests" 
    (title, description, type, start_time, end_time, domain_id, max_participants)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [title, description, type, start_time, end_time, domain_id, max_participants]);
  return result.rows[0];
};