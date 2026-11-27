import {z} from 'zod';
import type {Polygon} from 'geojson';

export type Position=[number,number];
const point=z.tuple([z.number().min(-180).max(180),z.number().min(-85).max(85)]);
const cross=(a:Position,b:Position,c:Position)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function onSegment(p:Position,a:Position,b:Position){return Math.abs(cross(a,b,p))<1e-10&&p[0]>=Math.min(a[0],b[0])-1e-10&&p[0]<=Math.max(a[0],b[0])+1e-10&&p[1]>=Math.min(a[1],b[1])-1e-10&&p[1]<=Math.max(a[1],b[1])+1e-10;}
function intersects(a:Position,b:Position,c:Position,d:Position){
  return cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0||onSegment(a,c,d)||onSegment(b,c,d)||onSegment(c,a,b)||onSegment(d,a,b);
}
export function validRing(ring:Position[]){
  const last=ring.length-1;
  if(ring[0][0]!==ring[last][0]||ring[0][1]!==ring[last][1])return false;
  if(Math.max(...ring.map(p=>p[0]))-Math.min(...ring.map(p=>p[0]))>=180)return false;
  let area=0;
  for(let i=0;i<last;i++){
    const a=ring[i],b=ring[i+1];if(a[0]===b[0]&&a[1]===b[1])return false;
    area+=a[0]*b[1]-b[0]*a[1];
    for(let j=i+2;j<last;j++)if(!(i===0&&j===last-1)&&intersects(a,b,ring[j],ring[j+1]))return false;
  }
  return Math.abs(area)>1e-10;
}
export const selectionSchema=z.discriminatedUnion('type',[
  z.object({type:z.literal('Circle'),center:point,radius_m:z.number().min(25).max(100000)}).strict(),
  z.object({type:z.literal('Polygon'),coordinates:z.tuple([z.array(point).min(4).max(256)])}).strict(),
]).superRefine((shape,ctx)=>{if(shape.type==='Polygon'&&!validRing(shape.coordinates[0]))ctx.addIssue({code:'custom',message:'Use one simple closed ring without intersections or a dateline crossing'});});
export type AreaSelection=z.infer<typeof selectionSchema>;
const radians=(v:number)=>v*Math.PI/180;
const degrees=(v:number)=>v*180/Math.PI;
export function distanceMeters(a:Position,b:Position){
  const lat=radians(b[1]-a[1]),lon=radians(b[0]-a[0]);
  const h=Math.sin(lat/2)**2+Math.cos(radians(a[1]))*Math.cos(radians(b[1]))*Math.sin(lon/2)**2;
  return 6371008.8*2*Math.asin(Math.min(1,Math.sqrt(h)));
}
export function containsPoint(shape:AreaSelection,p:Position){
  if(shape.type==='Circle')return distanceMeters(shape.center,p)<=shape.radius_m+0.001;
  const ring=shape.coordinates[0];let inside=false;
  for(let i=0,j=ring.length-2;i<ring.length-1;j=i++){
    const a=ring[j],b=ring[i];if(onSegment(p,a,b))return true;
    if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
}
export function boxSelection(a:Position,b:Position):AreaSelection{return {type:'Polygon',coordinates:[[[a[0],a[1]],[b[0],a[1]],[b[0],b[1]],[a[0],b[1]],[a[0],a[1]]]]};}
export function selectionPolygon(shape:AreaSelection):Polygon{
  if(shape.type==='Polygon')return shape;
  const [lon,lat]=shape.center.map(radians),angular=shape.radius_m/6371008.8;
  const ring:Position[]=Array.from({length:96},(_,i)=>{
    const bearing=i*2*Math.PI/96;
    const y=Math.asin(Math.sin(lat)*Math.cos(angular)+Math.cos(lat)*Math.sin(angular)*Math.cos(bearing));
    const x=lon+Math.atan2(Math.sin(bearing)*Math.sin(angular)*Math.cos(lat),Math.cos(angular)-Math.sin(lat)*Math.sin(y));
    return [degrees(x),degrees(y)];
  });ring.push(ring[0]);return {type:'Polygon',coordinates:[ring]};
}
