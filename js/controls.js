/*
 * controls.js
 * State machine and secret teacher triggers.
 *
 * Manages the detection intensity (0.0 to 1.0) through a four-state
 * machine: IDLE -> RAMPING_UP -> DETECTING -> RAMPING_DOWN -> IDLE.
 * The teacher triggers state changes via hidden gestures:
 *   - Tap anywhere on screen: toggle detection on/off (with vibration)
 *   - Long press on the bottom-right corner (opens calibration panel)
 *
 * Author: O. Booklage
 * Date: April 2026
 * Licence: ISC
 */

/* ===============================================================
 *  CONSTANTS
 * =============================================================== */

/** Reference ramp speed; the slider value is normalized against this. */
const DEFAULT_RAMP_SPEED = 5;

/** Default master volume on first start (0.0 to 1.0). */
const DEFAULT_VOLUME = 0.7;

/** Intensity gain per second while ramping up. */
const RAMP_UP_RATE = 0.25;

/** Intensity loss per second while ramping down. */
const RAMP_DOWN_RATE = 0.35;

/** Minimum intensity floor while in DETECTING state. */
const DETECTING_BASE = 0.92;

/** Random fluctuation amplitude added on top of DETECTING_BASE. */
const DETECTING_VARIANCE = 0.08;

/** Maximum random intensity used as background noise in IDLE. */
const IDLE_NOISE_LEVEL = 0.05;

/** Vibration duration triggered on every secret tap, in milliseconds. */
const VIBRATE_MS = 100;

/** Press duration that opens the calibration panel, in milliseconds. */
const LONG_PRESS_MS = 1500;

/* ===============================================================
 *  STATE
 * =============================================================== */

const State = {
  IDLE: 'IDLE',
  RAMPING_UP: 'RAMPING_UP',
  DETECTING: 'DETECTING',
  RAMPING_DOWN: 'RAMPING_DOWN'
};

let state = State.IDLE;
let intensity = 0;
let rampSpeed = DEFAULT_RAMP_SPEED;
let volume = DEFAULT_VOLUME;

let onVolumeChange = null;

/* ===============================================================
 *  STATE MACHINE
 * =============================================================== */

/** @returns {number} Current detection intensity from 0.0 to 1.0. */
function getIntensity() {
  return intensity;
}

/** @returns {string} Current state name (one of State.*). */
function getState() {
  return state;
}

/** @returns {number} Current master volume from 0.0 to 1.0. */
function getVolume() {
  return volume;
}

/**
 * Toggle between ramping up and ramping down.
 * Called by the secret tap handler.
 */
function trigger() {
  if (state === State.IDLE || state === State.RAMPING_DOWN) {
    state = State.RAMPING_UP;
  } else if (state === State.RAMPING_UP || state === State.DETECTING) {
    state = State.RAMPING_DOWN;
  }
}

/** Force the state machine back to IDLE with zero intensity. */
function reset() {
  state = State.IDLE;
  intensity = 0;
}

/**
 * Advance the state machine by one frame.
 * @param {number} dt - Delta time in seconds since the previous frame.
 */
function update(dt) {
  const speed = rampSpeed / DEFAULT_RAMP_SPEED;
  switch (state) {
    case State.RAMPING_UP:
      intensity = Math.min(1, intensity + dt * RAMP_UP_RATE * speed);
      if (intensity >= 1) {
        state = State.DETECTING;
      }
      break;
    case State.DETECTING:
      /* Small fluctuations around maximum. */
      intensity = DETECTING_BASE + Math.random() * DETECTING_VARIANCE;
      break;
    case State.RAMPING_DOWN:
      intensity = Math.max(0, intensity - dt * RAMP_DOWN_RATE * speed);
      if (intensity <= 0) {
        intensity = 0;
        state = State.IDLE;
      }
      break;
    case State.IDLE:
      /* Very faint background noise. */
      intensity = Math.random() * IDLE_NOISE_LEVEL;
      break;
  }
}

/* ===============================================================
 *  VIBRATE HELPER
 * =============================================================== */

function vibrate() {
  if (navigator.vibrate) {
    navigator.vibrate(VIBRATE_MS);
  }
}

/* ===============================================================
 *  TAP TO TOGGLE DETECTION
 * =============================================================== */

function initScreenTap() {
  document.addEventListener('click', (e) => {
    /* Ignore taps on interactive UI elements. */
    if (e.target.closest('#secret-panel') ||
        e.target.closest('#secret-zone') ||
        e.target.closest('#sound-toggle') ||
        e.target.closest('#init-overlay')) {
      return;
    }

    vibrate();
    trigger();
  });
}

/* ===============================================================
 *  LONG PRESS - HIDDEN CALIBRATION PANEL
 * =============================================================== */

function initSecretZone() {
  const zone = document.getElementById('secret-zone');
  const panel = document.getElementById('secret-panel');
  const rampSlider = document.getElementById('ramp-speed');
  const volumeSlider = document.getElementById('volume-ctrl');
  const btnReset = document.getElementById('btn-reset');
  const btnClose = document.getElementById('btn-close-panel');

  let pressTimer = null;

  zone.addEventListener('touchstart', (e) => {
    e.preventDefault();
    pressTimer = setTimeout(() => openPanel(), LONG_PRESS_MS);
  }, { passive: false });

  zone.addEventListener('touchend', () => clearTimeout(pressTimer));
  zone.addEventListener('touchcancel', () => clearTimeout(pressTimer));

  /* Mouse fallback for desktop testing. */
  zone.addEventListener('mousedown', () => {
    pressTimer = setTimeout(() => openPanel(), LONG_PRESS_MS);
  });
  zone.addEventListener('mouseup', () => clearTimeout(pressTimer));
  zone.addEventListener('mouseleave', () => clearTimeout(pressTimer));

  function openPanel() {
    panel.classList.remove('hidden');
    rampSlider.value = rampSpeed;
    volumeSlider.value = Math.round(volume * 100);
  }

  rampSlider.addEventListener('input', () => {
    rampSpeed = parseInt(rampSlider.value, 10);
  });

  volumeSlider.addEventListener('input', () => {
    volume = parseInt(volumeSlider.value, 10) / 100;
    if (onVolumeChange) {
      onVolumeChange(volume);
    }
  });

  btnReset.addEventListener('click', () => {
    reset();
  });

  btnClose.addEventListener('click', () => {
    panel.classList.add('hidden');
  });

  /* Close the panel by tapping outside of it. */
  panel.addEventListener('click', (e) => {
    if (e.target === panel) {
      panel.classList.add('hidden');
    }
  });
}

/* ===============================================================
 *  INITIALIZATION
 * =============================================================== */

/**
 * Wire up the secret tap and long-press handlers.
 * @param {object} [callbacks] - Optional callback hooks.
 * @param {(volume: number) => void} [callbacks.onVolumeChange] -
 *   Invoked whenever the volume slider is dragged.
 */
function init(callbacks = {}) {
  onVolumeChange = callbacks.onVolumeChange || null;

  initScreenTap();
  initSecretZone();
}

export default {
  init,
  update,
  getIntensity,
  getState,
  getVolume,
  trigger,
  reset,
  State
};
