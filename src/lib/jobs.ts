import 'server-only';
import data from '../../data/jobs.json';
import {jobSummary,type JobsSnapshot} from '@/domain/jobs';
export const jobs=data as JobsSnapshot;
export const companyJobs=(slug:string)=>jobSummary(jobs,slug);
