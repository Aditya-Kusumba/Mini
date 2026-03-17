import { Router }     from 'express';
import { verifyJWT }  from '../middlewares/auth.js';
import {
  seedProblems, getLanguages,
  listProblems, getProblem,
  runCode, submitCode,
  mySubmissions, leaderboard,
} from '../controllers/exam.controller.js';

const router = Router();

// No auth — seed and language list
router.post('/seed',     seedProblems);
router.get('/languages', getLanguages);

// Auth required
router.use(verifyJWT);

router.get('/problems',               listProblems);   // ?domainId=1
router.get('/problems/:problemId',    getProblem);
router.post('/run',                   runCode);        // { code, language, problemId }
router.post('/submit',                submitCode);     // { code, language, problemId }
router.get('/submissions/:problemId', mySubmissions);
router.get('/leaderboard/:problemId', leaderboard);

export default router;