import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import fixture from '../data/demo-reviewed.json';
import {parseBatch} from '../src/domain/import-schema';
import {importReviewedBatch} from '../src/domain/import-reviewed';
async function withDb(run:(db:PGlite)=>Promise<void>) {
  const db=new PGlite();
  try {await db.exec(await readFile('db/migrations/001_core.sql','utf8'));await run(db);}finally{await db.close();}
}
async function publish(db:PGlite,input:unknown) {
  const batch=parseBatch(input);
  return db.transaction(async tx=>importReviewedBatch({query:async(sql,params=[]) => (await tx.query(sql,params)).rows as Record<string,unknown>[]},batch,'test-reviewer'));
}
test('reimporting a batch changes no canonical events, evidence, documents or totals',()=>withDb(async db=>{
  await publish(db,fixture);const second=await publish(db,fixture);
  assert.deepEqual(second,{records:3,createdEvents:0,linkedEvidence:0});
  assert.equal((await db.query('SELECT * FROM bp.funding_events')).rows.length,3);
  assert.equal((await db.query('SELECT * FROM bp.documents')).rows.length,3);
  const total=await db.query<{equity_usd:string}>('SELECT equity_usd::text FROM bp.company_funding_totals ORDER BY equity_usd');
  assert.deepEqual(total.rows.map(x=>Number(x.equity_usd)),[1000000,2000000,3000000]);
}));
test('independent sources add evidence to one event without doubling capital',()=>withDb(async db=>{
  await publish(db,fixture);
  const batch=structuredClone(fixture);batch.sources[0].key='another-source';batch.sources[0].name='Another synthetic source';
  batch.records=batch.records.slice(0,1);batch.records[0].document.source_key='another-source';
  const result=await publish(db,batch);
  assert.equal(result.createdEvents,0);assert.equal(result.linkedEvidence,1);
  assert.equal((await db.query('SELECT * FROM bp.funding_events')).rows.length,3);
  assert.equal((await db.query('SELECT * FROM bp.funding_evidence')).rows.length,4);
}));
test('conflicting amount rolls back the whole batch, including newly seen companies',()=>withDb(async db=>{
  await publish(db,fixture);
  const b=structuredClone(fixture);
  b.records[0].company.slug='new-company';b.records[0].company.brand_name='New Company';
  b.records[1].funding.amount_original='999';
  await assert.rejects(()=>publish(db,b),/conflicting amount_original/);
  assert.equal((await db.query("SELECT * FROM bp.companies WHERE slug='new-company'")).rows.length,0);
  assert.equal((await db.query('SELECT * FROM bp.ingestion_runs')).rows.length,1);
}));
test('secondary sales, rumors, missing FX and undisclosed rounds retain their meanings',()=>withDb(async db=>{
  const b=structuredClone(fixture);b.records=b.records.slice(0,1);
  const original=b.records[0];
  const secondary=structuredClone(original);secondary.funding.event_key='secondary';secondary.funding.transaction_type='secondary';secondary.funding.amount_original='500000';
  const rumor=structuredClone(original);rumor.funding.event_key='rumor';rumor.funding.status='rumored';rumor.funding.amount_original='999999999';
  const inr=structuredClone(original);inr.funding.event_key='inr-no-fx';inr.funding.currency='INR';
  const unknown=structuredClone(original);unknown.funding.event_key='undisclosed';(unknown.funding as {amount_original:string|null}).amount_original=null;
  b.records.push(secondary,rumor,inr,unknown);await publish(db,b);
  const {rows:[row]}=await db.query<{tracked_event_count:number;unpriced_event_count:number;equity_usd:string;secondary_usd:string}>('SELECT * FROM bp.company_funding_totals');
  assert.equal(row.tracked_event_count,4);assert.equal(row.unpriced_event_count,2);
  assert.equal(Number(row.equity_usd),1000000);assert.equal(Number(row.secondary_usd),500000);
}));
test('one corporate domain does not force unrelated brands to merge',()=>withDb(async db=>{
  const b=structuredClone(fixture);b.records[1].company.website_domain=b.records[0].company.website_domain;await publish(db,b);
  assert.equal((await db.query('SELECT * FROM bp.companies')).rows.length,3);
}));
test('location accuracy changes require review rather than silently promoting city pins',()=>withDb(async db=>{
  await publish(db,fixture);const b=structuredClone(fixture);b.records[0].company.location.accuracy='address';
  await assert.rejects(()=>publish(db,b),/conflicting accuracy/);
}));
test('all core tables deny PUBLIC access and enable row-level security',()=>withDb(async db=>{
  const tables=await db.query<{relname:string;relrowsecurity:boolean}>("SELECT relname,relrowsecurity FROM pg_class JOIN pg_namespace n ON n.oid=relnamespace WHERE n.nspname='bp' AND relkind='r'");
  assert.ok(tables.rows.length>15);assert.ok(tables.rows.every(t=>t.relrowsecurity));
  await db.exec('CREATE ROLE isolated_user; GRANT USAGE ON SCHEMA bp TO isolated_user; SET ROLE isolated_user;');
  await assert.rejects(()=>db.query('SELECT * FROM bp.companies'),/permission denied/);
  await db.exec('RESET ROLE;');
}));
