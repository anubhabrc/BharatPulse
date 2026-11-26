import 'server-only';
import type {CompanyRow} from '@/domain/archive-queries';
import type {StartupMapPayload} from '@/domain/startup-map';
import {findCompanyInfo} from './company-info';
import {companyNews} from './news';
import {companyJobs} from './jobs';
import {compactDirectoryRow,mapCompanyRow} from '@/domain/map-directory';
export function enrichDirectoryRows(rows:CompanyRow[]):CompanyRow[]{
  return rows.map(row=>{
    const info=findCompanyInfo(row.slug),latest=companyNews(row.slug)[0],summary=companyJobs(row.slug);
    return {...row,...(info?{description:row.description??info.description.text,founders:row.founders??info.founders.map(f=>f.name)}:{}),
      ...(latest?{latest_news:{title:latest.title,url:latest.url,source_name:latest.source_name,published_at:latest.published_at}}:{}),
      ...(summary&&!summary.stale&&summary.source.last_success_at?{jobs:{total:summary.total!,india:summary.india!,bengaluru:summary.bengaluru!,checked_at:summary.source.last_success_at}}:{}),
    };
  });
}
export function enrichMapDirectory(map:StartupMapPayload):StartupMapPayload{
  return {...map,offices:map.offices.map(company=>{const original=mapCompanyRow(company);if(!original)return company;const row=enrichDirectoryRows([original])[0];return {...company,description:company.description??row.description??null,founders:company.founders.length?company.founders:row.founders??[],directory_row:compactDirectoryRow(row)};})};
}
