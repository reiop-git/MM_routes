# Deployment: GitHub Pages without client data

Decision 13.11.2026 (Reio): host on GitHub Pages. GitHub Pages sites are public on the internet even when the repository is private, and access control needs GitHub Enterprise Cloud on an organisation. Therefore the published site carries no client data; users load a private data file into their own browser.

## How it deploys
- `.github/workflows/pages.yml` runs on pushes to `staging` and `main`.
- Every run: `npm run leak-check` (generic: no data files in `dist/`, no e-mail addresses or phone numbers in published or committed text).
- Only `main` deploys `dist/` to Pages. `staging` is checked but never published.
- Pages source must be set to **GitHub Actions** (Settings, Pages).

## Rules
- `private-data/` and `private-backups/` are gitignored and must never be committed.
- Run `npm test` and `npm run leak-check` locally before pushing. Locally the leak check also compares all files with the private data and route backups.
- Promote `staging` to `main` only with Reio's approval.

## After each deploy
- Open the site in a private window: it must show the data file screen and no client data.
- `<site>/data.json` and `<site>/data.js` must return 404.
