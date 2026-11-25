import {createHash} from 'node:crypto';

export const BWM_ROOT_ID='56051167-de46-4258-a6c5-8c144f30fdac';
export const BWM_ROOT_URL='https://meadow-pillow-7fa.notion.site/Weekly-Funding-Updates-56051167de464258a6c58c144f30fdac';
export const notionUrl=(id:string)=>`https://meadow-pillow-7fa.notion.site/${id.replaceAll('-','')}`;
export interface ArchiveObservation {
  row_id:string; company_name:string; company_url:string|null; sector:string|null; city:string|null;
  stage:string|null; amount_million_raw:string|null; announced_on:string|null;
  article_url:string|null; week_id:string; week_title:string;
}
export interface ArchiveRound {
  id:string; stage:string|null; amount_usd:string|null; amount_million_raw:string|null;
  announced_on:string|null; transaction_type:'equity'|'debt'|'secondary'|'grant'|'unspecified';
  article_urls:string[]; notion_row_urls:string[]; week_urls:string[]; week_titles:string[];
  quality_flags:string[]; included_in_totals:boolean;
}
export interface ArchiveCompany {
  slug:string; brand_name:string; website_url:string|null; city:string|null; sector:string|null;
  reported_names:string[]; reported_cities:string[]; reported_sectors:string[];
  rounds:ArchiveRound[]; tracked_amount_usd:string|null; unpriced_event_count:number;
  latest_announced_on:string|null;
}
export interface ArchiveSnapshot {
  schema_version:1; source_name:string; source_url:string; retrieved_at:string;
  coverage:{pages_discovered:number;pages_imported:number;pages_empty:number;rows_read:number;duplicate_observations:number;
    company_count:number;event_count:number;first_date:string|null;last_date:string|null;
    missing_amount_count:number;flagged_event_count:number;excluded_rows:number};
  companies:ArchiveCompany[];
}
export function richText(value:unknown):string {
  if(!Array.isArray(value))return '';
  return value.map(part=>Array.isArray(part)&&typeof part[0]==='string'?part[0]:'').join('').trim();
}
export function safeSourceUrl(value:string|null|undefined):string|null {
  if(!value)return null;
  try {
    const url=new URL(value);
    if(!['http:','https:'].includes(url.protocol)||url.username||url.password)return null;
    url.hash='';for(const key of [...url.searchParams.keys()])if(/^utm_/i.test(key)||['fbclid','gclid'].includes(key))url.searchParams.delete(key);
    url.searchParams.sort();return url.toString();
  }catch{return null;}
}
export function richTextLink(value:unknown):string|null {
  if(!Array.isArray(value))return null;
  for(const part of value)if(Array.isArray(part)&&Array.isArray(part[1])) {
    for(const decoration of part[1])if(Array.isArray(decoration)&&decoration[0]==='a'&&typeof decoration[1]==='string') {
      const url=safeSourceUrl(decoration[1]);if(url)return url;
    }
  }
  return null;
}
export function notionDate(value:unknown):string|null {
  if(!Array.isArray(value))return null;
  for(const part of value)if(Array.isArray(part)&&Array.isArray(part[1])) {
    for(const decoration of part[1])if(Array.isArray(decoration)&&decoration[0]==='d'&&decoration[1]&&typeof decoration[1]==='object') {
      const v=decoration[1] as {start_date?:unknown};if(typeof v.start_date==='string'&&validDate(v.start_date))return v.start_date;
    }
  }
  const text=richText(value);return validDate(text)?text:null;
}
export function validDate(value:string):boolean {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const date=new Date(`${value}T00:00:00Z`);return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
}
export function millionToUsd(value:string|null):string|null {
  if(!value)return null;
  const raw=value.trim().replace(/^\$\s*/, '');
  if(raw.includes(',')&&!/^\d{1,3}(,\d{3})+(\.\d{1,10})?$/.test(raw))return null;
  const plain=raw.replaceAll(',','');
  if(!/^\d{1,12}(\.\d{1,10})?$/.test(plain))return null;
  const [whole,fraction='']=plain.split('.');
  const scaled=BigInt(whole)*10000000000n+BigInt(fraction.padEnd(10,'0'));
  if(scaled===0n)return null;
  const usd=scaled/10000n;
  const tail=(scaled%10000n).toString().padStart(4,'0').replace(/0+$/,'');
  return `${usd}${tail?'.'+tail:''}`;
}
export function sumUsd(values:(string|null)[]):string|null {
  const known=values.filter((v):v is string=>v!==null);if(!known.length)return null;
  const total=known.reduce((sum,value)=>{const [whole,fraction='']=value.split('.');return sum+BigInt(whole)*10000n+BigInt(fraction.padEnd(4,'0'));},0n);
  const fraction=(total%10000n).toString().padStart(4,'0').replace(/0+$/,'');
  return `${total/10000n}${fraction?'.'+fraction:''}`;
}
const identity=(name:string)=>name.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('en');
const digest=(value:string)=>createHash('sha256').update(value).digest('hex').slice(0,12);
function cityName(value:string|null):string|null {
  if(!value?.trim()||/^(n\/?a|unknown|undisclosed|-+)$/i.test(value.trim()))return null;
  const city=value.trim().replace(/\s+/g,' ');
  const aliases:Record<string,string>={bangalore:'Bengaluru',bengaluru:'Bengaluru',gurgaon:'Gurugram',gurugram:'Gurugram','delhi ncr':'Delhi-NCR','delhi-ncr':'Delhi-NCR','new delhi':'Delhi',mumbai:'Mumbai',pune:'Pune',hyderabad:'Hyderabad',chennai:'Chennai'};
  return aliases[city.toLowerCase()]??city;
}
function transactionType(stage:string|null):ArchiveRound['transaction_type'] {
  if(/debt/i.test(stage??'')&&/equity|series|seed|mixed/i.test(stage??''))return 'unspecified';
  if(/debt/i.test(stage??''))return 'debt';
  if(/secondary/i.test(stage??''))return 'secondary';
  if(/grant/i.test(stage??''))return 'grant';
  if(/^(pre[ -]seed|seed|pre[ -]series|series [a-z](\b|$)|angel)/i.test(stage??''))return 'equity';
  return 'unspecified';
}
export function buildArchiveSnapshot(observations:ArchiveObservation[],metadata:{retrieved_at:string;pages_discovered:number;pages_imported:number;pages_empty?:number}):ArchiveSnapshot {
  const groups=new Map<string,ArchiveObservation[]>();let excludedRows=0;
  for(const row of observations) {
    if(!row.company_name.trim()){excludedRows++;continue;}
    const key=identity(row.company_name);groups.set(key,[...(groups.get(key)??[]),row]);
  }
  let duplicateObservations=0;
  const companies:ArchiveCompany[]=[];
  const usedSlugs=new Set<string>();
  for(const [companyKey,rows] of [...groups].sort(([a],[b])=>a.localeCompare(b))) {
    const observedDate=(r:ArchiveObservation)=>r.announced_on&&r.announced_on<=metadata.retrieved_at.slice(0,10)?r.announced_on:'';
    const ordered=[...rows].sort((a,b)=>observedDate(b).localeCompare(observedDate(a))||a.row_id.localeCompare(b.row_id));
    const first=ordered[0];
    let slug=companyKey.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90)||'company';
    if(usedSlugs.has(slug))slug+=`-${digest(companyKey)}`;usedSlugs.add(slug);
    const rounds=new Map<string,ArchiveRound>();
    const sourcesToRounds=new Map<string,Set<string>>();
    for(const row of ordered) {
      const amount=millionToUsd(row.amount_million_raw),article=safeSourceUrl(row.article_url);
      const stage=row.stage?.trim()||null,date=row.announced_on&&validDate(row.announced_on)?row.announced_on:null;
      // Identical company/date/stage/amount observations become one reported
      // event with multiple citations. Missing terms are matched only by row ID.
      const complete=!!(date&&stage&&amount);
      const terms=JSON.stringify([date,stage?.toLowerCase(),amount,transactionType(stage)]);
      const key=complete?terms:`row:${row.row_id}`;
      if(article){const keys=sourcesToRounds.get(article)??new Set<string>();keys.add(key);sourcesToRounds.set(article,keys);}
      const existing=rounds.get(key);
      if(existing) {
        duplicateObservations++;
        if(article&&!existing.article_urls.includes(article))existing.article_urls.push(article);
        if(!existing.notion_row_urls.includes(notionUrl(row.row_id)))existing.notion_row_urls.push(notionUrl(row.row_id));
        if(!existing.week_urls.includes(notionUrl(row.week_id))){existing.week_urls.push(notionUrl(row.week_id));existing.week_titles.push(row.week_title);}
        continue;
      }
      const flags:string[]=[];
      if(!date)flags.push('Date not provided');
      if(!amount)flags.push(row.amount_million_raw&&/[1-9]/.test(row.amount_million_raw)?'Amount needs review':'Amount undisclosed');
      if(date&&date>metadata.retrieved_at.slice(0,10))flags.push('Future source date');
      rounds.set(key,{id:`bwm-${digest(companyKey+'|'+key)}`,stage,amount_usd:amount,amount_million_raw:row.amount_million_raw,
        announced_on:date,transaction_type:transactionType(stage),article_urls:article?[article]:[],
        notion_row_urls:[notionUrl(row.row_id)],week_urls:[notionUrl(row.week_id)],week_titles:[row.week_title],
        quality_flags:flags,included_in_totals:!flags.includes('Future source date')});
    }
    for(const [source,keys] of sourcesToRounds)if(keys.size>1)for(const key of keys) {
      const round=rounds.get(key)!;
      round.included_in_totals=false;
      if(!round.quality_flags.includes('Conflicting entries for one article'))round.quality_flags.push('Conflicting entries for one article');
    }
    const events=[...rounds.values()].sort((a,b)=>(b.announced_on??'').localeCompare(a.announced_on??'')||a.id.localeCompare(b.id));
    companies.push({slug,brand_name:first.company_name.trim(),website_url:ordered.map(r=>safeSourceUrl(r.company_url)).find(Boolean)??null,
      city:ordered.map(r=>cityName(r.city)).find(Boolean)??null,sector:ordered.map(r=>r.sector?.trim()).find(Boolean)??null,
      reported_names:[...new Set(ordered.map(r=>r.company_name.trim()))],
      reported_cities:[...new Set(ordered.map(r=>cityName(r.city)).filter((v):v is string=>!!v))],
      reported_sectors:[...new Set(ordered.map(r=>r.sector?.trim()).filter((v):v is string=>!!v))],
      rounds:events,tracked_amount_usd:sumUsd(events.filter(r=>r.included_in_totals).map(r=>r.amount_usd)),
      unpriced_event_count:events.filter(r=>!r.amount_usd||!r.included_in_totals).length,
      latest_announced_on:events.map(r=>r.announced_on).filter((v):v is string=>!!v&&v<=metadata.retrieved_at.slice(0,10)).sort().at(-1)??null});
  }
  const events=companies.flatMap(c=>c.rounds),dates=events.map(r=>r.announced_on).filter((v):v is string=>!!v&&v<=metadata.retrieved_at.slice(0,10)).sort();
  return {schema_version:1,source_name:'Backstage with Millionaires · Weekly Funding Updates',source_url:BWM_ROOT_URL,
    retrieved_at:metadata.retrieved_at,coverage:{pages_discovered:metadata.pages_discovered,pages_imported:metadata.pages_imported,pages_empty:metadata.pages_empty??0,
      rows_read:observations.length,duplicate_observations:duplicateObservations,company_count:companies.length,event_count:events.length,
      first_date:dates[0]??null,last_date:dates.at(-1)??null,missing_amount_count:events.filter(r=>!r.amount_usd).length,
      flagged_event_count:events.filter(r=>r.quality_flags.length>0).length,excluded_rows:excludedRows},companies};
}
