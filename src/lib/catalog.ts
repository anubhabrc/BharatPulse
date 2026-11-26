import 'server-only';
import {archive} from './archive';
import data from '../../data/company-directory.json';
import {parseDirectoryEntries} from '@/domain/directory-profile';
import {composeCatalog} from '@/domain/catalog';
export const directoryEntries=parseDirectoryEntries(data.companies);
export const catalog=composeCatalog(archive,directoryEntries);
export const findDirectoryEntry=(slug:string)=>directoryEntries.find(entry=>entry.slug===slug);
