# Emoji Challenge

A webcam game built for the **University of Arizona Computer Science Ambassadors**. Players see an emoji and have five seconds to make that face. An AI face-tracking model scores how well they match.

Everything runs in the browser. Camera frames are analyzed on the device and are never recorded or uploaded.

## How to play

1. Click **Start Challenge** and allow camera access.
2. Each game picks 3 random emojis from a pool of 7.
3. After a 3-2-1 countdown, hold the expression for 5 seconds. Your best *sustained* match counts, so a one-frame twitch won't win the round.
4. Each round is worth up to 100 points, for a maximum of 300.

### Game modes

| Mode | Players | How it works |
| --- | --- | --- |
| **Classic** | 1 | The original: 3 rounds, 5 seconds each, up to 300 points. |
| **Speed Run** | 1 | The emoji is hidden until GO. Hit a 75 match to stop the clock. Each round caps at 12 seconds, and the fastest total time wins. |
| **Mystery Face** | 1 | The target emoji is secret. A hot/cold meter says WARMER or COLDER as you try faces. A clue appears after 8 seconds and the emoji's name after 16. Hit a 70 match to solve it (25 second cap per round). |
| **Face-Off** | 2 | Two players share one camera, side by side. Both make the same face at once, and the higher match wins each round. Player 1 is on the left of the screen. |
| **Team Relay** | 2 teams | Red vs Blue, 2 players each. Players take turns at the camera (Red, Blue, Red, Blue), and each team pair gets the same emoji so it's fair. Highest team total wins. |

### Leaderboards

Classic (highest score), Speed Run, and Mystery Face (fastest time) each keep a top 10. A score that makes the board asks for 3-letter initials, so no real names are needed. Boards are stored only in this browser's `localStorage`. To reset them between events, open **Leaderboards** on the start screen and hold **Hold 3s to clear all scores**.

### Controls

| Control | What it does |
| --- | --- |
| **Pause** button, or `P` / `Esc` | Pauses the game. The game also pauses automatically if the tab is hidden. |
| **Resume** | Continues the game. A round that was in progress restarts with a fresh countdown, and finished rounds are kept. |
| **End Game** | Returns to the start screen without saving the score and turns off the camera. |
| **X-Ray** button, or `X` | Shows the live face measurements the AI uses for the current emoji (one-player modes, not Mystery Face). |
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

1. Add an entry to `EXPRESSIONS` in `src/lib/expressions.ts` with an `id`, `emoji`, `name`, `hint`, `mysteryHint`, `signals` (for the X-Ray panel), and `score` function.
2. Add its `id` to `EXPRESSION_POOL`.

To tune thresholds, open the game with `?debug` in the URL (for example `http://localhost:5173/?debug`). This shows live blendshape values over the camera preview.

## Project structure

```
src/
  App.tsx                 Screen flow, camera and model startup, sound
  components/
    WelcomeScreen.tsx     Start screen and mode picker
    GameScreen.tsx        Round state machine (countdown, playing, reveal, transition) and pause logic for every mode
    PauseOverlay.tsx      Pause menu
    ResultsScreen.tsx     Final score, per-round breakdown, and leaderboard entry
    LeaderboardModal.tsx  All leaderboards, with hold-to-clear
    MysteryPanel.tsx      Hidden target and timed clues for Mystery Face
    HotColdMeter.tsx      Warmer/colder hints
    XRayPanel.tsx         Live view of the face measurements being scored
    ...                   Timers, score meters, camera preview, overlays
  hooks/
    useExpressionTracker.ts   Runs face detection on every video frame (1 or 2 faces)
  lib/
    modes.ts              Game mode rules (players, round end, hidden target, leaderboard)
    leaderboard.ts        Local top 10 storage
    expressions.ts        Emoji definitions and scoring functions
    scoring.ts            Sustained-score tracking and result messages
    faceModel.ts          Loads the MediaPipe model
    camera.ts             Camera start/stop with friendly error messages
    sound.ts              Web Audio sound effects
public/mediapipe/         Bundled face model and WebAssembly runtime
```

## Tech stack

React 19, TypeScript, Vite, Tailwind CSS 4, Motion for animation, and MediaPipe Tasks Vision for face tracking.
