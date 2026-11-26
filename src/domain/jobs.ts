import {z} from 'zod';

export interface JobSource {id:string;company_slug:string;provider:'greenhouse'|'smartrecruiters';board:string;careers_url:string;identity_source_url:string;listing_url:string;checked_on:string}
export interface JobPosting {id:string;company_slug:string;source_id:string;title:string;location:string;cities:string[];country:string|null;workplace:'remote'|'hybrid'|'onsite'|'unknown';url:string;published_at:string|null;updated_at:string|null}
export interface JobHealth extends JobSource {status:'ok'|'error';checked_at:string;last_success_at:string|null;job_count:number;error:string|null}
export interface JobsSnapshot {version:1;updated_at:string;stale_after_hours:number;sources:JobHealth[];items:JobPosting[]}
const https=z.url().refine(v=>{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password;});
const date=(v:string|undefined)=>v&&Number.isFinite(Date.parse(v))?new Date(v).toISOString():null;
const cityAliases:Record<string,string[]>={Bengaluru:['Bengaluru','Bangalore'],Mumbai:['Mumbai','Bombay'],Chennai:['Chennai'],Hyderabad:['Hyderabad'],Pune:['Pune'],Delhi:['Delhi'],Noida:['Noida'],Gurugram:['Gurugram','Gurgaon']};
function geography(location:string,country:string|null){
  const cities=Object.entries(cityAliases).filter(([,aliases])=>aliases.some(name=>new RegExp(`\\b${name}\\b`,'i').test(location))).map(([city])=>city);
  return {cities,country:country?.toUpperCase()??(cities.length||/\bIndia\b/i.test(location)?'IN':null)};
}
export function parseGreenhouse(input:unknown,source:JobSource):JobPosting[]{
  const rows=z.object({jobs:z.array(z.object({id:z.number().int(),title:z.string().min(1).max(500),location:z.object({name:z.string()}),absolute_url:https,updated_at:z.string().optional(),first_published:z.string().optional()})).max(3000)}).parse(input).jobs;
  return rows.map(row=>{
    const u=new URL(row.absolute_url);
    if(!['job-boards.greenhouse.io','boards.greenhouse.io'].includes(u.hostname)||!u.pathname.startsWith(`/${source.board}/jobs/`))throw new Error('Unexpected employer job URL');
    return {id:String(row.id),company_slug:source.company_slug,source_id:source.id,title:row.title.trim(),location:row.location.name,...geography(row.location.name,null),workplace:'unknown' as const,url:row.absolute_url,published_at:date(row.first_published),updated_at:date(row.updated_at)};
  });
}
export function parseSmartRecruiters(input:unknown,source:JobSource):{total:number;offset:number;items:JobPosting[]}{
  const page=z.object({totalFound:z.number().int().min(0).max(3000),offset:z.number().int().min(0),content:z.array(z.object({id:z.string().regex(/^\d+$/),name:z.string().min(1).max(500),company:z.object({identifier:z.string()}),visibility:z.string(),location:z.object({city:z.string().optional(),country:z.string().optional(),fullLocation:z.string().optional(),remote:z.boolean().optional(),hybrid:z.boolean().optional()}),releasedDate:z.string().optional()})).max(100)}).parse(input);
  const items=page.content.filter(row=>row.visibility==='PUBLIC').map(row=>{
    if(row.company.identifier!==source.board)throw new Error('Unexpected employer identity');
    const location=row.location.fullLocation??row.location.city??'Location not provided';
    return {id:row.id,company_slug:source.company_slug,source_id:source.id,title:row.name.trim(),location,...geography(location,row.location.country??null),workplace:row.location.remote?'remote' as const:row.location.hybrid?'hybrid' as const:'onsite' as const,url:`https://jobs.smartrecruiters.com/${source.board}/${row.id}`,published_at:date(row.releasedDate),updated_at:null};
  });
  return {total:page.totalFound,offset:page.offset,items};
}
export function jobSummary(snapshot:JobsSnapshot,slug:string,now=new Date()){
  const source=snapshot.sources.find(s=>s.company_slug===slug);
  if(!source)return null;
  const age=source.last_success_at?now.getTime()-Date.parse(source.last_success_at):Infinity;
  const stale=!Number.isFinite(age)||age<0||age>snapshot.stale_after_hours*3600000;
  const items=stale?[]:snapshot.items.filter(item=>item.company_slug===slug);
  return {source,stale,items,total:stale?null:items.length,india:stale?null:items.filter(j=>j.country==='IN').length,bengaluru:stale?null:items.filter(j=>j.country==='IN'&&j.cities.includes('Bengaluru')).length};
}
