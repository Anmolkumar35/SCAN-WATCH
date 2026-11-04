import React, { useState, useEffect, useRef } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UploadMovie from './pages/UploadMovie';
import WatchTogether from './pages/WatchTogether';
import { 
  ArrowLeft, 
  Search, 
  UserPlus, 
  UserCheck, 
  Check, 
  X, 
  UserMinus, 
  MessageSquare, 
  Users, 
  Clock, 
  Sparkles,
  Send,
  Smile,
  Bell,
  CheckCheck,
  Film,
  User as UserIcon,
  Edit3,
  Save,
  LogOut,
  Mail,
  Shield,
  Palette,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  HardDrive,
  Volume2,
  VolumeX,
  Maximize,
  Gauge
} from 'lucide-react';
import './index.css';

const DEFAULT_USERS_POOL = [
  { id: 'u_1', username: 'rohit_99', name: 'Rohit Kumar', isOnline: true },
  { id: 'u_2', username: 'priya_sharma', name: 'Priya Sharma', isOnline: false },
  { id: 'u_3', username: 'vikram_singh', name: 'Vikram Singh', isOnline: true },
  { id: 'u_4', username: 'neha_verma', name: 'Neha Verma', isOnline: false },
  { id: 'u_5', username: 'alex_gamer', name: 'Alex Parker', isOnline: true }
];

const EMOJI_LIST = ['🎬', '🍿', '🔥', '❤️', '😂', '👍', '🎉', '🚀', '👀', '✨', '🎥', '💯'];

const AVATAR_PALETTES = [
  { id: 'purple_blue', name: 'Neon Nebula', gradient: 'linear-gradient(135deg, #7864ff, #38bdf8)' },
  { id: 'rose_purple', name: 'Cyber Pink', gradient: 'linear-gradient(135deg, #ec4899, #7864ff)' },
  { id: 'emerald_cyan', name: 'Aurora Green', gradient: 'linear-gradient(135deg, #10b981, #06b6d4)' },
  { id: 'amber_rose', name: 'Sunset Glow', gradient: 'linear-gradient(135deg, #f59e0b, #ec4899)' },
  { id: 'blue_indigo', name: 'Midnight Deep', gradient: 'linear-gradient(135deg, #2563eb, #4f46e5)' }
];

const DEFAULT_PREVIEW_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

/* =========================================================================
   1. WATCH ROOM (PLAYER + SYNC + PARTICIPANT KICK)
   ========================================================================= */
