import express from 'express';
import { verifyJWT } from '../middlewares/auth.js';
import { 
  getExamsByDomain, 
  getExamById, 
  submitExamAttempt,
  getCandidateExamAttempts ,
  startExam
} from '../controllers/exam.controller.js';

const router = express.Router();

// Exam routes
router.get('/domain/:domainId', getExamsByDomain);
router.get('/:examId', getExamById);
router.route('/start/:examId').post(verifyJWT, startExam);
router.post('/submit/:attemptId', submitExamAttempt);
router.get('/attempts/:candidateId', getCandidateExamAttempts);

export default router;