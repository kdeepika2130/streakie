import express from 'express';
import MissedStreak from '../models/missedStreak.js';
import Habit from '../models/habit.js';
import authMiddleware from '../middleware/authMiddleware.js';

// Placeholder AI function (replace with OpenAI API call in production)
async function getAIMotivation(explanation) {
  // Simulate AI response
  return `Keep going! Remember, setbacks are part of the journey. You said: "${explanation}". Tomorrow is a new chance!`;
}

const router = express.Router();

// POST /api/streaks/missed
router.post('/missed', authMiddleware, async (req, res) => {
  try {
    const { habitId, explanation } = req.body;
    const userId = req.user.id;
    if (!habitId || !explanation) {
      return res.status(400).json({ success: false, message: 'habitId and explanation are required.' });
    }
    // Get habit and check createdAt
    const habit = await Habit.findOne({ _id: habitId, user: userId });
    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found.' });
    }
    // Only allow if habit was created before yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0,0,0,0);
    if (!habit.createdAt || habit.createdAt >= yesterday) {
      return res.status(400).json({ success: false, message: 'Cannot submit missed streak for habits created today or yesterday.' });
    }
    // Call AI API (placeholder)
    const aiResponse = await getAIMotivation(explanation);
    // Save only user's explanation to DB
    const missed = new MissedStreak({
      user: userId,
      habitId,
      habitName: habit.name,
      userExplanation: explanation,
      date: new Date(),
    });
    await missed.save();
    res.json({ success: true, aiResponse, entry: missed });
  } catch (err) {
    console.error('Missed streak error:', err);
    res.status(500).json({ success: false, message: 'Failed to process missed streak.' });
  }
});

// GET /api/streaks/missed/:habitId (get all missed streaks for a habit)
router.get('/missed/:habitId', authMiddleware, async (req, res) => {
  try {
    const { habitId } = req.params;
    const userId = req.user.id;
  const history = await MissedStreak.find({ user: userId, habitId }).sort({ date: -1 });
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch missed streak history.' });
  }
});

// GET /api/streaks/missed (get all missed streaks for a user)
router.get('/missed', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
  const history = await MissedStreak.find({ user: userId }).sort({ date: -1 });
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch missed streak history.' });
  }
});

export default router;