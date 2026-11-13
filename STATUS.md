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
- `staging` pushed (fd55b83), CI green, deploy skipped by design.

## Next
- Reio approves: merge to `main`, enable Pages (source GitHub Actions). If the account is GitHub Free, the repo must be made public first.
- Verify the live site anonymously (data screen only, data files 404).
- Reio loads `private-backups/murumehed-masinaringid-2026-11-13.json` on each device.
- Decide on the old ChatGPT-hosted site (still online with client data, six-slot version).
