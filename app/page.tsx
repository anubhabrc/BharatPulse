import { listCompanies } from '@/lib/companies';
import { formatUsd } from '@/domain/money';
export const dynamic='force-dynamic';
export default async function Home({searchParams}:{searchParams:Promise<{q?:string}>}) {
  const params=await searchParams;
  const q=typeof params.q==='string'?params.q.slice(0,200):'';
  let result:Awaited<ReturnType<typeof listCompanies>>|undefined;
  try { result=await listCompanies(q); } catch { /* Visible setup error below. */ }
  return <main>
    <header><a href="/" className="brand">BharatPulse<span> GEO</span></a><span className="phase">Repository foundation</span></header>
    <section className="intro"><p className="eyebrow">INDIAN STARTUP INTELLIGENCE</p><h1>Start with the evidence.</h1>
      <p>A company repository connecting funding events, source records, and geography.</p></section>
    {result?.mode==='demo'&&<aside><strong>Synthetic demo data</strong><p>These are fictional companies for testing the repository. Funding totals are withheld. Connect a database and import reviewed sources to explore real records.</p></aside>}
    {!result&&<aside role="alert"><strong>Database connection unavailable</strong><p>Check DATABASE_URL, apply the migrations, and select DATA_MODE=database. See the project README for setup.</p></aside>}
    <section className="repository"><div className="section-head"><h2>Company repository</h2><span>{result?.mode==='database'?'Reviewed records':'Development preview'}</span></div>
      <form role="search"><label htmlFor="q">Search company names</label><div className="search"><input id="q" name="q" defaultValue={q} placeholder="Find a company" maxLength={200}/><button type="submit">Search</button>{q&&<a href="/">Clear</a>}</div></form>
      <div className="table-wrap"><table><thead><tr><th>Company</th><th>Sector</th><th>HQ city</th><th>Tracked events</th><th>Tracked equity · USD</th></tr></thead><tbody>
        {result?.companies.map(c=><tr key={c.slug}><td><strong>{c.brand_name}</strong>{c.is_demo&&<small>Fictional company</small>}</td><td>{c.sector??'Unknown'}</td><td>{c.city??'Unknown'}</td><td>{c.tracked_event_count}</td><td>{c.equity_usd===null?'Unavailable':formatUsd(c.equity_usd)}{c.unpriced_event_count>0&&<small>{c.unpriced_event_count} event(s) without a converted amount</small>}</td></tr>)}
        {result&&result.companies.length===0&&<tr><td colSpan={5}>No matching companies. Import reviewed records or change your search.</td></tr>}
      </tbody></table></div>
    </section>
    <footer>First milestone: reviewed imports and read-only repository queries. Map exploration and cited AI answers follow this foundation.</footer>
  </main>;
}
