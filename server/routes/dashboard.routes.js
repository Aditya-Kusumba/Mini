import express from 'express';
import { 
  getCandidateDashboard, 
  getRecruiterDashboard, 
  getPlatformAnalytics 
} from '../controllers/dashboard.controller.js';

const router = express.Router();

// Dashboard routes
router.get('/candidate/:candidateId', getCandidateDashboard);
router.get('/recruiter/:recruiterId', getRecruiterDashboard);
router.get('/analytics', getPlatformAnalytics);

export default router;
