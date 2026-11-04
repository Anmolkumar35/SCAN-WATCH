const roomStore = require('../models/RoomStore');

module.exports = function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    let currentRoomCode = null;
    let currentUserId = null;

    socket.on('room:join', ({ roomCode, userId, userName }) => {
      if (!roomCode || !userId) return;
      const code = roomCode.toUpperCase();
      const room = roomStore.getRoom(code);
      if (!room) return socket.emit('error:event', { message: 'Room not found' });

      socket.join(code);
      currentRoomCode = code;
      currentUserId = userId;
      roomStore.updateSocketId(code, userId, socket.id);

      socket.emit('room:joined_ack', {
        room,
        authoritativePosition: roomStore.getAuthoritativePosition(room)
      });

      socket.to(code).emit('user:joined', {
        userId,
        userName,
        participants: room.participants,
        status: room.status
      });
    });

    socket.on('playback:action', ({ roomCode, eventType, position }) => {
      if (!roomCode || !['PLAY', 'PAUSE', 'SEEK'].includes(eventType)) return;
      const code = roomCode.toUpperCase();
      const stateUpdate = roomStore.updatePlaybackState(code, {
        eventType,
        position,
        userId: currentUserId
      });
      if (!stateUpdate) return;

      io.in(code).emit('playback:sync_update', {
        roomId: code,
        userId: currentUserId,
        eventType,
        playbackPosition: position,
        serverTimestamp: stateUpdate.serverTimestamp,
        sequenceNumber: stateUpdate.sequenceNumber
      });
    });

    socket.on('playback:request_sync', ({ roomCode }) => {
      const room = roomStore.getRoom(roomCode);
      if (!room) return;
      socket.emit('playback:authoritative_state', {
        isPlaying: room.playback.isPlaying,
        playbackPosition: roomStore.getAuthoritativePosition(room),
        serverTimestamp: Date.now(),
        sequenceNumber: room.playback.sequenceNumber,
        controllingUser: room.playback.controllingUser
      });
    });

    socket.on('chat:send', ({ roomCode, text, senderName }) => {
      if (!roomCode || !text || text.trim() === '') return;
      const code = roomCode.toUpperCase();
      const msg = roomStore.addMessage(code, {
        senderId: currentUserId,
        senderName: senderName || 'Viewer',
        text: text.trim().slice(0, 500)
      });
      if (msg) io.in(code).emit('chat:message', msg);
    });

    socket.on('chat:typing', ({ roomCode, isTyping, userName }) => {
      if (!roomCode) return;
      socket.to(roomCode.toUpperCase()).emit('chat:typing_status', {
        userId: currentUserId,
        userName,
        isTyping
      });
    });

    socket.on('voice:offer', ({ roomCode, offer }) => {
      socket.to(roomCode.toUpperCase()).emit('voice:offer_received', { offer, fromUserId: currentUserId });
    });

    socket.on('voice:answer', ({ roomCode, answer }) => {
      socket.to(roomCode.toUpperCase()).emit('voice:answer_received', { answer, fromUserId: currentUserId });
    });

    socket.on('voice:ice_candidate', ({ roomCode, candidate }) => {
      socket.to(roomCode.toUpperCase()).emit('voice:ice_candidate_received', { candidate, fromUserId: currentUserId });
    });

    socket.on('disconnect', () => {
      const departure = roomStore.removeParticipant(socket.id);
      if (departure) {
        io.in(departure.roomCode).emit('user:left', {
          userId: departure.participant.userId,
          userName: departure.participant.userName,
          participants: departure.room.participants,
          status: departure.room.status
        });
      }
    });
  });
};
