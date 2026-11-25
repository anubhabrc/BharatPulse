import SiteHeader from '../components/site-header';
import Link from 'next/link';
import NewsList from '../components/news-list';
import {news} from '@/lib/news';
export const dynamic='force-dynamic';
export default async function News({searchParams}:{searchParams:Promise<{view?:string;page?:string}>}) {
  const params=await searchParams,unmatched=params.view==='unmatched',items=unmatched?news.items.filter(item=>!item.company_slugs.length):news.items;
  const requested=Number(params.page??1),page=Math.min(Math.max(1,Number.isSafeInteger(requested)?requested:1),Math.max(1,Math.ceil(items.length/50))),offset=(page-1)*50;
  const pageUrl=(value:number)=>`/news?${new URLSearchParams({...(unmatched?{view:'unmatched'}:{}),page:String(value)})}`;
  return <><SiteHeader active="news"/><main><section className="intro"><p className="eyebrow">PUBLICATION WATCH</p><h1>Follow the latest signals.</h1><p>{items.length} headlines from public feeds. Company links are explicit name matches; funding amounts are never added to the archive automatically.</p></section><section className="repository"><div className="news-filters"><Link href="/news" aria-current={!unmatched?'page':undefined}>All headlines</Link><Link href="/news?view=unmatched" aria-current={unmatched?'page':undefined}>Unmatched inbox</Link></div><NewsList items={items.slice(offset,offset+50)}/><nav className="pagination" aria-label="News pages"><span>Showing {items.length?offset+1:0}–{Math.min(offset+50,items.length)} of {items.length}</span><div>{page>1&&<Link href={pageUrl(page-1)}>Previous</Link>}{offset+50<items.length&&<Link href={pageUrl(page+1)}>Next</Link>}</div></nav></section><footer>Headline and link metadata only. Original reporting remains with each publication.</footer></main></>;
}
