import Link from 'next/link';
import {PulseMark,Icon} from './icons';
export default function SiteHeader({active='explore'}:{active?:'explore'|'news'|'sources'|'company'}){
  return <header className="site-header"><Link href="/" className="brand" aria-label="BharatPulse home"><span className="brand-mark"><PulseMark/></span><span>BharatPulse<span className="brand-geo">GEO</span></span></Link><nav aria-label="Main navigation"><Link href="/" aria-current={(active==='explore'||active==='company')?'page':undefined}><Icon name="globe" size={17}/>Explore</Link><Link href="/news" aria-current={active==='news'?'page':undefined}><Icon name="news" size={17}/>Newsroom</Link><Link href="/sources" aria-current={active==='sources'?'page':undefined}>Sources</Link></nav><div className="header-note"><span className="tiny-pulse"/>INDIA’S STARTUP LANDSCAPE</div></header>;
}
