-- PostgreSQL 16+. Private server-side schema, not a Supabase Data API schema.
CREATE SCHEMA bp;
REVOKE ALL ON SCHEMA bp FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA bp REVOKE ALL ON TABLES FROM PUBLIC;

CREATE TABLE bp.sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key text NOT NULL UNIQUE,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('publisher','creator','filing','manual','demo')),
  reuse_status text NOT NULL DEFAULT 'unverified'
    CHECK (reuse_status IN ('unverified','metadata_only','licensed','user_supplied','synthetic')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bp.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES bp.sources(id),
  external_key text NOT NULL,
  canonical_url text,
  title text NOT NULL,
  published_at timestamptz NOT NULL,
  retrieved_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_id, external_key)
);
CREATE TABLE bp.document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES bp.documents(id),
  content_sha256 text NOT NULL CHECK (content_sha256 ~ '^[a-f0-9]{64}$'),
  -- Only material the source policy permits. No automatic full-text copying.
  evidence_excerpt text,
  metadata_snapshot jsonb NOT NULL CHECK (jsonb_typeof(metadata_snapshot) = 'object'),
  observed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, content_sha256)
);

CREATE TABLE bp.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  brand_name text NOT NULL CHECK (length(trim(brand_name)) > 0),
  website_domain text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','acquired','listed','closed','unknown')),
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Domains are lookup signals, not unique identities: groups may share domains.
CREATE INDEX companies_domain_idx ON bp.companies (website_domain);
CREATE TABLE bp.company_aliases (
  company_id uuid NOT NULL REFERENCES bp.companies(id),
  alias text NOT NULL,
  PRIMARY KEY (company_id, alias)
);
CREATE TABLE bp.legal_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name text NOT NULL,
  jurisdiction text NOT NULL,
  identifier_type text NOT NULL CHECK (identifier_type IN ('CIN','LLPIN','foreign','other')),
  identifier text NOT NULL,
  UNIQUE (jurisdiction, identifier_type, identifier)
);
CREATE TABLE bp.company_legal_entities (
  company_id uuid NOT NULL REFERENCES bp.companies(id),
  legal_entity_id uuid NOT NULL REFERENCES bp.legal_entities(id),
  relationship text NOT NULL CHECK (relationship IN ('parent','operating','subsidiary','historical')),
  valid_from date NOT NULL,
  valid_to date CHECK (valid_to IS NULL OR valid_to >= valid_from),
  document_version_id uuid NOT NULL REFERENCES bp.document_versions(id),
  PRIMARY KEY (company_id, legal_entity_id, valid_from)
);
CREATE TABLE bp.sectors (
  slug text PRIMARY KEY,
  name text NOT NULL
);
CREATE TABLE bp.company_sectors (
  company_id uuid NOT NULL REFERENCES bp.companies(id),
  sector_slug text NOT NULL REFERENCES bp.sectors(slug),
  PRIMARY KEY (company_id, sector_slug)
);
CREATE TABLE bp.company_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES bp.companies(id),
  location_key text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('hq','registered_office','office','operational')),
  city text NOT NULL,
  state text NOT NULL,
  locality text,
  latitude numeric CHECK (latitude BETWEEN -90 AND 90),
  longitude numeric CHECK (longitude BETWEEN -180 AND 180),
  accuracy text NOT NULL CHECK (accuracy IN ('address','locality','city','state','unknown')),
  observed_on date NOT NULL,
  document_version_id uuid NOT NULL REFERENCES bp.document_versions(id),
  CHECK ((latitude IS NULL) = (longitude IS NULL)),
  UNIQUE (company_id, location_key)
);

CREATE TABLE bp.funding_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES bp.companies(id),
  -- Explicit canonical identity assigned during review; never a fuzzy hash of amount/date.
  event_key text NOT NULL,
  announced_on date NOT NULL,
  stage text NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('equity','debt','secondary','grant')),
  status text NOT NULL CHECK (status IN ('announced','completed','rumored','cancelled')),
  amount_original numeric(22,4) CHECK (amount_original > 0),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  fx_usd_per_unit numeric(24,12) CHECK (fx_usd_per_unit > 0),
  fx_date date,
  fx_source_url text,
  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','approved','rejected')),
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((fx_usd_per_unit IS NULL AND fx_date IS NULL AND fx_source_url IS NULL)
      OR (fx_usd_per_unit IS NOT NULL AND fx_date IS NOT NULL AND fx_source_url IS NOT NULL)),
  CHECK (review_status <> 'approved' OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)),
  UNIQUE (company_id, event_key)
);
CREATE INDEX funding_company_date_idx ON bp.funding_events (company_id, announced_on DESC);
CREATE TABLE bp.funding_evidence (
  event_id uuid NOT NULL REFERENCES bp.funding_events(id),
  document_version_id uuid NOT NULL REFERENCES bp.document_versions(id),
  PRIMARY KEY (event_id, document_version_id)
);
CREATE TABLE bp.investors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL
);
CREATE TABLE bp.event_investors (
  event_id uuid NOT NULL REFERENCES bp.funding_events(id),
  investor_id uuid NOT NULL REFERENCES bp.investors(id),
  is_lead boolean, -- Unknown is different from not leading.
  PRIMARY KEY (event_id, investor_id)
);

