/*
 * signals.js
 * Signal bars, frequency readout, event log, and status indicators.
 *
 * Updates the four RF band power bars, the frequency lock display,
 * the peak power readout, the detected device counter, and the
 * scrolling event log. All values are driven by the detection
 * intensity provided by the controls module each frame.
 *
 * Author: O. Booklage
 * Date: April 2026
 * Licence: ISC
 */

import {
  INTENSITY_ALERT,
  INTENSITY_WARNING,
  INTENSITY_IDLE_FLOOR
} from './constants.js';

/* ===============================================================
 *  DATA
 * =============================================================== */

const BANDS = [
  { id: 'gsm',    baseDbm: -98, freqs: ['869.2 MHz', '1842.5 MHz', '2145.0 MHz', '3510.8 MHz'] },
  { id: 'wifi24', baseDbm: -95, freqs: ['2.412 GHz', '2.437 GHz', '2.462 GHz'] },
  { id: 'wifi5',  baseDbm: -97, freqs: ['5.180 GHz', '5.240 GHz', '5.745 GHz', '5.805 GHz'] },
  { id: 'bt',     baseDbm: -96, freqs: ['2.402 GHz', '2.426 GHz', '2.450 GHz', '2.480 GHz'] }
];

const LOG_IDLE = [
  'Passive sweep - no significant RF activity',
  'Background noise floor within parameters',
  'Sweep complete - all monitored bands clear',
  'Monitoring... no active transmitters in range',
  'RF environment nominal - noise floor -96 dBm'
];

const LOG_DETECTING = [
  'ALERT - 802.11n beacon detected @ {freq} ({dbm})',
  'WARNING - Bluetooth LE advertisement in proximity',
  'ALERT - GSM uplink burst detected @ {freq}',
  'WARNING - Active Wi-Fi probe request intercepted',
  'ALERT - 4G LTE PUSCH detected @ {freq} ({dbm})',
  'CRITICAL - Multiple active transmitters in range',
  'WARNING - BT classic pairing request @ 2.4 GHz ISM',
  'ALERT - 5G NR PRACH detected @ {freq} ({dbm})',
  'CRITICAL - Strong RF emission source < 3 m',
  'WARNING - BLE beacon (smartwatch profile) detected',
  'ALERT - A2DP audio stream (wireless earbuds) active',
  'CRITICAL - Device performing cellular handover',
  'WARNING - Wi-Fi Direct probe @ {freq}',
  'ALERT - Cellular signaling detected - UE active',
  'CRITICAL - Multiple BLE peripherals in proximity'
];

/** Bar percentage above which the bar turns red. */
const BAR_CRITICAL_PCT = 70;

/** Bar percentage above which the bar turns amber. */
const BAR_WARNING_PCT = 40;

/** Maximum number of log lines kept in the DOM at the same time. */
const MAX_LOG_LINES = 100;

/** Throttle period between two frequency readout updates, in milliseconds. */
const FREQ_REFRESH_MS = 150;

/** Throttle period between two device-count updates, in milliseconds. */
const DEVICE_REFRESH_MS = 2000;

/** Log update period when intensity is at the idle floor, in milliseconds. */
const LOG_IDLE_PERIOD_MS = 4000;

/** Minimum log update period at maximum intensity, in milliseconds. */
const LOG_MIN_PERIOD_MS = 400;

/** Reference log update period at zero intensity, in milliseconds. */
const LOG_BASE_PERIOD_MS = 3000;

/* ===============================================================
 *  DOM REFERENCES
 * =============================================================== */

let logEl;
let freqEl;
let peakPowerEl;
let deviceCountEl;
let radarStatus;
let logSection;
let statusLed;
let statusText;
let footerTimeEl;

let lastLogTime = 0;
let lastFreqTime = 0;
let deviceCount = 0;
let lastDeviceUpdate = 0;

/** Bind every DOM element this module updates each frame. */
function init() {
  logEl = document.getElementById('log-output');
  freqEl = document.getElementById('freq-value');
  peakPowerEl = document.getElementById('peak-power');
  deviceCountEl = document.getElementById('device-count');
  radarStatus = document.getElementById('radar-status');
  logSection = document.getElementById('log-section');
  statusLed = document.getElementById('status-led');
  statusText = document.getElementById('status-text');
  footerTimeEl = document.getElementById('footer-time');
}

/* ===============================================================
 *  HELPERS
 * =============================================================== */

function getTimestamp() {
  const now = new Date();
  return pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
}

