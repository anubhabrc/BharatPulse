import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildArchiveSnapshot,millionToUsd,richTextLink,notionDate,safeSourceUrl,sumUsd,type ArchiveObservation,type ArchiveSnapshot} from '../src/domain/notion-archive';
import {queryArchive,companyFiltersSchema} from '../src/domain/archive-queries';
const metadata={retrieved_at:'2026-11-25T00:00:00Z',pages_discovered:2,pages_imported:2};
function observation(overrides:Partial<ArchiveObservation>={}):ArchiveObservation {
  return {row_id:'11111111-1111-4111-8111-111111111111',company_name:'Test Company',company_url:'https://company.example',
    city:'Bangalore',sector:'SaaS',stage:'Seed',amount_million_raw:'2.35',announced_on:'2026-10-01',
    article_url:'https://publisher.example/seed',week_id:'22222222-2222-4222-8222-222222222222',week_title:'Week one',...overrides};
}
test('Notion rich text yields linked company URLs and exact dates without fetching article bodies',()=>{
  assert.equal(richTextLink([['Company',[['a','https://company.example/']]]]),'https://company.example/');
  assert.equal(notionDate([['‣',[['d',{type:'date',start_date:'2026-10-01'}]]]]),'2026-10-01');
  assert.equal(notionDate([['‣',[['d',{type:'date',start_date:'2026-02-30'}]]]]),null);
  assert.equal(safeSourceUrl('javascript:alert(1)'),null);
});
test('million-dollar fields convert exactly, while undisclosed and malformed values remain unknown',()=>{
  assert.equal(millionToUsd('13.25'),'13250000');
  assert.equal(millionToUsd('0.856'),'856000');
  assert.equal(millionToUsd('0.0000000001'),'0.0001');
  assert.equal(millionToUsd('1,000.25'),'1000250000');
  for(const value of ['0','Undisclosed','-2','10,20','2.3 million'])assert.equal(millionToUsd(value),null);
  assert.equal(sumUsd(['0.1','0.2',null]),'0.3');
});
test('identical event terms across weekly records retain both citations and count the amount once',()=>{
  const snapshot=buildArchiveSnapshot([observation(),observation({row_id:'other-row',week_id:'other-week',week_title:'Week two',article_url:'https://another.example/round'})],metadata);
  const c=snapshot.companies[0];assert.equal(c.city,'Bengaluru');assert.equal(c.rounds.length,1);
  assert.equal(c.tracked_amount_usd,'2350000');assert.equal(c.rounds[0].notion_row_urls.length,2);
  assert.equal(c.rounds[0].article_urls.length,2);assert.equal(snapshot.coverage.duplicate_observations,1);
});
test('conflicting amounts for one source remain visible but are excluded from totals',()=>{
  const snapshot=buildArchiveSnapshot([observation(),observation({row_id:'other',amount_million_raw:'2.36'})],metadata);
  assert.equal(snapshot.companies[0].rounds.length,2);assert.equal(snapshot.companies[0].tracked_amount_usd,null);
  assert.ok(snapshot.companies[0].rounds.every(r=>!r.included_in_totals&&r.quality_flags.includes('Conflicting entries for one article')));
});
test('unknown round terms are not merged by company name alone; blank rows are excluded',()=>{
  const snapshot=buildArchiveSnapshot([observation({amount_million_raw:null,article_url:null}),observation({row_id:'other',amount_million_raw:null,article_url:null}),observation({company_name:''})],metadata);
  assert.equal(snapshot.companies[0].rounds.length,2);assert.equal(snapshot.companies[0].tracked_amount_usd,null);
  assert.equal(snapshot.coverage.excluded_rows,1);
});
test('future dated rows cannot inflate totals or override the latest observed city',()=>{
  const snapshot=buildArchiveSnapshot([observation(),observation({row_id:'future',announced_on:'2027-01-01',city:'Mumbai',article_url:'https://publisher.example/future'})],metadata);
  assert.equal(snapshot.companies[0].city,'Bengaluru');assert.equal(snapshot.companies[0].tracked_amount_usd,'2350000');
  assert.equal(snapshot.companies[0].latest_announced_on,'2026-10-01');
});
test('date and stage filters recalculate company and cohort metrics before pagination',()=>{
  const snapshot=buildArchiveSnapshot([observation(),observation({row_id:'second-round',stage:'Series A',amount_million_raw:'10',announced_on:'2025-01-01',article_url:'https://publisher.example/series-a'}),observation({row_id:'second-company',company_name:'Another Company',city:'Pune',article_url:'https://publisher.example/another'})],metadata);
  const result=queryArchive(snapshot,companyFiltersSchema.parse({from:'2026-01-01',stage:'Seed',limit:1}));
  assert.equal(result.total,2);assert.equal(result.companies.length,1);assert.equal(result.metrics.event_count,2);
  assert.equal(result.metrics.tracked_amount_usd,'4700000');
  const search=queryArchive(snapshot,companyFiltersSchema.parse({q:'test company',city:'Bengaluru'}));
  assert.equal(search.total,1);assert.equal(search.companies[0].tracked_amount_usd,'12350000');
});
test('invalid dates, inverted ranges and excessive page sizes are rejected',()=>{
  for(const input of [{from:'2026-02-30'},{from:'2026-10-01',to:'2025-01-01'},{limit:101},{offset:-1}])assert.equal(companyFiltersSchema.safeParse(input).success,false);
});
test('shipped snapshot has coherent coverage, no demo records and inspectable evidence for every event',async()=>{
  const snapshot=JSON.parse(await readFile('data/bwm-archive.json','utf8')) as ArchiveSnapshot;
  assert.ok(snapshot.companies.length>1000);assert.equal(snapshot.coverage.company_count,snapshot.companies.length);
  assert.equal(snapshot.coverage.pages_discovered,snapshot.coverage.pages_imported+snapshot.coverage.pages_empty);
  assert.equal(snapshot.coverage.event_count,snapshot.companies.flatMap(c=>c.rounds).length);
  assert.equal(snapshot.coverage.rows_read-snapshot.coverage.excluded_rows-snapshot.coverage.duplicate_observations,snapshot.coverage.event_count);
  assert.equal(new Set(snapshot.companies.map(c=>c.slug)).size,snapshot.companies.length);
  for(const company of snapshot.companies) {
    assert.ok(!['nimbus-grid','fieldweave','orbitdesk'].includes(company.slug));
    assert.ok(company.rounds.every(r=>r.notion_row_urls.length>0&&r.week_urls.length>0));
    assert.equal(company.tracked_amount_usd,sumUsd(company.rounds.filter(r=>r.included_in_totals).map(r=>r.amount_usd)));
  }
  const known=snapshot.companies.find(c=>c.slug==='country-delight');assert.ok(known);
  assert.ok(known.rounds.some(r=>r.announced_on==='2024-01-05'&&r.amount_usd==='20000000'));
});
