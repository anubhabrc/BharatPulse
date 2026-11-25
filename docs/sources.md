# Source access and open-source choices

Verified 25 November 2026. These are actual access tests, not endorsements of every record or a grant of commercial redistribution rights. The machine-readable registry is data/feed-sources.json; generated feed health records preserve each run's outcome.

| Source | Tested endpoint or entry point | Result | Initial use |
| --- | --- | --- | --- |
| BWM Notion | Weekly Funding Updates, linked from the app | Public page/table reads work | Daily factual funding snapshot; preserve all record/article links and the last good dataset |
| Inc42 | https://inc42.com/feed/ | HTTP 200, RSS XML | Headline, permalink and published date; no DataLabs access or full article copying |
| Entrackr | https://entrackr.com/rss | HTTP 200, RSS XML | Headline metadata and links; /feed/ and /rss.xml return 404 |
| YourStory | https://yourstory.com/feed | HTTP 200, RSS XML | Headline metadata and links |
| The Ken | https://the-ken.com/feed/ | HTTP 200 RSS in the script test | Headline metadata only; no subscription article scraping |
| The Arc | https://thearcweb.com/rss | Redirects to https://www.thearcweb.com/rss.xml, HTTP 200 XML | Headline metadata only; no subscription article scraping |
| NDTV Profit | https://www.ndtvprofit.com/feed and /rss | HTTP 403 in the script test | Not enabled; do not bypass access controls |
| NDTV general RSS | https://www.ndtv.com/rss | Publisher states personal, non-commercial RSS use | Do not treat this as an unrestricted public SaaS data license or silently substitute it for NDTV Profit |
| VCCircle | https://www.vccircle.com/feed | HTTP 404 | Discovery/research pending; no assumed free API |
| The CapTable | https://the-captable.com/feed | HTTP 404 HTML | Discovery/research pending; no assumed full-text access |
| DPIIT/Startup India | [OGD recognised-startup catalog](https://www.data.gov.in/catalog/startup-recognized-dpiit) | Official catalog describes counts by year, industry and state; not a company-level funding feed | Future macro baselines; company-level recognition matching needs a separate verified route |
| MCA company master data | [Official OGD catalog](https://www.data.gov.in/catalog/company-master-data) | Catalog advertises open downloads/API and CIN, name, status, category, capital, registration date and location fields; a record endpoint/key has not been integrated | Candidate for periodic legal-entity enrichment after a reviewed brand-to-CIN match; master data is not a financial filing or funding history |
| MCA filings | Official public-document service or an approved provider | Document access and provider coverage differ; filings can require payment. The [CDM export portal](https://www.mcacdm.nic.in/company-master-details.php) includes a CAPTCHA | Later financial enrichment; do not assume a free bulk AOC-4 API, bypass CAPTCHA or invent per-company prices |

## Free and open-source implementation choices

- GitHub Actions in this public repository for daily Notion and six-hour RSS jobs. Notion uses a single request stream spaced 1.8 seconds apart in CI, with longer HTTP 429 backoff and Retry-After handling. Source steps fail independently, so a failed Notion refresh can retain its snapshot while checked RSS updates publish; the workflow still reports the failed refresh. Scheduled runs are best-effort, and GitHub can disable inactive public-repository schedules. Failures are visible in Actions; unchanged/failed source content must not wipe prior snapshots.
- fast-xml-parser for bounded RSS/Atom parsing. Only headlines, source URLs, dates and matching metadata are persisted. No LLM key is required for the initial feed layer.
- MapLibre GL JS for WebGL mapping, OpenFreeMap for the initial public vector basemap and Natural Earth public-domain populated places for cached city centres. Preserve basemap attribution. Public tile hosting is an external service; open-source code does not guarantee an SLA.
- Current source-reported city labels are not precise office locations. Unrecognized or ambiguous locations remain unmapped. Do not jitter city-centre points to fabricate office pins.
- Company sites and company/investor-maintained profiles for curated founders and company descriptions, with field-level sources and observation dates. Public professional founder names are sufficient; no private contacts or personal identifiers are needed.
- PostgreSQL/PostGIS/pgvector and TiTiler/Rasterio/STAC remain appropriate later components. Hosted databases, geocoding, model calls and raster processing may still have infrastructure costs.

## Reliability rules

Preserve the last good dataset after failures; record freshness and partial failures. Normalize URLs and distinguish repeated reporting from distinct funding rounds. RSS headlines are not accepted funding events. Company mentions are automatic link suggestions, not independent verification. Disclose source and coordinate precision in the UI. Keep paid/licensed/access-dependent features in the roadmap until their data path is verified.

## Government data boundaries

The official MCA master-data catalog is a promising free route for identity/status/incorporation metadata, separate from the harder financial-filings integration. Confirm resource freshness, schema, API-key requirements and licensing before implementing it. A company brand must not be matched to a legal entity by fuzzy name alone. The DPIIT catalog describes recognised-startup counts by industry/state/year; those macro counts cannot be treated as the funded BWM cohort or evidence about an individual company. Neither catalog is active in the app yet.

## UI references (25 November 2026)

- [Neobrutalism components](https://www.neobrutalism.dev/) and [ekmas’s repository](https://github.com/ekmas/neobrutalism-components): visual direction for borders, hard shadows, typography and colored surfaces; implemented with the app’s existing CSS rather than importing component source.
- [Bangalore Startup Map](https://www.bangalorestartupmap.com/): inspected the light basemap, clustered discovery, compact controls and news overlay. No source data was imported.
- [bengaluru.rent](https://bengaluru.rent/): inspected public page controls and the visible onboarding screen. Its entry screen asks users to accept terms before proceeding, so no agreement was accepted for reference inspection.
- The user’s supplied main-layout screenshot determines the desktop layout: directory on the left, map on the right, visible immediately.
