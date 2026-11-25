import type {ArchiveSnapshot} from './notion-archive';
export function assertArchiveCoverage(previous:ArchiveSnapshot|null,next:ArchiveSnapshot,allowLargeRemovals=false):void {
  if(next.companies.length<100||next.coverage.event_count<100)throw new Error('Unexpectedly small archive. Previous snapshot retained.');
  if(!previous||allowLargeRemovals)return;
  const checks:[string,number,number][]=[['companies',previous.companies.length,next.companies.length],['events',previous.coverage.event_count,next.coverage.event_count],['populated pages',previous.coverage.pages_imported,next.coverage.pages_imported]];
  for(const [label,before,after] of checks)if(after<before*0.8)throw new Error(`Archive lost more than 20% of ${label}. Review the source before using --allow-large-removals. Previous snapshot retained.`);
  if(previous.coverage.first_date&&(!next.coverage.first_date||next.coverage.first_date>previous.coverage.first_date))throw new Error('Archive start date moved forward. Review source removals before replacing the snapshot.');
  if(previous.coverage.last_date&&(!next.coverage.last_date||next.coverage.last_date<previous.coverage.last_date))throw new Error('Archive end date moved backward. Review source removals before replacing the snapshot.');
}
