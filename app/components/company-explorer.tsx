'use client';
import {useEffect,useRef,useState,useTransition,type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import StartupMap from './startup-map';
import NewsTicker from './news-ticker';
import CompanySearch from './company-search';
import type {SearchCompany} from '@/domain/company-search';
import type {CompanyFilters,CompanyRow} from '@/domain/archive-queries';
import type {MapCompany,StartupMapPayload} from '@/domain/startup-map';
import type {NewsItem} from '@/domain/news';
import {mapCompanyRow} from '@/domain/map-directory';
import {compactUsd,displayDate,companyInitials,companyColor} from '@/domain/presentation';
import {formatUsd} from '@/domain/money';
import {Icon} from './icons';
import type {AreaSummary} from '@/domain/area-summary';

interface Props {companies:CompanyRow[];total:number;filters:CompanyFilters;options:{cities:string[];sectors:string[];stages:string[]};mapData:StartupMapPayload|null;headlines:NewsItem[];searchCompanies:SearchCompany[];mode:string;error:string|null}
export default function CompanyExplorer({companies,total,filters,options,mapData,headlines,searchCompanies,mode,error}:Props) {
  const router=useRouter(),[pending,startTransition]=useTransition();
  const [selected,setSelected]=useState<MapCompany|null>(null);
  const [areaSummary,setAreaSummary]=useState<AreaSummary|null>(null),[areaReset,setAreaReset]=useState(0);
  function clearArea(){setAreaSummary(null);setAreaReset(value=>value+1);}
  const [locatedOnly,setLocatedOnly]=useState(Boolean(mapData)&&!filters.q&&!filters.tag);
  const officeLookup=new Map(mapData?.offices.map(company=>[company.slug,company])??[]);
  const officeRows=mapData?.offices.flatMap(company=>{const row=mapCompanyRow(company);return row?[row]:[];})??[];
  const areaSlugs=areaSummary?new Set(areaSummary.companies.map(c=>c.slug)):null;
  const visibleCompanies=areaSlugs?officeRows.filter(c=>areaSlugs.has(c.slug)):locatedOnly&&mapData?officeRows:companies,visibleTotal=areaSummary?areaSummary.companies.length:locatedOnly&&mapData?officeRows.length:total;
  const list=useRef<HTMLDivElement>(null),form=useRef<HTMLFormElement>(null);
  const filterKey=JSON.stringify(filters);
  useEffect(()=>{setSelected(null);setAreaSummary(null);if(filters.q||filters.tag)setLocatedOnly(false);if(list.current)list.current.scrollTop=0;},[filterKey]);
  const params=(patch:Partial<CompanyFilters>)=>{const query=new URLSearchParams();for(const [key,value] of Object.entries({...filters,...patch}))if(value!==''||key==='city')query.set(key,String(value));return `/?${query}`;};
  function search(form:HTMLFormElement,name?:string){const query=new URLSearchParams();for(const [key,value] of new FormData(form))if(String(value).trim()||key==='city')query.set(key,String(value).trim());if(name!==undefined){if(name)query.set('q',name);else query.delete('q');}startTransition(()=>router.push(`/?${query}`,{scroll:false}));}
  function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();search(event.currentTarget);}
  function explore(row:CompanyRow){const known=mapData?.offices.find(c=>c.slug===row.slug)??mapData?.featured.find(c=>c.slug===row.slug),hub=mapData?.hubs.find(h=>!!row.city&&h.reported_cities.includes(row.city));setSelected(known??{slug:row.slug,name:row.brand_name,city:row.city??'Location not reported',sector:row.sector,hub_id:hub?.id??'',founders:row.founders??[],description:row.description??null});}
  const advanced=!!(filters.stage||filters.from||filters.to||filters.tag);
  return <><main className="discovery-workspace">
    <section className="directory-panel" aria-label="Startup directory"><div className="directory-heading"><div><p className="eyebrow">BHARATPULSE CITY GUIDE <span>{filters.city==='Bengaluru'?'BLR / 2026':'INDIA / 2026'}</span></p><h1>{filters.city==='Bengaluru'?'Bengaluru, mapped.':'Discover startups.'}<span className="heading-star" aria-hidden="true">✳</span></h1><p>A field guide to the city’s builders.</p></div></div>
      <form key={filterKey} ref={form} onSubmit={submit} role="search" className="directory-filters">
        <CompanySearch companies={searchCompanies} initialQuery={filters.q} onChoose={name=>{if(form.current)search(form.current,name);}}/>
        <div className="primary-filters"><div><label htmlFor="city" title="Matches source-reported headquarters or a sourced public office">Location</label><select id="city" name="city" defaultValue={filters.city} onChange={event=>event.currentTarget.form?.requestSubmit()}><option value="">All cities</option>{options.cities.map(city=><option key={city}>{city}</option>)}</select></div><div><label htmlFor="sector">Sector</label><select id="sector" name="sector" defaultValue={filters.sector} onChange={event=>event.currentTarget.form?.requestSubmit()}><option value="">All sectors</option>{options.sectors.map(sector=><option key={sector}>{sector}</option>)}</select></div></div>
        <details className="advanced-filters"><summary><Icon name="sliders" size={16}/> More filters{advanced&&<span className="filter-count">{[filters.stage,filters.from,filters.to,filters.tag].filter(Boolean).length}</span>}<Icon name="chevron" size={16}/></summary><div className="advanced-grid"><div className="wide-field"><label htmlFor="tag">Company signals</label><select id="tag" name="tag" defaultValue={filters.tag}><option value="">All company records</option><option value="profile">Reviewed company profiles</option><option value="bootstrapped">Bootstrapped · sourced</option><option value="careers">Careers link available</option></select></div><div className="wide-field"><label htmlFor="stage">Funding stage</label><select id="stage" name="stage" defaultValue={filters.stage}><option value="">All stages</option>{options.stages.map(stage=><option key={stage}>{stage}</option>)}</select></div><div><label htmlFor="from">Announced from</label><input id="from" name="from" type="date" defaultValue={filters.from}/></div><div><label htmlFor="to">Announced until</label><input id="to" name="to" type="date" defaultValue={filters.to}/></div><button type="submit" className="wide-field">Apply filters</button><p className="wide-field">Funding filters select companies with matching events. Missing history stays unknown.</p></div></details>
        <input type="hidden" name="sort" value={filters.sort}/>
      </form>
      {mapData&&<div className="directory-view-tabs" role="group" aria-label="Directory view"><button aria-pressed={locatedOnly} onClick={()=>{clearArea();setLocatedOnly(true);}}>Office locations <span>{officeRows.length}</span></button><button aria-pressed={!locatedOnly} onClick={()=>{clearArea();setLocatedOnly(false);}}>All companies <span>{total}</span></button></div>}
      <div className="directory-results-head"><span aria-live="polite">{pending?'Updating…':`${visibleTotal.toLocaleString('en-IN')} ${areaSummary?'companies in selected area':locatedOnly&&mapData?'mapped offices':visibleTotal===1?'company':'companies'}`}</span><label className="sr-only" htmlFor="directory-sort">Sort companies</label><select id="directory-sort" aria-label="Sort companies" value={filters.sort} onChange={event=>startTransition(()=>router.push(params({sort:event.target.value as CompanyFilters['sort'],offset:0}),{scroll:false}))}><option value="recent">Latest funding</option><option value="funding">Most funded</option><option value="name">A–Z</option></select></div>
      {(filters.q||filters.city&&filters.city!=='Bengaluru'||filters.sector||advanced)&&<div className="active-filter-line"><span>Filtered results</span><Link href="/?city=" scroll={false}>Clear all</Link></div>}
      <>{areaSummary&&<div className="active-filter-line"><span>Selected map area</span><button className="clear-area-link" onClick={clearArea}>Clear area</button></div>}</>
      <div ref={list} className={`directory-scroll${pending?' is-pending':''}`} aria-busy={pending}>
        {error&&<div role="alert" className="inline-notice">{error}</div>}{mode==='demo'&&<div className="inline-notice">Synthetic test mode · fictional companies</div>}
        {visibleCompanies.map(company=><article key={company.slug} className={`directory-card${selected?.slug===company.slug?' is-selected':''}`}>
          <button className="company-card-select" type="button" aria-label={`Explore ${company.brand_name}`} aria-pressed={selected?.slug===company.slug} onClick={()=>explore(company)}>
            <div className="company-card-top"><span className="company-monogram" style={{background:companyColor(company.brand_name)}}>{companyInitials(company.brand_name)}</span><div><h2>{company.brand_name}</h2><p>{company.sector??'Sector not reported'}</p></div><span className="card-locate"><Icon name="pin" size={17}/></span></div>
            {company.description&&<p className="directory-description">{company.description}</p>}
            {!!company.founders?.length&&<p className="directory-founders"><span>Founded by</span> {company.founders.slice(0,2).join(' · ')}{company.founders.length>2?` +${company.founders.length-2}`:''}</p>}
            {!!company.tags?.length&&<div className="company-tags">{company.tags.map(tag=><span key={tag}>{tag}</span>)}</div>}
            <div className="company-card-facts"><span><Icon name="pin" size={13}/>{officeLookup.get(company.slug)?.office?.city??company.city??'Location not reported'}<em hidden={locatedOnly} className={`office-badge${officeLookup.has(company.slug)?'':' is-city-only'}`}>{officeLookup.has(company.slug)?'Office located':'City only'}</em></span>{company.tracked_event_count>0&&<strong title={company.tracked_amount_usd?formatUsd(company.tracked_amount_usd):'Amount undisclosed'}>{compactUsd(company.tracked_amount_usd)}<span> tracked</span></strong>}</div>
            {locatedOnly&&officeLookup.get(company.slug)?.office&&<p className="directory-office-address">{officeLookup.get(company.slug)!.office!.place_name}<span>{officeLookup.get(company.slug)!.office!.precision} point</span></p>}
          </button>{company.jobs&&company.jobs.india>0&&<Link className="card-job-signal" href={`/company/${company.slug}#jobs`}>{company.jobs.india} India job postings <span>{company.jobs.bengaluru} include Bengaluru</span></Link>}{company.latest_news&&<a className="card-news-update" href={company.latest_news.url} target="_blank" rel="noreferrer"><small>{company.latest_news.source_name} · {displayDate(company.latest_news.published_at)}</small><span>{company.latest_news.title}</span></a>}<div className="company-card-footer"><span>{company.tracked_event_count?`${company.tracked_event_count} funding ${company.tracked_event_count===1?'event':'events'} · ${displayDate(company.latest_announced_on)}`:'Funding history not tracked'}</span><div>{company.careers_url&&<a className="card-careers" href={company.careers_url} target="_blank" rel="noreferrer">Careers</a>}<Link href={`/company/${company.slug}`} aria-label={`${company.brand_name} full profile`}><Icon name="external" size={14}/></Link></div></div>
        </article>)}
        {!pending&&!visibleCompanies.length&&<div className="directory-empty"><Icon name="search" size={34}/><h2>{locatedOnly?'No sourced offices here yet':'No startups found'}</h2><p>{locatedOnly?'Company records may still be available. Their addresses have not been resolved for this view.':'Try another name or broaden your filters.'}</p>{locatedOnly?<button onClick={()=>{clearArea();setLocatedOnly(false);}}>Browse all company records</button>:<Link className="button-link" href="/">Reset filters</Link>}</div>}
        {!areaSummary&&!locatedOnly&&total>0&&<nav className="directory-pagination" aria-label="Company pages"><span>{Math.min(filters.offset+1,total)}–{Math.min(filters.offset+filters.limit,total)} of {total.toLocaleString('en-IN')}</span><div>{filters.offset>0&&<Link href={params({offset:Math.max(0,filters.offset-filters.limit)})} scroll={false}>Previous</Link>}{filters.offset+filters.limit<total&&<Link href={params({offset:filters.offset+filters.limit})} scroll={false}>Next</Link>}</div></nav>}
      </div><div className="directory-source"><span className="source-check"><Icon name="check" size={13}/></span><span>{areaSummary?`${areaSummary.companies.length} companies in selected area · clear in Area stats`:locatedOnly?`${officeRows.length} public offices sourced · ${Math.max(0,total-officeRows.length)} await locations`:'City-only records do not imply a precise office pin.'}</span></div>
    </section>
    <section className="atlas-panel" aria-label="Indian startup map">{mapData?<StartupMap areaReset={areaReset} filters={filters} onAreaSummary={setAreaSummary} data={mapData} selectedCompany={selected} onSelectCompany={company=>setSelected(mapData.offices.find(c=>c.slug===company.slug)??company)} onCloseCompany={()=>setSelected(null)}/>:<div className="map-boot"><Icon name="globe" size={40}/><h2>Map unavailable</h2><p>The company map is unavailable. The selected repository remains available in the directory.</p></div>}</section>
  </main>
  <NewsTicker items={headlines}/>
  </>;
}
