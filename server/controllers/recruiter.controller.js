import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
// Correctly import the 'query' function from your db file
import { query } from "../db.js";
import {
    createJobPost as createJobPostData,
    getJobApplications as getJobApplicationsData,
    updateJobApplicationStatus as updateApplicationStatusData,
    getCandidatesByTier as getCandidatesByTierData,
    getRecruiterAnalytics as getAnonymousAnalyticsData,
    getRecruiterSubscriptionStatus as getRecruiterSubscriptionData,
    createRecruiterSubscription as upgradeSubscriptionData
    // NOTE: getRecruiterDashboardData is no longer needed from here
} from "../db/recruiterQueries.js";

// --- HELPER FUNCTION ---
// Checks if the recruiter's subscription allows access to a specific tier level.
const checkTierAccess = async (recruiterId, tierId) => {
    try {
        const sql = `
          SELECT rs.max_tier_access, t.tier_level
          FROM "Recruiter_Subscriptions" rs
          JOIN "Tiers" t ON t.tier_id = $1
          WHERE rs.recruiter_id = $2 AND rs.status = 'ACTIVE'
        `;
        const result = await query(sql, [tierId, recruiterId]);

        if (result.rows.length === 0) {
            return false; // No active subscription found
        }
        
        const subscription = result.rows[0];
        return subscription.max_tier_access >= subscription.tier_level;
    } catch (error) {
        console.error("Error checking tier access:", error);
        return false;
    }
};


// --- CONTROLLERS ---

// ✅ FIXED: Get all recruiter dashboard data, including companies
const getRecruiterDashboard = asyncHandler(async (req, res) => {
    const recruiterId = req.user?.id;
    if (!recruiterId) {
        throw new ApiError(401, "Unauthorized: Recruiter ID not found.");
    }

    // --- Define all queries to run in parallel ---
    const recruiterInfoQuery = `SELECT id, "fullName", email FROM "Recruiters" WHERE id = $1`;
    
    const statsQuery = `
        SELECT 
            COUNT(j.job_id) AS total_jobs,
            SUM(CASE WHEN j.is_active = true THEN 1 ELSE 0 END) AS active_jobs,
            (SELECT COUNT(*) FROM "Job_Applications" ja_inner JOIN "Jobs" j_inner ON ja_inner.job_id = j_inner.job_id WHERE j_inner.recruiter_id = $1) AS total_applications
        FROM "Jobs" j WHERE j.recruiter_id = $1
    `;
    
    const jobsQuery = `
        SELECT j.job_id, j.title, j.is_active, j.posted_at, (SELECT COUNT(*) FROM "Job_Applications" ja WHERE ja.job_id = j.job_id) AS application_count
        FROM "Jobs" j WHERE j.recruiter_id = $1 ORDER BY j.posted_at DESC
    `;
    
    const recentApplicationsQuery = `
        SELECT ja.application_id, ja.status, ja.applied_at, j.title AS job_title, can."fullName" AS candidate_name 
        FROM "Job_Applications" ja
        JOIN "Jobs" j ON ja.job_id = j.job_id 
        JOIN "Candidates" can ON ja.candidate_id = can.id
        WHERE j.recruiter_id = $1 ORDER BY ja.applied_at DESC LIMIT 10
    `;
    
    // This query fetches the companies associated with the recruiter
    const companiesQuery = `SELECT company_id, company_name FROM "Companies" WHERE recruiter_id = $1 ORDER BY company_name`;

    // --- Execute all queries ---
    const [
        recruiterResult,
        statsResult,
        jobsResult,
        recentApplicationsResult,
        companiesResult
    ] = await Promise.all([
        query(recruiterInfoQuery, [recruiterId]),
        query(statsQuery, [recruiterId]),
        query(jobsQuery, [recruiterId]),
        query(recentApplicationsQuery, [recruiterId]),
        query(companiesQuery, [recruiterId])
    ]);
    
    if (recruiterResult.rows.length === 0) {
        throw new ApiError(404, "Recruiter not found.");
    }
    
    // --- Assemble the final response object ---
    const finalResponse = {
        recruiterInfo: recruiterResult.rows[0],
        stats: {
            totalJobs: parseInt(statsResult.rows[0].total_jobs || 0, 10),
            activeJobs: parseInt(statsResult.rows[0].active_jobs || 0, 10),
            totalApplications: parseInt(statsResult.rows[0].total_applications || 0, 10),
        },
        jobs: jobsResult.rows.map(job => ({ ...job, application_count: parseInt(job.application_count, 10) })),
        recentApplications: recentApplicationsResult.rows,
        companies: companiesResult.rows // Add the companies array to the response
    };
    
    return res.status(200).json(new ApiResponse(200, finalResponse, "Recruiter dashboard data fetched successfully"));
});

