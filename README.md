# BharatPulse Geo

An Indian startup intelligence project with a source-linked company and funding repository. The app includes a searchable Next.js screener, company funding timelines, an imported BWM Notion archive, PostgreSQL migrations, reviewed import tools, publication headlines, sourced founder profiles, and a city-level startup map.

The default app uses real records imported directly from Backstage with Millionaires’ public Notion archive: 1,905 companies and 2,337 funding events across 135 populated weekly pages. The import checks all 148 linked weeks and records the 13 empty published pages separately. Source dates span 2 January 2024 to 20 November 2026. This is a bundled snapshot, so localhost and Vercel show real data without database setup. Synthetic fixtures remain available only through explicit `DATA_MODE=demo`; database failures never silently switch data sources.

## Run the preview

Requires Node.js 22.9 or newer. Dependencies are pinned by `package-lock.json`.

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:3000>. Company search, city/sector/stage/date filters, funding totals, pagination, and source-linked company timelines work without credentials. Existing Vercel projects need no data environment variables for the default archive mode.

## Refresh the Notion snapshot

```sh
npm run data:sync -- --refresh
```

This reads the public weekly tables without authentication and generates `data/bwm-archive.json` and `data/bwm-import-report.json`. Cached responses live in the ignored `work/notion-cache/` directory. A normal `npm run data:sync` can resume using that cache. Failed or restricted requests prevent replacement of the previous snapshot. The `Refresh public sources` GitHub Actions workflow is configured for daily Notion refreshes (06:11 IST) and six-hour RSS refreshes (05:53 / 11:53 / 17:53 / 23:53 IST). It supports manual runs, checks tests and production builds, then commits only the generated snapshots through the existing GitHub/Vercel integration. See the live Actions history and `/sources` timestamps to verify actual delivery. GitHub schedules are best-effort and can be disabled after repository inactivity. No laptop, paid cron service or new model key is required. A drop of more than 20% in companies/events/populated pages or a shrinking historical date range blocks replacement pending review; `--allow-large-removals` is a deliberate operator override.

The snapshot preserves source-reported amounts and links. It is not an audited financial database or a complete lifetime-funding history. See `docs/data-source.md` for field mapping, duplicate handling and coverage details.

## Publication news and startup map

`npm run news:sync` imports headline/link/date metadata from the enabled sources in `data/feed-sources.json`: Inc42, Entrackr, YourStory, The Ken and The Arc. The importer accepts bounded RSS/Atom, rejects unsafe source links and XML entities, deduplicates URLs, keeps 90 days (at most 2,500 items), and preserves prior items on feed failures. Automatic company name matches are suggestions; they do not create funding events. `/news?view=unmatched` shows the unmatched inbox. `/sources` exposes per-feed health and freshness. No full articles or paywalled text are copied.

The landing page renders the company list on the server. After hydration, idle preparation fetches compact map data and imports MapLibre without starting WebGL; data-saver and slow connections skip this background step. The map initializes when opened and removes its resources when closed. It clusters city hubs with company counts, shares all screener filters, and uses the entire matching cohort rather than a table page. The first snapshot maps 1,775 of 1,905 companies to 45 city centres; 130 unresolved locations remain unmapped. City centres are approximate and never imply offices. OpenFreeMap is a free external basemap service, with its required attribution preserved.

`data/company-info.json` contains six curated company/founder profiles with field-level primary sources and observation dates: Zepto, Meesho, Sarvam, Ather Energy, Skyroot Aerospace and Pixxel. Unknown facts for other companies are left blank. Natural Earth city coordinates and licenses are recorded in `data/city-centres.json`.

Use `docs/roadmap.md` as the maintained checklist in ascending implementation difficulty and `docs/sources.md` for verified access and source restrictions.

## Connect PostgreSQL

PostgreSQL is optional for the bundled archive. For the database backend and address-level spatial queries, use PostgreSQL 16 or newer with PostGIS. For local development, Docker Compose is provided:

```sh
docker compose up -d --wait
cp .env.example .env
npm run db:migrate
```

The Compose database binds to loopback on port 54329 and uses an explicitly local development password. For Supabase, use its server-side database connection string in `.env`, ensure PostGIS can be enabled, and keep the `bp` and `bp_meta` schemas out of exposed Data API schemas. Choose the appropriate TLS connection settings for your provider; do not disable certificate verification.

The migration runner records checksums, skips applied migrations, and stops if an already applied migration was edited. Both initial migrations run in one transaction. Use an administrative connection for migrations.

Do not use the local administrator connection as a production web credential. The schema denies PUBLIC access and enables row-level security. A production rollout must provision distinct runtime reader and ingestion roles with explicit grants/policies and verify them before connecting the web app. The owner connection bypasses RLS by PostgreSQL design and is used only by the local development setup and migration tests.

