import type {CSSProperties} from 'react';
export type IconName='search'|'pin'|'sliders'|'close'|'plus'|'minus'|'expand'|'reset'|'layers'|'chevron'|'external'|'globe'|'list'|'bolt'|'news'|'check'|'pen'|'circle'|'box';
const paths:Record<IconName,React.ReactNode>={
  pen:<><path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14l-1 7Z"/></>,
  circle:<circle cx="12" cy="12" r="8"/>,
  box:<rect x="4" y="4" width="16" height="16" rx="2"/>,
  search:<><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></>,
  pin:<><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  sliders:<><path d="M4 7h16M4 17h16"/><rect x="7" y="4" width="4" height="6" rx="1"/><rect x="14" y="14" width="4" height="6" rx="1"/></>,
  close:<path d="m6 6 12 12M18 6 6 18"/>,plus:<path d="M12 5v14M5 12h14"/>,minus:<path d="M5 12h14"/>,
  expand:<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>,reset:<><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/></>,
  layers:<><path d="m12 3 10 6-10 6L2 9l10-6Zm-9 11 9 5 9-5M3 18l9 5 9-5"/></>,
  chevron:<path d="m6 9 6 6 6-6"/>,external:<><path d="M14 4h6v6M20 4 10 14M10 4H4v16h16v-6"/></>,
  globe:<><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></>,
  list:<><path d="M9 6h12M9 12h12M9 18h12M3 6h1M3 12h1M3 18h1"/></>,
  bolt:<path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z"/>,
  news:<><path d="M4 3h16v18H4zM7 7h10M7 11h4M7 15h10M7 18h10"/></>,check:<path d="m5 12 4 4L19 6"/>
};
export function Icon({name,size=20,style}:{name:IconName;size?:number;style?:CSSProperties}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}>{paths[name]}</svg>;}
export function PulseMark(){return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M2 17h7l4-10 6 19 4-13 3 4h4" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/></svg>;}
