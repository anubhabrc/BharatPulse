import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseOffices} from '../src/domain/offices';
import {buildStartupMap,type CompanyInfo} from '../src/domain/startup-map';
import {companyFiltersSchema} from '../src/domain/archive-queries';
import type {ArchiveSnapshot} from '../src/domain/notion-archive';
import data from '../data/bengaluru-offices.json';
import review from '../data/office-review.json';
import cities from '../data/city-centres.json';
import profiles from '../data/company-info.json';
const snapshot=JSON.parse(await readFile('data/bwm-archive.json','utf8')) as ArchiveSnapshot;
const offices=parseOffices(data.offices);
const build=(filters={})=>buildStartupMap(snapshot,companyFiltersSchema.parse(filters),cities.cities,profiles.companies as CompanyInfo[],cities.source_url,offices);

test('accepted office points belong to existing Bengaluru companies and retain independent address/coordinate evidence',()=>{
  assert.equal(offices.length,8);
  for(const office of offices){
    const company=snapshot.companies.find(company=>company.slug===office.company_slug);
    assert.ok(company);assert.equal(office.city,'Bengaluru');
    assert.notEqual(new URL(office.address_source_url).host,new URL(office.coordinate_source_url).host);
    assert.ok(!review.candidates.some(candidate=>candidate.company_slug===office.company_slug));
  }
  assert.equal(new Set(offices.map(office=>`${office.longitude},${office.latitude}`)).size,8);
});
test('office schema rejects unreviewed, coarse, out-of-city and duplicate primary locations',()=>{
  for(const patch of [{review_status:'pending'},{precision:'city'},{longitude:72},{latitude:19},{coordinate_source_url:'https://www.openstreetmap.org/'},{address_source_url:'http://example.com'},{private_contact:'sensitive'}])
    assert.throws(()=>parseOffices([{...offices[0],...patch}]));
  assert.throws(()=>parseOffices([offices[0],offices[0]]),/one accepted primary/);
});
test('office layer is a subset of the full filtered cohort, independent of directory pagination',()=>{
  const city=build({city:'Bengaluru',limit:1,offset:500});
  const expected=snapshot.companies.filter(company=>company.city==='Bengaluru').length;
  assert.equal(city.offices.length,8);assert.equal(city.matched_companies,expected);
  assert.equal(city.hubs[0].company_count,expected);assert.equal(city.mapped_companies,expected);
  assert.equal(city.precision,'mixed_city_and_office');
  for(const point of city.office_features){
    assert.equal(point.geometry.type,'Point');
    const office=offices.find(office=>office.company_slug===point.id)!;
    assert.deepEqual(point.geometry.coordinates,[office.longitude,office.latitude]);
    assert.notDeepEqual(point.geometry.coordinates,[city.hubs[0].longitude,city.hubs[0].latitude]);
  }
  const all=build();assert.equal(all.hubs.reduce((n,hub)=>n+hub.company_count,0),all.mapped_companies);
  assert.ok(Buffer.byteLength(JSON.stringify(all))<150000);
});
test('company filters never leak office pins from outside the results and unresolved candidates stay city-only',()=>{
  assert.equal(build({city:'Mumbai'}).offices.length,0);
  const cred=build({q:'CRED'});assert.deepEqual(cred.offices.map(c=>c.slug),['cred']);
  assert.equal(cred.offices[0].office?.kind,'business_office');
  const sarvam=build({q:'Sarvam'});assert.equal(sarvam.offices.length,0);assert.equal(sarvam.featured[0].office,undefined);
  assert.equal(sarvam.precision,'representative_city_centre');
});
