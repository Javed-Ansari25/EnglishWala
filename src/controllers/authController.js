import jwt from "jsonwebtoken";
import User from "../models/User.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { generateTokens } from "../utils/generateToken.js";
import { ApiError, ApiResponse } from "../utils/sendResponse&Error.js";
import { sendEmailOTP } from "../services/emailService.js";
import { generateOTP } from "../utils/generateOTP.js";


// ── REGISTER 
const register = asyncHandler(async (req, res) => {
  const { name, email, mobile, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "Email is already registered");
  }

  const otp = generateOTP();

  const user = await User.create({
    name,
    email,
    mobile,
    password,
    otp,
    otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
  });

  await sendEmailOTP(email, otp);

  return res.status(201).json(
    new ApiResponse(
      201,
      { userId: user._id },
      "User registered successfully. OTP sent to email"
    )
  );
});

// ── VERIFY OTP 
const verifyOTP = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    throw new ApiError(400, "User ID and OTP are required");
  }

  const user = await User.findById(userId).select("+otp +otpExpiry");

  if (!user) throw new ApiError(404, "User not found");

  if (user.isVerified) {
    throw new ApiError(400, "User is already verified");
  }

  if (user.otp !== otp) {
    throw new ApiError(400, "Invalid OTP");
  }

  if (user.otpExpiry < new Date()) {
    throw new ApiError(400, "OTP has expired");
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;

  await user.save();

  const accessToken = await generateTokens(user._id, res);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
        },
      },
      "Email verified successfully"
    )
  );
});

// ── RESEND OTP 
const resendOTP = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const user = await User.findById(userId);

  if (!user) throw new ApiError(404, "User not found");

  if (user.isVerified) {
    throw new ApiError(400, "User is already verified");
  }

  const otp = generateOTP();

  user.otp = otp;
  user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await user.save();

  await sendEmailOTP(user.email, otp);

  return res.status(200).json(
    new ApiResponse(200, {}, "New OTP sent successfully")
  );
});

// ── LOGIN 
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email }).select("+password");
  const isMatch = await user.matchPassword(password);

  if (!user || !isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isVerified) {
    throw new ApiError(403, "Please verify your email before logging in");
  }

  if (user.isBlocked) {
    throw new ApiError(403, "Your account has been blocked");
  }

  const accessToken = await generateTokens(user._id, res);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
      },
      "Login successful"
    )
  );
});

// ── LOGOUT 
const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    refreshToken: null,
  });

  const cookieOption = {
    httpOnly: true,
    secure:  true,
    sameSite: 'none'
  }

  res.clearCookie("refreshToken", cookieOption);

  return res.status(200).json(
    new ApiResponse(200, {}, "Logged out successfully")
  );
});

// ── FORGOT PASSWORD
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email });

  if (!user) throw new ApiError(404, "User not found");

  const otp = generateOTP();

  user.otp = otp;
  user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await user.save();

  await sendEmailOTP(email, otp);

  return res.status(200).json(
    new ApiResponse(
      200,
      { userId: user._id },
      "Password reset OTP sent to email"
    )
  );
});

// ── CHANGE PASSWORD 
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old password and new password are required");
  }

  const user = await User.findById(req.user._id).select("+password");
  const isMatch = await user.matchPassword(oldPassword);

  if (!isMatch) {
    throw new ApiError(400, "Old password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  return res.status(200).json(
    new ApiResponse(200, {}, "Password changed successfully")
  );
});

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
  getCurrentUser,
  forgotPassword,
  changePassword,
};