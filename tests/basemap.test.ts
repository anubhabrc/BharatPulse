import test from 'node:test';
import assert from 'node:assert/strict';
import {basemapResource,localBasemapRequest} from '../src/domain/basemap';

test('map gateway only permits known styles, manifests, sprites, glyphs and bounded tiles',()=>{
  for(const path of ['styles/liberty','styles/positron','styles/dark','backup_planet','planet','sprites/ofm_f384/ofm@2x.png','sprites/ofm_f384/ofm.json','fonts/Noto Sans Bold/0-255.pbf','backup_planet/20261122_124456_pt/12/2927/1899.pbf','natural_earth/ne2sr/2/1/1.png'])assert.ok(basemapResource(path.split('/')),path);
  for(const path of ['https://example.com','styles/other','../styles/liberty','fonts/../../secret','planet/20261122_124456_pt/19/999999/1.pbf','planet/20261122_124456_pt/20/1/1.pbf','styles/liberty?url=https://example.com','styles/%2e%2e','fonts/Unknown/0-255.pbf'])assert.equal(basemapResource(path.split('/')),null,path);
  assert.equal(basemapResource(['styles','liberty'])?.url,'https://tiles.openfreemap.org/styles/liberty');
});
test('MapLibre resources use the same origin without redirecting other URLs',()=>{
  assert.equal(localBasemapRequest('https://tiles.openfreemap.org/fonts/Noto%20Sans%20Bold/0-255.pbf'),'/api/basemap/fonts/Noto%20Sans%20Bold/0-255.pbf');
  assert.equal(localBasemapRequest('https://evil.example/tiles'), 'https://evil.example/tiles');
  assert.equal(localBasemapRequest('/api/basemap/styles/liberty'),'/api/basemap/styles/liberty');
});
