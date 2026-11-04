import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  Film, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  FileVideo, 
  Sparkles,
  HardDrive
} from 'lucide-react';
import '../index.css';

const ALLOWED_FORMATS = ['video/mp4', 'video/mkv', 'video/webm', 'video/quicktime', 'video/x-matroska'];
const ALLOWED_EXTENSIONS = ['.mp4', '.mkv', '.webm', '.mov'];

export default function UploadMovie({ onBack, onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [movieTitle, setMovieTitle] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  const validateAndSetFile = (file) => {
    setErrorMessage('');
    if (!file) return;

    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    const isValidFormat = ALLOWED_FORMATS.includes(file.type) || ALLOWED_EXTENSIONS.includes(fileExt);

    if (!isValidFormat) {
      setErrorMessage('Unsupported file format! Please upload MP4, MKV, WebM, or MOV files.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    const rawName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    setMovieTitle(rawName);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const startUpload = () => {
    if (!selectedFile) {
      setErrorMessage('Please select a movie file first.');
      return;
    }
    if (!movieTitle.trim()) {
      setErrorMessage('Please provide a title for the movie.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    let current = 0;
    const interval = setInterval(() => {
      current += 15;
      if (current >= 100) {
        current = 100;
        setUploadProgress(100);
        clearInterval(interval);

        const fileExt = selectedFile.name.split('.').pop().toUpperCase();
        const sizeMb = (selectedFile.size / (1024 * 1024)).toFixed(1) + ' MB';

        const newMovie = {
          id: 'mov_' + Date.now(),
          title: movieTitle.trim(),
          format: fileExt || 'MP4',
          size: sizeMb,
          fileName: selectedFile.name,
          uploadedAt: 'Just now'
        };

        try {
          const stored = JSON.parse(localStorage.getItem('scane_uploaded_movies')) || [];
          localStorage.setItem('scane_uploaded_movies', JSON.stringify([newMovie, ...stored]));
        } catch (e) {}

        setIsUploading(false);
        setUploadSuccess(true);
      } else {
        setUploadProgress(current);
      }
    }, 200);
  };

  const resetForm = () => {
    setSelectedFile(null);
    setMovieTitle('');
    setUploadProgress(0);
    setIsUploading(false);
    setUploadSuccess(false);
    setErrorMessage('');
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

      <main style={{ maxWidth: '820px', width: '100%', margin: '0 auto', padding: '38px 20px 60px', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '16px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontSize: '11px', fontWeight: 600, marginBottom: '8px' }}>
            <Sparkles size={13} />
            <span>Movie Repository & Upload</span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>
            Upload Movie
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            Upload personal video files from your computer to store them in your Scane Watch library.
          </p>
        </div>

        {errorMessage && (
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
            <span>{errorMessage}</span>
          </div>
        )}

        {uploadSuccess ? (
          <div style={{
            background: 'rgba(11, 16, 32, 0.85)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '20px',
            padding: '48px 32px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px'
            }}>
              <CheckCircle2 size={32} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px 0', color: '#fff' }}>
              Movie Uploaded Successfully!
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 24px 0' }}>
              "{movieTitle}" is now available in your Dashboard and ready for cinema sessions.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Upload Another Movie
              </button>
              <button
                type="button"
                onClick={onUploadSuccess}
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #7864ff 0%, #38bdf8 100%)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                View in Dashboard →
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            background: 'rgba(11, 16, 32, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '32px',
            boxSizing: 'border-box'
          }}>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              style={{
                border: dragActive ? '2px dashed #38bdf8' : '2px dashed rgba(255, 255, 255, 0.15)',
                background: dragActive ? 'rgba(56, 189, 248, 0.08)' : 'rgba(6, 10, 24, 0.6)',
                borderRadius: '16px',
                padding: '48px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '24px'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp4,.mkv,.webm,.mov,video/*"
                onChange={handleChange}
                style={{ display: 'none' }}
              />

              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '18px',
                background: 'rgba(120, 100, 255, 0.12)',
                color: '#a78bfa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Upload size={28} />
              </div>

              <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                {selectedFile ? selectedFile.name : 'Choose a movie file or drag & drop it here'}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Supports MP4, MKV, WebM, MOV video files
              </div>
            </div>

            {selectedFile && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Movie Title
                </label>
                <input
                  type="text"
                  value={movieTitle}
                  onChange={(e) => setMovieTitle(e.target.value)}
                  placeholder="Enter movie title..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
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
            )}

            {isUploading && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                  <span>Uploading movie...</span>
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>{uploadProgress}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'linear-gradient(90deg, #7864ff, #38bdf8)', transition: 'width 0.2s ease' }} />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={startUpload}
              disabled={isUploading || !selectedFile}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: selectedFile && !isUploading ? 'linear-gradient(135deg, #7864ff 0%, #38bdf8 100%)' : 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: selectedFile && !isUploading ? 'pointer' : 'not-allowed',
                boxShadow: selectedFile && !isUploading ? '0 4px 18px rgba(120, 100, 255, 0.4)' : 'none'
              }}
            >
              {isUploading ? 'Uploading...' : 'Save & Upload Movie'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
