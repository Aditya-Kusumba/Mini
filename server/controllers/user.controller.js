import { asyncHandler }         from "../utils/asyncHandler.js";
import { ApiError }             from "../utils/ApiError.js";
import { ApiResponse }          from "../utils/ApiResponse.js";
import { uploadOnCloudinary }   from "../utils/cloudinary.js";
import {
  register, login, getUserById, updateRefreshToken,
  checkEmail, checkUsername, updateCandidateProfile,
  getRecruiterById, getUser, logOut, getRecUser, genOTP, verOTP,
} from "../db.js";
import { query } from "../db.js";

// ── Register ─────────────────────────────────────────────────
// Flow: frontend calls /register AFTER OTP is verified.
// This just creates the account.
const registerUser = asyncHandler(async (req, res) => {
  const { name, username, email, password, role, companyname } = req.body;

  if ([name, username, email, password, role].some(f => !f?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  const createdUser = await register(username, email, name, password, role, companyname);

  if (!createdUser) {
    throw new ApiError(400, "Something went wrong while creating user");
  }

  return res.status(200).json(new ApiResponse(200, createdUser, "User created successfully"));
});

// ── Login ─────────────────────────────────────────────────────
const logInUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { userobj, accessToken, refreshToken } = await login(email, password);

  if (!userobj?.id) {
    throw new ApiError(400, "User does not exist");
  }

  return res
    .status(200)
    .cookie("accessToken",  accessToken,  { httpOnly: true, secure: true, sameSite: "none" })
    .cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, sameSite: "none" })
    .json(new ApiResponse(200, { user: userobj, refreshToken, accessToken }, "Logged in successfully"));
});

// ── Logout ────────────────────────────────────────────────────
const logOutUser = asyncHandler(async (req, res) => {
  await updateRefreshToken(req.user.id, "CANDIDATE", null);
  return res
    .status(200)
    .clearCookie("accessToken",  { httpOnly: true, secure: true })
    .clearCookie("refreshToken", { httpOnly: true, secure: true })
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

// ── Check email / username ────────────────────────────────────
const checkemail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await checkEmail(email);
  return res.status(200).json(result
    ? { user: true, email: true }
    : { user: false }
  );
});

const checkusername = asyncHandler(async (req, res) => {
  const { username } = req.body;
  const result = await checkUsername(username);
  return res.status(200).json(result
    ? { user: true, username: true }
    : { user: false }
  );
});

// ── OTP: generate ─────────────────────────────────────────────
// Called BEFORE user is created (step 1 of registration)
// Also used for resend
const generateOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  // genOTP sends the email and saves hash to DB — it throws on failure
  await genOTP(email);

  return res.status(200).json({ success: true, message: "OTP sent to email" });
});

// ── OTP: verify ───────────────────────────────────────────────
// Called after user enters the 6-digit code
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) throw new ApiError(400, "Email and OTP are required");

  const result = await verOTP(email, otp);

  if (!result.success) {
    throw new ApiError(400, result.message || "OTP verification failed");
  }

  return res.status(200).json({ success: true, message: "OTP verified successfully" });
});

// ── Update profile ────────────────────────────────────────────
const updateDetails = asyncHandler(async (req, res) => {
  const candidateId = req.user.id;
  try {
    const data = req.body || {};
    const { domains, education, experience, projects, skills } = JSON.parse(data.data);

    let cvUrl = undefined;
    const localCvPath = req.files?.resume?.[0]?.path;
    if (localCvPath) {
      const uploadedCv = await uploadOnCloudinary(localCvPath);
      if (!uploadedCv?.url) throw new ApiError(400, "CV upload failed");
      cvUrl = uploadedCv.url;
    }

    const updateResult = await updateCandidateProfile({
      candidateId, domains, education, experience, projects, skills, cvUrl,
    });

    if (!updateResult.success) throw new ApiError(500, "Failed to update profile");

    const updated = updateResult.data;
    updated.domains    = JSON.parse(updated.domains    || "[]");
    updated.education  = updated.education  || {};
    updated.experience = updated.experience || {};
    updated.projects   = updated.projects   || {};
    updated.skills     = updated.skills     || {};

    return res.status(200).json({ success: true, message: "Profile updated", data: updated });
  } catch (err) {
    console.error("❌ Error in updateDetails:", err);
    throw new ApiError(err.statusCode || 500, err.message || "Server error");
  }
});

