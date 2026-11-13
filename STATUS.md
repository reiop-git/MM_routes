# Status

Updated 13.11.2026.

## Decisions
- 13.11.2026: GitHub Pages instead of Cloudflare (Reio). Pages is public, so the site ships without client data; users load a private data file once per device.
- 13.11.2026: Leaflet self-hosted, Google My Maps link removed, noindex added, CSP via meta tag.
- 13.11.2026: object data updates that would orphan route stops are refused, not auto-cleaned.

## Done
- Source moved into this repo on `staging`; data moved to `private-data/` (gitignored).
- Data loader with validation, one-file full backup, tests (`npm test`), leak check (`npm run leak-check`).
- Old ChatGPT handoff files moved to `private-backups/chatgpt-handoff/` (gitignored, kept for reference).

- Local browser check (Edge, headless) passed: data screen on fresh browser, data.json/data.js 404, backup loads 6 + 4 routes (21/23/20/0), map, ZIP with 4 PDFs, backup export, reload persistence, refused bad update, mobile width, no console errors.
- Addresses removed from code and tests; git history squashed so no address is in it.

## Live
- https://reiop-git.github.io/MM_routes/ (repo public, app only). Deployed 13.11.2026 from main 53caca4.
- Live checks passed: data screen only for new visitors, data.json/data.js 404, no addresses or contacts in published files, full backup loads, export identical to source backup, map, ZIP, persistence, mobile.
- Old ChatGPT site taken down (Reio).

## Backups (private-backups/, never in git)
- murumehed-masinaringid-2026-11-13.json: the file to load. Routes from the Libedaring backup + all 73 objects.
- murumehed-masinaringid_libedaring.json: source. Tööpäev identical to the mehhaniseeritud file; Libedaring complete.
- murumehed-masinaringid_mehhaniseeritud.json: older; only difference is a 3-stop Libedaring draft. Superseded, kept.

## Next
- Reio loads the 2026-11-13 file on each device.
