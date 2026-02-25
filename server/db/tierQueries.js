import { query } from "../db.js";

// ============ TIER QUERIES ============

// Get candidate's tier information for a domain
export const getCandidateTierInfo = async (candidateId, domainId) => {
  const result = await query(`
    SELECT 
      cdp.candidate_id,
      cdp.domain_id,
      cdp.current_tier_id,
      cdp.current_rank,
      cdp.cumulative_score,
      cdp.last_activity_date,
      cdp.status,
      t.tier_name,
      t.tier_level,
      d.domain_name
    FROM "Candidate_Domain_Performance" cdp
    JOIN "Tiers" t ON cdp.current_tier_id = t.tier_id
    JOIN "Domains" d ON cdp.domain_id = d.domain_id
    WHERE cdp.candidate_id = $1 AND cdp.domain_id = $2
  `, [candidateId, domainId]);
  return result.rows[0];
};

// Get domain leaderboard
export const getDomainLeaderboard = async (domainId, limit = 100) => {
  const result = await query(`
    SELECT 
      cdp.candidate_id,
      cdp.current_rank,
      cdp.cumulative_score,
      cdp.last_activity_date,
      c.fullName,
      c.username,
      t.tier_name,
      t.tier_level
    FROM "Candidate_Domain_Performance" cdp
    JOIN "Candidates" c ON cdp.candidate_id = c.id
    JOIN "Tiers" t ON cdp.current_tier_id = t.tier_id
    WHERE cdp.domain_id = $1 AND cdp.status = 'ACTIVE'
    ORDER BY cdp.current_rank ASC
    LIMIT $2
  `, [domainId, limit]);
  return result.rows;
};

// Get all tiers for a domain
export const getDomainTiers = async (domainId) => {
  const result = await query(`
    SELECT 
      t.tier_id,
      t.tier_name,
      t.tier_level,
      t.description,
      tt.min_score,
      tt.max_score,
      tt.max_slots,
      COUNT(cdp.candidate_id) as current_occupancy
    FROM "Tiers" t
    LEFT JOIN "Tier_Thresholds" tt ON t.tier_id = tt.tier_id AND tt.domain_id = $1
    LEFT JOIN "Candidate_Domain_Performance" cdp ON t.tier_id = cdp.current_tier_id AND cdp.domain_id = $1 AND cdp.status = 'ACTIVE'
    WHERE t.domain_id = $1
    GROUP BY t.tier_id, tt.min_score, tt.max_score, tt.max_slots
    ORDER BY t.tier_level ASC
  `, [domainId]);
  return result.rows;
};

// Update candidate's tier and rank
export const updateCandidateTier = async (candidateId, domainId, newTierId, newRank, cumulativeScore) => {
  const result = await query(`
    UPDATE "Candidate_Domain_Performance"
    SET 
      current_tier_id = $3,
      current_rank = $4,
      cumulative_score = $5,
      last_activity_date = CURRENT_TIMESTAMP
    WHERE candidate_id = $1 AND domain_id = $2
    RETURNING *
  `, [candidateId, domainId, newTierId, newRank, cumulativeScore]);
  return result.rows[0];
};

// Initialize candidate domain performance
export const initializeCandidateDomainPerformance = async (candidateId, domainId, initialTierId = 1) => {
  const result = await query(`
    INSERT INTO "Candidate_Domain_Performance" 
    (candidate_id, domain_id, current_tier_id, current_rank, cumulative_score, last_activity_date, status)
    VALUES ($1, $2, $3, 999999, 0, CURRENT_TIMESTAMP, 'ACTIVE')
    RETURNING *
  `, [candidateId, domainId, initialTierId]);
  return result.rows[0];
};

// Get tier thresholds for a domain
export const getTierThresholds = async (domainId) => {
  const result = await query(`
    SELECT 
      tt.threshold_id,
      tt.domain_id,
      tt.tier_id,
      tt.min_score,
      tt.max_score,
      tt.max_slots,
      t.tier_name,
      t.tier_level
    FROM "Tier_Thresholds" tt
    JOIN "Tiers" t ON tt.tier_id = t.tier_id
    WHERE tt.domain_id = $1
    ORDER BY t.tier_level ASC
  `, [domainId]);
  return result.rows;
};

// Update tier thresholds
export const updateTierThresholds = async (domainId, tierId, minScore, maxScore, maxSlots) => {
  const result = await query(`
    INSERT INTO "Tier_Thresholds" (domain_id, tier_id, min_score, max_score, max_slots)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (domain_id, tier_id)
    DO UPDATE SET
      min_score = EXCLUDED.min_score,
      max_score = EXCLUDED.max_score,
      max_slots = EXCLUDED.max_slots
    RETURNING *
  `, [domainId, tierId, minScore, maxScore, maxSlots]);
  return result.rows[0];
};

// Get candidate's performance across all domains
export const getCandidateAllDomainsPerformance = async (candidateId) => {
  const result = await query(`
    SELECT 
      cdp.candidate_id,
      cdp.domain_id,
      cdp.current_tier_id,
      cdp.current_rank,
      cdp.cumulative_score,
      cdp.last_activity_date,
      cdp.status,
      d.domain_name,
      t.tier_name,
      t.tier_level
    FROM "Candidate_Domain_Performance" cdp
    JOIN "Domains" d ON cdp.domain_id = d.domain_id
    JOIN "Tiers" t ON cdp.current_tier_id = t.tier_id
    WHERE cdp.candidate_id = $1
    ORDER BY cdp.cumulative_score DESC
  `, [candidateId]);
  return result.rows;
};

// Recalculate domain rankings
export const recalculateDomainRankings = async (domainId) => {
  const result = await query(`
    WITH ranked_candidates AS (
      SELECT 
        candidate_id,
        ROW_NUMBER() OVER (ORDER BY cumulative_score DESC, last_activity_date DESC) as new_rank
      FROM "Candidate_Domain_Performance"
      WHERE domain_id = $1 AND status = 'ACTIVE'
    )
    UPDATE "Candidate_Domain_Performance"
    SET current_rank = rc.new_rank
    FROM ranked_candidates rc
    WHERE "Candidate_Domain_Performance".candidate_id = rc.candidate_id 
      AND "Candidate_Domain_Performance".domain_id = $1
    RETURNING candidate_id, current_rank
  `, [domainId]);
  return result.rows;
};

// Get inactive candidates for tier demotion
export const getInactiveCandidates = async (domainId, daysThreshold = 7) => {
  const result = await query(`
    SELECT 
      candidate_id,
      current_tier_id,
      last_activity_date
    FROM "Candidate_Domain_Performance"
    WHERE domain_id = $1 
      AND status = 'ACTIVE'
      AND last_activity_date < CURRENT_TIMESTAMP - INTERVAL '${daysThreshold} days'
    ORDER BY last_activity_date ASC
  `, [domainId]);
  return result.rows;
};

// Update candidate activity
export const updateCandidateActivity = async (candidateId, domainId) => {
  const result = await query(`
    UPDATE "Candidate_Domain_Performance"
    SET last_activity_date = CURRENT_TIMESTAMP
    WHERE candidate_id = $1 AND domain_id = $2
    RETURNING *
  `, [candidateId, domainId]);
  return result.rows[0];
};