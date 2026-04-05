import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  from_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  from_name: { type: String },
  from_image: { type: String },
  type: { type: String, enum: ['exchange_request', 'exchange_accepted'], required: true },
  message: { type: String, required: true },
  exchange_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Exchange' },
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
