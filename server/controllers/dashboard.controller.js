import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { query as client } from "../db.js";

// Get candidate dashboard
const getCandidateDashboard = asyncHandler(async (req, res) => {
  const { candidateId } = req.params;
  
  // Get candidate basic info
  const candidateQuery = `
    SELECT 
      c.id,
      c.username,
      c."fullName",
      c.email,
      c.status,
      c.premium_status,
      c.last_login
    FROM "Candidates" c
    WHERE c.id = $1
  `;
  
  // Get domain performance
  const performanceQuery = `
    SELECT 
      cdp.domain_id,
      cdp.tier_id,
      cdp.current_rank,
      cdp.total_score,
      cdp.average_score,
      cdp.participation_count,
      cdp.status,
      cdp.last_active,
      d.domain_name,
      t.tier_name,
      t.tier_level
    FROM "Candidate_Domain_Performance" cdp
    JOIN "Domains" d ON cdp.domain_id = d.domain_id
    JOIN "Tiers" t ON cdp.tier_id = t.tier_id
    WHERE cdp.candidate_id = $1
    ORDER BY d.domain_name
  `;
  
  // Get recent exam attempts
  const examAttemptsQuery = `
    SELECT 
      ea.attempt_id,
      ea.exam_id,
      ea.score,
      ea.max_score,
      ea.percentage,
      ea.status,
      ea.completed_at,
      e.exam_name,
      e.exam_type,
      d.domain_name
    FROM "Exam_Attempts" ea
    JOIN "Exams" e ON ea.exam_id = e.exam_id
    JOIN "Domains" d ON ea.domain_id = d.domain_id
    WHERE ea.candidate_id = $1
    ORDER BY ea.completed_at DESC
    LIMIT 5
  `;
  
  // Get recent contest participations
  const contestParticipationsQuery = `
    SELECT 
      cp.participation_id,
      cp.contest_id,
      cp.score,
      cp.rank,
      cp.status,
      cp.completed_at,
      c.contest_name,
      c.contest_type,
      d.domain_name
    FROM "Contest_Participations" cp
    JOIN "Contests" c ON cp.contest_id = c.contest_id
    JOIN "Domains" d ON c.domain_id = d.domain_id
    WHERE cp.candidate_id = $1
    ORDER BY cp.completed_at DESC
    LIMIT 5
  `;
  
  const candidateResult = await client.query(candidateQuery, [candidateId]);
  const performanceResult = await client.query(performanceQuery, [candidateId]);
  const examAttemptsResult = await client.query(examAttemptsQuery, [candidateId]);
  const contestParticipationsResult = await client.query(contestParticipationsQuery, [candidateId]);
  
  if (candidateResult.rows.length === 0) {
    throw new ApiError(404, "Candidate not found");
  }
  
  const dashboard = {
    candidate: candidateResult.rows[0],
    domainPerformance: performanceResult.rows,
    recentExamAttempts: examAttemptsResult.rows,
    recentContestParticipations: contestParticipationsResult.rows
  };
  
  return res.status(200).json({
    success: true,
    statusCode: 200,
    data: dashboard,
    message: "Candidate dashboard fetched successfully"
  });
});

