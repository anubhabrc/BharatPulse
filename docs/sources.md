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

## Bengaluru office pilot (25 November 2026)

`data/bengaluru-offices.json` contains eight accepted, source-checked public business locations: Meesho, Rapido, Pixxel, CRED, Perfios, SatSure, Moneyview and smallcase. Each record retains its official address URL, matched OpenStreetMap feature, source-check date, office type, building/campus precision and review note. Meesho and Rapido resolve to campus centres; floor, tower entrance and visitor access are not inferred. CRED's published correspondence office is not labelled a registered office. These checks compare public address evidence and map features; they are not physical verification or a guarantee that an office remains occupied.

The office source is separate from Natural Earth city centres. It is a subset of the filtered BWM cohort, so offices do not increase company or funding totals. At zoom 9 and above Bengaluru's city bubble gives way to the accepted office points. Companies without accepted points remain city-only in the directory and inspector; the map explicitly displays partial coverage. The Bengaluru city filter fits office bounds at first load. Selecting a city hub, office shortcut, directory card or individual pin uses the same accepted coordinates.

Coordinate data is © OpenStreetMap contributors under [ODbL](https://www.openstreetmap.org/copyright), obtained through the open-source [Photon geocoder](https://github.com/komoot/photon). Its public demo permits reasonable use but offers no availability guarantee. We used small, serial research requests at least 1.5 seconds apart, cached results and manually matched building names/streets. No runtime geocoder, browser autocomplete or recurring bulk geocoding is enabled; public Nominatim was not used. Before a larger batch, recheck the provider's policy or use a self-hosted/approved service.

`data/office-review.json` preserves unresolved/conflicting candidates and reasons: Sarvam, Ninjacart, Ather, Cashfree, Juspay and Udaan. Never accept the first search result automatically: research returned unrelated buildings for several of these. `npm run offices:geocode -- [company-slug]` performs bounded serial candidate lookups, caches minimal OSM feature metadata under ignored `work/office-geocodes/`, and writes a staging report. It never changes accepted data. Address corrections require fresh official evidence, a matching map feature, a changed record ID/date and a reviewed Git diff; previous evidence is retained in Git history. A public correction form and broader review tooling remain roadmap work.

## Map overhaul and expanded office coverage (26 November 2026)

The new accepted dataset has **54 office locations**: 53 with OpenStreetMap feature evidence and one company-published destination point (Ultraviolette). The provider/method is recorded per location; company-published coordinates are not attributed to OSM. No Google Maps service/API data was fetched. Registered offices, corporate offices and published business/correspondence offices are distinct kinds. Campus precision does not establish an exact tower, floor or visitor entrance. Co-located companies keep identical coordinates; the map opens a company selector instead of jittering their locations.

All six previously pending pilot addresses now have accepted points. `data/office-review-inventory.json` retains the full dated research inventory: 631 source-reported Bengaluru companies plus Zepto, whose older funding record says Mumbai but whose official site publishes a Bengaluru office. At this check, 54 are accepted, 37 need further address/coordinate resolution and 541 have not yet been researched. `data/office-review.json` retains unresolved primary evidence and reasons; `data/office-corroboration.json` retains independent corroborating checks. This is an explicitly incomplete office directory, not a claim that the remaining records have been researched or located.

[WhereWeWork](https://wherewework.co.in/) supplied discovery leads for 49 archived Bengaluru companies; [Bangalore Startup Map](https://www.bangalorestartupmap.com/) matched 235, with 240 unique leads across both. The public frontend datasets lacked field-level official address evidence, and several coordinates proved stale or misplaced. Their coordinates were not imported. Accepted additions use independently checked company pages and map features. Pending company-filings coordinates are not promoted without a geographical cross-check; one examined filing point was inconsistent with its named campus.

The default landing view now opens Bengaluru and the **Office locations** directory. **All companies** retains records with city-only locations; **All cities** remains available. Location filters match archived HQ labels or accepted office cities, preserving the original HQ field. Within a selected city, office pins must belong to that city. National company/funding totals remain deduplicated; geographic cohorts can overlap. Office-preferred national city hubs are representative aggregates rather than source-reported HQ counts alone.

R43 follows the user's video and direct browser inspection of both references. The Bengaluru Rent terms gate was entered only after explicit user approval. Inspection covered map layers and keyboard shortcuts; no listing, location permission or contact form was submitted. The original recording and 11 extracted frames are preserved locally under the chat working directory's `work/map-overhaul/`, outside the public repository.

MapLibre/OpenFreeMap remain the free/open-source map stack. Streets uses Liberty's roads, parks, POIs and building detail; Night is adjusted for readable roads and labels. Keyboard arrows pan; +/- zoom; Shift+arrows rotate/tilt; Home restores the city camera; 0 restores north-up/flat; Escape closes details. The canvas is focusable. Desktop wheel zoom no longer requires Ctrl/Cmd. GPU-rendered points and worker-based clustering avoid per-company DOM markers. Basemap readiness waits for loaded rendering; sorting and pagination do not refit an unchanged map cohort. No measured FPS claim is made.

## Curated directory research and office batch B01 (26 November 2026)

The user selected notable startups, scale-ups and established product companies, including those without recent funding. [Directory strategy](directory-strategy.md) and `data/directory-sources.json` record the checked official portfolios, YC profile route, award/growth cohorts and public published-jobs API documentation. These are research-only sources, not enabled scrapers or admission decisions. MCA/DPIIT registration is not the inclusion criterion. The public company list still uses the BWM archive; the independent catalog and jobs integrations remain pending.

Office batch B01 resolves Stellapps through its [official contact page](https://www.stellapps.com/contact-us/), which publishes the legal entity and Ozone Manay Technology Park registered office in the company-authored map content. The independently mapped OSM commercial campus matches that address; its centre is shared with separately sourced Porter, with campus precision and no inferred block/entrance. No company-filing coordinate is used. There are now **55 accepted locations: 54 OSM and one company-published destination**, with **36 needing review and 541 awaiting research**. HomeLane and Zolve remain pending: their precise named-place Photon queries returned no features; official addresses were rechecked and no wider-area point substituted. Both query results are cached locally. Only three pending cases were examined in this batch.
