import { createHash } from 'node:crypto';
import { canonicalDecimal, type ImportBatch } from './import-schema';

export type Row = Record<string, unknown>;
export interface Queryable { query(sql:string, params?:unknown[]):Promise<Row[]> }
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const comparable=(value:unknown)=>value instanceof Date ? value.toISOString().slice(0,10) : value;
function same(existing:Row, proposed:Row, identity:string) {
  for (const [key,value] of Object.entries(proposed)) {
    const current=comparable(existing[key]);
    if (String(current ?? '') !== String(value ?? '')) throw new Error(`Review required: ${identity} has conflicting ${key}`);
  }
}
function numeric(value:unknown) { return value==null ? null : canonicalDecimal(String(value)); }

/** Caller MUST supply a transaction. The CLI and integration tests do so. */
export async function importReviewedBatch(db:Queryable,batch:ImportBatch,reviewer:string) {
  if(!reviewer.trim()) throw new Error('A reviewer identity is required');
  // Serialize imports so concurrent sources cannot race around conflict checks.
  await db.query('SELECT pg_advisory_xact_lock(104241, 1)');
  const sourceIds = new Map<string,string>();
  for(const source of batch.sources) {
    const existing=await db.query('SELECT * FROM bp.sources WHERE source_key=$1',[source.key]);
    if(existing.length) same(existing[0],{name:source.name,kind:source.kind,reuse_status:source.reuse_status},`source ${source.key}`);
    const rows=existing.length ? existing : await db.query(
      'INSERT INTO bp.sources(source_key,name,kind,reuse_status) VALUES($1,$2,$3,$4) RETURNING id',
      [source.key,source.name,source.kind,source.reuse_status]);
    sourceIds.set(source.key,String(rows[0].id));
  }
  let createdEvents=0, linkedEvidence=0;
  for(const record of batch.records) {
    const {company,document,funding}=record;
    let docs=await db.query('SELECT * FROM bp.documents WHERE source_id=$1 AND external_key=$2',[sourceIds.get(document.source_key),document.external_key]);
    if(docs.length) {
      same(docs[0],{canonical_url:document.url},`document ${document.external_key}`);
      if(new Date(String(docs[0].published_at)).getTime()!==new Date(document.published_at).getTime()) throw new Error(`Review required: document ${document.external_key} has conflicting publication time`);
    } else docs=await db.query('INSERT INTO bp.documents(source_id,external_key,canonical_url,title,published_at) VALUES($1,$2,$3,$4,$5) RETURNING id',
      [sourceIds.get(document.source_key),document.external_key,document.url,document.title,document.published_at]);
    const versions=await db.query(`INSERT INTO bp.document_versions(document_id,content_sha256,evidence_excerpt,metadata_snapshot) VALUES($1,$2,$3,$4::jsonb)
      ON CONFLICT(document_id,content_sha256) DO UPDATE SET content_sha256=EXCLUDED.content_sha256 RETURNING id`,
      [docs[0].id,hash(document),document.excerpt,JSON.stringify({title:document.title,url:document.url,published_at:document.published_at})]);
    const versionId=versions[0].id;
    let companies=await db.query('SELECT * FROM bp.companies WHERE slug=$1',[company.slug]);
    if(companies.length) same(companies[0],{brand_name:company.brand_name,website_domain:company.website_domain,is_demo:company.is_demo},`company ${company.slug}`);
    else companies=await db.query('INSERT INTO bp.companies(slug,brand_name,website_domain,is_demo) VALUES($1,$2,$3,$4) RETURNING id',
      [company.slug,company.brand_name,company.website_domain,company.is_demo]);
    const companyId=companies[0].id;
    for(const alias of company.aliases) await db.query('INSERT INTO bp.company_aliases(company_id,alias) VALUES($1,$2) ON CONFLICT DO NOTHING',[companyId,alias]);
    for(const sector of company.sectors) {
      const existing=await db.query('SELECT name FROM bp.sectors WHERE slug=$1',[sector.slug]);
      if(existing.length) same(existing[0],{name:sector.name},`sector ${sector.slug}`);
      else await db.query('INSERT INTO bp.sectors(slug,name) VALUES($1,$2)',[sector.slug,sector.name]);
      await db.query('INSERT INTO bp.company_sectors VALUES($1,$2) ON CONFLICT DO NOTHING',[companyId,sector.slug]);
    }
    if(company.location) {
      const l=company.location;
      const existing=await db.query('SELECT * FROM bp.company_locations WHERE company_id=$1 AND location_key=$2',[companyId,l.key]);
      if(existing.length) same({...existing[0],latitude:Number(existing[0].latitude),longitude:Number(existing[0].longitude)},
        {city:l.city,state:l.state,locality:l.locality,latitude:l.latitude,longitude:l.longitude,accuracy:l.accuracy,observed_on:l.observed_on},`location ${l.key}`);
      else await db.query(`INSERT INTO bp.company_locations(company_id,location_key,kind,city,state,locality,latitude,longitude,accuracy,observed_on,document_version_id)
        VALUES($1,$2,'hq',$3,$4,$5,$6,$7,$8,$9,$10)`,[companyId,l.key,l.city,l.state,l.locality,l.latitude,l.longitude,l.accuracy,l.observed_on,versionId]);
    }
    const proposed={announced_on:funding.announced_on,stage:funding.stage,transaction_type:funding.transaction_type,status:funding.status,
      amount_original:funding.amount_original,currency:funding.currency,fx_usd_per_unit:funding.fx?.usd_per_unit??null,
      fx_date:funding.fx?.date??null,fx_source_url:funding.fx?.source_url??null};
    let events=await db.query('SELECT * FROM bp.funding_events WHERE company_id=$1 AND event_key=$2',[companyId,funding.event_key]);
    if(events.length) {
      same({...events[0],amount_original:numeric(events[0].amount_original),fx_usd_per_unit:numeric(events[0].fx_usd_per_unit)},proposed,`event ${funding.event_key}`);
      if(events[0].review_status!=='approved') throw new Error(`Review required: existing event ${funding.event_key} is not approved`);
    } else {
      events=await db.query(`INSERT INTO bp.funding_events(company_id,event_key,announced_on,stage,transaction_type,status,amount_original,currency,
        fx_usd_per_unit,fx_date,fx_source_url,review_status,reviewed_by,reviewed_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'approved',$12,now()) RETURNING id`,
        [companyId,funding.event_key,...Object.values(proposed),reviewer]);
      createdEvents++;
    }
    const linked=await db.query('INSERT INTO bp.funding_evidence VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING event_id',[events[0].id,versionId]);
    linkedEvidence+=linked.length;
  }
  await db.query('INSERT INTO bp.ingestion_runs(batch_sha256,reviewed_by,record_count) VALUES($1,$2,$3)',[hash(batch),reviewer,batch.records.length]);
  return {records:batch.records.length,createdEvents,linkedEvidence};
}
