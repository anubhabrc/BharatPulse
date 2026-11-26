# Company directory — scope, sources and delivery plan

Decision recorded 26 November 2026. The user selected **notable startups, scale-ups and established product companies across sectors**. Traditional conglomerates and an indiscriminate register of legal entities are outside the initial scope. Funding is an optional part of a company profile, not a condition of membership.

## Admission policy

The directory is an editorial selection, not a ranking of company quality. Admit a company only after checking its official identity/site, a real India headquarters or operating footprint, and the reason it belongs. Indian founder nationality alone does not establish an Indian operation. Global headquarters and Indian offices must be separate fields.

Use either of these paths, recording the evidence and a short decision reason:

1. A curated investor/accelerator entry **plus** a separately sourced sign of an established business: meaningful product adoption, commercial deployment, a documented growth award, a public listing, or sustained independent coverage. Seed funding or an accelerator badge alone is insufficient for the user's requested scope.
2. An established bootstrapped/product company supported by its official operating information and either an independently documented adoption/growth signal or at least two substantive independent company reports. Record dated evidence; do not invent a single cross-sector revenue or employee threshold.

Manual exceptions need an explicit reason. New entries start as candidates; merge only after checking domain, aliases, brand/legal-entity relationships, India footprint and duplication. Acquired and listed companies can remain if useful, with sourced dated status. Do not infer operational status from an investor's “active investment” or “exited” labels. Rejection means outside this directory's scope or insufficient evidence, not a claim about business quality.

The existing BWM cohort is a historical funding archive, **not 1,905 newly reviewed directory admissions**. Preserve those records while building the separate catalog; do not silently delete historical companies or invent admission evidence for them. Provide a clear legacy coverage label during migration.

## Primary sources checked

These are discovery and fact-checking sources, not grants of bulk redistribution permission. `data/directory-sources.json` records access and integration status. All checked 26 November 2026.

