import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {boxSelection,containsPoint,distanceMeters,selectionPolygon,selectionSchema} from '../src/domain/area-geometry';
import {buildSpatialDataset,rentObservationSchema} from '../src/domain/spatial-data';
import {summarizeArea} from '../src/domain/area-summary';
import {companyFiltersSchema} from '../src/domain/archive-queries';
import type {ArchiveSnapshot} from '../src/domain/notion-archive';
import type {JobsSnapshot,JobSource} from '../src/domain/jobs';
import type {NewsSnapshot} from '../src/domain/news';
import {parseOffices} from '../src/domain/offices';
import officeData from '../data/bengaluru-offices.json';
const archive=JSON.parse(await readFile('data/bwm-archive.json','utf8')) as ArchiveSnapshot;
const realOffices=parseOffices(officeData.offices),now=new Date('2026-11-27T12:00:00Z');
const filters=companyFiltersSchema.parse({city:'Bengaluru',limit:1,offset:100});
const area=boxSelection([77,12],[78,14]);
function fixture(){
  const catalog=structuredClone(archive);catalog.companies=catalog.companies.slice(0,3).map((c,i)=>({...c,slug:`company-${i}`,brand_name:`Company ${i}`,reported_names:[`Company ${i}`],city:'Bengaluru',sector:'Test sector',directory_profile:undefined,rounds:[{...c.rounds[0],id:`round-${i}`,stage:'Seed',announced_on:'2026-01-01',amount_usd:i===0?'100.0001':null,included_in_totals:true,quality_flags:[]}]}));
  const offices=realOffices.slice(0,2).map((o,i)=>({...o,id:`office-${i}`,company_slug:`company-${i}`,longitude:77.5,latitude:13,checked_on:'2026-11-26'}));
  const source:JobSource={id:'jobs-0',company_slug:'company-0',provider:'greenhouse',board:'test',careers_url:'https://example.com/careers',identity_source_url:'https://example.com/careers',listing_url:'https://example.com/jobs',checked_on:'2026-11-26'};
  const jobs:JobsSnapshot={version:1,updated_at:now.toISOString(),stale_after_hours:72,sources:[{...source,status:'ok',checked_at:now.toISOString(),last_success_at:now.toISOString(),job_count:3,error:null}],items:[
    {id:'1',source_id:source.id,company_slug:source.company_slug,title:'Engineer',location:'Bengaluru / Mumbai',country:'IN',cities:['Bengaluru','Mumbai'],workplace:'hybrid',url:'https://example.com/jobs/1',published_at:null,updated_at:null},
    {id:'2',source_id:source.id,company_slug:source.company_slug,title:'Remote',location:'India remote',country:'IN',cities:[],workplace:'remote',url:'https://example.com/jobs/2',published_at:null,updated_at:null},
  ]};
  const news:NewsSnapshot={schema_version:1,updated_at:now.toISOString(),retention_days:90,feeds:[],items:[{id:'news-1',title:'Two company names',url:'https://example.com/news/1',published_at:now.toISOString(),source_id:'test',source_name:'Test',company_slugs:['company-0','company-1'],tags:[]}]};
  return buildSpatialDataset(catalog,offices,jobs,news);
}
test('circle and polygon queries include their boundaries and retain precise circle distance',()=>{
  const circle=selectionSchema.parse({type:'Circle',center:[77.5,13],radius_m:1000}),edge=selectionPolygon(circle).coordinates[0][0] as [number,number];
  assert.ok(Math.abs(distanceMeters(circle.type==='Circle'?circle.center:[0,0],edge)-1000)<.001);
  assert.equal(containsPoint(circle,edge),true);assert.equal(containsPoint(circle,[77.6,13]),false);
  assert.equal(containsPoint(area,[77,13]),true);assert.equal(containsPoint(area,[78,14]),true);assert.equal(containsPoint(area,[78.01,13]),false);
  const concave=selectionSchema.parse({type:'Polygon',coordinates:[[[77,12],[78,12],[77.5,12.5],[78,13],[77,13],[77,12]]]});
  assert.equal(containsPoint(concave,[77.9,12.5]),false);assert.equal(containsPoint(concave,[77.1,12.5]),true);
});
test('rejects degenerate, crossing, unclosed, excessive and unsupported selections',()=>{
  for(const selection of [boxSelection([77,12],[77,13]),{type:'Polygon',coordinates:[[[77,12],[78,13],[78,12],[77,13],[77,12]]]},{type:'Polygon',coordinates:[[[77,12],[78,12],[78,13],[77,13]]]},{type:'Circle',center:[77,13],radius_m:100001},{type:'Circle',center:[77,13],radius_m:1},{type:'Circle',center:[77,90],radius_m:1000},{type:'Polygon',coordinates:[[[179,12],[-179,12],[-179,13],[179,12]]]}])assert.equal(selectionSchema.safeParse(selection).success,false);
});
test('area totals deduplicate company facts and shared news, preserve evidence and omit city-only companies',()=>{
  const data=fixture(),summary=summarizeArea(data,area,filters,now);
  assert.equal(summary.companies.length,2);assert.equal(summary.funding.reported_usd,'100.0001');assert.equal(summary.funding.events,2);assert.equal(summary.funding.unpriced_events,1);
  assert.equal(summary.news.count,1);assert.deepEqual(summary.sectors,[{label:'Test sector',count:2}]);
  assert.equal(summary.coverage.unlocated_companies,1);assert.equal(summary.coverage.selected_offices,2);
  assert.equal(summary.offices[0].coordinate_source_url,realOffices[0].coordinate_source_url);
  assert.equal(summary.funding.basis,'company_history_at_current_offices');assert.equal(summary.news.basis,'company_related');
  data.offices.push({...data.offices[0],id:'second-office'});
  const multi=summarizeArea(data,area,filters,now);assert.equal(multi.companies.length,2);assert.equal(multi.funding.reported_usd,'100.0001');assert.equal(multi.jobs.employer_city_count,1);
});
test('jobs remain city-level, deduplicated and freshness-qualified; missing layers remain null',()=>{
  const data=fixture();data.jobs.items.push(data.jobs.items[0]);
  let summary=summarizeArea(data,area,filters,now);
  assert.equal(summary.jobs.employer_city_count,1);assert.equal(summary.jobs.area_count,null);assert.equal(summary.jobs.employers_covered,1);assert.equal(summary.rents.count,null);
  summary=summarizeArea(data,area,filters,new Date('2026-12-01'));
  assert.equal(summary.jobs.employer_city_count,null);assert.equal(summary.jobs.stale_employers,1);assert.equal(summary.jobs.items.length,0);
  summary=summarizeArea(data,boxSelection([70,10],[71,11]),filters,now);
  assert.equal(summary.companies.length,0);assert.equal(summary.funding.reported_usd,null);assert.equal(summary.jobs.employer_city_count,null);
});
test('funding and identity filters apply to the entire area cohort independently of pagination',()=>{
  const data=fixture();
  const selected=summarizeArea(data,area,{...filters,q:'Company 0'},now);assert.equal(selected.companies.length,1);
  assert.equal(summarizeArea(data,area,{...filters,from:'2026-02-01'},now).companies.length,0);
  assert.equal(summarizeArea(data,area,{...filters,city:'Mumbai'},now).companies.length,0);
  const future=structuredClone(data);future.offices[0].checked_on='2026-12-01';assert.equal(summarizeArea(future,area,filters,now).companies.length,1);
});
test('future rent observations require explicit location, units, evidence and chronological dates',()=>{
  const rent={id:'rent-1',geometry:{type:'Point',coordinates:[77.5,13]},precision:'building',property_type:'office',amount_inr:'125.50',basis:'per_sqft_month',observation_kind:'asking',observed_on:'2026-11-26',checked_on:'2026-11-27',source_url:'https://example.com/listing'};
  assert.equal(rentObservationSchema.safeParse(rent).success,true);
  for(const bad of [{...rent,basis:undefined},{...rent,source_url:'http://example.com'},{...rent,observed_on:'2026-12-01'},{...rent,amount_inr:'0'}])assert.equal(rentObservationSchema.safeParse(bad).success,false);
});
