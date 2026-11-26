import test from 'node:test';
import assert from 'node:assert/strict';
import {parseGreenhouse,parseSmartRecruiters,jobSummary,type JobSource,type JobsSnapshot} from '../src/domain/jobs';
const source:JobSource={id:'company-gh',company_slug:'example',provider:'greenhouse',board:'example',careers_url:'https://example.com/careers',identity_source_url:'https://example.com/careers',listing_url:'https://boards-api.greenhouse.io/v1/boards/example/jobs',checked_on:'2026-11-26'};
test('published jobs retain only minimal metadata and deduplicable provider identity, not descriptions or contacts',()=>{
  const rows=parseGreenhouse({jobs:[{id:1,title:'Engineer',location:{name:'Bengaluru; Mumbai'},absolute_url:'https://job-boards.greenhouse.io/example/jobs/1',content:'Do not retain descriptions',creator:{email:'private@example.com'}}]},source);
  assert.deepEqual(rows[0].cities,['Bengaluru','Mumbai']);assert.equal(rows[0].country,'IN');assert.equal(rows[0].workplace,'unknown');
  assert.ok(!JSON.stringify(rows).includes('private'));assert.ok(!JSON.stringify(rows).includes('descriptions'));
  assert.throws(()=>parseGreenhouse({jobs:[{id:1,title:'Engineer',location:{name:'India'},absolute_url:'https://job-boards.greenhouse.io/other-employer/jobs/1'}]},source),/Unexpected employer/);
});
test('SmartRecruiters discards nonpublic postings and never turns job-address fields into an office location',()=>{
  const row={id:'1',name:'Engineer',visibility:'PUBLIC',company:{identifier:'example'},location:{city:'Bengaluru',country:'in',fullLocation:'Bengaluru, India',address:'Not retained',latitude:12.9,longitude:77.6}};
  const data=parseSmartRecruiters({totalFound:3,offset:0,content:[row,{...row,id:'2',visibility:'INTERNAL'},{...row,id:'3',visibility:'PRIVATE'}]},source);
  assert.equal(data.items.length,1);assert.equal(data.items[0].country,'IN');assert.ok(!JSON.stringify(data.items).includes('Not retained'));assert.ok(!JSON.stringify(data.items).includes('latitude'));
  assert.throws(()=>parseSmartRecruiters({totalFound:1,offset:0,content:[{...row,company:{identifier:'other'}}]},source),/Unexpected employer/);
});
test('hiring counts hide after 72 hours, preserve missing and failed checks, and do not infer India eligibility from remote',()=>{
  const now=new Date('2026-11-26T12:00:00Z');
  const items=parseGreenhouse({jobs:[{id:1,title:'Remote engineer',location:{name:'Remote'},absolute_url:'https://job-boards.greenhouse.io/example/jobs/1'}]},source);
  const snapshot:JobsSnapshot={version:1,updated_at:now.toISOString(),stale_after_hours:72,sources:[{...source,status:'error',checked_at:now.toISOString(),last_success_at:'2026-11-25T12:00:00Z',job_count:1,error:'timeout'}],items};
  assert.equal(jobSummary(snapshot,'example',now)?.india,0);assert.equal(jobSummary(snapshot,'example',now)?.total,1);assert.equal(jobSummary(snapshot,'unknown',now),null);
  for(const last_success_at of ['2026-11-20T12:00:00Z','invalid','2027-01-01T00:00:00Z']){
    const summary=jobSummary({...snapshot,sources:[{...snapshot.sources[0],last_success_at}]},'example',now)!;
    assert.equal(summary.stale,true);assert.equal(summary.total,null);assert.deepEqual(summary.items,[]);
  }
});
