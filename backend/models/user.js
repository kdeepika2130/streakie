// backend/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: false,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: false,
    },
  },
  circles: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Circle",
    },
  ], // track joined circles
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create 2dsphere index for geospatial queries
userSchema.index({ location: "2dsphere" });

// Prevent OverwriteModelError in ES modules
export default mongoose.models.User || mongoose.model("User", userSchema);