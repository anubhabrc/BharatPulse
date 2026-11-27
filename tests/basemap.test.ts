import test from 'node:test';
import assert from 'node:assert/strict';
import {basemapResource,localBasemapRequest} from '../src/domain/basemap';
import {satelliteStyle} from '../src/domain/satellite';

test('map gateway only permits known styles, manifests, sprites, glyphs and bounded tiles',()=>{
  for(const path of ['styles/liberty','styles/positron','styles/dark','backup_planet','planet','sprites/ofm_f384/ofm@2x.png','sprites/ofm_f384/ofm.json','fonts/Noto Sans Bold/0-255.pbf','backup_planet/20261122_124456_pt/12/2927/1899.pbf','natural_earth/ne2sr/2/1/1.png'])assert.ok(basemapResource(path.split('/')),path);
  for(const path of ['https://example.com','styles/other','../styles/liberty','fonts/../../secret','planet/20261122_124456_pt/19/999999/1.pbf','planet/20261122_124456_pt/20/1/1.pbf','styles/liberty?url=https://example.com','styles/%2e%2e','fonts/Unknown/0-255.pbf'])assert.equal(basemapResource(path.split('/')),null,path);
  assert.equal(basemapResource(['styles','liberty'])?.url,'https://tiles.openfreemap.org/styles/liberty');
});
test('satellite gateway bounds imagery requests and maps XYZ to the provider row/column order',()=>{
  const tile=basemapResource(['imagery','2016','12','2931','1899.jpg']);
  assert.equal(tile?.url,'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/12/1899/2931.jpg');
  assert.equal(tile?.contentType,'image/jpeg');assert.equal(tile?.ttl,86400);
  for(const path of ['imagery/2025/12/2931/1899.jpg','imagery/2016/15/2931/1899.jpg','imagery/2016/0/1/0.jpg','imagery/2016/12/-1/0.jpg','imagery/2016/12/0/4096.jpg','imagery/2016/12/0/1.jpg?url=https://example.com'])assert.equal(basemapResource(path.split('/')),null,path);
});
test('satellite style declares vintage, limited native zoom, local tiles and visible source/licence credits',()=>{
  const style=satelliteStyle(),source=style.sources.satellite;
  assert.equal(source.type,'raster');if(source.type!=='raster')throw new Error('Expected raster imagery');
  assert.equal(source.maxzoom,14);assert.deepEqual(source.tiles,['/api/basemap/imagery/2016/{z}/{x}/{y}.jpg']);
  assert.match(source.attribution!,/2016/);assert.match(source.attribution!,/EOX/);assert.match(source.attribution!,/CC BY 4.0/);
  assert.ok(style.layers.some(layer=>layer.type==='raster'));
});
test('MapLibre resources use the same origin without redirecting other URLs',()=>{
  assert.equal(localBasemapRequest('https://tiles.openfreemap.org/fonts/Noto%20Sans%20Bold/0-255.pbf'),'/api/basemap/fonts/Noto%20Sans%20Bold/0-255.pbf');
  assert.equal(localBasemapRequest('https://evil.example/tiles'), 'https://evil.example/tiles');
  assert.equal(localBasemapRequest('/api/basemap/styles/liberty'),'/api/basemap/styles/liberty');
});