function pad(n) {
  return n.toString().padStart(2, '0');
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Reset the element class to baseClass and add 'critical' or 'warning'
 * based on the current intensity thresholds.
 *
 * @param {HTMLElement} el        - Element whose className is rewritten.
 * @param {string}      baseClass - Class names always applied (space-separated).
 * @param {number}      intensity - Detection level from 0.0 to 1.0.
 */
function applyIntensityClass(el, baseClass, intensity) {
  el.className = baseClass;
  if (intensity > INTENSITY_ALERT) {
    el.classList.add('critical');
  } else if (intensity > INTENSITY_WARNING) {
    el.classList.add('warning');
  }
}

function addLog(msg, cls) {
  const line = document.createElement('div');
  line.className = 'log-line ' + (cls || 'info');
  line.textContent = '[' + getTimestamp() + '] ' + msg;
  logEl.appendChild(line);
  while (logEl.children.length > MAX_LOG_LINES) {
    logEl.removeChild(logEl.firstChild);
  }
  logEl.scrollTop = logEl.scrollHeight;
}

/* ===============================================================
 *  UPDATE FUNCTIONS
 * =============================================================== */

function updateBars(intensity) {
  for (const band of BANDS) {
    const bar = document.getElementById('bar-' + band.id);
    const dbm = document.getElementById('dbm-' + band.id);
    if (!bar || !dbm) {
      continue;
    }

    const noise = (Math.random() - 0.5) * 6;
    const pct = Math.min(100, Math.max(2, intensity * 90 + noise + 5));
    bar.style.width = pct + '%';

    const dbmVal = Math.round(band.baseDbm + intensity * (band.baseDbm * -0.85) + noise);
    const clampedDbm = Math.min(-10, Math.max(-100, dbmVal));
    dbm.textContent = clampedDbm + ' dBm';

    bar.className = 'bar-fill';
    dbm.className = 'dbm-value';
    if (pct > BAR_CRITICAL_PCT) {
      bar.classList.add('critical');
      dbm.classList.add('critical');
    } else if (pct > BAR_WARNING_PCT) {
      bar.classList.add('warning');
      dbm.classList.add('warning');
    }
  }
}

function updateFrequency(intensity, timestamp) {
  if (timestamp - lastFreqTime < FREQ_REFRESH_MS) {
    return;
  }
  lastFreqTime = timestamp;

  if (intensity < INTENSITY_IDLE_FLOOR) {
    freqEl.textContent = '---';
    freqEl.className = 'readout-value';
    peakPowerEl.textContent = '--- dBm';
    peakPowerEl.className = 'readout-value';
    return;
  }

  const band = pickRandom(BANDS);
  const freq = pickRandom(band.freqs);
  const parts = freq.split(' ');
  const num = parseFloat(parts[0]);
  const isMHz = parts[1] === 'MHz';
  const jitter = (Math.random() - 0.5) * (isMHz ? 0.6 : 0.006);
  const decimals = isMHz ? 1 : 3;
  freqEl.textContent = (num + jitter).toFixed(decimals) + ' ' + parts[1];

  const peakDbm = Math.round(
    band.baseDbm + intensity * (band.baseDbm * -0.9) + (Math.random() - 0.5) * 4
  );
  peakPowerEl.textContent = Math.min(-8, Math.max(-100, peakDbm)) + ' dBm';

  applyIntensityClass(freqEl, 'readout-value', intensity);
  applyIntensityClass(peakPowerEl, 'readout-value', intensity);
}

function updateDeviceCount(intensity, timestamp) {
  if (timestamp - lastDeviceUpdate < DEVICE_REFRESH_MS) {
    return;
  }
  lastDeviceUpdate = timestamp;

  if (intensity < INTENSITY_IDLE_FLOOR) {
    deviceCount = 0;
  } else if (intensity < 0.4) {
    deviceCount = Math.floor(Math.random() * 2) + 1;
  } else if (intensity < INTENSITY_ALERT) {
    deviceCount = Math.floor(Math.random() * 3) + 2;
  } else {
    deviceCount = Math.floor(Math.random() * 5) + 4;
  }

  deviceCountEl.textContent = deviceCount;
  applyIntensityClass(deviceCountEl, 'readout-value readout-count', intensity);
}

function updateLog(intensity, timestamp) {
  const logRate = intensity < INTENSITY_IDLE_FLOOR
    ? LOG_IDLE_PERIOD_MS
    : Math.max(LOG_MIN_PERIOD_MS, LOG_BASE_PERIOD_MS * (1 - intensity));
  if (timestamp - lastLogTime < logRate) {
    return;
  }
  lastLogTime = timestamp;

  if (intensity < INTENSITY_IDLE_FLOOR) {
    addLog(pickRandom(LOG_IDLE), 'info');
    return;
  }

  const template = pickRandom(LOG_DETECTING);
  const band = pickRandom(BANDS);
  const freq = pickRandom(band.freqs);
  const dbm = Math.round(band.baseDbm + intensity * (band.baseDbm * -0.8));
  const msg = template.replace('{freq}', freq).replace('{dbm}', dbm + ' dBm');
  const cls = msg.includes('CRITICAL') ? 'critical' : 'warn';
  addLog(msg, cls);
}

function updateStatus(intensity) {
  if (intensity > INTENSITY_ALERT) {
    radarStatus.textContent = 'SIGNAL DETECTED';
    radarStatus.className = 'radar-status alert';
    logSection.classList.add('alert-border');
    statusLed.className = 'status-led critical';
    statusText.textContent = 'RF ALERT';
    statusText.className = 'status-text critical';
  } else if (intensity > INTENSITY_WARNING) {
    radarStatus.textContent = 'ANALYZING';
    radarStatus.className = 'radar-status analyzing';
    logSection.classList.remove('alert-border');
    statusLed.className = 'status-led warning';
    statusText.textContent = 'ANALYZING';
    statusText.className = 'status-text warning';
  } else {
    radarStatus.textContent = 'SCANNING';
    radarStatus.className = 'radar-status';
    logSection.classList.remove('alert-border');
    statusLed.className = 'status-led';
    statusText.textContent = 'OPERATIONAL';
    statusText.className = 'status-text';
  }
}

/* ===============================================================
 *  PUBLIC API
 * =============================================================== */

/**
 * Refresh every signal display for the current frame.
 *
 * @param {number} intensity - Detection level from 0.0 to 1.0.
 * @param {number} timestamp - Current requestAnimationFrame timestamp.
 */
function update(intensity, timestamp) {
  updateBars(intensity);
  updateFrequency(intensity, timestamp);
  updateDeviceCount(intensity, timestamp);
  updateLog(intensity, timestamp);
  updateStatus(intensity);
  if (footerTimeEl) {
    footerTimeEl.textContent = getTimestamp();
  }
}

export default { init, update };
