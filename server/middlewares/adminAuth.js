import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getAdminById } from '../db.js';

export const verifyAdminJWT = asyncHandler(async (req, res, next) => {
  try {
    let accessToken  = req.cookies?.adminAccessToken;
    const refreshToken = req.cookies?.adminRefreshToken;

    if (!refreshToken) {
      throw new ApiError(401, 'Unauthorized: No admin refresh token');
    }

    // Regenerate access token if missing or expired
    if (!accessToken) {
      const refreshPayload = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      if (refreshPayload.role !== 'ADMIN') {
        throw new ApiError(403, 'Not an admin token');
      }
      accessToken = jwt.sign(
        {
          userId:   refreshPayload.userId,
          role:     'ADMIN',
          collegeId: refreshPayload.collegeId,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
      );
      res.cookie('adminAccessToken', accessToken, {
        httpOnly: true, secure: true, sameSite: 'none',
      });
    }

    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

    if (decoded.role !== 'ADMIN') {
      throw new ApiError(403, 'Access denied: not an admin');
    }

    const admin = await getAdminById(decoded.userId);
    if (!admin) throw new ApiError(401, 'Admin not found');

    if (!admin.refreshToken || admin.refreshToken !== refreshToken) {
      throw new ApiError(401, 'Invalid refresh token — please log in again');
    }

    // Attach admin info to request (separate from req.user)
    req.admin = {
      id:          admin.id,
      name:        admin.name,
      email:       admin.email,
      collegeId:   admin.college,
      collegeName: admin.collegeName,
      role:        'ADMIN',
    };

    next();
  } catch (err) {
    throw new ApiError(401, err.message || 'Admin authentication failed');
  }
});