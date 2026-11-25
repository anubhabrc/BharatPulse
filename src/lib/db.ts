import 'server-only';
import postgres from 'postgres';

let pool: ReturnType<typeof postgres> | undefined;
export function database() {
  if(!process.env.DATABASE_URL) throw new Error('Database is not configured');
  return pool??=postgres(process.env.DATABASE_URL,{max:3,prepare:false,connect_timeout:5,idle_timeout:20});
}
export function isDemo() { return (process.env.DATA_MODE??'demo')==='demo'; }
