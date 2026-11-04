import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import '../index.css';

export default function Login({ onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('signin');
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    try {
      const existing = localStorage.getItem('scane_registered_users');
      if (!existing) {
        const defaultUsers = [
          { username: 'anmol', identifier: 'anmol@example.com', password: '123' },
          { username: 'admin', identifier: 'admin@scane.com', password: 'admin' }
        ];
        localStorage.setItem('scane_registered_users', JSON.stringify(defaultUsers));
      }
    } catch (e) {}
  }, []);

  const getUsers = () => {
    try {
      return JSON.parse(localStorage.getItem('scane_registered_users')) || [];
    } catch {
      return [];
    }
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setError('');
    setSuccessMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const users = getUsers();

    if (activeTab === 'signup') {
      const cleanUser = username.trim().toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');
      const cleanId = identifier.trim();

      if (!cleanUser) {
        setError('Please enter a unique username.');
        return;
      }
      if (!cleanId) {
        setError('Please enter your email or phone number.');
        return;
      }
      if (!password) {
        setError('Please enter a password.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      const userExists = users.some(
        (u) =>
          u.username.toLowerCase() === cleanUser ||
          u.identifier.toLowerCase() === cleanId.toLowerCase()
      );

      if (userExists) {
        setError('Username or Email/Phone is already registered. Please Sign In.');
        return;
      }

      const newUser = {
        username: cleanUser,
        name: cleanUser,
        identifier: cleanId,
        password: password
      };

      const updatedUsers = [...users, newUser];
      try {
        localStorage.setItem('scane_registered_users', JSON.stringify(updatedUsers));
        if (rememberMe) {
          localStorage.setItem('scane_user', JSON.stringify(newUser));
        }
      } catch (err) {}

      setSuccessMsg('Account created successfully! Logging in...');
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess(newUser);
      }, 700);
    } else {
      const cleanId = identifier.trim().toLowerCase();
      if (!cleanId) {
        setError('Please enter your username, email, or phone number.');
        return;
      }
      if (!password) {
        setError('Please enter your password.');
        return;
      }

      const foundUser = users.find(
        (u) =>
          u.username.toLowerCase() === cleanId ||
          u.identifier.toLowerCase() === cleanId
      );

      if (!foundUser) {
        setError('Account not found. Please create an account first.');
        return;
      }

      if (foundUser.password !== password) {
        setError('Incorrect password. Please try again.');
        return;
      }

      if (rememberMe) {
        try {
          localStorage.setItem('scane_user', JSON.stringify(foundUser));
        } catch (err) {}
      }

      if (onLoginSuccess) {
        onLoginSuccess(foundUser);
      }
    }
  };

  const handleGoogleSignIn = () => {
    const googleUser = {
      username: 'anmol',
      name: 'Anmol Verma',
      email: 'anmol@example.com'
    };
    try {
      localStorage.setItem('scane_user', JSON.stringify(googleUser));
    } catch (err) {}

    if (onLoginSuccess) {
      onLoginSuccess(googleUser);
    }
  };

  const handleForgotPassword = () => {
    if (!identifier.trim()) {
      setError('Please enter your username, email, or phone number first.');
      return;
    }
    const users = getUsers();
    const cleanId = identifier.trim().toLowerCase();
    const foundUser = users.find(
      (u) => u.username.toLowerCase() === cleanId || u.identifier.toLowerCase() === cleanId
    );

    if (foundUser) {
      setError('');
      setSuccessMsg(`Your password is: "${foundUser.password}" (Sent to ${foundUser.identifier})`);
    } else {
      setError('No registered account found with this username or email.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#050814',
        padding: '20px',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          backgroundColor: '#0c1021',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '32px 28px',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#7864ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderTop: '6px solid transparent',
                  borderBottom: '6px solid transparent',
                  borderLeft: '10px solid #fff',
                  marginLeft: '2px'
                }}
              />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>
              <span>Scane</span>
              <span style={{ color: '#7864ff', marginLeft: '4px' }}>Watch</span>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            {activeTab === 'signup' ? 'Create a new account to join watch parties' : 'Login to watch movies with friends'}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            background: '#070a18',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <button
            type="button"
            onClick={() => handleTabSwitch('signin')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              background: activeTab === 'signin' ? '#7864ff' : 'transparent',
              color: activeTab === 'signin' ? '#fff' : '#94a3b8',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('signup')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              background: activeTab === 'signup' ? '#7864ff' : 'transparent',
              color: activeTab === 'signup' ? '#fff' : '#94a3b8',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#fca5a5',
              fontSize: '13px',
              marginBottom: '16px'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              color: '#6ee7b7',
              fontSize: '13px',
              marginBottom: '16px'
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {activeTab === 'signup' && (
            <div style={{ marginBottom: '14px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#cbd5e1',
                  marginBottom: '6px',
                  letterSpacing: '0.5px'
                }}
              >
                CHOOSE USERNAME
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User size={16} color="#64748b" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type="text"
                  placeholder="e.g. anmol_v"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 38px',
                    background: '#070a18',
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
          )}

          <div style={{ marginBottom: '14px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                color: '#cbd5e1',
                marginBottom: '6px',
                letterSpacing: '0.5px'
              }}
            >
              {activeTab === 'signup' ? 'EMAIL OR PHONE NUMBER' : 'USERNAME / EMAIL / MOBILE'}
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <User size={16} color="#64748b" style={{ position: 'absolute', left: '12px' }} />
              <input
                type="text"
                placeholder={activeTab === 'signup' ? 'Enter email or phone number' : 'Username, email or phone number'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 38px',
                  background: '#070a18',
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

          <div style={{ marginBottom: '14px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                color: '#cbd5e1',
                marginBottom: '6px',
                letterSpacing: '0.5px'
              }}
            >
              PASSWORD
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 40px 11px 38px',
                  background: '#070a18',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {activeTab === 'signup' && (
            <div style={{ marginBottom: '14px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#cbd5e1',
                  marginBottom: '6px',
                  letterSpacing: '0.5px'
                }}
              >
                CONFIRM PASSWORD
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 38px',
                    background: '#070a18',
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
          )}

          {activeTab === 'signin' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '18px',
                fontSize: '13px'
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember Me</span>
              </label>

              <button
                type="button"
                onClick={handleForgotPassword}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#a78bfa',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '13px'
                }}
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              background: '#7864ff',
              color: '#fff',
              border: 'none',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: activeTab === 'signup' ? '8px' : '0'
            }}
          >
            {activeTab === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '18px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          style={{
            width: '100%',
            padding: '11px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>
      </div>
    </div>
  );
}