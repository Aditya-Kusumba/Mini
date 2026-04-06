// server/routes/problem.routes.js
import express from "express";
import { verifyJWT } from "../middlewares/auth.js";
import {
  getProblemById,
  submitProblem,
  getProblemSubmissions,
  runProblem
} from "../controllers/problem.controller.js";

const router = express.Router();

router.get("/:problemId", verifyJWT, getProblemById);
router.post("/:problemId/run", verifyJWT, runProblem);
router.post("/:problemId/submit", verifyJWT, submitProblem);
router.get("/:problemId/submissions", verifyJWT, getProblemSubmissions);

export default router;