import {basemapResource} from '@/domain/basemap';
import {satelliteStyle} from '@/domain/satellite';

export const runtime='nodejs';
const MAX_BYTES=8*1024*1024;
export async function GET(_request:Request,{params}:{params:Promise<{resource:string[]}>}) {
  const parts=(await params).resource;
  if(parts.join('/')==='styles/satellite')return Response.json(satelliteStyle(),{headers:{'Cache-Control':'public, max-age=3600, s-maxage=3600','X-Content-Type-Options':'nosniff'}});
  const resource=basemapResource(parts);
  if(!resource)return new Response('Unknown map resource',{status:404});
  try {
    const upstream=await fetch(resource.url,{redirect:'error',signal:AbortSignal.timeout(15000),next:{revalidate:resource.ttl},headers:{'Accept':resource.json?'application/json':'*/*'}});
    if(!upstream.ok||!upstream.body)throw new Error('Map provider unavailable');
    if(Number(upstream.headers.get('content-length'))>MAX_BYTES)throw new Error('Map resource too large');
    const reader=upstream.body.getReader(),chunks:Uint8Array[]=[];let size=0;
    try {while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES)throw new Error('Map resource too large');chunks.push(value);}}
    catch(error){await reader.cancel();throw error;}
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
    const type=resource.contentType??(resource.json?'application/json':resource.url.endsWith('.png')?'image/png':'application/x-protobuf');
    return new Response(bytes,{headers:{'Content-Type':type,'Cache-Control':`public, max-age=${resource.ttl}, s-maxage=${resource.ttl}, stale-while-revalidate=604800`,'X-Content-Type-Options':'nosniff'}});
  } catch {
    return new Response('Map details are temporarily unavailable. Please retry.',{status:502,headers:{'Cache-Control':'no-store'}});
  }
}
