import { Router }          from 'express';
import { verifyAdminJWT }  from '../middlewares/adminAuth.js';
import {
  adminRegister, adminLogin, adminLogout, getAdminProfile,
  addStudent, addStudentsBulk, removeStudent, listStudents, getStudent,
  assignDomain, assignDomainBulk, unassignDomain,
  collegeOverview, domainAnalytics, collegeLeaderboard,
  computeScore, computeAllScores, allPlacementScores,
  studentPlacementScore, tierBreakdown,
  createNewBatch, listBatches, addToBatch, listBatchStudents,
} from '../controllers/admin.controller.js';

const router = Router();

// ── Public (no auth) ──────────────────────────────────────────
router.post('/register', adminRegister);
router.post('/login',    adminLogin);

// ── All below require admin JWT ───────────────────────────────
router.use(verifyAdminJWT);

router.post('/logout', adminLogout);
router.get('/me',      getAdminProfile);

// Students
router.post('/students/add',            addStudent);
router.post('/students/bulk',           addStudentsBulk);
router.get('/students',                 listStudents);
router.get('/students/:candidateId',    getStudent);
router.delete('/students/:candidateId', removeStudent);

// Domain assignment
router.post('/domains/assign',       assignDomain);
router.post('/domains/assign/bulk',  assignDomainBulk);
router.delete('/domains/unassign',   unassignDomain);

// Analytics
router.get('/analytics/overview',         collegeOverview);
router.get('/analytics/domain/:domainId', domainAnalytics);
router.get('/leaderboard',                collegeLeaderboard);

// Placement scores
router.post('/placement/compute',            computeScore);
router.post('/placement/compute/all',        computeAllScores);
router.get('/placement/scores',              allPlacementScores);
router.get('/placement/scores/:candidateId', studentPlacementScore);
router.get('/placement/tiers',               tierBreakdown);

// Batches
router.post('/batches',                    createNewBatch);
router.get('/batches',                     listBatches);
router.post('/batches/:batchId/students',  addToBatch);
router.get('/batches/:batchId/students',   listBatchStudents);

export default router;