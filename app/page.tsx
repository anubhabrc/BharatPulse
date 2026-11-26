import SiteHeader from './components/site-header';
import CompanyExplorer from './components/company-explorer';
import {listCompanies} from '@/lib/companies';
import {catalog} from '@/lib/catalog';
import {companyInfo} from '@/lib/company-info';
import {offices} from '@/lib/offices';
import {archiveOptions,companyFiltersSchema,filterArchiveRows} from '@/domain/archive-queries';
import {buildStartupMap} from '@/domain/startup-map';
import {compactUsd,displayDate} from '@/domain/presentation';
import {news} from '@/lib/news';
import {enrichDirectoryRows,enrichMapDirectory} from '@/lib/directory-signals';
import cities from '../data/city-centres.json';
export const dynamic='force-dynamic';
export default async function Home({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const parsed=companyFiltersSchema.safeParse({city:'Bengaluru',...await searchParams});
  const filters=parsed.success?parsed.data:companyFiltersSchema.parse({city:'Bengaluru'});
  let result:Awaited<ReturnType<typeof listCompanies>>|undefined;
  try{result=await listCompanies(filters);}catch{/* Keep the selected source explicit when unavailable. */}
  const options=result?.mode==='archive'?archiveOptions(catalog):{cities:[],sectors:[],stages:[]};
  const map=result?.mode==='archive'?enrichMapDirectory(buildStartupMap(catalog,filters,cities.cities,companyInfo,cities.source_url,offices)):null;
  const names=new Map(catalog.companies.map(company=>[company.slug,company.reported_names]));
  const searchCompanies=(result?.mode==='archive'?filterArchiveRows(catalog,{...filters,q:'',sort:'name'},offices):result?.companies??[]).map(company=>({slug:company.slug,name:company.brand_name,...(names.get(company.slug)?.some(name=>name!==company.brand_name)?{aliases:names.get(company.slug)?.filter(name=>name!==company.brand_name)}:{})}));
  return <div className="app-shell"><link rel="preload" href="/api/basemap/styles/liberty" as="fetch" crossOrigin="anonymous"/><SiteHeader/>
    <section className="ecosystem-strip" aria-label="Matching company statistics"><div><span>THE ECOSYSTEM</span><strong>{result?.total.toLocaleString('en-IN')??'—'}</strong><span>{result?.total===1?'company':'companies'}</span></div><div><strong>{compactUsd(result?.metrics?.tracked_amount_usd)}</strong><span>reported funding</span></div><div><strong>{result?.metrics?.event_count.toLocaleString('en-IN')??'—'}</strong><span>funding events</span></div><div><strong>{map?.hubs.length??'—'}</strong><span>{map?.hubs.length===1?'city hub':'city hubs'}</span></div><a className="snapshot-date" href="/sources">SOURCE CHECKED {displayDate(result?.source?.retrieved_at)}</a></section>
    <CompanyExplorer companies={enrichDirectoryRows(result?.companies??[])} total={result?.total??0} filters={filters} options={options} mapData={map} searchCompanies={searchCompanies} headlines={news.items.slice(0,12)} mode={result?.mode??'unavailable'} error={!result?'The selected repository could not be loaded. Please try again.':!parsed.success?'Some filters were invalid. Showing the Bengaluru guide.':null}/>
  </div>;
}
