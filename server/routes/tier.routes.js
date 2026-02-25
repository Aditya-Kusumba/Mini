import express from 'express';
import { 
  getTiersByDomain, 
  getTierDetails, 
  updateCandidateTier,
  getTierThresholds 
} from '../controllers/tier.controller.js';

const router = express.Router();

// Tier routes
router.get('/domain/:domainId', getTiersByDomain);
router.get('/:tierId', getTierDetails);
router.put('/update', updateCandidateTier);
router.get('/thresholds/:domainId', getTierThresholds);

export default router;