import React, { useRef, useEffect, useCallback, useState } from 'react';
import introVideo from '../../assets/vetrivelan-intro.mp4';
import './CinematicIntro.css';

interface CinematicIntroProps {
  onEnter: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onEnter }) => {
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressFillRef = useRef<HTMLDivElement | null>(null);
  const unmutedRef = useRef<boolean>(false);

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

  // Activate full audio and ensure speech is heard from the start
  const activateAudio = useCallback((rewindIfEarly = true) => {
    const video = videoRef.current;
    if (!video) return;

    unmutedRef.current = true;
    video.muted = false;
    video.volume = 1.0;

    // If video was playing muted during the first few seconds, rewind so the user hears the speech from the start!
    if (rewindIfEarly && video.currentTime > 0.3 && video.currentTime < 4.5) {
      video.currentTime = 0;
    }

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlayingAudio(true);
        })
        .catch(() => {
          // Playback error
        });
    } else {
      setIsPlayingAudio(true);
    }
  }, []);

  // Keyboard accessibility: Enter transitions into portfolio
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleEnter();
      } else {
        activateAudio(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleEnter, activateAudio]);

  // Primary playback handler: Attempt unmuted playback immediately on page load
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1.0;

    // Attempt direct unmuted playback first
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Direct unmuted playback succeeded without any gesture!
          setIsPlayingAudio(true);
          unmutedRef.current = true;
        })
        .catch((err) => {
          console.log('Unmuted autoplay restricted by browser policy, setting up instant gesture activation:', err);
          // If browser restricts unmuted autoplay on cold start:
          // 1. Play muted immediately so visuals stream without lag
          video.muted = true;
          video.play().catch(() => {});
          setIsPlayingAudio(false);

          // 2. Attach instant activation listeners on every possible early user interaction
          const triggerUnmute = () => {
            if (!unmutedRef.current) {
              activateAudio(true);
            }
            removeTriggers();
          };

          const removeTriggers = () => {
            window.removeEventListener('pointerdown', triggerUnmute);
            window.removeEventListener('touchstart', triggerUnmute);
            window.removeEventListener('click', triggerUnmute);
            window.removeEventListener('keydown', triggerUnmute);
            window.removeEventListener('wheel', triggerUnmute);
            window.removeEventListener('scroll', triggerUnmute);
            window.removeEventListener('pointermove', triggerUnmute);
          };

          window.addEventListener('pointerdown', triggerUnmute, { once: true, passive: true });
          window.addEventListener('touchstart', triggerUnmute, { once: true, passive: true });
          window.addEventListener('click', triggerUnmute, { once: true, passive: true });
          window.addEventListener('keydown', triggerUnmute, { once: true, passive: true });
          window.addEventListener('wheel', triggerUnmute, { once: true, passive: true });
          window.addEventListener('scroll', triggerUnmute, { once: true, passive: true });
          window.addEventListener('pointermove', triggerUnmute, { once: true, passive: true });
        });
    }

    // Monitor video's native volumechange to keep UI state in sync
    const handleVolumeChange = () => {
      if (video) {
        setIsPlayingAudio(!video.muted && video.volume > 0);
      }
    };
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [activateAudio]);

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
      onClick={() => {
        if (!isPlayingAudio) {
          activateAudio(true);
        }
      }}
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
          {/* Audio status toggle */}
          <button
            type="button"
            className={`intro-audio-btn ${isPlayingAudio ? 'is-unmuted' : 'is-muted'}`}
            onClick={(e) => {
              e.stopPropagation();
              if (isPlayingAudio && videoRef.current) {
                videoRef.current.muted = true;
                setIsPlayingAudio(false);
              } else {
                activateAudio(true);
              }
            }}
            aria-label={isPlayingAudio ? 'Mute audio' : 'Unmute audio'}
          >
            {isPlayingAudio ? (
              <>
                <svg className="intro-audio-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
                <span>AUDIO ON</span>
                <span className="intro-audio-wave" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              </>
            ) : (
              <>
                <svg className="intro-audio-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
                <span>UNMUTE SOUND</span>
              </>
            )}
          </button>
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

