import {NextRequest,NextResponse} from 'next/server';
import {archive} from '@/lib/archive';
import {dataMode} from '@/lib/db';
import {companyInfo} from '@/lib/company-info';
import cities from '../../../data/city-centres.json';
import {companyFiltersSchema} from '@/domain/archive-queries';
import {buildStartupMap} from '@/domain/startup-map';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest) {
  const filters=companyFiltersSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if(!filters.success)return NextResponse.json({error:'Invalid map filters'},{status:400});
  if(dataMode()!=='archive')return NextResponse.json({error:'The startup map currently uses the imported archive'},{status:503});
  return NextResponse.json(buildStartupMap(archive,filters.data,cities.cities,companyInfo,cities.source_url),{headers:{'Cache-Control':'public, max-age=300, stale-while-revalidate=300'}});
}
