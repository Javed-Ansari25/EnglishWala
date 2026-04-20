import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ── Access Token generate 
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '25m',
  });
};

// ── Refresh Token generate 
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  });
};

// ── Dono tokens generate 
const generateTokens = async (userId, res) => {
  const accessToken  = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);

  // Refresh token DB mein save 
  await User.findByIdAndUpdate(userId, { refreshToken });

  // Refresh token httpOnly cookie 
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure:  true,
    sameSite: 'none',
  });

  return accessToken;
};

// ── Refresh Token se naya Access Token 
const refreshAccessToken = async (req, res) => {
  try {
    // Cookie se refresh token 
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token not found' });
    }

    // Refresh token verify 
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Refresh token expire, Please Again login' });
    }

    // DB mein check karo — token match karta hai ya nahi
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User nahi mila' });
    }

    if (user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: 'Refresh token invalid hai' });
    }

    // Naya access token banaya
    const newAccessToken = generateAccessToken(user._id);

    return res.status(200).json({
      success:     true,
      accessToken: newAccessToken,
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export { generateAccessToken, generateRefreshToken, generateTokens, refreshAccessToken };