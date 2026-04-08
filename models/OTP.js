import mongoose from 'mongoose';

const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // Automatic deletion after 10 minutes (600 seconds)
  },
});

// Use existing model if it exists, otherwise define it
export default mongoose.models.OTP || mongoose.model('OTP', OTPSchema);
