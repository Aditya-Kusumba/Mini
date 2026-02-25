import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { query } from "../db.js";

// Get exams by domain
const getExamsByDomain = asyncHandler(async (req, res) => {
  const { domainId } = req.params;
  
  const query2 = `
    SELECT 
      e.exam_id,
      e.exam_name,
      e.exam_type,
      e.description,
      e.duration_minutes,
      e.total_questions,
      e.passing_score,
      e.is_active,
      e.createdAt,
      e.updatedAt
    FROM "Exams" e
    WHERE e.domain_id = $1 AND e.is_active = true
    ORDER BY e.createdAt DESC
  `;
  
  const result = await query(query2, [domainId]);
  
  return res.status(200).json({
    success: true,
    statusCode: 200,
    data: result.rows,
    message: "Exams fetched successfully"
  });
});

// Get exam by ID with questions
const getExamById = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  
  const examQuery = `
    SELECT 
      e.exam_id,
      e.exam_name,
      e.exam_type,
      e.description,
      e.duration_minutes,
      e.total_questions,
      e.passing_score,
      e.is_active
    FROM "Exams" e
    WHERE e.exam_id = $1
  `;
  
  const questionsQuery = `
    SELECT 
      q.question_id,
      q.question_type,
      q.question_text,
      q.options,
      q.points,
      q.difficulty
    FROM "Questions" q
    WHERE q.exam_id = $1
    ORDER BY q.question_id
  `;
  
  const examResult = await query(examQuery, [examId]);
  const questionsResult = await query(questionsQuery, [examId]);
  
  if (examResult.rows.length === 0) {
    throw new ApiError(404, "Exam not found");
  }
  
  const exam = examResult.rows[0];
  exam.questions = questionsResult.rows;
  
  return res.status(200).json({
    success: true,
    statusCode: 200,
    data: exam,
    message: "Exam fetched successfully"
  });
});

// Start exam attempt
const startExamAttempt = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const { candidateId } = req.body;
  
  const query1 = `
    INSERT INTO "Exam_Attempts" (
      candidate_id, exam_id, domain_id, score, max_score, 
      percentage, status, started_at
    )
    SELECT 
      $1, $2, e.domain_id, 0, 0, 0.00, 'IN_PROGRESS', NOW()
    FROM "Exams" e
    WHERE e.exam_id = $2
    RETURNING attempt_id, started_at
  `;
  
  const result = await query(query1, [candidateId, examId]);
  
  return res.status(200).json({
    success: true,
    statusCode: 200,
    data: result.rows[0],
    message: "Exam attempt started successfully"
  });
});

// Submit exam attempt
const submitExamAttempt = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { answers, timeTaken } = req.body;
  
  // Calculate score based on answers
  let score = 0;
  let maxScore = 0;
  
  for (const answer of answers) {
    const questionQuery = `
      SELECT points, correct_answer, question_type
      FROM "Questions" 
      WHERE question_id = $1
    `;
    const questionResult = await query(questionQuery, [answer.questionId]);
    
    if (questionResult.rows.length > 0) {
      const question = questionResult.rows[0];
      maxScore += question.points;
      
      // Simple scoring logic - can be enhanced
      if (answer.answer === question.correct_answer) {
        score += question.points;
      }
    }
  }
  
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  
  const updateQuery = `
    UPDATE "Exam_Attempts"
    SET 
      score = $1,
      max_score = $2,
      percentage = $3,
      time_taken_minutes = $4,
      answers = $5,
      status = 'COMPLETED',
      completed_at = NOW()
    WHERE attempt_id = $6
    RETURNING *
  `;
  
  const result = await query(updateQuery, [
    score, maxScore, percentage, timeTaken, 
    JSON.stringify(answers), attemptId
  ]);
  
  return res.status(200).json({
    success: true,
    statusCode: 200,
    data: result.rows[0],
    message: "Exam submitted successfully"
  });
});

// Get candidate's exam attempts
const getCandidateExamAttempts = asyncHandler(async (req, res) => {
  const { candidateId } = req.params;
  
  const query3 = `
    SELECT 
      ea.attempt_id,
      ea.exam_id,
      ea.domain_id,
      ea.score,
      ea.max_score,
      ea.percentage,
      ea.status,
      ea.started_at,
      ea.completed_at,
      e.exam_name,
      e.exam_type,
      d.domain_name
    FROM "Exam_Attempts" ea
    JOIN "Exams" e ON ea.exam_id = e.exam_id
    JOIN "Domains" d ON ea.domain_id = d.domain_id
    WHERE ea.candidate_id = $1
    ORDER BY ea.started_at DESC
  `;
  
  const result = await query(query3, [candidateId]);
  
  return res.status(200).json({
    success: true,
    statusCode: 200,
    data: result.rows,
    message: "Exam attempts fetched successfully"
  });
});
export const startExam = asyncHandler(async (req, res) => {
    // The examId from the URL is the contest_id
    const { examId } = req.params;
    const candidateId = req.user?.id; // From verifyJWT middleware

    if (!candidateId) {
        throw new ApiError(401, "User not authenticated.");
    }

    // Step 1: Get the exam's duration, type, AND domain_id from the "Contests" table.
    const examResult = await query(
        `SELECT duration_minutes, type, domain_id FROM "Contests" WHERE contest_id = $1`,
        [examId]
    );

    if (examResult.rows.length === 0) {
        throw new ApiError(404, "Exam not found.");
    }
    const { duration_minutes, type, domain_id } = examResult.rows[0];

    // Ensure this is an on-demand exam and not a competitive contest
    if (type !== 'SHIFTING_TEST') {
        throw new ApiError(400, "This event is a competitive contest and cannot be started on-demand.");
    }

    // Step 2: Calculate the effective start and end times for this specific attempt.
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration_minutes * 60000);

    // Step 3: Create a participation record in the "Contest_Participations" table.
    // This now correctly includes the domain_id.
    const participationQuery = `
        INSERT INTO "Contest_Participations" (candidate_id, contest_id, domain_id, submission_time)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (candidate_id, contest_id) DO UPDATE SET submission_time = EXCLUDED.submission_time
        RETURNING participation_id;
    `;
    const participationResult = await query(participationQuery, [candidateId, examId, domain_id, startTime]);
    
    if (participationResult.rows.length === 0) {
        throw new ApiError(500, "Failed to create or update exam participation record.");
    }
    const participationId = participationResult.rows[0].participation_id;

    // Step 4: Return the details to the frontend so it can manage the timer.
    const responseData = {
        participationId,
        startTime,
        endTime,
        duration: duration_minutes,
        domainId: domain_id
    };

    return res.status(200).json(new ApiResponse(200, responseData, "Exam started successfully."));
});



export { 
  getExamsByDomain, 
  getExamById, 
  startExamAttempt, 
  submitExamAttempt,
  getCandidateExamAttempts 
};