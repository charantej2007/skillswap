import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';
import OTP from '../../../models/OTP';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

  await connectDB();

  // Find OTP in MongoDB
  const record = await OTP.findOne({ email });
  
  if (!record) return res.status(400).json({ error: 'OTP not found. Please request a new one.' });
  
  // Note: MongoDB TTL index handles expiration (deletes the doc), 
  // but we can add an extra check here if we want or just trust the DB.
  if (record.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

  // Delete the OTP immediately after successful verification
  await OTP.deleteOne({ _id: record._id });

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
