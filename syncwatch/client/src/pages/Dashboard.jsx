import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Play, 
  Users, 
  Upload, 
  Film, 
  Sparkles,
  HardDrive,
  Trash2
} from 'lucide-react';
import '../index.css';

export default function Dashboard({ user, onNavigate, onPlayDirectMovie }) {
  const [movies, setMovies] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const currentUser = user || {
    name: 'Anmol Verma',
    username: 'anmol_v',
    identifier: 'anmol@example.com'
  };

  useEffect(() => {
    try {
      const storedMovies = JSON.parse(localStorage.getItem('scane_uploaded_movies')) || [];
      setMovies(storedMovies);
    } catch (e) {
      setMovies([]);
    }

    try {
      const storedNotifs = JSON.parse(localStorage.getItem(`scane_notifications_${currentUser.username.toLowerCase()}`)) || [];
      const unread = storedNotifs.filter(n => !n.read).length;
      setUnreadNotifCount(unread);
    } catch (e) {
      setUnreadNotifCount(2);
    }
  }, [currentUser.username]);

  const deleteMovie = (id, e) => {
    e.stopPropagation();
    const updated = movies.filter(m => m.id !== id);
    setMovies(updated);
    try {
      localStorage.setItem('scane_uploaded_movies', JSON.stringify(updated));
    } catch (err) {}
  };

  return (
    <div className="scane-dash-root">
      <style>{`
        .scane-dash-root {
          position: relative;
          min-height: 100vh;
          width: 100%;
          background-color: #030612;
          color: #fff;
          overflow-x: hidden;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }

        .scane-dash-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
          z-index: 0;
          opacity: 0.35;
        }
        .scane-dash-orb-1 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, #7864ff 0%, transparent 70%);
          top: -150px;
          left: -100px;
        }
        .scane-dash-orb-2 {
          width: 550px;
          height: 550px;
          background: radial-gradient(circle, #38bdf8 0%, transparent 70%);
          top: 30%;
          right: -150px;
        }

        .scane-navbar {
          position: sticky;
          top: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justifyContent: space-between;
          padding: 16px 32px;
          background: rgba(9, 13, 28, 0.75);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .scane-logo-badge {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #7864ff 0%, #38bdf8 100%);
          display: flex;
          align-items: center;
          justifyContent: center;
          box-shadow: 0 0 16px rgba(120, 100, 255, 0.45);
        }

        .scane-nav-btn {
          position: relative;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
          padding: 8px 12px;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .scane-nav-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .scane-hero-wrapper {
          position: relative;
          z-index: 10;
          padding: 2px;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(120, 100, 255, 0.5), rgba(56, 189, 248, 0.25), rgba(255, 255, 255, 0.05));
          box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.7);
          margin-bottom: 36px;
        }

        .scane-hero-inner {
          background: radial-gradient(circle at 80% 20%, rgba(120, 100, 255, 0.15), transparent 50%),
                      rgba(12, 16, 33, 0.94);
          backdrop-filter: blur(24px);
          border-radius: 22px;
          padding: 48px 40px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justifyContent: space-between;
          gap: 32px;
          overflow: hidden;
          position: relative;
        }

        .scane-hero-btn {
          padding: 14px 28px;
          background: linear-gradient(135deg, #7864ff 0%, #4f46e5 50%, #38bdf8 100%);
          background-size: 200% 200%;
          color: #fff;
          font-weight: 700;
          font-size: 15px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 8px 24px rgba(120, 100, 255, 0.4);
          transition: all 0.25s ease;
        }
        .scane-hero-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(120, 100, 255, 0.55);
        }

        .scane-action-card {
          position: relative;
          z-index: 20;
          background: rgba(12, 16, 33, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 22px 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.25s ease;
          backdrop-filter: blur(16px);
          user-select: none;
        }
        .scane-action-card:hover {
          background: rgba(18, 24, 48, 0.9);
          border-color: rgba(120, 100, 255, 0.5);
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5), 0 0 20px rgba(120, 100, 255, 0.25);
        }

        .scane-card-icon-box {
          position: relative;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justifyContent: center;
          flex-shrink: 0;
          transition: transform 0.25s ease;
        }
        .scane-action-card:hover .scane-card-icon-box {
          transform: scale(1.08);
        }

        .scane-empty-box {
          position: relative;
          z-index: 10;
          background: rgba(12, 16, 33, 0.6);
          border: 1px dashed rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          padding: 56px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justifyContent: center;
        }

        .scane-movie-card {
          position: relative;
          z-index: 10;
          background: rgba(12, 16, 33, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
          gap: 14px;
          backdrop-filter: blur(16px);
          transition: all 0.25s ease;
        }
        .scane-movie-card:hover {
          border-color: rgba(120, 100, 255, 0.35);
          background: rgba(18, 24, 50, 0.9);
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(0,0,0,0.5);
        }

        .scane-play-movie-btn {
          width: 100%;
          padding: 9px 14px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
          transition: all 0.2s ease;
        }
        .scane-play-movie-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(16, 185, 129, 0.45);
        }
      `}</style>

      <div className="scane-dash-orb scane-dash-orb-1" />
      <div className="scane-dash-orb scane-dash-orb-2" />

      {/* Navbar with Notifications + Profile direct button (No logout in navbar) */}
      <header className="scane-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <div className="scane-logo-badge">
            <div style={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '9px solid #fff', marginLeft: '2px' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.3px' }}>
            <span>Scane</span>
            <span style={{ background: 'linear-gradient(135deg, #7864ff, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginLeft: '4px' }}>Watch</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Notifications Icon with Badge */}
          <button 
            type="button" 
            className="scane-nav-btn" 
            title="Notifications"
            onClick={() => onNavigate && onNavigate('notifications')}
          >
            <Bell size={17} />
            {unreadNotifCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#ec4899',
                color: '#fff',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '10px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 10px rgba(236, 72, 153, 0.6)'
              }}>
                {unreadNotifCount}
              </span>
            )}
          </button>

          {/* Direct Profile Icon + Username Button */}
          <button 
            type="button" 
            className="scane-nav-btn"
            title="View Profile"
            onClick={() => onNavigate && onNavigate('profile')}
          >
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: currentUser.avatarGradient || 'linear-gradient(135deg, #7864ff, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 800,
              color: '#fff'
            }}>
              {(currentUser.username || 'U').charAt(0).toUpperCase()}
            </div>
            <span>
              @{currentUser.username || 'user'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1160px', width: '100%', margin: '0 auto', padding: '36px 20px 60px', boxSizing: 'border-box', position: 'relative', zIndex: 10 }}>
        
        {/* Main Hero */}
        <section className="scane-hero-wrapper">
          <div className="scane-hero-inner">
            <div style={{ maxWidth: '600px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '20px', background: 'rgba(120, 100, 255, 0.15)', border: '1px solid rgba(120, 100, 255, 0.3)', color: '#c4b5fd', fontSize: '12px', fontWeight: 600, marginBottom: '14px' }}>
                <Sparkles size={14} />
                <span>Next-Gen Cinema Sync</span>
              </div>
              <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, margin: '0 0 12px 0', lineHeight: 1.2, letterSpacing: '-0.5px' }}>
                Watch Movies With Friends
              </h1>
              <p style={{ fontSize: '15px', color: '#94a3b8', margin: '0 0 28px 0', lineHeight: 1.6 }}>
                Watch your uploaded movies together with your friends.
              </p>
              <button 
                type="button" 
                className="scane-hero-btn"
                onClick={() => onNavigate && onNavigate('watch-movie')}
              >
                <Play size={17} fill="#fff" />
                <span>Watch Movie With Friends →</span>
              </button>
            </div>
          </div>
        </section>

                {/* Quick Actions (3 Cards: Friends, Upload Movie, Notifications) */}
        <section style={{ marginBottom: '46px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9', margin: '0 0 16px 4px', letterSpacing: '-0.2px' }}>
            Quick Actions
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            
            {/* 1. Friends & DMs */}
            <div 
              className="scane-action-card" 
              role="button"
              tabIndex={0}
              onClick={() => onNavigate && onNavigate('friends')}
              style={{
                position: 'relative',
                background: 'rgba(12, 16, 33, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                transition: 'all 0.25s ease',
                backdropFilter: 'blur(16px)'
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(120, 100, 255, 0.15)',
                border: '1px solid rgba(120, 100, 255, 0.3)',
                color: '#a78bfa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 0 15px rgba(120, 100, 255, 0.2)'
              }}>
                <Users size={24} />
              </div>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: '#fff' }}>Friends & DMs</h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Chat & invite friends</p>
              </div>
            </div>

            {/* 2. Upload Movie */}
            <div 
              className="scane-action-card" 
              role="button"
              tabIndex={0}
              onClick={() => onNavigate && onNavigate('upload-movie')}
              style={{
                position: 'relative',
                background: 'rgba(12, 16, 33, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                transition: 'all 0.25s ease',
                backdropFilter: 'blur(16px)'
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 0 15px rgba(56, 189, 248, 0.2)'
              }}>
                <Upload size={24} />
              </div>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: '#fff' }}>Upload Movie</h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Add video files</p>
              </div>
            </div>

            {/* 3. Notifications */}
            <div 
              className="scane-action-card" 
              role="button"
              tabIndex={0}
              onClick={() => onNavigate && onNavigate('notifications')}
              style={{
                position: 'relative',
                background: 'rgba(12, 16, 33, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                transition: 'all 0.25s ease',
                backdropFilter: 'blur(16px)'
              }}
            >
              <div style={{
                position: 'relative',
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(236, 72, 153, 0.15)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                color: '#f472b6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 0 15px rgba(236, 72, 153, 0.2)'
              }}>
                <Bell size={24} />
                {unreadNotifCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#ec4899',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '10px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 10px rgba(236, 72, 153, 0.6)'
                  }}>
                    {unreadNotifCount}
                  </span>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: '#fff' }}>Notifications</h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  {unreadNotifCount > 0 ? `${unreadNotifCount} unread alert${unreadNotifCount > 1 ? 's' : ''}` : 'No unread alerts'}
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* My Movies Section */}
        <section>
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9', margin: 0, letterSpacing: '-0.2px' }}>
              My Uploaded Movies
            </h2>
          </div>

          {movies.length === 0 ? (
            <div className="scane-empty-box">
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '18px',
                background: 'rgba(120, 100, 255, 0.1)',
                border: '1px solid rgba(120, 100, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a78bfa',
                marginBottom: '16px'
              }}>
                <Film size={30} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: '0 0 6px 0' }}>
                No movies uploaded yet
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '340px', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                Upload your video or movie files to watch them together in sync with your squad.
              </p>
              <button 
                type="button" 
                className="scane-hero-btn"
                style={{ padding: '10px 22px', fontSize: '13px' }}
                onClick={() => onNavigate && onNavigate('upload-movie')}
              >
                <Upload size={15} />
                <span>Upload Movie</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
              {movies.map((m) => (
                <div key={m.id} className="scane-movie-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        background: 'rgba(120, 100, 255, 0.15)',
                        border: '1px solid rgba(120, 100, 255, 0.3)',
                        color: '#c4b5fd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Film size={20} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 2px 0', color: '#fff' }}>
                          {m.title}
                        </h4>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          Uploaded {m.uploadedAt}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => deleteMovie(m.id, e)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                      title="Delete movie"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <span style={{
                      padding: '2px 8px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#38bdf8'
                    }}>
                      {m.format}
                    </span>
                    <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <HardDrive size={13} />
                      {m.size}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="scane-play-movie-btn"
                    onClick={() => onPlayDirectMovie && onPlayDirectMovie(m)}
                  >
                    <Play size={14} fill="#fff" />
                    <span>Play Movie ▶</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
