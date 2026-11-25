import { NextRequest,NextResponse } from 'next/server';
import { areaSchema } from '@/domain/import-schema';
import { database,isDemo } from '@/lib/db';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function POST(request:NextRequest) {
  // Streaming cap does not trust Content-Length or buffer an unbounded body.
  const reader=request.body?.getReader();
  if(!reader) return NextResponse.json({error:'Polygon body required'},{status:400});
  let bytes=0;
  const chunks:Uint8Array[]=[];
  while(true) {
    const {value,done}=await reader.read(); if(done) break;
    bytes+=value.byteLength;
    if(bytes>100000) { await reader.cancel(); return NextResponse.json({error:'Area request too large'},{status:413}); }
    chunks.push(value);
  }
  let area;
  try { area=areaSchema.parse(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
  catch { return NextResponse.json({error:'A closed GeoJSON Polygon with valid coordinates and at most 1000 vertices is required'},{status:400}); }
  if(isDemo()) return NextResponse.json({error:'Area queries require PostgreSQL/PostGIS. Demo mode does not simulate spatial results.'},{status:503});
  if(process.env.DATA_MODE!=='database') return NextResponse.json({error:'Invalid DATA_MODE'},{status:503});
  try {
    const sql=database();
    const result=await sql.begin(async tx=>{
      await tx`SET LOCAL statement_timeout = '3s'`;
      return tx`SELECT c.slug,c.brand_name,t.tracked_event_count,t.equity_usd::text,t.unpriced_event_count
        FROM bp.companies_in_area(${JSON.stringify(area)},false) a JOIN bp.companies c ON c.id=a.company_id
        JOIN bp.company_funding_totals t ON t.company_id=c.id WHERE NOT c.is_demo ORDER BY c.brand_name LIMIT 1001`;
    });
    return NextResponse.json({mode:'database',location_policy:'Address-level HQ observations only; polygon boundary included',
      truncated:result.length>1000,companies:result.slice(0,1000)},{headers:{'Cache-Control':'no-store'}});
  } catch(error) {
    const code=(error as {code?:string}).code;
    if(code==='22023'||code==='XX000') return NextResponse.json({error:'Invalid polygon geometry'},{status:400});
    return NextResponse.json({error:'Spatial repository unavailable or query exceeded its time limit'},{status:503});
  }
}
