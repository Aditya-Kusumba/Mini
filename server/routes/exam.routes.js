import { Router }   from 'express';
import { verifyJWT } from '../middlewares/auth.js';
import {
  seedProblems, listProblems, getProblem,
  runCode, submitCode, mySubmissions,
} from '../controllers/exam.controller.js';

const router = Router();

// open (no auth) — seed once during dev
router.post('/seed', seedProblems);

// auth required
router.use(verifyJWT);
router.get('/problems',               listProblems);
router.get('/problems/:problemId',    getProblem);
router.post('/run',                   runCode);
router.post('/submit',                submitCode);
router.get('/submissions/:problemId', mySubmissions);

export default router;