'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import type {Map as GLMap,GeoJSONSource,ExpressionSpecification} from 'maplibre-gl';
import type {MapCompany,MapHub,StartupMapPayload} from '@/domain/startup-map';
import type {ArchiveCompany} from '@/domain/notion-archive';
import type {NewsItem} from '@/domain/news';
type CompanyDetail=ArchiveCompany&{linked_news?:NewsItem[];job_summary?:{stale:boolean;india:number|null;bengaluru:number|null;total:number|null;checked_at:string|null}};
import {compactUsd,companyInitials,companyColor,displayDate} from '@/domain/presentation';
import {officeKindLabel,officeAccuracyLabel} from '@/domain/office-labels';
import {sectorStyle} from '@/domain/map-presentation';
import {formatUsd} from '@/domain/money';
import {loadMapLibrary} from './map-resources';
import {localBasemapRequest} from '@/domain/basemap';
import {automaticBasemap,streetRoadColor} from '@/domain/map-palette';
import {Icon} from './icons';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Props {data:StartupMapPayload;selectedCompany:MapCompany|null;onSelectCompany:(company:MapCompany)=>void;onCloseCompany:()=>void}
const STYLES={streets:{name:'Streets',url:'/api/basemap/styles/liberty'},light:{name:'Light',url:'/api/basemap/styles/positron'},dark:{name:'Night',url:'/api/basemap/styles/dark'}};
type Basemap=keyof typeof STYLES;
const areas=[{name:'Indiranagar',match:/indiranagar/i},{name:'Koramangala',match:/koramangala/i},{name:'HSR Layout',match:/\bhsr\b/i},{name:'Bellandur / ORR',match:/bellandur|kadubeesanahalli|devarabeesanahalli|marathahalli/i},{name:'Whitefield',match:/whitefield|itpl|hoodi|mahadevapura/i}];
const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const duration=(value=650)=>reduced()?0:value;
function fitOffices(instance:GLMap,companies:MapCompany[],animate=true){
  const points=companies.flatMap(c=>c.office?[[c.office.longitude,c.office.latitude]]:[]);if(!points.length)return;
  const short=instance.getContainer().clientHeight<450;
  instance.fitBounds([Math.min(...points.map(p=>p[0]))-.006,Math.min(...points.map(p=>p[1]))-.006,Math.max(...points.map(p=>p[0]))+.006,Math.max(...points.map(p=>p[1]))+.006],{padding:{top:short?105:95,bottom:short?110:115,left:45,right:65},maxZoom:14,bearing:0,pitch:0,duration:animate?duration():0});
}
function startView(instance:GLMap,payload:StartupMapPayload,animate=false){
  if(payload.hubs.length===1&&payload.offices.length){
    if(payload.matched_companies<10){fitOffices(instance,payload.offices,animate);return;}
    instance.easeTo({center:[77.637,12.971],zoom:instance.getContainer().clientWidth<550?10.9:11.65,bearing:0,pitch:0,padding:{top:0,bottom:0,left:0,right:0},duration:animate?duration():0});return;
  }
  if(payload.hubs.length===1){const h=payload.hubs[0];instance.easeTo({center:[h.longitude,h.latitude],zoom:10,padding:{top:0,bottom:0,left:0,right:0},bearing:0,pitch:0,duration:animate?duration():0});return;}
  const hubs=payload.hubs;
  instance.fitBounds(hubs.length?[Math.min(...hubs.map(h=>h.longitude))-1,Math.min(...hubs.map(h=>h.latitude))-.7,Math.max(...hubs.map(h=>h.longitude))+1,Math.max(...hubs.map(h=>h.latitude))+.7]:[68,7,97,35],{padding:{top:80,bottom:110,left:35,right:60},maxZoom:5,bearing:0,pitch:0,duration:animate?duration():0});
}
function sourceKey(payload:StartupMapPayload){return JSON.stringify([payload.features.map(f=>[f.id,f.geometry.coordinates,f.properties?.company_count]).sort(),payload.office_features.map(f=>[f.id,f.geometry.coordinates,f.properties]).sort()]);}
export default function StartupMap({data,selectedCompany,onSelectCompany,onCloseCompany}:Props){
  const outer=useRef<HTMLDivElement>(null),container=useRef<HTMLDivElement>(null),map=useRef<GLMap|null>(null),body=useRef<HTMLDivElement>(null);
  const latest=useRef(data);latest.current=data;
  const callbacks=useRef({onCloseCompany,onSelectCompany});callbacks.current={onCloseCompany,onSelectCompany};
  const lastFit=useRef(''),key=sourceKey(data);
  const [ready,setReady]=useState(false),[loaded,setLoaded]=useState(false),[error,setError]=useState('');
  const [basemap,setBasemap]=useState<Basemap>('streets'),styleRef=useRef<Basemap>('streets');
  const [view,setView]=useState({zoom:11.65,offices:0,street:true}),[tilted,setTilted]=useState(false),[help,setHelp]=useState(false),[area,setArea]=useState('');
  const [hub,setHub]=useState<MapHub|null>(null),[place,setPlace]=useState<MapCompany[]>([]);
  const [hover,setHover]=useState<{name:string;label:string;x:number;y:number}|null>(null);
  const [details,setDetails]=useState<CompanyDetail|null>(null),[detailError,setDetailError]=useState(false);
  const selectedSlug=selectedCompany?.slug;
  useEffect(()=>{
    let disposed=false,instance:GLMap|undefined,observer:ResizeObserver|undefined,removeKeys:(()=>void)|undefined,removeClock:(()=>void)|undefined;
    loadMapLibrary().then(gl=>{
      if(disposed||!container.current)return;
      let clockStyle=automaticBasemap();styleRef.current=clockStyle;setBasemap(clockStyle);
      instance=new gl.Map({container:container.current,style:STYLES[clockStyle].url,transformRequest:url=>({url:localBasemapRequest(url)}),center:[77.637,12.971],zoom:11.65,minZoom:3,maxZoom:19,maxPitch:60,cooperativeGestures:false,keyboard:true,dragPan:{linearity:.3,deceleration:2500,maxSpeed:1400},fadeDuration:180,pixelRatio:Math.min(window.devicePixelRatio,2),maxTileCacheZoomLevels:4,attributionControl:{compact:true}});
      map.current=instance;instance.scrollZoom.setWheelZoomRate(1/600);instance.scrollZoom.setZoomRate(1/110);
      instance.addControl(new gl.NavigationControl({showCompass:true,visualizePitch:true}),'top-right');
      if(outer.current)instance.addControl(new gl.FullscreenControl({container:outer.current}),'top-right');
      instance.addControl(new gl.ScaleControl({maxWidth:100,unit:'metric'}),'bottom-right');
      const canvas=instance.getCanvas();canvas.setAttribute('aria-label','Startup map. Arrow keys pan; plus and minus zoom. Press question mark for all controls.');canvas.setAttribute('aria-describedby','map-keyboard-help');
      const keys=(event:KeyboardEvent)=>{if(event.key==='Home'){event.preventDefault();startView(instance!,latest.current,true);}else if(event.key==='0'){event.preventDefault();instance!.easeTo({bearing:0,pitch:0,duration:duration(350)});}else if(event.key==='?'){event.preventDefault();setHelp(value=>!value);}};
      canvas.addEventListener('keydown',keys);removeKeys=()=>canvas.removeEventListener('keydown',keys);
      startView(instance,latest.current);lastFit.current=sourceKey(latest.current);
      const updateView=()=>{if(disposed||!instance)return;const n=latest.current.offices.filter(c=>c.office&&instance!.getBounds().contains([c.office.longitude,c.office.latitude])).length;setView({zoom:Number(instance.getZoom().toFixed(1)),offices:n,street:instance.getZoom()>=9&&n>0});setTilted(instance.getPitch()>15);};
      instance.on('moveend',updateView);instance.on('movestart',()=>setHover(null));updateView();
      observer=new ResizeObserver(()=>instance?.resize());observer.observe(container.current);
      instance.on('error',()=>{if(!disposed&&!instance?.isStyleLoaded())setError('Some map details could not load. Your company directory is still available.');});
      instance.on('load',()=>{if(!disposed){setLoaded(true);setError('');}});
      instance.on('idle',()=>{if(!disposed&&instance?.isStyleLoaded()){setLoaded(true);setError('');}});
      instance.on('style.load',()=>{
        if(disposed||!instance)return;
        // Keep roads, parks, water, POIs and building detail from the actual basemap.
        const dark=styleRef.current==='dark';
        if(styleRef.current==='streets')for(const layer of instance.getStyle().layers){const color=layer.type==='line'?streetRoadColor(layer.id):null;if(color)instance.setPaintProperty(layer.id,'line-color',color);}
        if(dark)for(const layer of instance.getStyle().layers){
          if(layer.type==='background')instance.setPaintProperty(layer.id,'background-color','#111827');
          if(layer.type==='fill')instance.setPaintProperty(layer.id,'fill-color',layer.id==='water'?'#182e4b':/park|wood/.test(layer.id)?'#183631':layer.id==='building'?'#26344b':'#172236');
          if(layer.type==='line'&&/highway|road/.test(layer.id))instance.setPaintProperty(layer.id,'line-color',/casing|subtle/.test(layer.id)?'#1d2b42':/major|motorway/.test(layer.id)?'#425574':'#293b54');
          if(layer.type==='symbol'&&layer.layout?.['text-field']){instance.setPaintProperty(layer.id,'text-color','#bfcbe2');instance.setPaintProperty(layer.id,'text-halo-color','#111827');instance.setPaintProperty(layer.id,'text-halo-width',1.2);}
        }
        const count:ExpressionSpecification=['coalesce',['get','companies'],['get','company_count']];
        instance.addSource('startups',{type:'geojson',data:{type:'FeatureCollection',features:latest.current.features},cluster:true,clusterRadius:40,clusterMaxZoom:6,clusterProperties:{companies:['+',['get','company_count']]}});
        instance.addLayer({id:'hubs',type:'circle',source:'startups',paint:{'circle-color':'#e6def5','circle-stroke-color':'#17191e','circle-stroke-width':2,'circle-radius':['interpolate',['linear'],count,1,15,100,24,1000,32],'circle-opacity':['step',['zoom'],1,9,['case',['boolean',['get','has_offices'],false],0,1]],'circle-stroke-opacity':['step',['zoom'],1,9,['case',['boolean',['get','has_offices'],false],0,1]]}});
        instance.addLayer({id:'hub-counts',type:'symbol',source:'startups',layout:{'text-field':['to-string',count],'text-font':['Noto Sans Bold'],'text-size':13,'text-allow-overlap':true},paint:{'text-color':'#17191e','text-opacity':['step',['zoom'],1,9,['case',['boolean',['get','has_offices'],false],0,1]]}});
        instance.addSource('offices',{type:'geojson',data:{type:'FeatureCollection',features:latest.current.office_features},cluster:true,clusterRadius:38,clusterMaxZoom:16});
        instance.addLayer({id:'office-clusters',type:'circle',source:'offices',filter:['has','point_count'],minzoom:8,paint:{'circle-color':'#ffe277','circle-stroke-color':'#17191e','circle-stroke-width':2,'circle-radius':['step',['get','point_count'],18,10,23,30,27]}});
        instance.addLayer({id:'office-cluster-counts',type:'symbol',source:'offices',filter:['has','point_count'],minzoom:8,layout:{'text-field':['to-string',['get','point_count']],'text-font':['Noto Sans Bold'],'text-size':13,'text-allow-overlap':true},paint:{'text-color':'#17191e'}});
        instance.addLayer({id:'office-pins',type:'circle',source:'offices',filter:['!', ['has','point_count']],minzoom:8,paint:{'circle-color':['get','color'],'circle-radius':['interpolate',['linear'],['zoom'],9,9,12,13],'circle-stroke-color':'#ffffff','circle-stroke-width':2.5}});
        instance.addLayer({id:'office-initials',type:'symbol',source:'offices',filter:['!', ['has','point_count']],minzoom:10,layout:{'text-field':['get','initials'],'text-font':['Noto Sans Bold'],'text-size':10,'text-allow-overlap':true,'text-ignore-placement':true},paint:{'text-color':'#ffffff'}});
        instance.addLayer({id:'office-labels',type:'symbol',source:'offices',filter:['!', ['has','point_count']],minzoom:12,layout:{'text-field':['get','name'],'text-font':['Noto Sans Bold'],'text-size':12,'text-anchor':'top','text-offset':[0,1.35],'text-variable-anchor':['top','bottom','left','right'],'text-radial-offset':1.4},paint:{'text-color':dark?'#ffffff':'#202127','text-halo-color':dark?'#171924':'#ffffff','text-halo-width':2}});
        instance.addSource('selected-office',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
        instance.addLayer({id:'selected-office-ring',type:'circle',source:'selected-office',paint:{'circle-radius':21,'circle-color':'#ffe277','circle-opacity':.12,'circle-stroke-color':dark?'#ffe277':'#17191e','circle-stroke-width':3}});
        setReady(true);setError('');updateView();
      });
      const interactive=['office-pins','office-initials','office-labels','office-clusters','office-cluster-counts','hubs'];
      for(const layer of interactive){instance.on('mouseenter',layer,event=>{instance!.getCanvas().style.cursor='pointer';const f=event.features?.[0];if(f?.geometry.type!=='Point')return;const p=instance!.project(f.geometry.coordinates as [number,number]),company=latest.current.offices.find(c=>c.slug===f.properties.slug);setHover({name:company?.name??(f.properties.city?`${f.properties.city} · ${f.properties.company_count}`:`${f.properties.point_count??f.properties.company_count} companies`),label:company?.office?.place_name??(f.properties.hub_id?'Approximate city centre':'Click to explore this cluster'),x:p.x,y:p.y});});instance.on('mouseleave',layer,()=>{instance!.getCanvas().style.cursor='';setHover(null);});}
      instance.on('click',['office-pins','office-initials','office-labels'],event=>{
        if(!instance)return;setHover(null);setHub(null);
        const rendered=instance.queryRenderedFeatures([[event.point.x-8,event.point.y-8],[event.point.x+8,event.point.y+8]],{layers:['office-pins']});
        const slugs=new Set(rendered.map(f=>f.properties.slug));if(event.features?.[0])slugs.add(event.features[0].properties.slug);
        const companies=latest.current.offices.filter(c=>slugs.has(c.slug));
        if(companies.length>1){callbacks.current.onCloseCompany();setPlace(companies);}else if(companies[0]){setPlace([]);callbacks.current.onSelectCompany(companies[0]);}
      });
      instance.on('click','office-clusters',async event=>{
        const f=event.features?.[0];if(!f||!instance)return;
        try{
          const source=instance.getSource('offices') as GeoJSONSource,leaves=await source.getClusterLeaves(Number(f.properties.cluster_id),100,0);
          if(disposed)return;const positions=new Set(leaves.map(leaf=>JSON.stringify(leaf.geometry)));
          if(positions.size===1&&leaves.length===Number(f.properties.point_count)){const slugs=new Set(leaves.map(leaf=>leaf.properties?.slug));callbacks.current.onCloseCompany();setHub(null);setPlace(latest.current.offices.filter(c=>slugs.has(c.slug)));return;}
          const zoom=await source.getClusterExpansionZoom(Number(f.properties.cluster_id));if(!disposed&&f.geometry.type==='Point')instance.easeTo({center:f.geometry.coordinates as [number,number],zoom:Math.min(zoom+.3,18),duration:duration(500)});
        }catch{/* A navigation can remove a source during expansion. */}
      });
      instance.on('click','hubs',async event=>{
        const f=event.features?.[0];if(!f||!instance)return;
        if(f.properties.cluster){try{const zoom=await(instance.getSource('startups') as GeoJSONSource).getClusterExpansionZoom(Number(f.properties.cluster_id));if(!disposed&&f.geometry.type==='Point')instance.easeTo({center:f.geometry.coordinates as [number,number],zoom,duration:duration(500)});}catch{}return;}
        const city=latest.current.hubs.find(h=>h.id===f.properties.hub_id);if(!city||instance.getZoom()>=9&&f.properties.has_offices)return;
        callbacks.current.onCloseCompany();setPlace([]);const located=latest.current.offices.filter(c=>c.hub_id===city.id);if(located.length){setHub(null);fitOffices(instance,located);}else setHub(city);
      });
      // Manual choices last until the next day/night boundary.
      const syncClock=()=>{const next=automaticBasemap();if(disposed||!instance||next===clockStyle)return;clockStyle=next;styleRef.current=next;setBasemap(next);setReady(false);setLoaded(false);instance.setStyle(STYLES[next].url,{diff:false});};
      const timer=setInterval(syncClock,60000);document.addEventListener('visibilitychange',syncClock);window.addEventListener('focus',syncClock);
      removeClock=()=>{clearInterval(timer);document.removeEventListener('visibilitychange',syncClock);window.removeEventListener('focus',syncClock);};
    }).catch(()=>{if(!disposed)setError('The interactive map could not start. Company profiles remain available in the directory.');});
    return()=>{disposed=true;removeClock?.();removeKeys?.();observer?.disconnect();map.current=null;instance?.remove();};
  },[]);
  useEffect(()=>{
    const instance=map.current;if(!ready||!instance)return;
    (instance.getSource('startups') as GeoJSONSource|undefined)?.setData({type:'FeatureCollection',features:data.features});
    (instance.getSource('offices') as GeoJSONSource|undefined)?.setData({type:'FeatureCollection',features:data.office_features});
    if(lastFit.current!==key){setHub(null);setPlace([]);setArea('');startView(instance,data,true);lastFit.current=key;}
  },[key,ready]);
  useEffect(()=>{
    const instance=map.current;if(!ready||!instance)return;
    const office=selectedCompany?.office;if(selectedCompany){setHub(null);setPlace([]);}
    (instance.getSource('selected-office') as GeoJSONSource|undefined)?.setData({type:'FeatureCollection',features:office?[{type:'Feature',geometry:{type:'Point',coordinates:[office.longitude,office.latitude]},properties:{}}]:[]});
    if(office)instance.flyTo({center:[office.longitude,office.latitude],zoom:Math.max(14,Math.min(instance.getZoom(),17)),padding:{top:60,bottom:70,left:35,right:instance.getContainer().clientWidth>650?345:35},duration:duration(750),essential:false});
  },[selectedCompany,ready]);
  useEffect(()=>{
    setDetails(null);setDetailError(false);if(!selectedSlug)return;
    const controller=new AbortController();fetch(`/api/companies/${encodeURIComponent(selectedSlug)}`,{signal:controller.signal}).then(async response=>{if(!response.ok)throw new Error();const payload=await response.json();if(!controller.signal.aborted)setDetails({...payload.company,linked_news:payload.news,job_summary:payload.jobs});}).catch(()=>{if(!controller.signal.aborted)setDetailError(true);});return()=>controller.abort();
  },[selectedSlug]);
  useEffect(()=>{if(body.current)body.current.scrollTop=0;},[selectedSlug,place,hub?.id]);
  function dismiss(){onCloseCompany();setHub(null);setPlace([]);setHover(null);}
  useEffect(()=>{const close=(event:KeyboardEvent)=>{if(event.key==='Escape'){dismiss();setHelp(false);}};document.addEventListener('keydown',close);return()=>document.removeEventListener('keydown',close);},[onCloseCompany]);
  function changeStyle(next:Basemap){if(next===basemap)return;setBasemap(next);styleRef.current=next;setReady(false);setLoaded(false);map.current?.setStyle(STYLES[next].url,{diff:false});}
  function cityView(id:string){dismiss();setArea('');const city=data.hubs.find(h=>h.id===id);if(!map.current)return;if(!city){startView(map.current,data,true);return;}const located=data.offices.filter(c=>c.hub_id===city.id);if(located.length)fitOffices(map.current,located);else{setHub(city);map.current.easeTo({center:[city.longitude,city.latitude],zoom:10,duration:duration()});}}
  function areaView(name:string){dismiss();setArea(name);if(!map.current)return;const chosen=areas.find(a=>a.name===name);if(chosen)fitOffices(map.current,data.offices.filter(c=>c.office&&chosen.match.test(c.office.address)));else startView(map.current,data,true);}
  const officeMode=view.street&&data.offices.length>0;
  const active=selectedCompany?.hub_id??hub?.id??(officeMode?data.offices[0]?.hub_id:'');
  const availableAreas=areas.filter(a=>data.offices.some(c=>c.office&&a.match.test(c.office.address)));
  const title=data.hubs.length===1?data.hubs[0].name:officeMode?'Bengaluru':'India';
  const spotlight=selectedCompany||hub||place.length>0;
  return <div ref={outer} className="startup-atlas atlas-v2" data-map-ready={loaded} data-office-view={officeMode} data-basemap={basemap}>
    <div ref={container} className="map-canvas"/>
    {!loaded&&!error&&<div className="map-boot" role="status"><span className="boot-mark"><Icon name="globe" size={32}/></span><strong>Opening your city guide.</strong><span>Streets, neighbourhoods and the companies building here.</span></div>}
    <div className="atlas-toolbar"><div className="atlas-city-stamp"><span>THE STARTUP FIELD GUIDE</span><strong>{title}<i aria-hidden="true">✳</i></strong></div><div className="atlas-location-tools"><label className="sr-only" htmlFor="map-city">Explore a city hub</label><select id="map-city" value={active} onChange={e=>cityView(e.target.value)}><option value="">All matching cities</option>{data.hubs.map(h=><option key={h.id} value={h.id}>{h.name} · {h.company_count}</option>)}</select>{availableAreas.length>0&&<><label className="sr-only" htmlFor="map-area">Explore a neighbourhood</label><select id="map-area" value={area} onChange={e=>areaView(e.target.value)}><option value="">Neighbourhoods</option>{availableAreas.map(a=><option key={a.name}>{a.name}</option>)}</select></>}</div></div>
    <div className="atlas-action-stack"><button className="map-tool" aria-label="Fit all office locations" title="Fit all office locations" onClick={()=>{dismiss();setArea('');if(map.current){if(data.offices.length)fitOffices(map.current,data.offices);else startView(map.current,data,true);}}}><Icon name="reset" size={18}/><span>Fit</span></button><button className={`map-tool${tilted?' is-active':''}`} aria-label="Toggle 3D map view" aria-pressed={tilted} onClick={()=>map.current?.easeTo({pitch:tilted?0:45,duration:duration(450)})}><span className="map-tool-text">3D</span></button><button className={`map-tool${help?' is-active':''}`} aria-label="Map keyboard controls" aria-expanded={help} onClick={()=>setHelp(!help)}><span className="map-tool-text">?</span></button></div>
    {hover&&!spotlight&&<div className="map-hover-card" style={{left:Math.max(12,Math.min(hover.x-90,(container.current?.clientWidth??400)-215)),top:Math.max(75,hover.y-80)}}><strong>{hover.name}</strong><span>{hover.label}</span></div>}
    {error&&<div role="status" className="map-error"><p>{error}</p><button onClick={()=>{setError('');setReady(false);setLoaded(false);map.current?.setStyle(STYLES[basemap].url,{diff:false});}}>Retry basemap</button></div>}
    {spotlight&&<section className="map-inspector" aria-label={selectedCompany?`${selectedCompany.name} company details`:place.length?'Companies at this location':`${hub!.name} city hub`}><div className="inspector-heading"><span>{selectedCompany?'ON THE MAP':place.length?'SHARED OFFICE LOCATION':'CITY OVERVIEW'}</span><button className="icon-button" aria-label="Close map details" onClick={dismiss}><Icon name="close" size={16}/></button></div><div ref={body} className="inspector-content">{selectedCompany?<><div className="inspector-company"><span className="company-monogram" style={{background:companyColor(selectedCompany.name)}}>{companyInitials(selectedCompany.name)}</span><div><h2>{selectedCompany.name}</h2><p><Icon name="pin" size={14}/>{selectedCompany.office?.city??selectedCompany.city}</p></div></div><span className="sector-badge" style={{borderColor:sectorStyle(selectedCompany.sector).color}}>{selectedCompany.sector??'Sector not reported'}</span>
      {selectedCompany.description&&<p className="inspector-description">{selectedCompany.description}</p>}{selectedCompany.founders.length>0&&<div className="inspector-founders"><span>FOUNDERS</span><p>{selectedCompany.founders.join(' · ')}</p></div>}<InspectorSignals details={details?.slug===selectedCompany.slug?details:null}/>{selectedCompany.office?<div className="office-evidence"><span className="office-badge">{officeKindLabel[selectedCompany.office.kind]} · {selectedCompany.office.precision}</span><h3>{selectedCompany.office.place_name}</h3><details className="inspector-office-details"><summary>Office address & sources</summary><p>{selectedCompany.office.address}</p><small>Published for {selectedCompany.office.entity_name}</small><small>Source checked {displayDate(selectedCompany.office.checked_on)}</small><p className="office-context">{officeAccuracyLabel(selectedCompany.office)}</p><div><a href={selectedCompany.office.address_source_url} target="_blank" rel="noreferrer">Address source</a><a href={selectedCompany.office.coordinate_source_url} target="_blank" rel="noreferrer">Location source</a></div>{selectedCompany.reported_city&&selectedCompany.reported_city!==selectedCompany.office.city&&<small>Funding archive HQ label: {selectedCompany.reported_city}. The office above is sourced separately.</small>}</details></div>:<p className="accuracy-note"><Icon name="pin" size={14}/>Office address not located yet. This record has a city label only and is not placed at a guessed street location.</p>}
      {details?.slug===selectedCompany.slug?<>{details.directory_profile&&<div className="inspector-directory"><div className="company-tags">{details.directory_profile.tags.map(t=><a key={t.label} href={t.source_url} target="_blank" rel="noreferrer">{t.label}</a>)}</div>{details.directory_profile.headquarters&&<p>Global HQ: {details.directory_profile.headquarters.city}, {details.directory_profile.headquarters.country}</p>}{details.directory_profile.careers&&<a href={details.directory_profile.careers.url} target="_blank" rel="noreferrer">Explore careers</a>}</div>}{details.rounds.length?<><div className="inspector-funding"><div><span>Tracked funding</span><strong title={details.tracked_amount_usd?formatUsd(details.tracked_amount_usd):'Undisclosed'}>{compactUsd(details.tracked_amount_usd)}</strong></div><div><span>Events</span><strong>{details.rounds.length}</strong></div></div><p className="inspector-date">Latest announcement · {displayDate(details.latest_announced_on)}</p></>:<p className="inspector-date">Funding history is not tracked yet. This company was reviewed independently of funding.</p>}</>:<p className="inspector-date" role="status">{detailError?'Company summary unavailable. Open the profile for sources.':'Loading company details…'}</p>}</>:<><h2 className="city-inspector-title">{place.length?place[0].office?.place_name:hub!.name}</h2><p className="city-inspector-count"><strong>{place.length||hub!.company_count}</strong> companies{place.length?' at this location':' in this cohort'}</p><div className="hub-companies">{(place.length?place:hub!.companies).map(c=><button key={c.slug} onClick={()=>{setPlace([]);onSelectCompany(c);}}><span className="mini-monogram" style={{background:companyColor(c.name)}}>{companyInitials(c.name)}</span><span>{c.name}<small>{c.office?officeKindLabel[c.office.kind]:c.sector??'City-level record'}</small></span><Icon name="pin" size={15}/></button>)}</div><p className="inspector-date">{place.length?'These sources identify the same building or campus. Points keep their published coordinates.':'City totals describe the source cohort; they do not establish exact offices.'}</p></>}</div>{selectedCompany&&<div className="inspector-actions"><Link href={`/company/${selectedCompany.slug}`} className="button-link">Company profile & sources</Link></div>}</section>}
    <div className="atlas-map-styles" role="group" aria-label="Map appearance">{(Object.keys(STYLES) as Basemap[]).map(style=><button key={style} className={basemap===style?'is-active':''} aria-pressed={basemap===style} onClick={()=>changeStyle(style)}><i className={`style-swatch ${style}`} aria-hidden="true"/>{STYLES[style].name}</button>)}</div>
    <div className="atlas-status"><span className="status-pin"><Icon name="pin" size={18}/></span><div><strong>{data.offices.length} sourced offices <span>· {view.offices} in view</span></strong><small>{data.matched_companies.toLocaleString('en-IN')} company records · <Link href="/sources">Coverage & sources</Link></small></div></div>
    <div className="atlas-zoom-readout" aria-live="polite">Zoom {view.zoom.toFixed(1)}</div>
    <div id="map-keyboard-help" className={help?'map-keyboard-panel':'sr-only'}><strong>Make yourself at home.</strong><p>Click the map to focus it, then use:</p><dl><div><dt><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd></dt><dd>Pan</dd></div><div><dt><kbd>+</kbd><kbd>−</kbd></dt><dd>Zoom</dd></div><div><dt><kbd>Shift</kbd> + arrows</dt><dd>Rotate / tilt</dd></div><div><dt><kbd>Home</kbd></dt><dd>City view</dd></div><div><dt><kbd>0</kbd></dt><dd>North up, flat</dd></div><div><dt><kbd>Esc</kbd></dt><dd>Close details</dd></div></dl>{help&&<button onClick={()=>{setHelp(false);map.current?.getCanvas().focus();}}>Explore the map</button>}</div>
  </div>;
}

function InspectorSignals({details}:{details:CompanyDetail|null}){
  if(!details)return null;const jobs=details.job_summary;
  return <div className="inspector-signals">{jobs&&!jobs.stale&&jobs.india!==null&&jobs.india>0&&<Link className="inspector-jobs-link" href={`/company/${details.slug}#jobs`}>{jobs.india} India job postings · {jobs.bengaluru} include Bengaluru<small>Last checked {displayDate(jobs.checked_at)}</small></Link>}{!!details.linked_news?.length&&<div className="inspector-news"><span>LATEST COVERAGE</span>{details.linked_news.slice(0,2).map(item=><a key={item.id} href={item.url} target="_blank" rel="noreferrer"><small>{item.source_name} · {displayDate(item.published_at)}</small><strong>{item.title}</strong></a>)}</div>}</div>;
}
