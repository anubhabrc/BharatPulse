# Bengaluru map overhaul — work ledger

Resumed 26 November 2026 after the previous run stopped at its usage limit. This ledger distinguishes saved research, local implementation and deployed behavior. **For the latest D04 counts and pending steps, see the final section and `docs/directory-status.md`; earlier sections are historical checkpoints.**

## Original resumption baseline (already deployed then)

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
- [x] Browser-check first load, sourced inspectors, the Helios shared-campus selector, keyboard zoom/help, neighbourhood navigation, appearance switching, camera preservation during sorting, and a 390px mobile layout. Fixed a premature loading dismissal and improved night-map contrast. Production recheck also confirmed direct scroll zoom, 3D tilt/reset and truthful handling of a city-only record.
- [x] Final TypeScript, all 47 tests and production build passed against the merged data.
- [x] Update source notes and roadmap, commit, push and verify Vercel deployment. Implementation `8b44eba` deployed successfully; automated news update `dbe7eac` was retained.

Research intermediates are in the chat working directory's `work/map-overhaul/`. The accepted dataset remains `data/bengaluru-offices.json`. No unreviewed directory point should be silently promoted to an exact office.

Recovery audit: 15 additional partially researched business-address leads were recovered from the interrupted research files and added to the pending queue. The dated inventory now records 54 accepted, 37 needing further resolution and 541 awaiting research. These statuses are intentionally distinct; unfinished company research has not been marked complete.

## Still unfinished

- [ ] Resolve the 37 remaining flagged address/coordinate cases (after D02 below), starting with cached primary sources.
- [ ] Research the remaining 544 company office records; a directory lead is not an accepted office.
- [ ] Complete the broader R19 correction/review workflow and R20 company/founder enrichment.

The completed UI release does not mark these data tasks complete. All intermediate source caches, proposed records, the original recording and extracted frames remain in the chat working directory.

## Batch B01 — three pending cases, 26 November 2026

- [x] Stellapps: official contact page confirms Stellapps Technologies Private Limited registered office at Ozone Manay Technology Park, A-Block. Accept the independently mapped OSM commercial-campus centre, retaining campus precision. Do not use the previously proposed filing coordinate. The point intentionally shares Porter’s campus.
- [x] HomeLane: recheck [official terms](https://www.homelane.com/homelane-terms-conditions) for the same registered-office building; named-place Photon query returns no features. Keep pending, with updated reason/date; do not substitute a retail showroom.
- [x] Zolve: recheck official policy and business correspondence address; named-place Photon query returns no features. Keep pending, with updated reason/date; do not substitute the wider Ecoworld area.
- [x] Validate locally: all 47 tests, TypeScript and production build passed. Browser check confirmed Stellapps selection, address/location sources, campus accuracy and the 55-office coverage count.
- [x] Commit, push and confirm deployment: implementation `51e500f` pushed to main; Vercel reported success ([deployment](https://vercel.com/anubhabs-projects-acfa2d88/bharatpulse/73y7qbC8rgpZC9GdUoD7tGWW8zNc)).

Current inventory: **55 accepted / 36 need review / 541 not yet researched = 632**. Existing historical entries above describe earlier releases, not current counts. B01 examined only three pending cases. Next bounded office batch: Rupeek, GPS Renewables and CoreEL; use cached sources first, retain unresolved outcomes explicitly, and stop after those three. Directory work resumes from `docs/directory-status.md` rather than repeating source discovery.

B01 evidence recovery: the earlier [Stellapps filing candidate](https://www.stellapps.com/wp-content/uploads/2026/01/Form-MGT-7_of-Stellapps_FY-2024-25.pdf) and its rejected coordinate remain in Git history; acceptance now uses the readable official contact-page address and independent OSM campus. Known separate UI follow-up: some RSS headlines still display double-escaped punctuation (for example `&#8217;`); this was not changed in the office/source-policy batch.

## D02 office checkpoint before deployment

Five local additions bring accepted points to 60: Razorpay SJR Cyber campus, PhonePe Salarpuria Softzone campus, Zerodha numbered office building, Swiggy current Sumadhura Capitol campus and Unacademy Maruti Info-Tech campus. Whatfix is pending because 1090E is not mapped 1090/F. Inventory now 641 records after adding nine reviewed directory companies with Bengaluru footprints (60 accepted,37 need review,544 await research). Existing GPS/CoreEL/Rupeek batch produced no accepted locations; its improved reasons still need merging. All 51 tests and TypeScript passed; build/browser/deployment remain unchecked for this release. See directory ledger for exact remaining steps.

Final local D02/D03 check: all55 tests, TypeScript and build passed after merging25 sourced company profiles. Production-mode browser verified new overview/jobs/no-funding cases and390px layout. Unresolved companies remain discoverable without fabricated pins. Duplicate office evidence is omitted from hub/featured samples and resolved through the accepted office index on selection. Current runtime map payload is107,261 bytes for Bengaluru and151,012 bytes nationally (uncompressed). Publication/cloud verification remains pending at this checkpoint.

## D02/D03 release verified

Implementation `a3f1c0a` deployed successfully. Jobs-only [cloud run](https://github.com/anubhabrc/BharatPulse/actions/runs/45788622377) passed both employer refreshes, all55 tests and the build; its snapshot `aac0713` also deployed successfully. The current directory has641 Bengaluru-footprint records and60 accepted office points, with25 sourced company profiles nationally. Remaining location work:37 unresolved and544 not yet researched. B05 targets Capillary Technologies, MoveInSync and Ultrahuman, at most three cases before saving another handoff. The broader directory ledger is authoritative for the next catalog/filter work.

## D04 — resumed UI/data batch, current checkpoint

87 accepted Bengaluru offices (27 additions), 43 needing review and 511 not yet researched across the 641-company cohort. National sourced profiles: 70; 66 mapped companies have a reviewed profile. The screenshot's blank map was an actual Chrome DNS failure for the external provider TileJSON. A same-origin allowlisted resource gateway now loads styles, TileJSON, tiles, glyphs and sprites through BharatPulse with caching and original attribution. Wider directory and inline carousel replace the oversized Wire popup. Full review notes stay on company profiles/API; compact map cards reconstruct shared identity fields without duplicating them. All 58 tests, TypeScript, production build and desktop/390px browser checks passed. Deployment remains pending; `docs/directory-status.md` lists all completed/unfinished research, including the seven unstarted extension targets and 21 missing mapped-company profiles.
