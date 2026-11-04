import express from "express";
import {
  createWatchSession,
  inviteFriendsToSession,
  getWatchSessionById,
  acceptInvitation,
  declineInvitation,
  leaveWatchSession,
  endWatchSession,
} from "../controllers/watchSession.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createWatchSession);
router.get("/:id", protect, getWatchSessionById);
router.post("/:id/invite", protect, inviteFriendsToSession);
router.patch("/:id/invitations/accept", protect, acceptInvitation);
router.patch("/:id/invitations/decline", protect, declineInvitation);
router.post("/:id/leave", protect, leaveWatchSession);
router.post("/:id/end", protect, endWatchSession);

export default router;