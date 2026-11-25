import Link from 'next/link';
import CompanyExplorer from './components/company-explorer';
import NewsList from './components/news-list';
import {news} from '@/lib/news';
import {listCompanies} from '@/lib/companies';
import {archive} from '@/lib/archive';
import {archiveOptions,companyFiltersSchema} from '@/domain/archive-queries';
import {formatUsd} from '@/domain/money';
export const dynamic='force-dynamic';
const day=(value:string|null)=>value?new Date(`${value.slice(0,10)}T00:00:00Z`).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}):'Not provided';
export default async function Home({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const parsed=companyFiltersSchema.safeParse(await searchParams);
  const filters=parsed.success?parsed.data:companyFiltersSchema.parse({});
  let result:Awaited<ReturnType<typeof listCompanies>>|undefined;
  try{result=await listCompanies(filters);}catch{/* Show the unavailable state; never switch data silently. */}
  const options=result?.mode==='archive'?archiveOptions(archive):null;
  const pageUrl=(offset:number)=>{const q=new URLSearchParams();for(const [key,value] of Object.entries({...filters,offset}))if(value!=='')q.set(key,String(value));return `/?${q}`;};
  return <main>
    <header><Link href="/" className="brand">BharatPulse<span> GEO</span></Link><Link href="/sources" className="phase">{result?.mode==='archive'?'BWM funding archive':'Company repository'} · Sources</Link></header>
    <section className="intro"><p className="eyebrow">INDIAN STARTUP INTELLIGENCE</p><h1>Explore the companies.<br/>Follow the funding.</h1><p>Search real funding records, trace a company across weekly reports, and open the evidence behind each round.</p></section>
    {result?.source&&<div className="source-bar"><div><a href={result.source.url} target="_blank" rel="noreferrer">Backstage with Millionaires · Notion archive</a><p>{result.source.coverage.pages_imported} weekly pages · Source dates {day(result.source.coverage.first_date)} to {day(result.source.coverage.last_date)}</p></div><span>Imported {day(result.source.retrieved_at)}</span></div>}
    {result?.mode==='demo'&&<aside><strong>Synthetic test mode</strong><p>This mode contains fictional companies. Use the default archive mode to see the imported BWM records.</p></aside>}
    {!result&&<aside role="alert"><strong>Repository unavailable</strong><p>The selected data source could not be loaded. Please try again shortly.</p></aside>}
    {!parsed.success&&<aside role="alert"><strong>Check the selected filters</strong><p>Use valid dates with the start date before the end date. <Link href="/">Clear filters</Link></p></aside>}
    {result?.metrics&&<section className="metrics" aria-label="Matching funding records"><div><span>Companies</span><strong>{result.metrics.company_count.toLocaleString('en-IN')}</strong></div><div><span>Funding events</span><strong>{result.metrics.event_count.toLocaleString('en-IN')}</strong></div><div><span>Reported funding · USD</span><strong>{result.metrics.tracked_amount_usd?formatUsd(result.metrics.tracked_amount_usd):'Undisclosed'}</strong></div><div><span>Events without a usable total</span><strong>{result.metrics.unpriced_event_count.toLocaleString('en-IN')}</strong></div></section>}
    <section className="repository"><div className="section-head"><h2>Company screener</h2><span>{result?.total.toLocaleString('en-IN')??0} matching companies</span></div>
      <form role="search"><div className="filters"><div className="search-field"><label htmlFor="q">Company name</label><input id="q" name="q" defaultValue={filters.q} placeholder="Search Zepto, Sarvam, Country Delight…" maxLength={200}/></div>
        {options&&<><div><label htmlFor="city">HQ city</label><select id="city" name="city" defaultValue={filters.city}><option value="">All cities</option>{options.cities.map(v=><option key={v}>{v}</option>)}</select></div><div><label htmlFor="sector">Sector</label><select id="sector" name="sector" defaultValue={filters.sector}><option value="">All sectors</option>{options.sectors.map(v=><option key={v}>{v}</option>)}</select></div><div><label htmlFor="stage">Round stage</label><select id="stage" name="stage" defaultValue={filters.stage}><option value="">All stages</option>{options.stages.map(v=><option key={v}>{v}</option>)}</select></div><div><label htmlFor="from">Announced from</label><input id="from" name="from" type="date" defaultValue={filters.from}/></div><div><label htmlFor="to">Announced until</label><input id="to" name="to" type="date" defaultValue={filters.to}/></div><div><label htmlFor="sort">Sort by</label><select id="sort" name="sort" defaultValue={filters.sort}><option value="recent">Latest funding</option><option value="funding">Funding amount</option><option value="name">Company name</option></select></div></>}
      </div><div className="filter-actions"><button type="submit">Apply filters</button><Link href="/">Clear filters</Link><span>Dates and stage filter the events included in each total.</span></div></form>
      <CompanyExplorer key={JSON.stringify(filters)} query={new URLSearchParams(Object.entries(filters).map(([k,v])=>[k,String(v)])).toString()} enabled={result?.mode==='archive'}><div className="table-wrap"><table><thead><tr><th>Company</th><th>HQ city</th><th>Sector</th><th>Events</th><th>Latest announcement</th><th>{result?.amount_label??'Funding · USD'}</th></tr></thead><tbody>
        {result?.companies.map(c=><tr key={c.slug}><td><strong>{result.mode==='archive'?<Link href={`/company/${c.slug}`}>{c.brand_name}</Link>:c.brand_name}</strong>{c.is_demo&&<small>Fictional company</small>}</td><td>{c.city??'Not provided'}</td><td className="sector-cell">{c.sector??'Not provided'}</td><td>{c.tracked_event_count}</td><td className="date-cell">{day(c.latest_announced_on)}</td><td className="money-cell">{c.tracked_amount_usd===null?'Undisclosed':formatUsd(c.tracked_amount_usd)}{c.unpriced_event_count>0&&<small>{c.unpriced_event_count} undisclosed or excluded</small>}</td></tr>)}
        {result&&result.companies.length===0&&<tr><td colSpan={6}>No matching records. Try a broader search or <Link href="/">clear filters</Link>.</td></tr>}
      </tbody></table></div>
      {result&&result.total>0&&<nav className="pagination" aria-label="Company pages"><span>Showing {Math.min(filters.offset+1,result.total)}–{Math.min(filters.offset+filters.limit,result.total)} of {result.total.toLocaleString('en-IN')}</span><div>{filters.offset>0&&<Link href={pageUrl(Math.max(0,filters.offset-filters.limit))}>Previous</Link>}{filters.offset+filters.limit<result.total&&<Link href={pageUrl(filters.offset+filters.limit)}>Next</Link>}</div></nav>}
      </CompanyExplorer>
    </section>
    <section className="repository news-section"><div className="section-head"><h2>Latest startup headlines</h2><Link href="/news">All headlines →</Link></div><p className="muted">Publication headlines and automatic company mentions. These do not add or verify funding rounds.</p><NewsList items={news.items.slice(0,6)}/></section>
    <footer><p>Figures are reported by BWM and linked publications. Totals cover captured events, may include debt or secondary transactions, and do not represent verified lifetime funding. Missing amounts remain undisclosed; conflicting entries and future-dated records are excluded from totals.</p><p>City labels are source-reported headquarters, without verified street coordinates. Snapshots refresh through the source pipeline; see source health for the most recent successful checks.</p></footer>
  </main>;
}
