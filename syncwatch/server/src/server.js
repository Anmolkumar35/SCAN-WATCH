const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Uploads directory ensure karna
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use("/uploads", express.static(uploadDir));

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Video Upload API
app.post("/api/upload", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }
  const videoUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({ success: true, videoUrl });
});

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Rooms user tracking
const rooms = {};

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  // 1. Join Room
  socket.on("join-room", ({ roomId, username }) => {
    if (!roomId || !username) return;

    socket.join(roomId);
    socket.roomId = roomId;
    socket.username = username;

    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }
    if (!rooms[roomId].includes(username)) {
      rooms[roomId].push(username);
    }

    console.log(`[JOIN] ${username} joined room: ${roomId}`);
    io.to(roomId).emit("update-users", rooms[roomId]);
  });

  // 2. Video Synchronization
  socket.on("sync-video", (data) => {
    socket.to(data.roomId).emit("sync-video", data);
  });

  // 3. Room Chat
  socket.on("send-message", ({ roomId, username, message }) => {
    const msgData = {
      id: Date.now() + Math.random(),
      sender: username,
      text: message,
    };
    io.to(roomId).emit("receive-message", msgData);
  });

  // 4. Disconnect Handler
  socket.on("disconnect", () => {
    const { roomId, username } = socket;
    if (roomId && rooms[roomId]) {
      rooms[roomId] = rooms[roomId].filter((u) => u !== username);
      io.to(roomId).emit("update-users", rooms[roomId]);
      console.log(`[LEAVE] ${username} left room: ${roomId}`);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`SyncWatch Server running on port ${PORT}`);
});