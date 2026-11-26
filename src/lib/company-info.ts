import 'server-only';
import info from '../../data/company-info.json';
import type {CompanyInfo} from '@/domain/startup-map';
import {directoryEntries} from './catalog';
export const companyInfo:CompanyInfo[]=[...info.companies,...directoryEntries.map(entry=>({slug:entry.slug,description:entry.description,founders:entry.founders,founded_year:entry.founded_year,checked_on:entry.admission.checked_on}))];
export const findCompanyInfo=(slug:string)=>companyInfo.find(company=>company.slug===slug);
