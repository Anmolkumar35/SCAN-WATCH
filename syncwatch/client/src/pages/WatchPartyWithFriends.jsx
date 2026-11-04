import React, { useState } from 'react';
import { 
  Film, 
  Users, 
  ArrowLeft, 
  Check, 
  Play, 
  Plus, 
  CheckCircle2, 
  UserMinus 
} from 'lucide-react';
import '../index.css';

export default function WatchPartyWithFriends({ 
  user, 
  uploadedMovies = [], 
  friendsList = [],
  onBackToDashboard, 
  onNavigateToUpload, 
  onStartWatchRoom 
}) {
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [invitedFriends, setInvitedFriends] = useState([]);

  const toggleFriend = (friendUsername) => {
    if (invitedFriends.includes(friendUsername)) {
      setInvitedFriends(invitedFriends.filter((f) => f !== friendUsername));
    } else {
      setInvitedFriends([...invitedFriends, friendUsername]);
    }
  };

  const handleKickFriend = (friendUsername) => {
    setInvitedFriends(invitedFriends.filter((f) => f !== friendUsername));
  };

  const handleLaunchWatchRoom = () => {
    if (!selectedMovie) return;

    const partyData = {
      partyId: `WP-${Date.now().toString().slice(-4)}`,
      movie: selectedMovie,
      host: user.username,
      participants: [user.username, ...invitedFriends]
    };

    onStartWatchRoom(partyData);
  };

  return (
    <div className="scane-dashboard-viewport" style={{ minHeight: '100vh', padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Header */}
      <div style={{ width: '100%', maxWidth: '840px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <button 
          type="button" 
          onClick={onBackToDashboard}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#cbd5e1', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>

        <div className="scane-logo-text" style={{ fontSize: 20 }}>
          <span>Scane</span>
          <span className="scane-logo-accent">Watch</span>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: '840px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* STEP 1: MY UPLOADED MOVIES */}
        <section style={{ background: 'rgba(15, 23, 42, 0.85)', borderRadius: '20px', padding: '28px', border: '1px solid rgba(255,255,255,0.09)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '18px', color: '#fff', margin: '0 0 4px 0' }}>1. My Uploaded Movies</h2>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Select a movie from your uploaded collection</p>
            </div>
            <button 
              type="button"
              onClick={onNavigateToUpload}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'rgba(120, 100, 255, 0.15)', border: '1px solid rgba(120, 100, 255, 0.3)', color: '#c4b5fd', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
            >
              <Plus size={14} /> Upload New Movie
            </button>
          </div>

          {uploadedMovies.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 10px 0' }}>No movies found in your uploads.</p>
              <button 
                type="button" 
                onClick={onNavigateToUpload}
                style={{ padding: '8px 16px', background: '#7864ff', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', cursor: 'pointer' }}
              >
                Upload Movie Now
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
              {uploadedMovies.map((movie) => {
                const isSelected = selectedMovie?.id === movie.id;
                return (
                  <div 
                    key={movie.id}
                    onClick={() => setSelectedMovie(movie)}
                    style={{
                      background: isSelected ? 'rgba(120, 100, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1px solid #7864ff' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <Film size={18} color="#a78bfa" />
                      <span style={{ fontSize: '11px', color: '#34d399' }}>Ready ✓</span>
                    </div>
                    <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {movie.title?.split('.')[0] || movie.title}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{movie.format || 'MP4'} • {movie.size || '2.4 GB'}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* STEP 2: SELECT & INVITE FRIENDS */}
        <section style={{ background: 'rgba(15, 23, 42, 0.85)', borderRadius: '20px', padding: '28px', border: '1px solid rgba(255,255,255,0.09)', opacity: selectedMovie ? 1 : 0.6 }}>
          <h2 style={{ fontSize: '18px', color: '#fff', margin: '0 0 4px 0' }}>2. Select Friends</h2>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 16px 0' }}>Pick friends to invite to this stream</p>

          {friendsList.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '13px' }}>No friends added yet. Add friends from the Friends & DMs section.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {friendsList.map((fUsername) => {
                const isSelected = invitedFriends.includes(fUsername);
                return (
                  <div 
                    key={fUsername}
                    onClick={() => toggleFriend(fUsername)}
                    style={{
                      background: isSelected ? 'rgba(120, 100, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1px solid #7864ff' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>@{fUsername}</span>
                    <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: isSelected ? '#7864ff' : 'transparent', border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isSelected && <Check size={12} color="#fff" strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Invited List & Kick Option */}
          {invitedFriends.length > 0 && (
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                INVITED FRIENDS (HOST CAN REMOVE)
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {invitedFriends.map((fUsername) => (
                  <div key={fUsername} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: '8px' }}>
                    <span style={{ color: '#fff', fontSize: '12px' }}>@{fUsername}</span>
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); handleKickFriend(fUsername); }}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                      title="Remove Friend"
                    >
                      <UserMinus size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LAUNCH WATCH ROOM */}
          <button 
            type="button"
            disabled={!selectedMovie}
            onClick={handleLaunchWatchRoom}
            style={{
              width: '100%',
              marginTop: '24px',
              padding: '14px',
              borderRadius: '12px',
              background: !selectedMovie ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #7864ff 0%, #4f46e5 100%)',
              color: !selectedMovie ? '#64748b' : '#fff',
              border: 'none',
              fontWeight: 700,
              cursor: !selectedMovie ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Play size={18} fill="#fff" />
            <span>Start Watch Room</span>
          </button>
        </section>

      </div>
    </div>
  );
}