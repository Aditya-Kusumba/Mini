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
  const query = `
    (SELECT 1 FROM "Candidates" WHERE username = $1)
  `;
  const result = await client.query(query, [username]);
  return result.rows.length > 0;
};

const checkEmail = async (email) => {
  const query = `
    (SELECT 1 FROM "Candidates" WHERE email = $1)
  `;
  const result = await client.query(query, [email]);
  return result.rows.length > 0;
};

// ✅ --- JWT Helper Functions ---
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY}
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
  const accessToken =   generateAccessToken(user);
  const refreshToken =  generateRefreshToken(user);
  await updateRefreshToken(user.id, user.role, refreshToken);
  return { accessToken, refreshToken };
};

const updateRefreshToken = async (userId, role, refreshToken) => {
  const tableName = role === "CANDIDATE" ? "Candidates" : "Recruiters";
  try {
    await client.query(
      `Select "refreshToken" from "${tableName}" WHERE "id" = $1`,
      [userId]
    );
    await client.query(
      `UPDATE "${tableName}" SET "refreshToken" = $1 WHERE "id" = $2`,
      [refreshToken, userId]
    );
  } catch (err) {
    console.error("Error updating refresh token:", err);
  }
};

// ✅ --- Get User by ID ---
const getUserById = async (userId) => {
  try {
    const query = `
      SELECT id, username, email, "fullName", 'CANDIDATE' AS role,"cvUrl", "refreshToken"
      FROM "Candidates" WHERE id = $1
      LIMIT 1;
    `;
    const res = await client.query(query, [userId]);
    return res.rows[0] || null;
  } catch (err) {
    console.error("Error fetching user by ID:", err);
    return null;
  }
};

