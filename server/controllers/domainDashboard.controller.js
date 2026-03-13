import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  getDomainDashboardData,
  getDailyQuestion,
  completeDailyQuestion,
  getStrengthenTopic,
  submitProblem,
  getDomainProblems,
} from "../db/domainDashboardQueries.js";

// ─────────────────────────────────────────────
// GET /candidate/domain/:domainId/dashboard
// Full domain dashboard — one call
// ─────────────────────────────────────────────
export const domainDashboard = asyncHandler(async (req, res) => {
  const candidateId = req.user.id;
  const { domainId } = req.params;

  const data = await getDomainDashboardData(candidateId, domainId);
  if (!data) {
    throw new ApiError(403, "You are not enrolled in this domain");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Domain dashboard fetched"));
});

// ─────────────────────────────────────────────
// GET /candidate/domain/:domainId/daily
// Today's daily question
// ─────────────────────────────────────────────
export const dailyQuestion = asyncHandler(async (req, res) => {
  const candidateId = req.user.id;
  const { domainId } = req.params;

  const question = await getDailyQuestion(candidateId, domainId);
  return res
    .status(200)
    .json(new ApiResponse(200, question, "Daily question fetched"));
});

// ─────────────────────────────────────────────
// POST /candidate/domain/:domainId/daily/complete
// Mark today's daily question as done
// ─────────────────────────────────────────────
export const markDailyComplete = asyncHandler(async (req, res) => {
  const candidateId = req.user.id;
  const { domainId } = req.params;

  const updated = await completeDailyQuestion(candidateId, domainId);
  if (!updated) {
    throw new ApiError(404, "No daily question found for today");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Daily question marked complete"));
});

// ─────────────────────────────────────────────
// GET /candidate/domain/:domainId/strengthen
// Weakest topic + 3 practice problems
// ─────────────────────────────────────────────
export const strengthenTopic = asyncHandler(async (req, res) => {
  const candidateId = req.user.id;
  const { domainId } = req.params;

  const data = await getStrengthenTopic(candidateId, domainId);
  if (!data) {
    throw new ApiError(404, "No topics found in this domain");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Strengthen topic fetched"));
});

// ─────────────────────────────────────────────
// GET /candidate/domain/:domainId/problems
// All problems in a domain with candidate's status
// ─────────────────────────────────────────────
export const listDomainProblems = asyncHandler(async (req, res) => {
  const candidateId = req.user.id;
  const { domainId } = req.params;

  const problems = await getDomainProblems(candidateId, domainId);
  return res
    .status(200)
    .json(new ApiResponse(200, problems, "Domain problems fetched"));
});

// ─────────────────────────────────────────────
// POST /candidate/problems/:problemId/submit
// Submit a problem attempt
// Body: { status: "Solved" | "Attempted" | "Skipped" }
// ─────────────────────────────────────────────
export const submitProblemAttempt = asyncHandler(async (req, res) => {
  const candidateId = req.user.id;
  const { problemId } = req.params;
  const { status } = req.body;

  const allowed = ["Solved", "Attempted", "Skipped"];
  if (!status || !allowed.includes(status)) {
    throw new ApiError(400, `status must be one of: ${allowed.join(", ")}`);
  }

  const submission = await submitProblem(candidateId, problemId, status);
  return res
    .status(200)
    .json(new ApiResponse(200, submission, "Problem submission recorded"));
});