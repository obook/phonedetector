# SENTINEL RF-7200 - Portable Spectrum Analyzer

![License](https://img.shields.io/badge/license-MIT-blue)
![Version](https://img.shields.io/badge/version-1.0.0-brightgreen)
![Platform](https://img.shields.io/badge/platform-web%20%7C%20android-green)
![Build](https://img.shields.io/badge/build-Capacitor%208-orange)
![JavaScript](https://img.shields.io/badge/javascript-ES%20modules-F7DF1E?logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-Canvas%20%2B%20Web%20Audio-E34F26?logo=html5&logoColor=white)
![Offline](https://img.shields.io/badge/network-fully%20offline-9cf)

Faux détecteur de signaux radio, assez convaincant pour servir de farce en classe. L'application imite un appareil professionnel de contre-surveillance et fait mine de repérer les téléphones, montres connectées, écouteurs sans fil et autres appareils alentour.

Tout y est pour que l'illusion tienne : cliquetis de compteur Geiger, balayage radar, barres de signal, journal d'événements qui défile. Les élèves croient leurs appareils détectés et se précipitent pour les éteindre.

**L'application ne détecte rien du tout.** C'est l'enseignant qui commande les résultats, discrètement.

## Déroulement

1. Ouvrez l'application sur un téléphone ou une tablette, écran tourné vers la classe.
2. La séquence de démarrage se joue toute seule, à la manière d'un vrai micrologiciel.
3. Touchez l'écran de démarrage pour passer en plein écran, puis appuyez sur "START SCAN".
4. Au repos, le radar balaie tranquillement, avec quelques cliquetis de fond.
5. **Touchez l'écran n'importe où** pour déclencher la détection, confirmée par une vibration.
6. Les barres montent, les cliquetis s'accélèrent, les messages d'alerte remplissent le journal.
7. Touchez de nouveau pour redescendre.
8. Regardez les téléphones s'éteindre.

## Commandes secrètes

| Geste | Effet |
|---|---|
| Toucher l'écran, n'importe où | Déclenche ou arrête la détection (retour par vibration) |
| Appui long de 1,5 s dans le coin bas droit | Ouvre le panneau de réglage caché : vitesse, volume, remise à zéro |
| Toucher le logo en losange | Bascule le plein écran |
| Toucher l'icône de haut-parleur | Coupe ou rétablit le son |

## Conseils

- Une enceinte Bluetooth donne des cliquetis qui emplissent la salle.
- Tenez l'écran vers la classe : le radar et les barres font la moitié du travail.
- Commencez par un balayage calme, puis montez en intensité en circulant entre les tables.
- Pointez le sac d'un élève en particulier pour l'effet.
- Gardez votre sérieux.

## Particularités de la version Android

La version native ajoute ce que le navigateur ne sait pas faire :

- **plein écran immersif** : barre d'état et barre de navigation masquées au lancement, révélées par un balayage depuis un bord ;
- **écran toujours allumé** : l'affichage ne s'atténue ni ne se verrouille tant que l'application est au premier plan ;
- **passage de l'écran de verrouillage** : l'application s'affiche par-dessus et écarte le verrou.

## En cas de problème

- **L'écran s'éteint tout seul** : l'application l'empêche normalement ; vérifiez qu'elle est bien au premier plan.
- **Pas de son** : touchez l'icône de haut-parleur, ou montez le volume média de l'appareil.
- **Le radar se fige** : revenez à l'écran d'accueil du téléphone, puis rouvrez l'application.

## À savoir

- L'application fonctionne entièrement hors ligne, sans connexion.
- Elle ne collecte aucune donnée et n'envoie rien à l'extérieur.
- Elle ne capte ni ondes radio, ni Bluetooth, ni Wi-Fi : tout est simulé.

## Licence

Publié sous [licence MIT](LICENSE).

### Licences des composants

| Composant | Licence | Auteur |
|---|---|---|
| [IBM Plex Mono](https://github.com/IBM/plex) | [SIL Open Font License 1.1](https://scripts.sil.org/OFL) | IBM Corp. |
| [Oxanium](https://github.com/sevmeyer/oxanium) | [SIL Open Font License 1.1](https://scripts.sil.org/OFL) | Severin Meyer |
| [Capacitor](https://capacitorjs.com/) | MIT | Ionic Team |

---

# English

A fake but convincing RF signal detector, designed as a classroom prank. It simulates a professional TSCM device and pretends to detect phones, smartwatches, wireless earbuds and other connected devices nearby.

Everything is there to sell the illusion: Geiger counter clicks, radar sweep, signal bars, and a scrolling event log. Students believe their devices are being scanned and rush to turn them off.

**The app does not detect anything.** The teacher secretly controls the results.

## How it works

1. Open the app on a phone or tablet, facing the class.
2. The boot sequence plays automatically, looking like real firmware initialization.
3. Tap anywhere on the boot screen to enter fullscreen, then tap "START SCAN".
4. In idle mode, the radar sweeps quietly with occasional background clicks.
5. **Tap anywhere on the screen** to toggle detection, with haptic feedback.
6. Signal bars rise, Geiger clicks accelerate, alert messages flood the log.
7. Tap again to ramp back down.
8. Watch the phones go dark.

## Secret controls

| Action | Effect |
|---|---|
| Tap anywhere on screen | Toggle detection on and off (vibration feedback) |
| Long press bottom-right corner, 1.5 s | Open the hidden calibration panel: speed, volume, reset |
| Tap the diamond logo | Toggle fullscreen |
| Tap the speaker icon | Toggle sound |

## Tips

- A Bluetooth speaker gives Geiger clicks that fill the room.
- Hold the screen toward the class: the radar and the bars do half the work.
- Start with a calm scan, then ramp up while walking between desks.
- Point at one student's bag for dramatic effect.
- Keep a straight face.

## Android-specific features

The native build adds what the browser cannot provide:

- **immersive fullscreen**: status and navigation bars hidden at launch, revealed by an edge swipe;
- **screen always on**: the display never dims or locks while the app is in the foreground;
- **lock screen bypass**: the app shows above the lock screen and dismisses the keyguard.

## Troubleshooting

- **The screen turns off**: the app normally prevents this; make sure it is in the foreground.
- **No sound**: tap the speaker icon, or raise the media volume of the device.
- **The radar freezes**: go back to the home screen, then reopen the app.

## Good to know

- The app runs fully offline, with no connection at all.
- It collects no data and sends nothing anywhere.
- It picks up no radio, Bluetooth or Wi-Fi signal: everything is simulated.

## License

Released under the [MIT License](LICENSE). Third-party licenses are listed in the French section above.
