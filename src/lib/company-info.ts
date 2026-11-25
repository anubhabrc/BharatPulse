import 'server-only';
import info from '../../data/company-info.json';
import type {CompanyInfo} from '@/domain/startup-map';
export const companyInfo=info.companies as CompanyInfo[];
export const findCompanyInfo=(slug:string)=>companyInfo.find(company=>company.slug===slug);
