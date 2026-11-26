# Directory expansion — work ledger

Updated 26 November 2026. **Current D04 work is recorded below; earlier release details are historical.** Released: implementation `a3f1c0a` and cloud-refreshed jobs snapshot `aac0713` both received successful Vercel deployments. Earlier baseline `530d7ca` remains in Git history. Automated source updates `c7bc7f9` and `cd465c8` were preserved during rebase.

## Current state

- [x] D01: scope and source/admission policy agreed; startups, scale-ups and established product companies with verified Indian operations.
- [x] D02: ten reviewed additions saved with evidence: Razorpay, PhonePe, Zerodha, Zoho, Freshworks, Postman, BrowserStack, Swiggy, Unacademy and Whatfix. Preserve all 1,905 historical BWM companies and 2,337 funding events. Read model now 1,915 companies, with 641 Bengaluru-footprint records.
- [x] D02: catalog identity independent of funding; source archive and its refresh ownership preserved. Ordinary list/map queries include zero-tracked-event companies. Funding filters deliberately require matching observations; missing amounts remain null.
- [x] D02: profiles and company API expose inclusion/India-footprint evidence, global HQ when reviewed, optional careers and funding layers. List/map use one cohort and keep office precision.
- [x] D03: descriptions/founder sources now 25 profiles: original 6, ten new admissions and nine additional existing-company profiles. These are sourced reviewed names, not a guarantee of complete founding teams. Existing cohort admission is not implied by profile enrichment.
- [x] D03: cards and inspectors expose available descriptions, founders, sourced chips, latest linked news and fresh job counts; profile pages show India job lists. A–Z is the directory default; sourced bootstrapped, careers-link and reviewed-addition filters are implemented.
- [x] D03: fix double-escaped headline punctuation and include catalog identities in RSS matching, without promoting headlines into funding events.
- [x] Jobs pilot: employer-linked Razorpay Greenhouse and PhonePe SmartRecruiters public APIs fetched 187 published postings locally (183 India,138 include Bengaluru). No descriptions, candidate information or precise job-site coordinates persisted. Last-good preservation and 72-hour count hiding implemented.
- [x] Provider corrections saved: Postman’s current Workday cache has an old upstream date, so it remains Careers only; old Postman/PhonePe Greenhouse boards are not used. PhonePe first-party cache is not ingested because it includes nonpublic visibility states. Public SmartRecruiters endpoint is used instead, with mandatory PUBLIC filtering and no authentication.
- [x] Daily jobs refresh added to existing workflow configuration, with an isolated jobs manual-run option. Cloud-verified by the completed jobs-only run linked below.
- [x] Final local checks: all 55 tests, TypeScript and production build passed. Rich map payload checked via API:107,261 bytes for Bengaluru and151,012 bytes nationally (uncompressed). Discovery summaries omit duplicate office evidence.
- [x] Browser QA: Razorpay sourced campus/overview/founders/jobs, no-funding history, Postman city-only discovery with separate San Francisco HQ and no stale jobs count, Zerodha/Zoho bootstrapped filter, proper headline punctuation, camera preserved at zoom14.0 during sorting, and390px first-load map/directory layout. Inspector summary now precedes expandable office evidence. Searches show company records even without an accepted pin.
- [x] Commit/push and successful Vercel deployment. [Jobs-only cloud run](https://github.com/anubhabrc/BharatPulse/actions/runs/45788622377) succeeded: both sources refreshed, all55 tests passed and production build passed; the automated snapshot `aac0713` was deployed successfully. Workflow state is active. Daily refresh is06:11 IST, best-effort; stale counts hide after72 hours without a successful check.

## Location batches

- B01 previously deployed: Stellapps accepted; HomeLane and Zolve unresolved.
- B02 reviewed exactly GPS Renewables, CoreEL and Rupeek: zero accepted, three improved dated reasons merged. GPS has conflicting current contact text and stale widget; CoreEL exact corporate building unresolved; Rupeek map redirects timed out. No guessed points used.
- B03 reviewed Razorpay/PhonePe/Zerodha: three accepted points (campus/campus/building).
- B04 reviewed Swiggy/Unacademy/Whatfix: two accepted campus points; Whatfix 1090E must not be placed in numbered 1090/F.

Current location inventory: **60 accepted /37 need review /544 awaiting research =641**. Nine new directory companies have a documented Bengaluru footprint; BrowserStack’s reviewed footprint is Mumbai. National additions and India-office filters do not manufacture Bengaluru street coordinates.

## Recovery and next handoff

Research proposals and unresolved cases: parent chat `work/map-overhaul/d02-new-company-offices.json`, `d02-existing-offices.json`, `d02-jobs-research.json` and `jobs-research/`. The parent repository's ignored `work/research-d02/` caches source pages, bounded geocoder results and public API checks. Do not upload raw caches. Original reference video/frames and prior research remain in parent chat `work/map-overhaul/`.

## D04 — UI repairs and larger Bengaluru batch

User priority: widen the left directory, remove the Wire popup, show news as a carousel, repair the screenshot's blank basemap, and accelerate office/profile enrichment. This explicitly supersedes the earlier three-case cap. Use checkpoints around ten researched companies; batch size does not reduce source or location requirements.

- [x] Directory widened to roughly one-third of desktop width; smaller screens retain a stacked map/directory.
- [x] Remove Wire dropdown/popover. Inline 12-headline carousel has previous/next, pause/play, hover/focus pause, reduced-motion handling, touch swipes and keyboard navigation.
- [x] Diagnose actual Chrome console: `ERR_NAME_NOT_RESOLVED` for OpenFreeMap `backup_planet`. Same-origin gateway now fetches only allowed provider styles/manifests/sprites/fonts/bounded tiles with time/size limits and caching; original attribution is preserved. Provider outages and hosting bandwidth still apply.
- [x] Merge 27 additional accepted offices: 87 total, 85 OSM features and two explicit company-published destinations. Original 20 pending cases yielded eight accepted; 33 additional company cases yielded 19 accepted. Conflicts/unmatched buildings remain held.
- [x] Merge 45 additional sourced company profiles: 70 total (60 `company-info` + ten reviewed admissions); 66 mapped companies have profiles. Founders and years remain empty/null where unsupported. Partial sourced founder lists do not claim complete teams.
- [x] Review all eight saved extension-address candidates after research interruption: Postman, Niqo Robotics and VerSe accepted; GalaxEye, Testsigma, Varthana, StockGro and Portea remain unresolved with explicit reasons. GalaxEye's old HSR POI is not its current KIADB plot. Arzooo operator identity also remains unresolved.
- [x] Reduce duplicate map/card fields and omit full review prose from map responses. Full notes remain on company profiles/API; coordinate/address evidence remains in map details.
- [x] Final merged validation: all 58 tests, TypeScript and production build passed. Production-mode browser checked the wider directory, carousel next/keyboard/pause, Streets/Night basemaps, enriched 4baseCare inspector, newly pinned Postman branch with separate San Francisco HQ, and 390px first-load layout. Unknown map-resource route returns404; manifest route returns200. Final map API payload:108,113 bytes Bengaluru /151,866 nationally (uncompressed), versus107,261 /151,012 before adding27 pins and45 profiles. Screenshots saved in parent outputs.
- [ ] Commit/push and confirm the Vercel deployment for the final implementation commit.

Current inventory: **87 accepted / 43 need review / 511 awaiting research = 641**. Historical funding archive remains 1,905 companies / 2,337 events; composed catalog remains 1,915. Jobs/news schedules are unchanged from the checked D03 release.

## Exact next work and preserved research

D04 saved checkpoints are in parent chat `work/map-overhaul/d04-pending-offices.json` (27 reviewed pin proposals), `d04-new-addresses.json` (31 primary-address leads + two unresolved source cases), `d04-company-profiles.json` (45 profiles), and `d04-geocodes/` (serial cached geocoder results). Repository `data/office-review.json` and `data/office-review-inventory.json` preserve publication-safe leads and rejected-match reasons. Do not publish raw HTML/PDF caches or personal contact/meeting information.

The extended new-address target was 40; **seven selected cases have not been researched**: Freshworks, River, SigTuple, Bounce, GnaniAI, WeRize and Propelld. Research agents stopped at their usage limit; the parent finished the saved eight-case extension without restarting or discarding completed work. No remaining case is silently marked complete.

Next profile batch: DaMENSCH, FluxGen, Immuneel, Myelin Foundry, Eyestem, Awign, Capillary, Codeyoung, Astrome, QpiAI, Stable Money, VuNet, Shadowfax, CoRover, Curefoods, Kiwi, NEWME, Deconstruct, WorkIndia, Niqo and VerSe. These 21 accepted-office companies still lack reviewed purposes/founder profiles.

R06 broad sector baskets, R14 alias review (including separate archive records `ultraviolette` / `ultraviolette-automotive`), broader R19/R20 coverage, correction/review UI, more admitted companies and more employer integrations remain unfinished. Do not repeat completed source discovery or merge identities/funding histories without evidence.
