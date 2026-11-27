import test from 'node:test';
import assert from 'node:assert/strict';
import {closeStroke,finishDrawing,simplifyStroke,type ScreenPoint} from '../src/domain/map-drawing';
import {containsPoint,type Position} from '../src/domain/area-geometry';
const unproject=([x,y]:ScreenPoint):Position=>[77+x/10000,13-y/10000];

test('a continuous outline auto-closes and ignores a finger overshooting its start',()=>{
  const stroke:ScreenPoint[]=[[100,100],[150,100],[200,100],[200,150],[200,200],[150,200],[100,200],[100,150],[99,101],[99,90],[120,95]];
  const result=finishDrawing('freehand',stroke,unproject);assert.ok('selection' in result);
  assert.equal(result.selection.type,'Polygon');assert.equal(containsPoint(result.selection,unproject([150,150])),true);assert.equal(containsPoint(result.selection,unproject([240,150])),false);
  assert.deepEqual(result.outline[0],result.outline.at(-1));assert.ok(result.outline.every(p=>p[1]>=100),'Overshoot must not add a crossing tail');
});
test('long, noisy touch traces become bounded valid polygon requests without losing their area',()=>{
  const stroke:ScreenPoint[]=Array.from({length:2800},(_,i)=>{const a=i/2799*Math.PI*2,r=150+Math.sin(i)*.5;return [220+Math.cos(a)*r,300+Math.sin(a)*r];});
  const closed=closeStroke(stroke);assert.ok(closed.length<=191);assert.ok(closed.length>=8);
  const result=finishDrawing('freehand',stroke,unproject);assert.ok('selection' in result);assert.equal(containsPoint(result.selection,unproject([220,300])),true);
});
test('circle and box use one drag, including vertical circle drags and reversed box corners',()=>{
  const circle=finishDrawing('circle',[[200,200],[200,280]],unproject);assert.ok('selection' in circle);assert.equal(circle.selection.type,'Circle');assert.ok(containsPoint(circle.selection,unproject([200,240])));
  const box=finishDrawing('box',[[300,400],[100,200]],unproject);assert.ok('selection' in box);assert.ok(containsPoint(box.selection,unproject([200,300])));assert.equal(containsPoint(box.selection,unproject([350,300])),false);
});
test('taps, near-lines and self-crossing outlines cannot silently apply a selection',()=>{
  for(const [tool,points] of [['freehand',[[100,100]]],['freehand',[[100,100],[200,200]]],['freehand',[[100,100],[200,200],[200,100],[100,200]]],['box',[[100,100],[100,250]]],['circle',[[100,100],[102,102]]]] as const){assert.ok('error' in finishDrawing(tool,points.map(p=>[p[0],p[1]]),unproject));}
  const points:ScreenPoint[]=[[0,0],[10,.1],[20,0],[30,25],[40,0]];const simplified=simplifyStroke(points,1);assert.ok(simplified.some(p=>p[1]===25));assert.ok(simplified.length<points.length);
});
