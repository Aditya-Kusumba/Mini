import { asyncHandler }  from '../utils/asyncHandler.js';
import { ApiError }       from '../utils/ApiError.js';
import { ApiResponse }    from '../utils/ApiResponse.js';
import {
  registerAdmin, loginAdmin,
  generateAdminTokens, updateAdminRefreshToken,
} from '../db.js';
import {
  findCandidateByUsername, addStudentToCollege, bulkAddStudents,
  removeStudentFromCollege, getCollegeStudents, getStudentProfile,
  assignDomainToStudent, bulkAssignDomain, removeDomainFromStudent,
  getCollegeOverview, getDomainAnalytics, getLeaderboard,
  createBatch, getCollegeBatches, addStudentsToBatch, getBatchStudents,
} from '../db/adminQueries.js';
import {
  computePlacementScore, computeAllPlacementScores,
  getPlacementScores, getStudentPlacementScore, getStudentsByTier,
} from '../db/placementQueries.js';

const COOKIE = { httpOnly: true, secure: true, sameSite: 'none' };

// ── Auth ──────────────────────────────────────────────────────

export const adminRegister = asyncHandler(async (req, res) => {
  const { name, email, password, collegeId } = req.body;
  if (!name || !email || !password || !collegeId)
    throw new ApiError(400, 'name, email, password and collegeId are required');
  const admin = await registerAdmin(name, email, password, collegeId);
  return res.status(201).json(new ApiResponse(201, admin, 'Admin registered'));
});

export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password required');

  const admin = await loginAdmin(email, password);
  const { accessToken, refreshToken } = await generateAdminTokens(admin);

  return res
    .status(200)
    .cookie('adminAccessToken', accessToken, COOKIE)
    .cookie('adminRefreshToken', refreshToken, COOKIE)
    .json(new ApiResponse(200, {
      admin: { id: admin.id, name: admin.name, email: admin.email, collegeId: admin.college, collegeName: admin.collegeName },
      accessToken,
      refreshToken,
    }, 'Admin logged in'));
});

export const adminLogout = asyncHandler(async (req, res) => {
  await updateAdminRefreshToken(req.admin.id, null);
  return res
    .status(200)
    .clearCookie('adminAccessToken', COOKIE)
    .clearCookie('adminRefreshToken', COOKIE)
    .json(new ApiResponse(200, null, 'Admin logged out'));
});

export const getAdminProfile = asyncHandler(async (req, res) =>
  res.status(200).json(new ApiResponse(200, req.admin, 'Admin profile'))
);

// ── Students ──────────────────────────────────────────────────

export const addStudent = asyncHandler(async (req, res) => {
  const { username } = req.body;
  if (!username) throw new ApiError(400, 'username required');
  const candidate = await findCandidateByUsername(username);
  if (!candidate) throw new ApiError(404, `No candidate found: ${username}`);
  const result = await addStudentToCollege(req.admin.collegeId, candidate.id, req.admin.id);
  if (!result) throw new ApiError(409, 'Student already in college');
  return res.status(201).json(new ApiResponse(201, result, 'Student added'));
});

export const addStudentsBulk = asyncHandler(async (req, res) => {
  const { usernames } = req.body;
  if (!Array.isArray(usernames) || !usernames.length)
    throw new ApiError(400, 'usernames must be a non-empty array');
  const result = await bulkAddStudents(req.admin.collegeId, usernames, req.admin.id);
  return res.status(200).json(new ApiResponse(200, result, 'Bulk add complete'));
});

export const removeStudent = asyncHandler(async (req, res) => {
  const result = await removeStudentFromCollege(req.admin.collegeId, req.params.candidateId);
  if (!result) throw new ApiError(404, 'Student not found in college');
  return res.status(200).json(new ApiResponse(200, result, 'Student removed'));
});

export const listStudents = asyncHandler(async (req, res) => {
  const students = await getCollegeStudents(req.admin.collegeId);
  return res.status(200).json(new ApiResponse(200, students, 'Students fetched'));
});

export const getStudent = asyncHandler(async (req, res) => {
  const profile = await getStudentProfile(req.admin.collegeId, req.params.candidateId);
  if (!profile) throw new ApiError(404, 'Student not found in college');
  return res.status(200).json(new ApiResponse(200, profile, 'Profile fetched'));
});

// ── Domain assignment ─────────────────────────────────────────

