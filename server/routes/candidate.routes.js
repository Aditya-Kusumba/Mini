import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.js";
import {
  getDashboard,
  listAllDomains,
  getMyDomains,
  enrollInDomain,
  unenrollFromDomain,
  getDomainTopics,
  getMyTopics,
  startTopic,
  getMyPerformance,
  getDomainPerformance,
  updateTopicScore,
} from "../controllers/candidate.controller.js";

const router = Router();
router.use(verifyJWT);

// Dashboard
router.get("/dashboard", getDashboard);

// Domains
router.get("/domains/all", listAllDomains);          // browse all
router.get("/domains", getMyDomains);                // my enrolled
router.post("/domains/enroll", enrollInDomain);      // { domainId }
router.delete("/domains/:domainId", unenrollFromDomain);

// Topics
router.get("/domains/:domainId/topics", getDomainTopics);
router.get("/topics", getMyTopics);
router.post("/topics/start", startTopic);            // { domainId }

// Performance
router.get("/performance", getMyPerformance);
router.get("/performance/:domainId", getDomainPerformance);
router.put("/performance/topic/:topicId", updateTopicScore); // { score }

export default router;