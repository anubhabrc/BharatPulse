'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import type {Map as GLMap,GeoJSONSource} from 'maplibre-gl';
import type {MapCompany,MapHub,StartupMapPayload} from '@/domain/startup-map';
import type {ArchiveCompany} from '@/domain/notion-archive';
import {compactUsd,companyInitials,companyColor,displayDate} from '@/domain/presentation';
import {formatUsd} from '@/domain/money';
import {loadMapLibrary} from './map-resources';
import {Icon} from './icons';
import 'maplibre-gl/dist/maplibre-gl.css';
interface Props {data:StartupMapPayload;selectedCompany:MapCompany|null;onSelectCompany:(company:MapCompany)=>void;onCloseCompany:()=>void}
const BASEMAP='https://tiles.openfreemap.org/styles/positron';
const INDIA:[number,number,number,number]=[68,7,97,35];
function fitResults(instance:GLMap,payload:StartupMapPayload){
  if(payload.hubs.length===1){const city=payload.hubs[0];instance.easeTo({center:[city.longitude,city.latitude],zoom:6.5,duration:0,padding:{top:70,bottom:50,left:40,right:40}});return;}
  const bounds:typeof INDIA=payload.hubs.length?[Math.min(...payload.hubs.map(h=>h.longitude))-1,Math.min(...payload.hubs.map(h=>h.latitude))-.7,Math.max(...payload.hubs.map(h=>h.longitude))+1,Math.max(...payload.hubs.map(h=>h.latitude))+.7]:INDIA;
  const wide=instance.getContainer().clientWidth>700,short=instance.getContainer().clientHeight<450;
  instance.fitBounds(bounds,{padding:wide?{top:65,bottom:85,left:190,right:55}:{top:short?115:150,bottom:short?95:75,left:30,right:45},maxZoom:5,duration:0});
}
export default function StartupMap({data,selectedCompany,onSelectCompany,onCloseCompany}:Props) {
  const inspectorBody=useRef<HTMLDivElement>(null);
  const outer=useRef<HTMLDivElement>(null),container=useRef<HTMLDivElement>(null),map=useRef<GLMap|null>(null);
  const latest=useRef(data);latest.current=data;
  const actions=useRef({onCloseCompany});actions.current={onCloseCompany};
  const [hub,setHub]=useState<MapHub|null>(null),[ready,setReady]=useState(false),[basemapLoaded,setBasemapLoaded]=useState(false),[error,setError]=useState('');
  const [details,setDetails]=useState<ArchiveCompany|null>(null),[detailError,setDetailError]=useState(false);
  const selectedSlug=selectedCompany?.slug;
  useEffect(()=>{
    let disposed=false,instance:GLMap|undefined,observer:ResizeObserver|undefined;
    loadMapLibrary().then(gl=>{
      if(disposed||!container.current)return;
      instance=new gl.Map({container:container.current,style:BASEMAP,center:[79.5,22],zoom:3.5,minZoom:2,maxZoom:14,cooperativeGestures:true,attributionControl:{compact:true}});
      map.current=instance;
      instance.addControl(new gl.NavigationControl({showCompass:false}),'top-right');
      if(outer.current)instance.addControl(new gl.FullscreenControl({container:outer.current}),'top-right');
      fitResults(instance,latest.current);
      observer=new ResizeObserver(()=>{if(!disposed)instance?.resize();});observer.observe(container.current);
      instance.on('error',()=>{if(!disposed)setError('Some map details could not load. The directory and company profiles are still available.');});
      instance.on('load',()=>{if(!disposed)setBasemapLoaded(true);});
      instance.on('style.load',()=>{
        if(disposed||!instance)return;
        for(const layer of instance.getStyle().layers){if(layer.type==='symbol'&&layer.id.startsWith('label_')){instance.setLayoutProperty(layer.id,'text-field',['coalesce',['get','name_en'],['get','name:latin'],['get','name']]);instance.setPaintProperty(layer.id,'text-color','#787984');if(layer.id.startsWith('label_country'))instance.setLayoutProperty(layer.id,'text-size',12);}}
        if(instance.getLayer('water'))instance.setPaintProperty('water','fill-color','#dce2eb');
        const count:['coalesce',['get',string],['get',string]]=['coalesce',['get','companies'],['get','company_count']];
        instance.addSource('startups',{type:'geojson',data:{type:'FeatureCollection',features:latest.current.features},cluster:true,clusterRadius:35,clusterMaxZoom:6,clusterProperties:{companies:['+',['get','company_count']]}});
        instance.addLayer({id:'hub-shadows',type:'circle',source:'startups',paint:{'circle-color':'#191919','circle-translate':[3,3],'circle-radius':['interpolate',['linear'],count,1,14,100,23,1000,32]}});
        instance.addLayer({id:'hubs',type:'circle',source:'startups',paint:{'circle-color':['step',count,'#bff1d2',10,'#ffe680',100,'#b9a4fa'],'circle-stroke-color':'#191919','circle-stroke-width':2,'circle-radius':['interpolate',['linear'],count,1,14,100,23,1000,32]}});
        instance.addLayer({id:'counts',type:'symbol',source:'startups',layout:{'text-field':['to-string',count],'text-font':['Noto Sans Regular'],'text-size':14,'text-allow-overlap':true},paint:{'text-color':'#191919'}});
        instance.addSource('selected-city',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
        instance.addLayer({id:'selected-city-ring',type:'circle',source:'selected-city',paint:{'circle-radius':34,'circle-color':'#b9a4fa','circle-opacity':0.15,'circle-stroke-color':'#191919','circle-stroke-width':3}});
        instance.once('idle',()=>{if(!disposed)setBasemapLoaded(true);});
        setReady(true);setError('');
      });
      instance.on('mouseenter','hubs',()=>{instance!.getCanvas().style.cursor='pointer';});
      instance.on('mouseleave','hubs',()=>{instance!.getCanvas().style.cursor='';});
      instance.on('click','hubs',async event=>{
        const feature=event.features?.[0];if(!feature||!instance)return;
        if(feature.properties.cluster){
          try{const zoom=await(instance.getSource('startups') as GeoJSONSource).getClusterExpansionZoom(Number(feature.properties.cluster_id));if(!disposed&&feature.geometry.type==='Point')instance.easeTo({center:feature.geometry.coordinates as [number,number],zoom});}catch{/* The map can be removed during a navigation. */}
        }else{const found=latest.current.hubs.find(h=>h.id===feature.properties.hub_id);if(found){actions.current.onCloseCompany();setHub(found);}}
      });
    }).catch(()=>{if(!disposed)setError('The interactive map could not start in this browser. Explore company profiles from the directory.');});
    return()=>{disposed=true;observer?.disconnect();map.current=null;instance?.remove();};
  },[]);
  // Filter changes replace the small GeoJSON source, preserving the WebGL map.
  useEffect(()=>{
    const instance=map.current;if(!ready||!instance)return;
    (instance.getSource('startups') as GeoJSONSource|undefined)?.setData({type:'FeatureCollection',features:data.features});
    setHub(null);
    fitResults(instance,data);
  },[data,ready]);
  useEffect(()=>{
    if(!ready||!map.current)return;
    if(!selectedCompany){(map.current.getSource('selected-city') as GeoJSONSource|undefined)?.setData({type:'FeatureCollection',features:[]});return;}
    const city=data.hubs.find(h=>h.id===selectedCompany.hub_id);setHub(null);
    const source=map.current.getSource('selected-city') as GeoJSONSource|undefined;
    source?.setData({type:'FeatureCollection',features:city?[{type:'Feature',geometry:{type:'Point',coordinates:[city.longitude,city.latitude]},properties:{}}]:[]});
    if(city)map.current.flyTo({center:[city.longitude,city.latitude],zoom:6.5,padding:{top:70,bottom:50,left:40,right:window.innerWidth>1100?320:40},duration:window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:650});
  },[selectedCompany,data,ready]);
  useEffect(()=>{
    setDetails(null);setDetailError(false);if(!selectedSlug)return;
    const controller=new AbortController();
    fetch(`/api/companies/${encodeURIComponent(selectedSlug)}`,{signal:controller.signal}).then(async response=>{if(!response.ok)throw new Error('Profile unavailable');const payload=await response.json();if(!controller.signal.aborted)setDetails(payload.company as ArchiveCompany);}).catch(()=>{if(!controller.signal.aborted)setDetailError(true);});
    return()=>controller.abort();
  },[selectedSlug]);
  function dismiss(){onCloseCompany();setHub(null);(map.current?.getSource('selected-city') as GeoJSONSource|undefined)?.setData({type:'FeatureCollection',features:[]});}
  function reset(){dismiss();if(map.current)fitResults(map.current,data);}
  function chooseHub(id:string){const found=data.hubs.find(h=>h.id===id);onCloseCompany();setHub(found??null);if(found)map.current?.flyTo({center:[found.longitude,found.latitude],zoom:6.5,duration:0});else reset();}
  useEffect(()=>{if(!selectedCompany&&!hub)return;const close=(event:KeyboardEvent)=>{if(event.key==='Escape'){onCloseCompany();setHub(null);}};document.addEventListener('keydown',close);return()=>document.removeEventListener('keydown',close);},[selectedCompany,hub,onCloseCompany]);
  useEffect(()=>{if(inspectorBody.current)inspectorBody.current.scrollTop=0;},[selectedSlug,hub?.id]);
  const active=selectedCompany?.hub_id??hub?.id??'';
  return <div ref={outer} className="startup-atlas" data-map-ready={basemapLoaded}>
    <div ref={container} className="map-canvas" aria-label="Interactive map of Indian startup city hubs"/>
    {!basemapLoaded&&!error&&<div className="map-boot" role="status"><span className="boot-mark"><Icon name="globe" size={32}/></span><strong>Putting the ecosystem on the map.</strong><span>Loading India’s startup atlas…</span></div>}
    <div className="atlas-topline"><div className="atlas-title"><span className="atlas-label"><Icon name="layers" size={15}/> STARTUP ATLAS</span><h2>Big ideas. Everywhere.</h2></div><div className="atlas-tools"><label className="sr-only" htmlFor="map-city">Explore a city hub</label><select id="map-city" value={active} onChange={event=>chooseHub(event.target.value)}><option value="">All matching hubs</option>{data.hubs.map(city=><option key={city.id} value={city.id}>{city.name} · {city.company_count}</option>)}</select><button className="icon-button reset-map" aria-label="Reset map view" title="Reset map view" onClick={reset}><Icon name="reset" size={18}/></button></div></div>
    {!selectedCompany&&!hub&&data.featured.length>0&&<div className="popular-dock"><span>ON OUR RADAR</span><div>{data.featured.map(company=><button key={company.slug} onClick={()=>onSelectCompany(company)}><span style={{background:companyColor(company.name)}}>{companyInitials(company.name)}</span>{company.name}</button>)}</div></div>}
    {error&&<div role="status" className="map-error"><p>{error}</p><button onClick={()=>{setError('');setBasemapLoaded(false);if(map.current)map.current.setStyle(BASEMAP,{diff:false});else window.location.reload();}}>Retry basemap</button></div>}
    {(selectedCompany||hub)&&<section className="map-inspector" aria-label={selectedCompany?`${selectedCompany.name} company details`:`${hub!.name} city hub`}>
      <div className="inspector-heading"><span>{selectedCompany?'COMPANY SPOTLIGHT':'CITY SPOTLIGHT'}</span><button className="icon-button" aria-label="Close map details" onClick={dismiss}><Icon name="close" size={16}/></button></div>
      <div ref={inspectorBody} className="inspector-content">{selectedCompany?<><div className="inspector-company"><span className="company-monogram" style={{background:companyColor(selectedCompany.name)}}>{companyInitials(selectedCompany.name)}</span><div><h2>{selectedCompany.name}</h2><p><Icon name="pin" size={14}/>{selectedCompany.city}</p></div></div><span className="sector-badge">{selectedCompany.sector??'Sector not reported'}</span>{selectedCompany.description&&<p className="inspector-description">{selectedCompany.description}</p>}
        {selectedCompany.founders.length>0&&<div className="inspector-founders"><span>FOUNDERS</span><p>{selectedCompany.founders.join(' · ')}</p></div>}
        {details?.slug===selectedCompany.slug?<><div className="inspector-funding"><div><span>Funding · all captured events</span><strong title={details.tracked_amount_usd?formatUsd(details.tracked_amount_usd):'Undisclosed'}>{compactUsd(details.tracked_amount_usd)}</strong></div><div><span>Events captured</span><strong>{details.rounds.length}</strong></div></div><p className="inspector-date">Latest announcement · {displayDate(details.latest_announced_on)}</p></>:<p className="inspector-date" role="status">{detailError?'Funding summary unavailable. Open the full profile for sources.':'Loading funding history…'}</p>}
        <p className="accuracy-note"><Icon name="pin" size={14}/>{selectedCompany.hub_id?'City centre · approximate location':'This HQ location has not been mapped'}</p>
      </>:<><h2 className="city-inspector-title">{hub!.name}</h2><p className="city-inspector-count"><strong>{hub!.company_count}</strong> companies in these results</p><div className="hub-companies">{hub!.companies.map(company=><button key={company.slug} onClick={()=>onSelectCompany(company)}><span className="mini-monogram" style={{background:companyColor(company.name)}}>{companyInitials(company.name)}</span><span>{company.name}<small>{company.sector??'Sector not reported'}</small></span><Icon name="pin" size={15}/></button>)}</div><small>Up to eight companies, using the directory sort order.</small></>}
    </div><div className="inspector-actions">{selectedCompany?<Link href={`/company/${selectedCompany.slug}`} className="button-link">Full profile & sources</Link>:<Link href={`/?city=${encodeURIComponent(hub!.reported_cities[0])}`} className="button-link">Browse {hub!.reported_cities[0]} records</Link>}</div></section>}
    <div className="atlas-bottomline"><div className="map-legend"><span className="legend-title">COMPANIES PER HUB</span><span><i className="legend-dot mint"/>1–9</span><span><i className="legend-dot yellow"/>10–99</span><span><i className="legend-dot purple"/>100+</span></div><div className="map-coverage"><Icon name="pin" size={14}/><strong>{data.mapped_companies.toLocaleString('en-IN')}</strong> on map<span>· {data.unmapped_companies} unlocated</span></div></div>
    <div className="atlas-disclosure">City-level hubs, not verified offices. <Link href="/sources">Data & accuracy</Link></div>
  </div>;
}
