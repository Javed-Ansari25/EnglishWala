import mongoose from 'mongoose';

const callSessionSchema = new mongoose.Schema(
  {
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    channel: { type: String, required: true, unique: true },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
    duration: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'active', 'ended', 'missed'],
      default: 'pending',
    },
    startedAt: { type: Date },
    endedAt: { type: Date },
  },
  { timestamps: true },
);

const CallSession = mongoose.model('CallSession', callSessionSchema);
export default CallSession;
