// server/routes/problem.routes.js
import express from "express";
import { auth } from "../middlewares/auth.js";
import {
  getProblemById,
  submitProblem,
  getProblemSubmissions,
} from "../controllers/problem.controller.js";

const router = express.Router();

router.get("/:problemId", auth, getProblemById);
router.post("/:problemId/submit", auth, submitProblem);
router.get("/:problemId/submissions", auth, getProblemSubmissions);

export default router;