const getRecruiterById=async (userId) => {
  try {
    const query = `
      SELECT id, username, email, "fullName", 'RECRUITER' AS role, "refreshToken"
      FROM "Recruiters" WHERE id = $1
      LIMIT 1;
    `;
    const res = await client.query(query, [userId]);
    return res.rows[0] || null;
  } catch (err) {
    console.error("Error fetching user by ID:", err);
    return null;
  }
};

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
    RETURNING id, username, email, "fullName";
    `;
    const res = await client.query(insertQuery, [
      username,
      email,
      fullName,
      passwordHash,
      now
    ]);
    
    const newUser = res.rows[0];
    const rec_id = newUser.id;
    newUser.role = role.toUpperCase();
    if(role=="RECRUITER")
      company = await client.query(`insert into "Companies" (recruiter_id, company_name) values($1, $2)`, [rec_id, company]);
    
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(newUser);
    const refreshQuery = `update "${tableName}" set "refreshToken" = $1 where id = $2`;
    console.log("Refresh Token Update Query:", refreshQuery, "Values:", [refreshToken, rec_id]);
    const res2 = await client.query(refreshQuery, [refreshToken, rec_id])
    
    return { success: true, user: newUser, accessToken, refreshToken };
  } catch (err) {
    console.error("Registration Error:", err);
    throw new ApiError(500, err.message || "Internal server error during registration");
  }
};

const login = async (credential, password) => {
  try {
    const query = `
      (SELECT id, username, email, "passwordHash", "fullName", "refreshToken", 'CANDIDATE' AS role
      FROM "Candidates"
      WHERE email = $1 OR username = $1
      )
    `;

    const res = await client.query(query, [credential]);
    if (res.rows.length === 0) throw new ApiError(401, "User not found");

    const user = res.rows[0];
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new ApiError(401, "Invalid credentials");

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user);
     let cvUrl=undefined
    if(user.role==="CANDIDATE"){
      cvUrl=(await getUserById(user.id)).cvUrl
    }
   const userobj = {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        cvUrl,
      };
    return {userobj, accessToken, refreshToken};
  } catch (err) {
    console.error("Login Error:", err);
    throw new ApiError(err.statusCode || 500, err.message || "Login failed");
  }
};

// ✅ --- resume upload User ---
const updateCandidateProfile = async ({
  candidateId,
  domains,
  education,
  experience,
  projects,
  skills,
  cvUrl,
}) => {
  try {
    const query = `UPDATE "Candidates"
      SET
        education = $1,
        experience = $2,
        projects = $3,
        skills = $4,
        "cvUrl" = COALESCE($5, "cvUrl"),
        "updatedAt" = NOW()
      WHERE id = $6
      RETURNING *;
    `;
   
    


    const values = [
      JSON.stringify(education || []),
      JSON.stringify(experience || []),
      JSON.stringify(projects || []),
      JSON.stringify(skills || []),
      cvUrl,
      candidateId,
    ];


    const result = await client.query(query, values);
    for (const domain of domains) {
      const res = await client.query(`select * from "Candidate_Domain_Performance" where candidate_id = $1 AND domain_id = $2`, [candidateId, domain]);
      if(res.rows.length==0)
    await client.query(
      `INSERT INTO "Candidate_Domain_Performance" (candidate_id, domain_id) 
      VALUES($1, $2)`,
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

const logOut = async (userId, role) => {
  await updateRefreshToken(userId, role, null);
  return { success: true, message: "Logged out successfully" };
};

const genOTP = async (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP for Registration",
    text: `Your OTP for registration is: ${otp}. It is valid for 10 minutes.`,
  };
  try {
    await transporter.sendMail(mailOptions);
    const otphash = await bcrypt.hash(otp, 10);
    const insertQuery = `
    INSERT INTO "otps" (email, otp, expires_at) VALUES ($1, $2, $3)`;
    const res = await client.query(insertQuery, [
      email,
      otphash,
      new Date(Date.now() + 10 * 60 * 1000)
    ]);
  } catch (err) {
    console.error("Error sending OTP email:", err);
    throw new ApiError(500, "Failed to send OTP email");
  }
};

const verOTP = async (email, otp) => {
  const query = `SELECT otp, expires_at FROM "otps" WHERE email = $1 ORDER BY expires_at DESC LIMIT 1`;
  const res = await client.query(query, [email]);
  if (res.rows.length === 0) {
    throw new ApiError(400, "No OTP found for this email");
  }
  const { otp: otphash, expires_at } = res.rows[0];
  if (new Date() > expires_at) {
    throw new ApiError(400, "OTP has expired");
  }
  const isMatch = await bcrypt.compare(otp, otphash);
  if (!isMatch) {
    throw new ApiError(400, "Invalid OTP");
  }
  return { success: true, message: "OTP verified successfully" };
};

const getUser = async (id) => {
    // 1. Get the main candidate details
    let candidateQuery = await client.query(`SELECT * FROM "Candidates" WHERE id = $1`, [id]);
    
    // Check if candidate exists
    if (candidateQuery.rows.length === 0) {
        return null;
    }
    
    let res = candidateQuery.rows[0];

    // Fetch domain data (this part is correct)
    const domainsQuery = await client.query(`
        SELECT
    d.domain_id AS id,
    d.domain_name AS name,
    t.tier_level AS tier,
    cdp.current_rank AS rank,
    t.max_slots AS "totalInTier",
    0 AS progress -- NOTE: 'progress' is missing from your tables, so we're using a placeholder.
FROM
    "Candidate_Domain_Performance" cdp
JOIN
    "Domains" d ON cdp.domain_id = d.domain_id
JOIN
    "Tiers" t ON cdp.tier_id = t.tier_id
