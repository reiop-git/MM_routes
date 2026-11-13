# Project instructions

Work only from this project's code, docs, provided files and user instructions. Double-check ambiguity before changing operational facts. User approval is required for new work that has not been requested; carry authorized tasks through implementation and testing.

Keep this a simple route planner, not CRM/logistics software. No travel durations, lateness, breaks, contract management or unnecessary technical UI. UI language is Estonian.

Read README.md and docs/HANDOFF.md first. Preserve browser-saved routes and JSON backup compatibility. Never change object IDs casually or silently discard assignments. Data migrations must be idempotent and tested.

Hosting (decided 13.11.2026): GitHub Pages from reiop-git/MM_routes, no Cloudflare. A Pages site is public, so client data (objects, contacts, access notes, route backups, crew names) must never be in dist/ or in any committed file. It lives in private-data/ and private-backups/ (gitignored) and reaches users only as a file they load into their browser. Run npm run leak-check before every commit. Work on staging; main deploys and is promoted only with Reio's approval. Never commit secrets.

Do not use the old ChatGPT Git remote. docs/ORIGINAL-HOSTING.json is reference only.

Run npm test for meaningful code changes; verify UI in a browser when supported. State verification limits honestly. Do not claim hosted until deployment and anonymous-access checks pass. Do not keep retrying a failed network path without new evidence.
