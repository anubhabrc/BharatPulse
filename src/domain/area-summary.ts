import {containsPoint,type AreaSelection} from './area-geometry';
import {filterArchiveRows,type CompanyFilters} from './archive-queries';
import {jobSummary} from './jobs';
import {sumUsd} from './notion-archive';
import type {SpatialDataset} from './spatial-data';

export function summarizeArea(data:SpatialDataset,selection:AreaSelection,filters:CompanyFilters,now=new Date()){
  const rows=filterArchiveRows(data.catalog,filters,data.offices),eligible=new Set(rows.map(c=>c.slug));
  const located=data.offices.filter(o=>eligible.has(o.company_slug)&&(!filters.city||o.city===filters.city)&&o.checked_on<=now.toISOString().slice(0,10));
  const selected=located.filter(o=>containsPoint(selection,o.geometry.coordinates));
  const selectedSlugs=new Set(selected.map(o=>o.company_slug)),cohort=rows.filter(c=>selectedSlugs.has(c.slug));
  const sectors=new Map<string,number>();for(const c of cohort){const label=c.sector??'Sector not reported';sectors.set(label,(sectors.get(label)??0)+1);}
  const relatedNews=[...new Map(data.news.items.filter(n=>n.company_slugs.some(s=>selectedSlugs.has(s))).map(n=>[n.url,n])).values()].sort((a,b)=>b.published_at.localeCompare(a.published_at));
  let employersCovered=0,staleEmployers=0;
  const jobs=cohort.flatMap(c=>{
    const summary=jobSummary(data.jobs,c.slug,now);if(!summary)return [];
    if(summary.stale){staleEmployers++;return [];}
    employersCovered++;const cities=new Set(selected.filter(o=>o.company_slug===c.slug).map(o=>o.city));
    return summary.items.filter(j=>j.country==='IN'&&j.cities.some(city=>cities.has(city)));
  });
  const uniqueJobs=[...new Map(jobs.map(j=>[`${j.source_id}:${j.id}`,j])).values()];
  return {schema_version:1 as const,generated_at:now.toISOString(),selection,
    coverage:{eligible_companies:rows.length,located_companies:new Set(located.map(o=>o.company_slug)).size,unlocated_companies:rows.length-new Set(located.map(o=>o.company_slug)).size,selected_offices:selected.length,
      office_checked_from:selected.map(o=>o.checked_on).sort()[0]??null,office_checked_to:selected.map(o=>o.checked_on).sort().at(-1)??null,
      funding_checked_at:data.catalog.retrieved_at,jobs_checked_at:data.jobs.updated_at,news_checked_at:data.news.updated_at},
    companies:cohort.map(c=>({slug:c.slug,name:c.brand_name,sector:c.sector,office_ids:selected.filter(o=>o.company_slug===c.slug).map(o=>o.id)})),
    offices:selected,
    funding:{basis:'company_history_at_current_offices' as const,reported_usd:sumUsd(cohort.map(c=>c.tracked_amount_usd)),events:cohort.reduce((n,c)=>n+c.tracked_event_count,0),unpriced_events:cohort.reduce((n,c)=>n+c.unpriced_event_count,0),source_url:data.catalog.source_url},
    sectors:[...sectors].map(([label,count])=>({label,count})).sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label)),
    jobs:{basis:'employer_city' as const,area_count:null,employer_city_count:employersCovered?uniqueJobs.length:null,employers_covered:employersCovered,stale_employers:staleEmployers,items:uniqueJobs.slice(0,50),truncated:uniqueJobs.length>50},
    news:{basis:'company_related' as const,count:relatedNews.length,items:relatedNews.slice(0,20),truncated:relatedNews.length>20},
    rents:{status:'not_connected' as const,count:null,median_inr:null},
  };
}
export type AreaSummary=ReturnType<typeof summarizeArea>;
