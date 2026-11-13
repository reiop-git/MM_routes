# Masinaringid (Murumehed)

Simple winter route planner: machine and crew routes, map overview, driver PDFs and a ZIP of all PDFs for a plan. UI in Estonian.

The published site contains **no client data**. Client objects (addresses, contacts, access notes) live in a private JSON file that each user loads once into their own browser.

## Use
1. Open the site. On a new device it asks for **Vali andmefail**.
2. Choose your latest full backup (`murumehed-masinaringid-YYYY-MM-DD.json`). Routes and objects appear.
3. Work as usual. Changes save automatically in this browser.
4. After bigger changes press **Salvesta plaan failina**. That one file holds routes and objects. Keep it private (own computer or OneDrive), never in this repository.

**Ava plaan** accepts three kinds of file:
- full backup (routes + objects): replaces both, downloads the previous state first;
- object data file (`{"sites": [...]}`): updates objects, keeps routes;
- old route backup without objects: replaces routes, as before.

An object data update is refused if a route still contains an object the new file lacks. Nothing is removed silently.

## Develop
Requires Node.js 22+. No dependencies.

- `npm run dev` serves `dist/` at http://127.0.0.1:4173
- `npm test` runs logic, data-loader and PDF/ZIP tests. Needs the private `private-data/data.json`.
- `npm run leak-check` fails if client data could be committed or published.

Private, gitignored folders: `private-data/` (object data), `private-backups/` (route backups).

## Files
- `dist/` is the published site: `index.html`, `loader.js` (private data loading and validation), `simple.js` (planner), `simple.css`, `driver-export.js` (PDF/ZIP), `vendor/` (Leaflet, jsPDF, AutoTable, JSZip, Noto Sans).
- `docs/HANDOFF.md`: data model, rules and history. `docs/DEPLOYMENT.md`: hosting.
- `STATUS.md`: current state and decisions.
