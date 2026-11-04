import mongoose from "mongoose";
import WatchSession from "../models/WatchSession.js";
import Movie from "../models/Movie.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { getIO } from "../sockets/index.js";

const getBaseUrl = (req) => `${req.protocol}://${req.get("host")}`;

export const createWatchSession = async (req, res) => {
  try {
    const { movieId, friendIds } = req.body;

    if (!movieId || !mongoose.Types.ObjectId.isValid(movieId)) {
      return res.status(400).json({
        success: false,
        message: "Valid movieId is required to create a session.",
      });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found.",
      });
    }

    if (movie.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. You can only start sessions using your own movies.",
      });
    }

    const hostUser = await User.findById(req.user._id);
    const hostFriends = (hostUser.friends || []).map((id) => id.toString());

    const invitations = [];
    const validInvitedUserIds = [];

    if (Array.isArray(friendIds) && friendIds.length > 0) {
      for (const rawId of friendIds) {
        if (!mongoose.Types.ObjectId.isValid(rawId)) continue;
        const friendId = rawId.toString();

        if (friendId === req.user._id.toString()) continue;
        if (!hostFriends.includes(friendId)) continue;
        if (validInvitedUserIds.includes(friendId)) continue;

        validInvitedUserIds.push(friendId);
        invitations.push({
          user: friendId,
          status: "pending",
        });
      }
    }

    const session = await WatchSession.create({
      movie: movie._id,
      host: req.user._id,
      participants: [req.user._id],
      invitations,
      status: "active",
    });

    if (validInvitedUserIds.length > 0) {
      const notifs = validInvitedUserIds.map((friendId) => ({
        recipient: friendId,
        sender: req.user._id,
        type: "watch_invitation",
        metadata: {
          sessionId: session._id,
          movieId: movie._id,
          movieTitle: movie.title,
        },
      }));
      await Notification.insertMany(notifs);
    }

    const populatedSession = await WatchSession.findById(session._id)
      .populate("movie")
      .populate("host", "username fullName avatarUrl")
      .populate("participants", "username fullName avatarUrl")
      .populate("invitations.user", "username fullName avatarUrl");

    return res.status(201).json({
      success: true,
      message: "Watch Together session created successfully.",
      data: { session: populatedSession.toSafeObject(getBaseUrl(req)) },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create watch session.",
    });
  }
};

export const inviteFriendsToSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { friendIds } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid session ID is required.",
      });
    }

    if (!Array.isArray(friendIds) || friendIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "friendIds array is required.",
      });
    }

    const session = await WatchSession.findById(id).populate("movie");
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Watch session not found.",
      });
    }

    if (session.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Cannot invite friends to an inactive or ended session.",
      });
    }

    if (session.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the session host can invite friends.",
      });
    }

    const hostUser = await User.findById(req.user._id);
    const hostFriends = (hostUser.friends || []).map((fid) => fid.toString());
    const existingParticipants = session.participants.map((pid) => pid.toString());
    const existingInvited = session.invitations.map((inv) => inv.user.toString());

    const newlyInvited = [];

    for (const rawId of friendIds) {
      if (!mongoose.Types.ObjectId.isValid(rawId)) continue;
      const targetId = rawId.toString();

      if (targetId === req.user._id.toString()) continue;
      if (!hostFriends.includes(targetId)) continue;
      if (existingParticipants.includes(targetId)) continue;
      if (existingInvited.includes(targetId)) continue;

      session.invitations.push({
        user: targetId,
        status: "pending",
      });
      newlyInvited.push(targetId);
      existingInvited.push(targetId);
    }

    if (newlyInvited.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No new valid friends to invite (users may already be invited, participating, or not in friends list).",
      });
    }

    await session.save();

    const notifs = newlyInvited.map((friendId) => ({
      recipient: friendId,
      sender: req.user._id,
      type: "watch_invitation",
      metadata: {
        sessionId: session._id,
        movieId: session.movie._id,
        movieTitle: session.movie.title,
      },
    }));
    await Notification.insertMany(notifs);

    const updatedSession = await WatchSession.findById(id)
      .populate("movie")
      .populate("host", "username fullName avatarUrl")
      .populate("participants", "username fullName avatarUrl")
      .populate("invitations.user", "username fullName avatarUrl");

    return res.status(200).json({
      success: true,
      message: `Successfully invited ${newlyInvited.length} friend(s).`,
      data: { session: updatedSession.toSafeObject(getBaseUrl(req)) },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to invite friends.",
    });
  }
};

