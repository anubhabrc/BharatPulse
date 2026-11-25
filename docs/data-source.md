# BWM Notion funding archive

The initial real dataset comes directly from [Backstage with Millionaires’ Weekly Funding Updates](https://meadow-pillow-7fa.notion.site/Weekly-Funding-Updates-56051167de464258a6c58c144f30fdac). The reference startup dashboard is not the import source. No full news articles, creator transcripts, Notion editor metadata or authentication material is bundled.

## Coverage

The initial import checks 148 weekly pages. Of these, 135 have funding tables and 13 contain only empty text blocks. The 2,358 observed rows yield 1,905 company records and 2,337 reported funding events after excluding 19 blank company rows and merging two identical observations. The source dates span 2 January 2024 through 20 November 2026. The generated import report records coverage and empty page identifiers. Snapshot retrieval time is recorded in the dataset.

## Source fields

- Company title and its hyperlink become the reported brand name and website.
- HQ and Sector remain source-reported labels. A small exact alias dictionary standardizes city spelling, such as Bangalore to Bengaluru and Gurgaon to Gurugram. No street coordinates or operational footprints are inferred.
- Series remains the source’s stage label. Missing stages are not guessed.
- Amount ($M) is converted to full USD using decimal/BigInt arithmetic. Missing, zero or invalid amounts remain unknown. No present-day FX conversion is applied to a USD-denominated source value.
- Date comes from the row’s actual Notion date property. Weekly labels and page creation dates are not substituted for announcement dates.
- Source retains the article URL supplied by BWM. Notion row and weekly page links remain attached to each event.

## Company identity and duplicate handling

Names are grouped by Unicode-normalized, case-insensitive exact text with whitespace normalization. Fuzzy names, shared website domains and parent/subsidiary relationships do not automatically merge records. Source spelling variants that differ beyond case/whitespace can remain separate pending review.

Identical company/date/stage/amount observations are represented as one reported event with all citations. This is an explicit archive matching rule, not proof that legally distinct tranches are one transaction. Missing terms are matched only by source row identity. Entries citing the same article with conflicting event terms remain visible and are excluded from totals pending review. This initial snapshot has four such conflicting entries across two companies.

Totals include only usable, non-conflicting, non-future amounts. Eighty events have no usable disclosed amount. The financial totals describe this captured archive and can include equity, debt, secondary transactions and unspecified rounds. They do not assert verified lifetime funding, audited financial performance, valuation or ownership percentages.

## Serving and refreshing

Archive mode serves the committed JSON snapshot on both localhost and Vercel. Request-time browsing does not contact Notion. Date and stage filters select events and recalculate company and cohort totals before pagination. Company city and sector filters use the most recent dated source observation available as of the import.

The refresh script uses the public, unauthenticated Notion web content endpoints and no cookies or integration token. These endpoints are unofficial and can change. It follows cursor pagination, limits request concurrency, retries transient errors, records empty pages and refuses to replace a snapshot after failed or restricted requests. Cache files remain outside Git. Refresh is explicit; no daily automation has been enabled.

Before adding commercial exports, redistribution arrangements or paid vendor datasets, record the applicable source terms. The software does not infer a license from public visibility or acquire permissions automatically.
