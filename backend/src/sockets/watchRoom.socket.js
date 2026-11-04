import mongoose from "mongoose";
import WatchSession from "../models/WatchSession.js";

// Multi-tab tracking: Map<sessionId, Map<userId, Set<socketId>>>
const sessionUserSockets = new Map();

// In-memory playback state cache: Map<sessionId, { isPlaying, currentTime, duration, lastUpdated, updatedBy, saveTimeout }>
const sessionPlaybackStates = new Map();

const getOrInitPlaybackState = async (sessionId) => {
  if (sessionPlaybackStates.has(sessionId)) {
    return sessionPlaybackStates.get(sessionId);
  }

  const session = await WatchSession.findById(sessionId).populate("movie");
  if (!session) return null;

  const state = {
    isPlaying: session.playbackState?.isPlaying || false,
    currentTime: session.playbackState?.currentTime || 0,
    duration: session.movie?.duration || 0,
    lastUpdated: session.playbackState?.lastUpdated ? new Date(session.playbackState.lastUpdated).getTime() : Date.now(),
    updatedBy: null,
    saveTimeout: null,
  };

  sessionPlaybackStates.set(sessionId, state);
  return state;
};

const debounceSavePlaybackState = (sessionId, state) => {
  if (state.saveTimeout) {
    clearTimeout(state.saveTimeout);
  }
  state.saveTimeout = setTimeout(async () => {
    try {
      await WatchSession.findByIdAndUpdate(sessionId, {
        "playbackState.isPlaying": state.isPlaying,
        "playbackState.currentTime": state.currentTime,
        "playbackState.lastUpdated": new Date(state.lastUpdated),
      });
    } catch (err) {
      console.error(`Failed to persist playback state for session ${sessionId}:`, err.message);
    }
  }, 1000);
};

