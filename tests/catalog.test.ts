import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {composeCatalog} from '../src/domain/catalog';
import {parseDirectoryEntries} from '../src/domain/directory-profile';
import {companyFiltersSchema,queryArchive} from '../src/domain/archive-queries';
import {buildStartupMap,type CompanyInfo} from '../src/domain/startup-map';
import {parseOffices} from '../src/domain/offices';
import type {ArchiveSnapshot} from '../src/domain/notion-archive';
import directory from '../data/company-directory.json';
import locations from '../data/bengaluru-offices.json';
import profiles from '../data/company-info.json';
import cities from '../data/city-centres.json';
const archive=JSON.parse(await readFile('data/bwm-archive.json','utf8')) as ArchiveSnapshot;
const entries=parseDirectoryEntries(directory.companies),catalog=composeCatalog(archive,entries),offices=parseOffices(locations.offices);

test('reviewed companies without rounds join the catalog without altering source funding evidence or totals',()=>{
  assert.ok(entries.length>=10);const additions=entries.filter(e=>!archive.companies.some(c=>c.slug===e.slug));
  assert.equal(catalog.companies.length,archive.companies.length+additions.length);
  const all=companyFiltersSchema.parse({});
  assert.deepEqual(queryArchive(catalog,all,offices).metrics,{...queryArchive(archive,all,offices).metrics,company_count:catalog.companies.length});
  const company=composeCatalog({...archive,companies:[]},entries).companies.find(c=>c.slug==='zerodha')!;
  assert.equal(company.tracked_amount_usd,null);assert.deepEqual(company.rounds,[]);
  assert.deepEqual(catalog.coverage,archive.coverage);
});
test('funding filters deliberately exclude no-event companies, while identity and evidence filters retain them',()=>{
  const pilot=composeCatalog({...archive,companies:[]},entries);
  const ordinary=queryArchive(pilot,companyFiltersSchema.parse({q:'Zerodha'}),offices);
  assert.equal(ordinary.total,1);assert.equal(ordinary.companies[0].tracked_amount_usd,null);assert.equal(ordinary.companies[0].unpriced_event_count,0);
  assert.equal(queryArchive(pilot,companyFiltersSchema.parse({q:'Zerodha',from:'2024-01-01'}),offices).total,0);
  assert.equal(queryArchive(pilot,companyFiltersSchema.parse({tag:'bootstrapped'}),offices).total,2);
  assert.equal(queryArchive(pilot,companyFiltersSchema.parse({tag:'profile'}),offices).total,entries.length);
});
test('list and map agree on reviewed India office cities without turning a global office into an Indian HQ',()=>{
  const filters=companyFiltersSchema.parse({city:'Bengaluru',q:'Freshworks'});
  const list=queryArchive(catalog,filters,offices),map=buildStartupMap(catalog,filters,cities.cities,profiles.companies as CompanyInfo[],cities.source_url,offices);
  assert.equal(list.total,1);assert.equal(map.matched_companies,list.total);assert.equal(map.hubs[0].name,'Bengaluru');assert.equal(map.offices.length,1);
  assert.equal(map.offices[0].office?.place_name,'RMZ EcoWorld Campus 32');assert.equal(map.offices[0].office?.precision,'campus');
  assert.equal(catalog.companies.find(c=>c.slug==='freshworks')?.directory_profile?.headquarters?.city,'San Mateo');
  assert.equal(queryArchive(catalog,companyFiltersSchema.parse({q:'Freshworks',city:'Chennai'}),offices).total,1);
});
test('directory aliases or conflicting domains cannot silently create duplicate company identities',()=>{
  assert.throws(()=>parseDirectoryEntries([entries[0],entries[0]]),/Duplicate directory/);
  const fake={...entries[0],slug:'other-name'};
  assert.throws(()=>composeCatalog({...archive,companies:[{...catalog.companies.find(c=>c.slug===entries[0].slug)!,slug:'old-alias'}]},[fake]),/Review directory alias/);
  assert.throws(()=>parseDirectoryEntries([{...entries[0],evidence:entries[0].evidence.filter(e=>e.kind!=='curation')}]),/both discovery/);
  assert.throws(()=>parseDirectoryEntries([{...entries[0],website_url:'https://secret:password@example.com'}]));
});