WHERE
    cdp.candidate_id = $1;
    `, [id]);
    
    const domains = domainsQuery.rows;

    // --- ✅ FIX: Parse JSON strings from the database into actual arrays/objects ---
    const finalResponse = {
        fullName: res.fullName || 'N/A',
        bio: res.bio || '',
        
        // Safely parse JSON string fields, defaulting to empty array if null or invalid
        skills: res.skills ? res.skills : {}, 
        experience: res.experience ? res.experience : {},
        projects: res.projects ? res.projects : {},
        education: res.education ? res.education : {},

        domains: domains,
        status: "ACTIVE",
        profilePicUrl: res.profilePicUrl || null,
        domainNews: [], // Default empty array
        timelineEvents: [
            {
                id: 1,
                date: "2025-10-12T00:00:00Z",
                description: "Joined the platform."
            }
        ]
    };
    
    return finalResponse;
};

const getRecUser = async (id) => {
    // 1. Define all the queries needed for the dashboard
    // Query for the recruiter's basic profile information
    const recruiterInfoQuery = `
        SELECT id, username, "fullName", email, "createdAt" 
        FROM "Recruiters" 
        WHERE id = $1
    `;

    // Query for high-level statistics
    const statsQuery = `
        SELECT 
            COUNT(j.job_id) AS total_jobs,
            SUM(CASE WHEN j.is_active = true THEN 1 ELSE 0 END) AS active_jobs,
            (SELECT COUNT(*) 
             FROM "Job_Applications" ja_inner 
             JOIN "Jobs" j_inner ON ja_inner.job_id = j_inner.job_id 
             WHERE j_inner.recruiter_id = $1) AS total_applications
        FROM "Jobs" j
        WHERE j.recruiter_id = $1
    `;

    // Query for all jobs posted by the recruiter, including a count of applications for each
    const jobsQuery = `
        SELECT
            j.job_id,
            j.title,
            j.is_active,
            j.posted_at,
            (SELECT COUNT(*) 
             FROM "Job_Applications" ja 
             WHERE ja.job_id = j.job_id) AS application_count
        FROM "Jobs" j
        WHERE j.recruiter_id = $1
        ORDER BY j.posted_at DESC
    `;
    
    // Query for the 10 most recent job applications received
    // Note: This assumes a "Candidates" table exists with an "id" and "fullName"
    const recentApplicationsQuery = `
        SELECT 
            ja.application_id,
            ja.status,
            ja.applied_at,
            j.title AS job_title,
            can."username" AS candidate_name 
        FROM "Job_Applications" ja
        JOIN "Jobs" j ON ja.job_id = j.job_id
        JOIN "Candidates" can ON ja.candidate_id = can.id
        WHERE j.recruiter_id = $1
        ORDER BY ja.applied_at DESC
        LIMIT 10
    `;

    // 2. Execute all queries in parallel for better performance
    const [
        recruiterResult,
        statsResult,
        jobsResult,
        recentApplicationsResult
    ] = await Promise.all([
        client.query(recruiterInfoQuery, [id]),
        client.query(statsQuery, [id]),
        client.query(jobsQuery, [id]),
        client.query(recentApplicationsQuery, [id])
    ]);
    
    // 3. Check if the recruiter exists
    if (recruiterResult.rows.length === 0) {
        return null;
    }
    
    // 4. Assemble the final, structured response object
    const finalResponse = {
        // Basic info about the logged-in recruiter
        recruiterInfo: recruiterResult.rows[0],
        
        // Key performance indicators for a quick overview
        stats: {
            totalJobs: parseInt(statsResult.rows[0].total_jobs || 0, 10),
            activeJobs: parseInt(statsResult.rows[0].active_jobs || 0, 10),
            totalApplications: parseInt(statsResult.rows[0].total_applications || 0, 10),
        },
        
        // A detailed list of all jobs posted by the recruiter
        jobs: jobsResult.rows.map(job => ({
            ...job,
            application_count: parseInt(job.application_count, 10)
        })),
        
        // A feed of the latest applications to keep the recruiter updated
        recentApplications: recentApplicationsResult.rows
    };
    
    return finalResponse;
};
// ✅ --- Query Function ---
const query = async (text, params) => {
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// ✅ --- Export Everything ---
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
  verOTP
};


// A helper function to query the database