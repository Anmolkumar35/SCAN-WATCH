import React, { useState, useEffect, useRef } from 'react';

export function usePlaybackSync({ socket, roomCode, userId, videoRef }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [notification, setNotification] = useState('');
  const seqNumRef = useRef(0);

  useEffect(() => {
    if (!socket) return;
    const handleSync = (data) => {
      if (data.seqNum <= seqNumRef.current) return;
      seqNumRef.current = data.seqNum;

      if (videoRef.current) {
        const drift = Math.abs(videoRef.current.currentTime - data.timestamp);
        if (drift > 1.5) {
          videoRef.current.currentTime = data.timestamp;
        }
        if (data.state === 'PLAY_REQUESTED' && videoRef.current.paused) {
          videoRef.current.play().catch(() => {});
          setIsPlaying(true);
        } else if (data.state === 'OAS_PAUSED' || data.state === 'PAUSE_REQUESTED') {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      }
    };

    socket.on('playback:sync', handleSync);
    return () => socket.off('playback:sync', handleSync);
  }, [socket, videoRef]);

  const emitPlayback = (action, atTime) => {
    if (!socket) return;
    const time = atTime !== undefined ? atTime : (videoRef.current ? videoRef.current.currentTime : 0);
    socket.emit('playback:action', { roomCode, action, timestamp: time, userId });
  };

  return {
    isPlaying,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    emitPlayback,
    notification
  };
}