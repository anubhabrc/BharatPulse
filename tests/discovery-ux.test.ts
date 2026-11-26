import test from 'node:test';
import assert from 'node:assert/strict';
import {suggestCompanies} from '../src/domain/company-search';
import {newsPageForStory,newsStoryHref} from '../src/domain/news-navigation';
import {automaticBasemap,streetRoadColor} from '../src/domain/map-palette';

test('company suggestions start at one character, rank exact/prefix before substring and retain source aliases',()=>{
  const companies=[{slug:'big',name:'BigBasket'},{slug:'beta',name:'Beta'},{slug:'b',name:'B'},{slug:'old',name:'New Brand',aliases:['Bharat Tools']}];
  assert.deepEqual(suggestCompanies(companies,'b').map(c=>c.slug),['b','beta','big','old']);
  assert.deepEqual(suggestCompanies(companies,'  BHARAT ').map(c=>c.slug),['old']);
  assert.deepEqual(suggestCompanies(companies,'basket').map(c=>c.slug),['big']);
  assert.equal(suggestCompanies(companies,'b',2).length,2);
  assert.deepEqual(suggestCompanies(companies,' '),[]);assert.deepEqual(suggestCompanies(companies,'unmatched'),[]);
});
test('ticker stories land on the containing newsroom page and retain a safe exact headline anchor',()=>{
  const items=Array.from({length:123},(_,i)=>({id:`story-${i}`}));
  assert.equal(newsPageForStory(items,'story-65','1'),2);
  assert.equal(newsPageForStory(items,'story-122',undefined),3);
  for(const page of ['-3','NaN','2.4'])assert.equal(newsPageForStory(items,'unknown',page),1);
  assert.equal(newsPageForStory(items,undefined,'99'),3);assert.equal(newsPageForStory([],undefined,'99'),1);
  assert.equal(newsStoryHref('a&b/c'),'/news?story=a%26b%2Fc#headline-a%26b%2Fc');
});
test('neutral streets include bridges and tunnels without recolouring railway, water or text layers',()=>{
  for(const id of ['road_motorway','bridge_trunk_primary','tunnel_motorway_link','road_minor_casing'])assert.match(streetRoadColor(id)!,/^#[0-9a-f]{6}$/);
  for(const id of ['waterway_tunnel','road_major_rail','bridge_transit_rail_hatching','highway-name-major','water','building'])assert.equal(streetRoadColor(id),null,id);
});

test('automatic map appearance follows local 6pm/6am boundaries',()=>{
  for(const [hour,minute,expected] of [[0,0,'dark'],[5,59,'dark'],[6,0,'streets'],[17,59,'streets'],[18,0,'dark'],[23,59,'dark']] as const)
    assert.equal(automaticBasemap(new Date(2026,10,27,hour,minute)),expected);
});
