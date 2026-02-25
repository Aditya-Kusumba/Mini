import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { query } from "../db.js";

export const getContestById = asyncHandler(async (req, res) => {
    const { contestId } = req.params;
    const candidateId = req.user.id;

    // Step 1: Query for the main contest details
    const contestQuery = `SELECT * FROM "Contests" WHERE contest_id = $1`;
    const contestResult = await query(contestQuery, [contestId]);

    if (contestResult.rows.length === 0) {
        throw new ApiError(404, "Contest not found.");
    }

    const contestData = contestResult.rows[0];

    // --- Smart Timer Logic ---
    if (contestData.type === 'SHIFTING_TEST') {
        // It's a Solo Exam. We need to find the user's personal start time.
        const participationResult = await query(
            `SELECT submission_time FROM "Contest_Participations" WHERE candidate_id = $1 AND contest_id = $2`,
            [candidateId, contestId]
        );
        
        if (participationResult.rows.length === 0) {
            // This can happen if the user navigates directly to the URL without clicking "Start Exam"
            throw new ApiError(403, "You have not started this exam. Please start it from the lobby.");
        }

        const userStartTime = new Date(participationResult.rows[0].submission_time);
        // Calculate the user's personal end_time
        const userEndTime = new Date(userStartTime.getTime() + contestData.duration_minutes * 60000);
        
        // Overwrite the (null) end_time with the user's calculated end time.
        contestData.end_time = userEndTime;
    
    } else if (contestData.type === 'INTERNAL_CONTEST') {
        // It's a Competitive Contest. Check if it's active.
        const now = new Date();
        const start = new Date(contestData.start_time);
        if (now < start) {
            throw new ApiError(403, "This contest has not started yet.");
        }
    }
    // --- End of Smart Timer Logic ---

    // Step 2: Query for all problems linked to this contest
    const problemsQuery = `
        SELECT p.id, p.title, p.description, p.category, p.input_format, p.output_format, p.constraints, p.explanation 
        FROM "problems" p
        JOIN "Contest_Problems" cp ON p.id = cp.problem_id
        WHERE cp.contest_id = $1;
    `;
    const problemsResult = await query(problemsQuery, [contestId]);
    const problems = problemsResult.rows;

    // Loop through each problem to fetch its visible test cases
    for (const problem of problems) {
        const testCasesQuery = `
            SELECT input, expected_output 
            FROM "testcases" 
            WHERE problem_id = $1 AND is_hidden = FALSE;
        `;
        const testCasesResult = await query(testCasesQuery, [problem.id]);
        problem.visibleTestCases = testCasesResult.rows;
    }

    contestData.problems = problems;

    return res.status(200).json(new ApiResponse(200, contestData, "Contest details fetched successfully."));
});


export const createContest = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        type,
        start_time,
        duration_minutes, // We now receive duration instead of end_time
        domain_id,
        // problemIds
    } = req.body;
    const problemIds = [1, 2, 3];
    // Validation
    if (!title || !type || !domain_id || !duration_minutes || !problemIds || problemIds.length === 0) {
        throw new ApiError(400, "All fields, including duration and at least one problem, are required.");
    }
    // For scheduled, competitive contests, a start time is mandatory.
    if (type === 'INTERNAL_CONTEST' && !start_time) {
        throw new ApiError(400, "A start time is required for competitive contests.");
    }

    // Calculate the end_time based on start_time and duration if a start_time is provided
    let end_time = null;
    if (start_time) {
        const startTimeObj = new Date(start_time);
        // Add the duration (in minutes) to the start time to get the end time
        end_time = new Date(startTimeObj.getTime() + duration_minutes * 60000);
    }

    // Use a database transaction to ensure data integrity
    try {
        await query('BEGIN');

        const contestInsertQuery = `
            INSERT INTO "Contests" (title, description, type, start_time, end_time, domain_id, duration_minutes)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING contest_id;
        `;
        const contestResult = await query(contestInsertQuery, [title, description, type, start_time || null, end_time, domain_id, duration_minutes]);
        const newContestId = contestResult.rows[0].contest_id;

        const linkProblemsQuery = `INSERT INTO "Contest_Problems" (contest_id, problem_id) VALUES ($1, $2);`;
        for (const problemId of problemIds) {
            await query(linkProblemsQuery, [newContestId, problemId]);
        }

        await query('COMMIT');
        return res.status(201).json(new ApiResponse(201, { contest_id: newContestId }, "Event created successfully."));

    } catch (error) {
        await query('ROLLBACK');
        console.error("Error creating contest:", error);
        throw new ApiError(500, "Failed to create the event due to a server error.");
    }
});

