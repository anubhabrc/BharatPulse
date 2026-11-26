'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import Link from 'next/link';
import type {NewsItem} from '@/domain/news';
import {newsStoryHref} from '@/domain/news-navigation';
export default function NewsTicker({items}:{items:NewsItem[]}){
  const [paused,setPaused]=useState(false),[reduced,setReduced]=useState(true),[hidden,setHidden]=useState(false),[seconds,setSeconds]=useState(180),[browsing,setBrowsing]=useState(false);
  const group=useRef<HTMLDivElement>(null),windowRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const preference=window.matchMedia('(prefers-reduced-motion: reduce)'),change=()=>setReduced(preference.matches),visibility=()=>setHidden(document.hidden);
    change();visibility();preference.addEventListener('change',change);document.addEventListener('visibilitychange',visibility);
    return()=>{preference.removeEventListener('change',change);document.removeEventListener('visibilitychange',visibility);};
  },[]);
  useEffect(()=>{const element=group.current;if(!element)return;let active=true;const update=()=>{if(active)setSeconds(Math.max(25,element.getBoundingClientRect().width/42));};const observer=new ResizeObserver(update);observer.observe(element);update();return()=>{active=false;observer.disconnect();};},[items]);
  const stopped=paused||reduced||hidden;
  return <section className="news-ticker" aria-label="Latest startup headlines" aria-description="Press Tab to browse the headlines. Moving headlines pause on hover or focus." tabIndex={0} onFocusCapture={event=>{if(event.target===event.currentTarget&&event.currentTarget.matches(':focus-visible'))setBrowsing(true);}} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget)){setBrowsing(false);if(windowRef.current)windowRef.current.scrollLeft=0;}}} data-browsing={browsing} data-paused={stopped} data-reduced-motion={reduced} style={{'--ticker-duration':`${seconds}s`} as CSSProperties}>
    <div className="news-ticker-window" ref={windowRef} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))event.currentTarget.scrollLeft=0;}}><div className="news-ticker-track">{[0,1].map(copy=><div key={copy} ref={copy===0?group:undefined} className="news-ticker-group" aria-hidden={copy===1?true:undefined}>{items.map(item=><Link key={item.id} href={newsStoryHref(item.id)} className="news-ticker-story" tabIndex={copy===1||!browsing?-1:0} prefetch={false}><span>{item.source_name}</span><strong>{item.title}</strong><span className="news-ticker-divider" aria-hidden="true">✳</span></Link>)}</div>)}</div>{!items.length&&<Link className="news-ticker-empty" href="/news">Read the latest startup coverage in the newsroom.</Link>}</div>
    {!!items.length&&<button type="button" className="news-ticker-toggle" aria-label={paused?'Play news ticker':'Pause news ticker'} aria-pressed={paused} onClick={()=>setPaused(value=>!value)} title={paused?'Play headlines':'Pause headlines'}>{paused?<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 9 6-9 6Z"/></svg>:<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4h3v12H6zm6 0h3v12h-3z"/></svg>}</button>}
  </section>;
}
