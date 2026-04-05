import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  email: { type: String, required: true, unique: true },
  profile_image: { type: String, default: '' },
  skills_teach: [{ type: Object }],
  skills_learn: [{
    title: { type: String, required: true },
    category: { type: String, required: true }
  }],
  auth_provider: { type: String, enum: ['email', 'google'], default: 'email' },
  push_subscriptions: [{ type: Object }],
  password: { type: String, select: false },
  created_at: { type: Date, default: Date.now },
});

if (mongoose.models.User) {
  delete mongoose.models.User;
}
export default mongoose.model('User', UserSchema);
