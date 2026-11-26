# Directory expansion — work ledger

Updated 26 November 2026. Released: implementation `a3f1c0a` and cloud-refreshed jobs snapshot `aac0713` both received successful Vercel deployments. Earlier baseline `530d7ca` remains in Git history. Automated source updates `c7bc7f9` and `cd465c8` were preserved during rebase.

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

This release is complete. Next bounded work is R06 broad sector baskets, R14 alias review (including archive records `ultraviolette` versus `ultraviolette-automotive`), more admitted companies and three-location research batches. No silent alias merge or funding-total restatement. Larger source adapters, candidate/correction UI and further employer integrations remain pending. Do not repeat completed source discovery or describe the whole strategy as finished.

Next office batch B05: Capillary Technologies, MoveInSync and Ultrahuman only. Start from their saved primary leads, check current company addresses and resolve independent commercial features; hold any unmatched/conflicting point. R06 broad sector baskets and R14 alias review remain separate unfinished tasks. The present map does not claim complete Bengaluru office coverage.
