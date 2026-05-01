/*
 * constants.js
 * Shared constants used across the detector modules.
 *
 * Centralizing intensity thresholds and timing values here keeps
 * the modules consistent: a single change here propagates to the
 * audio, radar, and signals subsystems.
 *
 * Author: O. Booklage
 * Date: April 2026
 * Licence: ISC
 */

/* ===============================================================
 *  INTENSITY THRESHOLDS (0.0 to 1.0)
 * =============================================================== */

/** Below this level the signal is treated as background noise. */
export const INTENSITY_IDLE_FLOOR = 0.1;

/** Above this level UI elements turn amber to signal active analysis. */
export const INTENSITY_WARNING = 0.3;

/** Above this level the radar, readouts and status turn red. */
export const INTENSITY_ALERT = 0.7;

/** Above this level the pulsing alarm tone activates. */
export const INTENSITY_ALARM = 0.85;
