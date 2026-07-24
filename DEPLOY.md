# Deploy To iPhone

This app is static. GitHub Pages hosts the app files; workout data stays in the browser storage on the phone for the exact Pages URL.

## One-Time GitHub Setup

1. Log in to GitHub CLI:

```bash
gh auth login
```

2. Create and push the repo:

```bash
cd /Users/jackmichaels/workout_app
git init
git add .
git commit -m "Initial workout PWA"
gh repo create workout_app --public --source=. --remote=origin --push
```

3. In GitHub, open the repo settings:

```text
https://github.com/<your-github-username>/workout_app/settings/pages
```

Set:

```text
Source: Deploy from a branch
Branch: main
Folder: / (root)
```

The site will be available at:

```text
https://<your-github-username>.github.io/workout_app/
```

## Install On iPhone

1. Open the Pages URL in Safari.
2. Tap Share.
3. Tap Add to Home Screen.
4. Open it from the new home-screen icon.

## Data Backup

GitHub Pages does not store workout logs. Logs are saved locally on the phone for that URL. Before serious use, add or use JSON export/import so local data can be backed up.

## Updating The App

After changes:

```bash
node scripts/validate-movements.js
git add .
git commit -m "Update workout app"
git push
```

If the phone keeps showing an old version, hard refresh Safari or remove and re-add the home-screen app. The service worker cache version in `sw.js` should be bumped for app changes.