export const getContests = asyncHandler(async (req, res) => {
    // ✅ FIX: The query now JOINS with the "Domains" table to get the domain_name
    const contestsQuery = `
        SELECT 
            c.contest_id, 
            c.title, 
            c.description, 
            c.type, 
            c.start_time, 
            c.end_time, 
            c.duration_minutes, 
            c.domain_id,
            d.domain_name
        FROM "Contests" c
        JOIN "Domains" d ON c.domain_id = d.domain_id
        ORDER BY d.domain_name, c.start_time DESC NULLS LAST;
    `;
    const result = await query(contestsQuery);
    return res.status(200).json(new ApiResponse(200, result.rows, "Contests fetched successfully."));
});

export const sortAfterContest = asyncHandler(async (req, res)=> {
  try {
    const contest_id = req.params.contestId;
    // 1. Get contest domain_id
    const { rows: contestRows } = await query(
      `SELECT domain_id FROM "Contests" WHERE contest_id = $1`,
      [contest_id]
    );
    if (contestRows.length === 0) {
      throw new Error('Contest not found');
    }
    const contestDomainId = contestRows[0].domain_id;

    // 2. Get all participants with scores
    const { rows: participants } = await query(
      `SELECT cp.candidate_id, cp.score
       FROM "Contest_Participations" cp
       WHERE cp.contest_id = $1`,
      [contest_id]
    );
    if (participants.length === 0) {
      // No participants, just commit and exit
      return 'No participants';
    }

    // 3. Calculate min and max score
    const scores = participants.map(p => Number(p.score) || 0);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);

    // Rating scale
    const minRating = 1000;
    const maxRating = 2000;

    // Helper function to calculate rating by score
    const calculateRating = (score) => {
      if (maxScore === minScore) return minRating; // all same score, everyone gets minRating
      return Math.round(
        minRating + ((score - minScore) / (maxScore - minScore)) * (maxRating - minRating)
      );
    };

    // 4. Update ratings for participants in Candidate_Domain_Performance
    for (const participant of participants) {
      const rating = calculateRating(Number(participant.score) || 0);

      // Update rating for candidate in this domain (contestDomainId)
      await query(
        `UPDATE "Candidate_Domain_Performance"
         SET rating = $1, updated_at = NOW()
         WHERE candidate_id = $2 AND domain_id = $3`,
        [rating, participant.candidate_id, contestDomainId]
      );
    }

    // 5. Assign ranks for participants **only** from contest domain ordered by rating DESC
    // Get candidates in this contest & domain with their updated rating
    const { rows: domainParticipants } = await query(
      `SELECT cp.candidate_id, cdp.rating
       FROM "Contest_Participations" cp
       JOIN "Candidate_Domain_Performance" cdp
         ON cp.candidate_id = cdp.candidate_id AND cdp.domain_id = $2
       WHERE cp.contest_id = $1
       ORDER BY cdp.rating DESC`,
      [contest_id, contestDomainId]
    );

    // Assign ranks
    for (let i = 0; i < domainParticipants.length; i++) {
  const candidate_id = domainParticipants[i].candidate_id;
  const rank = i + 1;

  await query(
    `UPDATE "Candidate_Domain_Performance"
     SET current_rank = $1, updated_at = CURRENT_TIMESTAMP
     WHERE candidate_id = $2 AND domain_id = $3`,
    [rank, candidate_id, contestDomainId])

      // Update rank in Contest_Participations for this candidate and contest
      await query(
        `UPDATE "Contest_Participations"
         SET rank = $1
         WHERE contest_id = $2 AND candidate_id = $3`,
        [rank, contest_id, candidate_id]
      );
    }

    // 6. Commit transaction
    return 'Ratings and ranks reassigned successfully';

  } catch (err) {
  console.log("Error", err);
}
});