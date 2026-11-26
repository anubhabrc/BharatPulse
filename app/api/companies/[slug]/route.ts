import {NextResponse} from 'next/server';
import {findOffice} from '@/lib/offices';
import {archive} from '@/lib/archive';
import {catalog} from '@/lib/catalog';
import {dataMode} from '@/lib/db';
import {findArchiveCompany} from '@/domain/archive-queries';
import {companyNews} from '@/lib/news';
import {companyJobs} from '@/lib/jobs';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  const company=dataMode()==='archive'?findArchiveCompany(catalog,slug):undefined;
  if(!company)return NextResponse.json({error:'Company not found in the selected data source'},{status:404});
  const jobData=companyJobs(slug);
  return NextResponse.json({mode:'archive',company,office:findOffice(slug)??null,news:companyNews(slug).slice(0,3),jobs:jobData?{stale:jobData.stale,total:jobData.total,india:jobData.india,bengaluru:jobData.bengaluru,checked_at:jobData.source.last_success_at,careers_url:jobData.source.careers_url}:null,source:company.directory_profile?{name:'Reviewed company directory',url:company.website_url,retrieved_at:company.directory_profile.admission.checked_on}:{name:archive.source_name,url:archive.source_url,retrieved_at:archive.retrieved_at}},{headers:{'Cache-Control':'no-store'}});
}
