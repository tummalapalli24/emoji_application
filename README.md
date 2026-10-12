# Emoji Challenge

A webcam game built for the **University of Arizona Computer Science Ambassadors**. Players see an emoji and have five seconds to make that face. An AI face-tracking model scores how well they match.

Everything runs in the browser. Camera frames are analyzed on the device and are never recorded or uploaded.

## How to play

1. Click **Start Challenge** and allow camera access.
2. Each game picks 3 random emojis from a pool of 7.
3. After a 3-2-1 countdown, hold the expression for 5 seconds. Your best *sustained* match counts, so a one-frame twitch won't win the round.
4. Each round is worth up to 100 points, for a maximum of 300.

### Controls

| Control | What it does |
| --- | --- |
| **Pause** button, or `P` / `Esc` | Pauses the game. The game also pauses automatically if the tab is hidden. |
| **Resume** | Continues the game. A round that was in progress restarts with a fresh countdown, and finished rounds are kept. |
| **End Game** | Returns to the start screen without saving the score and turns off the camera. |
| Speaker icon | Toggles sound effects (muted by default). |
| Expand icon | Toggles fullscreen, which works well on a projector or event display. |

## Running locally

Requires [Node.js](https://nodejs.org/) 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in Chrome, Edge, or Safari.

Browsers only allow camera access on `localhost` or over `https://`, so opening the game from a plain `http://` network address won't work.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Type-check and build a production bundle into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint with Oxlint |

## Deploying

`npm run build` produces a fully static site in `dist/`. The MediaPipe model and WebAssembly files are bundled from `public/mediapipe/`, so the game needs no backend and no external CDN. The build uses relative paths (`base: './'`), so it can be hosted from any folder on any static host, such as GitHub Pages, Netlify, or a university web server, as long as it is served over HTTPS.

## How it works

- **Face tracking:** [MediaPipe Face Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker) tracks 478 points on the face and outputs "blendshapes", which are 0 to 1 values for movements like `mouthSmileLeft`, `jawOpen`, and `eyeBlinkRight`. It uses the GPU when available and falls back to the CPU.
- **Expression scoring:** each emoji has a small scoring function in `src/lib/expressions.ts` that combines blendshapes into a 0 to 100 match score. For example, Wink requires one eye closed *and* the other open.
- **Round scoring:** `src/lib/scoring.ts` averages the last 8 face-detected frames, and only that sustained average can set the round's best score.

These scores are a game approximation of facial movement, not a scientific measure of emotion.

### Adding a new emoji

1. Add an entry to `EXPRESSIONS` in `src/lib/expressions.ts` with an `id`, `emoji`, `name`, `hint`, and `score` function.
2. Add its `id` to `EXPRESSION_POOL`.

To tune thresholds, open the game with `?debug` in the URL (for example `http://localhost:5173/?debug`). This shows live blendshape values over the camera preview.

## Project structure

```
src/
  App.tsx                 Screen flow, camera and model startup, sound
  components/
    WelcomeScreen.tsx     Start screen
    GameScreen.tsx        Round state machine (countdown, playing, reveal, transition) and pause logic
    PauseOverlay.tsx      Pause menu
    ResultsScreen.tsx     Final score and per-round breakdown
    ...                   Timer, score meter, camera preview, overlays
  hooks/
    useExpressionTracker.ts   Runs face detection on every video frame
  lib/
    expressions.ts        Emoji definitions and scoring functions
    scoring.ts            Sustained-score tracking and result messages
    faceModel.ts          Loads the MediaPipe model
    camera.ts             Camera start/stop with friendly error messages
    sound.ts              Web Audio sound effects
public/mediapipe/         Bundled face model and WebAssembly runtime
```

## Tech stack

React 19, TypeScript, Vite, Tailwind CSS 4, Motion for animation, and MediaPipe Tasks Vision for face tracking.
