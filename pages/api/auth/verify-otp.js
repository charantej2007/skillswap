import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';
import jwt from 'jsonwebtoken';

const otpStore = global.__otpStore || (global.__otpStore = {});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

  const record = otpStore[email];
  if (!record) return res.status(400).json({ error: 'OTP not found. Please request a new one.' });
  if (Date.now() > record.expires) {
    delete otpStore[email];
    return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
  }
  if (record.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

  delete otpStore[email];

  await connectDB();
  let user = await User.findOne({ email }).select('+password');
  const isNew = !user;

  if (!user) {
    user = await User.create({ email, auth_provider: 'email' });
  }

  const needsPassword = !user.password;

  const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

  // remove password before returning to client!
  const userObject = user.toObject ? user.toObject() : user;
  delete userObject.password;

  res.status(200).json({ success: true, token, user: userObject, isNew, needsPassword });
}