// Post a new job
const postJob = asyncHandler(async (req, res) => {
    const recruiterId = req.user.id;
    // Use 'let' to allow modification of company_id and target_tier_id
    let {
        domain_id,
        target_tier_id,
        title,
        description,
        requirements,
        salary_range,
        location,
        is_remote,
        application_deadline
    } = req.body;
    // If no company_id is provided by the frontend, set a default value of 1.
    const company_id = await  query(`select company_id from "Companies" where recruiter_id = $1 limit 1`, [recruiterId]);
    
    // ✅ FIX: If no target_tier_id is provided, set a default value of 3.
    if (!target_tier_id) {
        target_tier_id = 4;
    }
    if (!domain_id || !title || !description) {
        throw new ApiError(400, "Missing required fields: domain, title, and description are required.");
    }
    
    const hasAccess = true//await checkTierAccess(recruiterId, target_tier_id);
    if (!hasAccess) {
        throw new ApiError(403, "You do not have access to post jobs for this tier. Please upgrade your subscription.");
    }

    const job = await createJobPostData({
        recruiter_id: recruiterId,
        company_id,
        domain_id,
        target_tier_id,
        title,
        description,
        requirements,
        salary_range,
        location,
        is_remote,
        application_deadline
    });
    return res.status(201).json(new ApiResponse(201, job, "Job posted successfully"));
});

// Get job applications for the recruiter
const getJobApplications = asyncHandler(async (req, res) => {
    const recruiterId = req.user.id;
    const { jobId, status, limit = 50, offset = 0 } = req.query;
    const applications = await getJobApplicationsData(recruiterId, jobId, status, limit, offset);
    return res.status(200).json(new ApiResponse(200, applications, "Job applications fetched successfully"));
});

// Update the status of a specific job application
const updateApplicationStatus = asyncHandler(async (req, res) => {
    const recruiterId = req.user.id;
    const { applicationId } = req.params;
    const { status, notes } = req.body;
    if (!status) throw new ApiError(400, "Status is required");
    const validStatuses = ['VIEWED', 'SHORTLISTED', 'REJECTED'];
    if (!validStatuses.includes(status)) throw new ApiError(400, "Invalid status provided");
    const result = await updateApplicationStatusData(applicationId, status, notes, recruiterId);
    return res.status(200).json(new ApiResponse(200, result, "Application status updated successfully"));
});

// Get a list of candidates filtered by domain and tier
const getCandidatesByTier = asyncHandler(async (req, res) => {
    const recruiterId = req.user.id;
    const { domainId, tierId, limit = 100, offset = 0 } = req.query;
    if (!domainId || !tierId) throw new ApiError(400, "Domain ID and Tier ID are required parameters");
    const hasAccess = await checkTierAccess(recruiterId, tierId);
    if (!hasAccess) throw new ApiError(403, "You do not have access to view candidates in this tier.");
    const candidates = await getCandidatesByTierData(domainId, tierId, limit, offset);
    return res.status(200).json(new ApiResponse(200, candidates, "Candidates fetched successfully"));
});

