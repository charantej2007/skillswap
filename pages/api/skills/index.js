import connectDB from '../../../lib/mongodb';
import Skill from '../../../models/Skill';
import User from '../../../models/User';
import jwt from 'jsonwebtoken';

function getUser(req) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  try { return jwt.verify(auth.replace('Bearer ', ''), process.env.JWT_SECRET); }
  catch { return null; }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      await connectDB();
      const { category, search, suggested, mentor_id } = req.query;
      const decoded = getUser(req);
      let query = {};

      // If mentor_id is specified (e.g., from Profile page), filter strictly by that mentor
      if (mentor_id) {
        query.mentor_id = mentor_id;
      } 
      // Otherwise, if user is logged in, exclude their own skills from general listings (Discover/Home)
      else if (decoded) {
        query.mentor_id = { $ne: decoded.userId };
      }

      if (suggested === 'true') {
        if (decoded) {
          const user = await User.findById(decoded.userId);
          if (user && user.skills_learn && user.skills_learn.length > 0) {
            const desiredCategories = user.skills_learn.map(s => s.category).filter(Boolean);
            if (desiredCategories.length > 0) {
              query.category = { $in: desiredCategories };
            }
          }
        }
      } else if (category && category !== 'All') {
        query.category = category;
      }

      if (search) query.title = { $regex: search, $options: 'i' };
      let skills = await Skill.find(query).sort({ created_at: -1 }).limit(50);
      return res.status(200).json({ skills });
    } catch (err) {
      console.error('[/api/skills GET]', err.message);
      return res.status(200).json({ skills: [] });
    }
  }

  if (req.method === 'POST') {
    const decoded = getUser(req);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
    await connectDB();
    const { title, description, category, level, availability } = req.body;
    const skill = await Skill.create({
      title, description, category, level, availability,
      mentor_id: decoded.userId,
      mentor_name: req.body.mentor_name || '',
    });
    return res.status(201).json({ skill });
  }

  if (req.method === 'DELETE') {
    const decoded = getUser(req);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
    await connectDB();
    const { id } = req.query;
    await Skill.findOneAndDelete({ _id: id, mentor_id: decoded.userId });
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
