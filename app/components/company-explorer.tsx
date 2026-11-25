'use client';
import {useCallback,useEffect,useRef,useState,type ReactNode} from 'react';
import dynamic from 'next/dynamic';
import type {StartupMapPayload} from '@/domain/startup-map';
import {loadMapLibrary} from './map-resources';
const StartupMap=dynamic(()=>import('./startup-map'),{ssr:false,loading:()=> <p role="status">Preparing map…</p>});
export default function CompanyExplorer({children,query,enabled}:{children:ReactNode;query:string;enabled:boolean}) {
  const [view,setView]=useState<'list'|'map'>('list'),[data,setData]=useState<StartupMapPayload|null>(null),[error,setError]=useState('');
  const pending=useRef<Promise<void>|null>(null),abort=useRef<AbortController|null>(null);
  const prepare=useCallback(()=>{
    if(pending.current)return pending.current;
    const controller=new AbortController();abort.current=controller;setError('');
    void loadMapLibrary().catch(()=>{});
    return pending.current=fetch(`/api/map?${query}`,{signal:controller.signal}).then(async response=>{
      if(!response.ok)throw new Error('Map data could not be loaded');
      const payload=await response.json() as StartupMapPayload;if(!controller.signal.aborted)setData(payload);
    }).catch(error=>{if(!controller.signal.aborted){pending.current=null;setError(error.message);}});
  },[query]);
  useEffect(()=>{
    if(!enabled)return;
    const connection=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string}}).connection;
    const warm=()=>{if(!connection?.saveData&&!['slow-2g','2g'].includes(connection?.effectiveType??''))void prepare();};
    const idle=typeof window.requestIdleCallback==='function'?window.requestIdleCallback(warm,{timeout:4000}):window.setTimeout(warm,1500);
    return()=>{if(typeof window.cancelIdleCallback==='function')window.cancelIdleCallback(idle);else window.clearTimeout(idle);abort.current?.abort();pending.current=null;};
  },[enabled,prepare]);
  return <><div className="view-switch" aria-label="Company view"><button aria-pressed={view==='list'} onClick={()=>setView('list')}>Companies</button>{enabled&&<button aria-pressed={view==='map'} onClick={()=>{setView('map');void prepare();}}>Startup map</button>}<span>Same filters · {view==='list'?'Map prepares in the background':'City-level locations'}</span></div>
    <div hidden={view!=='list'}>{children}</div>{view==='map'&&(data?<StartupMap data={data}/>:<div className="map-loading"><p role="status">{error||'Loading city hubs…'}</p>{error&&<button onClick={()=>void prepare()}>Retry map</button>}</div>)}
  </>;
}
