// backend/models/CirclePost.js
import mongoose from "mongoose";

// Sub-schema for comments
const commentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const circlePostSchema = new mongoose.Schema({
    circleId: { type: mongoose.Schema.Types.ObjectId, ref: "Circle", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    imageUrl: { type: String },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
    createdAt: { type: Date, default: Date.now },
});

// Prevent OverwriteModelError
export default mongoose.models.CirclePost || mongoose.model("CirclePost", circlePostSchema);