export const getWatchSessionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid session ID is required.",
      });
    }

    const session = await WatchSession.findById(id)
      .populate("movie")
      .populate("host", "username fullName avatarUrl")
      .populate("participants", "username fullName avatarUrl")
      .populate("invitations.user", "username fullName avatarUrl");

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Watch session not found.",
      });
    }

    const userId = req.user._id.toString();
    const isHost = session.host._id.toString() === userId;
    const isParticipant = session.participants.some(
      (p) => p._id.toString() === userId
    );
    const isInvited = session.invitations.some(
      (inv) => inv.user._id.toString() === userId
    );

    if (!isHost && !isParticipant && !isInvited) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. You are not a member or invitee of this session.",
      });
    }

    return res.status(200).json({
      success: true,
      data: { session: session.toSafeObject(getBaseUrl(req)) },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch session details.",
    });
  }
};

export const acceptInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid session ID is required.",
      });
    }

    const session = await WatchSession.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Watch session not found.",
      });
    }

    if (session.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Cannot join an ended or inactive session.",
      });
    }

    const userId = req.user._id.toString();
    const invitation = session.invitations.find(
      (inv) => inv.user.toString() === userId
    );

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "No invitation found for this session.",
      });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Invitation has already been ${invitation.status}.`,
      });
    }

    invitation.status = "accepted";
    invitation.respondedAt = new Date();

    const alreadyParticipant = session.participants.some(
      (p) => p.toString() === userId
    );
    if (!alreadyParticipant) {
      session.participants.push(req.user._id);
    }

    await session.save();

    const updatedSession = await WatchSession.findById(id)
      .populate("movie")
      .populate("host", "username fullName avatarUrl")
      .populate("participants", "username fullName avatarUrl")
      .populate("invitations.user", "username fullName avatarUrl");

    return res.status(200).json({
      success: true,
      message: "Invitation accepted. You joined the watch session.",
      data: { session: updatedSession.toSafeObject(getBaseUrl(req)) },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to accept invitation.",
    });
  }
};

export const declineInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid session ID is required.",
      });
    }

    const session = await WatchSession.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Watch session not found.",
      });
    }

    const userId = req.user._id.toString();
    const invitation = session.invitations.find(
      (inv) => inv.user.toString() === userId
    );

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "No invitation found for this session.",
      });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Invitation has already been ${invitation.status}.`,
      });
    }

    invitation.status = "declined";
    invitation.respondedAt = new Date();

    await session.save();

    return res.status(200).json({
      success: true,
      message: "Watch invitation declined.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to decline invitation.",
    });
  }
};

export const leaveWatchSession = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid session ID is required.",
      });
    }

    const session = await WatchSession.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Watch session not found.",
      });
    }

    const userId = req.user._id.toString();
    const isParticipant = session.participants.some(
      (p) => p.toString() === userId
    );

    if (!isParticipant) {
      return res.status(400).json({
        success: false,
        message: "You are not an active participant in this session.",
      });
    }

    // Agar host leave karta hai toh session end hoga
    if (session.host.toString() === userId) {
      session.status = "ended";
      session.endedAt = new Date();
      session.participants = session.participants.filter(
        (p) => p.toString() !== userId
      );
      await session.save();

      // Real-time broadcast session:ended
      const io = getIO();
      if (io) {
        io.to(`session:${id}`).emit("session:ended", {
          sessionId: id,
          reason: "Host has left the session.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Host left the session. Watch session has ended.",
      });
    }

    // Normal participant leaving
    session.participants = session.participants.filter(
      (p) => p.toString() !== userId
    );
    await session.save();

    return res.status(200).json({
      success: true,
      message: "You have left the watch session.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to leave watch session.",
    });
  }
};

export const endWatchSession = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid session ID is required.",
      });
    }

    const session = await WatchSession.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Watch session not found.",
      });
    }

    if (session.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. Only the session host can end the session.",
      });
    }

    if (session.status === "ended") {
      return res.status(400).json({
        success: false,
        message: "Session is already ended.",
      });
    }

    session.status = "ended";
    session.endedAt = new Date();
    await session.save();

    // Real-time broadcast session:ended to all connected sockets in that room
    const io = getIO();
    if (io) {
      io.to(`session:${id}`).emit("session:ended", {
        sessionId: id,
        reason: "Session ended by host.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Watch session ended successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to end watch session.",
    });
  }
};