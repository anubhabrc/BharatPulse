import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildStartupMap,type CompanyInfo} from '../src/domain/startup-map';
import {companyFiltersSchema} from '../src/domain/archive-queries';
import {assertArchiveCoverage} from '../src/domain/snapshot-guard';
import type {ArchiveSnapshot} from '../src/domain/notion-archive';
import cities from '../data/city-centres.json';
import info from '../data/company-info.json';
const snapshot=JSON.parse(await readFile('data/bwm-archive.json','utf8')) as ArchiveSnapshot;
const build=(filters={})=>buildStartupMap(snapshot,companyFiltersSchema.parse(filters),cities.cities,info.companies as CompanyInfo[],cities.source_url);
test('map covers the full filtered cohort regardless of table pagination, with explicit location precision',()=>{
  const payload=build({limit:1,offset:100});assert.equal(payload.matched_companies,snapshot.companies.length);assert.equal(payload.mapped_companies+payload.unmapped_companies,payload.matched_companies);
  assert.equal(payload.hubs.reduce((n,h)=>n+h.company_count,0),payload.mapped_companies);assert.equal(payload.precision,'representative_city_centre');assert.ok(payload.unmapped_companies>0);assert.ok(payload.features.length<150);assert.ok(Buffer.byteLength(JSON.stringify(payload))<150000);
});
test('popular company selection shares city filters and never invents a founder profile',()=>{
  const all=build(),filtered=build({q:'Zepto'});assert.equal(all.featured.length,6);assert.deepEqual(filtered.featured.map(c=>c.slug),['zepto']);assert.deepEqual(filtered.featured[0].founders,['Aadit Palicha','Kaivalya Vohra']);assert.equal(filtered.mapped_companies,1);
  for(const hub of all.hubs)for(const company of hub.companies)if(!info.companies.some(p=>p.slug===company.slug))assert.equal(company.founders.length,0);
});
test('unrecognized locations are omitted and city aliases resolve to one shared point',()=>{
  const custom=structuredClone(snapshot);custom.companies=custom.companies.slice(0,3);custom.companies[0].city='Bangalore';custom.companies[1].city='Bengaluru';custom.companies[2].city='Unknown headquarters';
  const payload=buildStartupMap(custom,companyFiltersSchema.parse({}),cities.cities,[],cities.source_url);assert.equal(payload.hubs.length,1);assert.equal(payload.hubs[0].company_count,2);assert.equal(payload.unmapped_companies,1);
});
test('snapshot guard blocks missing history and large drops while permitting a reviewed override',()=>{
  assert.doesNotThrow(()=>assertArchiveCoverage(snapshot,snapshot));
  const next=structuredClone(snapshot);next.companies=next.companies.slice(0,200);assert.throws(()=>assertArchiveCoverage(snapshot,next),/20%/);assert.doesNotThrow(()=>assertArchiveCoverage(snapshot,next,true));
  next.companies=snapshot.companies;next.coverage.first_date='2025-01-01';assert.throws(()=>assertArchiveCoverage(snapshot,next),/start date/);
});
test('legacy and current city names resolve without discarding exact gazetteer labels',()=>{
  const custom=structuredClone(snapshot);custom.companies=custom.companies.slice(0,4);
  ['Mangalore','Mangaluru','Mysore','Mysuru'].forEach((city,index)=>{custom.companies[index].city=city;});
  const payload=buildStartupMap(custom,companyFiltersSchema.parse({}),cities.cities,[],cities.source_url);
  assert.equal(payload.mapped_companies,4);assert.equal(payload.unmapped_companies,0);assert.equal(payload.hubs.length,2);assert.ok(payload.hubs.every(hub=>hub.company_count===2));
});
