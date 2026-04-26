import { register, login, logout, verifyOTP, resendOTP, getCurrentUser} from "../controllers/authController.js";
import { refreshAccessToken } from "../utils/generateToken.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {optRatelimit} from '../middleware/Ratelimit.Middleware.js'
import { Router } from "express";

const router = Router();

//  routes
router.post('/register',optRatelimit, register);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp',optRatelimit, resendOTP);
router.post('/login', login);
router.post('/logout', authMiddleware, logout);
router.post('/refresh', refreshAccessToken);
router.get('/getCurrentUser', authMiddleware, getCurrentUser);

export default router
