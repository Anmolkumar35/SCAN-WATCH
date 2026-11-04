import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

// POST /api/chat/conversations (Open or create 1-to-1 conversation with a friend)
export const openConversation = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { friendId } = req.body;

    if (!friendId || !mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).json({
        success: false,
        message: "A valid friendId is required.",
      });
    }

    if (currentUserId.toString() === friendId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot start a conversation with yourself.",
      });
    }

    // Verify friend exists
    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Verify friendship
    const currentUser = await User.findById(currentUserId);
    const areFriends =
      currentUser.friends &&
      currentUser.friends.some((id) => id.toString() === friendId.toString());

    if (!areFriends) {
      return res.status(403).json({
        success: false,
        message: "You can only chat with users who are on your friends list.",
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, friendId], $size: 2 },
    }).populate("participants", "fullName username avatar");

    if (conversation) {
      return res.status(200).json({
        success: true,
        message: "Existing conversation retrieved.",
        data: { conversation },
      });
    }

    // Create new conversation
    conversation = await Conversation.create({
      participants: [currentUserId, friendId],
      lastMessage: "",
      lastMessageAt: new Date(),
    });

    conversation = await conversation.populate(
      "participants",
      "fullName username avatar"
    );

    return res.status(201).json({
      success: true,
      message: "Conversation created successfully.",
      data: { conversation },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while opening the conversation.",
    });
  }
};

// GET /api/chat/conversations (List user conversations with unread count and safe participant details)
export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const conversations = await Conversation.find({
      participants: currentUserId,
    })
      .populate("participants", "fullName username avatar")
      .sort({ lastMessageAt: -1 });

    const formattedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipant = conv.participants.find(
          (p) => p._id.toString() !== currentUserId.toString()
        );

        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          receiver: currentUserId,
          read: false,
        });

        return {
          _id: conv._id,
          participant: otherParticipant,
          lastMessage: conv.lastMessage,
          lastMessageAt: conv.lastMessageAt,
          unreadCount,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: formattedConversations.length,
      data: { conversations: formattedConversations },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching conversations.",
    });
  }
};

// GET /api/chat/conversations/:conversationId/messages
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Valid conversationId is required.",
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    // Guard: Only conversation participants can read messages
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === currentUserId.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. You are not a participant in this conversation.",
      });
    }

    const totalMessages = await Message.countDocuments({
      conversation: conversationId,
    });

    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "fullName username avatar")
      .populate("receiver", "fullName username avatar");

    return res.status(200).json({
      success: true,
      totalMessages,
      currentPage: page,
      totalPages: Math.ceil(totalMessages / limit),
      data: { messages },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving messages.",
    });
  }
};

// POST /api/chat/conversations/:conversationId/messages
export const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;
    const senderId = req.user._id;

    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Valid conversationId is required.",
      });
    }

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message text cannot be empty.",
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === senderId.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. You cannot send messages to this conversation.",
      });
    }

    const receiverId = conversation.participants.find(
      (p) => p.toString() !== senderId.toString()
    );

    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      receiver: receiverId,
      text: text.trim(),
      read: false,
    });

    conversation.lastMessage = text.trim();
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populatedMessage = await message.populate([
      { path: "sender", select: "fullName username avatar" },
      { path: "receiver", select: "fullName username avatar" },
    ]);

    return res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: { message: populatedMessage },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while sending the message.",
    });
  }
};

// PATCH /api/chat/conversations/:conversationId/read
export const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user._id;

    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Valid conversationId is required.",
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === currentUserId.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. You are not a participant in this conversation.",
      });
    }

    const updateResult = await Message.updateMany(
      {
        conversation: conversationId,
        receiver: currentUserId,
        read: false,
      },
      {
        $set: { read: true },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Messages marked as read successfully.",
      modifiedCount: updateResult.modifiedCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while marking messages as read.",
    });
  }
};

