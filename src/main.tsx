import React from 'react';
import { createRoot } from 'react-dom/client';
import CinematicIntro from '../@/components/CinematicIntro';
import BlurText from '../@/components/BlurText';
import DarkVeil from '../@/components/DarkVeil';
import AnimatedContent from '../@/components/AnimatedContent';
import SplitText from '../@/components/SplitText';
import Hyperspeed from '../@/components/Hyperspeed';
import { hyperspeedPresets } from '../@/components/HyperSpeedPresets';
import GlowCursor from '../@/components/GlowCursor';

// Function to initialize background WebGL and canvas effects on demand
const initPortfolioEffects = () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const hyperspeed = document.getElementById('react-hyperspeed');
  if (hyperspeed && window.innerWidth > 800 && !reducedMotion && !hyperspeed.hasChildNodes()) {
    createRoot(hyperspeed).render(
      <Hyperspeed
        effectOptions={{
          ...hyperspeedPresets.one,
          length: 180,
          roadWidth: 7,
          islandWidth: 1,
          lanesPerRoad: 3,
          lightPairsPerRoadWay: 18,
          totalSideLightSticks: 10,
          colors: {
            ...hyperspeedPresets.one.colors,
            roadColor: 0x10201f,
            islandColor: 0x0c1717,
            background: 0x17221f,
            shoulderLines: 0x0c6d64,
            brokenLines: 0x658e87,
            leftCars: [0xee765f, 0xc8f45a, 0x0c6d64],
            rightCars: [0x0c6d64, 0x658e87, 0xee765f],
            sticks: 0xc8f45a
          }
        } as any}
      />
    );
  }

  const glowCursor = document.getElementById('react-glow-cursor');
  if (glowCursor && window.innerWidth > 800 && !reducedMotion && !glowCursor.hasChildNodes()) {
    createRoot(glowCursor).render(
      <GlowCursor
        color="#c8f45a"
        secondaryColor="#0c6d64"
        trailLength={24}
        trailWidth={5}
        glowIntensity={1.2}
        glowSpread={0.8}
        brightness={1.05}
        opacity={0.75}
        pulseSpeed={0.45}
        noiseStrength={0.015}
        idleFade
        maxDevicePixelRatio={1}
      />
    );
  }

  const heroHeading = document.getElementById('react-hero-heading');
  if (heroHeading && !heroHeading.hasChildNodes()) {
    createRoot(heroHeading).render(
      <SplitText
        text="Securing products. Architecting trust."
        tag="h1"
        splitType="words"
        delay={70}
        duration={1}
        threshold={0.1}
        rootMargin="0px"
        textAlign="left"
        className="react-split-heading"
      />
    );
  }

  const heroStatus = document.getElementById('react-hero-status');
  if (heroStatus && !heroStatus.hasChildNodes()) {
    createRoot(heroStatus).render(
      <BlurText
        text="PRODUCT SECURITY ARCHITECT / SYSTEMS THINKING"
        animateBy="words"
        delay={80}
        direction="bottom"
        className="react-blur-status"
      />
    );
  }

  const aiVeil = document.getElementById('react-ai-veil');
  if (aiVeil && window.innerWidth > 800 && !reducedMotion && !aiVeil.hasChildNodes()) {
    createRoot(aiVeil).render(
      <DarkVeil
        hueShift={175}
        noiseIntensity={0.025}
        scanlineIntensity={0.08}
        scanlineFrequency={1.2}
        speed={0.18}
        warpAmount={0.08}
        resolutionScale={0.55}
        lightMode
      />
    );
  }

  const flowLabel = document.querySelector('.flow-heading');
  if (flowLabel && !flowLabel.querySelector('.react-flow-motion')) {
    const mount = document.createElement('div');
    mount.className = 'react-flow-motion';
    flowLabel.appendChild(mount);
    createRoot(mount).render(
      <AnimatedContent distance={24} duration={0.75} threshold={0.2}>
        <span className="mono">LIVE SECURITY OPERATING MODEL / 05 STAGES</span>
      </AnimatedContent>
    );
  }
};

// Cinematic Pre-Portfolio Intro Mount
const introRootEl = document.getElementById('cinematic-intro-root');
if (introRootEl) {
  const introRoot = createRoot(introRootEl);
  const handleEnterPortfolio = () => {
    const portfolioApp = document.getElementById('portfolio-app');
    if (portfolioApp) {
      portfolioApp.classList.remove('portfolio-hidden');
      portfolioApp.classList.add('portfolio-visible');
    }
    document.body.classList.remove('intro-active');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // Initialize background WebGL shaders and effects only when entering portfolio!
    // This gives 100% GPU/CPU decoder bandwidth to the intro video for flawless, lag-free playback.
    initPortfolioEffects();

    // Ensure hero reveal elements become visible smoothly upon entering
    document.querySelectorAll('.hero .reveal').forEach((el) => {
      el.classList.add('visible');
    });
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));

    setTimeout(() => {
      introRoot.unmount();
      introRootEl.remove();
    }, 900);
  };

  introRoot.render(<CinematicIntro onEnter={handleEnterPortfolio} />);
} else {
  // If intro is not mounted, init portfolio effects directly
  initPortfolioEffects();
}