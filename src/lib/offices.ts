import 'server-only';
import snapshot from '../../data/bengaluru-offices.json';
import {parseOffices} from '@/domain/offices';
export const offices=parseOffices(snapshot.offices);
export const findOffice=(slug:string)=>offices.find(office=>office.company_slug===slug);
