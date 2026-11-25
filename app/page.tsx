import SiteHeader from './components/site-header';
import CompanyExplorer from './components/company-explorer';
import {listCompanies} from '@/lib/companies';
import {archive} from '@/lib/archive';
import {companyInfo} from '@/lib/company-info';
import {offices} from '@/lib/offices';
import {archiveOptions,companyFiltersSchema} from '@/domain/archive-queries';
import {buildStartupMap} from '@/domain/startup-map';
import {compactUsd,displayDate} from '@/domain/presentation';
import {news} from '@/lib/news';
import cities from '../data/city-centres.json';
export const dynamic='force-dynamic';
export default async function Home({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const parsed=companyFiltersSchema.safeParse(await searchParams);
  const filters=parsed.success?parsed.data:companyFiltersSchema.parse({});
  let result:Awaited<ReturnType<typeof listCompanies>>|undefined;
  try{result=await listCompanies(filters);}catch{/* Keep the selected source explicit when unavailable. */}
  const options=result?.mode==='archive'?archiveOptions(archive):{cities:[],sectors:[],stages:[]};
  const map=result?.mode==='archive'?buildStartupMap(archive,filters,cities.cities,companyInfo,cities.source_url,offices):null;
  return <div className="app-shell"><link rel="preconnect" href="https://tiles.openfreemap.org" crossOrigin="anonymous"/><link rel="preload" href="https://tiles.openfreemap.org/styles/positron" as="fetch" crossOrigin="anonymous"/><SiteHeader/>
    <section className="ecosystem-strip" aria-label="Matching company statistics"><div><span>THE ECOSYSTEM</span><strong>{result?.total.toLocaleString('en-IN')??'—'}</strong><span>{result?.total===1?'company':'companies'}</span></div><div><strong>{compactUsd(result?.metrics?.tracked_amount_usd)}</strong><span>reported funding</span></div><div><strong>{result?.metrics?.event_count.toLocaleString('en-IN')??'—'}</strong><span>funding events</span></div><div><strong>{map?.hubs.length??'—'}</strong><span>{map?.hubs.length===1?'city hub':'city hubs'}</span></div><a className="snapshot-date" href="/sources">SOURCE CHECKED {displayDate(result?.source?.retrieved_at)}</a></section>
    <CompanyExplorer companies={result?.companies??[]} total={result?.total??0} filters={filters} options={options} mapData={map} headlines={news.items.slice(0,6)} mode={result?.mode??'unavailable'} error={!result?'The selected repository could not be loaded. Please try again.':!parsed.success?'Some filters were invalid. Showing the unfiltered directory.':null}/>
  </div>;
}
