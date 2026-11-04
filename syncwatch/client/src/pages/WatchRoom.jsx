import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Settings, 
  LogOut, 
  Users, 
  AlertTriangle,
  Sliders,
  Check,
  Shield,
  RefreshCw,
  Film
} from 'lucide-react';
import WatchSidebar from './WatchSidebar';
import '../index.css';

export default function WatchRoom({ user, roomData, onLeaveToDashboard }) {
  // ================= 1. VIDEO PLAYER STATES =================
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(8130);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState('1080p');

  // Simulated Syncing state (briefly displays "Syncing..." on player interaction)
  const [isSyncing, setIsSyncing] = useState(false);
  const syncTimeoutRef = useRef(null);

  const triggerSimulatedSync = () => {
    setIsSyncing(true);
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      setIsSyncing(false);
    }, 1100);
  };

  // Modals & Settings
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);

  // Room Settings Toggles (Frontend state)
  const [autoSync, setAutoSync] = useState(true);
  const [voiceChatEnabled, setVoiceChatEnabled] = useState(true);
  const [roomPrivacy, setRoomPrivacy] = useState('Private');
  const [allowMemberControl, setAllowMemberControl] = useState(true);

  const playerContainerRef = useRef(null);
  const videoRef = useRef(null);

  const roomName = roomData?.roomName || 'Friday Movie Night';
  const roomCode = roomData?.roomId || 'SCN-4821';
  const movieTitle = roomData?.movie?.title || 'Interstellar.2014.1080p.BluRay.x264.mp4';
  const localVideoUrl = roomData?.movieUrl || null;

  const formatTime = (seconds) => {
    const sec = Math.floor(seconds);
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
    triggerSimulatedSync();
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) videoRef.current.currentTime = newTime;
    triggerSimulatedSync();
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div className="scane-dashboard-viewport scane-watch-room-viewport">
      
      {/* 1. COMPACT TOP HEADER */}
      <header className="scane-dash-nav scane-watch-nav">
        <div className="scane-watch-nav-left">
          <div className="scane-logo-container" style={{ margin: 0 }}>
            <div className="scane-logo-icon-wrap" style={{ width: 34, height: 34 }}>
              <div className="scane-logo-play-shape" style={{ width: 13, height: 13 }} />
            </div>
            <div className="scane-logo-text" style={{ fontSize: 20 }}>
              <span>Scane</span>
              <span className="scane-logo-accent">Watch</span>
            </div>
          </div>
          <span className="scane-nav-tagline">Watch Together</span>
        </div>

        <div className="scane-watch-nav-center">
          <span className="scane-watch-room-name">{roomName}</span>
          <span className="scane-watch-room-badge">{roomCode}</span>
        </div>

        <div className="scane-watch-nav-right">
          <div className="scane-nav-member-chip">
            <Users size={14} />
            <span>3/6 Members</span>
          </div>

          {/* Room Settings Button */}
          <button 
            type="button" 
            className={`scane-btn-room-settings ${showSettingsModal ? 'active' : ''}`}
            onClick={() => setShowSettingsModal(true)}
            title="Room Settings"
          >
            <Sliders size={15} />
            <span>Room Settings</span>
          </button>

          {/* Leave Room Button */}
          <button 
            type="button" 
            className="scane-btn-leave-room scane-btn-leave-compact"
            onClick={() => setShowLeaveModal(true)}
          >
            <LogOut size={15} />
            <span>Leave Room</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN GRID (PLAYER + SIDEBAR) */}
      <main className="scane-watch-main-grid">
        
        {/* LEFT COLUMN: MOVIE PLAYER SECTION */}
        <section className="scane-watch-player-section">
          <div 
            ref={playerContainerRef} 
            className={`scane-player-container ${isFullscreen ? 'fullscreen' : ''}`}
          >
            {localVideoUrl ? (
              <video 
                ref={videoRef}
                src={localVideoUrl}
                className="scane-player-video-element"
                onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                onClick={togglePlay}
              />
            ) : (
              <div className="scane-dummy-canvas" onClick={togglePlay}>
                <div className="scane-cinema-light" />
              </div>
            )}

            {/* Center Play/Pause Overlay */}
            <div 
              className={`scane-center-play-overlay ${isPlaying ? 'fade-out' : 'visible'}`}
              onClick={togglePlay}
            >
              <div className="scane-center-play-btn">
                {isPlaying ? <Pause size={38} /> : <Play size={38} style={{ marginLeft: 4 }} />}
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="scane-player-overlay-bottom">
              <div className="scane-player-movie-info">
                <span className="scane-player-title" title={movieTitle}>
                  {movieTitle.replace(/\.(mp4|mkv|webm|mov)$/i, '')}
                </span>

                {/* Simulated Sync Status Badge */}
                <span className={`scane-player-status-badge ${isSyncing ? 'syncing' : 'synced'}`}>
                  {isSyncing ? (
                    <>
                      <RefreshCw size={12} className="spin-icon" /> Syncing...
                    </>
                  ) : (
                    <>
                      <Check size={12} /> Synced
                    </>
                  )}
                </span>
              </div>

              <div className="scane-controls-bar">
                <div className="scane-seek-container">
                  <input 
                    type="range" 
                    min={0} 
                    max={duration || 100} 
                    step={1}
                    value={currentTime} 
                    onChange={handleSeek}
                    className="scane-seek-bar"
                    style={{
                      background: `linear-gradient(to right, #7864ff ${(currentTime / (duration || 1)) * 100}%, rgba(255, 255, 255, 0.15) ${(currentTime / (duration || 1)) * 100}%)`
                    }}
                  />
                </div>

                <div className="scane-controls-row">
                  <div className="scane-ctrl-left">
                    <button type="button" onClick={togglePlay} className="scane-ctrl-btn">
                      {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <div className="scane-time-display">
                      <span className="scane-time-current">{formatTime(currentTime)}</span>
                      <span className="scane-time-sep">/</span>
                      <span className="scane-time-duration">{formatTime(duration)}</span>
                    </div>
                    <div className="scane-volume-group">
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsMuted(!isMuted);
                          if (videoRef.current) videoRef.current.muted = !isMuted;
                        }} 
                        className="scane-ctrl-btn"
                      >
                        {isMuted || volume === 0 ? <VolumeX size={19} /> : <Volume2 size={19} />}
                      </button>
                      <input 
                        type="range" 
                        min={0} 
                        max={1} 
                        step={0.05} 
                        value={isMuted ? 0 : volume} 
                        onChange={handleVolumeChange} 
                        className="scane-volume-slider" 
                      />
                    </div>
                  </div>

                  <div className="scane-ctrl-right">
                    <button 
                      type="button" 
                      className="scane-ctrl-pill-btn"
                      onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 1.25 : playbackSpeed === 1.25 ? 1.5 : 1)}
                    >
                      {playbackSpeed}x
                    </button>

                    <button 
                      type="button" 
                      className="scane-ctrl-pill-btn"
                      onClick={() => setQuality(quality === '1080p' ? '4K' : quality === '4K' ? '720p' : '1080p')}
                    >
                      {quality}
                    </button>

                    <button type="button" onClick={toggleFullscreen} className="scane-ctrl-btn">
                      {isFullscreen ? <Minimize size={19} /> : <Maximize size={19} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sync Status & Playback Permission Banner */}
          <div className="scane-sync-banner-card">
            <div className="scane-sync-status-indicator">
              <span className={`scane-live-dot ${isSyncing ? 'pulsing-yellow' : ''}`} />
              <span className="scane-sync-status-title">
                {isSyncing ? 'Synchronizing Playback...' : 'Everyone is watching together'}
              </span>
            </div>
            <p className="scane-sync-status-desc">
              {allowMemberControl 
                ? 'Playback controlled by everyone. Any member can play, pause, or seek.'
                : 'Host-only playback control is currently active.'}
            </p>
          </div>
        </section>

        {/* RIGHT COLUMN: MEMBERS + CHAT + VOICE */}
        <WatchSidebar 
          user={user} 
          roomData={roomData} 
          onRemoveMemberClick={(mem) => setMemberToRemove(mem)} 
        />
      </main>

      {/* MODAL 1: ROOM SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="scane-modal-backdrop" onClick={() => setShowSettingsModal(false)}>
          <div className="scane-modal-card scane-room-settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="scane-modal-header-simple">
              <div className="scane-modal-icon-wrap primary">
                <Sliders size={20} />
              </div>
              <div>
                <h3 className="scane-modal-title">Room Settings</h3>
                <p className="scane-modal-subtext">Configure playback and party options</p>
              </div>
            </div>

            <div className="scane-settings-toggle-list">
              {/* Auto Sync */}
              <div className="scane-settings-item">
                <div className="scane-st-info">
                  <span className="scane-st-label">Auto Sync</span>
                  <span className="scane-st-hint">Keep everyone's playback timestamps locked</span>
                </div>
                <button 
                  type="button" 
                  className={`scane-toggle-switch ${autoSync ? 'active' : ''}`}
                  onClick={() => setAutoSync(!autoSync)}
                >
                  <span className="scane-toggle-slider" />
                </button>
              </div>

              {/* Voice Chat */}
              <div className="scane-settings-item">
                <div className="scane-st-info">
                  <span className="scane-st-label">Voice Chat</span>
                  <span className="scane-st-hint">Allow voice audio inside this party</span>
                </div>
                <button 
                  type="button" 
                  className={`scane-toggle-switch ${voiceChatEnabled ? 'active' : ''}`}
                  onClick={() => setVoiceChatEnabled(!voiceChatEnabled)}
                >
                  <span className="scane-toggle-slider" />
                </button>
              </div>

              {/* Allow Members to Control Playback */}
              <div className="scane-settings-item">
                <div className="scane-st-info">
                  <span className="scane-st-label">Member Playback Control</span>
                  <span className="scane-st-hint">Allow members to pause, play, and seek</span>
                </div>
                <button 
                  type="button" 
                  className={`scane-toggle-switch ${allowMemberControl ? 'active' : ''}`}
                  onClick={() => setAllowMemberControl(!allowMemberControl)}
                >
                  <span className="scane-toggle-slider" />
                </button>
              </div>

              {/* Room Privacy */}
              <div className="scane-settings-item">
                <div className="scane-st-info">
                  <span className="scane-st-label">Room Privacy</span>
                  <span className="scane-st-hint">Requires room invite code to enter</span>
                </div>
                <button 
                  type="button" 
                  className="scane-mini-pill active"
                  onClick={() => setRoomPrivacy(roomPrivacy === 'Private' ? 'Public' : 'Private')}
                >
                  {roomPrivacy}
                </button>
              </div>

              {/* Playback Quality */}
              <div className="scane-settings-item">
                <div className="scane-st-info">
                  <span className="scane-st-label">Stream Quality</span>
                  <span className="scane-st-hint">Default adaptive rendering bitrate</span>
                </div>
                <div className="scane-menu-pills">
                  {['Auto', '720p', '1080p'].map((q) => (
                    <button 
                      key={q}
                      type="button" 
                      className={`scane-mini-pill ${quality === q ? 'active' : ''}`}
                      onClick={() => setQuality(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="scane-modal-actions" style={{ marginTop: 22 }}>
              <button 
                type="button" 
                className="scane-modal-btn cancel"
                style={{ width: '100%' }}
                onClick={() => setShowSettingsModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REMOVE MEMBER CONFIRMATION */}
      {memberToRemove && (
        <div className="scane-modal-backdrop">
          <div className="scane-modal-card">
            <div className="scane-modal-icon-wrap danger">
              <AlertTriangle size={24} />
            </div>
            <h3 className="scane-modal-title">Remove Member?</h3>
            <p className="scane-modal-desc">
              Are you sure you want to remove <strong style={{ color: '#fff' }}>{memberToRemove.name}</strong> from this watch party?
            </p>
            <div className="scane-modal-actions">
              <button 
                type="button" 
                className="scane-modal-btn cancel"
                onClick={() => setMemberToRemove(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="scane-modal-btn leave"
                onClick={() => setMemberToRemove(null)}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: LEAVE WATCH ROOM CONFIRMATION */}
      {showLeaveModal && (
        <div className="scane-modal-backdrop">
          <div className="scane-modal-card">
            <div className="scane-modal-icon-wrap danger">
              <LogOut size={26} />
            </div>
            <h3 className="scane-modal-title">Leave Watch Room?</h3>
            <p className="scane-modal-desc">
              Are you sure you want to leave this watch party? You will return to your personal dashboard.
            </p>
            <div className="scane-modal-actions">
              <button 
                type="button" 
                className="scane-modal-btn cancel"
                onClick={() => setShowLeaveModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="scane-modal-btn leave"
                onClick={onLeaveToDashboard}
              >
                Leave Room
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
} 