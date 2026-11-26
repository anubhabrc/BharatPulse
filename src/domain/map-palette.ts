// Recolour only street strokes; keep rail, water, labels and geometry intact.
export function streetRoadColor(id:string):string|null{
  if(!/^(road|bridge|tunnel)_/.test(id)||/rail|transit|ferry/.test(id))return null;
  if(/casing/.test(id))return '#bcc5d0';
  return /motorway|trunk|primary/.test(id)?'#dce3ed':'#ffffff';
}