export const assignDomain = asyncHandler(async (req, res) => {
  const { candidateId, domainId } = req.body;
  if (!candidateId || !domainId) throw new ApiError(400, 'candidateId and domainId required');
  const result = await assignDomainToStudent(candidateId, domainId, req.admin.collegeId);
  if (!result) throw new ApiError(409, 'Domain already assigned');
  return res.status(201).json(new ApiResponse(201, result, 'Domain assigned'));
});

export const assignDomainBulk = asyncHandler(async (req, res) => {
  const { candidateIds, domainId } = req.body;
  if (!Array.isArray(candidateIds) || !domainId)
    throw new ApiError(400, 'candidateIds array and domainId required');
  const result = await bulkAssignDomain(candidateIds, domainId, req.admin.collegeId);
  return res.status(200).json(new ApiResponse(200, result, 'Bulk assign complete'));
});

export const unassignDomain = asyncHandler(async (req, res) => {
  const { candidateId, domainId } = req.body;
  if (!candidateId || !domainId) throw new ApiError(400, 'candidateId and domainId required');
  const result = await removeDomainFromStudent(candidateId, domainId);
  if (!result) throw new ApiError(404, 'Assignment not found');
  return res.status(200).json(new ApiResponse(200, result, 'Domain unassigned'));
});

// ── Analytics ─────────────────────────────────────────────────

export const collegeOverview = asyncHandler(async (req, res) => {
  const data = await getCollegeOverview(req.admin.collegeId);
  return res.status(200).json(new ApiResponse(200, data, 'Overview fetched'));
});

export const domainAnalytics = asyncHandler(async (req, res) => {
  const data = await getDomainAnalytics(req.admin.collegeId, req.params.domainId);
  return res.status(200).json(new ApiResponse(200, data, 'Domain analytics fetched'));
});

export const collegeLeaderboard = asyncHandler(async (req, res) => {
  const data = await getLeaderboard(req.admin.collegeId);
  return res.status(200).json(new ApiResponse(200, data, 'Leaderboard fetched'));
});

// ── Placement scores ──────────────────────────────────────────

export const computeScore = asyncHandler(async (req, res) => {
  const { candidateId } = req.body;
  if (!candidateId) throw new ApiError(400, 'candidateId required');
  const result = await computePlacementScore(candidateId, req.admin.collegeId);
  return res.status(200).json(new ApiResponse(200, result, 'Score computed'));
});

export const computeAllScores = asyncHandler(async (req, res) => {
  const results = await computeAllPlacementScores(req.admin.collegeId);
  return res.status(200).json(new ApiResponse(200, results, `Scores computed for ${results.length} students`));
});

export const allPlacementScores = asyncHandler(async (req, res) => {
  const scores = await getPlacementScores(req.admin.collegeId);
  return res.status(200).json(new ApiResponse(200, scores, 'Scores fetched'));
});

export const studentPlacementScore = asyncHandler(async (req, res) => {
  const score = await getStudentPlacementScore(req.params.candidateId, req.admin.collegeId);
  if (!score) throw new ApiError(404, 'No score found — run compute first');
  return res.status(200).json(new ApiResponse(200, score, 'Score fetched'));
});

export const tierBreakdown = asyncHandler(async (req, res) => {
  const tiers = await getStudentsByTier(req.admin.collegeId);
  return res.status(200).json(new ApiResponse(200, tiers, 'Tier breakdown fetched'));
});

// ── Batches ───────────────────────────────────────────────────

export const createNewBatch = asyncHandler(async (req, res) => {
  const { batchName, year } = req.body;
  if (!batchName) throw new ApiError(400, 'batchName required');
  const batch = await createBatch(req.admin.collegeId, batchName, year);
  return res.status(201).json(new ApiResponse(201, batch, 'Batch created'));
});

export const listBatches = asyncHandler(async (req, res) => {
  const batches = await getCollegeBatches(req.admin.collegeId);
  return res.status(200).json(new ApiResponse(200, batches, 'Batches fetched'));
});

export const addToBatch = asyncHandler(async (req, res) => {
  const { candidateIds } = req.body;
  if (!Array.isArray(candidateIds) || !candidateIds.length)
    throw new ApiError(400, 'candidateIds array required');
  const result = await addStudentsToBatch(req.params.batchId, candidateIds);
  return res.status(200).json(new ApiResponse(200, result, 'Students added to batch'));
});

export const listBatchStudents = asyncHandler(async (req, res) => {
  const students = await getBatchStudents(req.params.batchId);
  return res.status(200).json(new ApiResponse(200, students, 'Batch students fetched'));
});