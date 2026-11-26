# Bengaluru map overhaul — work ledger

Resumed 26 November 2026 after the previous run stopped at its usage limit. This ledger distinguishes saved research, local implementation and deployed behavior.

## Already deployed

- [x] Original directory/map neo-brutalist workspace.
- [x] Eight source-checked Bengaluru office records, source links and accuracy labels. Last deployed implementation: `6e74e89`.

## Saved research and local work

- [x] Inspect the user's 23-second recording, extracted to 11 frames under the working directory.
- [x] Inspect Bangalore Startup Map's clusters, neighbourhood filter, toolbar and map framing.
- [x] Inspect Bengaluru Rent's map, layer control and keyboard shortcuts after the user's explicit approval to enter its terms-gated map.
- [x] Inventory all 631 source-reported Bengaluru companies; identify directory leads for 240 without copying their coordinates into accepted data.
- [x] Save independent official-address/coordinate proposals in five research files; deduplicate and review before publication.
- [x] Implement locally: detailed street map, Bengaluru starting camera, direct wheel/trackpad zoom, keyboard help, neighbourhood navigation, map appearance choices, 3D tilt, co-located company selection, and separate office/all-company directory views.
- [x] Initial TypeScript check of the local UI changes passed. This does not establish that browser behavior or the final merged data passes.

## Remaining at resumption

- [x] Review and merge 46 new locations: 54 total. Duplicate independent checks agree; conflicting points remain pending.
- [x] Support and attribute the company-published UV destination point. Uncorroborated filing-based candidates remain pending; GenWorks uses an independently matched campus point instead.
- [x] Preserve source-reported HQ cities separately from sourced office locations; Zepto demonstrates the different-HQ case.
- [x] Persist the full 632-record inventory: 54 accepted, 37 needing resolution, 541 awaiting research. Original video is preserved locally outside the public repository.
- [x] Update regression checks for expanded coverage, co-location, provider evidence and office-aware filtering; 47 tests passed.
- [x] Browser-check first load, sourced inspectors, the Helios shared-campus selector, keyboard zoom/help, neighbourhood navigation, appearance switching, camera preservation during sorting, and a 390px mobile layout. Fixed a premature loading dismissal and improved night-map contrast. Final production recheck remains part of release validation.
- [x] Final TypeScript, all 47 tests and production build passed against the merged data.
- [ ] Update source notes and roadmap, commit, push and verify Vercel deployment.

Research intermediates are in the chat working directory's `work/map-overhaul/`. The accepted dataset remains `data/bengaluru-offices.json`. No unreviewed directory point should be silently promoted to an exact office.

Recovery audit: 15 additional partially researched business-address leads were recovered from the interrupted research files and added to the pending queue. The dated inventory now records 54 accepted, 37 needing further resolution and 541 awaiting research. These statuses are intentionally distinct; unfinished company research has not been marked complete.
