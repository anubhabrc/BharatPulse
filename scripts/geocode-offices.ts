// Manual research only. Candidate results never update accepted office records.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {z} from 'zod';
import review from '../data/office-review.json';

if(process.argv.includes('--help')){
  console.log('npm run offices:geocode -- [company-slug]\nQueries pending Bengaluru candidates serially, caches results in work/office-geocodes/, and writes a review report. Never publishes coordinates.');
  process.exit(0);
}
const slug=process.argv[2],candidates=review.candidates.filter(candidate=>!slug||candidate.company_slug===slug);
if(!candidates.length||candidates.length>20)throw new Error('Select between one and twenty pending candidates');
const root='work/office-geocodes';await mkdir(root,{recursive:true});
const featureSchema=z.object({geometry:z.object({type:z.literal('Point'),coordinates:z.tuple([z.number(),z.number()])}),properties:z.object({name:z.string().optional(),street:z.string().optional(),housenumber:z.string().optional(),city:z.string().optional(),countrycode:z.string().optional(),osm_type:z.enum(['N','W','R']),osm_id:z.number(),osm_key:z.string().optional(),osm_value:z.string().optional()})});
const report=[];
for(const candidate of candidates){
  const query=candidate.geocode_query;
  if(!query?.trim()){report.push({company_slug:candidate.company_slug,status:'needs_review',reason:candidate.reason,geocoder:null,note:'No usable public Bengaluru address/query yet; no geocoder request made.'});continue;}
  const url=new URL('https://photon.komoot.io/api/');
  url.search=new URLSearchParams({q:query,lat:'12.97',lon:'77.59',limit:'4'}).toString();
  const cache=`${root}/${createHash('sha256').update(url.href).digest('hex')}.json`;
  let result:unknown;
  try{result=JSON.parse(await readFile(cache,'utf8'));}
  catch{
    const response=await fetch(url,{headers:{'User-Agent':'BharatPulse-office-research/0.1 (+https://github.com/anubhabrc/BharatPulse)'},signal:AbortSignal.timeout(20000)});
    if(!response.ok)throw new Error(`Photon HTTP ${response.status}; no accepted records changed`);
    const body=await response.text();if(body.length>200000)throw new Error('Geocoder response exceeds limit');
    const features=z.object({features:z.array(featureSchema).max(4)}).parse(JSON.parse(body)).features;
    result={query,url:url.href,checked_at:new Date().toISOString(),features};
    await writeFile(cache,JSON.stringify(result,null,2)+'\n');
    await new Promise(resolve=>setTimeout(resolve,1500));
  }
  report.push({company_slug:candidate.company_slug,address_source_url:candidate.source_url,status:'needs_review',reason:candidate.reason,geocoder:result});
}
await writeFile(`${root}/review-report.json`,JSON.stringify(report,null,2)+'\n');
console.log(`${report.length} candidates saved to ${root}/review-report.json. Check building identity, street, entity and address currency before accepting any point. © OpenStreetMap contributors, ODbL. No office records changed.`);
