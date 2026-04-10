/*
 * radar.js
 * Canvas-based radar sweep animation.
 *
 * Draws a circular radar display with concentric rings, a rotating
 * sweep line with a trailing gradient, and blips that appear based
 * on the current detection intensity. Colors shift from teal to red
 * when intensity exceeds the alert threshold (0.65).
 *
 * Author: O. Booklage
 * Date: April 2026
 * Licence: ISC
 */

let canvas, ctxR;
let angle = 0;
let blips = [];
let lastBlipTime = 0;

/* Instrument color palette. */
const COLOR_GRID    = '#0e1e35';
const COLOR_GRID_HI = '#152a45';
const COLOR_TRAIL   = 'rgba(0, 229, 200, 0.08)';
const COLOR_BLIP    = '#00e5c8';
const COLOR_ALERT   = '#ef4444';
const COLOR_CENTER  = '#00e5c8';
const COLOR_RIM     = '#1c2640';
const COLOR_RIM_ALT = 'rgba(239, 68, 68, 0.4)';

function init() {
  canvas = document.getElementById('radar-canvas');
  ctxR = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
}

/* Match canvas resolution to its CSS size and device pixel ratio. */
function resize() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctxR.setTransform(dpr, 0, 0, dpr, 0, 0);
  /* Clear stale blips whose coordinates match the old dimensions. */
  blips = [];
}

/*
 * Render one frame of the radar animation.
 *
 * @param {number} intensity - Detection level from 0.0 to 1.0.
 * @param {number} timestamp - Current requestAnimationFrame timestamp.
 */
function draw(intensity, timestamp) {
  if (!ctxR) {
    return;
  }

  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(cx, cy) * 0.85;

  /* Clear with a slight fade to create a phosphor trail effect. */
  ctxR.fillStyle = 'rgba(8, 13, 25, 0.18)';
  ctxR.fillRect(0, 0, w, h);

  drawGrid(cx, cy, radius);
  drawSweep(cx, cy, radius, intensity);
  updateBlips(cx, cy, radius, intensity, timestamp);
  drawBlips(intensity);
  drawCenter(cx, cy);
  drawRim(cx, cy, radius, intensity);
  drawDistanceLabels(cx, cy, radius);
}

function drawGrid(cx, cy, radius) {
  /* Concentric rings. */
  ctxR.lineWidth = 0.5;
  for (let i = 1; i <= 5; i++) {
    ctxR.strokeStyle = i % 2 === 0 ? COLOR_GRID_HI : COLOR_GRID;
    ctxR.beginPath();
    ctxR.arc(cx, cy, radius * (i / 5), 0, Math.PI * 2);
    ctxR.stroke();
  }

  /* Cardinal cross-hairs. */
  ctxR.strokeStyle = COLOR_GRID;
  ctxR.lineWidth = 0.5;
  ctxR.beginPath();
  ctxR.moveTo(cx - radius, cy);
  ctxR.lineTo(cx + radius, cy);
  ctxR.moveTo(cx, cy - radius);
  ctxR.lineTo(cx, cy + radius);
  ctxR.stroke();

  /* Diagonal cross-hairs (faint). */
  ctxR.strokeStyle = 'rgba(14, 30, 53, 0.6)';
  ctxR.beginPath();
  const d = radius * 0.707;
  ctxR.moveTo(cx - d, cy - d);
  ctxR.lineTo(cx + d, cy + d);
  ctxR.moveTo(cx + d, cy - d);
  ctxR.lineTo(cx - d, cy + d);
  ctxR.stroke();
}

