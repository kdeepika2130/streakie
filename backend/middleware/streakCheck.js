import Habit from "../models/habit.js";

const STREAK_THRESHOLD = 7;

export const checkStreakThreshold = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Find all habits for the user
        const userHabits = await Habit.find({ user: userId });

        if (!userHabits || userHabits.length === 0) {
            return res.status(403).json({
                success: false,
                message: `You need a streak of at least ${STREAK_THRESHOLD} days to create a circle. Keep building your habits!`,
            });
        }

        // Check if any habit meets the threshold
        const hasSufficientStreak = userHabits.some((habit) => habit.streak >= STREAK_THRESHOLD);

        if (!hasSufficientStreak) {
            return res.status(403).json({
                success: false,
                message: `You need a streak of at least ${STREAK_THRESHOLD} days to create a circle. Keep building your habits!`,
            });
        }

        next();
    } catch (error) {
        console.error("Error checking streak threshold:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
