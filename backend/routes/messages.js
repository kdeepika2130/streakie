import express from "express";
import Message from "../models/message.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Get messages
router.get("/:circleId", authMiddleware, async (req, res) => {
  const { circleId } = req.params;
  const msgs = await Message.find({ circleId }).populate("senderId", "name");
  res.json(msgs);
});

// Send message
router.post("/:circleId", authMiddleware, async (req, res) => {
  const { circleId } = req.params;
  const { text, image } = req.body;

  const msg = new Message({
    circleId,
    senderId: req.user.id,
    text,
    image,
  });
  await msg.save();
  res.json(msg);
});

// Delete message
router.delete("/:id", authMiddleware, async (req, res) => {
  const msg = await Message.findById(req.params.id);
  if (!msg) return res.status(404).json({ message: "Message not found" });

  if (String(msg.senderId) !== req.user.id) {
    return res.status(403).json({ message: "Not authorized" });
  }

  await msg.deleteOne();
  res.json({ message: "Deleted" });
});

export default router;
