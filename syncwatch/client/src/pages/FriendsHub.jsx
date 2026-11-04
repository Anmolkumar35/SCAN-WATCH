import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  MessageSquare, 
  Search, 
  Send, 
  ArrowLeft,
  Check,
  X
} from 'lucide-react';
import { getStoredUsers } from '../utils/socialState';
import '../index.css';

export default function FriendsHub({ 
  user, 
  socialData, 
  onUpdateSocial, 
  onBackToDashboard,
  defaultChatFriend = null
}) {
  const [activeTab, setActiveTab] = useState(defaultChatFriend ? 'chat' : 'friends'); // 'friends' | 'chat' | 'requests'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChatUser, setSelectedChatUser] = useState(defaultChatFriend || socialData.friends[0] || null);
  const [messageText, setMessageText] = useState('');

  const allRegistered = getStoredUsers().filter(u => u.username !== user.username);

  // Search Results
  const searchResults = searchQuery.trim() 
    ? allRegistered.filter(u => u.username.includes(searchQuery.trim().toLowerCase()))
    : [];

  const handleSendRequest = (targetUsername) => {
    if (socialData.friends.includes(targetUsername) || socialData.outgoingRequests.includes(targetUsername)) return;
    
    const updated = {
      ...socialData,
      outgoingRequests: [...socialData.outgoingRequests, targetUsername]
    };
    onUpdateSocial(updated);
  };

  const handleAcceptRequest = (requestUser) => {
    const updated = {
      ...socialData,
      friends: [...socialData.friends, requestUser],
      incomingRequests: socialData.incomingRequests.filter(u => u !== requestUser),
      notifications: socialData.notifications.filter(n => n.from !== requestUser)
    };
    onUpdateSocial(updated);
  };

  const handleRejectRequest = (requestUser) => {
    const updated = {
      ...socialData,
      incomingRequests: socialData.incomingRequests.filter(u => u !== requestUser),
      notifications: socialData.notifications.filter(n => n.from !== requestUser)
    };
    onUpdateSocial(updated);
  };

  const handleRemoveFriend = (friendUser) => {
    const updated = {
      ...socialData,
      friends: socialData.friends.filter(u => u !== friendUser)
    };
    if (selectedChatUser === friendUser) {
      setSelectedChatUser(updated.friends[0] || null);
    }
    onUpdateSocial(updated);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChatUser) return;

    const chatHistory = socialData.directMessages[selectedChatUser] || [];
    const newMsg = {
      sender: user.username,
      text: messageText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = {
      ...socialData,
      directMessages: {
        ...socialData.directMessages,
        [selectedChatUser]: [...chatHistory, newMsg]
      }
    };

    onUpdateSocial(updated);
    setMessageText('');
  };

  const currentChatMessages = selectedChatUser ? (socialData.directMessages[selectedChatUser] || []) : [];

  return (
    <div className="scane-dashboard-viewport" style={{ minHeight: '100vh', padding: '24px', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button 
          type="button" 
          onClick={onBackToDashboard}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#cbd5e1',
            padding: '8px 14px',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} />
          <span>Dashboard</span>
        </button>

        <div style={{ display: 'flex', gap: '8px', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button 
            type="button" 
            onClick={() => setActiveTab('friends')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: activeTab === 'friends' ? '#7864ff' : 'transparent',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            Friends ({socialData.friends.length})
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab('chat')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: activeTab === 'chat' ? '#7864ff' : 'transparent',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            Direct Messages
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab('requests')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: activeTab === 'requests' ? '#7864ff' : 'transparent',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            Requests ({socialData.incomingRequests.length})
          </button>
        </div>

        <div className="scane-logo-text" style={{ fontSize: 20 }}>
          <span>Scane</span>
          <span className="scane-logo-accent">Watch</span>
        </div>
      </div>

      {/* VIEW 1: FRIENDS LIST & SEARCH */}
      {activeTab === 'friends' && (
        <div style={{ maxWidth: '820px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Search by username */}
          <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: '16px', color: '#fff', margin: '0 0 12px 0' }}>Find Friends by Username</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                <input 
                  type="text" 
                  placeholder="Type exact username (e.g. kundan, pranav)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 38px',
                    background: 'rgba(5, 8, 20, 0.7)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Search list display */}
            {searchQuery && (
              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {searchResults.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '13px' }}>No user found matching "@{searchQuery}"</p>
                ) : (
                  searchResults.map((userResult) => {
                    const isFriend = socialData.friends.includes(userResult.username);
                    const isRequested = socialData.outgoingRequests.includes(userResult.username);
                    return (
                      <div key={userResult.username} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                        <div>
                          <span style={{ color: '#fff', fontWeight: 600 }}>@{userResult.username}</span>
                          <span style={{ color: '#94a3b8', fontSize: '12px', marginLeft: '8px' }}>({userResult.name})</span>
                        </div>
                        {isFriend ? (
                          <span style={{ fontSize: '12px', color: '#10b981' }}>Friend ✓</span>
                        ) : isRequested ? (
                          <span style={{ fontSize: '12px', color: '#a78bfa' }}>Requested</span>
                        ) : (
                          <button 
                            type="button" 
                            onClick={() => handleSendRequest(userResult.username)}
                            style={{ padding: '6px 12px', borderRadius: '6px', background: '#7864ff', border: 'none', color: '#fff', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <UserPlus size={14} /> Send Request
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Current Friends */}
          <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: '16px', color: '#fff', margin: '0 0 16px 0' }}>Your Friends ({socialData.friends.length})</h3>
            {socialData.friends.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>You have not added any friends yet. Use search above to find them.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                {socialData.friends.map((fUsername) => (
                  <div key={fUsername} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#7864ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '13px' }}>
                        {fUsername.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ color: '#fff', fontWeight: 600 }}>@{fUsername}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        type="button"
                        onClick={() => { setSelectedChatUser(fUsername); setActiveTab('chat'); }}
                        style={{ padding: '6px 10px', background: 'rgba(120, 100, 255, 0.2)', border: 'none', borderRadius: '6px', color: '#c4b5fd', cursor: 'pointer' }}
                        title="Direct Message"
                      >
                        <MessageSquare size={14} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleRemoveFriend(fUsername)}
                        style={{ padding: '6px 10px', background: 'rgba(239, 68, 68, 0.15)', border: 'none', borderRadius: '6px', color: '#f87171', cursor: 'pointer' }}
                        title="Remove Friend"
                      >
                        <UserX size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: DIRECT PRIVATE 1-ON-1 CHAT */}
      {activeTab === 'chat' && (
        <div style={{ maxWidth: '960px', width: '100%', height: '70vh', margin: '0 auto', display: 'grid', gridTemplateColumns: '260px 1fr', background: 'rgba(15, 23, 42, 0.85)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          
          {/* Friend Selector Sidebar */}
          <div style={{ borderRight: '1px solid rgba(255,255,255,0.08)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Friends Chat</span>
            {socialData.friends.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '13px' }}>Add friends to chat</p>
            ) : (
              socialData.friends.map((fUsername) => (
                <div 
                  key={fUsername}
                  onClick={() => setSelectedChatUser(fUsername)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: selectedChatUser === fUsername ? 'rgba(120, 100, 255, 0.2)' : 'transparent',
                    color: selectedChatUser === fUsername ? '#fff' : '#cbd5e1',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#7864ff', color: '#fff', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {fUsername.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>@{fUsername}</span>
                </div>
              ))
            )}
          </div>

          {/* Conversation Screen */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {selectedChatUser ? (
              <>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#fff', fontWeight: 700 }}>Chat with @{selectedChatUser}</span>
                </div>

                <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {currentChatMessages.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#64748b', fontSize: '13px' }}>Say hi to @{selectedChatUser}!</p>
                  ) : (
                    currentChatMessages.map((msg, idx) => {
                      const isMe = msg.sender === user.username;
                      return (
                        <div key={idx} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                          <div style={{
                            padding: '10px 14px',
                            borderRadius: '12px',
                            background: isMe ? '#7864ff' : 'rgba(255,255,255,0.06)',
                            color: '#fff',
                            fontSize: '13px'
                          }}>
                            {msg.text}
                          </div>
                          <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', display: 'block', textAlign: isMe ? 'right' : 'left' }}>
                            {msg.time}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleSendMessage} style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    placeholder={`Message @${selectedChatUser}...`}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    style={{ flex: 1, padding: '10px 14px', background: 'rgba(5, 8, 20, 0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                  <button type="submit" style={{ padding: '10px 16px', background: '#7864ff', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>
                    <Send size={16} />
                  </button>
                </form>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                Select a friend to begin chatting
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: INCOMING REQUESTS */}
      {activeTab === 'requests' && (
        <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto', background: 'rgba(15, 23, 42, 0.85)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ fontSize: '16px', color: '#fff', margin: '0 0 16px 0' }}>Friend Requests</h3>
          {socialData.incomingRequests.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>No pending friend requests.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {socialData.incomingRequests.map((reqUser) => (
                <div key={reqUser} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                  <span style={{ color: '#fff', fontWeight: 600 }}>@{reqUser} wants to be friends</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      type="button" 
                      onClick={() => handleAcceptRequest(reqUser)}
                      style={{ padding: '6px 12px', background: '#10b981', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Check size={14} /> Accept
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleRejectRequest(reqUser)}
                      style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.2)', border: 'none', borderRadius: '6px', color: '#f87171', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <X size={14} /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}