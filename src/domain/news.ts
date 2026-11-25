import {createHash} from 'node:crypto';
import {XMLParser,XMLValidator} from 'fast-xml-parser';
import {safeSourceUrl,type ArchiveCompany} from './notion-archive';
export interface FeedSource {id:string;name:string;url:string;allowed_hosts:string[];enabled:boolean;usage:string}
export interface NewsItem {id:string;title:string;url:string;published_at:string;source_id:string;source_name:string;company_slugs:string[];tags:string[]}
export interface FeedHealth {source_id:string;source_name:string;url:string;status:'ok'|'error';checked_at:string;last_success_at:string|null;latest_entry_at:string|null;item_count:number;error:string|null}
export interface NewsSnapshot {schema_version:1;updated_at:string;retention_days:number;items:NewsItem[];feeds:FeedHealth[]}
const array=(value:unknown):unknown[]=>Array.isArray(value)?value:value===undefined?[]:[value];
const record=(value:unknown):Record<string,unknown>=>value!==null&&typeof value==='object'?value as Record<string,unknown>:{};
const text=(value:unknown):string=>typeof value==='string'?value:typeof value==='number'?String(value):String(record(value)['#text']??'');
export function cleanHeadline(value:unknown):string {
  return text(value).replace(/<[^>]*>/g,' ').replace(/&(?:amp|#38);/gi,'&').replace(/&(?:quot|#34);/gi,'"').replace(/&(?:apos|#39);/gi,"'").replace(/&(?:lt|#60);/gi,'<').replace(/&(?:gt|#62);/gi,'>').replace(/&nbsp;/gi,' ').replace(/\s+/g,' ').trim().slice(0,500);
}
export function parseFeed(xml:string,source:FeedSource,now=new Date()):NewsItem[] {
  if(Buffer.byteLength(xml)>2_000_000||/<!DOCTYPE|<!ENTITY/i.test(xml))throw new Error('Unsupported or oversized XML feed');
  if(XMLValidator.validate(xml)!==true)throw new Error('Invalid XML feed');
  const parsed=record(new XMLParser({ignoreAttributes:false,processEntities:false,trimValues:true}).parse(xml));
  const channel=record(record(parsed.rss).channel),atom=record(parsed.feed);
  if(!parsed.rss&&!parsed.feed)throw new Error('Response is not RSS or Atom');
  const rows=parsed.rss?array(channel.item):array(atom.entry);
  const items:NewsItem[]=[];
  for(const raw of rows) {
    const row=record(raw),title=cleanHeadline(row.title);
    const atomLinks=array(row.link).map(record);
    const link=text(row.link)||(atomLinks.find(l=>l['@_rel']==='alternate')??atomLinks[0])?.['@_href'];
    const url=safeSourceUrl(typeof link==='string'?link:null);
    const date=text(row.pubDate??row.published??row.updated??row['dc:date']);
    const published=new Date(date);
    if(!title||!url||!source.allowed_hosts.includes(new URL(url).hostname)||!Number.isFinite(published.getTime())||published.getTime()>now.getTime()+86400000)continue;
    const tags:string[]=[];
    if(/\brais(?:e[sd]?|ing)\b|\bfunding\b|\bseries\s+[a-h]\b|\bseed\s+round\b/i.test(title))tags.push('funding');
    if(/\bacquir|\bacquisition|\bmerger\b/i.test(title))tags.push('acquisition');
    if(/\bIPO\b|\bDRHP\b|\blisting\b/i.test(title))tags.push('ipo');
    if(/\brevenue\b|\bprofit\b|\bloss\b|\bburn\b/i.test(title))tags.push('financials');
    if(/\blayoffs?\b|\blays? off\b/i.test(title))tags.push('workforce');
    items.push({id:createHash('sha256').update(url).digest('hex').slice(0,24),title,url,published_at:published.toISOString(),source_id:source.id,source_name:source.name,company_slugs:[],tags});
  }
  return items;
}
const ambiguous=new Set(['simple','slice','open','one','leap','bounce','porter','first','view','source','jar','ring','mint','stable','better','power','money','rapid','kind']);
export function matchNewsCompanies(title:string,companies:Pick<ArchiveCompany,'slug'|'brand_name'|'reported_names'>[]):string[] {
  const matches:string[]=[];
  for(const company of companies) {
    const found=company.reported_names.some(name=>{
      const trimmed=name.trim();if(trimmed.length<4||ambiguous.has(trimmed.toLowerCase()))return false;
      const escaped=trimmed.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`,'iu').test(title);
    });
    if(found)matches.push(company.slug);
  }
  return matches;
}
export function mergeNews(previous:NewsItem[],incoming:NewsItem[],now:Date,retentionDays=90):NewsItem[] {
  const cutoff=now.getTime()-retentionDays*86400000;
  const byUrl=new Map<string,NewsItem>();
  for(const item of [...previous,...incoming]) {
    const url=safeSourceUrl(item.url);
    if(url&&new Date(item.published_at).getTime()>=cutoff)byUrl.set(url,{...item,url});
  }
  return [...byUrl.values()].sort((a,b)=>b.published_at.localeCompare(a.published_at)||a.url.localeCompare(b.url)).slice(0,2500);
}
