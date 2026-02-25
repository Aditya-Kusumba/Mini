import express from "express";
import { verifyJWT } from "../middlewares/auth.js";
import { getDomains, getDomainsById, getCandidateDomains, getDomainLeaderboard } from "../controllers/domain.controller.js";

const router = express.Router();
// Get all domains
router.get("/", getDomains);

// Get domain by ID
router.route("/domains").get(verifyJWT, getCandidateDomains)
router.route("/:domainId").get(verifyJWT, getDomainsById);
router.route('/:domainId/leaderboard').get(verifyJWT, getDomainLeaderboard)
export default router;