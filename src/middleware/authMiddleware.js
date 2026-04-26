import jwt from "jsonwebtoken"
import User from "../models/User.js";
import redisClient from "../config/redis.js";

import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/sendResponse&Error.js";

export const authMiddleware = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    
        if (!token) {
            throw new ApiError(401, "UnAuthorization error")
        }

        const isBlacklisted = await redisClient.get(`bl:${token}`);
        if (isBlacklisted) {
            throw new ApiError(401, "Token expired");
        }
            
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?.id);
    
        if(!user) {
            throw new ApiError(401, "Invalid access token");
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
})