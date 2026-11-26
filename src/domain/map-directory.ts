import type {CompanyRow} from './archive-queries';
import type {MapCompany} from './startup-map';

export type MapDirectoryRow=Omit<CompanyRow,'slug'|'brand_name'|'city'|'sector'|'description'|'founders'>;
export function compactDirectoryRow({slug:_slug,brand_name:_name,city:_city,sector:_sector,description:_description,founders:_founders,...row}:CompanyRow):MapDirectoryRow{return row;}
export function mapCompanyRow(company:MapCompany):CompanyRow|null {
  if(!company.directory_row)return null;
  return {...company.directory_row,slug:company.slug,brand_name:company.name,city:company.reported_city??company.city,sector:company.sector,...(company.description?{description:company.description}:{}),founders:company.founders};
}
