import {z} from 'zod';

const sourceUrl=z.url().refine(value=>{
  const url=new URL(value);
  return url.protocol==='https:'&&!url.username&&!url.password;
},'Use a public HTTPS source');
export const companyInfoSchema=z.object({
  slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description:z.object({text:z.string().trim().min(2).max(600),source_url:sourceUrl}).strict(),
  founders:z.array(z.object({name:z.string().trim().min(2),source_url:sourceUrl}).strict()),
  founded_year:z.object({value:z.number().int().min(1800),source_url:sourceUrl}).strict().nullable(),
  checked_on:z.iso.date(),
}).strict().superRefine((profile,ctx)=>{
  if(profile.founded_year&&profile.founded_year.value>Number(profile.checked_on.slice(0,4)))
    ctx.addIssue({code:'custom',path:['founded_year'],message:'Founding year cannot follow the source check'});
  const names=profile.founders.map(founder=>founder.name.normalize('NFKC').toLowerCase().replace(/\s+/g,' '));
  if(new Set(names).size!==names.length)
    ctx.addIssue({code:'custom',path:['founders'],message:'Duplicate reviewed founder name'});
});
export type CompanyInfo=z.infer<typeof companyInfoSchema>;

export function parseCompanyInfo(input:unknown,companySlugs:readonly string[]):CompanyInfo[]{
  const profiles=z.array(companyInfoSchema).parse(input),known=new Set(companySlugs),seen=new Set<string>();
  for(const profile of profiles){
    if(!known.has(profile.slug))throw new Error(`Unknown company profile: ${profile.slug}`);
    if(seen.has(profile.slug))throw new Error(`Duplicate company profile: ${profile.slug}`);
    seen.add(profile.slug);
  }
  return profiles;
}
