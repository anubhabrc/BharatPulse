'use client';
import {useEffect,useRef,useState,useTransition,type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import StartupMap from './startup-map';
import type {CompanyFilters,CompanyRow} from '@/domain/archive-queries';
import type {MapCompany,StartupMapPayload} from '@/domain/startup-map';
import type {NewsItem} from '@/domain/news';
import {compactUsd,displayDate,companyInitials,companyColor} from '@/domain/presentation';
import {formatUsd} from '@/domain/money';
import {Icon} from './icons';

interface Props {companies:CompanyRow[];total:number;filters:CompanyFilters;options:{cities:string[];sectors:string[];stages:string[]};mapData:StartupMapPayload|null;headlines:NewsItem[];mode:string;error:string|null}
export default function CompanyExplorer({companies,total,filters,options,mapData,headlines,mode,error}:Props) {
  const router=useRouter(),[pending,startTransition]=useTransition();
  const [selected,setSelected]=useState<MapCompany|null>(null),[newsOpen,setNewsOpen]=useState(false);
  const list=useRef<HTMLDivElement>(null);
  const filterKey=JSON.stringify(filters);
  useEffect(()=>{setSelected(null);if(list.current)list.current.scrollTop=0;},[filterKey]);
  const params=(patch:Partial<CompanyFilters>)=>{const query=new URLSearchParams();for(const [key,value] of Object.entries({...filters,...patch}))if(value!=='')query.set(key,String(value));return `/?${query}`;};
  function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const query=new URLSearchParams();for(const [key,value] of new FormData(event.currentTarget))if(String(value).trim())query.set(key,String(value).trim());startTransition(()=>router.push(`/?${query}`,{scroll:false}));}
  function explore(row:CompanyRow){const known=mapData?.offices.find(c=>c.slug===row.slug)??mapData?.featured.find(c=>c.slug===row.slug),hub=mapData?.hubs.find(h=>!!row.city&&h.reported_cities.includes(row.city));setSelected(known??{slug:row.slug,name:row.brand_name,city:row.city??'HQ not reported',sector:row.sector,hub_id:hub?.id??'',founders:[],description:null});}
  const advanced=!!(filters.stage||filters.from||filters.to);
  return <><main className="discovery-workspace">
    <section className="directory-panel" aria-label="Startup directory"><div className="directory-heading"><div><p className="eyebrow">THE DIRECTORY</p><h1>Discover startups<span className="heading-star" aria-hidden="true">✳</span></h1><p>The companies building what’s next.</p></div></div>
      <form key={filterKey} onSubmit={submit} role="search" className="directory-filters">
        <div className="search-box"><Icon name="search"/><label className="sr-only" htmlFor="q">Company name</label><input id="q" name="q" defaultValue={filters.q} placeholder="Search companies…" maxLength={200} autoComplete="off"/><button type="submit" className="search-submit" aria-label="Search companies"><Icon name="search" size={18}/></button></div>
        <div className="primary-filters"><div><label htmlFor="city">Location</label><select id="city" name="city" defaultValue={filters.city} onChange={event=>event.currentTarget.form?.requestSubmit()}><option value="">All cities</option>{options.cities.map(city=><option key={city}>{city}</option>)}</select></div><div><label htmlFor="sector">Sector</label><select id="sector" name="sector" defaultValue={filters.sector} onChange={event=>event.currentTarget.form?.requestSubmit()}><option value="">All sectors</option>{options.sectors.map(sector=><option key={sector}>{sector}</option>)}</select></div></div>
        <details className="advanced-filters" open={advanced||undefined}><summary><Icon name="sliders" size={16}/> More filters{advanced&&<span className="filter-count">{[filters.stage,filters.from,filters.to].filter(Boolean).length}</span>}<Icon name="chevron" size={16}/></summary><div className="advanced-grid"><div className="wide-field"><label htmlFor="stage">Funding stage</label><select id="stage" name="stage" defaultValue={filters.stage}><option value="">All stages</option>{options.stages.map(stage=><option key={stage}>{stage}</option>)}</select></div><div><label htmlFor="from">Announced from</label><input id="from" name="from" type="date" defaultValue={filters.from}/></div><div><label htmlFor="to">Announced until</label><input id="to" name="to" type="date" defaultValue={filters.to}/></div><button type="submit" className="wide-field">Apply filters</button><p className="wide-field">Date and stage filters recalculate reported funding totals.</p></div></details>
        <input type="hidden" name="sort" value={filters.sort}/>
      </form>
      <div className="directory-results-head"><span aria-live="polite">{pending?'Updating…':`${total.toLocaleString('en-IN')} ${total===1?'company':'companies'}`}</span><label className="sr-only" htmlFor="directory-sort">Sort companies</label><select id="directory-sort" aria-label="Sort companies" value={filters.sort} onChange={event=>startTransition(()=>router.push(params({sort:event.target.value as CompanyFilters['sort'],offset:0}),{scroll:false}))}><option value="recent">Latest funding</option><option value="funding">Most funded</option><option value="name">A–Z</option></select></div>
      {(filters.q||filters.city||filters.sector||advanced)&&<div className="active-filter-line"><span>Filtered results</span><Link href="/" scroll={false}>Clear all</Link></div>}
      <div ref={list} className={`directory-scroll${pending?' is-pending':''}`} aria-busy={pending}>
        {error&&<div role="alert" className="inline-notice">{error}</div>}{mode==='demo'&&<div className="inline-notice">Synthetic test mode · fictional companies</div>}
        {companies.map(company=><article key={company.slug} className={`directory-card${selected?.slug===company.slug?' is-selected':''}`}>
          <button className="company-card-select" type="button" aria-label={`Explore ${company.brand_name}`} aria-pressed={selected?.slug===company.slug} onClick={()=>explore(company)}>
            <div className="company-card-top"><span className="company-monogram" style={{background:companyColor(company.brand_name)}}>{companyInitials(company.brand_name)}</span><div><h2>{company.brand_name}</h2><p>{company.sector??'Sector not reported'}</p></div><span className="card-locate"><Icon name="pin" size={17}/></span></div>
            <div className="company-card-facts"><span><Icon name="pin" size={13}/>{company.city??'HQ not reported'}{mapData?.offices.some(c=>c.slug===company.slug)&&<em className="office-badge">Office mapped</em>}</span><strong title={company.tracked_amount_usd?formatUsd(company.tracked_amount_usd):'Undisclosed'}>{compactUsd(company.tracked_amount_usd)}<span> reported</span></strong></div>
          </button><div className="company-card-footer"><span>{company.tracked_event_count} {company.tracked_event_count===1?'event':'events'} · {displayDate(company.latest_announced_on)}</span><Link href={`/company/${company.slug}`} aria-label={`${company.brand_name} full profile`}><Icon name="external" size={14}/></Link></div>
        </article>)}
        {!pending&&!companies.length&&<div className="directory-empty"><Icon name="search" size={34}/><h2>No startups found</h2><p>Try another name or broaden your filters.</p><Link className="button-link" href="/">Reset filters</Link></div>}
        {total>0&&<nav className="directory-pagination" aria-label="Company pages"><span>{Math.min(filters.offset+1,total)}–{Math.min(filters.offset+filters.limit,total)} of {total.toLocaleString('en-IN')}</span><div>{filters.offset>0&&<Link href={params({offset:Math.max(0,filters.offset-filters.limit)})} scroll={false}>Previous</Link>}{filters.offset+filters.limit<total&&<Link href={params({offset:filters.offset+filters.limit})} scroll={false}>Next</Link>}</div></nav>}
      </div><div className="directory-source"><span className="source-check"><Icon name="check" size={13}/></span><span>Source-linked records. Always inspect the evidence.</span></div>
    </section>
    <section className="atlas-panel" aria-label="Indian startup map">{mapData?<StartupMap data={mapData} selectedCompany={selected} onSelectCompany={setSelected} onCloseCompany={()=>setSelected(null)}/>:<div className="map-boot"><Icon name="globe" size={40}/><h2>Map unavailable</h2><p>The city map uses the BWM funding archive. The selected repository remains available in the directory.</p></div>}</section>
  </main>
  <div className="news-wire"><button onClick={()=>setNewsOpen(!newsOpen)} aria-expanded={newsOpen} className="wire-label"><Icon name="bolt" size={17}/> THE WIRE <Icon name="chevron" size={14}/></button><div className="wire-items">{headlines.slice(0,3).map(item=><a key={item.id} href={item.url} target="_blank" rel="noreferrer"><span>{item.source_name}</span>{item.title}</a>)}</div><Link href="/news" className="wire-all">All news <Icon name="news" size={16}/></Link></div>
  {newsOpen&&<section className="wire-popover" aria-label="Latest startup headlines"><div className="popover-heading"><h2>On the wire</h2><button className="icon-button" aria-label="Close latest news" onClick={()=>setNewsOpen(false)}><Icon name="close" size={17}/></button></div>{headlines.map(item=><a key={item.id} href={item.url} target="_blank" rel="noreferrer"><small>{item.source_name} · {displayDate(item.published_at)}</small><strong>{item.title}</strong></a>)}<Link href="/news" className="button-link">Open the newsroom</Link></section>}
  </>;
}