function drawSweep(cx, cy, radius, intensity) {
  /* Sweep rotates faster when detection intensity is high. */
  const sweepSpeed = 1.0 + intensity * 1.0;
  angle += sweepSpeed * 0.016;
  if (angle > Math.PI * 2) {
    angle -= Math.PI * 2;
  }

  /* Trailing gradient arc behind the sweep line.
   * createConicGradient is not supported in older browsers (Firefox < 112,
   * old Android WebViews). Fall back to a simple radial fill if absent. */
  if (ctxR.createConicGradient) {
    const trailArc = 0.6;
    const grad = ctxR.createConicGradient(angle - trailArc, cx, cy);
    grad.addColorStop(0, 'rgba(0, 229, 200, 0)');
    grad.addColorStop(trailArc / (Math.PI * 2), intensity > 0.7
      ? 'rgba(239, 68, 68, 0.10)'
      : COLOR_TRAIL);
    grad.addColorStop(trailArc / (Math.PI * 2) + 0.001, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctxR.fillStyle = grad;
    ctxR.beginPath();
    ctxR.arc(cx, cy, radius, 0, Math.PI * 2);
    ctxR.fill();
  }

  /* Sweep line. */
  const sweepColor = intensity > 0.7
    ? `rgba(239, 68, 68, ${0.5 + intensity * 0.3})`
    : `rgba(0, 229, 200, ${0.4 + intensity * 0.3})`;
  ctxR.strokeStyle = sweepColor;
  ctxR.lineWidth = 1.5;
  ctxR.beginPath();
  ctxR.moveTo(cx, cy);
  ctxR.lineTo(
    cx + Math.cos(angle) * radius,
    cy + Math.sin(angle) * radius
  );
  ctxR.stroke();
}

function updateBlips(cx, cy, radius, intensity, timestamp) {
  const blipRate = intensity > 0.1 ? 250 / intensity : 6000;
  if (timestamp - lastBlipTime > blipRate && intensity > 0.03) {
    const dist = 0.15 + Math.random() * 0.78;
    const a = Math.random() * Math.PI * 2;
    blips.push({
      x: cx + Math.cos(a) * radius * dist,
      y: cy + Math.sin(a) * radius * dist,
      life: 1,
      size: 1.5 + Math.random() * 2.5 * intensity
    });
    lastBlipTime = timestamp;
    if (blips.length > 35) {
      blips.shift();
    }
  }
}

function drawBlips(intensity) {
  const isAlert = intensity > 0.65;
  for (let i = blips.length - 1; i >= 0; i--) {
    const b = blips[i];
    b.life -= 0.006 + intensity * 0.004;
    if (b.life <= 0) {
      blips.splice(i, 1);
      continue;
    }
    const alpha = b.life * (0.4 + intensity * 0.5);

    ctxR.shadowColor = isAlert ? COLOR_ALERT : COLOR_BLIP;
    ctxR.shadowBlur = 10 * b.life * intensity;

    ctxR.fillStyle = isAlert
      ? `rgba(239, 68, 68, ${alpha})`
      : `rgba(0, 229, 200, ${alpha})`;
    ctxR.beginPath();
    ctxR.arc(b.x, b.y, b.size * b.life, 0, Math.PI * 2);
    ctxR.fill();

    /* Bright core for fresh blips. */
    if (b.life > 0.5) {
      ctxR.fillStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
      ctxR.beginPath();
      ctxR.arc(b.x, b.y, b.size * b.life * 0.35, 0, Math.PI * 2);
      ctxR.fill();
    }
  }
  ctxR.shadowBlur = 0;
}

function drawCenter(cx, cy) {
  ctxR.fillStyle = COLOR_CENTER;
  ctxR.shadowColor = COLOR_CENTER;
  ctxR.shadowBlur = 4;
  ctxR.beginPath();
  ctxR.arc(cx, cy, 2.5, 0, Math.PI * 2);
  ctxR.fill();
  ctxR.shadowBlur = 0;
}

function drawRim(cx, cy, radius, intensity) {
  ctxR.strokeStyle = intensity > 0.7 ? COLOR_RIM_ALT : COLOR_RIM;
  ctxR.lineWidth = 1.5;
  ctxR.beginPath();
  ctxR.arc(cx, cy, radius, 0, Math.PI * 2);
  ctxR.stroke();
}

function drawDistanceLabels(cx, cy, radius) {
  ctxR.font = '8px IBM Plex Mono, monospace';
  ctxR.fillStyle = 'rgba(90, 106, 128, 0.5)';
  ctxR.textAlign = 'left';
  ctxR.textBaseline = 'bottom';
  ctxR.fillText('3m', cx + 3, cy - radius * 0.2 - 2);
  ctxR.fillText('6m', cx + 3, cy - radius * 0.4 - 2);
  ctxR.fillText('9m', cx + 3, cy - radius * 0.6 - 2);
  ctxR.fillText('12m', cx + 3, cy - radius * 0.8 - 2);
  ctxR.fillText('15m', cx + 3, cy - radius - 2);
}

export default { init, draw };
