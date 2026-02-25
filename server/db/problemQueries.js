import { query } from "../db.js";

// ============ PROBLEM QUERIES ============

// Get all problems
export const getAllProblems = async () => {
  const result = await query(`
    SELECT 
      id as problem_id,
      title,
      description,
      difficulty,
      category,
      domain_id,
      created_at
    FROM problems
    ORDER BY created_at DESC
  `);
  return result.rows;
};

// Get problem by ID
export const getProblemById = async (problemId) => {
  const result = await query(`
    SELECT 
      p.id as problem_id,
      p.title,
      p.description,
      p.difficulty,
      p.category,
      p.boilerplate_code,
      p.test_cases,
      p.expected_output,
      p.domain_id,
      d.domain_name
    FROM problems p
    LEFT JOIN "Domains" d ON p.domain_id = d.domain_id
    WHERE p.id = $1
  `, [problemId]);
  return result.rows[0];
};

// Record submission
export const recordSubmission = async (candidateId, problemId, code, language, score, status, feedback) => {
  const result = await query(`
    INSERT INTO submissions 
    (candidate_id, problem_id, submitted_code, language, score, status, feedback, submitted_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
    RETURNING submission_id
  `, [candidateId, problemId, code, language, score, status, feedback]);
  return result.rows[0];
};

// Get problem submissions for a candidate
export const getProblemSubmissions = async (candidateId, problemId) => {
  const result = await query(`
    SELECT 
      id as submission_id,
      submitted_code,
      language,
      score,
      status,
      feedback,
      submitted_at
    FROM submissions
    WHERE candidate_id = $1 AND problem_id = $2
    ORDER BY submitted_at DESC
  `, [candidateId, problemId]);
  return result.rows;
};

// Get candidate's submission history
export const getCandidateSubmissionHistory = async (candidateId, limit = 50) => {
  const result = await query(`
    SELECT 
      s.submission_id,
      s.problem_id,
      s.language,
      s.score,
      s.status,
      s.submitted_at,
      p.title as problem_title,
      p.difficulty,
      p.category
    FROM submissions s
    JOIN problems p ON s.problem_id = p.problem_id
    WHERE s.candidate_id = $1
    ORDER BY s.submitted_at DESC
    LIMIT $2
  `, [candidateId, limit]);
  return result.rows;
};

// Get problems by category
export const getProblemsByCategory = async (category) => {
  const result = await query(`
    SELECT 
      problem_id,
      title,
      description,
      difficulty,
      category,
      domain_id,
      created_at
    FROM problems
    WHERE category = $1
    ORDER BY created_at DESC
  `, [category]);
  return result.rows;
};

// Get problems by difficulty
export const getProblemsByDifficulty = async (difficulty) => {
  const result = await query(`
    SELECT 
      problem_id,
      title,
      description,
      difficulty,
      category,
      domain_id,
      created_at
    FROM problems
    WHERE difficulty = $1
    ORDER BY created_at DESC
  `, [difficulty]);
  return result.rows;
};

// Get problems by domain
export const getProblemsByDomain = async (domainId) => {
  const result = await query(`
    SELECT 
      p.problem_id,
      p.title,
      p.description,
      p.difficulty,
      p.category,
      p.domain_id,
      d.domain_name,
      p.created_at
    FROM problems p
    JOIN "Domains" d ON p.domain_id = d.domain_id
    WHERE p.domain_id = $1
    ORDER BY p.created_at DESC
  `, [domainId]);
  return result.rows;
};

// Get problem statistics
export const getProblemStatistics = async (problemId) => {
  const result = await query(`
    SELECT 
      COUNT(*) as total_submissions,
      COUNT(CASE WHEN status = 'Accepted' THEN 1 END) as accepted_submissions,
      COUNT(CASE WHEN status = 'Wrong Answer' THEN 1 END) as wrong_answers,
      COUNT(CASE WHEN status = 'Time Limit Exceeded' THEN 1 END) as time_limit_exceeded,
      COUNT(CASE WHEN status = 'Runtime Error' THEN 1 END) as runtime_errors,
      AVG(score) as average_score
    FROM submissions
    WHERE problem_id = $1
  `, [problemId]);
  return result.rows[0];
};

// Get candidate's solved problems
export const getCandidateSolvedProblems = async (candidateId) => {
  const result = await query(`
    SELECT DISTINCT
      p.problem_id,
      p.title,
      p.difficulty,
      p.category,
      s.submitted_at as solved_at
    FROM problems p
    JOIN submissions s ON p.problem_id = s.problem_id
    WHERE s.candidate_id = $1 AND s.status = 'Accepted'
    ORDER BY s.submitted_at DESC
  `, [candidateId]);
  return result.rows;
};

// Get leaderboard for a problem
export const getProblemLeaderboard = async (problemId, limit = 10) => {
  const result = await query(`
    SELECT 
      s.candidate_id,
      c.fullName,
      c.username,
      s.score,
      s.submitted_at,
      s.language
    FROM submissions s
    JOIN "Candidates" c ON s.candidate_id = c.id
    WHERE s.problem_id = $1 AND s.status = 'Accepted'
    ORDER BY s.score DESC, s.submitted_at ASC
    LIMIT $2
  `, [problemId, limit]);
  return result.rows;
};

// Create new problem
export const createProblem = async (problemData) => {
  const { title, description, difficulty, category, boilerplate_code, test_cases, expected_output, domain_id } = problemData;
  const result = await query(`
    INSERT INTO problems 
    (title, description, difficulty, category, boilerplate_code, test_cases, expected_output, domain_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING problem_id
  `, [title, description, difficulty, category, boilerplate_code, test_cases, expected_output, domain_id]);
  return result.rows[0];
};
