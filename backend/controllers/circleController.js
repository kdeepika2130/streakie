// backend/controllers/circleController.js
import mongoose from "mongoose";
import Circle from "../models/Circle.js";
import User from "../models/user.js";
import JoinRequest from "../models/JoinRequest.js";
import CirclePost from "../models/CirclePost.js";

/* =========================
   CIRCLE CRUD & DETAILS
========================= */

/* CREATE CIRCLE */
export const createCircle = async (req, res) => {
    try {
        const { name, description, category, visibility, latitude, longitude, radius } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const newCircle = new Circle({
            name,
            description,
            category,
            visibility: visibility || "public",
            createdBy: userId,
            admins: [userId],
            members: [userId],
            radius: radius || 10,
        });

        if (latitude && longitude) {
            newCircle.location = { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] };
        }

        await newCircle.save();
        await User.findByIdAndUpdate(userId, { $addToSet: { circles: newCircle._id } });

        res.status(201).json({ success: true, message: "Circle created successfully", circle: newCircle });
    } catch (error) {
        console.error("Error creating circle:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/* GET ALL CIRCLES */
export const getCircles = async (req, res) => {
    try {
        const { lat, lng, radius, category } = req.query;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        let query = { $or: [{ visibility: "public" }, { members: userId }] };
        if (category) query.category = category;

        if (lat && lng) {
            const parsedLat = parseFloat(lat);
            const parsedLng = parseFloat(lng);
            if (isNaN(parsedLat) || isNaN(parsedLng)) return res.status(400).json({ success: false, message: "Invalid coordinates" });

            const radiusInMeters = (radius ? parseFloat(radius) : 10) * 1000;
            query.location = { $near: { $geometry: { type: "Point", coordinates: [parsedLng, parsedLat] }, $maxDistance: radiusInMeters } };
        }

        const circles = await Circle.find(query).populate("members", "name").populate("admins", "name");
        res.status(200).json({ success: true, circles });
    } catch (error) {
        console.error("Error fetching circles:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/* GET CIRCLE DETAILS */
export const getCircleDetails = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid circle ID" });

        const circle = await Circle.findById(id)
            .populate("members", "name _id")
            .populate("admins", "name _id")
            .populate("createdBy", "name _id");

        if (!circle) return res.status(404).json({ success: false, message: "Circle not found" });

        res.status(200).json({ success: true, circle });
    } catch (error) {
        console.error("Error fetching circle details:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/* DELETE CIRCLE */
export const deleteCircle = async (req, res) => {
    try {
        const { id: circleId } = req.params;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
        if (!mongoose.Types.ObjectId.isValid(circleId)) return res.status(400).json({ success: false, message: "Invalid circle ID" });

        const circle = await Circle.findById(circleId);
        if (!circle) return res.status(404).json({ success: false, message: "Circle not found" });
        if (!circle.admins.includes(userId)) return res.status(403).json({ success: false, message: "Not authorized" });

        await User.updateMany({ circles: circleId }, { $pull: { circles: circleId } });
        await CirclePost.deleteMany({ circleId });
        await JoinRequest.deleteMany({ circleId });
        await Circle.findByIdAndDelete(circleId);

        res.status(200).json({ success: true, message: "Circle deleted successfully" });
    } catch (error) {
        console.error("Error deleting circle:", error);
        res.status(500).json({ success: false, message: "Failed to delete circle" });
    }
};

/* EXIT CIRCLE */
export const exitCircle = async (req, res) => {
    try {
        const { id: circleId } = req.params;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
        if (!mongoose.Types.ObjectId.isValid(circleId)) return res.status(400).json({ success: false, message: "Invalid circle ID" });

        const circle = await Circle.findById(circleId);
        if (!circle) return res.status(404).json({ success: false, message: "Circle not found" });
        if (!circle.members.includes(userId)) return res.status(400).json({ success: false, message: "You are not a member" });

        if (circle.admins.includes(userId) && circle.admins.length === 1) {
            return res.status(400).json({ success: false, message: "As the only admin, exit not allowed" });
        }

        circle.members.pull(userId);
        if (circle.admins.includes(userId)) circle.admins.pull(userId);
        await circle.save();

        await User.findByIdAndUpdate(userId, { $pull: { circles: circleId } });

        res.status(200).json({ success: true, message: "You have exited the circle." });
    } catch (error) {
        console.error("Error exiting circle:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/* =========================
   JOIN CIRCLE & REQUESTS
========================= */

/* JOIN CIRCLE */
export const joinCircle = async (req, res) => {
    try {
        const { id: circleId } = req.params;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
        if (!mongoose.Types.ObjectId.isValid(circleId)) return res.status(400).json({ success: false, message: "Invalid circle ID" });

        const circle = await Circle.findById(circleId);
        if (!circle) return res.status(404).json({ success: false, message: "Circle not found" });
        if (circle.members.includes(userId)) return res.status(400).json({ success: false, message: "Already a member" });

        if (circle.visibility === "public") {
            circle.members.push(userId);
            await circle.save();
            await User.findByIdAndUpdate(userId, { $addToSet: { circles: circleId } });
            return res.status(200).json({ success: true, message: "Successfully joined" });
        }

        const existingRequest = await JoinRequest.findOne({ circleId, userId });
        if (existingRequest) return res.status(400).json({ success: false, message: "Request already sent" });

        await JoinRequest.create({ circleId, userId });
        res.status(200).json({ success: true, message: "Join request sent" });
    } catch (error) {
        console.error("Error joining circle:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/* GET PENDING REQUESTS */
export const getPendingRequests = async (req, res) => {
    try {
        const { id: circleId } = req.params;
        const adminId = req.user?.id;

        if (!adminId) return res.status(401).json({ success: false, message: "Unauthorized" });
        if (!mongoose.Types.ObjectId.isValid(circleId)) return res.status(400).json({ success: false, message: "Invalid circle ID" });

        const circle = await Circle.findById(circleId);
        if (!circle.admins.includes(adminId)) return res.status(403).json({ success: false, message: "Only admins can view requests" });

        const requests = await JoinRequest.find({ circleId, status: "pending" }).populate("userId", "name email");
        res.status(200).json({ success: true, requests });
    } catch (error) {
        console.error("Error fetching requests:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/* APPROVE JOIN REQUEST */
export const approveJoinRequest = async (req, res) => {
    try {
        const { id: requestId } = req.params;
        const adminId = req.user?.id;
        if (!adminId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const request = await JoinRequest.findById(requestId);
        if (!request) return res.status(404).json({ success: false, message: "Request not found" });

        const circle = await Circle.findById(request.circleId);
        if (!circle.admins.includes(adminId)) return res.status(403).json({ success: false, message: "Only admins can approve" });

        request.status = "accepted";
        await request.save();

        if (!circle.members.includes(request.userId)) circle.members.push(request.userId);
        await circle.save();
        await User.findByIdAndUpdate(request.userId, { $addToSet: { circles: circle._id } });

        res.status(200).json({ success: true, message: "User added to circle" });
    } catch (error) {
        console.error("Error approving request:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/* REJECT JOIN REQUEST */
export const rejectJoinRequest = async (req, res) => {
    try {
        const { id: requestId } = req.params;
        const adminId = req.user?.id;
        if (!adminId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const request = await JoinRequest.findById(requestId);
        if (!request) return res.status(404).json({ success: false, message: "Request not found" });

        const circle = await Circle.findById(request.circleId);
        if (!circle.admins.includes(adminId)) return res.status(403).json({ success: false, message: "Only admins can reject" });

        request.status = "rejected";
        await request.save();

        res.status(200).json({ success: true, message: "Request rejected" });
    } catch (error) {
        console.error("Error rejecting request:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/* =========================
   POSTS & COMMENTS
========================= */

/* CREATE POST */
export const createPost = async (req, res) => {
    try {
        const { id: circleId } = req.params;
        const { content, imageUrl } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
        if (!mongoose.Types.ObjectId.isValid(circleId)) return res.status(400).json({ success: false, message: "Invalid circle ID" });

        const circle = await Circle.findById(circleId);
        if (!circle.members.includes(userId)) return res.status(403).json({ success: false, message: "Only members can post" });

        const post = new CirclePost({ circleId, userId, content, imageUrl });
        await post.save();
        await post.populate("userId", "name");

        res.status(201).json({ success: true, message: "Post created", post });
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/* GET POSTS */
export const getCirclePosts = async (req, res) => {
    try {
        const { id: circleId } = req.params;
        const userId = req.user?.id;
        if (!mongoose.Types.ObjectId.isValid(circleId)) return res.status(400).json({ success: false, message: "Invalid circle ID" });

        const circle = await Circle.findById(circleId);
        if (!circle) return res.status(404).json({ success: false, message: "Circle not found" });
        if (circle.visibility === "private" && !circle.members.includes(userId)) return res.status(403).json({ success: false, message: "Private circle posts restricted" });

        const posts = await CirclePost.find({ circleId }).populate("userId", "name -_id").populate("comments.userId", "name").sort({ createdAt: -1 });
        res.status(200).json({ success: true, posts });
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/* LIKE / UNLIKE POST */
export const toggleLikePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user?.id;
        if (!mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ success: false, message: "Invalid post ID" });

        const post = await CirclePost.findById(postId);
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        const index = post.likes.indexOf(userId);
        if (index > -1) post.likes.splice(index, 1);
        else post.likes.push(userId);

        await post.save();
        res.status(200).json({ success: true, likes: post.likes.length });
    } catch (error) {
        console.error("Error toggling like:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/* COMMENT POST */
export const commentPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;
        const userId = req.user?.id;

        if (!mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ success: false, message: "Invalid post ID" });
        if (!content) return res.status(400).json({ success: false, message: "Comment content required" });

        const post = await CirclePost.findById(postId);
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        post.comments.push({ userId, content });
        await post.save();
        await post.populate("comments.userId", "name");

        res.status(200).json({ success: true, comments: post.comments });
    } catch (error) {
        console.error("Error commenting:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};