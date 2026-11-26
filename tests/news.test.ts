import test from 'node:test';
import assert from 'node:assert/strict';
import {parseFeed,cleanHeadline,matchNewsCompanies,mergeNews,type FeedSource} from '../src/domain/news';
const source:FeedSource={id:'test',name:'Test publication',url:'https://publisher.example/rss',allowed_hosts:['publisher.example'],enabled:true,usage:'headline_metadata_only'};
const now=new Date('2026-11-25T12:00:00Z');
test('headlines decode bounded double-escaped Unicode punctuation and safely handle invalid entities',()=>{
  assert.equal(cleanHeadline('Company&amp;#8217;s &amp;#x2014; update'),'Company’s — update');
  assert.equal(cleanHeadline('&lt;b&gt;News&lt;/b&gt; &#99999999;'),'News &#99999999;');
});
const rss=(items:string)=>`<?xml version="1.0"?><rss version="2.0"><channel>${items}</channel></rss>`;
const item=(url='https://publisher.example/round',date='Wed, 25 Nov 2026 06:00:00 GMT')=>`<item><title><![CDATA[Zepto raises $20 million &amp; expands]]></title><link>${url}</link><pubDate>${date}</pubDate><description>Do not persist this article body</description></item>`;
test('RSS imports bounded headline metadata and funding tags, without article bodies',()=>{
  const rows=parseFeed(rss(item()),source,now);assert.equal(rows.length,1);assert.equal(rows[0].title,'Zepto raises $20 million & expands');assert.deepEqual(rows[0].tags,['funding']);assert.ok(!JSON.stringify(rows).includes('article body'));
});
test('Atom alternate links and timestamps are supported',()=>{
  const rows=parseFeed('<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Meesho IPO update</title><link rel="self" href="https://publisher.example/atom/1"/><link rel="alternate" href="https://publisher.example/meesho"/><updated>2026-11-25T02:00:00Z</updated></entry></feed>',source,now);
  assert.equal(rows[0].url,'https://publisher.example/meesho');assert.deepEqual(rows[0].tags,['ipo']);
});
test('malformed, entity-bearing and oversized XML fail closed',()=>{
  for(const xml of ['<rss><channel></rss>','<!DOCTYPE rss [<!ENTITY x SYSTEM "file:///etc/passwd">]><rss/>','x'.repeat(2_000_001),'<html>blocked</html>'])assert.throws(()=>parseFeed(xml,source,now));
});
test('unsafe URLs, unexpected hosts, invalid dates and far future entries are omitted',()=>{
  for(const [url,date] of [['javascript:alert(1)','2026-11-25'],['https://evil.example/a','2026-11-25'],['https://publisher.example/a','invalid'],['https://publisher.example/a','2027-01-01']])assert.equal(parseFeed(rss(item(url,date)),source,now).length,0);
});
test('company links require complete names and avoid short or ambiguous terms',()=>{
  const companies=[{slug:'zepto',brand_name:'Zepto',reported_names:['Zepto']},{slug:'open',brand_name:'Open',reported_names:['Open']},{slug:'jar',brand_name:'Jar',reported_names:['Jar']}];
  assert.deepEqual(matchNewsCompanies('Open markets: Zepto raises funding',companies),['zepto']);assert.deepEqual(matchNewsCompanies('Zeptonic opens a jar',companies),[]);
});
test('URL normalization deduplicates updates, retains old feed items and bounds retention',()=>{
  const old=parseFeed(rss(item()),source,now)[0],newer={...old,title:'Updated headline',url:old.url+'?utm_source=rss'};
  const merged=mergeNews([old,{...old,url:'https://publisher.example/old',published_at:'2026-01-01T00:00:00Z'}],[newer],now);
  assert.equal(merged.length,1);assert.equal(merged[0].title,'Updated headline');assert.equal(mergeNews([old],[],now).length,1);
});
