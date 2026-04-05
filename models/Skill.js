import mongoose from 'mongoose';

const SkillSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, required: true },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  mentor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentor_name: { type: String, default: '' },
  mentor_image: { type: String, default: '' },
  availability: { type: String, default: 'Flexible' },
  is_live: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.models.Skill || mongoose.model('Skill', SkillSchema);
