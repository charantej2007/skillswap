import connectDB from '../../../lib/mongodb';
import Notification from '../../../models/Notification';
import jwt from 'jsonwebtoken';

function getUser(req) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  try { return jwt.verify(auth.replace('Bearer ', ''), process.env.JWT_SECRET); }
  catch { return null; }
}

export default async function handler(req, res) {
  const decoded = getUser(req);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });

  await connectDB();

  if (req.method === 'GET') {
    const notifications = await Notification.find({ user: decoded.userId }).sort({ created_at: -1 });
    return res.status(200).json({ notifications });
  }

  if (req.method === 'PUT') {
    // Mark all as read
    await Notification.updateMany({ user: decoded.userId, is_read: false }, { $set: { is_read: true } });
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
