'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import type {NewsItem} from '@/domain/news';
import {displayDate} from '@/domain/presentation';
import {Icon} from './icons';

export default function NewsCarousel({items}:{items:NewsItem[]}) {
  const [index,setIndex]=useState(0),[playing,setPlaying]=useState(false),[hovered,setHovered]=useState(false),[focused,setFocused]=useState(false);
  const touch=useRef<number|null>(null),count=items.length;
  useEffect(()=>{const preference=window.matchMedia('(prefers-reduced-motion: reduce)');setPlaying(!preference.matches);const change=()=>setPlaying(!preference.matches);preference.addEventListener('change',change);return()=>preference.removeEventListener('change',change);},[]);
  useEffect(()=>{if(!playing||hovered||focused||count<2)return;const timer=setInterval(()=>{if(!document.hidden)setIndex(value=>(value+1)%count);},8000);return()=>clearInterval(timer);},[playing,hovered,focused,count,index]);
  const step=(amount:number)=>{setPlaying(false);setIndex(value=>(value+amount+count)%count);};
  const item=items[index%Math.max(1,count)];
  return <section className="news-carousel" aria-label="Startup news" aria-roledescription="carousel" onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onFocusCapture={()=>setFocused(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setFocused(false);}}>
    <div className="news-carousel-label"><Icon name="bolt" size={19}/><div>THE WIRE<small>STARTUP DISPATCH</small></div></div>
    <div className="news-carousel-window" onKeyDown={event=>{if(count>1&&(event.key==='ArrowRight'||event.key==='ArrowLeft')){event.preventDefault();step(event.key==='ArrowRight'?1:-1);}}} onTouchStart={event=>{touch.current=event.changedTouches[0].clientX;}} onTouchEnd={event=>{if(count>1&&touch.current!==null){const distance=event.changedTouches[0].clientX-touch.current;if(Math.abs(distance)>45)step(distance<0?1:-1);}touch.current=null;}}>
      {item?<a key={item.id} className="news-carousel-story" href={item.url} target="_blank" rel="noreferrer" aria-roledescription="slide" aria-label={`${index%count+1} of ${count}: ${item.title}`}><span className="news-carousel-meta">{item.source_name}<time dateTime={item.published_at}>{displayDate(item.published_at)}</time></span><strong>{item.title}</strong></a>:<p>No recent headlines. Visit the newsroom for source coverage.</p>}
    </div>
    {count>1&&<div className="news-carousel-controls"><button aria-label="Previous headline" onClick={()=>step(-1)}><Icon name="chevron" style={{transform:'rotate(90deg)'}} size={17}/></button><span aria-live={playing?'off':'polite'} aria-atomic="true">{String(index%count+1).padStart(2,'0')}<i> / {String(count).padStart(2,'0')}</i></span><button aria-label="Next headline" onClick={()=>step(1)}><Icon name="chevron" style={{transform:'rotate(-90deg)'}} size={17}/></button><button className="news-carousel-pause" aria-label={playing?'Pause news carousel':'Play news carousel'} onClick={()=>setPlaying(value=>!value)}>{playing?'Pause':'Play'}</button></div>}
    <Link href="/news" className="news-carousel-all">All news <Icon name="news" size={16}/></Link>
  </section>;
}
