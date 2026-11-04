import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  Crown, 
  Send, 
  MessageSquare, 
  MoreVertical, 
  Smile, 
  MicOff, 
  Mic, 
  Volume2, 
  VolumeX, 
  PhoneOff, 
  Radio, 
  UserX, 
  UserCheck 
} from 'lucide-react';

export default function WatchSidebar({ user, roomData, onRemoveMemberClick }) {
  // ================= 1. MEMBERS PANEL STATE =================
  const [members, setMembers] = useState([
    {
      id: 1,
      name: user?.username || 'Anmol',
      isHost: true,
      isCurrentUser: true,
      status: 'online',
      color: 'linear-gradient(135deg, #7864ff 0%, #4f46e5 100%)',
      isMuted: false
    },
    {
      id: 2,
      name: 'Kundan',
      isHost: false,
      isCurrentUser: false,
      status: 'online',
      color: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
      isMuted: false
    },
    {
      id: 3,
      name: 'Pranav',
      isHost: false,
      isCurrentUser: false,
      status: 'online',
      color: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
      isMuted: true
    },
    {
      id: 4,
      name: 'Rohan',
      isHost: false,
      isCurrentUser: false,
      status: 'offline',
      color: 'linear-gradient(135deg, #64748b 0%, #334155 100%)',
      isMuted: false
    }
  ]);

  const [activeMenuMemberId, setActiveMenuMemberId] = useState(null);

  const toggleMuteMember = (id) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isMuted: !m.isMuted } : m))
    );
    setActiveMenuMemberId(null);
  };

  // ================= 2. TEXT CHAT STATE =================
  const [messages, setMessages] = useState([
    {
      id: 'm1',
      sender: 'Kundan',
      text: 'Movie start karte hain?',
      time: '08:45 PM',
      isUser: false,
      color: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)'
    },
    {
      id: 'm2',
      sender: user?.username || 'You',
      text: 'Haan, sab ready hain 👍',
      time: '08:46 PM',
      isUser: true,
      color: 'linear-gradient(135deg, #7864ff 0%, #4f46e5 100%)'
    },
    {
      id: 'm3',
      sender: 'Pranav',
      text: 'Ready!',
      time: '08:46 PM',
      isUser: false,
      color: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)'
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const chatMessagesEndRef = useRef(null);
  const emojiList = ['😀', '😂', '❤️', '👍', '😎', '🔥', '🎬', '🍿'];

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: user?.username || 'You',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUser: true,
      color: 'linear-gradient(135deg, #7864ff 0%, #4f46e5 100%)'
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ================= 3. VOICE CHAT STATE & SIMULATION =================
  const [isVoiceConnected, setIsVoiceConnected] = useState(true);
  const [isMyMicMuted, setIsMyMicMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);

  // Dummy voice participants with speaking simulation
  const [voiceUsers, setVoiceUsers] = useState([
    { id: 1, name: user?.username || 'Anmol', isMe: true, isMuted: false, isSpeaking: false },
    { id: 2, name: 'Kundan', isMe: false, isMuted: false, isSpeaking: true },
    { id: 3, name: 'Pranav', isMe: false, isMuted: true, isSpeaking: false }
  ]);

  // Keep local user mic in sync with participant list
  useEffect(() => {
    setVoiceUsers((prev) =>
      prev.map((v) => (v.isMe ? { ...v, isMuted: isMyMicMuted } : v))
    );
  }, [isMyMicMuted]);

  // Periodic simulation of subtle speaking indicators for dummy peers
  useEffect(() => {
    if (!isVoiceConnected) return;
    const interval = setInterval(() => {
      setVoiceUsers((prev) =>
        prev.map((v) => {
          if (v.isMuted || !isVoiceConnected) return { ...v, isSpeaking: false };
          if (v.name === 'Kundan') return { ...v, isSpeaking: Math.random() > 0.4 };
          return v;
        })
      );
    }, 2400);
    return () => clearInterval(interval);
  }, [isVoiceConnected]);

  return (
    <aside className="scane-watch-sidebar">
      
      {/* 1. PEOPLE IN THIS ROOM */}
      <div className="scane-sidebar-card scane-members-card-interactive">
        <div className="scane-sidebar-card-header">
          <div className="scane-sidebar-title-group">
            <Users size={16} className="scane-sidebar-icon" />
            <h4 className="scane-sidebar-heading">People in this Room</h4>
          </div>
          <span className="scane-sidebar-badge">
            {members.length} / {roomData?.maxMembers || 6} Members
          </span>
        </div>

        <div className="scane-sidebar-members-list scrollable">
          {members.map((mem) => (
            <div key={mem.id} className="scane-sidebar-member-row interactive">
              <div className="scane-sb-avatar-wrap">
                <div className="scane-sb-avatar" style={{ background: mem.color }}>
                  {mem.name.charAt(0).toUpperCase()}
                </div>
                <span className={`scane-status-dot-mini ${mem.status}`} />
              </div>

              <div className="scane-sb-member-info">
                <div className="scane-sb-name-row">
                  <span className="scane-sb-name">{mem.name}</span>
                  {mem.isCurrentUser && <span className="scane-you-tag">You</span>}
                </div>
                <span className="scane-sb-role">
                  {mem.isMuted ? 'Muted' : mem.status === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>

              {mem.isHost && (
                <span className="scane-host-badge" style={{ marginRight: 4 }}>
                  <Crown size={11} />
                  <span>Host</span>
                </span>
              )}

              {!mem.isCurrentUser && (
                <div className="scane-member-menu-wrapper">
                  <button 
                    type="button" 
                    className="scane-btn-member-more"
                    onClick={() => setActiveMenuMemberId(activeMenuMemberId === mem.id ? null : mem.id)}
                    aria-label="Member options"
                  >
                    <MoreVertical size={14} />
                  </button>

                  {activeMenuMemberId === mem.id && (
                    <div className="scane-member-dropdown-popover">
                      <button 
                        type="button" 
                        className="scane-popover-item"
                        onClick={() => {
                          alert(`Profile details for ${mem.name} (Frontend Demo)`);
                          setActiveMenuMemberId(null);
                        }}
                      >
                        <UserCheck size={14} />
                        <span>View Profile</span>
                      </button>
                      
                      <button 
                        type="button" 
                        className="scane-popover-item"
                        onClick={() => toggleMuteMember(mem.id)}
                      >
                        <MicOff size={14} />
                        <span>{mem.isMuted ? 'Unmute' : 'Mute'}</span>
                      </button>
                      
                      <button 
                        type="button" 
                        className="scane-popover-item danger"
                        onClick={() => {
                          onRemoveMemberClick(mem);
                          setActiveMenuMemberId(null);
                        }}
                      >
                        <UserX size={14} />
                        <span>Remove from Room</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2. TEXT CHAT */}
      <div className="scane-sidebar-card scane-sidebar-chat-active">
        <div className="scane-sidebar-card-header">
          <div className="scane-sidebar-title-group">
            <MessageSquare size={16} className="scane-sidebar-icon" />
            <div>
              <h4 className="scane-sidebar-heading">Text Chat</h4>
              <span className="scane-chat-subtitle">Chat with everyone in the room</span>
            </div>
          </div>
          <span className="scane-sidebar-pill-sm">Live</span>
        </div>

        <div className="scane-chat-messages-area">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`scane-chat-bubble-row ${msg.isUser ? 'current-user' : 'other-user'}`}
            >
              {!msg.isUser && (
                <div className="scane-chat-avatar" style={{ background: msg.color }}>
                  {msg.sender.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="scane-chat-bubble-content">
                <div className="scane-chat-meta">
                  <span className="scane-chat-sender-name">{msg.sender}</span>
                  <span className="scane-chat-time">{msg.time}</span>
                </div>
                <div className={`scane-chat-bubble ${msg.isUser ? 'me' : 'them'}`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatMessagesEndRef} />
        </div>

        <div className="scane-chat-footer-composer">
          {showEmojiPicker && (
            <div className="scane-emoji-popover">
              <div className="scane-emoji-grid">
                {emojiList.map((emoji) => (
                  <button 
                    key={emoji} 
                    type="button" 
                    className="scane-emoji-btn"
                    onClick={() => setInputText((prev) => prev + emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="scane-chat-input-wrapper">
            <button 
              type="button" 
              className={`scane-chat-emoji-trigger ${showEmojiPicker ? 'active' : ''}`}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile size={18} />
            </button>

            <textarea
              className="scane-chat-textarea"
              rows={1}
              placeholder="Type a message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <button 
              type="button" 
              className="scane-chat-send-btn"
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. VOICE CHAT PANEL (PART 3) */}
      <div className="scane-sidebar-card scane-voice-chat-card">
        <div className="scane-sidebar-card-header">
          <div className="scane-sidebar-title-group">
            <Radio size={16} className={`scane-sidebar-icon ${isVoiceConnected ? 'voice-glowing' : ''}`} />
            <div>
              <div className="scane-voice-title-row">
                <h4 className="scane-sidebar-heading">Voice Chat</h4>
                {isVoiceConnected ? (
                  <span className="scane-voice-connected-chip">
                    <span className="scane-voice-pulse-dot" /> Connected
                  </span>
                ) : (
                  <span className="scane-voice-disconnected-chip">Disconnected</span>
                )}
              </div>
              <span className="scane-chat-subtitle">
                {isVoiceConnected 
                  ? "You can talk with everyone while watching." 
                  : "Voice channel disconnected. Click join to reconnect."}
              </span>
            </div>
          </div>
        </div>

        {/* Voice Participants List */}
        <div className="scane-voice-participants-list">
          {voiceUsers.map((p) => (
            <div 
              key={p.id} 
              className={`scane-voice-participant-pill ${p.isSpeaking && isVoiceConnected ? 'speaking' : ''}`}
            >
              <div className="scane-voice-user-info">
                <div className="scane-voice-avatar">
                  {p.name.charAt(0).toUpperCase()}
                  {p.isSpeaking && isVoiceConnected && <span className="scane-voice-wave-ring" />}
                </div>
                <span className="scane-voice-name">
                  {p.name} {p.isMe && <span className="scane-voice-you-tag">(You)</span>}
                </span>
              </div>

              <div className="scane-voice-status-icon">
                {!isVoiceConnected ? (
                  <span className="scane-voice-idle-dot" />
                ) : p.isMuted ? (
                  <MicOff size={13} className="scane-voice-mic-muted" />
                ) : p.isSpeaking ? (
                  <Mic size={13} className="scane-voice-mic-speaking" />
                ) : (
                  <Mic size={13} className="scane-voice-mic-open" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Voice Controls Bar */}
        <div className="scane-voice-controls-bar">
          {isVoiceConnected ? (
            <>
              {/* Mic Toggle */}
              <button 
                type="button" 
                className={`scane-voice-btn ${isMyMicMuted ? 'muted' : 'active'}`}
                onClick={() => setIsMyMicMuted(!isMyMicMuted)}
              >
                {isMyMicMuted ? <MicOff size={15} /> : <Mic size={15} />}
                <span>{isMyMicMuted ? 'Muted' : 'Mic On'}</span>
              </button>

              {/* Speaker Toggle */}
              <button 
                type="button" 
                className={`scane-voice-btn ${isSpeakerMuted ? 'muted' : 'active'}`}
                onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
              >
                {isSpeakerMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                <span>{isSpeakerMuted ? 'Deafened' : 'Speaker'}</span>
              </button>

              {/* Leave Voice */}
              <button 
                type="button" 
                className="scane-voice-btn danger"
                onClick={() => setIsVoiceConnected(false)}
                title="Disconnect Voice"
              >
                <PhoneOff size={15} />
                <span>Disconnect</span>
              </button>
            </>
          ) : (
            <button 
              type="button" 
              className="scane-voice-btn connect-full"
              onClick={() => setIsVoiceConnected(true)}
            >
              <Radio size={14} />
              <span>Join Voice Chat</span>
            </button>
          )}
        </div>
      </div>

    </aside>
  );
}