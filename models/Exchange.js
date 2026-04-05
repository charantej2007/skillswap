import mongoose from 'mongoose';

const ExchangeSchema = new mongoose.Schema({
  from_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  from_name: { type: String },
  from_image: { type: String },
  to_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to_name: { type: String },
  offer_skill: { type: String, required: true },
  want_skill: { type: String, required: true },
  message: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.models.Exchange || mongoose.model('Exchange', ExchangeSchema);
