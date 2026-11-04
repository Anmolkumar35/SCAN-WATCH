import dotenv from "dotenv";
dotenv.config();

import http from "http";
import mongoose from "mongoose";
import app from "./app.js";
import connectDB from "./config/database.js";
import { initSocketServer, getIO } from "./sockets/index.js";

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Create HTTP server wrapping Express app
const server = http.createServer(app);

// Initialize Socket.IO attached to HTTP server
initSocketServer(server);

server.listen(PORT, () => {
  console.log(`🎬 Scane Watch Backend running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`⚡ Real-time Socket.IO initialized`);
});

// Graceful Shutdown Handling
const handleShutdown = async (signal) => {
  console.log(`Received ${signal}. Gracefully shutting down...`);
  
  const io = getIO();
  if (io) {
    io.close(() => console.log("Socket.IO connections closed."));
  }

  server.close(async () => {
    console.log("HTTP server closed.");
    try {
      await mongoose.connection.close();
      console.log("MongoDB connection closed.");
      process.exit(0);
    } catch (err) {
      console.error("Error closing MongoDB connection:", err);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error("Forcing shutdown after timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));