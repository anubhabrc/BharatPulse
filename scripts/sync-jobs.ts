import {readFile,writeFile,rename} from 'node:fs/promises';
import registry from '../data/job-sources.json';
import {parseGreenhouse,parseSmartRecruiters,type JobSource,type JobHealth,type JobPosting,type JobsSnapshot} from '../src/domain/jobs';
const now=new Date().toISOString();
let previous:JobsSnapshot={version:1,updated_at:now,stale_after_hours:72,sources:[],items:[]};
try{previous=JSON.parse(await readFile('data/jobs.json','utf8'));}catch{/* First checked import. */}
const items:JobPosting[]=[],health:JobHealth[]=[];
async function get(url:URL){
  const response=await fetch(url,{redirect:'error',headers:{'User-Agent':'BharatPulse-jobs/0.1 (+https://github.com/anubhabrc/BharatPulse)','Accept':'application/json'},signal:AbortSignal.timeout(25000)});
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const reader=response.body?.getReader();if(!reader)throw new Error('Empty job response');
  const chunks:Uint8Array[]=[];let length=0;
  while(true){const part=await reader.read();if(part.done)break;length+=part.value.byteLength;if(length>5_000_000){await reader.cancel();throw new Error('Job response exceeds limit');}chunks.push(part.value);}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
for(const source of registry.sources as JobSource[]){
  try{
    let jobs:JobPosting[]=[];
    if(source.provider==='greenhouse')jobs=parseGreenhouse(await get(new URL(source.listing_url)),source);
    else{
      let total:number|undefined;
      for(let offset=0;offset<3000;offset+=100){
        const url=new URL(source.listing_url);url.search=new URLSearchParams({limit:'100',offset:String(offset)}).toString();
        const page=parseSmartRecruiters(await get(url),source);
        if(page.offset!==offset||total!==undefined&&page.total!==total)throw new Error('Job pagination changed during refresh');
        total=page.total;jobs.push(...page.items);
        if(offset+100>=total)break;
        await new Promise(resolve=>setTimeout(resolve,500));
      }
    }
    const unique=[...new Map(jobs.map(job=>[job.id,job])).values()];
    if(unique.length!==jobs.length)throw new Error('Duplicate public postings across pages');
    items.push(...unique);health.push({...source,status:'ok',checked_at:now,last_success_at:now,job_count:unique.length,error:null});
    console.log(`${source.company_slug}: ${unique.length} published postings checked`);
  }catch(error){
    const old=previous.sources.find(s=>s.id===source.id);items.push(...previous.items.filter(j=>j.source_id===source.id));
    health.push({...source,status:'error',checked_at:now,last_success_at:old?.last_success_at??null,job_count:old?.job_count??0,error:error instanceof Error?error.message:'Job source failed'});
    console.error(`${source.company_slug}: failed; last good postings retained`);
  }
}
if(!health.some(s=>s.status==='ok'))throw new Error('All job sources failed; previous snapshot unchanged');
const snapshot:JobsSnapshot={version:1,updated_at:now,stale_after_hours:72,sources:health,items};
await writeFile('data/jobs.json.tmp',JSON.stringify(snapshot,null,2)+'\n');await rename('data/jobs.json.tmp','data/jobs.json');
if(health.some(s=>s.status==='error'))process.exitCode=1;
