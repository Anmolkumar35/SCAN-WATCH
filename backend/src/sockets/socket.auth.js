import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const socketAuthMiddleware = async (socket, next) => {
  try {
    let token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication error: Token not provided"));
    }

    if (token.startsWith("Bearer ")) {
      token = token.slice(7).trim();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      return next(new Error("Authentication error: Invalid token payload"));
    }

    const user = await User.findById(decoded.id).select(
      "_id username fullName avatarUrl"
    );

    if (!user) {
      return next(new Error("Authentication error: User no longer exists"));
    }

    // Attach verified user to socket instance
    socket.user = {
      _id: user._id.toString(),
      username: user.username,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
    };

    next();
  } catch (error) {
    return next(new Error("Authentication error: " + error.message));
  }
};