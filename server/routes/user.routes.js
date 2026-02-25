import Router from "express"
import {registerUser,logInUser,logOutUser} from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.js"
import { checkusername, checkemail, updateDetails, mainDashBoard, getData, getPerformanceHistory, getRecData, getCurrentUser, getAppliedJobs, applyForJob, getstats, getUserParticipations } from "../controllers/user.controller.js";

import { verifyJWT } from "../middlewares/auth.js"; 
const router  = Router();
router.route("/register").post(registerUser)
router.route("/login").post(logInUser)
router.route("/logout").post(verifyJWT,logOutUser)
router.route("/checkUsername").post(checkusername);
router.route("/checkEmail").post(checkemail);
router.route("/updateDashboard").post(verifyJWT,upload.fields([{name:"resume",maxCount:1}]),updateDetails)
router.route("/mainDashboard").post(verifyJWT,mainDashBoard)    
router.route("/me").get(verifyJWT, getCurrentUser);
router.route("/getData").get(verifyJWT,getData);
router.route("/me/participations").get(verifyJWT, getUserParticipations);
router.route("/me/performancehistory").get(verifyJWT, getPerformanceHistory);
router.route("/getRecData").get(verifyJWT,getRecData);
router.route('/job-applications/:domainId').get(verifyJWT, getAppliedJobs);
router.route('/job-applications').post(verifyJWT, applyForJob);
router.route('/getstats').get(verifyJWT, getstats);


export default router