CREATE TABLE bp.financial_statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_entity_id uuid NOT NULL REFERENCES bp.legal_entities(id),
  period_start date NOT NULL,
  period_end date NOT NULL CHECK (period_end >= period_start),
  basis text NOT NULL CHECK (basis IN ('standalone','consolidated')),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  -- Full currency units; do not mix rupees, lakhs and crores in storage.
  operating_revenue numeric(22,4),
  net_profit_loss numeric(22,4),
  operating_cash_flow numeric(22,4),
  document_version_id uuid NOT NULL REFERENCES bp.document_versions(id),
  evidence_type text NOT NULL CHECK (evidence_type IN ('filing','secondary_report')),
  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','approved','rejected')),
  UNIQUE (legal_entity_id, period_end, basis, document_version_id)
);
CREATE TABLE bp.media_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_version_id uuid NOT NULL REFERENCES bp.document_versions(id),
  segment_key text NOT NULL,
  start_sec integer CHECK (start_sec >= 0),
  end_sec integer CHECK (end_sec > start_sec),
  headline text NOT NULL,
  summary text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  claim_type text NOT NULL CHECK (claim_type IN ('reported_fact','creator_analysis','model_inference')),
  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','approved','rejected')),
  CHECK (end_sec IS NULL OR start_sec IS NOT NULL),
  UNIQUE (document_version_id, segment_key)
);
CREATE TABLE bp.segment_companies (
  segment_id uuid NOT NULL REFERENCES bp.media_segments(id),
  company_id uuid NOT NULL REFERENCES bp.companies(id),
  PRIMARY KEY (segment_id, company_id)
);
CREATE TABLE bp.segment_sectors (
  segment_id uuid NOT NULL REFERENCES bp.media_segments(id),
  sector_slug text NOT NULL REFERENCES bp.sectors(slug),
  PRIMARY KEY (segment_id, sector_slug)
);
CREATE TABLE bp.ingestion_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_sha256 text NOT NULL CHECK (batch_sha256 ~ '^[a-f0-9]{64}$'),
  reviewed_by text NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  record_count integer NOT NULL CHECK (record_count >= 0)
);
CREATE TABLE bp.staging_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_version_id uuid NOT NULL REFERENCES bp.document_versions(id),
  extractor_version text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','needs_review')),
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- No mutable funding totals: aggregation reads approved canonical events once.
CREATE VIEW bp.company_funding_totals WITH (security_invoker = true) AS
SELECT c.id AS company_id,
  count(f.id)::int AS tracked_event_count,
  count(f.id) FILTER (WHERE f.amount_original IS NULL OR (f.currency <> 'USD' AND f.fx_usd_per_unit IS NULL))::int AS unpriced_event_count,
  sum(CASE WHEN f.transaction_type = 'equity' THEN
    CASE WHEN f.currency = 'USD' THEN f.amount_original ELSE f.amount_original * f.fx_usd_per_unit END END) AS equity_usd,
  sum(CASE WHEN f.transaction_type = 'debt' THEN
    CASE WHEN f.currency = 'USD' THEN f.amount_original ELSE f.amount_original * f.fx_usd_per_unit END END) AS debt_usd,
  sum(CASE WHEN f.transaction_type = 'secondary' THEN
    CASE WHEN f.currency = 'USD' THEN f.amount_original ELSE f.amount_original * f.fx_usd_per_unit END END) AS secondary_usd
FROM bp.companies c LEFT JOIN bp.funding_events f ON f.company_id = c.id
  AND f.review_status = 'approved' AND f.status IN ('announced','completed')
GROUP BY c.id;

CREATE FUNCTION bp.touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER companies_updated_at BEFORE UPDATE ON bp.companies
FOR EACH ROW EXECUTE FUNCTION bp.touch_updated_at();

-- Deny by default to non-owner roles; production grants/policies are explicit.
DO $$ DECLARE t record; BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'bp' LOOP
    EXECUTE format('ALTER TABLE bp.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    EXECUTE format('REVOKE ALL ON bp.%I FROM PUBLIC', t.tablename);
  END LOOP;
END $$;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA bp FROM PUBLIC;
