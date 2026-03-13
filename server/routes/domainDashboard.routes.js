import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.js";
import {
  domainDashboard,
  dailyQuestion,
  markDailyComplete,
  strengthenTopic,
  listDomainProblems,
  submitProblemAttempt,
} from "../controllers/domainDashboard.controller.js";

const router = Router();
router.use(verifyJWT);

// ── Domain dashboard (full data in one call) ─────────────────
// GET /candidate/domain/:domainId/dashboard
router.get("/domain/:domainId/dashboard", domainDashboard);

// ── Problems list for a domain ───────────────────────────────
// GET /candidate/domain/:domainId/problems
router.get("/domain/:domainId/problems", listDomainProblems);

// ── Daily question ───────────────────────────────────────────
// GET  /candidate/domain/:domainId/daily
// POST /candidate/domain/:domainId/daily/complete
router.get("/domain/:domainId/daily", dailyQuestion);
router.post("/domain/:domainId/daily/complete", markDailyComplete);

// ── Strengthen topic ─────────────────────────────────────────
// GET /candidate/domain/:domainId/strengthen
router.get("/domain/:domainId/strengthen", strengthenTopic);

// ── Problem submission ───────────────────────────────────────
// POST /candidate/problems/:problemId/submit    { status }
router.post("/problems/:problemId/submit", submitProblemAttempt);

export default router;