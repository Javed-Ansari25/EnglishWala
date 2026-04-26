import jwt from "jsonwebtoken";
import bcrypt from 'bcryptjs';
import User from "../models/User.js";
import redisClient from "../config/redis.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { generateTokens, clearTokens } from "../utils/generateToken.js";
import { ApiError, ApiResponse } from "../utils/sendResponse&Error.js";
import { sendEmailOTP } from "../services/emailService.js";
import { generateOTP } from "../utils/generateOTP.js";


// ── REGISTER 
const register = asyncHandler(async (req, res) => {
  const { name, email, mobile, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "Email already registered");
  }

  const otp = generateOTP();
  const hashedOtp = await bcrypt.hash(otp, 10);
   

  // Store FULL DATA in Redis
  await redisClient.set(
  `signup:${email}`,
  JSON.stringify({
    name,
    email,
    mobile,
    password,
    hashedOtp,
    attempts: 0,
  }),
  "EX",
  300
);

  try {
    await sendEmailOTP(email, otp);
  } catch (error) {
    await redisClient.del(`signup:${email}`);
    throw new ApiError(500, "Failed to send OTP");
  }

  return res.status(200).json(
    new ApiResponse(200, { email }, "OTP sent for registration")
  );
});

// ── VERIFY OTP 
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!otp) throw new ApiError(400, "OTP required");

  const data = await redisClient.get(`signup:${email}`);
  if (!data) throw new ApiError(400, "OTP expired");

  let userData = JSON.parse(data);

  if (userData.attempts >= 5) {
    throw new ApiError(429, "Too many attempts");
  }

  const isMatch = await bcrypt.compare(otp, userData.hashedOtp);

  if (!isMatch) {
    userData.attempts += 1;

    await redisClient.set(
  `signup:${email}`,
  JSON.stringify(userData),
  "EX",
  300
);

    throw new ApiError(400, "Invalid OTP");
  }

  // Create user
  const user = await User.create({
    name: userData.name,
    email: userData.email,
    mobile: userData.mobile,
    password: userData.password,
    isVerified: true,
  });

  await Promise.all([
    redisClient.del(`signup:${email}`),
    generateTokens(user._id, res)
  ])

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      "Registration successful"
    )
  );
});

// ── RESEND OTP 
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const key = `signup:${email.toLowerCase().trim()}`;
  const resendKey = `resend:${email.toLowerCase().trim()}`;

  const data = await redisClient.get(key);
  if (!data) throw new ApiError(400, "Session expired");

  const isCooldown = await redisClient.get(resendKey);
  if (isCooldown) {
    throw new ApiError(429, "Please wait before requesting another OTP");
  }

  const userData = JSON.parse(data);

  const newOTP = generateOTP();
  const hashedOtp = await bcrypt.hash(newOTP, 10);

  await sendEmailOTP(email, newOTP);

  userData.hashedOtp = hashedOtp;
  userData.attempts = 0;

  const ttl = await redisClient.ttl(key);

await Promise.all([
  redisClient.set(
    key,
    JSON.stringify(userData),
    "EX",
    ttl > 0 ? ttl : 300
  ),
  redisClient.set(
    resendKey,
    "true",
    "EX",
    60
  )
]);

  return res.status(200).json(
    new ApiResponse(200, {}, "OTP resent successfully")
  );
});

// ── LOGIN 
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password required");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isVerified) {
    throw new ApiError(403, "Email not verified");
  }

  if (user.isBlocked) {
    throw new ApiError(403, "Account blocked");
  }

  await generateTokens(user._id, res);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      "Login successful"
    )
  );
});

// ── LOGOUT 
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.accessToken;

  if (token) {
    await redisClient.set(`bl:${token}`, "true", "EX", 3600);
  }

  await clearTokens(req.user._id, res);

  return res.status(200).json(
    new ApiResponse(200, {}, "Logged out successfully")
  );
});

// ── GetCurrentUser
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { user },
      "User fetched successfully"
    )
  );
});

export {
  register,
  verifyOTP,
  resendOTP,
  login,
  logout,
  getCurrentUser
};
