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

/* ===============================================================
 *  DOM REFERENCES
 * =============================================================== */

let logEl, freqEl, peakPowerEl, deviceCountEl;
let radarStatus, logSection, statusLed, statusText;
let footerTimeEl;

let lastLogTime = 0;
let lastFreqTime = 0;
let deviceCount = 0;
let lastDeviceUpdate = 0;

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
  const d = new Date();
  return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}

function pad(n) {
  return n.toString().padStart(2, '0');
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function addLog(msg, cls) {
  const line = document.createElement('div');
  line.className = 'log-line ' + (cls || 'info');
  line.textContent = '[' + getTimestamp() + '] ' + msg;
  logEl.appendChild(line);
  while (logEl.children.length > 100) {
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
    if (pct > 70) {
      bar.classList.add('critical');
      dbm.classList.add('critical');
    } else if (pct > 40) {
      bar.classList.add('warning');
      dbm.classList.add('warning');
    }
  }
}

function updateFrequency(intensity, timestamp) {
  if (timestamp - lastFreqTime < 150) {
    return;
  }
  lastFreqTime = timestamp;

  if (intensity < 0.1) {
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

  freqEl.className = 'readout-value';
  peakPowerEl.className = 'readout-value';
  if (intensity > 0.7) {
    freqEl.classList.add('critical');
    peakPowerEl.classList.add('critical');
  } else if (intensity > 0.3) {
    freqEl.classList.add('warning');
    peakPowerEl.classList.add('warning');
  }
}

function updateDeviceCount(intensity, timestamp) {
  if (timestamp - lastDeviceUpdate < 2000) {
    return;
  }
  lastDeviceUpdate = timestamp;

  if (intensity < 0.1) {
    deviceCount = 0;
  } else if (intensity < 0.4) {
    deviceCount = Math.floor(Math.random() * 2) + 1;
  } else if (intensity < 0.7) {
    deviceCount = Math.floor(Math.random() * 3) + 2;
  } else {
    deviceCount = Math.floor(Math.random() * 5) + 4;
  }

  deviceCountEl.textContent = deviceCount;
  deviceCountEl.className = 'readout-value readout-count';
  if (intensity > 0.7) {
    deviceCountEl.classList.add('critical');
  } else if (intensity > 0.3) {
    deviceCountEl.classList.add('warning');
  }
}

function updateLog(intensity, timestamp) {
  const logRate = intensity < 0.1 ? 4000 : Math.max(400, 3000 * (1 - intensity));
  if (timestamp - lastLogTime < logRate) {
    return;
  }
  lastLogTime = timestamp;

  if (intensity < 0.1) {
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
  if (intensity > 0.7) {
    radarStatus.textContent = 'SIGNAL DETECTED';
    radarStatus.className = 'radar-status alert';
    logSection.classList.add('alert-border');
    statusLed.className = 'status-led critical';
    statusText.textContent = 'RF ALERT';
    statusText.className = 'status-text critical';
  } else if (intensity > 0.2) {
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
