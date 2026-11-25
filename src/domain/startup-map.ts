import type {FeatureCollection,Point} from 'geojson';
import {filterArchiveRows,type CompanyFilters} from './archive-queries';
import type {ArchiveSnapshot} from './notion-archive';
import type {OfficeLocation} from './offices';
export interface CompanyInfo {slug:string;description:{text:string;source_url:string};founders:{name:string;source_url:string}[];founded_year:{value:number;source_url:string}|null;checked_on:string}
export interface CityCentre {id:string;name:string;aliases:string[];longitude:number;latitude:number;region:string|null}
export interface MapCompany {slug:string;name:string;city:string;sector:string|null;hub_id:string;founders:string[];description:string|null;office?:OfficeLocation}
export interface MapHub {id:string;name:string;reported_cities:string[];longitude:number;latitude:number;company_count:number;companies:MapCompany[]}
export interface StartupMapPayload {
  type:'FeatureCollection';features:FeatureCollection<Point>['features'];hubs:MapHub[];featured:MapCompany[];
  offices:MapCompany[];office_features:FeatureCollection<Point>['features'];
  matched_companies:number;mapped_companies:number;unmapped_companies:number;precision:'representative_city_centre'|'mixed_city_and_office';
  source_url:string;source_date:string;city_source_url:string;
}
const key=(value:string)=>value.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
const aliases:Record<string,string>={bangalore:'bengaluru',gurugram:'gurgaon','delhi-ncr':'delhi','delhi - ncr':'delhi','delhi ncr':'delhi',mangalore:'mangaluru',mysore:'mysuru',nasik:'nashik',bhubaneshwar:'bhubaneswar',hyerabad:'hyderabad',belgaum:'belagavi',tiruppur:'tiruppur'};
export function buildStartupMap(snapshot:ArchiveSnapshot,filters:CompanyFilters,centres:CityCentre[],profiles:CompanyInfo[],citySourceUrl:string,offices:OfficeLocation[]=[]):StartupMapPayload {
  const lookup=new Map<string,CityCentre>();
  for(const centre of centres)for(const name of [centre.name,...centre.aliases])lookup.set(key(name),centre);
  const infos=new Map(profiles.map(p=>[p.slug,p]));
  const officeLookup=new Map(offices.map(office=>[office.company_slug,office]));
  const rows=filterArchiveRows(snapshot,filters),groups=new Map<string,MapHub>(),allMapped=new Map<string,MapCompany>();
  let unmapped=0;
  for(const row of rows) {
    const city=row.city,normal=city?key(city):'',centre=lookup.get(normal)??lookup.get(aliases[normal]??'');
    if(!city||!centre){unmapped++;continue;}
    let hub=groups.get(centre.id);
    if(!hub){hub={id:centre.id,name:centre.name,reported_cities:[],longitude:centre.longitude,latitude:centre.latitude,company_count:0,companies:[]};groups.set(centre.id,hub);}
    hub.company_count++;
    if(!hub.reported_cities.includes(city))hub.reported_cities.push(city);
    const info=infos.get(row.slug),office=officeLookup.get(row.slug),company:MapCompany={slug:row.slug,name:row.brand_name,city,sector:row.sector,hub_id:hub.id,founders:info?.founders.map(f=>f.name)??[],description:info?.description.text??null,...(office?{office}:{})};
    allMapped.set(company.slug,company);
    if(hub.companies.length<8)hub.companies.push(company);
  }
  const hubs=[...groups.values()].sort((a,b)=>b.company_count-a.company_count||a.name.localeCompare(b.name));
  const located=[...allMapped.values()].filter(company=>company.office);
  return {type:'FeatureCollection',features:hubs.map(h=>({type:'Feature',id:h.id,geometry:{type:'Point',coordinates:[h.longitude,h.latitude]},properties:{hub_id:h.id,city:h.name,company_count:h.company_count,has_offices:located.some(company=>company.hub_id===h.id)}})),
    offices:located,office_features:located.map(company=>({type:'Feature',id:company.slug,geometry:{type:'Point',coordinates:[company.office!.longitude,company.office!.latitude]},properties:{slug:company.slug,name:company.name,precision:company.office!.precision}})),
    hubs,featured:profiles.map(p=>allMapped.get(p.slug)).filter((c):c is MapCompany=>!!c),matched_companies:rows.length,mapped_companies:rows.length-unmapped,unmapped_companies:unmapped,
    precision:located.length?'mixed_city_and_office':'representative_city_centre',source_url:snapshot.source_url,source_date:snapshot.retrieved_at,city_source_url:citySourceUrl};
}
