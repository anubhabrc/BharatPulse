'use client';
import {useEffect,useRef,useState,type PointerEvent as ReactPointerEvent} from 'react';
import type {Map as GLMap} from 'maplibre-gl';
import {boxSelection,selectionPolygon,selectionSchema,type AreaSelection} from '@/domain/area-geometry';
import {drawingPath,finishDrawing,type DrawTool,type ScreenPoint} from '@/domain/map-drawing';
import {Icon} from './icons';

interface Props {instance:GLMap;tool:DrawTool;onTool:(tool:DrawTool)=>void;onCancel:()=>void;onApply:(selection:AreaSelection)=>void}
export default function MapDrawing({instance,tool,onTool,onCancel,onApply}:Props){
  const dialog=useRef<HTMLDivElement>(null),surface=useRef<SVGSVGElement>(null),stroke=useRef<{id:number;points:ScreenPoint[]}|null>(null);
  const pointsRef=useRef<ScreenPoint[]>([]),frame=useRef(0),exitTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const [points,setPoints]=useState<ScreenPoint[]>([]),[draft,setDraft]=useState<AreaSelection|null>(null),[error,setError]=useState(''),[dragging,setDragging]=useState(false),[exiting,setExiting]=useState(false);
  const callbacks=useRef({onCancel,onApply});callbacks.current={onCancel,onApply};
  const applying=useRef(false),previousFocus=useRef<HTMLElement|null>(null),draftRef=useRef(draft),toolRef=useRef(tool);draftRef.current=draft;toolRef.current=tool;
  useEffect(()=>{
    const root=instance.getContainer().closest('.startup-atlas') as HTMLElement;
    const active=document.activeElement;previousFocus.current=active instanceof HTMLElement?active:null;
    const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
    const background=Array.from(document.querySelectorAll<HTMLElement>('.site-header,.ecosystem-strip,.directory-panel,.news-ticker'));
    const inert=background.map(el=>el.inert);background.forEach(el=>{el.inert=true;});
    const controls=instance.getContainer().querySelector<HTMLElement>('.maplibregl-control-container'),controlsInert=controls?.inert;
    if(controls)controls.inert=true;
    const handlers=[instance.dragPan,instance.dragRotate,instance.scrollZoom,instance.boxZoom,instance.doubleClickZoom,instance.touchZoomRotate,instance.touchPitch,instance.keyboard];
    const enabled=handlers.map(handler=>handler.isEnabled());handlers.forEach(handler=>handler.disable());
    const camera={center:instance.getCenter(),zoom:instance.getZoom(),bearing:instance.getBearing(),pitch:instance.getPitch(),padding:instance.getPadding()};
    instance.stop();instance.jumpTo({pitch:0,bearing:0,padding:{top:0,bottom:0,left:0,right:0}});
    root.dataset.drawingActive='true';
    const resize=requestAnimationFrame(()=>{instance.resize();surface.current?.focus({preventScroll:true});});
    const keys=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();close();return;}
      if(event.key!=='Tab'||!dialog.current)return;
      const items=Array.from(dialog.current.querySelectorAll<HTMLElement>('button:not(:disabled),[tabindex="0"]'));
      const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    };
    const resized=()=>{
      const shape=draftRef.current;
      if(stroke.current){reset();setError('The map size changed. Draw your area again.');return;}
      if(!shape)return;
      const project=(p:number[]):ScreenPoint=>{const point=instance.project([p[0],p[1]]);return [point.x,point.y];};
      if(shape.type==='Circle')setPoints([project(shape.center),project(selectionPolygon(shape).coordinates[0][0])]);
      else{const ring=shape.coordinates[0];setPoints(toolRef.current==='box'?[project(ring[0]),project(ring[2])]:ring.map(project));}
    };
    instance.on('resize',resized);document.addEventListener('keydown',keys);
    return()=>{
      cancelAnimationFrame(resize);cancelAnimationFrame(frame.current);if(exitTimer.current)clearTimeout(exitTimer.current);
      instance.off('resize',resized);document.removeEventListener('keydown',keys);document.body.style.overflow=overflow;
      background.forEach((el,i)=>{el.inert=inert[i];});if(controls)controls.inert=controlsInert??false;
      delete root.dataset.drawingActive;
      // A route change can already have removed the map. Restore global state either way.
      if(root.isConnected){
        handlers.forEach((handler,i)=>{if(enabled[i])handler.enable();});
        instance.resize();if(!applying.current)instance.jumpTo(camera);
        (previousFocus.current?.isConnected?previousFocus.current:root.querySelector<HTMLElement>('.area-launch'))?.focus({preventScroll:true});
      }
    };
  },[instance]);
  useEffect(()=>{reset();},[tool]);
  function reset(){stroke.current=null;pointsRef.current=[];cancelAnimationFrame(frame.current);frame.current=0;setPoints([]);setDraft(null);setError('');setDragging(false);}
  function close(selection?:AreaSelection){
    if(exitTimer.current)return;stroke.current=null;setDragging(false);setExiting(true);
    const delay=window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:180;
    exitTimer.current=setTimeout(()=>{applying.current=Boolean(selection);if(selection)callbacks.current.onApply(selection);else callbacks.current.onCancel();},delay);
  }
  function useMapView(){const b=instance.getBounds(),parsed=selectionSchema.safeParse(boxSelection([b.getWest(),b.getSouth()],[b.getEast(),b.getNorth()]));if(parsed.success)close(parsed.data);else setError('Zoom in before using the current map view.');}
  function position(event:ReactPointerEvent<SVGSVGElement>):ScreenPoint{const rect=event.currentTarget.getBoundingClientRect();return [Math.max(0,Math.min(rect.width,event.clientX-rect.left)),Math.max(0,Math.min(rect.height,event.clientY-rect.top))];}
  function start(event:ReactPointerEvent<SVGSVGElement>){
    if(exiting||event.button!==0)return;event.preventDefault();event.stopPropagation();
    if(stroke.current){reset();setError('Use one finger to draw.');return;}
    const point=position(event);stroke.current={id:event.pointerId,points:[point]};pointsRef.current=[point];setPoints([point]);setDraft(null);setError('');setDragging(true);event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event:ReactPointerEvent<SVGSVGElement>){
    const gesture=stroke.current;if(!gesture||gesture.id!==event.pointerId)return;event.preventDefault();
    const p=position(event),last=gesture.points.at(-1)!;
    if(Math.hypot(p[0]-last[0],p[1]-last[1])<2)return;
    if(tool==='freehand'){if(gesture.points.length>=3000)gesture.points=gesture.points.filter((_,i)=>i%2===0);gesture.points.push(p);}else gesture.points=[gesture.points[0],p];
    pointsRef.current=gesture.points;
    if(!frame.current)frame.current=requestAnimationFrame(()=>{frame.current=0;setPoints([...pointsRef.current]);});
  }
  function end(event:ReactPointerEvent<SVGSVGElement>){
    const gesture=stroke.current;if(!gesture||gesture.id!==event.pointerId)return;event.preventDefault();event.stopPropagation();
    const p=position(event);if(tool==='freehand')gesture.points.push(p);else gesture.points=[gesture.points[0],p];
    stroke.current=null;setDragging(false);cancelAnimationFrame(frame.current);frame.current=0;
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
    const result=finishDrawing(tool,gesture.points,p=>{const pos=instance.unproject(p);return [pos.lng,pos.lat];});
    if('error' in result){setError(result.error);setPoints(gesture.points);setDraft(null);}else{setPoints(result.outline);setDraft(result.selection);setError('');}
  }
  function interrupted(event:ReactPointerEvent<SVGSVGElement>){if(stroke.current?.id===event.pointerId){reset();setError('Drawing interrupted. Drag again to redraw.');}}
  const path=drawingPath(tool,points,Boolean(draft)),tip=points.at(-1);
  return <div ref={dialog} className="draw-workspace" role="dialog" aria-modal="true" aria-labelledby="draw-title" data-exiting={exiting} data-dragging={dragging} data-review={Boolean(draft)}>
    <svg ref={surface} className="map-draw-surface" tabIndex={0} role="img" aria-label="Area drawing surface" aria-describedby="draw-hint draw-keyboard-hint" onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={interrupted} onLostPointerCapture={interrupted}>
      {path&&<><path d={path+(tool==='freehand'&&!draft?' Z':'')} className="draw-live-fill"/><path d={path} className={`draw-live-line${error?' has-error':''}`}/></>}
      {points[0]&&tool==='freehand'&&<circle cx={points[0][0]} cy={points[0][1]} r={draft?4:7} className="draw-start-point"/>}
      {dragging&&tip&&<circle cx={tip[0]} cy={tip[1]} r="5" className="draw-tip"/>}
    </svg>
    <p id="draw-keyboard-hint" className="sr-only">Press Escape to cancel. Keyboard users can tab to Use map view to select the visible map bounds.</p>
    <div className="draw-topbar"><div className="draw-title-chip"><Icon name="pen" size={18}/><div><strong id="draw-title">{draft?'Area selected':'Draw your area'}</strong><span id="draw-hint">{draft?'Review your outline, then use this area.':tool==='freehand'?'Draw a loop with one finger.':tool==='circle'?'Drag from the centre to the edge.':'Drag between opposite corners.'}</span></div></div><button className="draw-cancel" aria-label="Cancel selection" title="Cancel selection" onClick={()=>close()}><Icon name="close" size={22}/></button></div>
    {error&&<p className="draw-feedback" role="alert">{error}</p>}
    <div className="draw-bottom-controls">
      {draft?<div className="draw-review-actions"><button className="draw-redraw" onClick={reset}><Icon name="reset" size={18}/>Redraw</button><button className="draw-apply" onClick={()=>close(draft)}><Icon name="check" size={18}/>Use area</button></div>:<div className="draw-tool-picker" role="group" aria-label="Drawing tool">{([{id:'freehand',label:'Draw',icon:'pen'},{id:'circle',label:'Circle',icon:'circle'},{id:'box',label:'Box',icon:'box'}] as const).map(item=><button key={item.id} aria-label={item.id==='freehand'?'Freehand draw':`Draw ${item.label.toLowerCase()}`} aria-pressed={tool===item.id} onClick={()=>onTool(item.id)}><Icon name={item.icon} size={18}/><span>{item.label}</span></button>)}</div>}
      <button className="draw-keyboard-view" onClick={useMapView}>Use map view</button>
      <span className="draw-bottom-hint" aria-live="polite">{dragging?'Release to finish':draft?'You can redraw before applying.':'Drag to draw · × to cancel'}</span>
    </div>
  </div>;
}
