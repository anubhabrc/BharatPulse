import {z} from 'zod';
import {date} from './import-schema';
import {sumUsd,type ArchiveCompany,type ArchiveSnapshot} from './notion-archive';

export const companyFiltersSchema=z.object({
  q:z.string().max(200).default(''),city:z.string().max(150).default(''),sector:z.string().max(300).default(''),
  stage:z.string().max(150).default(''),from:z.union([date,z.literal('')]).default(''),to:z.union([date,z.literal('')]).default(''),
  tag:z.enum(['','profile','bootstrapped','careers']).default(''),
  sort:z.enum(['recent','funding','name']).default('name'),
  limit:z.coerce.number().int().min(1).max(100).default(50),offset:z.coerce.number().int().min(0).max(100000).default(0)
}).superRefine((v,ctx)=>{if(v.from&&v.to&&v.from>v.to)ctx.addIssue({code:'custom',message:'Start date must be before end date'});});
export type CompanyFilters=z.infer<typeof companyFiltersSchema>;
export interface CompanyRow {
  slug:string;brand_name:string;city:string|null;sector:string|null;tracked_event_count:number;
  tracked_amount_usd:string|null;unpriced_event_count:number;is_demo:boolean;latest_announced_on:string|null;
  flagged_event_count:number;
  description?:string;founders?:string[];tags?:string[];careers_url?:string;
  coverage?:'reviewed_directory'|'funding_archive';
  latest_news?:{title:string;url:string;source_name:string;published_at:string};
  jobs?:{total:number;india:number;bengaluru:number;checked_at:string};
}
function compareAmounts(a:string|null,b:string|null):number {
  const fixed=(value:string|null)=>{if(!value)return -1n;const [w,f='']=value.split('.');return BigInt(w)*10000n+BigInt(f.padEnd(4,'0'));};
  return fixed(a)>fixed(b)?-1:fixed(a)<fixed(b)?1:0;
}
export function archiveOptions(snapshot:ArchiveSnapshot) {
  const unique=(values:(string|null)[])=>[...new Set(values.filter((v):v is string=>!!v))].sort((a,b)=>a.localeCompare(b));
  return {cities:unique(snapshot.companies.flatMap(c=>[c.city,...c.directory_profile?.india_presence.cities??[]])),sectors:unique(snapshot.companies.map(c=>c.sector)),stages:unique(snapshot.companies.flatMap(c=>c.rounds.map(r=>r.stage)))};
}
export function filterArchiveRows(snapshot:ArchiveSnapshot,filters:CompanyFilters,offices:{company_slug:string;city:string}[]=[]):CompanyRow[] {
  const query=filters.q.trim().toLocaleLowerCase('en');
  const rows:CompanyRow[]=[];
  for(const company of snapshot.companies) {
    const profile=company.directory_profile;
    if(query&&!company.reported_names.some(n=>n.toLocaleLowerCase('en').includes(query)))continue;
    if(filters.city&&company.city!==filters.city&&!profile?.india_presence.cities.includes(filters.city)&&!offices.some(office=>office.company_slug===company.slug&&office.city===filters.city))continue;
    if(filters.sector&&company.sector!==filters.sector)continue;
    if(filters.tag==='profile'&&!profile||filters.tag==='bootstrapped'&&!profile?.tags.some(t=>t.label==='Bootstrapped')||filters.tag==='careers'&&!profile?.careers)continue;
    const rounds=company.rounds.filter(r=>(!filters.stage||r.stage===filters.stage)&&(!filters.from||(r.announced_on!==null&&r.announced_on>=filters.from))&&(!filters.to||(r.announced_on!==null&&r.announced_on<=filters.to)));
    if(!rounds.length&&(filters.stage||filters.from||filters.to))continue;
    const city=profile&&filters.city&&profile.india_presence.cities.includes(filters.city)?filters.city:company.city;
    rows.push({slug:company.slug,brand_name:company.brand_name,city,sector:company.sector,
      tracked_event_count:rounds.length,tracked_amount_usd:sumUsd(rounds.filter(r=>r.included_in_totals).map(r=>r.amount_usd)),
      unpriced_event_count:rounds.filter(r=>!r.amount_usd||!r.included_in_totals).length,is_demo:false,
      latest_announced_on:rounds.map(r=>r.announced_on).filter((v):v is string=>!!v&&v<=snapshot.retrieved_at.slice(0,10)).sort().at(-1)??null,
      flagged_event_count:rounds.filter(r=>r.quality_flags.length>0).length,
      coverage:profile?'reviewed_directory':'funding_archive',
      ...(profile?{description:profile.description.text,founders:profile.founders.map(f=>f.name),tags:profile.tags.map(t=>t.label),...(profile.careers?{careers_url:profile.careers.url}:{})}:{}),
    });
  }
  rows.sort((a,b)=>filters.sort==='funding'?compareAmounts(a.tracked_amount_usd,b.tracked_amount_usd)||a.brand_name.localeCompare(b.brand_name):
    filters.sort==='recent'?(b.latest_announced_on??'').localeCompare(a.latest_announced_on??'')||a.brand_name.localeCompare(b.brand_name):a.brand_name.localeCompare(b.brand_name));
  return rows;
}
export function queryArchive(snapshot:ArchiveSnapshot,filters:CompanyFilters,offices:{company_slug:string;city:string}[]=[] ) {
  const rows=filterArchiveRows(snapshot,filters,offices);
  return {mode:'archive' as const,companies:rows.slice(filters.offset,filters.offset+filters.limit),total:rows.length,
    metrics:{company_count:rows.length,event_count:rows.reduce((n,c)=>n+c.tracked_event_count,0),
      tracked_amount_usd:sumUsd(rows.map(c=>c.tracked_amount_usd)),unpriced_event_count:rows.reduce((n,c)=>n+c.unpriced_event_count,0)},
    source:{name:snapshot.source_name,url:snapshot.source_url,retrieved_at:snapshot.retrieved_at,coverage:snapshot.coverage},
    amount_label:'Reported funding · USD'};
}
export function findArchiveCompany(snapshot:ArchiveSnapshot,slug:string):ArchiveCompany|undefined {
  return snapshot.companies.find(c=>c.slug===slug);
}
