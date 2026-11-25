import 'server-only';
import data from '../../data/bwm-archive.json';
import type {ArchiveSnapshot} from '@/domain/notion-archive';
export const archive=data as ArchiveSnapshot;
