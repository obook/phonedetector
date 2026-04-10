# SENTINEL RF-7200 - Portable Spectrum Analyzer

![License](https://img.shields.io/badge/license-MIT-blue)
![Platform](https://img.shields.io/badge/platform-web%20%7C%20android-green)
![Build](https://img.shields.io/badge/build-Capacitor-orange)

A fake but convincing RF signal detector web app designed as a classroom prank. It simulates a professional-grade TSCM (Technical Surveillance Counter-Measures) device that pretends to detect phones, smartwatches, wireless earbuds, and other connected devices nearby.

Built to look and sound like real equipment - Geiger counter clicks, radar sweep, signal bars, scrolling event log - so students genuinely believe their devices are being scanned and rush to turn them off.

**This app does not actually detect anything.** The teacher secretly controls the results.

## How it works

1. Open the app on your phone or tablet, facing the class.
2. The boot sequence plays automatically, looking like real firmware initialization.
3. Tap anywhere on the boot screen to enter fullscreen, then tap "START SCAN."
4. In idle mode, the radar sweeps quietly with occasional background clicks.
5. **Triple-tap the title** "SENTINEL RF-7200" to start ramping up detection.
6. Signal bars rise, Geiger clicks accelerate, alert messages flood the log.
7. Triple-tap again to ramp back down.
8. Watch students scramble to turn off their phones.

## Secret controls

| Action | Effect |
|---|---|
| Triple-tap the title | Toggle detection on/off |
| Volume Up key (Android) | Start detection ramp-up |
| Volume Down key (Android) | Start ramp-down |
| Long press bottom-right corner (1.5 s) | Open hidden calibration panel (speed, volume, reset) |
| Tap the logo icon (diamond shape) | Toggle fullscreen |
| Tap the speaker icon | Toggle sound on/off |

## Running locally

```bash
npx serve .
```

Open the URL in Chrome on your phone. Tap anywhere on the boot screen to go fullscreen, then tap "START SCAN."

## Building the Android APK

Requires Node.js and Android Studio.

```bash
npm install
npm run cap:sync
npm run cap:open        # opens Android Studio
npm run build:android   # builds debug APK directly
```

The APK is output at `android/app/build/outputs/apk/debug/app-debug.apk`. Transfer it to your device and install.

## Android-specific features

The native Android build includes behaviors that the web version cannot provide:

- **Immersive fullscreen**: status bar and navigation bar are hidden at launch. Swipe from an edge to reveal them temporarily.
- **Screen always on**: the display never dims or locks while the app is in the foreground.
- **Lock screen bypass**: the app shows above the lock screen and dismisses the keyguard automatically.

## Tech stack

- Vanilla HTML, CSS, JavaScript (ES modules) - no framework, no build step
- Web Audio API for Geiger counter clicks and alarm tones (no audio files)
- Canvas 2D for the radar sweep animation
- All fonts bundled locally (IBM Plex Mono, Oxanium) - works fully offline
- Capacitor for Android APK packaging
- Wake Lock API to prevent screen sleep (web)
- Fullscreen API for immersive display (web)

## Project structure

```
index.html           Single-page app
css/style.css        Dark instrument-panel theme
js/
  app.js             Main loop, boot sequence, fullscreen, sound toggle
  controls.js        State machine + secret trigger handlers
  audio.js           Geiger click engine (Web Audio API)
  radar.js           Canvas radar sweep with blips
  signals.js         Signal bars, frequency readout, event log
fonts/               IBM Plex Mono + Oxanium (local TTF files)
android/             Capacitor Android project
```

## Tips for maximum effect

- Use a Bluetooth speaker for louder Geiger clicks that fill the room.
- Hold the phone screen toward the class so they can see the radar and signal bars.
- Start with a calm scan, then slowly ramp up while walking between desks.
- Point toward a specific student's bag for dramatic effect.
- Keep a straight face.

## License

MIT
