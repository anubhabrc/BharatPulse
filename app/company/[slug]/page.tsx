import SiteHeader from '../../components/site-header';
import Link from 'next/link';
import NewsList from '../../components/news-list';
import {findOffice} from '@/lib/offices';
import {officeKindLabel} from '@/domain/office-labels';
import {findCompanyInfo} from '@/lib/company-info';
import {companyNews} from '@/lib/news';
import {notFound} from 'next/navigation';
import {archive} from '@/lib/archive';
import {dataMode} from '@/lib/db';
import {findArchiveCompany} from '@/domain/archive-queries';
import {formatUsd} from '@/domain/money';
export const dynamic='force-dynamic';
const day=(date:string|null)=>date?new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}):'Date not provided';
export default async function CompanyPage({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  if(dataMode()!=='archive')notFound();
  const company=findArchiveCompany(archive,slug);if(!company)notFound();
  const info=findCompanyInfo(slug),articles=companyNews(slug),office=findOffice(slug);
  return <><SiteHeader active="company"/><main>

    <section className="intro profile-intro"><p className="eyebrow">COMPANY FUNDING HISTORY</p><h1>{company.brand_name}</h1><p>{company.city??'HQ not provided'} · {company.sector??'Sector not provided'}</p>{company.website_url&&<a href={company.website_url} target="_blank" rel="noreferrer">Company website</a>}</section>
    <section className="metrics profile-metrics" aria-label="Company funding summary"><div><span>Reported funding · USD</span><strong>{company.tracked_amount_usd?formatUsd(company.tracked_amount_usd):'Undisclosed'}</strong></div><div><span>Captured funding events</span><strong>{company.rounds.length}</strong></div><div><span>Latest announcement</span><strong>{day(company.latest_announced_on)}</strong></div><div><span>Undisclosed or excluded events</span><strong>{company.unpriced_event_count}</strong></div></section>
    {info&&<section className="repository company-facts"><div className="section-head"><h2>Company & founders</h2><span>Checked {day(info.checked_on)}</span></div><p>{info.description.text} <a href={info.description.source_url} target="_blank" rel="noreferrer">Source</a></p><div className="founder-grid">{info.founders.map(founder=><div key={founder.name}><span className="muted">Co-founder</span><h3>{founder.name}</h3><a href={founder.source_url} target="_blank" rel="noreferrer">Profile source</a></div>)}</div>{info.founded_year&&<p className="muted">Founded {info.founded_year.value} · <a href={info.founded_year.source_url} target="_blank" rel="noreferrer">Source</a></p>}</section>}
    {office&&<section className="repository company-office"><div className="section-head"><h2>Bengaluru office</h2><span>Source checked {day(office.checked_on)}</span></div><span className="office-badge">{officeKindLabel[office.kind]} · {office.precision} point</span><h3>{office.place_name}</h3><p>{office.address}</p><p className="muted">{office.review_note} Public address and map feature checked against each other; not an on-site verification or entrance location.</p><div className="evidence-links"><a href={office.address_source_url} target="_blank" rel="noreferrer">Official address source</a><a href={office.coordinate_source_url} target="_blank" rel="noreferrer">OpenStreetMap location</a><Link href="/?city=Bengaluru">Explore Bengaluru offices</Link></div><small>Coordinates: © OpenStreetMap contributors · ODbL</small></section>}
    <section className="repository"><div className="section-head"><h2>Funding timeline</h2><a href={archive.source_url} target="_blank" rel="noreferrer">BWM Notion archive</a></div>
      <p className="muted">Every event below links to its original Notion record and the article cited by BWM, when provided.</p>
      <ol className="timeline">{company.rounds.map(round=><li key={round.id}>
        <div className="round-head"><div><time dateTime={round.announced_on??undefined}>{day(round.announced_on)}</time><h3>{round.stage??'Stage not provided'}</h3></div><strong className="round-amount">{round.amount_usd?formatUsd(round.amount_usd):'Undisclosed'}</strong></div>
        {round.quality_flags.length>0&&<p className="quality">{round.quality_flags.join(' · ')}{!round.included_in_totals?' · Excluded from total':''}</p>}
        <div className="evidence-links">{round.article_urls.map((url,i)=><a href={url} key={url} target="_blank" rel="noreferrer">Article source{round.article_urls.length>1?` ${i+1}`:''}</a>)}{round.notion_row_urls.map((url,i)=><a href={url} key={url} target="_blank" rel="noreferrer">Notion record{round.notion_row_urls.length>1?` ${i+1}`:''}</a>)}</div>
        <small>Appears in {round.week_titles.join(', ')}</small>
      </li>)}</ol>
    </section>
    {articles.length>0&&<section className="repository news-section"><div className="section-head"><h2>In the news</h2><Link href="/sources">Feed health</Link></div><p className="muted">Automatically matched by explicit company names in headlines; not independently verified funding events.</p><NewsList items={articles}/></section>}
    <section className="profile-notes"><h2>About these records</h2><p>Amounts are converted from the archive’s “Amount ($M)” field using decimal arithmetic. They describe the captured funding events and may include debt or secondary transactions. No current valuation, audited financial performance or complete cap table is inferred from them.</p>{company.reported_cities.length>1&&<p><strong>HQ labels found in the archive:</strong> {company.reported_cities.join(', ')}. The screener uses the latest dated observation available.</p>}{company.reported_sectors.length>1&&<p><strong>Reported sector labels:</strong> {company.reported_sectors.join('; ')}.</p>}<p>Imported {day(archive.retrieved_at.slice(0,10))} from <a href={archive.source_url} target="_blank" rel="noreferrer">Backstage with Millionaires</a>. Source facts have not been independently audited.</p></section>
    <footer><Link href="/">Back to the company screener</Link></footer>
  </main></>;
}
