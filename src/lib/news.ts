import 'server-only';
import data from '../../data/news.json';
import type {NewsSnapshot} from '@/domain/news';
export const news=data as NewsSnapshot;
export const companyNews=(slug:string)=>news.items.filter(item=>item.company_slugs.includes(slug)).slice(0,8);