## Review and import records

The importer accepts a versioned JSON batch. `data/demo-reviewed.json` shows the format using synthetic data. Monetary values are decimal strings in full currency units; INR amounts are rupees, not crores. An undisclosed amount is `null`, never zero. FX is optional, but a provided rate requires its date and source URL. It means USD per one unit of the original currency.

Validate an input without making database changes:

```sh
npm run import:plan -- data/demo-reviewed.json
```

After a person reviews every source, company identity, event identity, amount, date, and location:

```sh
npm run import:publish -- data/demo-reviewed.json --reviewed-by "Your name"
```

Here, `publish` means accept reviewed records into your own database. It does not publish a website or send anything to a third party. The CLI requires an explicit reviewer identity and a database connection. It does not perform the review for you.

For real data, create a separate reviewed input file using this structure and replace all fictional content. Set `is_demo` to false only for actual sourced company records. A source's reuse status is an operator declaration, not an automated determination of permission.

`event_key` is the canonical event identity within a company. Reports of the same round must reuse that key. Two distinct rounds must use different keys even if their dates and amounts coincide. This milestone does not automatically infer that identity from headlines. It also does not automatically merge brands by domain or fuzzy similarity.

Repeated imports add no duplicate events or evidence. A different source can attach evidence to the same event. Conflicting fields abort the entire transaction for human review. Corrections, merges, location changes, and restatements require a future explicit correction workflow; this importer intentionally does not overwrite them.

Once real records are loaded, change `.env` to `DATA_MODE=database` and restart Next.js. Synthetic records remain excluded from live query results.

## API routes

- `GET /api/companies?q=example&city=Bengaluru&stage=Seed&from=2024-01-01&sort=recent&limit=20&offset=0`: archive company search and filters, matching cohort metrics, source metadata and pagination. `sector` and `to` are also supported; sort is `recent`, `funding` or `name`. Limit is at most 100. Numeric amounts are returned as strings.
- `GET /api/companies/[slug]`: imported company metadata, funding events and source links. The corresponding profile page is `/company/[slug]`.
- `GET /api/map`: shared archive filters, compact GeoJSON city hubs, counts and featured profiles; table pagination does not limit the map cohort.
- `POST /api/areas`: body is a GeoJSON Polygon geometry, not a Feature. Includes boundary points, uses the latest observed HQ as of today, and includes only address-level locations. Requires database mode and both migrations. Results are capped at 1000 and expose a truncation flag.

Example geometry:

```json
{"type":"Polygon","coordinates":[[[77.5,12.8],[77.8,12.8],[77.8,13.1],[77.5,13.1],[77.5,12.8]]]}
```

Coordinates use longitude, latitude. PostGIS validates topology. Area requests have a body/vertex limit and a database statement timeout. The spatial endpoint selects companies; it does not yet implement area aggregates, time-travel HQ selection, operational footprints, or AI answers.

## Verify

```sh
npm test
npm run typecheck
npm run build
```

The test suite executes the actual core migration and reviewed importer against PGlite, an embedded PostgreSQL runtime. Spatial tests load its PostGIS extension and execute the actual spatial migration. This is stronger than SQL-text assertions, but it does not replace a test against the selected hosted PostgreSQL provider, its version/extensions, connection pooler, grants and policies. `npm run test:db` runs only database and spatial tests.

## What is implemented

- Brands, aliases, legal entity relationships, sector membership and dated locations.
- Canonical funding events with separate equity, debt, secondary and grant categories.
- Documents, immutable content versions, evidence links and source reuse declarations.
- Financial statement and media segment storage, including multi-company/sector links.
- A reviewed funding import path with transaction rollback, conflict detection and import audit records.
- Exact SQL funding rollups over approved announced/completed events; missing conversion coverage is explicit.
- A real BWM archive snapshot, searchable screener with cohort filters, source-linked company profiles, and read-only company/spatial endpoints.

Financial and media tables are foundations only; their ingestion and profile presentation are not implemented yet. The real BWM archive works as a bundled snapshot; it has not been loaded into a hosted PostgreSQL instance. No authenticated MCA, EPFO or video provider is configured.

## Next work

Follow the stable IDs in `docs/roadmap.md`, ordered from small deterministic features to research/access-dependent work. Near-term additions are sector baskets, CSV exports, investor observations, more source-backed founder profiles and a correction/review workflow. Hosted PostGIS, exact office locations, polygon drawing, source-qualified financial matrices and cited AI answers remain separate milestones.

Satellite processing, EPFO, land/rent analytics, subscriptions, contact introductions and social sentiment remain later work. See `docs/decisions.md` for the engineering decisions and unresolved product choices.
