export interface SearchCompany {slug:string;name:string;aliases?:string[]}
const normal=(value:string)=>value.normalize('NFKC').toLocaleLowerCase('en').trim().replace(/\s+/g,' ');
export function suggestCompanies(companies:SearchCompany[],query:string,limit=6):SearchCompany[]{
  const q=normal(query);if(!q)return [];
  const rank=(name:string)=>{const value=normal(name);return value===q?0:value.startsWith(q)?1:value.split(/[\s.-]+/).some(word=>word.startsWith(q))?2:value.includes(q)?3:4;};
  return companies.map(company=>({company,rank:Math.min(rank(company.name),...(company.aliases??[]).map(rank))}))
    .filter(match=>match.rank<4).sort((a,b)=>a.rank-b.rank||a.company.name.localeCompare(b.company.name)||a.company.slug.localeCompare(b.company.slug))
    .slice(0,limit).map(match=>match.company);
}
