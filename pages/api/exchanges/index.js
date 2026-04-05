import connectDB from '../../../lib/mongodb';
import Exchange from '../../../models/Exchange';
import User from '../../../models/User';
import Notification from '../../../models/Notification';
import { sendPushNotification } from '../../../lib/push';
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

  // POST /api/exchanges - create exchange request
  if (req.method === 'POST') {
    const { to_user, offer_skill, want_skill, message, to_name, to_image } = req.body;
    const fromUser = await User.findById(decoded.userId);
    const exchange = await Exchange.create({
      from_user: decoded.userId,
      from_name: fromUser?.name || fromUser?.email,
      from_image: fromUser?.profile_image || '',
      to_user, to_name, to_image,
      offer_skill, want_skill, message,
    });

    const notifMsg = `${fromUser?.name || 'Someone'} wants to exchange ${offer_skill} for your ${want_skill}`;
    await Notification.create({
      user: to_user,
      from_user: decoded.userId,
      from_name: fromUser?.name || fromUser?.email,
      from_image: fromUser?.profile_image || '',
      type: 'exchange_request',
      message: notifMsg,
      exchange_id: exchange._id
    });

    const targetUser = await User.findById(to_user);
    if (targetUser && targetUser.push_subscriptions) {
      await sendPushNotification(targetUser.push_subscriptions, {
        title: 'New Exchange Request',
        message: notifMsg,
        url: '/notifications'
      });
    }

    return res.status(201).json({ exchange });
  }

  // GET /api/exchanges?type=incoming|outgoing|accept|reject
  if (req.method === 'GET') {
    const { type, id, action } = req.query;

    if (action === 'accept' || action === 'reject') {
      const exchange = await Exchange.findById(id);
      if (!exchange) return res.status(404).json({ error: 'Not found' });
      if (exchange.to_user.toString() !== decoded.userId) return res.status(403).json({ error: 'Forbidden' });
      exchange.status = action === 'accept' ? 'accepted' : 'rejected';
      await exchange.save();

      if (action === 'accept') {
        const fromUser = await User.findById(exchange.from_user);
        const currentUser = await User.findById(decoded.userId);
        const notifMsg = `${currentUser?.name || 'Someone'} accepted your request for ${exchange.want_skill}`;
        
        await Notification.create({
          user: exchange.from_user,
          from_user: decoded.userId,
          from_name: currentUser?.name || currentUser?.email,
          from_image: currentUser?.profile_image || '',
          type: 'exchange_accepted',
          message: notifMsg,
          exchange_id: exchange._id
        });

        if (fromUser && fromUser.push_subscriptions) {
          await sendPushNotification(fromUser.push_subscriptions, {
            title: 'Exchange Accepted!',
            message: notifMsg,
            url: '/notifications'
          });
        }
      }

      return res.status(200).json({ exchange });
    }

    if (type === 'incoming') {
      const exchanges = await Exchange.find({ to_user: decoded.userId }).sort({ created_at: -1 });
      return res.status(200).json({ exchanges });
    }

    if (type === 'outgoing') {
      const exchanges = await Exchange.find({ from_user: decoded.userId }).sort({ created_at: -1 });
      return res.status(200).json({ exchanges });
    }

    return res.status(400).json({ error: 'type required' });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
