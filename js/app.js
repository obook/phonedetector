/*
 * app.js
 * Main orchestrator for the SENTINEL RF-7200 detector app.
 *
 * Handles the boot sequence overlay, initializes all modules
 * (audio, radar, signals, controls), and runs the main
 * requestAnimationFrame loop that drives the entire UI.
 *
 * Author: O. Booklage
 * Date: April 2026
 * Licence: ISC
 */

import controls from './controls.js';
import audio from './audio.js';
import radar from './radar.js';
import signals from './signals.js';

let lastTime = 0;
let running = false;
let soundEnabled = true;

/* Toggle between fullscreen and windowed mode. */
function toggleFullscreen() {
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (exit) {
      exit.call(document).catch(() => {});
    }
  } else {
    const el = document.documentElement;
    const rfs = el.requestFullscreen || el.webkitRequestFullscreen;
    if (rfs) {
      rfs.call(el).catch(() => {});
    }
  }
}

/* Enter fullscreen if not already active. */
function requestFullscreen() {
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    return;
  }
  const el = document.documentElement;
  const rfs = el.requestFullscreen || el.webkitRequestFullscreen;
  if (rfs) {
    rfs.call(el).catch(() => {});
  }
}

/*
 * Set up the boot screen overlay.
 * First touch anywhere triggers fullscreen.
 * The START SCAN button launches the detector UI.
 */
function initOverlay() {
  const overlay = document.getElementById('init-overlay');
  const app = document.getElementById('app');
  const btn = document.getElementById('boot-start-btn');
  let fullscreenDone = false;
  let started = false;

  /* Any tap on the overlay triggers fullscreen immediately. */
  overlay.addEventListener('touchstart', goFullscreen, { passive: true });
  overlay.addEventListener('mousedown', goFullscreen);

  function goFullscreen() {
    if (fullscreenDone) {
      return;
    }
    fullscreenDone = true;
    requestFullscreen();
  }

  btn.addEventListener('click', () => {
    if (started) {
      return;
    }
    started = true;

    /* Ensure fullscreen if the button is the first interaction. */
    goFullscreen();

    /* AudioContext must be created inside a user gesture. */
    audio.init();
    audio.resume();

    /* Fade out the boot screen, then show the detector UI. */
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.4s ease';
    setTimeout(() => {
      overlay.style.display = 'none';
      app.classList.remove('hidden');

      radar.init();
      signals.init();
      controls.init({
        onVolumeChange: (v) => audio.setVolume(soundEnabled ? v : 0)
      });

      initSoundToggle();
      initFullscreenToggle();

      running = true;
      requestAnimationFrame(loop);
    }, 400);
  });
}

/* Wire up the speaker icon to mute/unmute audio. */
function initSoundToggle() {
  const btn = document.getElementById('sound-toggle');
  const iconOn = document.getElementById('sound-icon-on');
  const iconOff = document.getElementById('sound-icon-off');
  btn.classList.add('active');

  btn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    audio.setVolume(soundEnabled ? controls.getVolume() : 0);
    iconOn.classList.toggle('hidden', !soundEnabled);
    iconOff.classList.toggle('hidden', soundEnabled);
    btn.classList.toggle('active', soundEnabled);
  });
}

/* Tap the header SVG icon to toggle fullscreen. */
function initFullscreenToggle() {
  const headerBrand = document.querySelector('.header-brand');
  if (!headerBrand) {
    return;
  }
  headerBrand.addEventListener('click', (e) => {
    if (e.target.closest('.header-icon') || e.target.closest('svg')) {
      e.stopPropagation();
      toggleFullscreen();
    }
  });
}

/* Main animation loop driven by requestAnimationFrame. */
function loop(timestamp) {
  if (!running) {
    return;
  }

  /* Cap dt to prevent intensity jumps after a background tab resume. */
  const dt = Math.min(0.1, lastTime ? (timestamp - lastTime) / 1000 : 0.016);
  lastTime = timestamp;

  controls.update(dt);
  const intensity = controls.getIntensity();

  audio.update(intensity, timestamp);
  radar.draw(intensity, timestamp);
  signals.update(intensity, timestamp);

  requestAnimationFrame(loop);
}

/* Prevent the screen from sleeping while the app is active. */
async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      await navigator.wakeLock.request('screen');
    }
  } catch (e) {
    /* Wake Lock API not supported or permission denied. */
  }
}

/* Suspend audio when the app goes to the background (swipe, home, task switch). */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    audio.suspend();
  } else if (running) {
    audio.resume();
  }
});

initOverlay();
requestWakeLock();
