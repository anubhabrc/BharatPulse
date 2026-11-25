import test from 'node:test';
import assert from 'node:assert/strict';
import fixture from '../data/demo-reviewed.json';
import { parseBatch,normalizeDomain,canonicalUrl,areaSchema } from '../src/domain/import-schema';
import {formatUsd} from '../src/domain/money';
const copy=()=>structuredClone(fixture);
test('valid fixture preserves decimal strings and source identity',()=>{
  const b=parseBatch(copy()); assert.equal(b.records[0].funding.amount_original,'1000000');
});
test('normalizes website signals without claiming identity',()=>{
  assert.equal(normalizeDomain('https://WWW.Example.com/path'),'example.com');
});
test('removes tracking parameters but retains semantic URL parameters',()=>{
  assert.equal(canonicalUrl('https://example.com/story?round=2&utm_source=test#top'),'https://example.com/story?round=2');
});
test('rejects invalid dates rather than rolling them into another month',()=>{
  const b=copy();b.records[0].funding.announced_on='2026-02-30';assert.throws(()=>parseBatch(b));
});
test('unknown amounts stay unknown; zero and negatives are rejected',()=>{
  const b=copy();(b.records[0].funding as {amount_original:string|null}).amount_original=null;assert.equal(parseBatch(b).records[0].funding.amount_original,null);
  for(const value of ['0','-10','NaN','1e9']) {b.records[0].funding.amount_original=value;assert.throws(()=>parseBatch(b));}
});
test('preserves exact large amounts beyond JavaScript integer precision',()=>{
  const b=copy();b.records[0].funding.amount_original='9007199254740993.1200';
  assert.equal(parseBatch(b).records[0].funding.amount_original,'9007199254740993.12');
  assert.equal(formatUsd('9007199254740993.120000'),'$9,007,199,254,740,993.12');
});
test('rejects credential-bearing and executable source URLs',()=>{
  for(const url of ['javascript:alert(1)','https://user:password@example.com']) {
    const b=copy();b.records[0].document.url=url;assert.throws(()=>parseBatch(b));
  }
});
test('unverified source reuse blocks publication input',()=>{
  const b=copy();b.sources[0].reuse_status='unverified';assert.throws(()=>parseBatch(b));
});
test('metadata-only sources cannot include excerpts',()=>{
  const b=copy();b.sources[0].reuse_status='metadata_only';assert.throws(()=>parseBatch(b));
});
test('synthetic sources cannot create apparently real companies',()=>{
  const b=copy();b.records[0].company.is_demo=false;assert.throws(()=>parseBatch(b));
});
test('duplicate source keys and undeclared source references are rejected',()=>{
  const b=copy();b.sources.push({...b.sources[0]});assert.throws(()=>parseBatch(b));
  const c=copy();c.records[0].document.source_key='missing';assert.throws(()=>parseBatch(c));
});
test('polygon validates bounds, closure and vertex count',()=>{
  assert.equal(areaSchema.safeParse({type:'Polygon',coordinates:[[[0,0],[1,0],[1,1],[0,0]]]}).success,true);
  for(const coordinates of [[[[0,0],[1,0],[1,1],[0,1]]],[[[0,0],[181,0],[1,1],[0,0]]], [Array.from({length:1001},()=>[0,0])]]) {
    assert.equal(areaSchema.safeParse({type:'Polygon',coordinates}).success,false);
  }
});
