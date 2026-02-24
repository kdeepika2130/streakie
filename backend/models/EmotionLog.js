import mongoose from "mongoose";

const emotionLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    habitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Habit",
    },
    currentStreak: {
        type: Number,
        required: true,
    },
    missedReason: {
        type: String,
    },
    emotionType: {
        type: String,
        enum: ["Proud", "Encouraging", "Supportive", "Concerned"],
        required: true,
    },
    aiResponse: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model("EmotionLog", emotionLogSchema);
