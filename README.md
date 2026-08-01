# Workout MVP

**UI work?** Read [DESIGN.md](DESIGN.md) first; it records the shipped interaction and visual rules.

A local-first workout PWA focused on one question for this iteration:

> What did I train, what should I train next, and which movements support that workout?

## Run locally

```bash
cd /Users/jackmichaels/workout_app
python3 -m http.server 4174
```

Open:

```text
http://127.0.0.1:4174/
```

## Deploy to phone

Use GitHub Pages for the current phone test. See [DEPLOY.md](DEPLOY.md).

The hosted app code loads from GitHub Pages, while workout logs remain local to Safari/PWA storage on the phone for that exact URL.

## Current MVP scope

- Calendar-first home page with local workout drafts
- Repository-backed movement source files in `data/movements/`
- Standardized movement entries with tags, ratings, muscle roles, evidence statements, and study citations
- Local BodyParts3D mesh viewer for movement muscle maps
- Installable PWA metadata and service worker

## Data model

No backend, no accounts, and no cloud sync. Movement definitions live in the repository so research decisions can be reviewed, backed up, and extended without editing app logic.

Movement source files live here:

```text
data/movements/<movement_id>.json
data/research/<movement_id>.json
```

The app reads the generated bundle:

```text
data/movements.json
```

After changing movement data, run:

```bash
node scripts/validate-movements.js
node scripts/build-movements.js
node scripts/build-movements.js --check
```

See [docs/movement-data-workflow.md](docs/movement-data-workflow.md) for the agent workflow.

## App structure

```text
index.html              Static application shell
styles.css              Visual system and responsive layout
js/app.js               Application state, rendering, and workflow coordinator
js/config.js            Shared product constants
js/events.js            Delegated DOM action routing
js/storage.js           Local-storage persistence boundary
js/anatomy-viewer.js    Three.js anatomy rendering and lifecycle
```

## Do not add yet

- User accounts
- Social features
- Payments
- Apple Health integration
- AI coach calls
- Cloud sync
