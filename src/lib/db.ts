import 'server-only';
import postgres from 'postgres';

let pool: ReturnType<typeof postgres> | undefined;
export function database() {
  if(!process.env.DATABASE_URL) throw new Error('Database is not configured');
  return pool??=postgres(process.env.DATABASE_URL,{max:3,prepare:false,connect_timeout:5,idle_timeout:20});
}
export function dataMode() {
  const mode=process.env.DATA_MODE??'archive';
  if(!['archive','demo','database'].includes(mode))throw new Error('DATA_MODE must be archive, demo or database');
  return mode as 'archive'|'demo'|'database';
}
export function isDemo() { return dataMode()==='demo'; }
