import { Server } from "socket.io";
import { socketAuthMiddleware } from "./socket.auth.js";
import { registerWatchRoomHandlers } from "./watchRoom.socket.js";

let ioInstance = null;

export const initSocketServer = (httpServer) => {
  const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];

  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ""));
  }

  ioInstance = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
          callback(null, true);
        } else {
          callback(new Error("Socket CORS rejected origin: " + origin));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Socket authentication middleware
  ioInstance.use(socketAuthMiddleware);

  ioInstance.on("connection", (socket) => {
    registerWatchRoomHandlers(ioInstance, socket);
  });

  return ioInstance;
};

export const getIO = () => {
  return ioInstance;
};