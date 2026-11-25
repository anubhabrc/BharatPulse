# BharatPulse Geo

An Indian startup intelligence project, starting with a source-linked company and funding repository. This checkout implements the first engineering milestone. It includes a searchable Next.js screener, PostgreSQL migrations, a reviewed JSON import CLI, and read-only company and spatial query endpoints.

The default preview uses three fictional companies. It does not claim to contain live startup data. Database mode excludes synthetic companies and never silently falls back to demo records after a database error.

## Run the preview

Requires Node.js 22.9 or newer. Dependencies are pinned by `package-lock.json`.

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:3000>. Search works without database credentials. Demo funding totals are deliberately withheld.

## Connect PostgreSQL

Use PostgreSQL 16 or newer with PostGIS. For local development, Docker Compose is provided:

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

- `GET /api/companies?q=example&limit=20&offset=0`: company search, sectors, latest HQ city and tracked funding metrics. Limit is at most 100. Numeric amounts are returned as strings.
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
- A development screener and read-only company/spatial endpoints.

Financial and media tables are foundations only; their ingestion and profile presentation are not implemented yet. No real source has been imported or authenticated in this checkout.

## Next milestone

1. Confirm reuse/access for one baseline source and import 50–100 reviewed real companies and their underlying rounds.
2. Add company profile routes showing event history and source evidence.
3. Add a MapLibre/Terra Draw workspace synchronized with table filters and spatial endpoints.
4. Add a single RSS adapter that writes extraction candidates to staging, plus a review interface.
5. Curate and review a small timestamped video corpus, then implement cited answers with SQL-derived aggregates and cohort-restricted retrieval.

Satellite processing, EPFO, land/rent analytics, subscriptions, contact introductions and social sentiment remain later work. See `docs/decisions.md` for the engineering decisions and unresolved product choices.
