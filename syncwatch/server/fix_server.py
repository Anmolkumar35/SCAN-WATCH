server_code = r'''const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 },
});

app.post('/api/upload', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No video' });
  const fileUrl = 'http://' + req.hostname + ':5000/uploads/' + req.file.filename;
  res.json({ success: true, videoUrl: fileUrl });
});

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Room users mapping: { roomId: { socketId: username } }
const roomUsers = {};

io.on('connection', (socket) => {
  let currentRoom = null;
  let currentUser = null;

  socket.on('join-room', ({ roomId, username }) => {
    currentRoom = roomId;
    currentUser = username || 'Guest';
    socket.join(roomId);

    if (!roomUsers[roomId]) {
      roomUsers[roomId] = {};
    }
    roomUsers[roomId][socket.id] = currentUser;

    // Send updated user list to everyone in room
    io.to(roomId).emit('update-users', Object.values(roomUsers[roomId]));
    console.log(`[JOIN] \({currentUser} joined room:\){roomId}`);
  });

  socket.on('sync-video', (data) => {
    socket.to(data.roomId).emit('sync-video', data);
  });

  socket.on('send-message', ({ roomId, message, username }) => {
    const chatData = {
      id: Date.now() + Math.random().toString(),
      sender: username,
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    io.to(roomId).emit('receive-message', chatData);
  });

  socket.on('disconnect', () => {
    if (currentRoom && roomUsers[currentRoom]) {
      delete roomUsers[currentRoom][socket.id];
      io.to(currentRoom).emit('update-users', Object.values(roomUsers[currentRoom]));
      if (Object.keys(roomUsers[currentRoom]).length === 0) {
        delete roomUsers[currentRoom];
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('SyncWatch Server running on port ' + PORT);
});
'''

with open('src/server.js', 'w', encoding='utf-8') as f:
    f.write(server_code)

print("SERVER_CHAT_UPDATED")