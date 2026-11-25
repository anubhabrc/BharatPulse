import 'server-only';
import { database, isDemo } from './db';
import fixture from '../../data/demo-reviewed.json';

export interface CompanyRow {
  slug:string; brand_name:string; city:string|null; sector:string|null;
  tracked_event_count:number; equity_usd:string|null; unpriced_event_count:number; is_demo:boolean;
}
export async function listCompanies(search='',limit=100,offset=0):Promise<{mode:'demo'|'database';companies:CompanyRow[]}> {
  if(isDemo()) {
    // Synthetic fixtures are never mixed with live records. There is no automatic
    // fallback to demo when a configured database fails.
    const companies=[...new Map(fixture.records.map(r=>[r.company.slug,r.company])).values()]
      .filter(c=>c.brand_name.toLowerCase().includes(search.toLowerCase()))
      .map(c=>({slug:c.slug,brand_name:c.brand_name,city:c.location?.city??null,
        sector:c.sectors.map(s=>s.name).join(', '),tracked_event_count:new Set(fixture.records.filter(r=>r.company.slug===c.slug).map(r=>r.funding.event_key)).size,
        equity_usd:null,unpriced_event_count:0,is_demo:true})).slice(offset,offset+limit);
    return {mode:'demo',companies};
  }
  if(process.env.DATA_MODE!=='database') throw new Error('DATA_MODE must be demo or database');
  const sql=database();
  const rows=await sql<CompanyRow[]>`
    SELECT c.slug,c.brand_name,c.is_demo,l.city,s.sector,t.tracked_event_count,t.equity_usd::text,t.unpriced_event_count
    FROM bp.companies c JOIN bp.company_funding_totals t ON t.company_id=c.id
    LEFT JOIN LATERAL (SELECT city FROM bp.company_locations WHERE company_id=c.id AND kind='hq' AND observed_on<=current_date
      ORDER BY observed_on DESC,location_key LIMIT 1) l ON true
    LEFT JOIN LATERAL (SELECT string_agg(se.name,', ' ORDER BY se.name) AS sector FROM bp.company_sectors cs
      JOIN bp.sectors se ON se.slug=cs.sector_slug WHERE cs.company_id=c.id) s ON true
    WHERE NOT c.is_demo AND position(lower(${search}) in lower(c.brand_name))>0
    ORDER BY c.brand_name,c.slug LIMIT ${limit} OFFSET ${offset}`;
  return {mode:'database',companies:[...rows]};
}
