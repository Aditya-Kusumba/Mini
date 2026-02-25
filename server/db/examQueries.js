import { query } from "../db.js";

// ============ EXAM QUERIES ============

// Get all exams
export const getAllExams = async () => {
  const result = await query(`
    SELECT 
      e.exam_id,
      e.title,
      e.description,
      e.category,
      e.duration_minutes,
      e.total_questions,
      e.passing_score,
      e.domain_id,
      d.domain_name,
      e.created_at
    FROM "Exams" e
    LEFT JOIN "Domains" d ON e.domain_id = d.domain_id
    ORDER BY e.created_at DESC
  `);
  return result.rows;
};

// Get exam by ID with questions
export const getExamById = async (examId) => {
  const examResult = await query(`
    SELECT 
      e.exam_id,
      e.title,
      e.description,
      e.category,
      e.duration_minutes,
      e.total_questions,
      e.passing_score,
      e.domain_id,
      d.domain_name
    FROM "Exams" e
    LEFT JOIN "Domains" d ON e.domain_id = d.domain_id
    WHERE e.exam_id = $1
  `, [examId]);

  if (examResult.rows.length === 0) return null;

  const questionsResult = await query(`
    SELECT 
      question_id,
      question_text,
      type,
      options,
      difficulty,
      points
    FROM "Exam_Questions"
    WHERE exam_id = $1
    ORDER BY question_id
  `, [examId]);

  return {
    ...examResult.rows[0],
    questions: questionsResult.rows
  };
};

// Get exam questions (without answers)
export const getExamQuestions = async (examId) => {
  const result = await query(`
    SELECT 
      question_id,
      question_text,
      type,
      options,
      difficulty,
      points
    FROM "Exam_Questions"
    WHERE exam_id = $1
    ORDER BY question_id
  `, [examId]);
  return result.rows;
};

// Record exam attempt
export const recordExamAttempt = async (candidateId, examId) => {
  const result = await query(`
    INSERT INTO "Candidate_Exam_Attempts" 
    (candidate_id, exam_id, start_time, status)
    VALUES ($1, $2, CURRENT_TIMESTAMP, 'IN_PROGRESS')
    RETURNING attempt_id, start_time
  `, [candidateId, examId]);
  return result.rows[0];
};

// Update exam attempt with answers and score
export const updateExamAttempt = async (attemptId, answers, score, status = 'COMPLETED') => {
  const result = await query(`
    UPDATE "Candidate_Exam_Attempts"
    SET 
      end_time = CURRENT_TIMESTAMP,
      answers_submitted = $2,
      score = $3,
      status = $4
    WHERE attempt_id = $1
    RETURNING *
  `, [attemptId, JSON.stringify(answers), score, status]);
  return result.rows[0];
};

// Get exam attempt details
export const getExamAttemptDetails = async (attemptId) => {
  const result = await query(`
    SELECT 
      cea.*,
      e.title as exam_title,
      e.category,
      e.total_questions
    FROM "Candidate_Exam_Attempts" cea
    JOIN "Exams" e ON cea.exam_id = e.exam_id
    WHERE cea.attempt_id = $1
  `, [attemptId]);
  return result.rows[0];
};

// Get candidate's exam history
export const getCandidateExamHistory = async (candidateId) => {
  const result = await query(`
    SELECT 
      cea.attempt_id,
      cea.exam_id,
      cea.score,
      cea.status,
      cea.start_time,
      cea.end_time,
      e.title,
      e.category,
      e.total_questions
    FROM "Candidate_Exam_Attempts" cea
    JOIN "Exams" e ON cea.exam_id = e.exam_id
    WHERE cea.candidate_id = $1
    ORDER BY cea.start_time DESC
  `, [candidateId]);
  return result.rows;
};

// Get candidate's active exam attempts
export const getActiveExamAttempts = async (candidateId) => {
  const result = await query(`
    SELECT 
      cea.attempt_id,
      cea.exam_id,
      cea.start_time,
      e.title,
      e.duration_minutes
    FROM "Candidate_Exam_Attempts" cea
    JOIN "Exams" e ON cea.exam_id = e.exam_id
    WHERE cea.candidate_id = $1 AND cea.status = 'IN_PROGRESS'
    ORDER BY cea.start_time DESC
  `, [candidateId]);
  return result.rows;
};