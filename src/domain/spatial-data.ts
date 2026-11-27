import {z} from 'zod';
import type {ArchiveSnapshot} from './notion-archive';
import type {OfficeLocation} from './offices';
import type {JobsSnapshot} from './jobs';
import type {NewsSnapshot} from './news';
import type {Position} from './area-geometry';

// A location observation belongs to an entity; company-related facts never inherit its geometry.
export interface SpatialOffice {
  id:string;company_slug:string;city:string;geometry:{type:'Point';coordinates:Position};
  precision:'building'|'campus';kind:OfficeLocation['kind'];checked_on:string;
  address_source_url:string;coordinate_source_url:string;
}
// Future rent ingestion must state units, geography, observation date and evidence.
// An empty rental layer means unavailable, never a zero rent.
export const rentObservationSchema=z.object({
  id:z.string().min(1),geometry:z.object({type:z.literal('Point'),coordinates:z.tuple([z.number().min(-180).max(180),z.number().min(-85).max(85)])}).strict(),
  precision:z.enum(['building','campus']),property_type:z.enum(['office','residential']),
  amount_inr:z.string().regex(/^[1-9]\d*(?:\.\d{1,2})?$/),basis:z.enum(['per_sqft_month','per_unit_month']),
  observation_kind:z.enum(['asking','transacted']),observed_on:z.iso.date(),checked_on:z.iso.date(),
  source_url:z.url().refine(v=>{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password;}),
}).strict().refine(v=>v.observed_on<=v.checked_on,'Observation must not follow its check date');
export type RentObservation=z.infer<typeof rentObservationSchema>;
export interface SpatialDataset {
  schema_version:1;catalog:ArchiveSnapshot;offices:SpatialOffice[];
  jobs:JobsSnapshot;news:NewsSnapshot;rents:RentObservation[];
}
export function buildSpatialDataset(catalog:ArchiveSnapshot,offices:OfficeLocation[],jobs:JobsSnapshot,news:NewsSnapshot):SpatialDataset{
  return {schema_version:1,catalog,jobs,news,rents:[],offices:offices.filter(o=>o.review_status==='accepted').map(o=>({id:o.id,company_slug:o.company_slug,city:o.city,geometry:{type:'Point',coordinates:[o.longitude,o.latitude]},precision:o.precision,kind:o.kind,checked_on:o.checked_on,address_source_url:o.address_source_url,coordinate_source_url:o.coordinate_source_url}))};
}
