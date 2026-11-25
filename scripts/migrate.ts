import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import postgres from 'postgres';

if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before running migrations');
const sql=postgres(process.env.DATABASE_URL,{max:1,prepare:false});
try {
  await sql.begin(async tx=>{
    await tx`SELECT pg_advisory_xact_lock(104241,2)`;
    await tx`CREATE SCHEMA IF NOT EXISTS bp_meta`;
    await tx`REVOKE ALL ON SCHEMA bp_meta FROM PUBLIC`;
    await tx`CREATE TABLE IF NOT EXISTS bp_meta.migrations(name text PRIMARY KEY, sha256 text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`;
    await tx`ALTER TABLE bp_meta.migrations ENABLE ROW LEVEL SECURITY`;
    await tx`REVOKE ALL ON bp_meta.migrations FROM PUBLIC`;
    const files=(await readdir('db/migrations')).filter(x=>x.endsWith('.sql')).sort();
    for(const name of files) {
      const body=await readFile(`db/migrations/${name}`,'utf8');
      const sha=createHash('sha256').update(body).digest('hex');
      const previous=await tx`SELECT sha256 FROM bp_meta.migrations WHERE name=${name}`;
      if(previous.length) {
        if(previous[0].sha256!==sha) throw new Error(`Applied migration changed: ${name}`);
        continue;
      }
      await tx.unsafe(body);
      await tx`INSERT INTO bp_meta.migrations(name,sha256) VALUES(${name},${sha})`;
      console.log(`Applied ${name}`);
    }
  });
} finally { await sql.end(); }
