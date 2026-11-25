import { readFile } from 'node:fs/promises';
import postgres from 'postgres';
import { parseBatch } from '../src/domain/import-schema';
import { importReviewedBatch } from '../src/domain/import-reviewed';

const [mode,file,...options]=process.argv.slice(2);
if (!['plan','publish'].includes(mode) || !file) throw new Error('Usage: tsx scripts/import.ts plan|publish <batch.json> [--reviewed-by <name>]');
const batch=parseBatch(JSON.parse(await readFile(file,'utf8')));
const canonicalEvents=new Set(batch.records.map(r=>`${r.company.slug}:${r.funding.event_key}`));
if(mode==='plan') {
  console.log(JSON.stringify({valid:true,records:batch.records.length,canonicalEvents:canonicalEvents.size,
    demoCompanies:[...new Set(batch.records.filter(r=>r.company.is_demo).map(r=>r.company.slug))],
    warning:'Validation only. No database changes or existing-record conflict checks. Publish requires explicit review.'},null,2));
} else {
  const index=options.indexOf('--reviewed-by');
  const reviewer=index>=0 ? options[index+1] : undefined;
  if(!reviewer?.trim()) throw new Error('Publish requires --reviewed-by <name> after human review');
  if(!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before publishing reviewed records');
  const sql=postgres(process.env.DATABASE_URL,{max:1,prepare:false});
  try {
    const result=await sql.begin(async tx=>importReviewedBatch({
      query:async(query,params=[])=>[...await tx.unsafe(query,params as never[])]
    },batch,reviewer));
    console.log(JSON.stringify(result,null,2));
  } finally { await sql.end(); }
}
