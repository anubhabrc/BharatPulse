# BharatPulse development checklist

This is the maintained implementation checklist, derived from the original conversation and master PRD, then corrected against working source access and the current code. Items are ordered from easier to harder within five difficulty bands. Dependencies and source access can change execution order. Free/open-source components are the default; a public website is not assumed to provide a reliable API or commercial reuse permission.

Status: `[x]` shipped and checked, `[ ]` pending. Work in this change is marked **in progress** until its tests and deployment are verified. The earlier model's prices, market statistics, supplier costs and 12-week schedule are proposals, not validated requirements.

## Difficulty 1 Small deterministic changes

- [x] R01 Canonical company list from BWM Notion with original record and article links. Evidence: 1,905 companies, 2,337 events, source snapshot and parser tests.
- [x] R02 Company search, city/sector/stage/date filters, pagination and exact decimal funding totals.
- [x] R03 Company funding timeline, missing-value labels, source dates, explicit snapshot coverage and duplicate/conflict reporting.
- [ ] R04 Publisher source registry with actual RSS response checks and freshness. **In progress.** Include Inc42, Entrackr, YourStory, The Ken and The Arc; keep unavailable sources visible in the source report.
- [ ] R05 Sourced descriptions and founder names for an initial set of popular companies. **In progress.** Company sites and company/investor-maintained profiles first; no personal addresses, identifiers or private contacts.
- [ ] R06 Better coarse sector baskets while preserving every original source label. Free deterministic taxonomy first; editable review later.
- [ ] R07 CSV exports with coverage, source links and amount units.

## Difficulty 2 Bounded ingestion and presentation

- [x] R08 Repeatable public Notion import, cursor traversal, transient HTTP retries, cached recovery and atomic snapshot replacement.
- [ ] R09 Daily automated Notion refresh with regression guards, failure logs and a manual run option. **In progress.** GitHub Actions; do not require a running laptop or paid scheduler.
- [ ] R10 RSS refresh every six hours, headline/URL/date normalization, deduplication, bounded retention and last-good-data preservation. **In progress.** No article-body copying and no paywall bypass.
- [ ] R11 Company-linked news based on explicit headline mentions, with an unmatched news inbox. **In progress.** A mention is not confirmation of a funding event.
- [ ] R12 Source health/freshness in the UI and reproducible source reports. **In progress.** Source failures must not erase historical data.
- [ ] R13 Investor names and round participation from source-supported observations; do not label this a complete cap table.
- [ ] R14 Company aliases, consistent URL normalization and an explicit correction history.
- [ ] R15 Funding/debt/secondary/grant breakdowns and clearly defined historical currency conversions.
- [ ] R16 Basic cohort charts and stage/sector/city funding trends using SQL or exact deterministic aggregation.

## Difficulty 3 Interactive discovery and reliable storage

- [ ] R17 Fast national startup map with city-level hubs and popular-company discovery. **In progress.** MapLibre GL JS, OpenFreeMap and cached public-domain city centres. Approximate points must not imply exact offices.
- [ ] R18 Landing-page list renders first; map code/data warm after the page is usable; WebGL starts only when the map is opened. **In progress.** Shared filters, compact map endpoint, cleanup and error fallback.
- [ ] R19 Verified corporate-office address geocoding, accuracy labels, source dates and correction workflow. Use a policy-compliant cached geocoder; no bulk browser autocomplete against public Nominatim.
- [ ] R20 More founder/company profiles from official sites and reusable source adapters with provenance per field.
- [ ] R21 Hosted PostgreSQL/PostGIS repository, migrations, separate runtime roles, tested access policies, backups and source-version storage. Core schema exists; hosted integration remains pending.
- [ ] R22 Human review queue for candidate companies, rounds, aliases, duplicate tranches and contradictory sources. Preserve reported versus accepted facts.
- [ ] R23 Scheduled jobs with incremental checkpoints, idempotency, observability and recovery beyond committed snapshots.
- [ ] R24 Investor/incubator discovery layers and sourced job listings, with location accuracy and refresh policies.
- [ ] R25 Basic watchlists, saved filters and funding alerts after authentication and user notification preferences exist.

## Difficulty 4 Cross-source evidence and spatial analysis

- [x] R26 PostGIS point-in-polygon API with inclusive boundary semantics and address-accuracy policy; core tests execute PostGIS. The drawn-area frontend and hosted database are still pending.
- [ ] R27 Polygon/box selection, synchronized map/table/cohort totals, transit proximity and spatial performance benchmarks.
- [ ] R28 MCA/DPIIT legal-entity enrichment and fiscal-year financial matrices. Confirm available access, units, consolidation basis, lag and reuse terms before selecting a provider. No unsupported free bulk financial API assumption.
- [ ] R29 LLM-assisted extraction into staging with schema validation, evaluation fixtures and bounded cost. Free deterministic extraction can precede a paid model; model output cannot directly overwrite accepted facts.
- [ ] R30 Print-news keyword taxonomy and sector briefs with citations and explicit coverage.
- [ ] R31 Curated YouTube metadata and timestamped insights; assess creator permissions and transcript/model availability. Retain attribution and distinguish creator analysis from a filing.
- [ ] R32 Metro, SEZ/STPI and government GIS overlays with verified endpoints, dates, licenses and update cadence. Circle/guidance values are not office rents.
- [ ] R33 Optional billing, quotas and exports once user demand and data costs are measured. Revisit the PRD's free-versus-paid AI allowances.

## Difficulty 5 Research-heavy or access-dependent features

- [ ] R34 Hybrid spatial RAG using structured aggregates plus company-scoped news/video retrieval, evaluated citations and current-web verification. Sector background must not become evidence of local company operations.
- [ ] R35 Corporate group/legal-entity graph, ownership percentages and valuation/financial benchmarking with auditable provenance and restatements.
- [ ] R36 Source-qualified public/media sentiment over time, with uncertainty and evaluation rather than an unexplained score.
- [ ] R37 Company-level EPFO establishment mapping and headcount trends only after lawful, sustainable access and metric validity are established. Do not equate an establishment payment record with total company employment.
- [ ] R38 Sourced operational footprints, Sentinel-2 NDVI pilot, cloud masks and dated imagery. TiTiler/Rasterio/STAC are open-source options; compute/egress still need a budget.
- [ ] R39 Validated moisture/SAR/thermal analytics and comparisons over actual operational footprints. Vegetation indices do not directly establish root-zone moisture, yields or business performance.
- [ ] R40 Optional hyperspectral/commercial imagery partnerships, warm-introduction network and sponsored pins. These require providers or opted-in participants, not just code.

## Source decisions

Use [source access notes](sources.md) for the current verification results. Prefer free factual metadata and open-source parsing/mapping. Paid filings, commercial imagery, provider subscriptions and model keys remain explicit decisions. The app must not advertise an integration as live merely because its schema or adapter exists.

## Maintenance

Every feature change updates the relevant IDs above. Mark an automated refresh shipped only after its GitHub workflow is enabled and a real run is checked. Record validation and material limitations in the change log below; keep future work unchecked. Never promote old model claims into verified source facts.

### Change log

- 25 November 2026: Checklist created from the initial conversation and PRD. R01–R03, R08 and the backend portion of R26 were already implemented and tested. This change is implementing R04–R05, R09–R12 and R17–R18.
