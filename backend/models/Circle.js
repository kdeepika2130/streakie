// backend/models/Circle.js
import mongoose from "mongoose";

/**
 * Circle Schema represents a user-created group with members,
 * admins, geolocation, and visibility settings.
 */
const circleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    category: {
        type: String,
        required: true,
        trim: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    admins: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    visibility: {
        type: String,
        enum: ["public", "private"],
        default: "public",
    },
    location: {
        type: {
            type: String,
            enum: ["Point"],
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
        },
    },
    radius: {
        type: Number, // radius in kilometers
        default: 10,
    },
}, { timestamps: true });

// 2dsphere index for geospatial queries
circleSchema.index({ location: "2dsphere" });

// Prevent OverwriteModelError when using ES modules or nodemon hot reload
export default mongoose.models.Circle || mongoose.model("Circle", circleSchema);