import {companyJobs} from '@/lib/jobs';
import {displayDate} from '@/domain/presentation';
export default function CompanyJobs({slug}:{slug:string}){
  const data=companyJobs(slug);if(!data)return null;
  const india=data.items.filter(item=>item.country==='IN');
  return <section className="repository company-jobs" id="jobs"><div className="section-head"><h2>Open roles</h2><a href={data.source.careers_url} target="_blank" rel="noreferrer">Employer careers</a></div>
    {data.stale?<p>Our job check is out of date. Visit the employer’s careers page for current openings.</p>:<><p><strong>{data.india} India postings</strong> · {data.bengaluru} include Bengaluru · {data.total} listed globally.</p><p className="muted">Last successful check {displayDate(data.source.last_success_at)}. Counts describe published postings, not hires or vacancies at the mapped office. Remote work does not establish India eligibility.</p><div className="job-list">{india.slice(0,12).map(job=><a key={job.source_id+job.id} href={job.url} target="_blank" rel="noreferrer"><strong>{job.title}</strong><span>{job.location}{job.workplace!=='unknown'?` · ${job.workplace}`:''}</span></a>)}</div>{india.length>12&&<p className="muted">Showing 12 India postings. See the employer’s careers page for all roles.</p>}{india.length===0&&<p>No explicitly India-located postings were returned in our latest successful check.</p>}</>}
    {data.source.status==='error'&&<p className="quality">The latest refresh failed. {data.stale?'Counts are hidden.':'These are the last successfully checked postings.'}</p>}
  </section>;
}
