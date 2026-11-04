import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Film, 
  Users, 
  Play, 
  Check, 
  CheckSquare, 
  Square, 
  Sparkles 
} from 'lucide-react';
import '../index.css';

export default function WatchTogether({ currentUser, onBackToDashboard, onNavigateToUpload, onStartParty }) {
  const currentUsername = (currentUser?.username || 'anmol').toLowerCase();
  const currentDisplayName = currentUser?.name || currentUser?.username || 'Anmol';

  const [step, setStep] = useState(1);
  const [movies, setMovies] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedFriends, setSelectedFriends] = useState([]);

  useEffect(() => {
    try {
      const storedMovies = JSON.parse(localStorage.getItem('scane_uploaded_movies')) || [];
      setMovies(storedMovies);
    } catch (e) {
      setMovies([]);
    }

    try {
      const storedFriends = JSON.parse(localStorage.getItem('scane_friends_' + currentUsername)) || [];
      if (storedFriends.length > 0) {
        setFriends(storedFriends);
      } else {
        const seedFriends = [
          { id: 'u_1', username: 'rohit_99', name: 'Rohit Kumar', isOnline: true },
          { id: 'u_3', username: 'vikram_singh', name: 'Vikram Singh', isOnline: false }
        ];
        setFriends(seedFriends);
      }
    } catch (e) {
      setFriends([]);
    }
  }, [currentUsername]);

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      onBackToDashboard();
    }
  };

  const toggleFriend = (uname) => {
    if (selectedFriends.includes(uname)) {
      setSelectedFriends(selectedFriends.filter((u) => u !== uname));
    } else {
      setSelectedFriends([...selectedFriends, uname]);
    }
  };

  const handleStartWatching = (friendsToInvite = selectedFriends) => {
    if (!selectedMovie) return;

    const partyId = 'party_' + Date.now();
    const partyData = {
      partyId,
      hostUsername: currentUsername,
      hostName: currentDisplayName,
      movie: selectedMovie,
      invitedFriends: friendsToInvite,
      joinedMembers: [currentUsername],
      createdAt: new Date().toISOString()
    };

    // Save active party session to localStorage so invited friends can join this exact session
    try {
      localStorage.setItem(`scane_active_party_${partyId}`, JSON.stringify(partyData));
      localStorage.setItem('scane_current_active_party', JSON.stringify(partyData));
    } catch (e) {}

    // Send invitations directly to each friend's notification inbox
    if (friendsToInvite.length > 0) {
      friendsToInvite.forEach((friendUser) => {
        const friendStorageKey = `scane_notifications_${friendUser.toLowerCase()}`;
        try {
          const friendNotifs = JSON.parse(localStorage.getItem(friendStorageKey)) || [];
          const newNotif = {
            id: 'notif_invite_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            type: 'watch_party_invite',
            partyId: partyId,
            actorName: currentDisplayName,
            actorUsername: currentUsername,
            movieTitle: selectedMovie.title,
            movieData: selectedMovie,
            message: `${currentDisplayName} invited you to watch ${selectedMovie.title}.`,
            time: 'Just now',
            read: false
          };
          localStorage.setItem(friendStorageKey, JSON.stringify([newNotif, ...friendNotifs]));
        } catch (err) {}
      });
    }

    // Host immediately enters existing Watch Room without waiting
    onStartParty(partyData);
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
        padding: '16px 32px',
        background: 'rgba(9, 13, 28, 0.75)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <button
          type="button"
          onClick={handleBack}
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
          <span>{step === 2 ? 'Back to Movie Selection' : 'Back to Dashboard'}</span>
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

      <main style={{ maxWidth: '860px', width: '100%', margin: '0 auto', padding: '34px 20px 60px', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '16px', background: 'rgba(120, 100, 255, 0.15)', border: '1px solid rgba(120, 100, 255, 0.3)', color: '#c4b5fd', fontSize: '11px', fontWeight: 600, marginBottom: '8px' }}>
            <Sparkles size={13} />
            <span>Dedicated Watch Together Feature</span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>
            Watch Together
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            Select one of your uploaded movies and start streaming immediately. Inviting friends is completely optional.
          </p>
        </div>

        {step === 1 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                1. Select an Uploaded Movie
              </h2>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                {movies.length} uploaded movies
              </span>
            </div>

            {movies.length === 0 ? (
              <div style={{
                background: 'rgba(11, 16, 32, 0.75)',
                border: '1px dashed rgba(255, 255, 255, 0.12)',
                borderRadius: '18px',
                padding: '48px 20px',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'rgba(120, 100, 255, 0.1)',
                  border: '1px solid rgba(120, 100, 255, 0.25)',
                  color: '#a78bfa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px'
                }}>
                  <Film size={26} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: '0 0 6px 0' }}>
                  No uploaded movies found
                </h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '340px', margin: '0 auto 20px' }}>
                  Upload a personal movie file from the Upload Movie page to watch it together.
                </p>
                <button
                  type="button"
                  onClick={onNavigateToUpload}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #7864ff, #38bdf8)',
                    color: '#fff',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Go to Upload Movie Page →
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                {movies.map((m) => {
                  const isSelected = selectedMovie?.id === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMovie(m)}
                      style={{
                        background: isSelected ? 'rgba(20, 28, 64, 0.9)' : 'rgba(11, 16, 32, 0.75)',
                        border: isSelected ? '2px solid #7864ff' : '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: isSelected ? '0 0 24px rgba(120, 100, 255, 0.35)' : 'none',
                        borderRadius: '16px',
                        padding: '18px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '14px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            background: isSelected ? 'rgba(120, 100, 255, 0.3)' : 'rgba(120, 100, 255, 0.15)',
                            color: isSelected ? '#fff' : '#c4b5fd',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <Film size={20} />
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                              {m.title}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                              {m.uploadedAt || 'Uploaded recently'}
                            </div>
                          </div>
                        </div>

                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: isSelected ? 'none' : '2px solid rgba(255, 255, 255, 0.2)',
                          background: isSelected ? '#38bdf8' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {isSelected && <Check size={12} color="#fff" />}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 700, fontSize: '10px' }}>
                          {m.format}
                        </span>
                        <span>{m.size}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedMovie && (
              <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => handleStartWatching([])}
                  style={{
                    padding: '13px 24px',
                    borderRadius: '11px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 18px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  <Play size={16} fill="#fff" />
                  <span>Start Watching Now (Direct) →</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  style={{
                    padding: '13px 24px',
                    borderRadius: '11px',
                    background: 'linear-gradient(135deg, #7864ff 0%, #38bdf8 100%)',
                    color: '#fff',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 18px rgba(120, 100, 255, 0.4)'
                  }}
                >
                  Optional: Invite Friends →
                </button>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 2px 0', color: '#f8fafc' }}>
                  2. Select Friends (Optional)
                </h2>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Selected friends will receive an invitation. You will enter the Watch Room immediately without waiting!
                </span>
              </div>

              <div style={{
                background: 'rgba(120, 100, 255, 0.15)',
                color: '#c4b5fd',
                border: '1px solid rgba(120, 100, 255, 0.3)',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: 700
              }}>
                {selectedFriends.length} Selected
              </div>
            </div>

            {friends.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(11, 16, 32, 0.75)', borderRadius: '16px' }}>
                <Users size={32} color="#a78bfa" style={{ marginBottom: '10px' }} />
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>No friends in your list yet</div>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>You can start watching immediately solo.</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                {friends.map((friend) => {
                  const isChecked = selectedFriends.includes(friend.username);
                  return (
                    <div
                      key={friend.id}
                      onClick={() => toggleFriend(friend.username)}
                      style={{
                        background: isChecked ? 'rgba(20, 28, 64, 0.9)' : 'rgba(11, 16, 32, 0.75)',
                        border: isChecked ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: isChecked ? '0 0 20px rgba(56, 189, 248, 0.3)' : 'none',
                        borderRadius: '14px',
                        padding: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          position: 'relative',
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #7864ff, #38bdf8)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '15px',
                          color: '#fff'
                        }}>
                          {friend.username.charAt(0).toUpperCase()}
                          <span style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: friend.isOnline ? '#10b981' : '#64748b',
                            border: '2px solid #0b1020'
                          }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                            @{friend.username}
                          </div>
                          <div style={{ fontSize: '12px', color: friend.isOnline ? '#34d399' : '#94a3b8' }}>
                            {friend.isOnline ? 'Online now' : 'Offline'}
                          </div>
                        </div>
                      </div>

                      <div style={{ color: isChecked ? '#38bdf8' : '#64748b' }}>
                        {isChecked ? <CheckSquare size={22} /> : <Square size={22} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#cbd5e1',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ← Back to Movie Selection
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleStartWatching([])}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '11px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#cbd5e1',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Skip & Watch Solo
                </button>

                <button
                  type="button"
                  onClick={() => handleStartWatching(selectedFriends)}
                  style={{
                    padding: '12px 26px',
                    borderRadius: '11px',
                    background: 'linear-gradient(135deg, #7864ff, #38bdf8)',
                    color: '#fff',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 18px rgba(120, 100, 255, 0.4)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Play size={16} fill="#fff" />
                  <span>
                    {selectedFriends.length > 0 
                      ? `Invite (${selectedFriends.length}) & Start Watching →` 
                      : 'Start Watching →'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
