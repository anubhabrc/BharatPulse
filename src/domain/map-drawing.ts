import {boxSelection,distanceMeters,selectionSchema,type AreaSelection,type Position} from './area-geometry';

export type DrawTool='freehand'|'circle'|'box';
export type ScreenPoint=[number,number];
const squared=(a:ScreenPoint,b:ScreenPoint)=>(a[0]-b[0])**2+(a[1]-b[1])**2;
function segmentDistance(p:ScreenPoint,a:ScreenPoint,b:ScreenPoint){
  const length=squared(a,b),t=length?Math.max(0,Math.min(1,((p[0]-a[0])*(b[0]-a[0])+(p[1]-a[1])*(b[1]-a[1]))/length)):0;
  return squared(p,[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);
}
// Iterative Douglas–Peucker avoids both noisy touch vertices and recursive stack growth.
export function simplifyStroke(points:ScreenPoint[],tolerance=2):ScreenPoint[]{
  if(points.length<3)return points;
  const keep=new Set([0,points.length-1]),stack=[[0,points.length-1]];
  while(stack.length){const [start,end]=stack.pop()!;let furthest=-1,distance=tolerance*tolerance;
    for(let i=start+1;i<end;i++){const d=segmentDistance(points[i],points[start],points[end]);if(d>distance){furthest=i;distance=d;}}
    if(furthest>=0){keep.add(furthest);stack.push([start,furthest],[furthest,end]);}
  }
  return [...keep].sort((a,b)=>a-b).map(i=>points[i]);
}
export function closeStroke(points:ScreenPoint[]):ScreenPoint[]{
  if(points.length<3)return points;
  // Snap at the first return to the start, ignoring the tiny overshoot common with fingers.
  let length=0,end=points.length;
  for(let i=1;i<points.length;i++){length+=Math.sqrt(squared(points[i-1],points[i]));if(i>5&&length>90&&squared(points[0],points[i])<=18**2){end=i;break;}}
  let tolerance=2,ring=simplifyStroke(points.slice(0,end),tolerance);
  while(ring.length>190){tolerance*=1.5;ring=simplifyStroke(points.slice(0,end),tolerance);}
  if(ring.length>1&&squared(ring[0],ring.at(-1)!)<4)ring=ring.slice(0,-1);
  return [...ring,ring[0]];
}
export function drawingPath(tool:DrawTool,points:ScreenPoint[],closed=false):string{
  if(!points.length)return '';
  const a=points[0],b=points.at(-1)!;
  if(tool==='circle'){const r=Math.sqrt(squared(a,b));return `M ${a[0]-r} ${a[1]} a ${r} ${r} 0 1 0 ${2*r} 0 a ${r} ${r} 0 1 0 ${-2*r} 0 Z`;}
  if(tool==='box')return `M ${a[0]} ${a[1]} L ${b[0]} ${a[1]} L ${b[0]} ${b[1]} L ${a[0]} ${b[1]} Z`;
  return points.map((p,i)=>`${i?'L':'M'} ${p[0]} ${p[1]}`).join(' ')+(closed?' Z':'');
}
export function finishDrawing(tool:DrawTool,points:ScreenPoint[],unproject:(point:ScreenPoint)=>Position):{selection:AreaSelection;outline:ScreenPoint[]}|{error:string}{
  if(points.length<2||(tool==='circle'?squared(points[0],points.at(-1)!)<16**2:Math.max(...points.map(p=>p[0]))-Math.min(...points.map(p=>p[0]))<16||Math.max(...points.map(p=>p[1]))-Math.min(...points.map(p=>p[1]))<16))return {error:'Draw a larger area with one continuous drag.'};
  const first=unproject(points[0]),last=unproject(points.at(-1)!);
  const outline=tool==='freehand'?closeStroke(points):[points[0],points.at(-1)!];
  const candidate=tool==='circle'?{type:'Circle',center:first,radius_m:distanceMeters(first,last)}:tool==='box'?boxSelection(first,last):{type:'Polygon',coordinates:[outline.map(unproject)]};
  const parsed=selectionSchema.safeParse(candidate);
  if(!parsed.success)return {error:tool==='freehand'?'The outline crosses itself or is too small. Redraw a simple loop.':'Choose a larger area. Circle radius must be 25 m–100 km.'};
  return {selection:parsed.data,outline};
}
