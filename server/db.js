import { Client } from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ApiError } from "./utils/ApiError.js";

const client = new Client({
  connectionString: `${process.env.DATABASE_URL}`,
  ssl: {
    rejectUnauthorized: false,
  },
});

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

await client.connect();
console.log("✅ Connected to PostgreSQL");

const checkUsername = async (username) => {
  const query = `(SELECT 1 FROM "Candidates" WHERE username = $1)`;
  const result = await client.query(query, [username]);
  return result.rows.length > 0;
};

const checkEmail = async (email) => {
  const query = `(SELECT 1 FROM "Candidates" WHERE email = $1)`;
  const result = await client.query(query, [email]);
  return result.rows.length > 0;
};

// ── JWT helpers ──────────────────────────────────────────────
const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email, username: user.username, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "2m" }
  );
};

const generateAccessAndRefreshToken = async (user) => {
  const accessToken  = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  await updateRefreshToken(user.id, user.role, refreshToken);
  return { accessToken, refreshToken };
};

// Handles CANDIDATE, RECRUITER, and ADMIN
const updateRefreshToken = async (userId, role, refreshToken) => {
  let tableName;
  if (role === "CANDIDATE")  tableName = "Candidates";
  else if (role === "RECRUITER") tableName = "Recruiters";
  else if (role === "ADMIN") tableName = "Adminstrators";
  else return; // unknown role — do nothing

  try {
    await client.query(
      `UPDATE "${tableName}" SET "refreshToken" = $1 WHERE id = $2`,
      [refreshToken, userId]
    );
  } catch (err) {
    console.error("Error updating refresh token:", err);
  }
};

// ── Get user by ID ────────────────────────────────────────────
const getUserById = async (userId) => {
  try {
    const res = await client.query(
      `SELECT id, username, email, "fullName", 'CANDIDATE' AS role, "cvUrl", "refreshToken"
       FROM "Candidates" WHERE id = $1 LIMIT 1`,
      [userId]
    );
    return res.rows[0] || null;
  } catch (err) {
    console.error("Error fetching user by ID:", err);
    return null;
  }
};

const getRecruiterById = async (userId) => {
  try {
    const res = await client.query(
      `SELECT id, username, email, "fullName", 'RECRUITER' AS role, "refreshToken"
       FROM "Recruiters" WHERE id = $1 LIMIT 1`,
      [userId]
    );
    return res.rows[0] || null;
  } catch (err) {
    console.error("Error fetching recruiter by ID:", err);
    return null;
  }
};

// ── Register ─────────────────────────────────────────────────
const register = async (username, email, fullName, password, role, company) => {
  const allowedTables = {
    CANDIDATE: "Candidates",
    RECRUITER: "Recruiters",
  };

  const tableName = allowedTables[role?.toUpperCase()];
  if (!tableName) throw new ApiError(400, "Invalid user role specified");

  try {
    const usernameExists = await checkUsername(username);
    if (usernameExists) throw new ApiError(400, "Username already taken");

    const emailExists = await checkEmail(email);
    if (emailExists) throw new ApiError(400, "Email already in use");

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();

    const insertQuery = `
      INSERT INTO "${tableName}" (username, email, "fullName", "passwordHash", "created_at")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, "fullName"
    `;
    const res = await client.query(insertQuery, [username, email, fullName, passwordHash, now]);

    const newUser = res.rows[0];
    const rec_id  = newUser.id;
    newUser.role  = role.toUpperCase();

    if (role === "RECRUITER")
      await client.query(
        `INSERT INTO "Companies" (recruiter_id, company_name) VALUES ($1, $2)`,
        [rec_id, company]
      );

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(newUser);
    await client.query(
      `UPDATE "${tableName}" SET "refreshToken" = $1 WHERE id = $2`,
      [refreshToken, rec_id]
    );

    return { success: true, user: newUser, accessToken, refreshToken };
  } catch (err) {
    console.error("Registration Error:", err);
    throw new ApiError(500, err.message || "Internal server error during registration");
  }
};

// ── Login (candidate / recruiter) ────────────────────────────
const login = async (credential, password) => {
  try {
    const res = await client.query(
      `SELECT id, username, email, "passwordHash", "fullName", "refreshToken", 'CANDIDATE' AS role
       FROM "Candidates" WHERE email = $1 OR username = $1`,
      [credential]
    );
    if (res.rows.length === 0) throw new ApiError(401, "User not found");

    const user = res.rows[0];
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new ApiError(401, "Invalid credentials");

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user);

    let cvUrl;
    if (user.role === "CANDIDATE") cvUrl = (await getUserById(user.id))?.cvUrl;

    const userobj = {
      id:       user.id,
      username: user.username,
      email:    user.email,
      fullName: user.fullName,
      role:     user.role,
      cvUrl,
    };
    return { userobj, accessToken, refreshToken };
  } catch (err) {
    console.error("Login Error:", err);
    throw new ApiError(err.statusCode || 500, err.message || "Login failed");
  }
};

