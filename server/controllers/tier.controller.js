import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { query as client } from "../db.js";

// Get tiers by domain
const getTiersByDomain = asyncHandler(async (req, res) => {
  const { domainId } = req.params;
  
  const query = `
    SELECT 
      t.tier_id,
      t.tier_level,
      t.tier_name,
      t.max_slots,
      t.yearly_cost,
      t.features,
      COUNT(cdp.candidate_id) as current_candidates,
      COUNT(CASE WHEN cdp.status = 'ACTIVE' THEN 1 END) as active_candidates,
      COUNT(CASE WHEN cdp.status = 'WAITING_LIST' THEN 1 END) as waiting_list_count
    FROM "Tiers" t
    LEFT JOIN "Candidate_Domain_Performance" cdp ON t.tier_id = cdp.tier_id AND cdp.domain_id = $1
    WHERE t.domain_id = $1
    GROUP BY t.tier_id, t.tier_level, t.tier_name, t.max_slots, t.yearly_cost, t.features
    ORDER BY t.tier_level ASC
  `;
  
  const result = await client.query(query, [domainId]);
  
  return res.status(200).json({
    success: true,
    statusCode: 200,
    data: result.rows,
    message: "Tiers fetched successfully"
  });
});

// Get tier details with candidates
const getTierDetails = asyncHandler(async (req, res) => {
  const { tierId } = req.params;
  
  const tierQuery = `
    SELECT 
      t.tier_id,
      t.tier_level,
      t.tier_name,
      t.max_slots,
      t.yearly_cost,
      t.features,
      d.domain_name
    FROM "Tiers" t
    JOIN "Domains" d ON t.domain_id = d.domain_id
    WHERE t.tier_id = $1
  `;
  
  const candidatesQuery = `
    SELECT 
      cdp.candidate_id,
      cdp.current_rank,
      cdp.total_score,
      cdp.average_score,
      cdp.participation_count,
      cdp.status,
      cdp.last_active,
      c.username,
      c."fullName"
    FROM "Candidate_Domain_Performance" cdp
    JOIN "Candidates" c ON cdp.candidate_id = c.id
    WHERE cdp.tier_id = $1
    ORDER BY cdp.current_rank ASC
  `;
  
  const tierResult = await client.query(tierQuery, [tierId]);
  const candidatesResult = await client.query(candidatesQuery, [tierId]);
  
  if (tierResult.rows.length === 0) {
    throw new ApiError(404, "Tier not found");
  }
  
  const tier = tierResult.rows[0];
  tier.candidates = candidatesResult.rows;
  
  return res.status(200).json({
    success: true,
    statusCode: 200,
    data: tier,
    message: "Tier details fetched successfully"
  });
});

// Update candidate tier (for shifting contests)
const updateCandidateTier = asyncHandler(async (req, res) => {
  const { candidateId, domainId, newTierId, newRank } = req.body;
  
  const query = `
    UPDATE "Candidate_Domain_Performance"
    SET 
      tier_id = $1,
      current_rank = $2,
      status = 'ACTIVE',
      tier_assigned_date = NOW(),
      last_active = NOW()
    WHERE candidate_id = $3 AND domain_id = $4
    RETURNING *
  `;
  
  const result = await client.query(query, [newTierId, newRank, candidateId, domainId]);
  
  return res.status(200).json({
    success: true,
    statusCode: 200,
    data: result.rows[0],
    message: "Candidate tier updated successfully"
  });
});

// Get tier thresholds
const getTierThresholds = asyncHandler(async (req, res) => {
  const { domainId } = req.params;
  
    const query = `
    SELECT 
      tt.threshold_id,
      tt.tier_id,
      tt.min_score,
      tt.max_score,
      tt.is_active,
      tt.effective_date,
      t.tier_name,
      t.tier_level
    FROM "Tier_Thresholds" tt
    JOIN "Tiers" t ON tt.tier_id = t.tier_id
    WHERE tt.domain_id = $1 AND tt.is_active = true
    ORDER BY t.tier_level ASC
  `;
  
  const result = await client.query(query, [domainId]);
  
  return res.status(200).json({
    success: true,
    statusCode: 200,
    data: result.rows,
    message: "Tier thresholds fetched successfully"
  });
});

export {
  getTiersByDomain, 
  getTierDetails, 
  updateCandidateTier,
  getTierThresholds 
};