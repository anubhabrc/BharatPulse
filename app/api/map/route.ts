import {NextRequest,NextResponse} from 'next/server';
import {catalog} from '@/lib/catalog';
import {dataMode} from '@/lib/db';
import {companyInfo} from '@/lib/company-info';
import {offices} from '@/lib/offices';
import cities from '../../../data/city-centres.json';
import {companyFiltersSchema} from '@/domain/archive-queries';
import {buildStartupMap} from '@/domain/startup-map';
import {enrichMapDirectory} from '@/lib/directory-signals';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest) {
  const filters=companyFiltersSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if(!filters.success)return NextResponse.json({error:'Invalid map filters'},{status:400});
  if(dataMode()!=='archive')return NextResponse.json({error:'The startup map currently uses the imported archive'},{status:503});
  return NextResponse.json(enrichMapDirectory(buildStartupMap(catalog,filters.data,cities.cities,companyInfo,cities.source_url,offices)),{headers:{'Cache-Control':'public, max-age=300, stale-while-revalidate=300'}});
}
