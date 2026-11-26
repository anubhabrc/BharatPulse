# Directory expansion — bounded work ledger

Updated 26 November 2026. Resume here and in `docs/map-overhaul-status.md`; do not infer completion from researched source availability.

## Batch D01 — source strategy

- [x] User confirmed startups, scale-ups and established product companies; traditional conglomerates excluded initially.
- [x] Check curated company sources, accessible official award/growth lists and public job API documentation.
- [x] Save source access/limits in `data/directory-sources.json` and admission, data, card, filter and freshness rules in `docs/directory-strategy.md`.
- [x] Audit current archive query: it excludes companies with no matching funding rounds. Save migration requirements and a proposed ten-company review list.
- [ ] Review/admit those ten companies with identity, India footprint and establishment evidence.
- [ ] Implement catalog independent of funding, then integrate list/profile/map and verify cohort/totals consistency.
- [ ] Ship new cards/tags and the two-employer jobs pilot. No directory/job refresh schedule is live.

## Handoff

Next directory batch is **D02: ten-company admission review**, before implementing the catalog migration. Read the strategy's admission rules; do not bulk-import an entire investor portfolio or equate missing funding data with bootstrapped status. Preserve the BWM archive and existing office evidence. Log each batch's reviewed/accepted/pending counts, changed files and actual checks before moving on.

B01 completed the next three office checks: Stellapps accepted, HomeLane and Zolve retained pending. Current inventory is 55 accepted / 36 needing review / 541 awaiting research. All 47 tests, TypeScript, build and browser inspection passed. Implementation `51e500f` was pushed to main and Vercel reported a successful deployment. The next three pending companies and evidence recovery notes remain in `docs/map-overhaul-status.md` and `data/office-review.json`.