export const registerWatchRoomHandlers = (io, socket) => {
  const user = socket.user;

  // 1. Join Watch Room Event
  socket.on("watch:join", async (data, callback = () => {}) => {
    try {
      const sessionId = typeof data === "string" ? data : data?.sessionId;

      if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
        return callback({ success: false, message: "Invalid session ID format." });
      }

      const session = await WatchSession.findById(sessionId).populate("movie");
      if (!session) {
        return callback({ success: false, message: "Watch session not found." });
      }

      if (session.status !== "active") {
        return callback({ success: false, message: "Cannot join an ended session." });
      }

      const isHost = session.host.toString() === user._id;
      const isParticipant = session.participants.some((p) => p.toString() === user._id);
      const isAcceptedInvitee = session.invitations.some(
        (inv) => inv.user.toString() === user._id && inv.status === "accepted"
      );

      if (!isHost && !isParticipant && !isAcceptedInvitee) {
        return callback({ success: false, message: "Unauthorized. You are not a member of this session." });
      }

      const roomName = `session:${sessionId}`;
      socket.join(roomName);
      socket.currentSessionId = sessionId;

      if (!sessionUserSockets.has(sessionId)) {
        sessionUserSockets.set(sessionId, new Map());
      }
      const userSocketsMap = sessionUserSockets.get(sessionId);
      const isFirstTab = !userSocketsMap.has(user._id) || userSocketsMap.get(user._id).size === 0;

      if (!userSocketsMap.has(user._id)) {
        userSocketsMap.set(user._id, new Set());
      }
      userSocketsMap.get(user._id).add(socket.id);

      if (isFirstTab) {
        socket.to(roomName).emit("participant:joined", {
          user: {
            _id: user._id,
            username: user.username,
            fullName: user.fullName,
            avatarUrl: user.avatarUrl,
          },
          sessionId,
          timestamp: new Date().toISOString(),
        });

        socket.to(roomName).emit("participant:online", {
          userId: user._id,
          sessionId,
        });
      }

      // Calculate synchronized current time
      const state = await getOrInitPlaybackState(sessionId);
      let calculatedTime = state.currentTime;
      if (state.isPlaying) {
        const elapsedSecs = (Date.now() - state.lastUpdated) / 1000;
        calculatedTime = Math.max(0, state.currentTime + elapsedSecs);
        if (state.duration > 0 && calculatedTime > state.duration) {
          calculatedTime = state.duration;
        }
      }

      const onlineUserIds = Array.from(userSocketsMap.keys()).filter(
        (uid) => userSocketsMap.get(uid).size > 0
      );

      return callback({
        success: true,
        message: "Successfully joined watch room.",
        data: {
          sessionId,
          onlineParticipants: onlineUserIds,
          playbackState: {
            isPlaying: state.isPlaying,
            currentTime: calculatedTime,
            duration: state.duration,
            updatedAt: state.lastUpdated,
            updatedBy: state.updatedBy,
          },
        },
      });
    } catch (error) {
      return callback({ success: false, message: error.message || "Failed to join room." });
    }
  });

  // 2. Playback: Play
  socket.on("playback:play", async (data, callback = () => {}) => {
    try {
      const sessionId = socket.currentSessionId || data?.sessionId;
      if (!sessionId) return callback({ success: false, message: "Not in an active session." });

      const state = await getOrInitPlaybackState(sessionId);
      if (!state) return callback({ success: false, message: "Playback state unavailable." });

      const clientTime = typeof data?.currentTime === "number" ? Math.max(0, data.currentTime) : state.currentTime;

      state.isPlaying = true;
      state.currentTime = clientTime;
      state.lastUpdated = Date.now();
      state.updatedBy = user._id;

      debounceSavePlaybackState(sessionId, state);

      const payload = {
        sessionId,
        isPlaying: true,
        currentTime: state.currentTime,
        updatedAt: state.lastUpdated,
        updatedBy: {
          _id: user._id,
          username: user.username,
        },
      };

      // Broadcast to all other participants in the room
      socket.to(`session:${sessionId}`).emit("playback:play", payload);

      return callback({ success: true, data: payload });
    } catch (err) {
      return callback({ success: false, message: err.message });
    }
  });

  // 3. Playback: Pause
  socket.on("playback:pause", async (data, callback = () => {}) => {
    try {
      const sessionId = socket.currentSessionId || data?.sessionId;
      if (!sessionId) return callback({ success: false, message: "Not in an active session." });

      const state = await getOrInitPlaybackState(sessionId);
      if (!state) return callback({ success: false, message: "Playback state unavailable." });

      const clientTime = typeof data?.currentTime === "number" ? Math.max(0, data.currentTime) : state.currentTime;

      state.isPlaying = false;
      state.currentTime = clientTime;
      state.lastUpdated = Date.now();
      state.updatedBy = user._id;

      debounceSavePlaybackState(sessionId, state);

      const payload = {
        sessionId,
        isPlaying: false,
        currentTime: state.currentTime,
        updatedAt: state.lastUpdated,
        updatedBy: {
          _id: user._id,
          username: user.username,
        },
      };

      socket.to(`session:${sessionId}`).emit("playback:pause", payload);

      return callback({ success: true, data: payload });
    } catch (err) {
      return callback({ success: false, message: err.message });
    }
  });

  // 4. Playback: Seek
  socket.on("playback:seek", async (data, callback = () => {}) => {
    try {
      const sessionId = socket.currentSessionId || data?.sessionId;
      if (!sessionId) return callback({ success: false, message: "Not in an active session." });

      const targetTime = Number(data?.currentTime);
      if (isNaN(targetTime) || targetTime < 0) {
        return callback({ success: false, message: "Invalid seek timestamp." });
      }

      const state = await getOrInitPlaybackState(sessionId);
      if (!state) return callback({ success: false, message: "Playback state unavailable." });

      const boundedTime = state.duration > 0 ? Math.min(targetTime, state.duration) : targetTime;

      state.currentTime = boundedTime;
      state.lastUpdated = Date.now();
      state.updatedBy = user._id;

      debounceSavePlaybackState(sessionId, state);

      const payload = {
        sessionId,
        isPlaying: state.isPlaying,
        currentTime: boundedTime,
        updatedAt: state.lastUpdated,
        updatedBy: {
          _id: user._id,
          username: user.username,
        },
      };

      socket.to(`session:${sessionId}`).emit("playback:seek", payload);

      return callback({ success: true, data: payload });
    } catch (err) {
      return callback({ success: false, message: err.message });
    }
  });

  // 5. Playback: Get State / Resync
  socket.on("playback:get_state", async (data, callback = () => {}) => {
    try {
      const sessionId = socket.currentSessionId || data?.sessionId;
      if (!sessionId) return callback({ success: false, message: "Session ID required." });

      const state = await getOrInitPlaybackState(sessionId);
      if (!state) return callback({ success: false, message: "Playback state not found." });

      let calculatedTime = state.currentTime;
      if (state.isPlaying) {
        const elapsedSecs = (Date.now() - state.lastUpdated) / 1000;
        calculatedTime = Math.max(0, state.currentTime + elapsedSecs);
        if (state.duration > 0 && calculatedTime > state.duration) {
          calculatedTime = state.duration;
        }
      }

      return callback({
        success: true,
        data: {
          sessionId,
          isPlaying: state.isPlaying,
          currentTime: calculatedTime,
          duration: state.duration,
          updatedAt: state.lastUpdated,
          updatedBy: state.updatedBy,
        },
      });
    } catch (err) {
      return callback({ success: false, message: err.message });
    }
  });

  // 6. Leave Watch Room Event
  socket.on("watch:leave", async (data, callback = () => {}) => {
    try {
      const sessionId = typeof data === "string" ? data : data?.sessionId || socket.currentSessionId;
      if (!sessionId) return callback({ success: false, message: "Session ID required" });

      const roomName = `session:${sessionId}`;
      socket.leave(roomName);

      if (sessionUserSockets.has(sessionId)) {
        const userSocketsMap = sessionUserSockets.get(sessionId);
        if (userSocketsMap.has(user._id)) {
          userSocketsMap.get(user._id).delete(socket.id);

          if (userSocketsMap.get(user._id).size === 0) {
            userSocketsMap.delete(user._id);

            socket.to(roomName).emit("participant:left", {
              userId: user._id,
              sessionId,
              timestamp: new Date().toISOString(),
            });

            socket.to(roomName).emit("participant:offline", {
              userId: user._id,
              sessionId,
            });
          }
        }
      }

      socket.currentSessionId = null;
      return callback({ success: true, message: "Left watch room." });
    } catch (error) {
      return callback({ success: false, message: error.message });
    }
  });

  // 7. Disconnect Handling
  socket.on("disconnect", () => {
    const sessionId = socket.currentSessionId;
    if (sessionId && sessionUserSockets.has(sessionId)) {
      const userSocketsMap = sessionUserSockets.get(sessionId);
      if (userSocketsMap.has(user._id)) {
        userSocketsMap.get(user._id).delete(socket.id);

        if (userSocketsMap.get(user._id).size === 0) {
          userSocketsMap.delete(user._id);
          const roomName = `session:${sessionId}`;

          socket.to(roomName).emit("participant:left", {
            userId: user._id,
            sessionId,
            timestamp: new Date().toISOString(),
          });

          socket.to(roomName).emit("participant:offline", {
            userId: user._id,
            sessionId,
          });
        }
      }
    }
  });
};