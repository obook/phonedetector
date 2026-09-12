/*
 * licence.js
 * Licence data for this build.
 *
 * EXPIRATION_DATE is rewritten by the publishing tool at build time, the
 * same way the Kotlin apps of the catalogue carry it in Licence.kt. Keep
 * the declaration on a single line: the tool matches it by pattern.
 *
 * Author: O. Booklage
 * Date: September 2026
 * Licence: ISC
 */

/* Expiry of this build. null means no expiry date at all. */
export const EXPIRATION_DATE = null;

/** Shown to the user, and on the download site. */
export const AUTHOR = 'Olivier Booklage';
export const WEBSITE = 'https://android.keosystems.com/magie';

/* True when this build never expires. */
export function isUnlimited() {
  return EXPIRATION_DATE === null;
}

/* True when the expiry date has passed. */
export function isExpired() {
  return EXPIRATION_DATE !== null && Date.now() > EXPIRATION_DATE.getTime();
}
