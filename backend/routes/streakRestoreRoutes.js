import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import StreakRestore from '../models/streakRestore.js';
import Habit from '../models/habit.js';

const router = express.Router();

// Get user's restore chances for current month
router.get('/chances', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
    const currentYear = now.getFullYear();

    let restoreRecord = await StreakRestore.findOne({
      user: req.user.id,
      month: currentMonth,
      year: currentYear
    });

    // If no record exists for this month, create one with 0 used chances
    if (!restoreRecord) {
      restoreRecord = new StreakRestore({
        user: req.user.id,
        month: currentMonth,
        year: currentYear,
        usedChances: 0
      });
      await restoreRecord.save();
    }

    const remainingChances = 5 - restoreRecord.usedChances;

    res.json({
      success: true,
      restoreChances: remainingChances,
      usedChances: restoreRecord.usedChances,
      month: currentMonth,
      year: currentYear
    });
  } catch (err) {
    console.error('Error fetching restore chances:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch restore chances' });
  }
});

// Restore a streak (use one chance)
router.post('/restore', authMiddleware, async (req, res) => {
  try {
    const { habitId } = req.body;
    const userId = req.user.id;

    if (!habitId) {
      return res.status(400).json({ success: false, message: 'Habit ID is required' });
    }

    // Get current month/year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Find or create restore record
    let restoreRecord = await StreakRestore.findOne({
      user: userId,
      month: currentMonth,
      year: currentYear
    });

    if (!restoreRecord) {
      restoreRecord = new StreakRestore({
        user: userId,
        month: currentMonth,
        year: currentYear,
        usedChances: 0
      });
    }

    // Check if user has remaining chances
    if (restoreRecord.usedChances >= 5) {
      return res.status(400).json({
        success: false,
        message: 'No restore chances remaining this month. You get 5 chances per month.'
      });
    }

    // Verify habit exists and belongs to user
    const habit = await Habit.findOne({ _id: habitId, user: userId });
    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }

    // Get today's date string for comparison
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Check if habit was already completed today
    const isCompletedToday = habit.completedDates.some(date =>
      date.toISOString().split('T')[0] === todayStr
    );

    if (isCompletedToday) {
      return res.status(400).json({
        success: false,
        message: 'Habit was already completed today'
      });
    }

    // When restoring a streak, we don't mark it as completed
    // Instead, we keep it as pending so the user can mark it as completed
    // This allows them to get credit for completing it today
    habit.status = 'pending';

    await habit.save();

    // Increment used chances
    restoreRecord.usedChances += 1;
    await restoreRecord.save();

    const remainingChances = 5 - restoreRecord.usedChances;

    res.json({
      success: true,
      message: 'Streak restored successfully!',
      restoreChances: remainingChances,
      usedChances: restoreRecord.usedChances,
      habitName: habit.name
    });

  } catch (err) {
    console.error('Error restoring streak:', err);
    res.status(500).json({ success: false, message: 'Failed to restore streak' });
  }
});

export default router;
