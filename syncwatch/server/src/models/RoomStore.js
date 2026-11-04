class RoomStore {
  constructor() {
    this.rooms = new Map();
    this.cleanupInterval = 1000 * 60 * 5;
    this.maxParticipants = 2;
    setInterval(() => this.cleanupAbandonedRooms(), this.cleanupInterval);
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return this.rooms.has(code) ? this.generateRoomCode() : code;
  }

  createRoom({ hostId, hostName, contentMetadata = null }) {
    const roomCode = this.generateRoomCode();
    const now = Date.now();
    const room = {
      roomCode,
      createdAt: now,
      lastActiveAt: now,
      status: 'WAITING',
      maxParticipants: this.maxParticipants,
      participants: [{
        userId: hostId,
        userName: hostName || 'Host',
        isHost: true,
        joinedAt: now,
        socketId: null
      }],
      playback: {
        isPlaying: false,
        position: 0,
        lastUpdated: now,
        controllingUser: hostId,
        sequenceNumber: 0
      },
      content: contentMetadata || {
        title: 'Elephant Dream (Test Sync Reel)',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        deepLink: 'https://www.hotstar.com/in'
      },
      messages: []
    };
    this.rooms.set(roomCode, room);
    return room;
  }

  getRoom(roomCode) {
    if (!roomCode) return null;
    return this.rooms.get(roomCode.toUpperCase()) || null;
  }

  joinRoom({ roomCode, userId, userName }) {
    const code = roomCode.toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.status === 'ENDED') return { success: false, error: 'Room has expired' };

    const existingIndex = room.participants.findIndex(p => p.userId === userId);
    if (existingIndex !== -1) {
      room.participants[existingIndex].userName = userName;
      room.lastActiveAt = Date.now();
      return { success: true, room };
    }

    if (room.participants.length >= this.maxParticipants) {
      return { success: false, error: 'This room already has 2 participants.' };
    }

    room.participants.push({
      userId,
      userName: userName || `Viewer_${room.participants.length + 1}`,
      isHost: false,
      joinedAt: Date.now(),
      socketId: null
    });

    if (room.participants.length === this.maxParticipants) {
      room.status = 'ACTIVE';
    }
    room.lastActiveAt = Date.now();
    return { success: true, room };
  }

  updateSocketId(roomCode, userId, socketId) {
    const room = this.getRoom(roomCode);
    if (!room) return;
    const p = room.participants.find(u => u.userId === userId);
    if (p) p.socketId = socketId;
    room.lastActiveAt = Date.now();
  }

  removeParticipant(socketId) {
    for (const [code, room] of this.rooms.entries()) {
      const idx = room.participants.findIndex(p => p.socketId === socketId);
      if (idx !== -1) {
        const removed = room.participants.splice(idx, 1)[0];
        room.lastActiveAt = Date.now();
        room.status = room.participants.length === 0 ? 'ENDED' : 'WAITING';
        return { roomCode: code, participant: removed, room };
      }
    }
    return null;
  }

  getAuthoritativePosition(room) {
    if (!room.playback.isPlaying) return room.playback.position;
    const elapsedSeconds = (Date.now() - room.playback.lastUpdated) / 1000;
    return room.playback.position + elapsedSeconds;
  }

  updatePlaybackState(roomCode, { eventType, position, userId }) {
    const room = this.getRoom(roomCode);
    if (!room) return null;
    const now = Date.now();
    room.playback.sequenceNumber += 1;
    room.playback.controllingUser = userId;
    room.playback.lastUpdated = now;
    room.lastActiveAt = now;

    if (eventType === 'PLAY') {
      room.playback.isPlaying = true;
      room.playback.position = position;
    } else if (eventType === 'PAUSE') {
      room.playback.isPlaying = false;
      room.playback.position = position;
    } else if (eventType === 'SEEK') {
      room.playback.position = position;
    }

    return {
      playback: room.playback,
      serverTimestamp: now,
      sequenceNumber: room.playback.sequenceNumber
    };
  }

  addMessage(roomCode, message) {
    const room = this.getRoom(roomCode);
    if (!room) return null;
    const msg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      ...message,
      timestamp: Date.now()
    };
    room.messages.push(msg);
    if (room.messages.length > 100) room.messages.shift();
    room.lastActiveAt = Date.now();
    return msg;
  }

  cleanupAbandonedRooms() {
    const cutoff = Date.now() - (1000 * 60 * 60);
    for (const [code, room] of this.rooms.entries()) {
      if (room.lastActiveAt < cutoff || room.status === 'ENDED') {
        this.rooms.delete(code);
      }
    }
  }
}
module.exports = new RoomStore();
