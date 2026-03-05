import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { register, login, getUserById,updateRefreshToken,checkEmail,checkUsername,updateCandidateProfile,getRecruiterById, getUser,logOut, getRecUser, genOTP, verOTP} from "../db.js"
import { query } from "../db.js"


const registerUser = asyncHandler(async (req, res) => {

    const { name, username, email, password,role, companyname } = req.body;
    if ([name, username, email, password,role].some((field) => field?.trim() == "")) {
        throw new ApiError(404, "All Fields are required");
    }
    const existedUser = 0

    if (existedUser) {
        throw new ApiError(400, "User Already Exists");
    }
    const createdUser = await register(username, email, name, password, role, companyname);

    if (createdUser) {
        console.log("User Created ");
    }



    if (!createdUser) {
        throw new ApiError(400, "Something Went Wrong While creating a user")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, createdUser, "new User Created")
        )


})

const logInUser = asyncHandler(async (req, res) => {

    const { email, password } = req.body
    const {userobj, accessToken, refreshToken} = await login(email, password);
    if (!userobj?.id) {
        console.log("User not created")
        throw new ApiError(400, "User doesnot  exisits")
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken)
        .cookie("refreshToken", refreshToken)
        .json(new ApiResponse(200, {
            user: userobj,
            refreshToken, accessToken
        }, "User Logged In Successfully"))


})

const checkemail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await checkEmail(email);
  if(result)
    return res.status(200).json({user : true, username : false, email : true});
  return res.status(200).json({user : false});
});

const checkusername = asyncHandler(async (req, res) => {
  const { username } = req.body;
  const result = await checkUsername(username);
  if(result)
    return res.status(200).json({user : true, username : true, email : false});
  return res.status(200).json({user : false});
});

//update user detatils to dashboard

 const updateDetails = asyncHandler(async (req, res) => {
  const candidateId = req.user.id; // from auth middleware
  try {
    // Parse JSON data from frontend
    const data = req.body || {};
    const { domains, education, experience, projects, skills } = JSON.parse(data.data);

    // Handle CV upload if provided
    let cvUrl = 100;
    // const localCvPath = req.files?.resume?.[0]?.path;
    // if (localCvPath) {
    //   const uploadedCv = await uploadOnCloudinary(localCvPath);
    //   if (!uploadedCv?.url) throw new ApiError(400, "CV upload failed");
    //   cvUrl = uploadedCv.url;
    // }

    // Update in DB
    const updateResult = await updateCandidateProfile({
      candidateId,
      domains,
      education,
      experience,
      projects,
      skills,
      cvUrl,
    });

    if (!updateResult.success) {
      throw new ApiError(500, "Failed to update candidate profile");
    }

    const updatedCandidate = updateResult.data;
    console.log(updatedCandidate)
    updatedCandidate.domains = JSON.parse(updatedCandidate.domains || "[]");
    updatedCandidate.education = updatedCandidate.education || {};
    updatedCandidate.experience = updatedCandidate.experience || {};
    updatedCandidate.projects = updatedCandidate.projects || {};
    updatedCandidate.skills = updatedCandidate.skills || {};

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedCandidate,
    });
  } catch (err) {
    console.error("❌ Error in controller:", err);
    throw new ApiError(err.statusCode || 500, err.message || "Server error");
  }
});


const logOutUser = asyncHandler(async (req, res) => {
    const userId=req.user.id
    const UpdateUser=await updateRefreshToken(userId,'CANDIDATE',null)
    const options={
        httpOnly:true,
        secure:true
    }
    return res
           .status(200)
           .clearCookie("accessToken",options)
           .clearCookie("refreshToken",options)
           .json(new ApiResponse(200,"User logged Out Successfully"))
})

const mainDashBoard = asyncHandler(async(req,res)=>{
   try {
    const { userId } = req.user;

    const candidate = await getCandidateMainDashBoardById(userId);
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    // remove sensitive fields (extra safety)
    const { passwordHash, refreshToken, ...safeCandidate } = candidate;

    return res.status(200).json({
      success: true,
      message: "Candidate profile fetched successfully",
      data: safeCandidate,
    });
  } catch (error) {
    console.error("Error fetching candidate:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
})


const getRecData = asyncHandler(async (req, res) => {
    try {
        const id = req.user?.id;

        if (!id) {
            throw new ApiError(401, "User not authenticated or ID is missing");
        }

        const result = await getRecUser(id);

        if (!result) {
            throw new ApiError(404, "Recruiter data not found");
        }
        
        // The result is already a complete JSON object from getUser
        return res.status(200).json(new ApiResponse(200, result, "Recruiter data fetched successfully"));

    } catch (e) {
        console.error("Error in getData controller:", e);
        // Pass the error to the asyncHandler's error handler
        throw new ApiError(e.statusCode || 500, e.message || "Failed to get user data");
    }
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "User data fetched successfully"));
});

