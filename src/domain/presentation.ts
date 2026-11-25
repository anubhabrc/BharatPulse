import {formatUsd} from './money';
/** Rounded display abbreviations only; canonical monetary values stay decimal strings. */
export function compactUsd(value:string|null|undefined):string {
  if(value==null)return 'Undisclosed';
  if(!/^\d+(\.\d+)?$/.test(value))throw new Error('Expected a non-negative decimal amount');
  const whole=BigInt(value.split('.')[0]);
  const scales=[[1_000_000_000_000n,'T'],[1_000_000_000n,'B'],[1_000_000n,'M'],[1000n,'K']] as const;
  for(let index=0;index<scales.length;index++){
    let [scale,suffix]:readonly [bigint,string]=scales[index];
    if(whole<scale)continue;
    let hundredths=(whole*100n+scale/2n)/scale;
    if(hundredths>=100000n&&index>0){[scale,suffix]=scales[index-1];hundredths=(whole*100n+scale/2n)/scale;}
    return `$${hundredths/100n}${hundredths%100n?'.'+String(hundredths%100n).padStart(2,'0').replace(/0$/,''):''}${suffix}`;
  }
  return formatUsd(value);
}
export const displayDate=(value:string|null|undefined)=>value?new Date(`${value.slice(0,10)}T00:00:00Z`).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}):'Not reported';
export function companyInitials(name:string){return name.replace(/[^\p{L}\p{N}\s]/gu,'').split(/\s+/).filter(Boolean).slice(0,2).map(word=>word[0]).join('').toUpperCase()||'?';}
export function companyColor(name:string){return ['#d0c4ff','#bff1d2','#ffe680','#b9ddff','#ffc7bc'][Array.from(name).reduce((n,c)=>n+c.codePointAt(0)!,0)%5];}
