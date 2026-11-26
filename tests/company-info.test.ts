import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseCompanyInfo} from '../src/domain/company-info';
import data from '../data/company-info.json';
import directory from '../data/company-directory.json';
import offices from '../data/bengaluru-offices.json';

const fixture={slug:'example',description:{text:'Builds developer tools.',source_url:'https://example.com/about'},founders:[],founded_year:null,checked_on:'2026-11-26'};
test('reviewed profiles require field-level public evidence and retain unknown founder/year values',()=>{
  assert.deepEqual(parseCompanyInfo([fixture],['example']),[fixture]);
  for(const description of [{text:'Unsourced'},{text:'',source_url:'https://example.com'},{text:'Tools',source_url:'http://example.com'},{text:'Tools',source_url:'https://user:password@example.com'}])
    assert.throws(()=>parseCompanyInfo([{...fixture,description}],['example']));
  assert.throws(()=>parseCompanyInfo([{...fixture,founders:[{name:'A Founder'}]}],['example']));
  assert.throws(()=>parseCompanyInfo([{...fixture,founded_year:{value:2015}}],['example']));
  assert.throws(()=>parseCompanyInfo([{...fixture,checked_on:'2026-02-30'}],['example']));
  assert.throws(()=>parseCompanyInfo([{...fixture,private_contact:'unreviewed field'}],['example']));
});
test('profile admission rejects unknown identities, duplicates and dates inconsistent with the source check',()=>{
  assert.throws(()=>parseCompanyInfo([fixture],[]),/Unknown company profile/);
  assert.throws(()=>parseCompanyInfo([fixture,fixture],['example']),/Duplicate company profile/);
  assert.throws(()=>parseCompanyInfo([{...fixture,founders:[{name:'A Founder',source_url:'https://example.com'},{name:'a  founder',source_url:'https://example.com'}]}],['example']),/Duplicate reviewed founder/);
  assert.throws(()=>parseCompanyInfo([{...fixture,founded_year:{value:2027,source_url:'https://example.com'}}],['example']),/cannot follow/);
});
test('all accepted Bengaluru office companies have reviewed profiles without changing the historical cohort',async()=>{
  const archive=JSON.parse(await readFile('data/bwm-archive.json','utf8'));
  const slugs=[...archive.companies,...directory.companies].map(company=>company.slug);
  const profiles=parseCompanyInfo([...data.companies,...directory.companies.map(entry=>({slug:entry.slug,description:entry.description,founders:entry.founders,founded_year:entry.founded_year,checked_on:entry.admission.checked_on}))],slugs);
  for(const office of offices.offices)assert.ok(profiles.some(profile=>profile.slug===office.company_slug),office.company_slug);
  assert.equal(profiles.find(profile=>profile.slug==='fluxgen')?.founded_year,null);
  assert.deepEqual(profiles.find(profile=>profile.slug==='shadowfax')?.founders,[]);
});