// Get anonymous analytics for a specific talent pool
const getAnonymousAnalytics = asyncHandler(async (req, res) => {
    const recruiterId = req.user.id;
    const { domainId, tierId, period = '30d' } = req.query;
    if (!domainId || !tierId) throw new ApiError(400, "Domain ID and Tier ID are required parameters");
    const hasAccess = await checkTierAccess(recruiterId, tierId);
    if (!hasAccess) throw new ApiError(403, "You do not have access to view analytics for this tier.");
    const analytics = await getAnonymousAnalyticsData(domainId, tierId, period);
    return res.status(200).json(new ApiResponse(200, analytics, "Analytics fetched successfully"));
});

// Create a custom exam for candidates
const createCustomExam = asyncHandler(async (req, res) => {
    res.status(501).json(new ApiResponse(501, null, "Feature not yet implemented."));
});

// Get the recruiter's current subscription details
const getRecruiterSubscription = asyncHandler(async (req, res) => {
    const recruiterId = req.user.id;
    const subscription = await getRecruiterSubscriptionData(recruiterId);
    return res.status(200).json(new ApiResponse(200, subscription, "Subscription details fetched successfully"));
});

// Upgrade a recruiter's subscription plan
const upgradeSubscription = asyncHandler(async (req, res) => {
    const recruiterId = req.user.id;
    const { plan_type, payment_method } = req.body;
    if (!plan_type) throw new ApiError(400, "Plan type is required");
    const subscription = await upgradeSubscriptionData(recruiterId, plan_type, payment_method);
    return res.status(200).json(new ApiResponse(200, subscription, "Subscription upgraded successfully"));
});

export const getJobCandidates =  asyncHandler(async (req, res) => {
    const recruiterId = req.user.id;

    // 1. Get all jobs posted by this recruiter
    const jobsQuery = `
        SELECT job_id, title, domain_id, target_tier_id, is_active, posted_at
        FROM "Jobs"
        WHERE recruiter_id = $1
        ORDER BY posted_at DESC;
    `;
    const jobsResult = await query(jobsQuery, [recruiterId]);
    const jobs = jobsResult.rows;

    // 2. For each job, fetch its list of applicants
    const applicantFetchPromises = jobs.map(job => {
        const applicantsQuery = `
            SELECT
                c.id,
                c."fullName" AS name,
                c.rating,
                c.skills,
                c.experience,
                c.education,
                c.projects,
                (
                    SELECT d.domain_name 
                    FROM "Domains" d
                    JOIN "Candidate_Domain_Performance" cdp ON d.domain_id = cdp.domain_id
                    WHERE cdp.candidate_id = c.id ORDER BY cdp.total_score DESC LIMIT 1
                ) AS "domainId",
                (
                    SELECT t.tier_name 
                    FROM "Tiers" t
                    JOIN "Candidate_Domain_Performance" cdp ON t.tier_id = cdp.tier_id
                    WHERE cdp.candidate_id = c.id ORDER BY cdp.total_score DESC LIMIT 1
                ) AS "tierId"
            FROM "Candidates" c
            JOIN "Job_Applications" ja ON c.id = ja.candidate_id
            WHERE ja.job_id = $1;
        `;
        return query(applicantsQuery, [job.job_id]);
    });

    const applicantResults = await Promise.all(applicantFetchPromises);

    // 3. Combine the jobs with their respective applicant lists
    const jobsWithApplicants = jobs.map((job, index) => ({
        ...job,
        candidates: applicantResults[index].rows
    }));

    return res.status(200).json(new ApiResponse(200, jobsWithApplicants, "Jobs with applicants fetched successfully."));
});

// Export all the controller functions
export {
    getRecruiterDashboard,
    postJob,
    getJobApplications,
    updateApplicationStatus,
    getCandidatesByTier,
    getAnonymousAnalytics,
    createCustomExam,
    getRecruiterSubscription,
    upgradeSubscription
};

