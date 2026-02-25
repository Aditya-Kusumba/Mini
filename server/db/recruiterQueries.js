import { INTEGER } from "sequelize";
import { query } from "../db.js";

// ============ RECRUITER QUERIES ============

// Get recruiter dashboard data
export const getRecruiterDashboard = async (recruiterId) => {
  const result = await query(`
    SELECT 
      r.id as recruiter_id,
      r.fullName,
      r.username,
      r.email,
      c.company_name,
      COUNT(j.job_id) as total_jobs,
      COUNT(ja.application_id) as total_applications,
      COUNT(CASE WHEN ja.status = 'PENDING' THEN 1 END) as pending_applications,
      COUNT(CASE WHEN ja.status = 'ACCEPTED' THEN 1 END) as accepted_applications
    FROM "Recruiters" r
    LEFT JOIN "Companies" c ON r.id = c.recruiter_id
    LEFT JOIN "Jobs" j ON r.id = j.recruiter_id
    LEFT JOIN "Job_Applications" ja ON j.job_id = ja.job_id
    WHERE r.id = $1
    GROUP BY r.id, r.fullName, r.username, r.email, c.company_name
  `, [recruiterId]);
  return result.rows[0];
};

// Get recruiter's job posts
export const getRecruiterJobs = async (recruiterId) => {
  const result = await query(`
    SELECT 
      j.job_id,
      j.title,
      j.description,
      j.requirements,
      j.location,
      j.salary_range,
      j.status,
      j.created_at,
      c.company_name,
      COUNT(ja.application_id) as application_count
    FROM "Jobs" j
    LEFT JOIN "Companies" c ON j.recruiter_id = c.recruiter_id
    LEFT JOIN "Job_Applications" ja ON j.job_id = ja.job_id
    WHERE j.recruiter_id = $1
    GROUP BY j.job_id, c.company_name
    ORDER BY j.created_at DESC
  `, [recruiterId]);
  return result.rows;
};

// Get candidates by tier for recruiter
export const getCandidatesByTier = async (domainId, tierId, recruiterId) => {
  // First check if recruiter has access to this tier
  const accessResult = await query(`
    SELECT rs.subscription_id
    FROM "Recruiter_Subscriptions" rs
    WHERE rs.recruiter_id = $1 
      AND rs.domain_id = $2 
      AND rs.tier_id = $3 
      AND rs.status = 'ACTIVE'
      AND rs.end_date > CURRENT_TIMESTAMP
  `, [recruiterId, domainId, tierId]);

  if (accessResult.rows.length === 0) {
    throw new Error('Access denied: No subscription for this tier');
  }

  const result = await query(`
    SELECT 
      c.id as candidate_id,
      c.fullName,
      c.username,
      c.email,
      c.bio,
      c.skills,
      c.experience,
      cdp.current_rank,
      cdp.cumulative_score,
      cdp.last_activity_date,
      t.tier_name,
      d.domain_name
    FROM "Candidates" c
    JOIN "Candidate_Domain_Performance" cdp ON c.id = cdp.candidate_id
    JOIN "Tiers" t ON cdp.current_tier_id = t.tier_id
    JOIN "Domains" d ON cdp.domain_id = d.domain_id
    WHERE cdp.domain_id = $1 AND cdp.current_tier_id = $2 AND cdp.status = 'ACTIVE'
    ORDER BY cdp.current_rank ASC
    LIMIT 50
  `, [domainId, tierId]);
  return result.rows;
};

// Get recruiter subscription status
export const getRecruiterSubscriptionStatus = async (recruiterId, domainId, tierId) => {
  const result = await query(`
    SELECT 
      rs.subscription_id,
      rs.start_date,
      rs.end_date,
      rs.status,
      sp.plan_name,
      sp.price,
      sp.features
    FROM "Recruiter_Subscriptions" rs
    LEFT JOIN "Subscription_Plans" sp ON rs.plan_id = sp.plan_id
    WHERE rs.recruiter_id = $1 
      AND rs.domain_id = $2 
      AND rs.tier_id = $3
    ORDER BY rs.start_date DESC
    LIMIT 1
  `, [recruiterId, domainId, tierId]);
  return result.rows[0];
};

