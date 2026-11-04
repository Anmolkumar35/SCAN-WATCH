import express from "express";
import {
  openConversation,
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
} from "../controllers/chat.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/conversations", protect, openConversation);
router.get("/conversations", protect, getConversations);
router.get("/conversations/:conversationId/messages", protect, getMessages);
router.post("/conversations/:conversationId/messages", protect, sendMessage);
router.patch("/conversations/:conversationId/read", protect, markAsRead);

export default router;

