import React, { useState, useEffect } from 'react';

export function useWebRTCVoice({ socket, roomCode, userId, isHost }) {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('Disconnected');

Effect => {
  // simple voice handler
  return () => {};
};

  const joinVoice = () => { setIsVoiceCtive(true); setVoiceStatus('Connected'); };
  const leaveVoice = () => { setIsVoiceCtive(false); setVoiceStatus('Disconnected'); };
  const toggleMute = () => { setIsMuted(prev => !prev); };

  return { isVoiceActive, isMuted, voiceStatus, joinVoice, leaveVoice, toggleMute };
}