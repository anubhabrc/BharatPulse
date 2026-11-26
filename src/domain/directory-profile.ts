import {z} from 'zod';

const sourceUrl=z.url().refine(value=>{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password;},'Use a public HTTPS source');
const fact=z.object({text:z.string().min(2).max(600),source_url:sourceUrl}).strict();
export const directoryEntrySchema=z.object({
  slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),brand_name:z.string().min(2),aliases:z.array(z.string().min(2)).max(15),website_url:sourceUrl,
  description:fact,sector:fact,
  india_presence:z.object({cities:z.array(z.string().min(2)).min(1),source_url:sourceUrl,note:z.string().min(10)}).strict(),
  headquarters:z.object({city:z.string().min(2),country:z.string().min(2),source_url:sourceUrl}).strict().nullable(),
  founders:z.array(z.object({name:z.string().min(2),source_url:sourceUrl}).strict()),
  founded_year:z.object({value:z.number().int().min(1900).max(2100),source_url:sourceUrl}).strict().nullable(),
  careers:z.object({url:sourceUrl,source_url:sourceUrl}).strict().nullable(),
  tags:z.array(z.object({label:z.string().min(2).max(45),source_url:sourceUrl,observed_on:z.iso.date()}).strict()).max(4),
  evidence:z.array(z.object({kind:z.enum(['curation','establishment','independent_coverage']),url:sourceUrl,note:z.string().min(10)}).strict()).min(2),
  admission:z.object({status:z.literal('accepted'),basis:z.enum(['curated_and_established','established_product','editorial_exception']),reason:z.string().min(30),checked_on:z.iso.date()}).strict(),
}).strict().superRefine((entry,ctx)=>{
  const kinds=new Set(entry.evidence.map(e=>e.kind));
  if(entry.admission.basis==='curated_and_established'&&(!kinds.has('curation')||!kinds.has('establishment')))
    ctx.addIssue({code:'custom',message:'Curated admission needs both discovery and establishment evidence'});
  if(entry.admission.basis==='established_product'&&new Set(entry.evidence.filter(e=>e.kind==='independent_coverage').map(e=>new URL(e.url).hostname)).size<2)
    ctx.addIssue({code:'custom',message:'Established product admission needs two independent publisher domains'});
});
export type DirectoryEntry=z.infer<typeof directoryEntrySchema>;
export function parseDirectoryEntries(input:unknown):DirectoryEntry[]{
  const entries=z.array(directoryEntrySchema).parse(input),slugs=new Set<string>(),domains=new Set<string>();
  for(const entry of entries){
    const host=new URL(entry.website_url).hostname.replace(/^www\./,'');
    if(slugs.has(entry.slug)||domains.has(host))throw new Error('Duplicate directory identity requires review');
    slugs.add(entry.slug);domains.add(host);
  }
  return entries;
}
