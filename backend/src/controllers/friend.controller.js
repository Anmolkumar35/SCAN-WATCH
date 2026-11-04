import mongoose from "mongoose";
import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import Notification from "../models/Notification.js";

export const sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId } = req.body;

    if (!receiverId || !mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({
        success: false,
        message: "A valid receiverId is required.",
      });
    }

    if (senderId.toString() === receiverId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a friend request to yourself.",
      });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "Receiver user not found.",
      });
    }

    const currentUser = await User.findById(senderId);
    if (currentUser.friends && currentUser.friends.includes(receiverId)) {
      return res.status(400).json({
        success: false,
        message: "You are already friends with this user.",
      });
    }

    const existingPending = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId, status: "pending" },
        { sender: receiverId, receiver: senderId, status: "pending" },
      ],
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: "A pending friend request already exists between these users.",
      });
    }

    const previousRequest = await FriendRequest.findOne({
      sender: senderId,
      receiver: receiverId,
      status: "rejected",
    });

    let friendRequest;
    if (previousRequest) {
      previousRequest.status = "pending";
      friendRequest = await previousRequest.save();
    } else {
      friendRequest = await FriendRequest.create({
        sender: senderId,
        receiver: receiverId,
        status: "pending",
      });
    }

    // Trigger Notification for User B (No duplicates)
    const existingNotif = await Notification.findOne({
      recipient: receiverId,
      sender: senderId,
      type: "friend_request",
      relatedId: friendRequest._id,
      read: false,
    });

    if (!existingNotif) {
      await Notification.create({
        recipient: receiverId,
        sender: senderId,
        type: "friend_request",
        message: `${currentUser.fullName || currentUser.username} sent you a friend request.`,
        relatedId: friendRequest._id,
        read: false,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Friend request sent successfully.",
      data: { friendRequest },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while sending the friend request.",
    });
  }
};

export const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const requests = await FriendRequest.find({
      receiver: userId,
      status: "pending",
    })
      .populate("sender", "fullName username avatar")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: { requests },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching friend requests.",
    });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const currentUserId = req.user._id;

    if (!requestId || !mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Valid requestId is required.",
      });
    }

    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found.",
      });
    }

    if (friendRequest.receiver.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. Only the receiver can accept this request.",
      });
    }

    if (friendRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot accept a request that is already ${friendRequest.status}.`,
      });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.receiver },
    });
    await User.findByIdAndUpdate(friendRequest.receiver, {
      $addToSet: { friends: friendRequest.sender },
    });

    // Mark original friend_request notification as read for the receiver
    await Notification.updateMany(
      { recipient: currentUserId, relatedId: friendRequest._id },
      { $set: { read: true } }
    );

    // Trigger Notification for User A (Friend request accepted)
    const currentUser = await User.findById(currentUserId);
    const existingAcceptedNotif = await Notification.findOne({
      recipient: friendRequest.sender,
      sender: currentUserId,
      type: "friend_request_accepted",
      relatedId: friendRequest._id,
    });

    if (!existingAcceptedNotif) {
      await Notification.create({
        recipient: friendRequest.sender,
        sender: currentUserId,
        type: "friend_request_accepted",
        message: `${currentUser.fullName || currentUser.username} accepted your friend request.`,
        relatedId: friendRequest._id,
        read: false,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Friend request accepted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while accepting the friend request.",
    });
  }
};

export const rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const currentUserId = req.user._id;

    if (!requestId || !mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Valid requestId is required.",
      });
    }

    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found.",
      });
    }

    if (friendRequest.receiver.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. Only the receiver can reject this request.",
      });
    }

    if (friendRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot reject a request that is already ${friendRequest.status}.`,
      });
    }

    friendRequest.status = "rejected";
    await friendRequest.save();

    // Mark original notification as read, no acceptance notification sent
    await Notification.updateMany(
      { recipient: currentUserId, relatedId: friendRequest._id },
      { $set: { read: true } }
    );

    return res.status(200).json({
      success: true,
      message: "Friend request rejected successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while rejecting the friend request.",
    });
  }
};

export const getFriends = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const user = await User.findById(currentUserId).populate(
      "friends",
      "fullName username avatar"
    );

    return res.status(200).json({
      success: true,
      count: user.friends ? user.friends.length : 0,
      data: { friends: user.friends || [] },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching friends list.",
    });
  }
};

export const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const currentUserId = req.user._id;

    if (!friendId || !mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).json({
        success: false,
        message: "Valid friendId is required.",
      });
    }

    await User.findByIdAndUpdate(currentUserId, {
      $pull: { friends: friendId },
    });
    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: currentUserId },
    });

    return res.status(200).json({
      success: true,
      message: "Friend removed successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while removing the friend.",
    });
  }
};

