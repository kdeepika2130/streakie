import cron from "node-cron";
import Habit from "../models/habit.js";
import MissedStreak from "../models/missedStreak.js";
import StreakRestore from "../models/streakRestore.js";
import Notification from "../models/notification.js";
import CirclePost from "../models/CirclePost.js";
import EmotionLog from "../models/EmotionLog.js";
import { io } from "../server.js";

export const startStreakMonitor = () => {
    // Run every hour to check for habits that have been missed for > 24 hours
    cron.schedule("0 * * * *", async () => {
        console.log("[Cron] Running streak monitor cron job...");
        try {
            // Find habits where status is 'missed' and updatedAt is > 24 hours ago
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const habitsToDelete = await Habit.find({
                status: "missed",
                updatedAt: { $lt: twentyFourHoursAgo },
            });

            if (habitsToDelete.length > 0) {
                console.log(`[Cron] Found ${habitsToDelete.length} habits to hard delete due to 24h un-restored miss.`);

                for (const habit of habitsToDelete) {
                    const habitId = habit._id;
                    const userId = habit.user;

                    // 1. Hard Delete the habit
                    await Habit.findByIdAndDelete(habitId);

                    // 2. Cascading Delete associated documents
                    await Promise.all([
                        MissedStreak.deleteMany({ habitId }),
                        StreakRestore.deleteMany({ habitId }),
                        Notification.deleteMany({ "data.habitId": habitId }),
                        EmotionLog.deleteMany({ habitId }),
                    ]);

                    console.log(`[Cron] Successfully permanently deleted habit: ${habit.name}`);

                    // 3. Emit real-time updates to connected clients
                    io.emit("habit_deleted", { habitId, userId });
                }
            } else {
                console.log("[Cron] No overdue missed habits found.");
            }
        } catch (error) {
            console.error("[Cron] Error running streak monitor:", error);
        }
    });
};
