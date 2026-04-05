import connectDB from '../../../lib/mongodb';
import Skill from '../../../models/Skill';
import User from '../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const skillsCount = await Skill.countDocuments();
    const membersCount = await User.countDocuments();
    const topics = await Skill.distinct('category');
    
    // Topics count can be at least the active distinct topics
    const topicsCount = topics.length > 0 ? topics.length : 12; // fallback to 12 if empty

    return res.status(200).json({
      skills: skillsCount,
      members: membersCount,
      topics: topicsCount
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
}
