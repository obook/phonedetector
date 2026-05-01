/*
 * audio.js
 * Geiger counter click engine using the Web Audio API.
 *
 * Generates short white-noise bursts that sound like Geiger counter
 * clicks. Click rate scales with detection intensity: slow ambient
 * ticks in idle mode, rapid crackling at maximum detection.
 * A pulsing sine-wave alarm activates above the alarm threshold.
 *
 * No external audio files are needed - everything is synthesized.
 *
 * Author: O. Booklage
 * Date: April 2026
 * Licence: ISC
 */

import { INTENSITY_ALARM } from './constants.js';

/* ===============================================================
 *  CONSTANTS
 * =============================================================== */

/** Master gain applied to every sound (0.0 to 1.0). */
const MASTER_GAIN = 0.7;

/** Duration of the pre-generated white noise buffer, in seconds. */
const NOISE_BUFFER_SECONDS = 0.02;

/** Idle click interval range, in milliseconds. */
const IDLE_CLICK_MIN_MS = 2000;
const IDLE_CLICK_MAX_MS = 4000;

/**
 * Decay ratio used in the exponential mapping
 * `interval = IDLE_CLICK_MIN_MS * DECAY ^ intensity`.
 * At intensity = 1 this gives 2000 * 0.015 = 30 ms (~33 clicks/s).
 */
const CLICK_DECAY = 0.015;

/** Minimum interval between two clicks, in milliseconds. */
const MIN_CLICK_INTERVAL_MS = 33;

/** Frequency of the alarm tone, in Hz. */
const ALARM_FREQUENCY_HZ = 800;

/** Peak gain of the alarm tone during a pulse. */
const ALARM_GAIN = 0.3;

/** Number of on/off pulses per scheduling cycle. */
const ALARM_PULSES_PER_CYCLE = 4;

/** Duration of one full pulse cycle (on + off), in seconds. */
const ALARM_PULSE_PERIOD_S = 0.5;

/** Period at which the alarm pulses are re-scheduled, in milliseconds. */
const ALARM_RESCHEDULE_MS = 2000;

/* ===============================================================
 *  STATE
 * =============================================================== */

let ctx = null;
let masterGain = null;
let noiseBuffer = null;
let alarmOsc = null;
let alarmGain = null;
let alarmActive = false;
let alarmPulseTimer = null;

let lastClickTime = 0;
let clickInterval = 3000;

/* ===============================================================
 *  LIFECYCLE
 * =============================================================== */

/**
 * Create the AudioContext, master gain node and noise buffer.
 * Must be called from a user gesture handler so the browser
 * does not block AudioContext creation on autoplay policies.
 */
function init() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = ctx.createGain();
  masterGain.gain.value = MASTER_GAIN;
  masterGain.connect(ctx.destination);

  /* Pre-generate a short white noise buffer for click synthesis. */
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * NOISE_BUFFER_SECONDS;
  noiseBuffer = ctx.createBuffer(1, length, sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.8;
  }

  /* Gain node for the pulsing alarm tone. */
  alarmGain = ctx.createGain();
  alarmGain.gain.value = 0;
  alarmGain.connect(masterGain);
}

/** Resume the AudioContext after the page becomes visible again. */
function resume() {
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
}

/** Suspend the AudioContext when the page is hidden or backgrounded. */
function suspend() {
  if (ctx && ctx.state === 'running') {
    ctx.suspend();
  }
}

/**
 * Set the master output volume with a 50 ms smoothing ramp.
 * @param {number} volume - Target gain from 0.0 to 1.0.
 */
function setVolume(volume) {
  if (masterGain) {
    masterGain.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
  }
}

/* ===============================================================
 *  CLICK SYNTHESIS
 * =============================================================== */

/**
 * Play a single Geiger click: a 5-15 ms burst of shaped white noise
 * with a fast exponential decay to mimic a real GM tube click.
 */
function playClick() {
  if (!ctx || !noiseBuffer) {
    return;
  }

  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;

  const gain = ctx.createGain();
  const now = ctx.currentTime;
  const duration = 0.005 + Math.random() * 0.01;

  gain.gain.setValueAtTime(0.6 + Math.random() * 0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  source.connect(gain);
  gain.connect(masterGain);

  source.start(now);
  source.stop(now + duration + 0.01);
}

/* ===============================================================
 *  ALARM TONE (sine, pulsing)
 * =============================================================== */

/** Start the pulsing sine-wave alarm if not already running. */
function startAlarm() {
  if (alarmActive || !ctx) {
    return;
  }
  alarmActive = true;

  alarmOsc = ctx.createOscillator();
  alarmOsc.type = 'sine';
  alarmOsc.frequency.value = ALARM_FREQUENCY_HZ;
  alarmOsc.connect(alarmGain);
  alarmOsc.start();

  pulseAlarm();
}

/** Schedule one cycle of on/off gain pulses, then re-arm a timer. */
function pulseAlarm() {
  if (!alarmActive || !ctx || !alarmGain) {
    return;
  }
  /* Clear stale scheduled values before re-planning. */
  alarmGain.gain.cancelScheduledValues(ctx.currentTime);
  const now = ctx.currentTime;
  for (let i = 0; i < ALARM_PULSES_PER_CYCLE; i++) {
    const start = now + i * ALARM_PULSE_PERIOD_S;
    alarmGain.gain.setValueAtTime(ALARM_GAIN, start);
    alarmGain.gain.setValueAtTime(0, start + ALARM_PULSE_PERIOD_S / 2);
  }
  alarmPulseTimer = setTimeout(() => pulseAlarm(), ALARM_RESCHEDULE_MS);
}

/** Stop the alarm tone and cancel any pending pulse scheduling. */
function stopAlarm() {
  if (!alarmActive) {
    return;
  }
  alarmActive = false;
  /* Kill the recurring pulse timer to prevent orphan callbacks. */
  if (alarmPulseTimer !== null) {
    clearTimeout(alarmPulseTimer);
    alarmPulseTimer = null;
  }
  if (alarmGain) {
    alarmGain.gain.cancelScheduledValues(ctx.currentTime);
    alarmGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
  }
  if (alarmOsc) {
    alarmOsc.stop(ctx.currentTime + 0.1);
    alarmOsc = null;
  }
}

/* ===============================================================
 *  FRAME UPDATE
 * =============================================================== */

/**
 * Schedule Geiger clicks and manage the alarm tone for one frame.
 *
 * @param {number} intensity - Detection level from 0.0 to 1.0.
 * @param {number} timestamp - Current requestAnimationFrame timestamp.
 */
function update(intensity, timestamp) {
  if (!ctx) {
    return;
  }

  /*
   * Click interval scales exponentially with intensity:
   * idle (~0): one click every 2-4 s
   * max  (1):  ~30 clicks/s (33 ms interval)
   */
  if (intensity < 0.05) {
    clickInterval = IDLE_CLICK_MIN_MS + Math.random() * (IDLE_CLICK_MAX_MS - IDLE_CLICK_MIN_MS);
  } else {
    clickInterval = IDLE_CLICK_MIN_MS * Math.pow(CLICK_DECAY, intensity);
    clickInterval = Math.max(MIN_CLICK_INTERVAL_MS, clickInterval);
  }

  if (timestamp - lastClickTime >= clickInterval) {
    playClick();
    lastClickTime = timestamp;
  }

  if (intensity > INTENSITY_ALARM) {
    startAlarm();
  } else {
    stopAlarm();
  }
}

export default { init, resume, suspend, setVolume, update };
