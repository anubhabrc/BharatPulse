import {z} from 'zod';

const httpsUrl=z.url().refine(value=>new URL(value).protocol==='https:'&&!new URL(value).username&&!new URL(value).password,'Use an HTTPS evidence URL');
export const officeSchema=z.object({
  id:z.string().min(1),company_slug:z.string().min(1),city:z.literal('Bengaluru'),entity_name:z.string().min(1),
  kind:z.enum(['registered_office','corporate_office','business_office']),address:z.string().min(20),place_name:z.string().min(2),
  precision:z.enum(['building','campus']),longitude:z.number().min(77.3).max(77.9),latitude:z.number().min(12.7).max(13.3),
  address_source_url:httpsUrl,coordinate_source_url:httpsUrl,
  coordinate_method:z.enum(['osm_feature','company_published_map_link']).default('osm_feature'),
  checked_on:z.iso.date(),review_status:z.literal('accepted'),review_note:z.string().min(10),
}).strict().superRefine((office,ctx)=>{
  if(office.coordinate_method==='osm_feature'&&!/^https:\/\/www\.openstreetmap\.org\/(node|way|relation)\/\d+$/.test(office.coordinate_source_url))
    ctx.addIssue({code:'custom',path:['coordinate_source_url'],message:'An OSM feature is required'});
  const host=(url:string)=>new URL(url).hostname.replace(/^www\./,'');
  if(office.coordinate_method==='company_published_map_link'&&host(office.coordinate_source_url)!==host(office.address_source_url))
    ctx.addIssue({code:'custom',path:['coordinate_source_url'],message:'A company-published point requires the company address source host'});
});
export type OfficeLocation=z.infer<typeof officeSchema>;

export function parseOffices(input:unknown):OfficeLocation[]{
  const offices=z.array(officeSchema).parse(input),slugs=new Set<string>(),ids=new Set<string>();
  for(const office of offices){
    if(slugs.has(office.company_slug)||ids.has(office.id))throw new Error('Only one accepted primary office per company is supported');
    slugs.add(office.company_slug);ids.add(office.id);
  }
  return offices;
}
