import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseOffices} from '../src/domain/offices';
import {buildStartupMap,type CompanyInfo} from '../src/domain/startup-map';
import {companyFiltersSchema,queryArchive} from '../src/domain/archive-queries';
import type {ArchiveSnapshot} from '../src/domain/notion-archive';
import data from '../data/bengaluru-offices.json';
import review from '../data/office-review.json';
import inventory from '../data/office-review-inventory.json';
import cities from '../data/city-centres.json';
import profiles from '../data/company-info.json';
import directory from '../data/company-directory.json';
import {parseDirectoryEntries} from '../src/domain/directory-profile';
import {composeCatalog} from '../src/domain/catalog';
const snapshot=composeCatalog(JSON.parse(await readFile('data/bwm-archive.json','utf8')) as ArchiveSnapshot,parseDirectoryEntries(directory.companies));
const offices=parseOffices(data.offices);
const build=(filters={})=>buildStartupMap(snapshot,companyFiltersSchema.parse(filters),cities.cities,profiles.companies as CompanyInfo[],cities.source_url,offices);

test('accepted office points belong to existing companies and retain address and coordinate provenance',()=>{
  assert.ok(offices.length>=50);
  for(const office of offices){
    assert.ok(snapshot.companies.some(company=>company.slug===office.company_slug));assert.equal(office.city,'Bengaluru');
    if(office.coordinate_method==='osm_feature')assert.notEqual(new URL(office.address_source_url).host,new URL(office.coordinate_source_url).host);
    else assert.equal(office.coordinate_method,'company_published_map_link');
    assert.ok(!review.candidates.some(candidate=>candidate.company_slug===office.company_slug));
    const tracked=inventory.companies.find(company=>company.company_slug===office.company_slug);assert.equal(tracked?.status,'accepted');assert.equal(tracked?.accepted_office_id,office.id);
  }
});
test('office schema rejects unreviewed, coarse, out-of-city, unsupported-provider and duplicate primary locations',()=>{
  for(const patch of [{review_status:'pending'},{precision:'city'},{longitude:72},{latitude:19},{coordinate_source_url:'https://www.openstreetmap.org/'},{address_source_url:'http://example.com'},{private_contact:'sensitive'},{coordinate_method:'company_filing'}])
    assert.throws(()=>parseOffices([{...offices[0],...patch}]));
  assert.throws(()=>parseOffices([offices[0],offices[0]]),/one accepted primary/);
  const own=offices.find(o=>o.coordinate_method==='company_published_map_link')!;
  assert.ok(own);assert.throws(()=>parseOffices([{...own,coordinate_source_url:'https://unrelated.example/coordinates'}]));
});
test('office layer covers the full filtered cohort independently of directory pagination, without changing coordinates or totals',()=>{
  const city=build({city:'Bengaluru',limit:1,offset:500});
  const expected=snapshot.companies.filter(company=>company.city==='Bengaluru'||company.directory_profile?.india_presence.cities.includes('Bengaluru')||offices.some(o=>o.company_slug===company.slug)).length;
  assert.equal(city.offices.length,offices.length);assert.equal(city.matched_companies,expected);
  assert.equal(city.hubs[0].company_count,expected);assert.equal(city.mapped_companies,expected);
  assert.equal(city.precision,'mixed_city_and_office');
  for(const point of city.office_features){
    const office=offices.find(office=>office.company_slug===point.id)!;
    assert.deepEqual(point.geometry.coordinates,[office.longitude,office.latitude]);
    assert.notDeepEqual(point.geometry.coordinates,[city.hubs[0].longitude,city.hubs[0].latitude]);
  }
  const all=build();assert.equal(all.matched_companies,snapshot.companies.length);
  assert.equal(all.hubs.reduce((n,hub)=>n+hub.company_count,0),all.mapped_companies);
  assert.ok(Buffer.byteLength(JSON.stringify(all))<150000);
});
test('geographical office filtering preserves a different source-reported HQ and keeps list/map totals consistent',()=>{
  const filters=companyFiltersSchema.parse({city:'Bengaluru',q:'Zepto'}),list=queryArchive(snapshot,filters,offices),map=build({city:'Bengaluru',q:'Zepto'});
  assert.equal(list.total,1);assert.equal(map.matched_companies,list.total);
  const source=snapshot.companies.find(c=>c.slug==='zepto')!;
  assert.equal(list.companies[0].city,source.city);assert.equal(map.offices[0].reported_city,source.city);assert.equal(map.offices[0].office?.city,'Bengaluru');
  assert.equal(map.offices[0].directory_row?.tracked_amount_usd,list.companies[0].tracked_amount_usd);
  assert.equal(build({city:'Mumbai'}).offices.length,0);
  assert.equal(build({q:'SatSure',city:'Mumbai'}).offices.length,0);
  assert.equal(build({q:'Sarvam'}).offices[0].office?.place_name,'Urban Vault 732');
});
test('co-located companies retain identical campus coordinates and independent company identities',()=>{
  const map=build(),meesho=map.office_features.find(f=>f.id==='meesho')!,ninjacart=map.office_features.find(f=>f.id==='ninjacart')!;
  assert.deepEqual(meesho.geometry.coordinates,ninjacart.geometry.coordinates);assert.notEqual(meesho.id,ninjacart.id);
  assert.equal(map.office_features.length,new Set(map.offices.map(company=>company.slug)).size);
  assert.ok(inventory.companies.filter(c=>c.status!=='accepted').length>0);
  const unknown=build({q:'Collamo'});assert.equal(unknown.offices.length,0);assert.equal(unknown.precision,'representative_city_centre');
});