// ── Update candidate profile ──────────────────────────────────
const updateCandidateProfile = async ({
  candidateId, domains, education, experience, projects, skills, cvUrl,
}) => {
  try {
    const result = await client.query(
      `UPDATE "Candidates"
       SET education = $1, experience = $2, projects = $3, skills = $4,
           "cvUrl" = COALESCE($5, "cvUrl"), "updatedAt" = NOW()
       WHERE id = $6 RETURNING *`,
      [
        JSON.stringify(education  || []),
        JSON.stringify(experience || []),
        JSON.stringify(projects   || []),
        JSON.stringify(skills     || []),
        cvUrl,
        candidateId,
      ]
    );
    for (const domain of domains) {
      const res = await client.query(
        `SELECT * FROM "Candidate_Domain_Performance" WHERE candidate_id = $1 AND domain_id = $2`,
        [candidateId, domain]
      );
      if (res.rows.length === 0)
        await client.query(
          `INSERT INTO "Candidate_Domain_Performance" (candidate_id, domain_id) VALUES ($1, $2)`,
          [candidateId, domain]
        );
    }
    if (result.rows.length === 0) return { success: false };
    return { success: true, data: result.rows[0] };
  } catch (err) {
    console.error("❌ DB error updating candidate:", err);
    return { success: false, error: err.message };
  }
};

// ── Logout ────────────────────────────────────────────────────
const logOut = async (userId, role) => {
  await updateRefreshToken(userId, role, null);
  return { success: true, message: "Logged out successfully" };
};

// ── OTP ───────────────────────────────────────────────────────
const genOTP = async (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to:   email,
    subject: "Your OTP for Registration",
    text: `Your OTP for registration is: ${otp}. It is valid for 10 minutes.`,
  };
  try {
    await transporter.sendMail(mailOptions);
    const otphash = await bcrypt.hash(otp, 10);
    await client.query(
      `INSERT INTO "otps" (email, otp, expires_at) VALUES ($1, $2, $3)`,
      [email, otphash, new Date(Date.now() + 10 * 60 * 1000)]
    );
  } catch (err) {
    console.error("Error sending OTP email:", err);
    throw new ApiError(500, "Failed to send OTP email");
  }
};

const verOTP = async (email, otp) => {
  const res = await client.query(
    `SELECT otp, expires_at FROM "otps" WHERE email = $1 ORDER BY expires_at DESC LIMIT 1`,
    [email]
  );
  if (res.rows.length === 0) throw new ApiError(400, "No OTP found for this email");

  const { otp: otphash, expires_at } = res.rows[0];
  if (new Date() > expires_at) throw new ApiError(400, "OTP has expired");

  const isMatch = await bcrypt.compare(otp, otphash);
  if (!isMatch) throw new ApiError(400, "Invalid OTP");

  return { success: true, message: "OTP verified successfully" };
};

// ── getUser / getRecUser ──────────────────────────────────────
const getUser = async (id) => {
  const candidateQuery = await client.query(
    `SELECT * FROM "Candidates" WHERE id = $1`, [id]
  );
  if (candidateQuery.rows.length === 0) return null;

  const res = candidateQuery.rows[0];
  const domainsQuery = await client.query(
    `SELECT d.id, d."domainName" AS name, cdp.performance AS score,
            cdp."created_at" AS "enrolledAt"
     FROM "Candidate_Domain" cd
     JOIN "Domains" d ON cd."domainId" = d.id
     LEFT JOIN "Candidate_Domain_Performance" cdp ON cdp."candiadateId" = $1
     WHERE cd."candidateId" = $1`,
    [id]
  );

  return {
    fullName:       res.fullName || 'N/A',
    bio:            res.bio || '',
    skills:         res.skills    || {},
    experience:     res.experience || {},
    projects:       res.projects  || {},
    education:      res.education || {},
    domains:        domainsQuery.rows,
    status:         "ACTIVE",
    profilePicUrl:  res.profilePicUrl || null,
    domainNews:     [],
    timelineEvents: [{ id: 1, date: "2025-10-12T00:00:00Z", description: "Joined the platform." }],
  };
};

