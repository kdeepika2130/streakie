import mongoose from 'mongoose';

const MissedStreakSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
  habitName: { type: String, required: true },
  date: { type: Date, default: Date.now },
  userExplanation: { type: String, required: true },
  aiReply: { type: String },
  validReason: { type: Boolean, default: true },
});

export default mongoose.model('MissedStreak', MissedStreakSchema);
