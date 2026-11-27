# Geographic data contract

The canonical committed snapshots remain the durable store. `src/lib/spatial-data.ts` builds a versioned read model from them on deployment, rather than storing another independently refreshed copy of company totals. Area selection works in the live archive mode without a hosted database. The existing PostGIS API/schema remains available separately; hosted PostgreSQL, backups and ingestion migrations are still R21 work.

| Layer | Identity and location | Evidence and aggregation |
| --- | --- | --- |
| Companies | Catalog slug; no invented point | Canonical catalog and original identity/admission sources |
| Offices | Stable office observation ID → company slug; GeoJSON Point, longitude then latitude | Building/campus precision, office kind, check date, separate official address and coordinate URLs |
| Funding | Original event ID → company slug | Exact decimal USD, disclosure/exclusion flags and source links stay in the archive; company history is counted once across selected offices |
| Jobs | Provider/source ID + posting ID → company slug; explicit city/country labels | No precise job geometry; a company office is not substituted for a job site. Fresh employer-city postings are a related signal, not an area vacancy total |
| News | Retained headline ID/URL → company slugs | Company relationship only; unique headlines may concern other locations. Publisher URLs and dates retained, no article bodies |
| Future rents | Independent observation ID and sourced Point | Strict contract requires building/campus precision, office/residential type, decimal INR amount, per-square-foot/month or per-unit/month, asking/transacted status, observation/check dates and HTTPS evidence |

The rental schema is preparation only. No rental source, snapshot, ingestion or rent aggregate is connected. Its count/median remain null. Other unsupported signals must likewise remain null or unavailable; never assign an employer's coordinates to them to manufacture exact area statistics.

## Queries and UI

`POST /api/areas/summary` accepts `{selection, filters}` and uses the complete filtered cohort, independently of table pagination. Supported selections are a geodesic Circle with `[longitude, latitude]` centre and radius of25m–100km, or a simple closed GeoJSON Polygon with one ring and at most256 vertices. The UI supplies freehand polygons, circles, boxes and the current map bounds. D10 captures a continuous pointer drag, simplifies freehand traces in screen space, auto-closes the loop, validates it and waits for explicit Use area. Screen pixels are unprojected through the current map camera; they never become company coordinates. Self-intersections, degenerate/unclosed rings, holes, dateline-crossing polygons, invalid coordinates and oversized requests are rejected. Request bodies are capped while streaming at24,000bytes. The older `/api/areas` PostGIS contract is unchanged.

Circle inclusion uses spherical great-circle distance; its rendered96-segment outline is a visual approximation. Polygon inclusion includes the boundary. Building/campus centre inclusion does not establish that the whole property lies within an area. Only accepted office observations checked no later than the query date participate; representative city centres never participate. Unknown/unlocated company coverage is reported explicitly and cannot be classified as inside or outside. Current accepted coverage is89 of641 Bengaluru-footprint companies, not a complete city census.

Selecting an area updates the directory to the same unique company IDs as its summary. Funding/date/stage filters use existing archive semantics; funding is company history associated with current sourced office points, not capital spent locally or proof of the office at the event date. Sector counts preserve original labels. Job postings count once by source/id and require the selected employer's office city, explicit India eligibility and the existing72-hour freshness rule. Missing boards and stale boards do not become zero vacancies. News deduplicates by URL across company mentions; API results cap job details at50 and headlines at20 with truncation flags, while counts cover the complete matching set.

Drawing previews and uncommitted reviewed drafts stay in the browser. Only explicitly applied selections trigger a summary request; superseded requests are aborted. Switching filters recalculates the existing selection, switching styles restores its outline, and clearing restores the normal directory. Map-view selection also supports keyboard users who position the map before entering drawing. A focused dialog traps focus, offers an accessible map-view fallback and restores focus/scroll/map gestures on apply or cancel. Selections are temporary UI state, not saved watchlists or user accounts.

## Extending storage

Add new sources as separate dated observations with stable subject/source identifiers and explicit geographic scope. Keep entity relationships distinct from spatial evidence, retain original records and use versioned adapters into this read model. A future hosted spatial repository can index observation geometry with PostGIS and use the same inclusion and deduplication rules. Do not mark it connected merely because this contract or the existing migrations exist. Asking rents, transacted rents, property types and units must be aggregated separately; a single number across those bases would be misleading.
