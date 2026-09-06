import React, { useRef, useEffect, useCallback, useState } from 'react';
import introVideo from '../../assets/vetrivelan-intro.mp4';
import './CinematicIntro.css';

interface CinematicIntroProps {
  onEnter: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onEnter }) => {
  const [isExiting, setIsExiting] = useState<boolean>(false);

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

  // Keyboard accessibility: Enter transitions into portfolio
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

  // Direct, automatic unmuted audio playback on page load
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1;

    const playVideoAutomatically = async () => {
      try {
        await video.play();
      } catch {
        // If the browser enforces a zero-gesture autoplay block on cold load,
        // run playback and silently activate full audio on the earliest gesture without showing any prompts
        video.muted = true;
        try {
          await video.play();
        } catch {
          // Playback error
        }

        const silentUnmute = () => {
          if (videoRef.current) {
            videoRef.current.muted = false;
            videoRef.current.volume = 1;
            videoRef.current.play().catch(() => {});
          }
          window.removeEventListener('pointerdown', silentUnmute);
          window.removeEventListener('touchstart', silentUnmute);
          window.removeEventListener('click', silentUnmute);
          window.removeEventListener('keydown', silentUnmute);
        };

        window.addEventListener('pointerdown', silentUnmute, { once: true, passive: true });
        window.addEventListener('touchstart', silentUnmute, { once: true, passive: true });
        window.addEventListener('click', silentUnmute, { once: true, passive: true });
        window.addEventListener('keydown', silentUnmute, { once: true, passive: true });
      }
    };

    playVideoAutomatically();
  }, []);

  // Direct DOM update for progress bar to eliminate React re-render lag
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
      onClick={ensureAudioOn}
    >
      {/* Fullscreen Video Background */}
      <div className="intro-fullscreen-video-container" role="presentation">
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
          <div
            className="intro-audio-btn is-unmuted"
            onClick={(e) => {
              e.stopPropagation();
              ensureAudioOn();
            }}
            role="button"
            tabIndex={0}
            aria-label="Audio active"
          >
            <svg className="intro-audio-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
            <span>AUDIO ON</span>
            <span className="intro-audio-pulse" aria-hidden="true" />
          </div>
        </div>
      </header>

      {/* Bottom CTA Actions */}
      <main className="intro-main-content">
        <div className="intro-actions">
          <button
            type="button"
            className="intro-btn-enter"
            onClick={(e) => {
              e.stopPropagation();
              handleEnter();
            }}
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
