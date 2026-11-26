import 'server-only';
import data from '../../data/news.json';
import {cleanHeadline,matchNewsCompanies,type NewsSnapshot} from '@/domain/news';
import {directoryEntries} from './catalog';
const identities=directoryEntries.map(c=>({slug:c.slug,brand_name:c.brand_name,reported_names:[c.brand_name,...c.aliases]}));
export const news:NewsSnapshot={...data,items:data.items.map(item=>({...item,title:cleanHeadline(item.title),company_slugs:[...new Set([...item.company_slugs,...matchNewsCompanies(cleanHeadline(item.title),identities)])]}))} as NewsSnapshot;
export const companyNews=(slug:string)=>news.items.filter(item=>item.company_slugs.includes(slug)).slice(0,8);
