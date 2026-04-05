import connectDB from '../../../lib/mongodb';
import Message from '../../../models/Message';
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
    const { with: withUser, exchange_id } = req.query;
    const query = {
      $or: [
        { sender: decoded.userId, receiver: withUser },
        { sender: withUser, receiver: decoded.userId },
      ],
    };
    if (exchange_id) query.exchange_id = exchange_id;
    const messages = await Message.find(query).sort({ timestamp: 1 }).limit(100);
    return res.status(200).json({ messages });
  }

  if (req.method === 'POST') {
    const { receiver, text, exchange_id, is_proposal, proposal_data } = req.body;
    const message = await Message.create({
      sender: decoded.userId,
      receiver,
      text,
      exchange_id,
      is_proposal: Boolean(is_proposal),
      proposal_data,
    });
    return res.status(201).json({ message });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
