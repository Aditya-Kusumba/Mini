import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getUserById, getRecruiterById } from "../db.js";

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
};

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    let accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new ApiError(401, "Unauthorized: No refresh token");
    }

    // 🔁 Generate access token if missing
    if (!accessToken) {
      const refreshPayload = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );

      accessToken = jwt.sign(
        {
          userId: refreshPayload.id,
          role: refreshPayload.role,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
      );

      res.cookie("accessToken", accessToken, cookieOptions);
    }

    const decoded = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );

    let user;
    if (decoded.role === "CANDIDATE") {
      user = await getUserById(decoded.userId);
    } else if (decoded.role === "RECRUITER") {
      user = await getRecruiterById(decoded.userId);
    } else {
      throw new ApiError(401, "Invalid user role");
    }

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    const storedRefresh =
      user.refreshToken || user.refreshtoken;

    if (!storedRefresh || storedRefresh !== refreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // 🔑 THIS IS CRITICAL
    req.user = {
      ...user,
      role: decoded.role,
    };

    next();
  } catch (err) {
    throw new ApiError(401, err.message || "Invalid token");
  }
});

export { verifyJWT };
