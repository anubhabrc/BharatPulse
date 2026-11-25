import { NextRequest, NextResponse } from 'next/server';
import { listCompanies } from '@/lib/companies';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(request:NextRequest) {
  const p=request.nextUrl.searchParams;
  const limit=Number(p.get('limit')??100),offset=Number(p.get('offset')??0),q=p.get('q')??'';
  if(!Number.isInteger(limit)||limit<1||limit>100||!Number.isInteger(offset)||offset<0||offset>100000||q.length>200) {
    return NextResponse.json({error:'Invalid search or pagination parameters'},{status:400});
  }
  try { return NextResponse.json(await listCompanies(q,limit,offset),{headers:{'Cache-Control':'no-store'}}); }
  catch { return NextResponse.json({error:'Company repository unavailable. Check database configuration.'},{status:503}); }
}
