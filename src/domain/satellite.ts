import type {StyleSpecification} from 'maplibre-gl';

// MapLibre uses 512 px camera tiles; this source uses 256 px tiles at native z14.
export const SATELLITE_MAX_ZOOM=13;
export const satelliteAttribution='<a href="https://cloudless.eox.at">EOxCloudless</a> by <a href="https://eox.at">EOX IT Services GmbH</a> (Contains modified Copernicus Sentinel data 2016) · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>';
export function satelliteStyle():StyleSpecification{
  return {version:8,name:'Satellite · EOxCloudless 2016',glyphs:'/api/basemap/fonts/{fontstack}/{range}.pbf',sources:{satellite:{type:'raster',tiles:['/api/basemap/imagery/2016/{z}/{x}/{y}.jpg'],tileSize:256,minzoom:0,maxzoom:14,attribution:satelliteAttribution}},layers:[{id:'satellite-background',type:'background',paint:{'background-color':'#15241c'}},{id:'satellite-imagery',type:'raster',source:'satellite',paint:{'raster-fade-duration':180}}]};
}
