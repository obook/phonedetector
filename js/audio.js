/*
 * audio.js
 * Geiger counter click engine using the Web Audio API.
 *
 * Generates short white-noise bursts that sound like Geiger counter
 * clicks. Click rate scales with detection intensity: slow ambient
 * ticks in idle mode, rapid crackling at maximum detection.
 * A pulsing sine-wave alarm activates above 85% intensity.
 *
 * No external audio files are needed - everything is synthesized.
 *
 * Author: O. Booklage
 * Date: April 2026
 * Licence: ISC
 */

let ctx = null;
let masterGain = null;
let noiseBuffer = null;
let alarmOsc = null;
let alarmGain = null;
let alarmActive = false;
let alarmPulseTimer = null;

let lastClickTime = 0;
let clickInterval = 3000;

function init() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = ctx.createGain();
  masterGain.gain.value = 0.7;
  masterGain.connect(ctx.destination);

  /* Pre-generate a 20 ms white noise buffer for click synthesis. */
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * 0.02;
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

function resume() {
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
}

function setVolume(v) {
  if (masterGain) {
    masterGain.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
  }
}

/*
 * Play a single Geiger click: a 5-15 ms burst of shaped white noise.
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
 *  ALARM TONE (800 Hz sine, pulsing at 2 Hz)
 * =============================================================== */

function startAlarm() {
  if (alarmActive || !ctx) {
    return;
  }
  alarmActive = true;

  alarmOsc = ctx.createOscillator();
  alarmOsc.type = 'sine';
  alarmOsc.frequency.value = 800;
  alarmOsc.connect(alarmGain);
  alarmOsc.start();

  pulseAlarm();
}

/* Schedule 2 seconds of on/off gain pulses, then repeat. */
function pulseAlarm() {
  if (!alarmActive || !ctx || !alarmGain) {
    return;
  }
  /* Clear stale scheduled values before re-planning. */
  alarmGain.gain.cancelScheduledValues(ctx.currentTime);
  const now = ctx.currentTime;
  for (let i = 0; i < 4; i++) {
    alarmGain.gain.setValueAtTime(0.3, now + i * 0.5);
    alarmGain.gain.setValueAtTime(0, now + i * 0.5 + 0.25);
  }
  alarmPulseTimer = setTimeout(() => pulseAlarm(), 2000);
}

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

/*
 * Called every frame by the main loop.
 * Schedules Geiger clicks and manages the alarm tone.
 *
 * @param {number} intensity - Detection level from 0.0 to 1.0.
 * @param {number} timestamp - Current requestAnimationFrame timestamp.
 */
function update(intensity, timestamp) {
  if (!ctx) {
    return;
  }

  /*
   * Click interval scales exponentially:
   * idle (~0): one click every 2-4 s
   * max  (1):  ~30 clicks/s (33 ms interval)
   */
  if (intensity < 0.05) {
    clickInterval = 2000 + Math.random() * 2000;
  } else {
    clickInterval = 2000 * Math.pow(0.015, intensity);
    clickInterval = Math.max(33, clickInterval);
  }

  if (timestamp - lastClickTime >= clickInterval) {
    playClick();
    lastClickTime = timestamp;
  }

  /* Activate alarm above 85% intensity. */
  if (intensity > 0.85) {
    startAlarm();
  } else {
    stopAlarm();
  }
}

export default { init, resume, setVolume, update };