// ── Get current user ──────────────────────────────────────────
const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "User data fetched"));
});

// ── Get candidate dashboard data ─────────────────────────────
const getData = asyncHandler(async (req, res) => {
  const id = req.user?.id;
  if (!id) throw new ApiError(401, "Not authenticated");

  const result = await getUser(id);
  if (!result) throw new ApiError(404, "Candidate not found");

  return res.status(200).json(new ApiResponse(200, result, "Candidate data fetched"));
});

// ── Get recruiter dashboard data ──────────────────────────────
const getRecData = asyncHandler(async (req, res) => {
  const id = req.user?.id;
  if (!id) throw new ApiError(401, "Not authenticated");

  const result = await getRecUser(id);
  if (!result) throw new ApiError(404, "Recruiter not found");

  return res.status(200).json(new ApiResponse(200, result, "Recruiter data fetched"));
});

// ── Stats ─────────────────────────────────────────────────────
const getstats = asyncHandler(async (req, res) => {
  const id = req.user?.id;
  const s1 = `SELECT COUNT(DISTINCT problem_id) FROM submissions WHERE candidate_id=$1 AND status='Accepted'`;
  const s2 = `SELECT COUNT(DISTINCT contest_id) FROM "Contest_Participations" WHERE candidate_id=$1`;
  const [prob, cont] = await Promise.all([query(s1,[id]), query(s2,[id])]);
  return res.status(200).json({
    problems: prob.rows[0].count,
    contests: cont.rows[0].count,
  });
});

// ── Participations / Performance history ─────────────────────
export const getUserParticipations = asyncHandler(async (req, res) => {
  const candidateId = req.user.id;
  const result = await query(
    `SELECT cp.contest_id, cp.score, c.type, c.domain_id
     FROM "Contest_Participations" cp
     JOIN "Contests" c ON cp.contest_id = c.contest_id
     WHERE cp.candidate_id = $1`,
    [candidateId]
  );
  return res.status(200).json(new ApiResponse(200, result.rows, "Participations fetched"));
});

export const getPerformanceHistory = asyncHandler(async (req, res) => {
  const candidateId = req.user?.id;
  const result = await query(
    `SELECT cp.participation_id, cp.contest_id, cp.score, cp.rank, cp.domain_id,
            c.title, c.type, c.start_time, d.domain_name
     FROM "Contest_Participations" cp
     JOIN "Contests" c ON cp.contest_id = c.contest_id
     JOIN "Domains"  d ON c.domain_id   = d.domain_id
     WHERE cp.candidate_id = $1
     ORDER BY cp.submission_time DESC`,
    [candidateId]
  );
  return res.status(200).json(new ApiResponse(200, result.rows, "Performance history fetched"));
});

// ── Jobs ──────────────────────────────────────────────────────
export const getAppliedJobs = asyncHandler(async (req, res) => {
  const { domainId } = req.params;
  const result = await query(
    `SELECT ja.*, j."job_id", j."title", j."location", j."salary_range", j."description"
     FROM "Job_Applications" ja
     INNER JOIN "Jobs" j ON ja."job_id" = j."job_id"
     WHERE ja."candidate_id"=$1 AND j."domain_id"=$2`,
    [req.user.id, domainId]
  );
  return res.status(200).json({ data: result.rows });
});

export const applyForJob = asyncHandler(async (req, res) => {
  const { job_id, candidate_id } = req.body;
  const job = await query(`SELECT * FROM "Jobs" WHERE "job_id"=$1 LIMIT 1`, [job_id]);
  if (!job.rows.length) return res.status(404).json({ message: "Job not found" });

  const existing = await query(
    `SELECT * FROM "Job_Applications" WHERE "job_id"=$1 AND "candidate_id"=$2 LIMIT 1`,
    [job_id, candidate_id]
  );
  if (existing.rows.length) return res.status(200).json({ message: "Already applied" });

  const newApp = await query(
    `INSERT INTO "Job_Applications" ("job_id","candidate_id","status") VALUES ($1,$2,$3) RETURNING *`,
    [job_id, candidate_id, "APPLIED"]
  );
  return res.status(201).json({ data: newApp });
});

// ── Exports ───────────────────────────────────────────────────
export {
  registerUser, logInUser, logOutUser,
  checkemail, checkusername,
  updateDetails,
  getCurrentUser, getData, getRecData,
  getstats,
  generateOTP, verifyOTP,
};