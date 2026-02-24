import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit' },
  habitName: { type: String },
  body: { type: String },
  time: { type: String },
  date: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
});

export default mongoose.model('Notification', NotificationSchema);
