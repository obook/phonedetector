# SENTINEL RF-7200 -- notes techniques

Document interne, destiné à l'auteur et aux développeurs. Il n'est pas publié
sur le site : l'outil de publication n'envoie que `README.md`, qui sert de
notice à l'utilisateur, en français puis en anglais.

## Développement local

```bash
npx serve .
```

Ouvrir l'URL dans Chrome sur le téléphone, toucher l'écran de démarrage pour
passer en plein écran, puis "START SCAN".

## Compilation de l'APK

Node.js et Android Studio sont nécessaires.

```bash
npm install              # une fois par poste
npm run cap:sync         # copie les fichiers web dans www/ puis synchronise Capacitor
npm run cap:open         # ouvre le projet dans Android Studio
npm run build:android    # APK de debug
```

Pour la release signée, celle qui est publiée :

```bash
npm run cap:sync && cd android && ./gradlew assembleRelease
```

L'APK produit est `android/app/build/outputs/apk/release/phonedetector-release.apk` ;
son nom vient de la règle `outputFileName` d'`android/app/build.gradle`.

## Pile technique

- HTML, CSS et JavaScript en modules ES, sans cadre applicatif ni étape de
  construction.
- Web Audio API pour les cliquetis Geiger et l'alarme, sans aucun fichier son.
- Canvas 2D pour le balayage radar.
- Polices embarquées localement (IBM Plex Mono, Oxanium) : tout fonctionne
  hors ligne, sans requête réseau.
- Capacitor pour l'empaquetage Android.
- Wake Lock API et Fullscreen API pour la version web.

## Structure

```
index.html           Application d'une seule page
css/style.css        Thème sombre, façon panneau d'instrument
js/
  app.js             Boucle principale, démarrage, plein écran, son
  controls.js        Machine à états et gestes secrets
  audio.js           Cliquetis Geiger (Web Audio API)
  radar.js           Balayage radar sur Canvas
  signals.js         Barres de signal, fréquences, journal
  licence.js         Date limite d'utilisation de la version publiée
fonts/               IBM Plex Mono et Oxanium, fichiers TTF locaux
www/                 Copie générée des fichiers web, ne pas éditer
android/             Projet Android Capacitor
```

## Licence de démonstration

`js/licence.js` porte `EXPIRATION_DATE` : `null` pour une version sans date
limite, sinon un objet `Date`. Passé cette date, le bouton de démarrage se
désactive et affiche "DEMO EXPIRED".

L'outil de publication réécrit cette ligne, comme il réécrit `Licence.kt`
dans les applications Kotlin du catalogue. Elle doit donc rester sur une
seule ligne, de la forme `export const EXPIRATION_DATE = ...;`.

## Signature de release

La clé vit hors du dépôt, dans `00-clés/GitHub-phonedetector/`, avec le
script qui régénère `android/keystore.properties`. Ce fichier n'est pas
versionné ; sans lui, la release n'est pas signée. La clé ne doit plus
changer une fois une version diffusée : une application signée autrement ne
peut pas se mettre à jour par-dessus celle déjà installée.

## Publication

Par l'outil `compilator` du dépôt MagicPages, qui inscrit la date dans
`js/licence.js`, compile la release, envoie l'APK, le `README.md` complété
et `media/icon.png`, retire la version précédente, puis restaure le dépôt :

```bash
bash compilator/publier.sh 0/0/0 phonedetector
```

`0/0/0` publie une version sans date limite.

## Pièges connus

- `npm run sync-www` copiait un dossier `assets/` absent du dépôt, ce qui
  faisait échouer toute compilation. Corrigé.
- `www/` est généré : éditer les fichiers de la racine, jamais leur copie.
  De même pour `android/app/src/main/assets/public`, produit par `cap sync`.
