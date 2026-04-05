import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });

  let decoded;
  try {
    decoded = jwt.verify(auth.replace('Bearer ', ''), process.env.JWT_SECRET);
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  await connectDB();

  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription object' });
  }

  const user = await User.findById(decoded.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Add subscription if it doesn't already exist
  const existing = user.push_subscriptions?.find(sub => sub.endpoint === subscription.endpoint);
  if (!existing) {
    user.push_subscriptions = user.push_subscriptions || [];
    user.push_subscriptions.push(subscription);
    await user.save();
  }

  res.status(200).json({ success: true });
}
