import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import redisClient from '../config/redis.js';
import { ApiError, ApiResponse } from './sendResponse&Error.js';
import { asyncHandler } from './asyncHandler.js';

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
};

export const generateAccessToken = (id) => {
  return jwt.sign(
    { id },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );
};


export const generateRefreshToken = (id) => {
  return jwt.sign(
    { id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
};


export const generateTokens = async (userId, res) => {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);

  // Save refresh token in Redis
  await redisClient.set(`refreshToken:${userId}`, refreshToken, "EX",7 * 24 * 60 * 60);

  res.cookie("accessToken", accessToken, cookieOptions);
  res.cookie("refreshToken", refreshToken, cookieOptions);

  return accessToken;
};


export const clearTokens = async (userId, res) => {
  await redisClient.del(`refreshToken:${userId}`);

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
}


// ── Refresh Token se naya Access Token 
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    throw new ApiError(401, "Refresh token is required");
  }

  let decoded;

  try {
    decoded = jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET
    );
  } catch (error) {
    throw new ApiError(
      401,
      "Refresh token expired or invalid"
    );
  }

  const storedToken = await redisClient.get(
    `refreshToken:${decoded.id}`
  );

  if (!storedToken) {
    throw new ApiError(
      401,
      "Session expired. Please login again"
    );
  }

  if (storedToken !== token) {
    throw new ApiError(
      401,
      "Invalid refresh token"
    );
  }

  const newAccessToken = generateAccessToken(decoded.id);

  res.cookie("accessToken", newAccessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        accessToken: newAccessToken,
      },
      "New access token generated successfully"
    )
  );
});
