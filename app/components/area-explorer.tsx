'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import type {Map as GLMap,GeoJSONSource,MapMouseEvent} from 'maplibre-gl';
import type {CompanyFilters} from '@/domain/archive-queries';
import type {AreaSummary} from '@/domain/area-summary';
import {boxSelection,distanceMeters,selectionPolygon,selectionSchema,type AreaSelection,type Position} from '@/domain/area-geometry';
import {compactUsd,displayDate} from '@/domain/presentation';
import {formatUsd} from '@/domain/money';
import {newsStoryHref} from '@/domain/news-navigation';

interface Props {resetToken:number;instance:GLMap|null;filters:CompanyFilters;obscured:boolean;onOpen:()=>void;onDrawing:(drawing:boolean)=>void;onSummary:(summary:AreaSummary|null)=>void}
export default function AreaExplorer({resetToken,instance,filters,obscured,onOpen,onDrawing,onSummary}:Props){
  const [open,setOpen]=useState(false),[mode,setMode]=useState<'circle'|'box'|null>(null),[anchored,setAnchored]=useState(false);
  const [selection,setSelection]=useState<AreaSelection|null>(null),[summary,setSummary]=useState<AreaSummary|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const anchor=useRef<Position|null>(null),selectionRef=useRef(selection);selectionRef.current=selection;
  const callbacks=useRef({onOpen,onDrawing,onSummary});callbacks.current={onOpen,onDrawing,onSummary};
  const filterKey=JSON.stringify(filters);
  function paint(shape:AreaSelection|null,map=instance){
    (map?.getSource('area-selection') as GeoJSONSource|undefined)?.setData({type:'FeatureCollection',features:shape?[{type:'Feature',geometry:selectionPolygon(shape),properties:{}}]:[]});
  }
  useEffect(()=>{
    if(!instance)return;
    if(!instance.getSource('area-selection')){
      instance.addSource('area-selection',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
      instance.addLayer({id:'area-selection-fill',type:'fill',source:'area-selection',paint:{'fill-color':'#8361c2','fill-opacity':.18}});
      instance.addLayer({id:'area-selection-line',type:'line',source:'area-selection',paint:{'line-color':'#a57be8','line-width':3,'line-dasharray':[3,2]}});
    }
    paint(selectionRef.current,instance);
    return()=>{for(const id of ['area-selection-line','area-selection-fill'])if(instance.getLayer(id))instance.removeLayer(id);if(instance.getSource('area-selection'))instance.removeSource('area-selection');};
  },[instance]);
  useEffect(()=>{paint(selection);},[selection,instance]);
  useEffect(()=>{
    if(!selection){setSummary(null);setBusy(false);callbacks.current.onSummary(null);return;}
    const controller=new AbortController();setBusy(true);setError('');setSummary(null);callbacks.current.onSummary(null);
    fetch('/api/areas/summary',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({selection,filters:JSON.parse(filterKey)}),signal:controller.signal})
      .then(async response=>{const result=await response.json();if(!response.ok)throw new Error(result.error??'Area summary unavailable');return result as AreaSummary;})
      .then(result=>{if(!controller.signal.aborted){setSummary(result);callbacks.current.onSummary(result);}})
      .catch(reason=>{if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:'Area summary unavailable');})
      .finally(()=>{if(!controller.signal.aborted)setBusy(false);});
    return()=>controller.abort();
  },[selection,filterKey]);
  useEffect(()=>{
    callbacks.current.onDrawing(Boolean(mode));
    if(!instance||!mode)return()=>callbacks.current.onDrawing(false);
    const doubleClick=instance.doubleClickZoom.isEnabled();instance.doubleClickZoom.disable();instance.getCanvas().style.cursor='crosshair';
    const shape=(p:Position):AreaSelection=>mode==='circle'?{type:'Circle',center:anchor.current!,radius_m:distanceMeters(anchor.current!,p)}:boxSelection(anchor.current!,p);
    const click=(event:MapMouseEvent)=>{
      const p:Position=[event.lngLat.lng,event.lngLat.lat];
      if(!anchor.current){anchor.current=p;setAnchored(true);return;}
      const parsed=selectionSchema.safeParse(shape(p));
      if(!parsed.success){setError('Choose a non-empty box or a circle with a radius of 25 m–100 km.');return;}
      setSelection(parsed.data);anchor.current=null;setAnchored(false);setMode(null);setError('');
    };
    const move=(event:MapMouseEvent)=>{if(anchor.current)paint(shape([event.lngLat.lng,event.lngLat.lat]),instance);};
    const cancel=(event:KeyboardEvent)=>{if(event.key==='Escape'){setMode(null);anchor.current=null;setAnchored(false);paint(selectionRef.current,instance);}};
    instance.on('click',click);instance.on('mousemove',move);document.addEventListener('keydown',cancel);
    return()=>{callbacks.current.onDrawing(false);instance.off('click',click);instance.off('mousemove',move);document.removeEventListener('keydown',cancel);if(doubleClick)instance.doubleClickZoom.enable();instance.getCanvas().style.cursor='';};
  },[mode,instance]);
  useEffect(()=>{if(resetToken){setMode(null);anchor.current=null;setAnchored(false);setSelection(null);setSummary(null);setOpen(false);callbacks.current.onSummary(null);}},[resetToken]);
  function cancel(){setMode(null);anchor.current=null;setAnchored(false);paint(selection);setError('');}
  function begin(next:'circle'|'box'){cancel();callbacks.current.onOpen();setMode(next);setOpen(true);}
  function clear(){cancel();setSelection(null);setSummary(null);callbacks.current.onSummary(null);}
  function viewport(){if(!instance)return;cancel();const b=instance.getBounds(),parsed=selectionSchema.safeParse(boxSelection([b.getWest(),b.getSouth()],[b.getEast(),b.getNorth()]));if(parsed.success)setSelection(parsed.data);else setError('Zoom in to select a smaller map area.');}
  return <>
    <button className={`area-launch${selection?' is-active':''}`} aria-label="Area stats" aria-expanded={open&&!obscured} onClick={()=>{callbacks.current.onOpen();setOpen(!open||obscured);}} disabled={!instance}>◎ <span>Area stats</span></button>
    {open&&!obscured&&<section className={`area-panel${mode?' is-drawing':''}`} aria-label="Selected area statistics">
      <div className="area-panel-heading"><h2>{mode==='circle'?'Draw a circle':mode==='box'?'Draw a box':'Explore an area'}</h2><button aria-label="Close area stats" onClick={()=>{cancel();setOpen(false);}}>×</button></div>
      {!mode&&<div className="area-selection-tools" role="group" aria-label="Select map area"><button disabled={!instance} aria-pressed={mode==='circle'} onClick={()=>begin('circle')}>Circle</button><button disabled={!instance} aria-pressed={mode==='box'} onClick={()=>begin('box')}>Box</button><button disabled={!instance} onClick={viewport}>Map view</button>{selection&&<button onClick={clear}>Clear</button>}</div>}
      {mode?<div className="area-drawing-hint" role="status"><p>{mode==='circle'?(anchored?'Click the circle edge.':'Click the circle centre.'):(anchored?'Click the opposite corner.':'Click the first box corner.')}</p><button onClick={cancel}>Cancel drawing</button></div>:<div className="area-panel-body">
        {!selection&&<p>Draw a circle or box, or use the current map view. Stats follow the company filters and sourced office points.</p>}
        {busy&&<p role="status">Calculating area stats…</p>}
        {error&&<p role="alert">{error}</p>}
        {summary&&<>
          <p className="area-shape-label">{selection?.type==='Circle'?`${(selection.radius_m/1000).toFixed(2)} km radius`:'Selected map area'}</p>
          <dl className="area-metrics"><div><dt>Companies</dt><dd>{summary.companies.length}</dd></div><div><dt>Reported funding</dt><dd title={summary.funding.reported_usd?formatUsd(summary.funding.reported_usd):'No disclosed amount'}>{compactUsd(summary.funding.reported_usd)}</dd></div><div><dt>Funding events</dt><dd>{summary.funding.events}</dd></div><div><dt>Related headlines</dt><dd>{summary.news.count}</dd></div></dl>
          <p className="area-qualification">Company funding history associated with offices here; it does not measure money invested in this area. {summary.funding.unpriced_events>0&&`${summary.funding.unpriced_events} ${summary.funding.unpriced_events===1?'event has':'events have'} unknown or excluded amounts.`}</p>
          <h3>Jobs at these employers</h3><p><strong>{summary.jobs.employer_city_count??'Unavailable'}</strong> city-level postings{summary.jobs.employers_covered>0?` · ${summary.jobs.employers_covered} employer ${summary.jobs.employers_covered===1?'board':'boards'}`:''}.</p><p className="area-qualification">Exact job sites are unknown. These postings include the office city, not necessarily this area.{summary.jobs.stale_employers>0&&` ${summary.jobs.stale_employers} stale boards omitted.`}</p>
          {summary.jobs.items.length>0&&<details><summary>View job postings</summary><ul>{summary.jobs.items.slice(0,10).map(j=><li key={`${j.source_id}:${j.id}`}><a href={j.url} target="_blank" rel="noreferrer">{j.title}</a><small>{j.location}</small></li>)}</ul></details>}
          <h3>Sectors</h3>{summary.sectors.length?<><ul className="area-sectors">{summary.sectors.slice(0,6).map(s=><li key={s.label}><span>{s.label}</span><strong>{s.count}</strong></li>)}</ul>{summary.sectors.length>6&&<details><summary>All {summary.sectors.length} sector labels</summary><ul className="area-sectors">{summary.sectors.slice(6).map(s=><li key={s.label}><span>{s.label}</span><strong>{s.count}</strong></li>)}</ul></details>}</>:<p>No sourced offices found in this selection.</p>}
          <h3>Related news</h3>{summary.news.count>6&&<p className="area-qualification">Latest 6 of {summary.news.count} linked headlines.</p>}<p className="area-qualification">Coverage mentioning these companies; articles may concern operations elsewhere.</p>{summary.news.items.length?<ul>{summary.news.items.slice(0,6).map(n=><li key={n.id}><Link href={newsStoryHref(n.id)}>{n.title}</Link><small>{n.source_name} · {displayDate(n.published_at)}</small></li>)}</ul>:<p>No linked headlines in the retained feeds.</p>}
          <h3>Rents</h3><p>Not connected yet.</p>
          <details className="area-coverage"><summary>Coverage & source dates</summary><p>{summary.coverage.located_companies} of {summary.coverage.eligible_companies} matching companies have sourced office points. {summary.coverage.unlocated_companies} cannot be placed in or outside this area.</p><p>Building/campus centres on the boundary count. Offices last checked {displayDate(summary.coverage.office_checked_to)}; this does not confirm present occupancy.</p><p>Funding snapshot: {displayDate(summary.coverage.funding_checked_at)}. Jobs: {displayDate(summary.coverage.jobs_checked_at)}. News: {displayDate(summary.coverage.news_checked_at)}.</p><Link href="/sources#area-statistics">Area data policy</Link></details>
        </>}
      </div>}
      {mode&&error&&<p role="alert" className="area-drawing-hint">{error}</p>}
    </section>}
  </>;
}
