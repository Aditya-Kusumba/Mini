import { Router } from "express";
import { upload }   from "../middlewares/multer.js";
import { verifyJWT } from "../middlewares/auth.js";
import {
  registerUser, logInUser, logOutUser,
  checkemail, checkusername,
  updateDetails,
  getCurrentUser, getData, getRecData,
  getstats,
  generateOTP, verifyOTP,
  getAppliedJobs, applyForJob,
  getUserParticipations, getPerformanceHistory,
} from "../controllers/user.controller.js";

const router = Router();

// ── Auth ──────────────────────────────────────────────────────
router.post("/register",  registerUser);
router.post("/login",     logInUser);
router.post("/logout",    verifyJWT, logOutUser);

// ── OTP — two URL styles so both old and new frontend work ────
router.post("/otp/generate",  generateOTP);   // new frontend calls this
router.post("/otp/verify",    verifyOTP);     // new frontend calls this
router.post("/generate-otp",  generateOTP);   // old frontend fallback
router.post("/verify-otp",    verifyOTP);     // old frontend fallback

// ── Checks ────────────────────────────────────────────────────
router.post("/checkUsername", checkusername);
router.post("/checkEmail",    checkemail);

// ── Protected ─────────────────────────────────────────────────
router.get("/me",             verifyJWT, getCurrentUser);
router.get("/getData",        verifyJWT, getData);
router.get("/getRecData",     verifyJWT, getRecData);
router.get("/getstats",       verifyJWT, getstats);

router.post(
  "/updateDashboard",
  verifyJWT,
  upload.fields([{ name: "resume", maxCount: 1 }]),
  updateDetails
);

// also accept /update-profile (used by ProfileSetup page)
router.put(
  "/update-profile",
  verifyJWT,
  upload.fields([{ name: "resume", maxCount: 1 }]),
  updateDetails
);

// ── Participations / history ──────────────────────────────────
router.get("/me/participations",    verifyJWT, getUserParticipations);
router.get("/me/performancehistory",verifyJWT, getPerformanceHistory);

// ── Jobs ──────────────────────────────────────────────────────
router.get("/job-applications/:domainId", verifyJWT, getAppliedJobs);
router.post("/job-applications",          verifyJWT, applyForJob);

export default router;