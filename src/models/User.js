import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    mobile: { type: String, unique: true, sparse: true },
    password: { type: String, select: false },
    profilePhoto: { type: String, default: '' },
    googleId: { type: String, sparse: true },
    isVerified: { type: Boolean, default: false },
    otp: { type: String, select: false },
    otpExpiry: { type: Date, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    englishLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    subscription: {
      type: String,
      enum: ['free', 'basic', 'premium'],
      default: 'free',
    },
    subscriptionExpiry: { type: Date },
    refreshToken: { type: String, select: false },
    isBlocked: { type: Boolean, default: false },
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return null;
  this.password = await bcrypt.hash(this.password, 10);
  return;
});

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
