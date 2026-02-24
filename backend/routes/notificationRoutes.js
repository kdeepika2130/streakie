import express from 'express';
import Notification from '../models/notification.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Create notification (called by client when a scheduled notification fires)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { habitId, habitName, body, time, date } = req.body;

    // compute day range for dedupe (UTC-local day from provided date or now)
    const when = date ? new Date(date) : new Date();
    const dayStart = new Date(when.getFullYear(), when.getMonth(), when.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    // build dedupe query: same user, same day, same habit (by id or name), and same time if provided
    const query = { user: req.user.id, date: { $gte: dayStart, $lt: dayEnd } };
    if (habitId) query.habitId = habitId;
    else if (habitName) query.habitName = habitName;
    if (time) query.time = time;

    const existing = await Notification.findOne(query);
    if (existing) {
      // Return existing notification instead of creating a duplicate
      return res.json({ success: true, notification: existing, duplicate: true });
    }

    const note = new Notification({ user: req.user.id, habitId, habitName, body, time, date });
    await note.save();
    res.json({ success: true, notification: note });
  } catch (err) {
    console.error('Failed to save notification', err);
    res.status(500).json({ success: false, message: 'Failed to save notification' });
  }
});

// Get notifications for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notes = await Notification.find({ user: req.user.id }).sort({ date: -1 }).limit(200);
    res.json({ success: true, notifications: notes });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// Mark as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const note = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { read: true }, { new: true });
    if (!note) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, notification: note });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
});

// Clear all
router.delete('/', authMiddleware, async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to clear notifications' });
  }
});

export default router;
