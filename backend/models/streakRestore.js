import mongoose from 'mongoose';

const StreakRestoreSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: Number, required: true }, // Month (1-12)
  year: { type: Number, required: true },  // Year
  usedChances: { type: Number, default: 0, max: 5 }, // Used chances (max 5 per month)
  date: { type: Date, default: Date.now }
});

// Compound index to ensure one record per user per month
StreakRestoreSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model('StreakRestore', StreakRestoreSchema);