const getData = asyncHandler(async (req, res) => {
    try {
        const id = req.user?.id;

        if (!id) {
            throw new ApiError(401, "User not authenticated or ID is missing");
        }

        const result = await getUser(id);

        if (!result) {
            throw new ApiError(404, "Candidate data not found");
        }
        
        // The result is already a complete JSON object from getUser
        return res.status(200).json(new ApiResponse(200, result, "Candidate data fetched successfully"));

    } catch (e) {
        console.error("Error in getData controller:", e);
        // Pass the error to the asyncHandler's error handler
        throw new ApiError(e.statusCode || 500, e.message || "Failed to get user data");
    }
});

export const getAppliedJobs = asyncHandler(async (req, res) => {
    const { domainId } = req.params;
    const { user } = req; // assuming user is set in middleware (auth check)

    const appliedJobs = await query(
        `SELECT ja.*, j."job_id", j."title", j."location", j."salary_range", j."description"
        FROM "Job_Applications" ja
        INNER JOIN "Jobs" j ON ja."job_id" = j."job_id"
        WHERE ja."candidate_id" = $1
        AND j."domain_id" = $2;`,
        [user.id, domainId]
    );

    // Check if appliedJobs is an array or if it needs to be extracted
    const jobs = appliedJobs.rows || appliedJobs; // assuming `rows` is where the actual data is
    res.json({ data: jobs });
});

// Function to apply for a job
export const applyForJob = asyncHandler(async (req, res) => {
    const { job_id, candidate_id } = req.body;

    // Check if the job exists
    const job = await query(
  `SELECT * FROM "Jobs" WHERE "job_id" = $1 LIMIT 1;`,
  [job_id]
);

    if (!job) {
        return res.status(404).json({ message: 'Job not found' });
    }

    // Check if the user has already applied for the job
    const existingApplication = await query(
      'SELECT * FROM "Job_Applications" WHERE "job_id" = $1 AND "candidate_id" = $2 LIMIT 1',
      [job_id, candidate_id]
    );
    if (existingApplication.rows.length != 0) {
        return res.status(200).json({ message: 'You have already applied for this job' });
    }

    // Create a new job application
    const newApplication = await query(
  'INSERT INTO "Job_Applications" ("job_id", "candidate_id", "status") VALUES ($1, $2, $3) RETURNING *;',
  [job_id, candidate_id, 'APPLIED'] // Passing 'APPLIED' as default status
);


    res.status(201).json({ data: newApplication });
});

const getstats = asyncHandler(async (req, res)=>{
  const id = req.user?.id;
  const s1 = `select count(distinct problem_id) from submissions where candidate_id = $1 and status = 'Accepted'`;
  const s2 = `select count(distinct contest_id) from "Contest_Participations" where candidate_id = $1`
  const prob = await query(s1, [id]) || 0;
  const cont = await query(s2, [id]) || 0;
  const final = {problems : prob.rows[0].count, contests : cont.rows[0].count}
  res.status(200).json(final)
}

);

export const getUserParticipations = asyncHandler(async (req, res) => {
    const candidateId = req.user.id;

    if (!candidateId) {
        throw new ApiError(401, "User not authenticated.");
    }

    // This query joins Contest_Participations with Contests
    // to get the event type and domain_id for each participation.
    const participationQuery = `
        SELECT 
            cp.contest_id,
            cp.score,
            c.type,
            c.domain_id
        FROM "Contest_Participations" cp
        JOIN "Contests" c ON cp.contest_id = c.contest_id
        WHERE cp.candidate_id = $1;
    `;
    
    const result = await query(participationQuery, [candidateId]);
    
    return res.status(200).json(new ApiResponse(200, result.rows, "User participations fetched successfully."));
});
export const getPerformanceHistory = asyncHandler(async (req, res) => {
    const candidateId = req.user?.id;

    if (!candidateId) {
        throw new ApiError(401, "User not authenticated.");
    }

    // This query joins Participations with Contests and Domains
    // to get all the data the frontend card needs.
    const historyQuery = `
        SELECT 
            cp.participation_id,
            cp.contest_id,
            cp.score,
            cp.rank,
            cp.domain_id,
            c.title,
            c.type,
            c.start_time,
            d.domain_name
        FROM "Contest_Participations" cp
        JOIN "Contests" c ON cp.contest_id = c.contest_id
        JOIN "Domains" d ON c.domain_id = d.domain_id
        WHERE cp.candidate_id = $1
        ORDER BY cp.submission_time DESC;
    `;
    
    const result = await query(historyQuery, [candidateId]);
    
    return res.status(200).json(new ApiResponse(200, result.rows, "Performance history fetched successfully."));
});

const generateOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
    if (!email) {
        throw new ApiError(400, "Email is required");
    }
    const result = await genOTP(email);
    if (!result.success) {
        throw new ApiError(500, "Failed to generate OTP");
    }
    res.status(200).json({ success: true, message: "OTP generated successfully" });
});

const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
    if (!email || !otp) {
        throw new ApiError(400, "Email and OTP are required");
    }
    const result = await verOTP(email, otp);
    if (!result.success) {
        throw new ApiError(400, result.message || "Failed to verify OTP");
    }
    res.status(200).json({ success: true, message: "OTP verified successfully" });
});

export { registerUser, logInUser,logOutUser,checkemail,checkusername,updateDetails,mainDashBoard, getData, getRecData, getCurrentUser, getstats, generateOTP, verifyOTP };