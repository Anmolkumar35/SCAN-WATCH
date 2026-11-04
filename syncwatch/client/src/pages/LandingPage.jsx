import React, { useState, useEffect } from 'react';

export default function LandingPage({ onJoinRoom }) {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');

  // URL me invite link aane par Room ID auto-fill hogi
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomId(roomParam.trim());
    }
  }, []);

  const handleStart = (e) => {
    e.preventDefault();
    const cleanUser = username.trim();
    if (!cleanUser) {
      return alert('Pehle apna naam enter karo!');
    }

    // Agar user ne manually ID likhi hai toh wahi use karo
    let targetRoom = roomId.trim().toLowerCase();
    
    // Agar khali chhoda hai tabhi random banao
    if (!targetRoom) {
      targetRoom = Math.random().toString(36).substring(2, 8);
    }

    if (onJoinRoom) {
      onJoinRoom(targetRoom, cleanUser);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0b1120', color: '#fff', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#1e293b', padding: '36px 32px', borderRadius: '16px', width: '360px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid #334155' }}>
        
        <h1 style={{ textAlign: 'center', fontSize: '26px', margin: '0 0 6px 0', color: '#38bdf8', fontWeight: 'bold' }}>SyncWatch</h1>
        <p style={{ textAlign: 'center', color: '#94a3b8', margin: '0 0 24px 0', fontSize: '13px' }}>Watch videos together in real-time</p>

        <form onSubmit={handleStart}>
          {/* Username Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#cbd5e1' }}>Your Name</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              required
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#fff', boxSizing: 'border-box', outline: 'none', fontSize: '14px' }}
            />
          </div>

          {/* Room ID Input */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#cbd5e1' }}>
              Room ID <span style={{ color: '#64748b', fontSize: '11px' }}>(Optional)</span>
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="e.g. room123 (Leave empty for new)"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#fff', boxSizing: 'border-box', outline: 'none', fontSize: '14px' }}
            />
          </div>

          {/* Single Smart Action Button */}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              background: roomId.trim() ? '#059669' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'background 0.2s',
            }}
          >
            {roomId.trim() ? `Join Room "${roomId.trim()}"` : 'Create Random Room'}
          </button>
        </form>

      </div>
    </div>
  );
}