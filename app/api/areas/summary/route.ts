import {z} from 'zod';
import {selectionSchema} from '@/domain/area-geometry';
import {companyFiltersSchema} from '@/domain/archive-queries';
import {summarizeArea} from '@/domain/area-summary';
import {spatialData} from '@/lib/spatial-data';
import {dataMode} from '@/lib/db';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const schema=z.object({selection:selectionSchema,filters:companyFiltersSchema.default(()=>companyFiltersSchema.parse({}))}).strict();
export async function POST(request:Request){
  if(dataMode()!=='archive')return Response.json({error:'This area summary uses the sourced archive and accepted office layer.'},{status:503});
  const reader=request.body?.getReader();if(!reader)return Response.json({error:'Area selection required'},{status:400});
  let size=0;const chunks:Uint8Array[]=[];
  try{
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>24000){await reader.cancel();return Response.json({error:'Area request too large'},{status:413});}chunks.push(value);}
    const parsed=schema.safeParse(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    if(!parsed.success)return Response.json({error:'Use a circle of 25 m–100 km or one simple closed polygon with at most 256 vertices, and valid company filters.'},{status:400});
    return Response.json(summarizeArea(spatialData,parsed.data.selection,parsed.data.filters),{headers:{'Cache-Control':'no-store'}});
  }catch{return Response.json({error:'Invalid area request'},{status:400});}
}
