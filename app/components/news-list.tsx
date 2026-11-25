import Link from 'next/link';
import type {NewsItem} from '@/domain/news';
export default function NewsList({items}:{items:NewsItem[]}) {
  return <ul className="news-list">{items.map(item=><li key={item.id}><div><span>{item.source_name}</span><time dateTime={item.published_at}>{new Date(item.published_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'})}</time></div><a href={item.url} target="_blank" rel="noreferrer">{item.title} ↗</a>{item.company_slugs.length>0&&<small>Headline mentions: {item.company_slugs.slice(0,4).map((slug,i)=><span key={slug}>{i>0?', ':''}<Link href={`/company/${slug}`}>{slug.replaceAll('-',' ')}</Link></span>)}</small>}</li>)}</ul>;
}