| Source | Useful evidence | Boundaries |
| --- | --- | --- |
| [Blume portfolio](https://blume.vc/startups) | Broad company list, sectors, locations and company links | Includes overseas firms and early entries; “partnered in” is not founding year; investment status is not operating status. |
| [Elevation portfolio](https://www.elevationcapital.com/portfolio) | Company/founder identity, themes and portfolio membership | “Investing Stage” is the stage at investment, not necessarily today's stage. |
| [Peak XV portfolio](https://www.peakxv.com/our-companies) | Company discovery and linked profiles across sectors | Global portfolio; inspect each India connection and directory eligibility. Includes firms outside our scope. |
| [Nexus portfolio](https://www.nexusvp.com/companies) | India/US filters, company identity, sector and membership | “Stage Invested” and portfolio status must retain their original meaning. |
| [YC directory](https://www.ycombinator.com/companies), e.g. [Razorpay](https://www.ycombinator.com/companies/razorpay) | Accelerator cohort, founders, official domain, published jobs and profile links | General index is dynamic and not readable in our text check; individual profile was readable. Not all Indian-founded firms have verified Indian operations. YC job count is only its own board's coverage. |
| [Accel portfolio](https://www.accel.com/companies) | Global company/profile discovery | Dynamic index; full India subset not extracted. No supported bulk API established. |
| [Stellaris portfolio](https://www.stellarisvp.com/portfolio) | Additional curated early-stage/company leads | Idea/seed entries require further establishment evidence; “Entry Stage” is historical. |
| [National Startup Awards official winners](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2215334&lang=1&reg=3) | Named, category-specific recognition beyond venture funding; fifth-edition results published 16 January 2026 | Match legal names to brands carefully. Awards are historical selection, not current operating status. Startup India's results endpoint returned 403 in this check; use the accessible PIB annexure. |
| [Deloitte Technology Fast 50 India 2024](https://www.deloitte.com/in/en/Industries/tmt/about/techfast-50-india-2024-winners-report.html) | Dated growth-selected company discovery, including companies absent from recent funding feeds | The verified cohort is 2024, not a claimed latest 2026 list; inspect the report's period/methodology. |
| Official company sites, investor relations and careers pages | Canonical identity, product, public founders, legal entity, offices, careers destination and official announcements | Company claims need attribution and dates; do not treat self-reported revenue or customers as audited. |

MCA/DPIIT remain identity/recognition enrichment, not our admission list. Commercial databases, search snippets, LinkedIn, copied startup-map datasets and generic SEO lists are not authoritative bulk inputs. BWM and RSS remain valuable optional funding/news evidence. Directory admissions are manually reviewed. No automatic investor-portfolio scraper is enabled. The jobs pilot uses employer-verified public listing APIs.

## Directory architecture

The current `filterArchiveRows` drops a company when it has no matching funding rounds. A catalog migration must change that deliberately rather than insert fake funding records into Notion data.

- **Company:** stable ID/slug, canonical domain, aliases, brand and legal-entity links, sourced description, founders, sector/product taxonomy, India relationship and admission decision. An office is a separate location record; current Bengaluru provenance/precision rules remain.
- **Observation:** company ID, field/type, value, source URL/source ID, source publication/effective date when known, `observed_at`, review state and optional expiry. Preserve contradictions and superseded facts.
- **Optional layers:** funding events, linked news, live job postings, investor/accelerator memberships and office points. No round is required for a company profile or map participation.
- **Query semantics:** ordinary directory filters include companies without events; applying a funding-stage/date filter explicitly selects matching funding observations. Unknown funding totals remain `null`; “no tracked events” is not “no funding”. Pagination, map cohorts and totals must use the same accepted catalog and filters.
- **Import safety:** Notion sync owns its archive, never the whole catalog. Candidate discovery cannot overwrite accepted identity or delete companies after a source outage. Source observations merge idempotently by provider/company identity.

Start with committed, versioned JSON and current server rendering; no new paid database or model key is needed for this bounded phase. Keep catalog/news/job history on the server; send compact identity/location summaries to the map and fetch expanded details when selected. Hosted Postgres is a later persistence milestone, not a blocker.

## Cards and tags

Keep cards scannable: company name, one-line purpose, city/sector, up to four useful evidence chips, a careers/jobs action and the latest relevant update. Open a profile/inspector for founders, legal entity, sources, funding timeline, more news and detailed jobs. Showing every field on every card would make the narrow directory difficult to use.

Derive tags from recorded facts, with a visible source/check date in details:

| Tag or field | Rule |
| --- | --- |
| `YC W15` / `Blume portfolio` | Accepted membership observation; retain source terminology and cohort where known. |
| `Open jobs · N` | Fresh, employer-matched published listings, deduplicated by provider/job ID; disclose source and India/global coverage. A careers link alone is `Careers`, not `Hiring`. |
| `Recent funding` | Accepted dated funding event within the defined window. Headline matching alone yields linked news, never a confirmed event. |
| `In the news` | Recent source-linked, company-matched metadata; ambiguous aliases require review. |
| `Office mapped` | An accepted office record, retaining campus/building accuracy and office kind. |
| `Bootstrapped`, `Profitable`, `Listed` | Explicit dated evidence and correct entity/time basis. Missing funding data never implies bootstrapped. |

Filters should operate on these same facts, with AND across filter groups and OR within a selected group. Prioritize city, sector, India HQ/office, mapped office, jobs, company type and recent updates. Add complex investor/funding filters after entity matching. Avoid popularity, sentiment or AI confidence badges without a defined measurable basis.

## Jobs and refresh strategy

Verified free technical paths are the public published-job interfaces documented by [Greenhouse](https://docs.greenhouse.io/job-board.html), [Lever](https://github.com/lever/postings-api) and [Ashby](https://developers.ashbyhq.com/docs/public-job-posting-api). Confirm an employer's board through its official careers site before using a board slug. These APIs do not imply every employer uses that provider or that a board covers every opening. Use only listing GETs and link applications to the employer. Store job ID/title/location/workplace type/URL/dates, not applicant data or entire descriptions. Other employers initially get a verified careers link.

Proposed refreshes (not live schedules): jobs daily, stale after 72 hours without a successful refresh; identity/memberships monthly with changed facts reviewed; office checks quarterly or after a reported move. Hide stale hiring chips/counts while retaining last-check/error information; a source failure is not zero vacancies. Preserve remote/global/location-unknown distinctions rather than treating “remote” as India-eligible. Existing daily Notion and six-hour RSS schedules continue unchanged.

## Bounded delivery order

1. **Completed — research/decisions:** scope, primary-source registry, admission rules, card/tag semantics and migration audit. D01 delivered policy; subsequent catalog implementation and release checks are tracked in the work ledger.
2. **Catalog pilot — reviewed:** ten priority additions are Razorpay, PhonePe, Zerodha, Zoho, Freshworks, Postman, BrowserStack, Swiggy, Unacademy and Whatfix. All ten now have reviewed admissions, source evidence and India footprints in `data/company-directory.json`; global HQ fields remain separate. None requires a fabricated funding event.
3. **Catalog delivery — shipped:** identity is decoupled from rounds; profiles/search/map share the catalog. Regression checks cover unknown funding and explicit funding filters. Deployment verification is tracked in the ledger.
4. **Card delivery — shipped:** compact summaries, sourced chips, available linked news and jobs, with expanded profiles and source evidence.
5. **Jobs pilot — cloud-verified:** Razorpay Greenhouse and PhonePe SmartRecruiters public postings. Daily workflow is active and a successful cloud run is recorded in the ledger. Other employer adapters remain future work.
6. **Broader admission/review tooling:** source adapters, aliases, candidate queue, correction workflow and additional filters. Continue Bengaluru office work in separate batches of at most three pending cases, saving results and the next handoff after each batch.

Delivery tracking and the precise next action live in `docs/directory-status.md`. Existing stable roadmap IDs remain; new work uses R44–R47.
