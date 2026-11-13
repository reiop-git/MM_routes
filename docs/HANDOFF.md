# Technical handoff

## History
- Built in a ChatGPT session and hosted on a ChatGPT site. The last version published there still had six slots in both plans and no service filter.
- 13.11.2026: moved to this repository. The four-slot Libedaring and filter update is included. Client data was separated from the published site (see DEPLOYMENT.md).

## Architecture
Static HTML/CSS/JavaScript. No framework, build step, server API, database or application-level authentication. All libraries are self-hosted in `dist/vendor/` (Leaflet 1.9.4 from npm, jsPDF, AutoTable, JSZip, Noto Sans). Map tiles come from OpenStreetMap. Map lines show stop order, not road routing.

Script order: Leaflet, PDF libraries, `driver-export.js`, `loader.js`. The loader reads object data from localStorage. If present it sets `window.SOURCE_DATA` and loads `simple.js`; otherwise it shows the data file screen.

Serve `dist/` over HTTP (`npm run dev`). PDF generation fetches `vendor/NotoSans.ttf`.

## Storage (browser localStorage)
- `murumehed.objects.v1`: `{version:1, updated:'YYYY-MM-DD', sites:[...]}`. Validated on load and on import (safe IDs, HH:MM deadlines, durations 0 to 1440, map points on known addresses).
- `murumehed.simple.v3`: `{version:3, plans:{weekday:PLAN, weekend:PLAN}}`. The internal key `weekend` is the Libedaring / sissepääsud plan.
- `murumehed.simple.v3.failed`: copy of a saved plan that could not be read at start-up, so it is never lost.
- PLAN = `{version:2, objectRevision:1, crews:[{name, stops:[{id, minutes}], startTime?, startDay?}], notes:{objectId:string}, coords:{address:[lat,lng]}, archivedCrews?}`.
- weekday has 6 crews, weekend 4. `minutes` may be null. Old v1/v2 plans are migrated.
- The four-slot migration keeps slots 1 to 4 and saves former 5 and 6 in `archivedCrews` (Varasemad ringid / ZIP). Do not drop it.

## Files users handle
- Full backup from Salvesta plaan failina: `{version:3, plans, objects:{updated, sites}}`.
- Object data file: `{sites:[...]}`, optional `updated`. Source of truth kept in `private-data/data.json`.
- Old route backups without `objects` still import.

Importing new object data is refused, with the IDs listed, if any route (including archived ones) contains an object missing from the new file, or if a Tööpäev machine route contains an object that became hand-work only. Map points for addresses no longer in the data are pruned.

## Object rules
- Objects may appear on multiple routes, never twice on one route. Each assignment has its own duration.
- "Masinatöö / käsitöö täpsustada" means both work types. Only "Ainult masinatöö" is hidden by the Libedaring filter. This is not a detailed per-service classifier.
- Tööpäev allows hand-only objects only on its sixth crew. All four Libedaring slots accept hand-work objects.
- Built-in migrations in `simple.js`: T26-052 split (separate T26-052-K), retired T26-070 removed from routes, notes and points. Keep them idempotent.
- Some object notes contain open questions recorded from the source. Do not resolve them silently.

## Tests
`npm test` runs route logic, loader/data-file tests (including the real backups when present) and real jsPDF/JSZip generation with the embedded font. These do not replace browser checks or visual PDF inspection.
