import { z } from 'zod';

const key = z.string().min(1).max(120).regex(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/);
const text = z.string().trim().min(1).max(500);
export const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10) === value;
}, 'Invalid calendar date');

export function canonicalDecimal(value: string): string {
  const [whole, fraction = ''] = value.split('.');
  const normal = `${BigInt(whole)}${fraction.replace(/0+$/, '') ? '.' + fraction.replace(/0+$/, '') : ''}`;
  return normal;
}
const money = z.string().regex(/^\d{1,18}(?:\.\d{1,4})?$/)
  .refine(v => /[1-9]/.test(v), 'Amount must be positive').transform(canonicalDecimal);
const rate = z.string().regex(/^\d{1,12}(?:\.\d{1,12})?$/)
  .refine(v => /[1-9]/.test(v), 'Rate must be positive').transform(canonicalDecimal);

export function canonicalUrl(value: string): string {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('An HTTP(S) URL without credentials is required');
  }
  url.hash = '';
  for (const name of [...url.searchParams.keys()]) {
    if (name.toLowerCase().startsWith('utm_') || ['fbclid','gclid'].includes(name.toLowerCase())) url.searchParams.delete(name);
  }
  url.searchParams.sort();
  return url.toString();
}
const url = z.string().max(2000).transform((value, ctx) => {
  try { return canonicalUrl(value); } catch {
    ctx.addIssue({code:'custom',message:'Invalid HTTP(S) URL'}); return z.NEVER;
  }
});
export function normalizeDomain(value: string): string {
  const parsed = new URL(value.includes('://') ? value : `https://${value}`);
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || !parsed.hostname.includes('.')) {
    throw new Error('Invalid website domain');
  }
  return parsed.hostname.toLowerCase().replace(/^www\./,'').replace(/\.$/,'');
}
const domain = z.string().transform((value, ctx) => {
  try { return normalizeDomain(value); } catch {
    ctx.addIssue({code:'custom',message:'Invalid website domain'}); return z.NEVER;
  }
});

const source = z.object({
  key, name:text, kind:z.enum(['publisher','creator','filing','manual','demo']),
  reuse_status:z.enum(['unverified','metadata_only','licensed','user_supplied','synthetic'])
}).strict();
const document = z.object({
  source_key:key, external_key:text, title:text, url:url.nullable(),
  published_at:z.iso.datetime({offset:true}), excerpt:z.string().max(12000).nullable()
}).strict();
const company = z.object({
  slug:key.refine(v => !v.includes('_'),'Company slugs use hyphens'),
  brand_name:text, website_domain:domain.nullable(), aliases:z.array(text).max(50).default([]),
  sectors:z.array(z.object({slug:key,name:text}).strict()).max(20), is_demo:z.boolean(),
  location:z.object({
    key, city:text, state:text, locality:text.nullable(),
    latitude:z.number().min(-90).max(90), longitude:z.number().min(-180).max(180),
    accuracy:z.enum(['address','locality','city','state','unknown']), observed_on:date
  }).strict().nullable()
}).strict();
const funding = z.object({
  event_key:key, announced_on:date, stage:text,
  transaction_type:z.enum(['equity','debt','secondary','grant']),
  status:z.enum(['announced','completed','rumored','cancelled']),
  amount_original:money.nullable(), currency:z.string().regex(/^[A-Z]{3}$/),
  fx:z.object({usd_per_unit:rate,date,source_url:url}).strict().nullable()
}).strict().superRefine((value, ctx) => {
  if (value.currency === 'USD' && value.fx && value.fx.usd_per_unit !== '1') {
    ctx.addIssue({code:'custom',message:'USD conversion rate must be 1'});
  }
});

export const batchSchema = z.object({
  schema_version:z.literal(1),
  sources:z.array(source).min(1).max(100),
  records:z.array(z.object({company,document,funding}).strict()).min(1).max(10000)
}).strict().superRefine((batch,ctx) => {
  const keys = new Set<string>();
  for (const s of batch.sources) {
    if (keys.has(s.key)) ctx.addIssue({code:'custom',message:`Duplicate source key: ${s.key}`});
    keys.add(s.key);
  }
  for (const record of batch.records) {
    const s=batch.sources.find(s=>s.key===record.document.source_key);
    if (!s) ctx.addIssue({code:'custom',message:`Unknown source: ${record.document.source_key}`});
    if (s?.reuse_status === 'unverified') ctx.addIssue({code:'custom',message:'Resolve source reuse status before import'});
    if (s?.reuse_status === 'metadata_only' && record.document.excerpt) {
      ctx.addIssue({code:'custom',message:'Metadata-only sources cannot carry excerpts'});
    }
    if ((s?.kind === 'demo' || s?.reuse_status === 'synthetic') && !record.company.is_demo) {
      ctx.addIssue({code:'custom',message:'Synthetic sources require a demo company'});
    }
  }
});
export type ImportBatch = z.infer<typeof batchSchema>;

export function parseBatch(input: unknown): ImportBatch { return batchSchema.parse(input); }

// One polygon only, closed rings, standard longitude/latitude order. PostGIS
// remains authoritative for topology (self intersections, holes, validity).
const position = z.tuple([z.number().min(-180).max(180),z.number().min(-90).max(90)]);
export const areaSchema = z.object({
  type:z.literal('Polygon'), coordinates:z.array(z.array(position).min(4).max(1000)).min(1).max(20)
}).strict().superRefine((area,ctx)=>{
  const total=area.coordinates.reduce((n,r)=>n+r.length,0);
  if(total>1000) ctx.addIssue({code:'custom',message:'Maximum 1000 vertices'});
  for(const ring of area.coordinates) {
    if(ring[0][0]!==ring.at(-1)![0] || ring[0][1]!==ring.at(-1)![1]) ctx.addIssue({code:'custom',message:'Polygon rings must close'});
  }
});
