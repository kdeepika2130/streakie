import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import JoinRequest from "../models/JoinRequest.js";
import Circle from "../models/Circle.js";

const router = express.Router();

// Get all requests for a circle (creator only)
router.get("/:circleId", authMiddleware, async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.circleId);
    if (!circle) return res.status(404).json({ message: "Circle not found" });
    if (circle.creator.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    const requests = await JoinRequest.find({ circleId: circle._id, status: "pending" }).populate("userId", "name email");
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load requests" });
  }
});

// Update request (accept/reject)
router.put("/:circleId/:requestId", authMiddleware, async (req, res) => {
  const { action } = req.body; // "approved" or "declined"
  try {
    const circle = await Circle.findById(req.params.circleId);
    if (!circle) return res.status(404).json({ message: "Circle not found" });
    if (circle.creator.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    const request = await JoinRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    request.status = action;
    await request.save();

    if (action === "approved") {
      if (!circle.members.includes(request.userId)) {
        circle.members.push(request.userId);
        await circle.save();
      }
    }

    res.json({ message: `Request ${action}`, request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update request" });
  }
});

export default router;
