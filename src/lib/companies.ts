import 'server-only';
import {database,dataMode} from './db';
import fixture from '../../data/demo-reviewed.json';
import {catalog} from './catalog';
import {offices} from './offices';
import {queryArchive,type CompanyFilters,type CompanyRow} from '@/domain/archive-queries';

export async function listCompanies(filters:CompanyFilters) {
  const mode=dataMode();
  if(mode==='archive')return queryArchive(catalog,filters,offices);
  if(mode==='demo') {
    const all=[...new Map(fixture.records.map(r=>[r.company.slug,r.company])).values()]
      .filter(c=>c.brand_name.toLowerCase().includes(filters.q.toLowerCase()))
      .map<CompanyRow>(c=>({slug:c.slug,brand_name:c.brand_name,city:c.location?.city??null,sector:c.sectors.map(s=>s.name).join(', '),
        tracked_event_count:new Set(fixture.records.filter(r=>r.company.slug===c.slug).map(r=>r.funding.event_key)).size,
        tracked_amount_usd:null,unpriced_event_count:0,is_demo:true,latest_announced_on:null,flagged_event_count:0}));
    return {mode,companies:all.slice(filters.offset,filters.offset+filters.limit),total:all.length,metrics:null,source:null,amount_label:'Fictional test data'};
  }
  const sql=database();
  const rows=await sql<(CompanyRow&{full_count:number})[]>`
    SELECT c.slug,c.brand_name,c.is_demo,l.city,s.sector,t.tracked_event_count,t.equity_usd::text AS tracked_amount_usd,
      t.unpriced_event_count,f.latest_announced_on::text,0 AS flagged_event_count,count(*) OVER()::int AS full_count
    FROM bp.companies c JOIN bp.company_funding_totals t ON t.company_id=c.id
    LEFT JOIN LATERAL (SELECT city FROM bp.company_locations WHERE company_id=c.id AND kind='hq' AND observed_on<=current_date
      ORDER BY observed_on DESC,location_key LIMIT 1) l ON true
    LEFT JOIN LATERAL (SELECT string_agg(se.name,', ' ORDER BY se.name) AS sector FROM bp.company_sectors cs
      JOIN bp.sectors se ON se.slug=cs.sector_slug WHERE cs.company_id=c.id) s ON true
    LEFT JOIN LATERAL (SELECT max(announced_on) AS latest_announced_on FROM bp.funding_events
      WHERE company_id=c.id AND review_status='approved' AND status IN ('announced','completed')) f ON true
    WHERE NOT c.is_demo AND position(lower(${filters.q}) in lower(c.brand_name))>0
    ORDER BY c.brand_name,c.slug LIMIT ${filters.limit} OFFSET ${filters.offset}`;
  return {mode,companies:rows.map(({full_count,...row})=>row),total:rows[0]?.full_count??0,metrics:null,source:null,amount_label:'Tracked equity · USD'};
}
