import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
    createCircle,
    getCircles,
    getCircleDetails,
    joinCircle,
    getPendingRequests,
    approveJoinRequest,
    rejectJoinRequest,
    createPost,
    getCirclePosts,
    toggleLikePost,
    commentPost,
    deleteCircle,
    exitCircle,
} from "../controllers/circleController.js";

const router = express.Router();

// Apply auth middleware to all circle routes
router.use(authMiddleware);

// --- Circles ---
router.post("/", createCircle); // Create a circle (no streak requirement)
router.get("/", getCircles); // Get circles (public/nearby)
router.get("/:id", getCircleDetails); // Get specific circle details
router.post("/:id/join", joinCircle); // Request/Join a circle
router.post("/:id/exit", exitCircle); // Exit a circle
router.delete("/:id", deleteCircle); // Delete a circle

// --- Admin Request Management ---
router.get("/:id/requests", getPendingRequests); // Get pending requests for a circle
router.post("/requests/:id/approve", approveJoinRequest); // Approve a request
router.post("/requests/:id/reject", rejectJoinRequest); // Reject a request

// --- Circle Feed (Posts, Likes, Comments) ---
router.post("/:id/post", createPost); // Create a post in a circle
router.get("/:id/posts", getCirclePosts); // Get posts for a circle
router.post("/posts/:postId/like", toggleLikePost); // Like a post
router.post("/posts/:postId/comment", commentPost); // Comment on a post

export default router;