const getRecUser = async (id) => {
  const [recruiterResult, statsResult, jobsResult, recentApplicationsResult] = await Promise.all([
    client.query(`SELECT id, username, "fullName", email, "createdAt" FROM "Recruiters" WHERE id = $1`, [id]),
    client.query(
      `SELECT COUNT(j.job_id) AS total_jobs,
              SUM(CASE WHEN j.is_active = true THEN 1 ELSE 0 END) AS active_jobs,
              (SELECT COUNT(*) FROM "Job_Applications" ja_inner
               JOIN "Jobs" j_inner ON ja_inner.job_id = j_inner.job_id
               WHERE j_inner.recruiter_id = $1) AS total_applications
       FROM "Jobs" j WHERE j.recruiter_id = $1`, [id]
    ),
    client.query(
      `SELECT j.job_id, j.title, j.is_active, j.posted_at,
              (SELECT COUNT(*) FROM "Job_Applications" ja WHERE ja.job_id = j.job_id) AS application_count
       FROM "Jobs" j WHERE j.recruiter_id = $1 ORDER BY j.posted_at DESC`, [id]
    ),
    client.query(
      `SELECT ja.application_id, ja.status, ja.applied_at, j.title AS job_title, can."username" AS candidate_name
       FROM "Job_Applications" ja
       JOIN "Jobs" j ON ja.job_id = j.job_id
       JOIN "Candidates" can ON ja.candidate_id = can.id
       WHERE j.recruiter_id = $1 ORDER BY ja.applied_at DESC LIMIT 10`, [id]
    ),
  ]);

  if (recruiterResult.rows.length === 0) return null;

  const s = statsResult.rows[0];
  return {
    recruiterInfo: recruiterResult.rows[0],
    stats: {
      totalJobs:         parseInt(s.total_jobs    || 0, 10),
      activeJobs:        parseInt(s.active_jobs   || 0, 10),
      totalApplications: parseInt(s.total_applications || 0, 10),
    },
    jobs:               jobsResult.rows.map(j => ({ ...j, application_count: parseInt(j.application_count, 10) })),
    recentApplications: recentApplicationsResult.rows,
  };
};

// ═══════════════════════════════════════════════════════════
// ── ADMIN FUNCTIONS (new) ───────────────────────────────────
// ═══════════════════════════════════════════════════════════

// Register a new admin (linked to a college)
const registerAdmin = async (name, email, password, collegeId) => {
  try {
    const existing = await client.query(
      `SELECT 1 FROM "Adminstrators" WHERE email = $1`, [email]
    );
    if (existing.rows.length > 0) throw new ApiError(400, "Email already in use");

    const passwordHash = await bcrypt.hash(password, 10);
    const res = await client.query(
      `INSERT INTO "Adminstrators" (name, email, "passwordHash", college, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, name, email, college`,
      [name, email, passwordHash, collegeId]
    );
    return res.rows[0];
  } catch (err) {
    console.error("Admin registration error:", err);
    throw new ApiError(err.statusCode || 500, err.message || "Admin registration failed");
  }
};

// Login as admin — returns admin object with college info
const loginAdmin = async (email, password) => {
  try {
    const res = await client.query(
      `SELECT a.id, a.name, a.email, a."passwordHash", a.college, a."refreshToken",
              c.name AS "collegeName"
       FROM "Adminstrators" a
       JOIN "Colleges" c ON a.college = c.id
       WHERE a.email = $1`,
      [email]
    );
    if (res.rows.length === 0) throw new ApiError(401, "Admin not found");

    const admin = res.rows[0];
    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) throw new ApiError(401, "Invalid credentials");

    return admin;
  } catch (err) {
    console.error("Admin login error:", err);
    throw new ApiError(err.statusCode || 500, err.message || "Admin login failed");
  }
};

// Fetch admin by ID (used in adminAuth middleware)
const getAdminById = async (adminId) => {
  try {
    const res = await client.query(
      `SELECT a.id, a.name, a.email, a.college, a."refreshToken",
              c.name AS "collegeName"
       FROM "Adminstrators" a
       JOIN "Colleges" c ON a.college = c.id
       WHERE a.id = $1`,
      [adminId]
    );
    return res.rows[0] || null;
  } catch (err) {
    console.error("Error fetching admin by ID:", err);
    return null;
  }
};

// Update admin refresh token
const updateAdminRefreshToken = async (adminId, refreshToken) => {
  try {
    await client.query(
      `UPDATE "Adminstrators" SET "refreshToken" = $1 WHERE id = $2`,
      [refreshToken, adminId]
    );
  } catch (err) {
    console.error("Error updating admin refresh token:", err);
  }
};

// Generate access + refresh tokens for admin and save refresh token
const generateAdminTokens = async (admin) => {
  const accessToken = jwt.sign(
    { userId: admin.id, role: "ADMIN", collegeId: admin.college },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
  const refreshToken = jwt.sign(
    { userId: admin.id, role: "ADMIN", collegeId: admin.college },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
  await updateAdminRefreshToken(admin.id, refreshToken);
  return { accessToken, refreshToken };
};

// ── Query helper ──────────────────────────────────────────────
const query = async (text, params) => {
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// ── Exports ───────────────────────────────────────────────────
export {
  query,
  client,
  register,
  login,
  logOut,
  getUserById,
  updateRefreshToken,
  checkUsername,
  checkEmail,
  updateCandidateProfile,
  getRecruiterById,
  getUser,
  getRecUser,
  genOTP,
  verOTP,
  // Admin (new)
  registerAdmin,
  loginAdmin,
  getAdminById,
  updateAdminRefreshToken,
  generateAdminTokens,
};