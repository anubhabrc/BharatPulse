import 'server-only';
import info from '../../data/company-info.json';
import {parseCompanyInfo} from '@/domain/company-info';
import {catalog,directoryEntries} from './catalog';
export const companyInfo=parseCompanyInfo([...info.companies,...directoryEntries.map(entry=>({slug:entry.slug,description:entry.description,founders:entry.founders,founded_year:entry.founded_year,checked_on:entry.admission.checked_on}))],catalog.companies.map(company=>company.slug));
export const findCompanyInfo=(slug:string)=>companyInfo.find(company=>company.slug===slug);