// Create job post
export const createJobPost = async (jobData) => {
  const { recruiter_id, title, description, requirements, location, salary_range, domain_id, target_tier_id } = jobData;
  const target_tier = (parseInt(domain_id, 10)-1)*3 + target_tier_id;
  const result = await query(`
    INSERT INTO "Jobs" 
    (recruiter_id, title, description, requirements, location, salary_range, domain_id, target_tier_id, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE')
    RETURNING *
  `, [recruiter_id, title, description, requirements, location, salary_range, domain_id, target_tier]);
  return result.rows[0];
};

// Get job applications for a job
export const getJobApplications = async (jobId, recruiterId) => {
  const result = await query(`
    SELECT 
      ja.application_id,
      ja.candidate_id,
      ja.status,
      ja.application_date,
      ja.feedback,
      c.fullName,
      c.username,
      c.email,
      c.bio,
      c.skills,
      c.experience,
      cdp.current_rank,
      cdp.cumulative_score,
      t.tier_name
    FROM "Job_Applications" ja
    JOIN "Candidates" c ON ja.candidate_id = c.id
    JOIN "Candidate_Domain_Performance" cdp ON c.id = cdp.candidate_id
    JOIN "Jobs" j ON ja.job_id = j.job_id
    JOIN "Tiers" t ON cdp.current_tier_id = t.tier_id
    WHERE ja.job_id = $1 AND j.recruiter_id = $2
    ORDER BY ja.application_date DESC
  `, [jobId, recruiterId]);
  return result.rows;
};

// Update job application status
export const updateJobApplicationStatus = async (applicationId, status, feedback, recruiterId) => {
  const result = await query(`
    UPDATE "Job_Applications"
    SET status = $2, feedback = $3
    FROM "Jobs" j
    WHERE "Job_Applications".application_id = $1 
      AND "Job_Applications".job_id = j.job_id 
      AND j.recruiter_id = $4
    RETURNING "Job_Applications".*
  `, [applicationId, status, feedback, recruiterId]);
  return result.rows[0];
};

// Get recruiter analytics data
export const getRecruiterAnalytics = async (recruiterId, domainId = null) => {
  let whereClause = 'WHERE ad.recruiter_id = $1';
  let params = [recruiterId];
  
  if (domainId) {
    whereClause += ' AND ad.domain_id = $2';
    params.push(domainId);
  }

  const result = await query(`
    SELECT 
      ad.metric_name,
      ad.metric_value,
      ad.timestamp,
      d.domain_name,
      t.tier_name
    FROM "Analytics_Data" ad
    LEFT JOIN "Domains" d ON ad.domain_id = d.domain_id
    LEFT JOIN "Tiers" t ON ad.tier_id = t.tier_id
    ${whereClause}
    ORDER BY ad.timestamp DESC
    LIMIT 100
  `, params);
  return result.rows;
};

// Record analytics data
export const recordAnalyticsData = async (recruiterId, domainId, tierId, metricName, metricValue) => {
  const result = await query(`
    INSERT INTO "Analytics_Data" 
    (recruiter_id, domain_id, tier_id, metric_name, metric_value)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [recruiterId, domainId, tierId, metricName, metricValue]);
  return result.rows[0];
};

// Get subscription plans
export const getSubscriptionPlans = async () => {
  const result = await query(`
    SELECT *
    FROM "Subscription_Plans"
    ORDER BY price ASC
  `);
  return result.rows;
};

// Create recruiter subscription
export const createRecruiterSubscription = async (subscriptionData) => {
  const { recruiter_id, plan_id, domain_id, tier_id, start_date, end_date } = subscriptionData;
  const result = await query(`
    INSERT INTO "Recruiter_Subscriptions" 
    (recruiter_id, plan_id, domain_id, tier_id, start_date, end_date, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
    RETURNING *
  `, [recruiter_id, plan_id, domain_id, tier_id, start_date, end_date]);
  return result.rows[0];
};