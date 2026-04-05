import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, email, profile_image } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    await connectDB();

    let user = await User.findOne({ email });
    const isNew = !user;

    if (!user) {
      user = await User.create({
        email,
        name: name || '',
        profile_image: '', // Default to empty so email initial shows instead
        auth_provider: 'google',
      });
    } else {
      // Update profile info from Google if not already set
      let changed = false;
      if (name && !user.name) { user.name = name; changed = true; }
      // Removed profile_image syncing intentionally
      if (changed) await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({ success: true, token, user, isNew });
  } catch (err) {
    console.error('[google-login] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
