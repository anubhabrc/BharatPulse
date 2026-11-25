import {readFile,writeFile,mkdir,rename,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {assertArchiveCoverage} from '../src/domain/snapshot-guard';
import type {ArchiveSnapshot} from '../src/domain/notion-archive';
import {BWM_ROOT_ID,buildArchiveSnapshot,richText,richTextLink,notionDate,safeSourceUrl,type ArchiveObservation} from '../src/domain/notion-archive';

// Public, unauthenticated page reads only. No browser cookies, private pages,
// editor metadata, article bodies or transcripts are exported to the snapshot.
interface Block {id:string;type:string;alive?:boolean;properties?:Record<string,unknown>;content?:string[];collection_id?:string;view_ids?:string[];format?:{collection_pointer?:{id:string}};query2?:Record<string,unknown>}
interface Collection {schema:Record<string,{name:string;type:string}>}
interface Response {cursor?:{stack:unknown[]};recordMap:{block:Record<string,unknown>;collection?:Record<string,unknown>;collection_view?:Record<string,unknown>};result?:{reducerResults?:Record<string,{blockIds?:string[];hasMore?:boolean}>}}
function unwrap<T>(entry:unknown):T {
  let value=entry;
  for(let depth=0;depth<3&&value&&typeof value==='object'&&'value' in value;depth++)value=(value as {value:unknown}).value;
  return value as T;
}
const args=process.argv.slice(2),cacheAt=args.indexOf('--cache');
const cache=resolve(cacheAt>=0?args[cacheAt+1]:'work/notion-cache');
await mkdir(cache,{recursive:true});
let queue=Promise.resolve(),nextRequest=0;
const loadedAt:string[]=[];
const sleep=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
async function post(endpoint:string,body:unknown):Promise<Response> {
  const key=createHash('sha256').update(endpoint+JSON.stringify(body)).digest('hex');
  const file=resolve(cache,`${key}.json`);
  if(!args.includes('--refresh'))try{
    const data=JSON.parse(await readFile(file,'utf8')) as Response;
    loadedAt.push((await stat(file)).mtime.toISOString());return data;
  }catch{/* Uncached request. */}
  for(let attempt=0;attempt<4;attempt++) {
    const slot=queue.then(async()=>{await sleep(Math.max(0,nextRequest-Date.now()));nextRequest=Date.now()+450;});queue=slot.catch(()=>{});await slot;
    const response=await fetch(`https://app.notion.com/api/v3/${endpoint}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
    if(response.status===429||response.status>=500) {
      if(attempt===3)throw new Error(`Public Notion ${endpoint} returned ${response.status} after retries`);
      await sleep(Math.min(10000,1000*2**attempt));continue;
    }
    if(!response.ok)throw new Error(`Public Notion ${endpoint} returned ${response.status}`);
    const data=await response.json() as Response;
    if(!data.recordMap)throw new Error('Notion response has no public record map');
    await writeFile(file,JSON.stringify(data));loadedAt.push(new Date().toISOString());return data;
  }
  throw new Error('Public Notion request exhausted retry limit');
}
async function page(id:string):Promise<Response> {
  const merged:Response={recordMap:{block:{},collection:{},collection_view:{}}};
  let cursor:{stack:unknown[]}={stack:[]};
  for(let chunk=0;chunk<30;chunk++) {
    const result=await post('loadPageChunk',{pageId:id,limit:100,chunkNumber:chunk,cursor,verticalColumns:false});
    for(const table of ['block','collection','collection_view'] as const)Object.assign(merged.recordMap[table]!,result.recordMap[table]??{});
    if(!result.cursor?.stack?.length)return merged;
    if(JSON.stringify(cursor)===JSON.stringify(result.cursor))throw new Error('Notion pagination did not advance');
    cursor=result.cursor;
  }
  throw new Error('Notion page exceeded chunk limit');
}
const root=await page(BWM_ROOT_ID),rootBlock=unwrap<Block>(root.recordMap.block[BWM_ROOT_ID]);
if(!rootBlock?.content?.length)throw new Error('Public archive is empty or unavailable');
const weeks=rootBlock.content.map(id=>unwrap<Block>(root.recordMap.block[id])).filter(b=>b?.type==='page'&&b.alive!==false);
if(weeks.length!==rootBlock.content.length)throw new Error('Some archive pages were not loaded; refusing a silently incomplete snapshot');
const observations:ArchiveObservation[]=[];const failures:{week:string;error:string}[]=[];
const emptyPages:{id:string;title:string}[]=[];
let index=0,completed=0;
async function worker(){while(index<weeks.length){
  const week=weeks[index++],name=richText(week.properties?.title);
  try {
    const content=await page(week.id);
    const currentWeek=unwrap<Block>(content.recordMap.block[week.id]);
    if(!currentWeek)throw new Error('Weekly page content unavailable');
    const tables=(currentWeek.content??[]).map(id=>unwrap<Block>(content.recordMap.block[id])).filter(b=>b&&['collection_view','collection_view_page'].includes(b.type));
    if(!tables.length){
      // Some published weekly pages contain only empty text blocks. Record
      // these explicitly; a missing/restricted page remains a hard failure.
      const children=(currentWeek.content??[]).map(id=>unwrap<Block>(content.recordMap.block[id]));
      if(children.some(b=>!b||b.type!=='text'||richText(b.properties?.title)))throw new Error('Unrecognized weekly page layout');
      emptyPages.push({id:week.id,title:name});continue;
    }
    for(const table of tables) {
      const collectionId=table.collection_id??table.format?.collection_pointer?.id,viewId=table.view_ids?.[0];
      if(!collectionId||!viewId)throw new Error('Missing public table identifiers');
      const collection=unwrap<Collection>(content.recordMap.collection?.[collectionId]);
      if(!collection?.schema)throw new Error('Missing table schema');
      const view=unwrap<Block>(content.recordMap.collection_view?.[viewId]);
      const result=await post('queryCollection',{collection:{id:collectionId},collectionView:{id:viewId},source:{type:'collection',id:collectionId},
        loader:{type:'reducer',reducers:{collection_group_results:{type:'results',limit:1000}},sort:[],...view?.query2,searchQuery:'',userTimeZone:'Asia/Kolkata'}});
      const reducer=result.result?.reducerResults?.collection_group_results;
      if(!reducer?.blockIds||reducer.hasMore)throw new Error('Incomplete funding table response');
      const property=(label:string)=>Object.entries(collection.schema).find(([,v])=>v.name.trim().toLowerCase()===label.toLowerCase())?.[0];
      const keys={company:property('Company')??'title',sector:property('Sector'),city:property('HQ'),stage:property('Series'),amount:property('Amount ($M)'),date:property('Date'),source:property('Source')};
      if(!keys.amount||!keys.company)throw new Error('Unrecognized funding table columns');
      for(const id of reducer.blockIds) {
        const row=unwrap<Block>(result.recordMap.block[id]);if(!row||row.alive===false)continue;
        const p=row.properties??{},get=(key:string|undefined)=>key?p[key]:undefined;
        observations.push({row_id:id,company_name:richText(get(keys.company)),company_url:richTextLink(get(keys.company)),
          sector:richText(get(keys.sector))||null,city:richText(get(keys.city))||null,stage:richText(get(keys.stage))||null,
          amount_million_raw:richText(get(keys.amount))||null,announced_on:notionDate(get(keys.date)),
          article_url:richTextLink(get(keys.source))??safeSourceUrl(richText(get(keys.source))),week_id:week.id,week_title:name});
      }
    }
    completed++;if(completed%10===0||completed===weeks.length)console.log(`Read ${completed}/${weeks.length} weekly pages; ${observations.length} observations`);
  }catch(error){failures.push({week:name,error:error instanceof Error?error.message:String(error)});}
}}
await Promise.all([worker(),worker()]);
await writeFile(resolve(cache,'observations.json'),JSON.stringify(observations,null,2));
if(failures.length){console.error(JSON.stringify(failures,null,2));throw new Error(`${failures.length} weekly pages failed. Previous snapshot retained; retry using the cache.`);}
// A cache-only rebuild must not claim a new retrieval time. Use the oldest
// contributing response as the conservative snapshot freshness boundary.
const retrievedAt=loadedAt.sort()[0];if(!retrievedAt)throw new Error('No source retrieval times available');
const snapshot=buildArchiveSnapshot(observations,{retrieved_at:retrievedAt,pages_discovered:weeks.length,pages_imported:completed,pages_empty:emptyPages.length});
let previous:ArchiveSnapshot|null=null;
try{previous=JSON.parse(await readFile('data/bwm-archive.json','utf8'));}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
assertArchiveCoverage(previous,snapshot,args.includes('--allow-large-removals'));
const target=resolve('data/bwm-archive.json');await writeFile(`${target}.tmp`,JSON.stringify(snapshot,null,2)+'\n');await rename(`${target}.tmp`,target);
await writeFile(resolve('data/bwm-import-report.json'),JSON.stringify({generated_at:new Date().toISOString(),retrieved_at:snapshot.retrieved_at,coverage:snapshot.coverage,empty_pages:emptyPages.sort((a,b)=>a.id.localeCompare(b.id)),failed_pages:failures},null,2)+'\n');
console.log(JSON.stringify(snapshot.coverage,null,2));
