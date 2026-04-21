import { register, login, logout, verifyOTP, resendOTP, forgotPassword, changePassword} from "../controllers/authController.js";
import { refreshAccessToken } from "../utils/generateToken.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { Router } from "express";

const router = Router();

//  routes
router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.post('/logout', authMiddleware, logout);

router.post('/refresh', refreshAccessToken);
router.post('/forgot-password', authMiddleware, forgotPassword);
router.put('/change-password',  authMiddleware, changePassword);

export default router