// Get recruiter dashboard
const getRecruiterDashboard = asyncHandler(async (req, res) => {
  const { recruiterId } = req.params;
  
  // Get recruiter basic info
  const recruiterQuery = `
    SELECT 
      r.id,
      r.username,
      r."fullName",
      r.email,
      r.createdAt
    FROM "Recruiters" r
    WHERE r.id = $1
  `;
  
  // Get recruiter's companies
  const companiesQuery = `
    SELECT 
      c.company_id,
      c.company_name,
      c.website,
      c.description,
      COUNT(j.job_id) as total_jobs,
      COUNT(CASE WHEN j.is_active = true THEN 1 END) as active_jobs
    FROM "Companies" c
    LEFT JOIN "Jobs" j ON c.company_id = j.company_id
    WHERE c.recruiter_id = $1
    GROUP BY c.company_id, c.company_name, c.website, c.description
  `;
  
  // Get recent job applications
  const jobApplicationsQuery = `
    SELECT 
      ja.application_id,
      ja.job_id,
      ja.status,
      ja.applied_at,
      j.title as job_title,
      c.company_name,
      d.domain_name,
      t.tier_name
    FROM "Job_Applications" ja
    JOIN "Jobs" j ON ja.job_id = j.job_id
    JOIN "Companies" c ON j.company_id = c.company_id
    JOIN "Domains" d ON j.domain_id = d.domain_id
    JOIN "Tiers" t ON j.target_tier_id = t.tier_id
    WHERE c.recruiter_id = $1
    ORDER BY ja.applied_at DESC
    LIMIT 10
  `;
  
  // Get analytics data
  const analyticsQuery = `
    SELECT 
      ad.domain_id,
      ad.tier_id,
      ad.metric_type,
      ad.metric_value,
      ad.sample_size,
      d.domain_name,
      t.tier_name
    FROM "Analytics_Data" ad
    JOIN "Domains" d ON ad.domain_id = d.domain_id
    JOIN "Tiers" t ON ad.tier_id = t.tier_id
    WHERE ad.generated_at >= NOW() - INTERVAL '30 days'
    ORDER BY ad.generated_at DESC
    LIMIT 20
  `;
  
  const recruiterResult = await client.query(recruiterQuery, [recruiterId]);
  const companiesResult = await client.query(companiesQuery, [recruiterId]);
  const jobApplicationsResult = await client.query(jobApplicationsQuery, [recruiterId]);
  const analyticsResult = await client.query(analyticsQuery);
  
  if (recruiterResult.rows.length === 0) {
    throw new ApiError(404, "Recruiter not found");
  }
  
  const dashboard = {
    recruiter: recruiterResult.rows[0],
    companies: companiesResult.rows,
    recentJobApplications: jobApplicationsResult.rows,
    analytics: analyticsResult.rows
  };
  
  return res.status(200).json({
    success: true,
    statusCode: 200,
    data: dashboard,
    message: "Recruiter dashboard fetched successfully"
  });
});

// Get platform analytics (for admin)
const getPlatformAnalytics = asyncHandler(async (req, res) => {
  const analyticsQuery = `
    SELECT 
      COUNT(DISTINCT c.id) as total_candidates,
      COUNT(DISTINCT r.id) as total_recruiters,
      COUNT(DISTINCT d.domain_id) as total_domains,
      COUNT(DISTINCT j.job_id) as total_jobs,
      COUNT(DISTINCT CASE WHEN j.is_active = true THEN j.job_id END) as active_jobs,
      COUNT(DISTINCT ea.attempt_id) as total_exam_attempts,
      COUNT(DISTINCT cp.participation_id) as total_contest_participations
    FROM "Candidates" c
    CROSS JOIN "Recruiters" r
    CROSS JOIN "Domains" d
    LEFT JOIN "Jobs" j ON true
    LEFT JOIN "Exam_Attempts" ea ON true
    LEFT JOIN "Contest_Participations" cp ON true
  `;
  
  const domainStatsQuery = `
    SELECT 
      d.domain_id,
      d.domain_name,
      COUNT(DISTINCT cdp.candidate_id) as total_candidates,
      COUNT(DISTINCT CASE WHEN cdp.status = 'ACTIVE' THEN cdp.candidate_id END) as active_candidates,
      COUNT(DISTINCT t.tier_id) as total_tiers,
      COUNT(DISTINCT e.exam_id) as total_exams
    FROM "Domains" d
    LEFT JOIN "Candidate_Domain_Performance" cdp ON d.domain_id = cdp.domain_id
    LEFT JOIN "Tiers" t ON d.domain_id = t.domain_id
    LEFT JOIN "Exams" e ON d.domain_id = e.domain_id
    GROUP BY d.domain_id, d.domain_name
    ORDER BY d.domain_name
  `;
  
  const analyticsResult = await client.query(analyticsQuery);
  const domainStatsResult = await client.query(domainStatsQuery);
  
  const analytics = {
    overview: analyticsResult.rows[0],
    domainStats: domainStatsResult.rows
  };
  
  return res.status(200).json({
    success: true,
    statusCode: 200,
    data: analytics,
    message: "Platform analytics fetched successfully"
  });
});

export { 
  getCandidateDashboard, 
  getRecruiterDashboard, 
  getPlatformAnalytics 
};
