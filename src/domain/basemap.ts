// Only the resources used by our OpenFreeMap styles and one licensed imagery layer may be fetched.
// This is deliberately not a general URL proxy.
export function basemapResource(parts:string[]):{url:string;json:boolean;ttl:number;contentType?:string}|null {
  if(!parts.length||parts.some(p=>!p||p.length>180||/[\\/?#%\x00-\x1f]/.test(p)||p==='.'||p==='..'))return null;
  const path=parts.join('/');
  const imagery=/^imagery\/2016\/(\d{1,2})\/(\d{1,5})\/(\d{1,5})\.jpg$/.exec(path);
  if(imagery){const [,z,x,y]=imagery;if(Number(z)>14||Number(x)>=2**Number(z)||Number(y)>=2**Number(z))return null;return {url:`https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/${z}/${y}/${x}.jpg`,json:false,ttl:86400,contentType:'image/jpeg'};}
  const style=/^styles\/(liberty|positron|dark)$/.test(path);
  const manifest=/^(backup_planet|planet)$/.test(path);
  const sprite=/^sprites\/ofm_[a-zA-Z0-9_-]+\/ofm(@2x)?\.(json|png)$/.test(path);
  const glyph=/^fonts\/Noto Sans (Regular|Bold|Italic)(,Noto Sans (Regular|Bold|Italic))*\/\d{1,5}-\d{1,5}\.pbf$/.test(path);
  const tile=/^(backup_planet|planet)\/\d{8}_\d{6}_pt\/(\d{1,2})\/(\d+)\/(\d+)\.pbf$/.exec(path);
  const raster=/^natural_earth\/ne2sr\/(\d)\/(\d+)\/(\d+)\.png$/.exec(path);
  const validTile=tile&&Number(tile[2])<=19&&Number(tile[3])<2**Number(tile[2])&&Number(tile[4])<2**Number(tile[2]);
  const validRaster=raster&&Number(raster[1])<=6&&Number(raster[2])<2**Number(raster[1])&&Number(raster[3])<2**Number(raster[1]);
  if(!style&&!manifest&&!sprite&&!glyph&&!validTile&&!validRaster)return null;
  return {url:`https://tiles.openfreemap.org/${parts.map(encodeURIComponent).join('/')}`,json:style||manifest||path.endsWith('.json'),ttl:style||manifest?3600:86400};
}

export function localBasemapRequest(url:string):string {
  if(!url.startsWith('https://tiles.openfreemap.org/'))return url;
  return `/api/basemap/${url.slice('https://tiles.openfreemap.org/'.length)}`;
}
