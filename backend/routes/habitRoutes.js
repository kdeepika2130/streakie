import express from 'express';
import { format, isSameDay, subDays, differenceInDays, parse } from 'date-fns';
import Habit from '../models/habit.js';
import MissedStreak from '../models/missedStreak.js';
import StreakRestore from '../models/streakRestore.js';
import Notification from '../models/notification.js';
import CirclePost from '../models/CirclePost.js';
import EmotionLog from '../models/EmotionLog.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { io } from '../server.js';

// Custom error class for API errors
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Input validation function
const validateInput = (data, requiredFields) => {
  const missingFields = requiredFields.filter((field) => !data[field] && data[field] !== '');
  if (missingFields.length > 0) {
    throw new ApiError(400, `Missing required fields: ${missingFields.join(', ')}`);
  }
  if (data.name && data.name.length > 100) {
    throw new ApiError(400, 'Habit name must be 100 characters or less');
  }
  if (data.frequency && !['daily', 'weekly'].includes(data.frequency)) {
    throw new ApiError(400, 'Frequency must be "daily" or "weekly"');
  }
  if (data.target && (isNaN(data.target) || data.target < 1)) {
    throw new ApiError(400, 'Target must be a positive number');
  }
};

// Calculate streak based on completedDates
const calculateStreak = (completedDates, frequency, target) => {
  if (!completedDates || completedDates.length === 0) return 0;

  const sortedDates = [...completedDates].sort((a, b) => new Date(b) - new Date(a));
  let streak = 0;
  const today = new Date();

  if (frequency === 'daily') {
    let currentDate = today;
    for (const date of sortedDates) {
      if (isSameDay(new Date(date), currentDate)) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else if (differenceInDays(currentDate, new Date(date)) > 1) {
        break;
      }
    }
  } else if (frequency === 'weekly') {
    // Count weeks with target completions
    const weeks = {};
    sortedDates.forEach((date) => {
      const weekStart = format(new Date(date), 'yyyy-WW');
      weeks[weekStart] = (weeks[weekStart] || 0) + 1;
    });

    let currentWeek = format(today, 'yyyy-WW');
    let weekCount = 0;
    while (weeks[currentWeek] && weeks[currentWeek] >= target) {
      streak++;
      weekCount++;
      currentWeek = format(subDays(new Date(currentWeek), 7), 'yyyy-WW');
    }
  }

  return streak;
};

// Calculate habit status based on current date and completion
const calculateStatus = (completedDates, frequency, target, createdAt, time, timeFrom, timeTo) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayCompleted = completedDates.includes(today);

  if (todayCompleted) {
    return 'completed';
  }

  // Check if today is a missed day for daily habits
  if (frequency === 'daily') {
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const yesterdayCompleted = completedDates.includes(yesterday);

    // Only mark as missed if the habit was created before yesterday
    // This prevents newly created habits from being marked as missed
    const habitCreatedDate = format(new Date(createdAt), 'yyyy-MM-dd');
    const shouldCheckYesterday = habitCreatedDate < yesterday;

    if (shouldCheckYesterday && !yesterdayCompleted) {
      return 'missed';
    }

    // Time-based missed check for today
    const now = new Date();
    const currentTimeStr = format(now, 'HH:mm');
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // If no time set, fall back to pending
    if (!time && !timeFrom && !timeTo) {
      return 'pending';
    }

    // Single time check
    if (time) {
      const [habitHour, habitMinute] = time.split(':').map(Number);
      if (currentHour > habitHour || (currentHour === habitHour && currentMinute > habitMinute)) {
        return 'missed';
      }
    }

    // Time range check
    if (timeFrom && timeTo) {
      const [fromHour, fromMinute] = timeFrom.split(':').map(Number);
      const [toHour, toMinute] = timeTo.split(':').map(Number);

      const fromTime = fromHour * 60 + fromMinute;
      const toTime = toHour * 60 + toMinute;
      const currentTimeMinutes = currentHour * 60 + currentMinute;

      // If current time is after the end of the range
      if (currentTimeMinutes > toTime) {
        return 'missed';
      }

      // If current time is within the range but not completed
      if (currentTimeMinutes >= fromTime && currentTimeMinutes <= toTime) {
        return 'pending'; // Still within time, allow completion
      }
    }
  }

  return 'pending';
};

