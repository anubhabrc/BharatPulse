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
| DPIIT/Startup India | Official startup recognition/directory services | No bulk automated endpoint selected yet | Research/download adapter after terms and data availability are checked |
| MCA | Official public-document service or an approved provider | Document access and provider coverage differ; filings can require payment | Later financial enrichment; do not assume a free bulk AOC-4 API or invented per-company prices |

## Free and open-source implementation choices

- GitHub Actions in this public repository for daily Notion and six-hour RSS jobs. Scheduled runs are best-effort, and GitHub can disable inactive public-repository schedules. Failures are visible in Actions; unchanged/failed source content must not wipe prior snapshots.
- fast-xml-parser for bounded RSS/Atom parsing. Only headlines, source URLs, dates and matching metadata are persisted. No LLM key is required for the initial feed layer.
- MapLibre GL JS for WebGL mapping, OpenFreeMap for the initial public vector basemap and Natural Earth public-domain populated places for cached city centres. Preserve basemap attribution. Public tile hosting is an external service; open-source code does not guarantee an SLA.
- Current source-reported city labels are not precise office locations. Unrecognized or ambiguous locations remain unmapped. Do not jitter city-centre points to fabricate office pins.
- Company sites and company/investor-maintained profiles for curated founders and company descriptions, with field-level sources and observation dates. Public professional founder names are sufficient; no private contacts or personal identifiers are needed.
- PostgreSQL/PostGIS/pgvector and TiTiler/Rasterio/STAC remain appropriate later components. Hosted databases, geocoding, model calls and raster processing may still have infrastructure costs.

## Reliability rules

Preserve the last good dataset after failures; record freshness and partial failures. Normalize URLs and distinguish repeated reporting from distinct funding rounds. RSS headlines are not accepted funding events. Company mentions are automatic link suggestions, not independent verification. Disclose source and coordinate precision in the UI. Keep paid/licensed/access-dependent features in the roadmap until their data path is verified.
