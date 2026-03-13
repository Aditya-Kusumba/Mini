import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  getAllDomains,
  getCandidateEnrolledDomains,
  checkDomainEnrollment,
  enrollCandidateInDomain,
  unenrollCandidateFromDomain,
  getTopicsByDomain,
  getCandidateTopics,
  startCandidateTopic,
  getCandidatePerformanceSummary,
  getCandidateDomainPerformance,
  updateCandidateTopicScore,
  getCandidateDashboard,
} from "../db/candidateQueries.js";

// ── Dashboard ────────────────────────────────────────────────

export const getDashboard = asyncHandler(async (req, res) => {
  const candidateId = req.user.id;
  const dashboard = await getCandidateDashboard(candidateId);
  if (!dashboard) throw new ApiError(404, "Candidate not found");
  return res.status(200).json(new ApiResponse(200, dashboard, "Dashboard fetched successfully"));
});

// ── Domains ──────────────────────────────────────────────────

export const listAllDomains = asyncHandler(async (req, res) => {
  const domains = await getAllDomains();
  return res.status(200).json(new ApiResponse(200, domains, "All domains fetched"));
});

export const getMyDomains = asyncHandler(async (req, res) => {
  const domains = await getCandidateEnrolledDomains(req.user.id);
  return res.status(200).json(new ApiResponse(200, domains, "Enrolled domains fetched"));
});

export const enrollInDomain = asyncHandler(async (req, res) => {
  const candidateId = req.user.id;
  const { domainId, CollegeId } = req.body;
  if (!domainId) throw new ApiError(400, "domainId is required");

  const alreadyEnrolled = await checkDomainEnrollment(candidateId, domainId);
  if (alreadyEnrolled) throw new ApiError(409, "Already enrolled in this domain");

  const enrollment = await enrollCandidateInDomain(candidateId, domainId, CollegeId);
  return res.status(201).json(new ApiResponse(201, enrollment, "Enrolled successfully"));
});

export const unenrollFromDomain = asyncHandler(async (req, res) => {
  const candidateId = req.user.id;
  const { domainId } = req.params;

  const isEnrolled = await checkDomainEnrollment(candidateId, domainId);
  if (!isEnrolled) throw new ApiError(404, "You are not enrolled in this domain");

  const removed = await unenrollCandidateFromDomain(candidateId, domainId);
  return res.status(200).json(new ApiResponse(200, removed, "Unenrolled successfully"));
});

// ── Topics ───────────────────────────────────────────────────

export const getDomainTopics = asyncHandler(async (req, res) => {
  const { domainId } = req.params;
  if (!domainId) throw new ApiError(400, "domainId is required");
  const topics = await getTopicsByDomain(domainId);
  return res.status(200).json(new ApiResponse(200, topics, "Topics fetched"));
});

export const getMyTopics = asyncHandler(async (req, res) => {
  const topics = await getCandidateTopics(req.user.id);
  return res.status(200).json(new ApiResponse(200, topics, "Your topics fetched"));
});

export const startTopic = asyncHandler(async (req, res) => {
  const candidateId = req.user.id;
  const { domainId } = req.body;
  if (!domainId) throw new ApiError(400, "domainId is required");

  const isEnrolled = await checkDomainEnrollment(candidateId, domainId);
  if (!isEnrolled) throw new ApiError(403, "Enroll in this domain before starting topics");

  const result = await startCandidateTopic(candidateId, domainId);
  if (result.alreadyExists) {
    return res.status(200).json(new ApiResponse(200, null, "Topic already started"));
  }
  return res.status(201).json(new ApiResponse(201, result.data, "Topic started successfully"));
});

// ── Performance ──────────────────────────────────────────────

export const getMyPerformance = asyncHandler(async (req, res) => {
  const performance = await getCandidatePerformanceSummary(req.user.id);
  return res.status(200).json(new ApiResponse(200, performance, "Performance summary fetched"));
});

export const getDomainPerformance = asyncHandler(async (req, res) => {
  const { domainId } = req.params;
  const performance = await getCandidateDomainPerformance(req.user.id, domainId);
  if (!performance) throw new ApiError(404, "No performance data for this domain");
  return res.status(200).json(new ApiResponse(200, performance, "Domain performance fetched"));
});

// PUT /candidate/performance/topic/:topicId   { score }
export const updateTopicScore = asyncHandler(async (req, res) => {
  const candidateId = req.user.id;
  const { topicId } = req.params;
  const { score } = req.body;

  if (score === undefined || score === null) throw new ApiError(400, "score is required");
  if (score < 0 || score > 100) throw new ApiError(400, "score must be 0–100");

  const updated = await updateCandidateTopicScore(candidateId, topicId, score);
  if (!updated) throw new ApiError(404, "No performance record found for this topic");

  return res.status(200).json(new ApiResponse(200, updated, "Score updated successfully"));
});