// Controller functions
const getHabits = async (req, res) => {
  try {
    console.log('getHabits: Fetching habits for user:', req.user.id);
    const habits = await Habit.find({ user: req.user.id });
    console.log('getHabits: Found habits:', habits.length);

    // Update streaks and status for all habits
    for (const habit of habits) {
      habit.streak = calculateStreak(habit.completedDates, habit.frequency, habit.target);
      habit.status = calculateStatus(
        habit.completedDates,
        habit.frequency,
        habit.target,
        habit.createdAt,
        habit.time,
        habit.timeFrom,
        habit.timeTo
      );
      await habit.save();
    }

    res.json({
      success: true,
      habits,
    });
  } catch (err) {
    console.error('getHabits error:', err);
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to fetch habits',
    });
  }
};

const createHabit = async (req, res) => {
  const { name, description, frequency, target, icon, emoji, time, timeFrom, timeTo, startTime, endTime } = req.body;
  try {
    console.log('createHabit: Creating habit for user:', req.user.id);
    validateInput(req.body, ['name', 'frequency', 'emoji']);

    const habitData = {
      user: req.user.id,
      name,
      description: description || '',
      frequency,
      target: frequency === 'weekly' ? target || 1 : 1,
      // support both single time and range
      time: time || '',
      timeFrom: timeFrom || '',
      timeTo: timeTo || '',
      startTime: startTime || '',
      endTime: endTime || '',
      icon: icon || 'Flame', // Default to 'Flame' if icon is not provided
      emoji,
      completedDates: [],
      streak: 0,
      status: 'pending',
    };

    const newHabit = new Habit(habitData);
    await newHabit.save();
    console.log('createHabit: Habit created successfully:', newHabit._id);

    res.status(201).json({
      success: true,
      habit: newHabit,
    });
  } catch (err) {
    console.error('createHabit error:', err);
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to create habit',
    });
  }
};

const updateHabitCompletion = async (req, res) => {
  const { id } = req.params;
  const { date, completed } = req.body;
  try {
    console.log('updateHabitCompletion: Updating habit:', id, 'for date:', date);
    validateInput(req.body, ['date', 'completed']);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new ApiError(400, 'Date must be in YYYY-MM-DD format');
    }

    const habit = await Habit.findOne({ _id: id, user: req.user.id });
    if (!habit) {
      throw new ApiError(404, 'Habit not found');
    }

    // Only allow marking as completed if 24 hours have passed since last completion for this habit
    if (completed) {
      // Find the most recent completion date
      const sortedDates = [...habit.completedDates].sort((a, b) => new Date(b) - new Date(a));
      const lastCompleted = sortedDates.length > 0 ? new Date(sortedDates[0]) : null;
      const currentDate = new Date(date);
      let canComplete = true;
      if (lastCompleted) {
        // Check if 24 hours have passed since last completion
        const diffMs = currentDate - lastCompleted;
        if (diffMs < 24 * 60 * 60 * 1000 && format(currentDate, 'yyyy-MM-dd') !== format(lastCompleted, 'yyyy-MM-dd')) {
          canComplete = false;
        }
      }
      if (!habit.completedDates.includes(date) && canComplete) {
        habit.completedDates.push(date);
        // Update status to completed when marking as completed
        habit.status = 'completed';
      }
    } else {
      habit.completedDates = habit.completedDates.filter((d) => d !== date);
      // If removing completion, set status back to pending
      habit.status = 'pending';
    }

    // Always recalculate streak and status after updating completedDates
    habit.streak = calculateStreak(habit.completedDates, habit.frequency, habit.target);
    habit.status = calculateStatus(
      habit.completedDates,
      habit.frequency,
      habit.target,
      habit.createdAt,
      habit.time,
      habit.timeFrom,
      habit.timeTo
    );
    await habit.save();
    console.log('updateHabitCompletion: Habit updated successfully');

    // Broadcast update for Live Dashboard Data
    io.emit("habit_updated", { habitId: id, userId: req.user.id, streak: habit.streak, status: habit.status });

    res.json({
      success: true,
      habit,
    });
  } catch (err) {
    console.error('updateHabitCompletion error:', err);
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to update habit',
    });
  }
};

