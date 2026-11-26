import type {ArchiveCompany,ArchiveSnapshot} from './notion-archive';
import type {DirectoryEntry} from './directory-profile';

/** Read model only: source snapshots and their original funding coverage are never mutated. */
export function composeCatalog(archive:ArchiveSnapshot,entries:DirectoryEntry[]):ArchiveSnapshot {
  const companies=new Map<string,ArchiveCompany>(archive.companies.map(c=>[c.slug,{...c}]));
  for(const entry of entries){
    const existing=companies.get(entry.slug);
    const host=(url:string)=>new URL(url).hostname.replace(/^www\./,'');
    const sameDomain=archive.companies.find(c=>c.website_url&&host(c.website_url)===host(entry.website_url)&&c.slug!==entry.slug);
    if(sameDomain)throw new Error(`Review directory alias ${entry.slug} against ${sameDomain.slug}`);
    if(existing?.website_url&&host(existing.website_url)!==host(entry.website_url))throw new Error(`Conflicting domain for ${entry.slug}`);
    companies.set(entry.slug,existing?{...existing,directory_profile:entry,reported_names:[...new Set([...existing.reported_names,...entry.aliases,entry.brand_name])]}:{
      slug:entry.slug,brand_name:entry.brand_name,website_url:entry.website_url,city:entry.india_presence.cities[0],sector:entry.sector.text,
      reported_names:[...new Set([entry.brand_name,...entry.aliases])],reported_cities:[],reported_sectors:[],
      rounds:[],tracked_amount_usd:null,unpriced_event_count:0,latest_announced_on:null,directory_profile:entry,
    });
  }
  return {...archive,companies:[...companies.values()]};
}
