import 'server-only';
import {catalog} from './catalog';
import {offices} from './offices';
import {jobs} from './jobs';
import {news} from './news';
import {buildSpatialDataset} from '@/domain/spatial-data';
// Rebuilt from the canonical committed snapshots on deployment; no divergent aggregate cache.
export const spatialData=buildSpatialDataset(catalog,offices,jobs,news);
