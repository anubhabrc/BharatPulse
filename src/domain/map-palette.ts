// A simple viewer-local clock rule, rather than a location/sunset estimate.
export function automaticBasemap(date=new Date()):'streets'|'dark'{
  const hour=date.getHours();return hour>=18||hour<6?'dark':'streets';
}

// Recolour only street strokes; keep rail, water, labels and geometry intact.
export function streetRoadColor(id:string):string|null{
  if(!/^(road|bridge|tunnel)_/.test(id)||/rail|transit|ferry/.test(id))return null;
  if(/casing/.test(id))return '#bcc5d0';
  return /motorway|trunk|primary/.test(id)?'#dce3ed':'#ffffff';
}
