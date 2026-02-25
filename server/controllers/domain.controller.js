import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { query } from "../db.js"; 

/**
 * @description Get a list of all available domains.
 * @route GET /api/domains
 */
const getDomains = asyncHandler(async (req, res) => {
    const sql = `
      SELECT 
        d.domain_id,
        d.domain_name,
        d.description,
        d."createdAt",
        d."updatedAt"
      FROM "Domains" d
      ORDER BY d.domain_name ASC;
    `;
    
    const result = await query(sql);
    
    return res.status(200).json(
        new ApiResponse(200, result.rows, "All domains fetched successfully")
    );
});

const getCandidateDomains = asyncHandler(async (req, res) => {
    const candidateId = req.user?.id;
    


    if (!candidateId || req.user.role !== 'CANDIDATE') {
        throw new ApiError(401, "User not authenticated or is not a candidate.");
    }

    try {
        const sql = `
          SELECT 
            *
          FROM "Candidate_Domain_Performance" cdp
             LEFT JOIN "Domains" d ON cdp.domain_id = d.domain_id
            LEFT JOIN "Tiers" t ON cdp.tier_id = t.tier_id

          WHERE cdp.candidate_id = $1
          ORDER BY d.domain_name ASC;
        `;

        const result = await query(sql, [candidateId]);
        return res.status(200).json(
            new ApiResponse(200, result.rows, "Candidate domains and performance fetched successfully")
        );
    } catch (error) {
        console.error("Error fetching candidate domains:", error);
        throw new ApiError(500, "Failed to fetch candidate domain information.");
    }
});


const getDomainsById = asyncHandler(async (req, res) => {
    const { domainId } = req.params;
    const user = req.user;

    if (!user?.id || user.role !== 'CANDIDATE') {
        throw new ApiError(401, "User not authenticated or is not a candidate.");
    }
    const candidateId = user.id;

    try {
        const domainDetailsQuery = `
          SELECT 
            d.domain_id,
            d.domain_name,
            d.description,
            COUNT(DISTINCT t.tier_id) as tier_count,
            COUNT(DISTINCT cdp_all.candidate_id) as active_candidates
          FROM "Domains" d
          LEFT JOIN "Tiers" t ON d.domain_id = t.domain_id
          LEFT JOIN "Candidate_Domain_Performance" cdp_all ON d.domain_id = cdp_all.domain_id
          WHERE d.domain_id = $1
          GROUP BY d.domain_id, d.domain_name, d.description;
        `;

        const candidatePerformanceQuery = `
          SELECT 
            cdp.current_rank,
            cdp.total_score,
            cdp.participation_count,
            t.tier_id,
            t.tier_name,
            t.tier_level
          FROM "Candidate_Domain_Performance" cdp
          JOIN "Tiers" t ON cdp.tier_id = t.tier_id
          WHERE cdp.domain_id = $1 AND cdp.candidate_id = $2;
        `;

        const [
            domainResult,
            performanceResult
        ] = await Promise.all([
            query(domainDetailsQuery, [domainId]),
            query(candidatePerformanceQuery, [domainId, candidateId])
        ]);

        if (domainResult.rows.length === 0) {
            throw new ApiError(404, "Domain not found");
        }
        
        const candidatePerformance = performanceResult.rows.length > 0 ? performanceResult.rows[0] : null;
        let availableJobs = [];

        if (candidatePerformance?.tier_id) {
            const jobsQuery = `
            SELECT
                j.job_id,
                j.title,
                j.location,
                c.company_name, -- Get company_name from the Companies table
                j.description,  -- Assuming you want other details as well
                j.requirements,
                j.salary_range,
                j.status,
                j.posted_at,
                j.recruiter_id,
                j.domain_id,
                j.target_tier_id
                FROM "Jobs" j
                JOIN "Recruiters" r ON j.recruiter_id = r.id -- Join Jobs to Recruiters
                JOIN "Companies" c ON r.id = c.recruiter_id -- Join Recruiters to Companies
                WHERE j.domain_id = $1
                AND j.target_tier_id = $2
                AND j.is_active = TRUE
                ORDER BY j.posted_at DESC;
            `;
            const jobsResult = await query(jobsQuery, [domainId, candidatePerformance.tier_id]);
            availableJobs = jobsResult.rows;
        }
        const responseData = {
            domainDetails: domainResult.rows[0],
            candidatePerformance: candidatePerformance,
            availableJobs: availableJobs
        };
        console.log(responseData);
        
        return res.status(200).json(
            new ApiResponse(200, responseData, "Domain, performance, and job data fetched successfully")
        );

    } catch (error) {
        console.error("Error fetching domain data:", error);
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, "Failed to fetch domain data.");
    }
});
export const getDomainLeaderboard = asyncHandler(async (req, res) => {
    const { domainId } = req.params;
        const updateQuery = `
            WITH NewRanks AS (
                SELECT
                    candidate_id,
                    RANK() OVER (
                        ORDER BY rating DESC, last_active DESC
                    ) as new_rank
                FROM
                    "Candidate_Domain_Performance"
                WHERE
                    domain_id = $1
            ),
            NewTiers AS (
                SELECT
                    nr.candidate_id,
                    nr.new_rank,
                    CASE
                        WHEN nr.new_rank <= 10 THEN 1  -- Top 10
                        WHEN nr.new_rank > 10 AND nr.new_rank <= 20 THEN 2 -- Next 10
                        ELSE 3  -- Everyone else
                    END as new_tier_level
                FROM
                    NewRanks nr
            ),

            TierIdMapping AS (
                SELECT
                    nt.candidate_id,
                    nt.new_rank,
                    t.tier_id as new_tier_id
                FROM
                    NewTiers nt
                JOIN "Tiers" t ON t.domain_id = $1 AND t.tier_level = nt.new_tier_level
            )
            
            UPDATE
                "Candidate_Domain_Performance" cdp
            SET
                current_rank = tim.new_rank,
                tier_id = tim.new_tier_id,
                tier_assigned_date = NOW(), -- Update the date of the tier assignment
                updated_at = NOW()
            FROM
                TierIdMapping tim
            WHERE
                cdp.candidate_id = tim.candidate_id AND cdp.domain_id = $1;
        `;

        try {
            await query(updateQuery, [domainId]);

    const leaderboardQuery = `
        SELECT
            cdp.candidate_id,
            cdp.current_rank,
            cdp.rating,
            c."username"
        FROM "Candidate_Domain_Performance" cdp
        -- Join with Candidates table on the candidate's primary key (id)
        JOIN "Candidates" c ON cdp.candidate_id = c.id
        WHERE cdp.domain_id = $1
        ORDER BY cdp.current_rank ASC, cdp.rating DESC
        LIMIT 100; -- Limit to the top 100 for performance
    `;
        const result = await query(leaderboardQuery, [domainId]);
        return res.status(200).json(new ApiResponse(200, result.rows, "Leaderboard fetched successfully."));
    } catch (error) {
        console.error("Error fetching domain leaderboard:", error);
        throw new ApiError(500, "Failed to fetch leaderboard.");
    }
});

export { 
    getDomains, 
    getDomainsById, 
    getCandidateDomains 
};