const deleteHabit = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    console.log('deleteHabit: Attempting to delete habit:', id, 'for user:', userId);

    // Hard delete the habit directly
    const deletedHabit = await Habit.findOneAndDelete({ _id: id, user: userId });
    if (!deletedHabit) {
      console.log('deleteHabit: Habit not found with id:', id);
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }

    console.log('deleteHabit: Successfully deleted habit:', deletedHabit.name);

    // 2. Cascading Delete associated documents
    await Promise.all([
      MissedStreak.deleteMany({ habit: id }),
      StreakRestore.deleteMany({ habit: id }),
      Notification.deleteMany({ data: { habitId: id } }), // if notifications store habitId in data map
      EmotionLog.deleteMany({ habitId: id }),
    ]);
    console.log('deleteHabit: Successfully performed cascading deletions for habit:', id);

    // Broadcast update for Live Dashboard Data
    io.emit("habit_deleted", { habitId: id, userId });

    res.json({
      success: true,
      message: 'Habit and all associated data deleted successfully',
      deletedHabit: {
        id: deletedHabit._id,
        name: deletedHabit.name
      }
    });
  } catch (err) {
    console.error('deleteHabit error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete habit',
    });
  }
};

const markHabitAsMissed = async (req, res) => {
  const { id } = req.params;
  try {
    console.log('markHabitAsMissed: Marking habit as missed:', id);
    const habit = await Habit.findOne({ _id: id, user: req.user.id });
    if (!habit) {
      throw new ApiError(404, 'Habit not found');
    }

    // Only mark as missed if it's currently pending
    if (habit.status === 'pending') {
      habit.status = 'missed';
      await habit.save();
      console.log('markHabitAsMissed: Habit status updated to missed');
    }

    res.json({
      success: true,
      habit,
    });
  } catch (err) {
    console.error('markHabitAsMissed error:', err);
    res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Failed to update habit' });
  }
};

// Initialize router
const router = express.Router();

// Routes
router.get('/', authMiddleware, getHabits);
router.post('/', authMiddleware, createHabit);
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, description, frequency, target, icon, emoji, time, timeFrom, timeTo, startTime, endTime } = req.body;
  try {
    console.log('updateHabit: Updating habit:', id);
    validateInput(req.body, ['name', 'frequency', 'emoji']);
    const habit = await Habit.findOne({ _id: id, user: req.user.id });
    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }
    habit.name = name;
    habit.description = description || '';
    habit.frequency = frequency;
    habit.target = frequency === 'weekly' ? target || 1 : 1;
    habit.icon = icon || 'Flame';
    habit.emoji = emoji;
    habit.time = time || '';
    habit.timeFrom = timeFrom || '';
    habit.timeTo = timeTo || '';
    habit.startTime = startTime || '';
    habit.endTime = endTime || '';
    await habit.save();
    console.log('updateHabit: Habit updated successfully');
    res.json({ success: true, habit });
  } catch (err) {
    console.error('updateHabit error:', err);
    res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Failed to update habit' });
  }
});
router.put('/:id/complete', authMiddleware, updateHabitCompletion);
router.delete('/:id', authMiddleware, deleteHabit);
router.put('/:id/miss', authMiddleware, markHabitAsMissed);

export default router;
