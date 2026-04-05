import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  exchange_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Exchange' },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  is_proposal: { type: Boolean, default: false },
  proposal_data: { type: Object },
  timestamp: { type: Date, default: Date.now },
});

if (mongoose.models.Message) {
  delete mongoose.models.Message;
}
export default mongoose.model('Message', MessageSchema);
