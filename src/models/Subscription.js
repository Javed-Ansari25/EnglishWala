import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: String, enum: ['basic', 'premium'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    orderId: { type: String },
    paymentId: { type: String },
    status: {
      type: String,
      enum: ['pending', 'active', 'expired', 'failed'],
      default: 'pending',
    },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true },
);

const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;
