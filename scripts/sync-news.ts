import {readFile,writeFile,rename} from 'node:fs/promises';
import registry from '../data/feed-sources.json';
import {parseFeed,matchNewsCompanies,mergeNews,type FeedSource,type FeedHealth,type NewsSnapshot,type NewsItem} from '../src/domain/news';
import type {ArchiveSnapshot} from '../src/domain/notion-archive';
const archive=JSON.parse(await readFile('data/bwm-archive.json','utf8')) as ArchiveSnapshot;
const now=new Date();
let previous:NewsSnapshot={schema_version:1,updated_at:now.toISOString(),retention_days:90,items:[],feeds:[]};
try{previous=JSON.parse(await readFile('data/news.json','utf8'));}catch{/* First import. */}
const items:NewsItem[]=[],health:FeedHealth[]=[];
for(const source of registry.sources.filter(s=>s.enabled) as FeedSource[]) {
  const old=previous.feeds.find(f=>f.source_id===source.id);
  try {
    const response=await fetch(source.url,{headers:{'User-Agent':'BharatPulse/0.1 (+https://github.com/anubhabrc/BharatPulse)','Accept':'application/rss+xml, application/atom+xml, application/xml, text/xml'},signal:AbortSignal.timeout(20000)});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    if(!source.allowed_hosts.includes(new URL(response.url).hostname))throw new Error('Unexpected feed redirect');
    const reader=response.body?.getReader();if(!reader)throw new Error('Empty feed body');
    const chunks:Uint8Array[]=[];let length=0;
    while(true){const next=await reader.read();if(next.done)break;length+=next.value.byteLength;if(length>2_000_000){await reader.cancel();throw new Error('Feed exceeds size limit');}chunks.push(next.value);}
    const parsed=parseFeed(Buffer.concat(chunks).toString('utf8'),source,now);
    if(!parsed.length)throw new Error('No valid feed entries');
    for(const item of parsed) {
      item.company_slugs=matchNewsCompanies(item.title,archive.companies);
      if(item.company_slugs.length||item.tags.length||/\bstartup|\bfintech|\bventure|\bAI\b|\bSaaS\b/i.test(item.title))items.push(item);
    }
    health.push({source_id:source.id,source_name:source.name,url:source.url,status:'ok',checked_at:now.toISOString(),last_success_at:now.toISOString(),latest_entry_at:parsed.map(i=>i.published_at).sort().at(-1)??null,item_count:parsed.length,error:null});
    console.log(`${source.name}: ${parsed.length} valid entries`);
  }catch(error){
    health.push({source_id:source.id,source_name:source.name,url:source.url,status:'error',checked_at:now.toISOString(),last_success_at:old?.last_success_at??null,latest_entry_at:old?.latest_entry_at??null,item_count:old?.item_count??0,error:error instanceof Error?error.message:'Feed request failed'});
    console.error(`${source.name}: ${health.at(-1)!.error}; previous items retained`);
  }
}
if(!health.some(f=>f.status==='ok'))throw new Error('All feeds failed; previous news snapshot retained');
const snapshot:NewsSnapshot={schema_version:1,updated_at:now.toISOString(),retention_days:90,items:mergeNews(previous.items,items,now),feeds:health};
await writeFile('data/news.json.tmp',JSON.stringify(snapshot,null,2)+'\n');await rename('data/news.json.tmp','data/news.json');
console.log(JSON.stringify({retained_items:snapshot.items.length,matched_items:snapshot.items.filter(i=>i.company_slugs.length).length,healthy_feeds:health.filter(f=>f.status==='ok').length,total_feeds:health.length}));
