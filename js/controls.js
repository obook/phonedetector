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

const State = {
  IDLE: 'IDLE',
  RAMPING_UP: 'RAMPING_UP',
  DETECTING: 'DETECTING',
  RAMPING_DOWN: 'RAMPING_DOWN'
};

let state = State.IDLE;
let intensity = 0;
let rampSpeed = 5;
let volume = 0.7;

let onVolumeChange = null;

/* ===============================================================
 *  STATE MACHINE
 * =============================================================== */

function getIntensity() {
  return intensity;
}

function getState() {
  return state;
}

function getVolume() {
  return volume;
}

/* Toggle between ramping up and ramping down. */
function trigger() {
  if (state === State.IDLE || state === State.RAMPING_DOWN) {
    state = State.RAMPING_UP;
  } else if (state === State.RAMPING_UP || state === State.DETECTING) {
    state = State.RAMPING_DOWN;
  }
}

function reset() {
  state = State.IDLE;
  intensity = 0;
}

/*
 * Advance the state machine by one frame.
 * @param {number} dt - Delta time in seconds since last frame.
 */
function update(dt) {
  const speed = rampSpeed / 5;
  switch (state) {
    case State.RAMPING_UP:
      intensity = Math.min(1, intensity + dt * 0.25 * speed);
      if (intensity >= 1) {
        state = State.DETECTING;
      }
      break;
    case State.DETECTING:
      /* Small fluctuations around maximum. */
      intensity = 0.92 + Math.random() * 0.08;
      break;
    case State.RAMPING_DOWN:
      intensity = Math.max(0, intensity - dt * 0.35 * speed);
      if (intensity <= 0) {
        intensity = 0;
        state = State.IDLE;
      }
      break;
    case State.IDLE:
      /* Very faint background noise. */
      intensity = Math.random() * 0.05;
      break;
  }
}

/* ===============================================================
 *  VIBRATE HELPER
 * =============================================================== */

function vibrate() {
  if (navigator.vibrate) {
    navigator.vibrate(100);
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
    pressTimer = setTimeout(() => openPanel(), 1500);
  }, { passive: false });

  zone.addEventListener('touchend', () => clearTimeout(pressTimer));
  zone.addEventListener('touchcancel', () => clearTimeout(pressTimer));

  /* Mouse fallback for desktop testing. */
  zone.addEventListener('mousedown', () => {
    pressTimer = setTimeout(() => openPanel(), 1500);
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

  /* Close panel by tapping outside of it. */
  panel.addEventListener('click', (e) => {
    if (e.target === panel) {
      panel.classList.add('hidden');
    }
  });
}

/* ===============================================================
 *  INITIALIZATION
 * =============================================================== */

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
