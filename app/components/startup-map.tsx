'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import type {Map as GLMap,GeoJSONSource} from 'maplibre-gl';
import type {MapCompany,MapHub,StartupMapPayload} from '@/domain/startup-map';
import {loadMapLibrary} from './map-resources';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function StartupMap({data}:{data:StartupMapPayload}) {
  const container=useRef<HTMLDivElement>(null),map=useRef<GLMap|null>(null);
  const [selected,setSelected]=useState<MapHub|null>(null),[company,setCompany]=useState<MapCompany|null>(null);
  const [ready,setReady]=useState(false),[error,setError]=useState('');
  useEffect(()=>{
    let disposed=false,instance:GLMap|undefined;
    loadMapLibrary().then(gl=>{
      if(disposed||!container.current)return;
      instance=new gl.Map({container:container.current,style:'https://tiles.openfreemap.org/styles/dark',center:[79,22],zoom:3.5,minZoom:2,maxZoom:12,cooperativeGestures:true,attributionControl:{compact:true}});
      map.current=instance;
      instance.addControl(new gl.NavigationControl({showCompass:false}),'top-right');
      instance.on('error',()=>{if(!disposed)setError('Some map tiles could not load. Company links remain available below.');});
      instance.on('load',()=>{
        if(disposed||!instance)return;
        instance.addSource('startups',{type:'geojson',data:{type:'FeatureCollection',features:data.features},cluster:true,clusterRadius:44,clusterMaxZoom:6,clusterProperties:{companies:['+',['get','company_count']]}});
        instance.addLayer({id:'hubs',type:'circle',source:'startups',paint:{'circle-color':'#38c9db','circle-opacity':0.85,'circle-stroke-color':'#d9fcff','circle-stroke-width':1.5,'circle-radius':['interpolate',['linear'],['coalesce',['get','companies'],['get','company_count']],1,9,100,18,1000,29]}});
        instance.addLayer({id:'counts',type:'symbol',source:'startups',layout:{'text-field':['to-string',['coalesce',['get','companies'],['get','company_count']]],'text-font':['Noto Sans Regular'],'text-size':12,'text-allow-overlap':true},paint:{'text-color':'#06141b'}});
        instance.on('mouseenter','hubs',()=>{instance!.getCanvas().style.cursor='pointer';});
        instance.on('mouseleave','hubs',()=>{instance!.getCanvas().style.cursor='';});
        instance.on('click','hubs',async event=>{
          const feature=event.features?.[0];if(!feature||!instance)return;
          if(feature.properties.cluster){
            try{const zoom=await(instance.getSource('startups') as GeoJSONSource).getClusterExpansionZoom(Number(feature.properties.cluster_id));if(!disposed&&feature.geometry.type==='Point')instance.easeTo({center:feature.geometry.coordinates as [number,number],zoom});}catch{/* Map may have been removed while zooming. */}
          }else{const hub=data.hubs.find(h=>h.id===feature.properties.hub_id);if(hub){setSelected(hub);setCompany(null);}}
        });
        setReady(true);setError('');
      });
    }).catch(()=>{if(!disposed)setError('The interactive map is unavailable in this browser. You can still explore the companies below.');});
    return()=>{disposed=true;map.current=null;instance?.remove();};
  },[data]);
  function focusCompany(item:MapCompany){
    const hub=data.hubs.find(h=>h.id===item.hub_id);if(!hub)return;
    setSelected(hub);setCompany(item);
    map.current?.flyTo({center:[hub.longitude,hub.latitude],zoom:7,duration:window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:900});
  }
  return <div>
    <p className="map-caption">{data.mapped_companies.toLocaleString('en-IN')} companies across {data.hubs.length} city hubs · {data.unmapped_companies} without a matched city. Numbers count companies, not offices.</p>
    <div className="map-grid"><div className="map-stage"><div ref={container} className="map-canvas" aria-label="Interactive Indian startup city map"/>{!ready&&!error&&<p className="map-status" role="status">Loading the startup map…</p>}{error&&<p className="map-status" role="status">{error}</p>}</div>
      <div className="map-sidebar">
        <label htmlFor="map-city">Explore a city hub</label><select id="map-city" value={selected?.id??''} onChange={event=>{const hub=data.hubs.find(h=>h.id===event.target.value)??null;setSelected(hub);setCompany(null);if(hub)map.current?.flyTo({center:[hub.longitude,hub.latitude],zoom:7,duration:0});}}><option value="">Popular companies</option>{data.hubs.map(hub=><option key={hub.id} value={hub.id}>{hub.name} · {hub.company_count}</option>)}</select>
        <h3>{company?.name??selected?.name??'Popular companies'}</h3>
        {company?<><p>{company.description??company.sector}</p><small>Reported HQ: {company.city}</small>{company.founders.length>0&&<p><span className="muted">Founders</span><br/>{company.founders.join(' · ')}</p>}<Link href={`/company/${company.slug}`}>Company profile & sources →</Link><button className="text-button" onClick={()=>setCompany(null)}>See this city</button></>:selected?<><p className="muted">{selected.company_count} matching companies. Showing up to eight in the selected sort order.</p><div className="map-company-list">{selected.companies.map(item=><Link key={item.slug} href={`/company/${item.slug}`}>{item.name}<small>{item.sector}</small></Link>)}</div><Link href={`/?city=${encodeURIComponent(selected.reported_cities[0])}`}>View {selected.reported_cities[0]} records →</Link><button className="text-button" onClick={()=>{setSelected(null);map.current?.flyTo({center:[79,22],zoom:3.5,duration:0});}}>Back to popular companies</button></>:<><p className="muted">Select a company to find its reported city and founders, or choose a hub on the map.</p><div className="map-company-list">{data.featured.map(item=><button key={item.slug} onClick={()=>focusCompany(item)}>{item.name}<small>{item.city}</small></button>)}</div>{!data.featured.length&&<p>No curated profiles match these filters. Choose a city hub instead.</p>}</>}
      </div>
    </div><p className="map-caption">Approximate city centres, not verified office pins. <a href={data.city_source_url} target="_blank" rel="noreferrer">Natural Earth</a> coordinates; <a href={data.source_url} target="_blank" rel="noreferrer">BWM</a> HQ labels. Six curated founder profiles so far.</p>
  </div>;
}
