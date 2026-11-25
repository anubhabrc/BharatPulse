import { NextRequest, NextResponse } from 'next/server';
import { listCompanies } from '@/lib/companies';
import {companyFiltersSchema} from '@/domain/archive-queries';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(request:NextRequest) {
  const filters=companyFiltersSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if(!filters.success)return NextResponse.json({error:'Invalid company filters or pagination parameters'},{status:400});
  try { return NextResponse.json(await listCompanies(filters.data),{headers:{'Cache-Control':'no-store'}}); }
  catch { return NextResponse.json({error:'Company repository unavailable. Check database configuration.'},{status:503}); }
}
