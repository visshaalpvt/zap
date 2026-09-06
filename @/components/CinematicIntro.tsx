import React, { useState, useRef, useEffect, useCallback } from 'react';
import introVideo from '../../assets/vetrivelan-intro.mp4';
import './CinematicIntro.css';

interface CinematicIntroProps {
  onEnter: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onEnter }) => {
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressFillRef = useRef<HTMLDivElement | null>(null);

  const handleEnter = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);

    if (videoRef.current) {
      videoRef.current.pause();
    }

    setTimeout(() => {
      onEnter();
    }, 700);
  }, [isExiting, onEnter]);

  // Ensure audio is unmuted and at full volume
  const ensureAudioOn = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    video.volume = 1;
    if (video.paused) {
      video.play().catch(() => {});
    }
  }, []);

  // Keyboard shortcut: Enter to enter portfolio
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleEnter();
      } else {
        ensureAudioOn();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleEnter, ensureAudioOn]);

  // Immediate and aggressive unmuted audio playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = false;
    video.volume = 1;

    const startPlayback = async () => {
      try {
        await video.play();
        setIsPlaying(true);
      } catch {
        // If browser autoplay policy prevents audio on cold load without prior interaction,
        // start playback muted so video runs immediately, then unmute on ANY movement or gesture
        video.muted = true;
        try {
          await video.play();
          setIsPlaying(true);
        } catch {
          setIsPlaying(false);
        }

        const enableAudio = () => {
          if (videoRef.current) {
            videoRef.current.muted = false;
            videoRef.current.volume = 1;
            videoRef.current.play().catch(() => {});
          }
          window.removeEventListener('pointerdown', enableAudio);
          window.removeEventListener('touchstart', enableAudio);
          window.removeEventListener('click', enableAudio);
          window.removeEventListener('mousemove', enableAudio);
          window.removeEventListener('scroll', enableAudio);
          window.removeEventListener('wheel', enableAudio);
          window.removeEventListener('keydown', enableAudio);
        };

        window.addEventListener('pointerdown', enableAudio, { once: true, passive: true });
        window.addEventListener('touchstart', enableAudio, { once: true, passive: true });
        window.addEventListener('click', enableAudio, { once: true, passive: true });
        window.addEventListener('mousemove', enableAudio, { once: true, passive: true });
        window.addEventListener('scroll', enableAudio, { once: true, passive: true });
        window.addEventListener('wheel', enableAudio, { once: true, passive: true });
        window.addEventListener('keydown', enableAudio, { once: true, passive: true });
      }
    };

    startPlayback();
  }, []);

  // Direct DOM update for progress bar to prevent re-renders
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    const progressFill = progressFillRef.current;
    if (!video || !progressFill) return;

    const { currentTime, duration } = video;
    if (duration > 0) {
      const pct = (currentTime / duration) * 100;
      progressFill.style.width = `${pct}%`;
    }
  };

  // When video completes, directly enter the portfolio automatically
  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (progressFillRef.current) {
      progressFillRef.current.style.width = '100%';
    }
    handleEnter();
  };

  return (
    <div
      className={`cinematic-intro-wrapper ${isExiting ? 'is-exiting' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Vetrivelan DM Introduction"
    >
      {/* Fullscreen Video Background */}
      <div
        className="intro-fullscreen-video-container"
        onClick={ensureAudioOn}
        role="presentation"
      >
        <video
          ref={videoRef}
          src={introVideo || 'assets/vetrivelan-intro.mp4'}
          className="intro-fullscreen-video"
          playsInline
          autoPlay
          loop={false}
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnded}
          onPlay={() => setIsPlaying(true)}
          aria-label="Vetrivelan DM introduction video"
        />
        <div className="intro-fullscreen-overlay" aria-hidden="true" />
      </div>

      {/* Subtle Corner Architectural Accents */}
      <div className="intro-corner-accent intro-corner-tl" aria-hidden="true" />
      <div className="intro-corner-accent intro-corner-tr" aria-hidden="true" />
      <div className="intro-corner-accent intro-corner-bl" aria-hidden="true" />
      <div className="intro-corner-accent intro-corner-br" aria-hidden="true" />

      {/* Top Architectural Header Bar */}
      <header className="intro-header-bar">
        <div className="intro-system-tag">
          <span className="intro-pulse-dot" aria-hidden="true" />
          <span>SYSTEM / INTRO</span>
        </div>

        <div className="intro-header-right">
          <span className="intro-location-tag">CHENNAI, IN &bull; 16+ YRS</span>
          {/* Always Audio On Indicator */}
          <button
            type="button"
            className="intro-audio-btn is-unmuted"
            onClick={ensureAudioOn}
            aria-label="Audio is on"
            title="Audio is enabled"
          >
            <svg className="intro-audio-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
            <span>AUDIO ON</span>
            <span className="intro-audio-pulse" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Bottom CTA Actions */}
      <main className="intro-main-content">
        <div className="intro-actions">
          <button
            type="button"
            className="intro-btn-enter"
            onClick={handleEnter}
            autoFocus
            aria-label="Enter portfolio"
          >
            ENTER PORTFOLIO <span>&rarr;</span>
          </button>
        </div>
      </main>

      {/* Footer Info Bar */}
      <footer className="intro-footer-bar">
        <span>PRESS [ENTER] TO EXPLORE</span>
        <span>SECURITY BY DESIGN</span>
      </footer>

      {/* Fullscreen Video Progress Bar */}
      <div className="intro-video-progress" aria-hidden="true">
        <div
          ref={progressFillRef}
          className="intro-video-progress-fill"
          style={{ width: '0%' }}
        />
      </div>
    </div>
  );
};

export default CinematicIntro;
