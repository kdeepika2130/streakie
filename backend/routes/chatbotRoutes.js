// backend/routes/chatbotRoutes.js

import express from "express";
import {
  sendMessage,
  getChatHistory,
  clearChatHistory,
} from "../controllers/chatController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/message", authMiddleware, sendMessage);
router.get("/history", authMiddleware, getChatHistory);
router.delete("/history", authMiddleware, clearChatHistory);

export default router;