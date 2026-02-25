import express from "express";
import { verifyJWT } from "../middlewares/auth.js";
import { 
  getRecruiterDashboard,
  getJobApplications,
  updateApplicationStatus,
  getCandidatesByTier,
  getAnonymousAnalytics,
  createCustomExam,
  getRecruiterSubscription,
  upgradeSubscription,
  postJob,
  getJobCandidates
} from "../controllers/recruiter.controller.js";

const router = express.Router();

// Apply JWT verification to all recruiter routes
router.use(verifyJWT);

// Dashboard
router.get("/dashboard", getRecruiterDashboard);

// Subscription management
router.get("/subscription", getRecruiterSubscription);
router.post("/subscription/upgrade", upgradeSubscription);

// Job management
router.post("/jobs", postJob);
router.get("/jobs/:jobId/applications", getJobApplications);
router.put("/applications/:applicationId", updateApplicationStatus);

// Candidate search and analytics
router.get("/candidates", getCandidatesByTier);
router.get("/jobs/candidates", getJobCandidates);
router.get("/analytics", getAnonymousAnalytics);

// Custom assessments
router.post("/exams", createCustomExam);

export default router;
