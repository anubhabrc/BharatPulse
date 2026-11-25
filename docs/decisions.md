# Initial engineering decisions

## Product scope

The first user journey is company discovery, inspection of sourced history, and geographic selection. A trustworthy repository supports that journey. Automated extraction and AI answers depend on accepted evidence rather than creating canonical facts directly.

The earlier chats establish company profiles, cross-week history, maps, drawn-area questions, attributed news/video analysis, sector trends and optional government/satellite context. The specific subscription prices, EPFO pipeline, warm introductions and 12-week full-product schedule remain proposals.

## Application and deployment

The app uses Next.js App Router and TypeScript. The reviewed import CLI uses the same validation code as the application to reduce duplicated data contracts. A separate Python service can be introduced when extraction or raster processing needs it; no Python service is required for this milestone.

The project is published through the user's GitHub/Vercel workflow. Its default archive mode serves a bundled real BWM Notion snapshot without an external database. A hosted PostgreSQL instance has not been provisioned. Its optional server-side `postgres` client requires a Node-compatible hosting environment with PostgreSQL connectivity. A Cloudflare Workers deployment would need an HTTP-compatible database adapter or an appropriate connection service and framework build adaptation.

## Data model

A brand is separate from its legal entities. A shared website domain is a matching signal rather than a unique identifier. CINs belong to legal entities; they are alphanumeric identifiers. No automatic brand/legal-entity inference is implemented.

One funding event can have many supporting sources. Amounts stay in original currency units. Secondary transactions do not count as primary equity raised. Rumored and cancelled events do not contribute to tracked totals. Missing values remain unknown. A tracked total describes the accepted corpus, not necessarily lifetime funding.

The current importer requires manually assigned canonical event keys and rejects conflicts. It cannot yet reconcile tranche extensions, retractions, currency disputes or legal reorganizations. Those need an explicit correction/review workflow before automated feed reports can become canonical funding events. RSS headline metadata and name-based company mentions are already separate, read-only discovery signals; they never overwrite funding amounts.

Source versions retain the submitted evidence excerpt and metadata snapshot. A metadata-only source cannot import excerpts. The source-policy field records what the operator established; it is not permission acquired by the software. Full source text, captions, and vendor filings should be retained only according to the applicable source arrangement.

Financial statements attach to a legal entity and specify period, currency, standalone/consolidated basis and evidence type. Net profit/loss and operating cash flow are separate. No financial statement ingestion is implemented yet.

Media segments link many-to-many to companies and sectors. A creator's analysis and a model's inference are explicitly different claim types. Model/embedding versioning, vector storage, citation evaluation and AI orchestration will be added with the retrieval milestone rather than assuming one embedding dimension now.

## Spatial semantics

Headquarters, registered offices and operational locations are different kinds of location. Coordinates have an accuracy level, observation date and evidence. Address-level HQ observations alone enter precise area queries by default. The latest observation wins; the app does not claim it has freshly verified the address. Boundary points are included with ST_Covers. Historical HQ observations do not continue to count after a newer observation exists.

Operational footprints require sourced boundaries and validity dates; they cannot be inferred from an HQ or a sector label. Sector-wide material can supply background context in an area answer but must not be presented as evidence that a particular local company operates there.

## First map and publication layer

The user’s revised layout replaces the list-first/map-tab design with a full-height split workspace. A server-rendered directory stays on the left; the map occupies the right immediately. Its compact hub dataset is serialized with the page, eliminating an extra client data request. The map component renders its controls with the initial HTML and initializes MapLibre on hydration. The WebGL map survives filter changes; only its GeoJSON source is replaced, and a ResizeObserver handles layout changes. Selected-company requests are abortable and never show a prior company’s monetary summary. The right-hand inspector keeps its profile action visible while details scroll. On mobile, the map appears above the directory and its controls remain usable without overlap.

The UI uses black borders, hard shadows, a lavender/yellow/mint palette, and self-hosted Space Grotesk. The requested neobrutalism.dev and ekmas component library informed the visual system; the existing Next.js/CSS implementation and GitHub/Vercel publishing route remain in use. The supplied main-layout image informs the directory/map split, and the requested startup/rent-map references inform compact map controls and overlays. No source-site logos, data or component source code were copied.

MapLibre clusters city hubs and shows summed company counts, preserving OpenFreeMap/OpenStreetMap attribution. Natural Earth centres represent reported cities, not office addresses; unresolved labels are omitted and counted. Six curated company/founder profiles carry field-level sources and checked dates. Funding abbreviations are explicitly rounded presentation values; exact decimal amounts remain available in tooltips and source-linked profiles.

The public-source workflow checks Notion daily and RSS every six hours using GitHub Actions. Slow Notion requests and Retry-After backoff respect cloud rate limits. A source failure retains its last good snapshot; independently successful source data can still publish after validation, while the workflow reports any failure. The app reports retrieval/check times rather than claiming continuously live source data. Public feeds provide headlines, links and dates only. See sources.md for tested endpoints and roadmap.md for maintained implementation status.

## Access and operational limits

Private schemas plus deny-by-default grants and RLS are the starting posture. Production reader and ingestion roles, authorization where required, rate limiting, backup/restore, monitoring and provider-level integration tests remain rollout work. No secret belongs in browser bundles, source control or the hosting manifest.

The current catalog routes are read-only. No browser-accessible ingestion endpoint exists. Database failures return unavailable states, never invented records. Demo mode is explicitly separate and labelled.

## Decisions still needed

- Geographic depth after the initial national city-level map: select a city or cohort for verified office addresses.
- Definition of an Indian startup: incorporation, founder origin, operating market, headquarters, or a combination.
- Source access and budget, including baseline round records and geocoding.
- Whether first users need research profiles, investor discovery or geographic screening most urgently.
- Hosting/database account and realistic monthly infrastructure/data/AI budgets.
- Metric definitions for grants, mixed equity/debt rounds, historical currency comparisons and dataset coverage.

These decisions do not block running or testing the scaffold. They should be resolved before promising national completeness or paid financial and satellite analytics.
