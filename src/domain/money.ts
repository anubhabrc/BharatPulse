/** Format exact PostgreSQL numeric text without a lossy Number conversion. */
export function formatUsd(value:string):string {
  if(!/^\d+(\.\d+)?$/.test(value)) throw new Error('Expected a non-negative decimal amount');
  const [whole,fraction='']=value.split('.');
  const significant=fraction.replace(/0+$/,'');
  return `$${BigInt(whole).toLocaleString('en-US')}${significant?'.'+significant:''}`;
}
