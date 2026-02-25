import { Router } from "express";
import { createContest, getContests, getContestById, sortAfterContest } from "../controllers/contest.controller.js";
import { verifyJWT } from "../middlewares/auth.js"; // Assuming you have admin auth middleware

const router = Router();

// This is the single endpoint for creating any new event
router.route("/").get(verifyJWT, getContests);
router.route('/:contestId').get(verifyJWT, getContestById);
router.route('/sort/:contestId').get(verifyJWT, sortAfterContest);
router.route("/create").post(verifyJWT, createContest);

export default router;
