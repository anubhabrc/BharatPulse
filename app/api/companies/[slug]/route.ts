import {NextResponse} from 'next/server';
import {findOffice} from '@/lib/offices';
import {archive} from '@/lib/archive';
import {dataMode} from '@/lib/db';
import {findArchiveCompany} from '@/domain/archive-queries';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  const company=dataMode()==='archive'?findArchiveCompany(archive,slug):undefined;
  if(!company)return NextResponse.json({error:'Company not found in the selected data source'},{status:404});
  return NextResponse.json({mode:'archive',company,office:findOffice(slug)??null,source:{name:archive.source_name,url:archive.source_url,retrieved_at:archive.retrieved_at}},{headers:{'Cache-Control':'no-store'}});
}
