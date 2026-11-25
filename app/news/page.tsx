import Link from 'next/link';
import NewsList from '../components/news-list';
import {news} from '@/lib/news';
export const dynamic='force-dynamic';
export default async function News({searchParams}:{searchParams:Promise<{view?:string}>}) {
  const unmatched=(await searchParams).view==='unmatched',items=unmatched?news.items.filter(item=>!item.company_slugs.length):news.items;
  return <main><header><Link href="/" className="brand">BharatPulse<span> GEO</span></Link><Link href="/sources">Sources & freshness</Link></header><section className="intro"><p className="eyebrow">PUBLICATION WATCH</p><h1>Follow the latest signals.</h1><p>{items.length} headlines from public feeds. Company links are explicit name matches; funding amounts are never added to the archive automatically.</p></section><section className="repository"><div className="news-filters"><Link href="/news" aria-current={!unmatched?'page':undefined}>All headlines</Link><Link href="/news?view=unmatched" aria-current={unmatched?'page':undefined}>Unmatched inbox</Link></div><NewsList items={items}/></section><footer>Headline and link metadata only. Original reporting remains with each publication.</footer></main>;
}
