import express from "express";
import {
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  removeFriend,
} from "../controllers/friend.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/request", protect, sendFriendRequest);
router.get("/requests", protect, getFriendRequests);
router.patch("/requests/:requestId/accept", protect, acceptFriendRequest);
router.patch("/requests/:requestId/reject", protect, rejectFriendRequest);
router.get("/", protect, getFriends);
router.delete("/:friendId", protect, removeFriend);

export default router;

