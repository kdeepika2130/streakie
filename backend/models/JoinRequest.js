// backend/models/JoinRequest.js
import mongoose from "mongoose";

const joinRequestSchema = new mongoose.Schema({
    circleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Circle",
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Prevent duplicate join requests for the same user & circle
joinRequestSchema.index({ circleId: 1, userId: 1 }, { unique: true });

// Prevent OverwriteModelError when using ES modules or hot reload
export default mongoose.models.JoinRequest || mongoose.model("JoinRequest", joinRequestSchema);