function WatchRoomView({ currentUser, activeParty, onLeaveRoom }) {
  const currentUsername = (currentUser?.username || 'anmol').toLowerCase().trim();
  const partyId = activeParty?.partyId || 'default_party';
  const isHost = (activeParty?.hostUsername || '').toLowerCase().trim() === currentUsername;

  const movie = activeParty?.movie || { title: 'Personal Cinema', format: 'MP4', size: '1.2 GB' };

  const [members, setMembers] = useState(() => {
    const hostUser = (activeParty?.hostUsername || currentUsername).toLowerCase().trim();
    const joined = (activeParty?.joinedMembers || []).map(m => m.toLowerCase().trim());
    const invited = (activeParty?.invitedFriends || []).map(m => m.toLowerCase().trim());
    const all = Array.from(new Set([hostUser, ...joined, ...invited]));
    return all.map(uname => ({
      username: uname,
      isHost: uname === hostUser,
      status: uname === hostUser || joined.includes(uname) ? 'watching' : 'invited'
    }));
  });

  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const syncKey = `scane_playback_sync_${partyId}`;

  const broadcastSyncState = (playState, time) => {
    if (!isHost) return;
    try {
      const payload = {
        partyId,
        movie,
        hostUsername: currentUsername,
        isPlaying: playState,
        currentTime: time,
        updatedAt: Date.now()
      };
      localStorage.setItem(syncKey, JSON.stringify(payload));
    } catch (e) {}
  };

  useEffect(() => {
    try {
      const storedSync = JSON.parse(localStorage.getItem(syncKey));
      if (storedSync && videoRef.current) {
        let initialTime = storedSync.currentTime || 0;
        if (storedSync.isPlaying && storedSync.updatedAt) {
          const elapsedSec = (Date.now() - storedSync.updatedAt) / 1000;
          initialTime += elapsedSec;
        }

        videoRef.current.currentTime = initialTime;
        setCurrentTime(initialTime);

        if (storedSync.isPlaying) {
          videoRef.current.play().catch(() => {});
          setIsPlaying(true);
        } else {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      } else if (isHost) {
        broadcastSyncState(true, 0);
      }
    } catch (e) {}
  }, [partyId]);

  useEffect(() => {
    const syncInterval = setInterval(() => {
      try {
        const storedParty = JSON.parse(localStorage.getItem(`scane_active_party_${partyId}`));
        if (storedParty) {
          const kickedList = (storedParty.kickedMembers || []).map(u => u.toLowerCase().trim());
          if (kickedList.includes(currentUsername)) {
            clearInterval(syncInterval);
            alert('You have been removed from this watch session by the host.');
            onLeaveRoom();
            return;
          }

          const hostUser = (storedParty.hostUsername || '').toLowerCase().trim();
          const joined = (storedParty.joinedMembers || []).map(m => m.toLowerCase().trim());
          const invited = (storedParty.invitedFriends || []).map(m => m.toLowerCase().trim());
          const all = Array.from(new Set([hostUser, ...joined, ...invited])).filter(u => !kickedList.includes(u));

          setMembers(all.map(uname => ({
            username: uname,
            isHost: uname === hostUser,
            status: uname === hostUser || joined.includes(uname) ? 'watching' : 'invited'
          })));
        }
      } catch (e) {}

      if (!isHost && videoRef.current) {
        try {
          const syncData = JSON.parse(localStorage.getItem(syncKey));
          if (syncData) {
            if (syncData.isPlaying && videoRef.current.paused) {
              videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
            } else if (!syncData.isPlaying && !videoRef.current.paused) {
              videoRef.current.pause();
              setIsPlaying(false);
            }

            let targetTime = syncData.currentTime;
            if (syncData.isPlaying && syncData.updatedAt) {
              targetTime += (Date.now() - syncData.updatedAt) / 1000;
            }

            if (Math.abs(videoRef.current.currentTime - targetTime) > 1.25) {
              videoRef.current.currentTime = targetTime;
              setCurrentTime(targetTime);
            }
          }
        } catch (err) {}
      } else if (isHost && videoRef.current && !videoRef.current.paused) {
        broadcastSyncState(true, videoRef.current.currentTime);
      }
    }, 1000);

    return () => clearInterval(syncInterval);
  }, [partyId, isHost, currentUsername, onLeaveRoom]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [movie]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    const nextPlayState = !isPlaying;

    if (nextPlayState) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        if (isHost) broadcastSyncState(true, videoRef.current.currentTime);
      }).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      if (isHost) broadcastSyncState(false, videoRef.current.currentTime);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
      if (isHost) {
        broadcastSyncState(isPlaying, seekTime);
      }
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const changeSpeed = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleRemoveParticipant = (targetUsername) => {
    if (!isHost || targetUsername === currentUsername) return;

    const confirmKick = window.confirm(`Are you sure you want to remove @${targetUsername} from this watch session?`);
    if (!confirmKick) return;

    const updatedMembers = members.filter(m => m.username !== targetUsername);
    setMembers(updatedMembers);

    try {
      const stored = JSON.parse(localStorage.getItem(`scane_active_party_${partyId}`)) || activeParty || {};
      const kickedList = stored.kickedMembers || [];
      const updatedParty = {
        ...stored,
        kickedMembers: Array.from(new Set([...kickedList, targetUsername])),
        joinedMembers: (stored.joinedMembers || []).filter(u => u.toLowerCase().trim() !== targetUsername.toLowerCase().trim()),
        invitedFriends: (stored.invitedFriends || []).filter(u => u.toLowerCase().trim() !== targetUsername.toLowerCase().trim())
      };
      localStorage.setItem(`scane_active_party_${partyId}`, JSON.stringify(updatedParty));
      localStorage.setItem('scane_current_active_party', JSON.stringify(updatedParty));
    } catch (e) {}
  };

  const videoSource = movie.fileUrl || movie.previewUrl || DEFAULT_PREVIEW_URL;
  const activeParticipantsCount = members.filter(m => m.status === 'watching').length;

  return (
    <div style={{ minHeight: '100vh', width: '100%', backgroundColor: '#02040b', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        padding: '14px 24px',
        background: 'rgba(9, 13, 28, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        zIndex: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onLeaveRoom}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              padding: '7px 14px',
              borderRadius: '9px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            <ArrowLeft size={16} />
            <span>Leave Session</span>
          </button>

          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>
              {movie.title}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Host: @{activeParty?.hostUsername || currentUser?.username} • {activeParticipantsCount} Watching now
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#6ee7b7',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
            {isHost ? 'Host Streaming' : 'Synchronized with Host'}
          </span>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', lgDirection: 'row', padding: '16px', maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box', gap: '20px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
          <div 
            ref={playerContainerRef}
            style={{
              position: 'relative',
              width: '100%',
              height: 'clamp(280px, 60vh, 640px)',
              background: '#000',
              borderRadius: '18px',
              border: '1px solid rgba(120, 100, 255, 0.25)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(120, 100, 255, 0.15)'
            }}
          >
            <video
              ref={videoRef}
              src={videoSource}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onClick={togglePlay}
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                cursor: 'pointer'
              }}
            />

            {!isPlaying && (
              <div 
                onClick={togglePlay}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0, 0, 0, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7864ff, #38bdf8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 30px rgba(120, 100, 255, 0.6)'
                }}>
                  <Play size={28} fill="#fff" style={{ marginLeft: '3px' }} />
                </div>
              </div>
            )}

            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '12px 18px',
              background: 'linear-gradient(to top, rgba(3, 6, 18, 0.96) 20%, transparent)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  style={{
                    width: '100%',
                    accentColor: '#38bdf8',
                    cursor: 'pointer',
                    height: '5px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={togglePlay}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #7864ff, #38bdf8)',
                      border: 'none',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 0 14px rgba(120, 100, 255, 0.4)'
                    }}
                  >
                    {isPlaying ? <Pause size={16} fill="#fff" /> : <Play size={16} fill="#fff" style={{ marginLeft: '2px' }} />}
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={toggleMute}
                      style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', display: 'flex', padding: 0 }}
                    >
                      {isMuted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      style={{ width: '64px', accentColor: '#7864ff', cursor: 'pointer', height: '4px' }}
                    />
                  </div>

                  <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
                    <span>{formatTime(currentTime)}</span>
                    <span style={{ margin: '0 4px', color: '#64748b' }}>/</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#cbd5e1', position: 'relative' }}>
                  <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.08)', padding: '2px 7px', borderRadius: '5px', fontWeight: 700 }}>
                    {movie.format || 'HD'}
                  </span>

                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: playbackSpeed !== 1 ? '#38bdf8' : '#cbd5e1',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Playback Speed"
                    >
                      <Gauge size={15} />
                      <span>{playbackSpeed}x</span>
                    </button>

                    {showSpeedMenu && (
                      <div style={{
                        position: 'absolute',
                        bottom: '36px',
                        right: 0,
                        background: 'rgba(9, 13, 28, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '10px',
                        padding: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.7)',
                        zIndex: 30
                      }}>
                        {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                          <button
                            key={spd}
                            type="button"
                            onClick={() => changeSpeed(spd)}
                            style={{
                              background: playbackSpeed === spd ? '#7864ff' : 'transparent',
                              border: 'none',
                              color: '#fff',
                              padding: '5px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            {spd}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', display: 'flex', padding: 0 }}
                    title="Fullscreen"
                  >
                    <Maximize size={17} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(11, 16, 32, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '14px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
              <HardDrive size={15} />
              <span>Loaded Movie: <strong style={{ color: '#fff' }}>{movie.fileName || movie.title}</strong> ({movie.size || 'Local File'})</span>
            </div>
            <div style={{ color: '#38bdf8', fontWeight: 600 }}>
              Live Sync Enabled
            </div>
          </div>
        </div>

        {/* Members Management Sidebar */}
        <div style={{
          width: '100%',
          maxWidth: '340px',
          background: 'rgba(11, 16, 32, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '18px',
          padding: '20px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={17} color="#7864ff" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#fff' }}>
                Room Participants
              </h3>
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {members.length} Total
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {members.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px', background: 'rgba(6,10,24,0.5)', borderRadius: '10px' }}>
                No active participants.
              </div>
            ) : (
              members.map((member) => {
                const canKick = isHost && !member.isHost;

                return (
                  <div
                    key={member.username}
                    style={{
                      background: member.isHost 
                        ? 'rgba(120, 100, 255, 0.12)' 
                        : member.status === 'watching' 
                        ? 'rgba(16, 185, 129, 0.08)' 
                        : 'rgba(6, 10, 24, 0.6)',
                      border: member.isHost 
                        ? '1px solid rgba(120, 100, 255, 0.3)' 
                        : '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '12px',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: member.isHost ? 'linear-gradient(135deg, #7864ff, #38bdf8)' : 'rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '12px',
                        color: '#fff',
                        flexShrink: 0
                      }}>
                        {member.username.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          @{member.username}
                        </div>
                        <div style={{ fontSize: '10px', color: member.isHost ? '#c4b5fd' : member.status === 'watching' ? '#34d399' : '#f59e0b' }}>
                          {member.isHost ? 'Host' : member.status === 'watching' ? 'Watching now' : 'Invited'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {member.isHost ? (
                        <span style={{ fontSize: '10px', background: '#7864ff', color: '#fff', padding: '2px 7px', borderRadius: '4px', fontWeight: 800 }}>
                          HOST
                        </span>
                      ) : (
                        <>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: member.status === 'watching' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: member.status === 'watching' ? '#6ee7b7' : '#f59e0b'
                          }}>
                            {member.status === 'watching' ? 'JOINED' : 'INVITED'}
                          </span>

                          {canKick && (
                            <button
                              type="button"
                              onClick={() => handleRemoveParticipant(member.username)}
                              title={`Remove @${member.username}`}
                              style={{
                                padding: '4px 6px',
                                borderRadius: '6px',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#fca5a5',
                                cursor: 'pointer',
                                fontSize: '11px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <UserMinus size={12} />
                              <span>Kick</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

/* =========================================================================
   2. NOTIFICATIONS COMPONENT
   ========================================================================= */
function NotificationsView({ currentUser, onBack, onNavigateToFriends, onAcceptPartyInvite }) {
  const currentUsername = (currentUser?.username || 'anmol').toLowerCase().trim();
  const storageKey = `scane_notifications_${currentUsername}`;

  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setNotifications(JSON.parse(stored));
      } else {
        const seedNotifications = [
          {
            id: 'notif_1',
            type: 'friend_request',
            actorName: 'Rahul Verma',
            actorUsername: 'rahul_99',
            message: 'Rahul sent you a friend request.',
            time: '5m ago',
            read: false
          },
          {
            id: 'notif_2',
            type: 'watch_party_invite',
            actorName: 'Anmol',
            actorUsername: 'anmol_v',
            movieTitle: 'Interstellar',
            message: 'Anmol invited you to watch Interstellar.',
            time: '25m ago',
            read: false
          },
          {
            id: 'notif_3',
            type: 'request_accepted',
            actorName: 'Kundan',
            actorUsername: 'kundan_dev',
            message: 'Kundan accepted your friend request.',
            time: '2h ago',
            read: true
          }
        ];
        setNotifications(seedNotifications);
        localStorage.setItem(storageKey, JSON.stringify(seedNotifications));
      }
    } catch (e) {
      setNotifications([]);
    }
  }, [storageKey]);

  const saveNotifications = (updated) => {
    setNotifications(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {}
  };

  const markAsRead = (id) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    saveNotifications(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const clearAll = () => {
    saveNotifications([]);
  };

  const handleAcceptInvite = (notif) => {
    markAsRead(notif.id);
    if (onAcceptPartyInvite) {
      onAcceptPartyInvite(notif);
    }
  };

  const handleDeclineInvite = (id) => {
    const updated = notifications.filter((n) => n.id !== id);
    saveNotifications(updated);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', width: '100%', backgroundColor: '#030612', color: '#fff', position: 'relative', overflowX: 'hidden' }}>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        background: 'rgba(9, 13, 28, 0.75)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#cbd5e1',
            padding: '8px 14px',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '9px',
            background: 'linear-gradient(135deg, #7864ff, #38bdf8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '7px solid #fff', marginLeft: '1px' }} />
          </div>
          <span style={{ fontSize: '16px', fontWeight: 800 }}>Scane<span style={{ color: '#7864ff', marginLeft: '3px' }}>Watch</span></span>
        </div>
      </header>

      <main style={{ maxWidth: '820px', width: '100%', margin: '0 auto', padding: '36px 20px 60px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '16px', background: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.3)', color: '#f472b6', fontSize: '11px', fontWeight: 600, marginBottom: '8px' }}>
              <Bell size={13} />
              <span>Activity Hub</span>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>
              Notifications
            </h1>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
              Stay updated with your squad invites and friend activity.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                style={{
                  background: 'rgba(120, 100, 255, 0.15)',
                  border: '1px solid rgba(120, 100, 255, 0.3)',
                  color: '#c4b5fd',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                <CheckCheck size={14} />
                <span>Mark All as Read</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#94a3b8',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '10px',
          background: 'rgba(6, 10, 24, 0.75)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '20px',
          width: 'fit-content'
        }}>
          <button
            type="button"
            onClick={() => setFilter('all')}
            style={{
              padding: '8px 16px',
              borderRadius: '9px',
              border: 'none',
              background: filter === 'all' ? '#7864ff' : 'transparent',
              color: filter === 'all' ? '#fff' : '#94a3b8',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>All</span>
            <span style={{ fontSize: '11px', background: 'rgba(0,0,0,0.25)', padding: '1px 6px', borderRadius: '10px' }}>
              {notifications.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('unread')}
            style={{
              padding: '8px 16px',
              borderRadius: '9px',
              border: 'none',
              background: filter === 'unread' ? '#7864ff' : 'transparent',
              color: filter === 'unread' ? '#fff' : '#94a3b8',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span style={{ fontSize: '11px', background: '#ec4899', color: '#fff', padding: '1px 6px', borderRadius: '10px' }}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {filteredNotifications.length === 0 ? (
          <div style={{
            background: 'rgba(11, 16, 32, 0.75)',
            border: '1px dashed rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            padding: '56px 20px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '18px',
              background: 'rgba(236, 72, 153, 0.1)',
              border: '1px solid rgba(236, 72, 153, 0.25)',
              color: '#f472b6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Bell size={28} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', margin: '0 0 6px 0' }}>
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '340px', margin: '0 auto' }}>
              When friends send requests or invite you to watch parties, you will see them here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredNotifications.map((notif) => {
              const isUnread = !notif.read;

              return (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  style={{
                    position: 'relative',
                    background: isUnread ? 'rgba(18, 24, 52, 0.85)' : 'rgba(9, 13, 28, 0.65)',
                    border: isUnread ? '1px solid rgba(120, 100, 255, 0.35)' : '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isUnread ? '0 4px 20px rgba(120, 100, 255, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      background:
                        notif.type === 'watch_party_invite'
                          ? 'rgba(56, 189, 248, 0.15)'
                          : notif.type === 'friend_request'
                          ? 'rgba(120, 100, 255, 0.15)'
                          : 'rgba(16, 185, 129, 0.15)',
                      color:
                        notif.type === 'watch_party_invite'
                          ? '#38bdf8'
                          : notif.type === 'friend_request'
                          ? '#a78bfa'
                          : '#6ee7b7',
                      border:
                        notif.type === 'watch_party_invite'
                          ? '1px solid rgba(56, 189, 248, 0.3)'
                          : notif.type === 'friend_request'
                          ? '1px solid rgba(120, 100, 255, 0.3)'
                          : '1px solid rgba(16, 185, 129, 0.3)'
                    }}>
                      {notif.type === 'watch_party_invite' && <Film size={20} />}
                      {notif.type === 'friend_request' && <UserPlus size={20} />}
                      {notif.type === 'request_accepted' && <UserCheck size={20} />}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: isUnread ? 700 : 500, color: '#f8fafc', lineHeight: 1.4, wordBreak: 'break-word' }}>
                        {notif.message}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{notif.time}</span>
                        {notif.type === 'friend_request' && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notif.id);
                              onNavigateToFriends && onNavigateToFriends();
                            }}
                            style={{ color: '#38bdf8', fontWeight: 700, textDecoration: 'underline' }}
                          >
                            View in Friends
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {notif.type === 'watch_party_invite' ? (
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcceptInvite(notif);
                        }}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: 'none',
                          background: 'linear-gradient(135deg, #7864ff, #38bdf8)',
                          color: '#fff',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <Play size={12} fill="#fff" />
                        <span>Accept & Join</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeclineInvite(notif.id);
                        }}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#fca5a5'
                        }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    isUnread && (
                      <div style={{
                        width: '9px',
                        height: '9px',
                        borderRadius: '50%',
                        background: '#38bdf8',
                        boxShadow: '0 0 10px #38bdf8',
                        flexShrink: 0
                      }} />
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}

/* =========================================================================
   3. FRIENDS VIEW & PERSONAL 1-ON-1 CHAT
   ========================================================================= */
function PersonalChatView({ currentUser, activeFriend, onBack }) {
  const myUsername = (currentUser?.username || 'anmol').toLowerCase().trim();
  const friendUsername = (activeFriend?.username || 'friend').toLowerCase().trim();
  const storageKey = `scane_dm_${myUsername}_${friendUsername}`;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setMessages(JSON.parse(stored));
      } else {
        const seedMessages = [
          {
            id: 'm1',
            sender: friendUsername,
            text: `Hey @${myUsername}! Ready to watch a movie tonight? 🍿`,
            time: '08:30 PM'
          },
          {
            id: 'm2',
            sender: myUsername,
            text: 'Yes! Just uploaded a new film on Scane Watch. Let me know when you are free.',
            time: '08:32 PM'
          }
        ];
        setMessages(seedMessages);
        localStorage.setItem(storageKey, JSON.stringify(seedMessages));
      }
    } catch (e) {
      setMessages([]);
    }
  }, [storageKey, friendUsername, myUsername]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg = {
      id: 'msg_' + Date.now(),
      sender: myUsername,
      text: inputText.trim(),
      time: timeString
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    setInputText('');
    setShowEmojis(false);

    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      // Save reciprocal view for friend if simulated
      const reciprocalKey = `scane_dm_${friendUsername}_${myUsername}`;
      localStorage.setItem(reciprocalKey, JSON.stringify(updated));
    } catch (e) {}
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji) => {
    setInputText((prev) => prev + emoji);
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', backgroundColor: '#030612', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 24px',
        background: 'rgba(9, 13, 28, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#cbd5e1',
              padding: '8px 14px',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Friends</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              position: 'relative',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7864ff, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '15px',
              color: '#fff'
            }}>
              {(activeFriend?.username || 'F').charAt(0).toUpperCase()}
              <span style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: activeFriend?.isOnline ? '#10b981' : '#64748b',
                border: '2px solid #090d1c'
              }} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '-0.2px' }}>
                @{activeFriend?.username || 'friend'}
              </div>
              <div style={{ fontSize: '11px', color: activeFriend?.isOnline ? '#34d399' : '#94a3b8' }}>
                {activeFriend?.isOnline ? 'Online now' : 'Offline'}
              </div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: '#a78bfa', background: 'rgba(120, 100, 255, 0.12)', border: '1px solid rgba(120, 100, 255, 0.3)', padding: '5px 12px', borderRadius: '20px', fontWeight: 600 }}>
          Direct Message
        </div>
      </header>

      <main style={{
        flex: 1,
        maxWidth: '860px',
        width: '100%',
        margin: '0 auto',
        padding: '20px 16px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '14px'
      }}>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingRight: '4px'
        }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', margin: 'auto', color: '#94a3b8', padding: '40px 20px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                background: 'rgba(120, 100, 255, 0.1)',
                border: '1px solid rgba(120, 100, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a78bfa',
                margin: '0 auto 12px'
              }}>
                <MessageSquare size={24} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9', margin: '0 0 6px 0' }}>
                No messages yet
              </h3>
              <p style={{ fontSize: '13px', margin: 0 }}>
                Say hello to @{activeFriend?.username} and start planning your next watch party!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender === myUsername;
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '100%'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '75%',
                      padding: '12px 16px',
                      borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isMe 
                        ? 'linear-gradient(135deg, #7864ff 0%, #4f46e5 100%)'
                        : 'rgba(14, 20, 42, 0.85)',
                      border: isMe ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#fff',
                      fontSize: '14px',
                      lineHeight: 1.5,
                      boxShadow: isMe 
                        ? '0 4px 15px rgba(120, 100, 255, 0.3)' 
                        : '0 4px 12px rgba(0, 0, 0, 0.4)',
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {msg.text}
                  </div>
                  <span style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', padding: '0 4px' }}>
                    {msg.time}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ position: 'relative' }}>
          {showEmojis && (
            <div style={{
              position: 'absolute',
              bottom: '65px',
              left: '12px',
              background: '#0c1024',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '10px',
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '8px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
              zIndex: 30
            }}>
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => addEmoji(emoji)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '18px',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '8px'
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(11, 16, 32, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '8px 12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
          }}>
            <button
              type="button"
              onClick={() => setShowEmojis(!showEmojis)}
              style={{
                background: 'transparent',
                border: 'none',
                color: showEmojis ? '#38bdf8' : '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Add Emoji"
            >
              <Smile size={20} />
            </button>

            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message @${activeFriend?.username || 'friend'}... (Press Enter to send)`}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                resize: 'none',
                maxHeight: '100px',
                fontFamily: 'inherit',
                lineHeight: '1.4'
              }}
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={!inputText.trim()}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                border: 'none',
                background: inputText.trim() 
                  ? 'linear-gradient(135deg, #7864ff 0%, #38bdf8 100%)' 
                  : 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function FriendsView({ currentUser, onBack, onOpenChat }) {
  const currentUsername = (currentUser?.username || 'anmol').toLowerCase().trim();

  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);

  useEffect(() => {
    try {
      const storedFriends = localStorage.getItem('scane_friends_' + currentUsername);
      const storedIncoming = localStorage.getItem('scane_incoming_' + currentUsername);
      const storedOutgoing = localStorage.getItem('scane_outgoing_' + currentUsername);

      if (storedFriends) {
        setFriends(JSON.parse(storedFriends));
      } else {
        const seedFriends = [
          { id: 'u_1', username: 'rohit_99', name: 'Rohit Kumar', isOnline: true },
          { id: 'u_3', username: 'vikram_singh', name: 'Vikram Singh', isOnline: false }
        ];
        setFriends(seedFriends);
        localStorage.setItem('scane_friends_' + currentUsername, JSON.stringify(seedFriends));
      }

      if (storedIncoming) {
        setIncomingRequests(JSON.parse(storedIncoming));
      } else {
        const seedIncoming = [
          { id: 'u_2', username: 'priya_sharma', name: 'Priya Sharma', isOnline: true, sentAt: '10m ago' }
        ];
        setIncomingRequests(seedIncoming);
        localStorage.setItem('scane_incoming_' + currentUsername, JSON.stringify(seedIncoming));
      }

      if (storedOutgoing) {
        setOutgoingRequests(JSON.parse(storedOutgoing));
      }
    } catch (e) {}
  }, [currentUsername]);

  const saveFriends = (newList) => {
    setFriends(newList);
    try {
      localStorage.setItem('scane_friends_' + currentUsername, JSON.stringify(newList));
    } catch (e) {}
  };

  const saveIncoming = (newList) => {
    setIncomingRequests(newList);
    try {
      localStorage.setItem('scane_incoming_' + currentUsername, JSON.stringify(newList));
    } catch (e) {}
  };

  const saveOutgoing = (newList) => {
    setOutgoingRequests(newList);
    try {
      localStorage.setItem('scane_outgoing_' + currentUsername, JSON.stringify(newList));
    } catch (e) {}
  };

  // Include both registered users and defaults in search
  const registeredUsers = JSON.parse(localStorage.getItem('scane_registered_users') || '[]');
  const combinedUserPool = [...DEFAULT_USERS_POOL];
  registeredUsers.forEach(reg => {
    if (!combinedUserPool.some(u => u.username?.toLowerCase() === reg.username?.toLowerCase())) {
      combinedUserPool.push({
        id: reg.id || 'u_' + reg.username,
        username: reg.username,
        name: reg.name || reg.username,
        isOnline: true
      });
    }
  });

  const searchResults = combinedUserPool.filter(u => {
    if (!searchQuery.trim()) return false;
    const match = u.username.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
                  u.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
    return match && u.username.toLowerCase() !== currentUsername;
  });

  const sendFriendRequest = (targetUser) => {
    if (outgoingRequests.includes(targetUser.username)) return;
    const updated = [...outgoingRequests, targetUser.username];
    saveOutgoing(updated);

    // Notify target user if they exist in localStorage
    try {
      const targetNotifsKey = `scane_notifications_${targetUser.username.toLowerCase()}`;
      const targetNotifs = JSON.parse(localStorage.getItem(targetNotifsKey) || '[]');
      targetNotifs.unshift({
        id: 'notif_fr_' + Date.now(),
        type: 'friend_request',
        actorName: currentUser?.name || currentUsername,
        actorUsername: currentUsername,
        message: `${currentUser?.name || currentUsername} sent you a friend request.`,
        time: 'Just now',
        read: false
      });
      localStorage.setItem(targetNotifsKey, JSON.stringify(targetNotifs));

      // Push to target user's incoming list
      const targetIncomingKey = `scane_incoming_${targetUser.username.toLowerCase()}`;
      const targetIncoming = JSON.parse(localStorage.getItem(targetIncomingKey) || '[]');
      targetIncoming.unshift({
        id: 'req_' + Date.now(),
        username: currentUsername,
        name: currentUser?.name || currentUsername,
        isOnline: true,
        sentAt: 'Just now'
      });
      localStorage.setItem(targetIncomingKey, JSON.stringify(targetIncoming));
    } catch (e) {}
  };

  const acceptRequest = (req) => {
    const newFriend = {
      id: req.id,
      username: req.username,
      name: req.name,
      isOnline: req.isOnline
    };
    saveFriends([...friends, newFriend]);
    saveIncoming(incomingRequests.filter(r => r.username !== req.username));

    // Reciprocal add for the request sender
    try {
      const senderFriendsKey = `scane_friends_${req.username.toLowerCase()}`;
      const senderFriends = JSON.parse(localStorage.getItem(senderFriendsKey) || '[]');
      if (!senderFriends.some(f => f.username.toLowerCase() === currentUsername)) {
        senderFriends.push({
          id: 'u_' + currentUsername,
          username: currentUsername,
          name: currentUser?.name || currentUsername,
          isOnline: true
        });
        localStorage.setItem(senderFriendsKey, JSON.stringify(senderFriends));
      }

      // Notify the requester
      const senderNotifsKey = `scane_notifications_${req.username.toLowerCase()}`;
      const senderNotifs = JSON.parse(localStorage.getItem(senderNotifsKey) || '[]');
      senderNotifs.unshift({
        id: 'notif_acc_' + Date.now(),
        type: 'request_accepted',
        actorName: currentUser?.name || currentUsername,
        actorUsername: currentUsername,
        message: `${currentUser?.name || currentUsername} accepted your friend request.`,
        time: 'Just now',
        read: false
      });
      localStorage.setItem(senderNotifsKey, JSON.stringify(senderNotifs));
    } catch (e) {}
  };

  const rejectRequest = (reqUsername) => {
    saveIncoming(incomingRequests.filter(r => r.username !== reqUsername));
  };

  const removeFriend = (friendUsername) => {
    saveFriends(friends.filter(f => f.username !== friendUsername));
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', backgroundColor: '#030612', color: '#fff', position: 'relative', overflowX: 'hidden' }}>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        background: 'rgba(9, 13, 28, 0.75)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#cbd5e1',
            padding: '8px 14px',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '9px',
            background: 'linear-gradient(135deg, #7864ff, #38bdf8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '7px solid #fff', marginLeft: '1px' }} />
          </div>
          <span style={{ fontSize: '16px', fontWeight: 800 }}>Scane<span style={{ color: '#7864ff', marginLeft: '3px' }}>Watch</span></span>
        </div>
      </header>

      <main style={{ maxWidth: '940px', width: '100%', margin: '0 auto', padding: '34px 20px 60px', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '26px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '16px', background: 'rgba(120, 100, 255, 0.15)', border: '1px solid rgba(120, 100, 255, 0.3)', color: '#c4b5fd', fontSize: '11px', fontWeight: 600, marginBottom: '8px' }}>
            <Sparkles size={13} />
            <span>Community & Sync Squad</span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>
            Friends & DMs
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            Connect with friends, accept watch requests, and chat in private.
          </p>
        </div>

        <div style={{ background: 'rgba(11, 16, 32, 0.85)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '18px', padding: '24px', boxSizing: 'border-box', marginBottom: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Search size={18} color="#7864ff" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>Search Friends</h2>
          </div>

          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by username (e.g. rohit_99, priya_sharma, alex_gamer)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 40px',
                background: 'rgba(6, 10, 24, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {searchQuery.trim() && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {searchResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '13px' }}>
                  No users found matching "{searchQuery}".
                </div>
              ) : (
                searchResults.map(user => {
                  const isFriend = friends.some(f => f.username.toLowerCase() === user.username.toLowerCase());
                  const isPending = outgoingRequests.includes(user.username);
                  const isIncoming = incomingRequests.some(r => r.username.toLowerCase() === user.username.toLowerCase());

                  return (
                    <div key={user.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(6, 10, 24, 0.6)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '14px', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ position: 'relative', width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #7864ff, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', color: '#fff' }}>
                          {user.username.charAt(0).toUpperCase()}
                          <span style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', borderRadius: '50%', background: user.isOnline ? '#10b981' : '#64748b', border: '2px solid #0b1020' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>@{user.username}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{user.name} - <span style={{ color: user.isOnline ? '#34d399' : '#64748b' }}>{user.isOnline ? 'Online' : 'Offline'}</span></div>
                        </div>
                      </div>

                      {isFriend ? (
                        <span style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: 'rgba(255,255,255,0.06)', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><UserCheck size={13} /> Already Friends</span>
                      ) : isPending ? (
                        <span style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: 'rgba(255,255,255,0.06)', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Clock size={13} /> Request Sent</span>
                      ) : isIncoming ? (
                        <span style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>Request in Inbox</span>
                      ) : (
                        <button type="button" onClick={() => sendFriendRequest(user)} style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #7864ff, #38bdf8)', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <UserPlus size={13} /> Send Request
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div style={{ background: 'rgba(11, 16, 32, 0.85)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '18px', padding: '24px', boxSizing: 'border-box', marginBottom: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#38bdf8" />
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>Incoming Requests</h2>
            </div>
            {incomingRequests.length > 0 && (
              <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>{incomingRequests.length} New</span>
            )}
          </div>

          {incomingRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 16px', color: '#94a3b8', fontSize: '13px' }}>No incoming friend requests.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {incomingRequests.map(req => (
                <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(6, 10, 24, 0.6)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ position: 'relative', width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #ec4899, #7864ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', color: '#fff' }}>
                      {req.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>@{req.username}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{req.name} {req.sentAt ? `- ${req.sentAt}` : ''}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={() => acceptRequest(req)} style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #7864ff, #38bdf8)', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <Check size={13} /> Accept
                    </button>
                    <button type="button" onClick={() => rejectRequest(req.username)} style={{ padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5' }}>
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: 'rgba(11, 16, 32, 0.85)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '18px', padding: '24px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="#10b981" />
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>My Friends</h2>
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{friends.length} {friends.length === 1 ? 'Friend' : 'Friends'}</span>
          </div>

          {friends.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 16px', color: '#94a3b8', fontSize: '13px' }}>Your squad is empty. Search above to add friends!</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
              {friends.map(friend => (
                <div key={friend.id} style={{ background: 'rgba(6, 10, 24, 0.65)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #7864ff, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '15px', color: '#fff' }}>
                      {friend.username.charAt(0).toUpperCase()}
                      <span style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', borderRadius: '50%', background: friend.isOnline ? '#10b981' : '#64748b', border: '2px solid #0b1020' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>@{friend.username}</div>
                      <div style={{ fontSize: '12px', color: friend.isOnline ? '#34d399' : '#94a3b8' }}>{friend.isOnline ? 'Online' : 'Offline'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <button 
                      type="button" 
                      onClick={() => onOpenChat(friend)}
                      style={{ 
                        flex: 1, 
                        padding: '7px 12px', 
                        borderRadius: '8px', 
                        fontSize: '12px', 
                        fontWeight: 700, 
                        cursor: 'pointer', 
                        border: 'none', 
                        background: 'linear-gradient(135deg, #7864ff, #38bdf8)', 
                        color: '#fff', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '5px' 
                      }}
                    >
                      <MessageSquare size={13} /> Chat
                    </button>
                    <button type="button" onClick={() => removeFriend(friend.username)} style={{ padding: '7px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5' }} title="Remove Friend">
                      <UserMinus size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* =========================================================================
   4. PROFILE VIEW
   ========================================================================= */
function ProfileView({ currentUser, onBack, onUpdateUser, onLogout }) {
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(currentUser?.name || 'Anmol Verma');
  const [username, setUsername] = useState(currentUser?.username || 'anmol_v');
  const [selectedAvatarGrad, setSelectedAvatarGrad] = useState(
    currentUser?.avatarGradient || 'linear-gradient(135deg, #7864ff, #38bdf8)'
  );
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanName = fullName.trim();
    const cleanUser = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (!cleanName) {
      setError('Full Name cannot be empty.');
      return;
    }
    if (!cleanUser || cleanUser.length < 3) {
      setError('Username must be at least 3 characters long (letters, numbers, underscore only).');
      return;
    }

    const updatedUser = {
      ...currentUser,
      name: cleanName,
      username: cleanUser,
      avatarGradient: selectedAvatarGrad
    };

    try {
      localStorage.setItem('scane_user', JSON.stringify(updatedUser));
      const registered = JSON.parse(localStorage.getItem('scane_registered_users')) || [];
      const updatedReg = registered.map(u => 
        (u.username?.toLowerCase() === currentUser?.username?.toLowerCase() || u.identifier === currentUser?.identifier)
          ? { ...u, name: cleanName, username: cleanUser }
          : u
      );
      localStorage.setItem('scane_registered_users', JSON.stringify(updatedReg));
    } catch (err) {}

    onUpdateUser(updatedUser);
    setIsEditing(false);
    setSuccessMsg('Profile changes saved successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleCancel = () => {
    setFullName(currentUser?.name || 'Anmol Verma');
    setUsername(currentUser?.username || 'anmol_v');
    setSelectedAvatarGrad(currentUser?.avatarGradient || 'linear-gradient(135deg, #7864ff, #38bdf8)');
    setError('');
    setIsEditing(false);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', backgroundColor: '#030612', color: '#fff', position: 'relative', overflowX: 'hidden' }}>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        background: 'rgba(9, 13, 28, 0.75)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#cbd5e1',
            padding: '8px 14px',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '9px',
            background: 'linear-gradient(135deg, #7864ff, #38bdf8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '7px solid #fff', marginLeft: '1px' }} />
          </div>
          <span style={{ fontSize: '16px', fontWeight: 800 }}>Scane<span style={{ color: '#7864ff', marginLeft: '3px' }}>Watch</span></span>
        </div>
      </header>

      <main style={{ maxWidth: '820px', width: '100%', margin: '0 auto', padding: '36px 20px 60px', boxSizing: 'border-box' }}>
        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            color: '#6ee7b7',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '20px'
          }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            color: '#fca5a5',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '20px'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div style={{
          background: 'rgba(11, 16, 32, 0.85)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '28px',
          boxSizing: 'border-box',
          marginBottom: '28px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{
                position: 'relative',
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: selectedAvatarGrad,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: 800,
                color: '#fff',
                boxShadow: '0 8px 25px rgba(120, 100, 255, 0.4)',
                flexShrink: 0
              }}>
                {(username || 'U').charAt(0).toUpperCase()}
              </div>

              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px 0', color: '#fff', letterSpacing: '-0.3px' }}>
                  {fullName}
                </h1>
                <div style={{ fontSize: '14px', color: '#38bdf8', fontWeight: 600, marginBottom: '6px' }}>
                  @{username}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#94a3b8' }}>
                  <Mail size={14} />
                  <span>{currentUser?.identifier || currentUser?.email || 'anmol@example.com'}</span>
                </div>
              </div>
            </div>

            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                style={{
                  background: 'linear-gradient(135deg, #7864ff 0%, #38bdf8 100%)',
                  border: 'none',
                  color: '#fff',
                  padding: '10px 20px',
                  borderRadius: '11px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  boxShadow: '0 4px 18px rgba(120, 100, 255, 0.4)'
                }}
              >
                <Edit3 size={15} />
                <span>Edit Profile</span>
              </button>
            )}
          </div>

          {isEditing && (
            <form onSubmit={handleSave} style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '22px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(6, 10, 24, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    Username (Manual Control)
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="e.g. anmol_v"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(6, 10, 24, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '26px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Select Avatar Aura
                </label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {AVATAR_PALETTES.map((pal) => (
                    <button
                      key={pal.id}
                      type="button"
                      onClick={() => setSelectedAvatarGrad(pal.gradient)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: pal.gradient,
                        border: selectedAvatarGrad === pal.gradient ? '2px solid #fff' : '2px solid transparent',
                        cursor: 'pointer',
                        boxShadow: selectedAvatarGrad === pal.gradient ? '0 0 14px #7864ff' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                      title={pal.name}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  style={{
                    padding: '11px 22px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #7864ff 0%, #38bdf8 100%)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Save size={15} />
                  <span>Save Changes</span>
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    padding: '11px 18px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#cbd5e1',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginBottom: '28px' }}>
          <div style={{
            background: 'rgba(11, 16, 32, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '22px',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Shield size={18} color="#38bdf8" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                Account Information
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>Account Tier</span>
                <span style={{ color: '#c4b5fd', fontWeight: 700 }}>Scane Member</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>Sync Protocol</span>
                <span style={{ color: '#34d399', fontWeight: 700 }}>Active (Local)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>Room Host Role</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>Enabled</span>
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(11, 16, 32, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '22px',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Palette size={18} color="#ec4899" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                App Settings
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>Cinematic Theme</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>Neon Dark</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>Video Player Sync</span>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>Ultra Low Latency</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>Audio Channel</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>Stereo Pass</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security / Logout Session with Confirmation Modal Trigger */}
        <div style={{
          background: 'rgba(239, 68, 68, 0.06)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fca5a5', marginBottom: '2px' }}>
              Session Management
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Log out of your current device session. Your uploaded movies and squad chats will remain securely saved.
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <LogOut size={15} />
            <span>Logout Account</span>
          </button>
        </div>

        {/* Professional Logout Confirmation Dialog */}
        {showLogoutModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 4, 11, 0.82)',
            backdropFilter: 'blur(16px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{
              maxWidth: '420px',
              width: '100%',
              background: 'rgba(12, 17, 36, 0.96)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '20px',
              padding: '28px',
              boxSizing: 'border-box',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(239, 68, 68, 0.15)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.25)'
              }}>
                <LogOut size={26} />
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px 0', color: '#fff', letterSpacing: '-0.2px' }}>
                Are you sure you want to logout?
              </h3>

              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                You will be signed out of your account on this device. You can sign back in anytime with your credentials.
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  style={{
                    flex: 1,
                    padding: '11px 18px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#cbd5e1',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmLogout}
                  style={{
                    flex: 1,
                    padding: '11px 18px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 18px rgba(239, 68, 68, 0.35)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* =========================================================================
   5. MAIN APP ROUTER (SAFEGUARDS & VIEW PERSISTENCE)
   ========================================================================= */
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard'); 
  const [activeChatFriend, setActiveChatFriend] = useState(null);
  const [activeParty, setActiveParty] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('scane_user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }

      const lastParty = localStorage.getItem('scane_current_active_party');
      if (lastParty) {
        setActiveParty(JSON.parse(lastParty));
      }
    } catch (e) {}
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('scane_user');
      localStorage.removeItem('scane_current_active_party');
    } catch (e) {}
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  const handleNavigate = (view) => {
    if (view === 'upload-movie') {
      setCurrentView('upload-movie');
    } else if (view === 'friends') {
      setCurrentView('friends');
    } else if (view === 'notifications') {
      setCurrentView('notifications');
    } else if (view === 'profile') {
      setCurrentView('profile');
    } else if (view === 'watch-movie' || view === 'watch-together') {
      setCurrentView('watch-together');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleOpenChat = (friend) => {
    setActiveChatFriend(friend);
    setCurrentView('chat');
  };

  const handleUpdateUser = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  const handleStartWatchParty = (partyData) => {
    setActiveParty(partyData);
    try {
      localStorage.setItem('scane_current_active_party', JSON.stringify(partyData));
    } catch (e) {}
    setCurrentView('watch-room');
  };

  const handlePlayDirectMovie = (movie) => {
    const directParty = {
      partyId: 'party_direct_' + Date.now(),
      hostUsername: currentUser?.username || 'user',
      hostName: currentUser?.name || currentUser?.username || 'User',
      movie: movie,
      invitedFriends: [],
      joinedMembers: [currentUser?.username || 'user'],
      createdAt: new Date().toISOString()
    };
    setActiveParty(directParty);
    try {
      localStorage.setItem('scane_current_active_party', JSON.stringify(directParty));
    } catch (e) {}
    setCurrentView('watch-room');
  };

  const handleAcceptPartyInvite = (notif) => {
    let joinedParty = null;
    try {
      if (notif.partyId) {
        const storedParty = JSON.parse(localStorage.getItem(`scane_active_party_${notif.partyId}`));
        if (storedParty) {
          joinedParty = {
            ...storedParty,
            joinedMembers: Array.from(new Set([...(storedParty.joinedMembers || []), currentUser?.username]))
          };
          localStorage.setItem(`scane_active_party_${notif.partyId}`, JSON.stringify(joinedParty));
        }
      }
    } catch (e) {}

    if (!joinedParty) {
      joinedParty = {
        partyId: notif.partyId || 'party_' + Date.now(),
        hostUsername: notif.actorUsername || 'friend',
        hostName: notif.actorName || 'Friend',
        movie: notif.movieData || { title: notif.movieTitle || 'Movie', format: 'HD', size: 'Cloud Video' },
        invitedFriends: [currentUser?.username],
        joinedMembers: [notif.actorUsername || 'host', currentUser?.username]
      };
    }

    setActiveParty(joinedParty);
    try {
      localStorage.setItem('scane_current_active_party', JSON.stringify(joinedParty));
    } catch (e) {}
    setCurrentView('watch-room');
  };

  const handleLeaveWatchRoom = () => {
    try {
      localStorage.removeItem('scane_current_active_party');
    } catch (e) {}
    setActiveParty(null);
    setCurrentView('dashboard');
  };

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentView === 'upload-movie') {
    return (
      <UploadMovie 
        onBack={() => setCurrentView('dashboard')}
        onUploadSuccess={() => setCurrentView('dashboard')}
      />
    );
  }

  if (currentView === 'watch-together') {
    return (
      <WatchTogether
        currentUser={currentUser}
        onBackToDashboard={() => setCurrentView('dashboard')}
        onNavigateToUpload={() => setCurrentView('upload-movie')}
        onStartParty={handleStartWatchParty}
      />
    );
  }

  if (currentView === 'friends') {
    return (
      <FriendsView 
        currentUser={currentUser}
        onBack={() => setCurrentView('dashboard')}
        onOpenChat={handleOpenChat}
      />
    );
  }

  if (currentView === 'chat') {
    return (
      <PersonalChatView
        currentUser={currentUser}
        activeFriend={activeChatFriend}
        onBack={() => setCurrentView('friends')}
      />
    );
  }

  if (currentView === 'notifications') {
    return (
      <NotificationsView
        currentUser={currentUser}
        onBack={() => setCurrentView('dashboard')}
        onNavigateToFriends={() => setCurrentView('friends')}
        onAcceptPartyInvite={handleAcceptPartyInvite}
      />
    );
  }

  if (currentView === 'profile') {
    return (
      <ProfileView
        currentUser={currentUser}
        onBack={() => setCurrentView('dashboard')}
        onUpdateUser={handleUpdateUser}
        onLogout={handleLogout}
      />
    );
  }

  if (currentView === 'watch-room') {
    return (
      <WatchRoomView
        currentUser={currentUser}
        activeParty={activeParty}
        onLeaveRoom={handleLeaveWatchRoom}
      />
    );
  }

  return (
    <Dashboard 
      user={currentUser}
      onLogout={handleLogout}
      onNavigate={handleNavigate}
      onPlayDirectMovie={handlePlayDirectMovie}
    />
  );
}
