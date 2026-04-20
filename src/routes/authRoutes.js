import { refreshAccessToken } from "../utils/generateToken.js";
import { Router } from "express";

const router = Router();

//  route
router.post("/refresh", refreshAccessToken)

export default router
