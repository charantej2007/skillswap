import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  await connectDB();
  const user = await User.findOne({ email }).select('+password');

  if (!user || user.auth_provider !== 'email') {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (!user.password) {
    return res.status(401).json({ error: 'Please set up your password via OTP or log in using Google.' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  
  // Return the user without the password field
  const userObject = user.toObject();
  delete userObject.password;

  res.status(200).json({ success: true, token, user: userObject });
}
