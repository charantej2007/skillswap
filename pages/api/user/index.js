import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';
import jwt from 'jsonwebtoken';

function getUser(req) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  try {
    return jwt.verify(auth.replace('Bearer ', ''), process.env.JWT_SECRET);
  } catch { return null; }
}

export default async function handler(req, res) {
  const decoded = getUser(req);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });

  await connectDB();

  if (req.method === 'GET') {
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.status(200).json({ user });
  }

  if (req.method === 'POST') {
    const { name, profile_image, skills_teach, skills_learn } = req.body;
    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { $set: { name, profile_image, skills_teach, skills_learn } },
      { new: true }
    );
    return res.status(200).json({ user });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
