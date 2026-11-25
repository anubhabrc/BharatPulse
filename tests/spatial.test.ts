import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { postgis } from '@electric-sql/pglite-postgis';
import fixture from '../data/demo-reviewed.json';
import {parseBatch} from '../src/domain/import-schema';
import {importReviewedBatch} from '../src/domain/import-reviewed';

test('PostGIS selection includes boundary, excludes coarse pins and uses the latest observed HQ',async()=>{
  const db=new PGlite({extensions:{postgis}});
  try {
    await db.exec(await readFile('db/migrations/001_core.sql','utf8'));
    await db.exec('CREATE SCHEMA gis; CREATE EXTENSION postgis WITH SCHEMA gis;');
    await db.exec(await readFile('db/migrations/002_spatial.sql','utf8'));
    const b=structuredClone(fixture);b.records=b.records.slice(0,1);
    b.records[0].company.location.latitude=12;b.records[0].company.location.longitude=77;
    b.records[0].company.location.accuracy='address';
    await db.transaction(async tx=>importReviewedBatch({query:async(q,p=[]) => (await tx.query(q,p)).rows as Record<string,unknown>[]},parseBatch(b),'spatial-test'));
    const polygon=JSON.stringify({type:'Polygon',coordinates:[[[77,11],[78,11],[78,13],[77,13],[77,11]]]});
    assert.equal((await db.query('SELECT * FROM bp.companies_in_area($1,false)',[polygon])).rows.length,1,'Boundary point should count');
    await db.exec("UPDATE bp.company_locations SET accuracy='city'");
    assert.equal((await db.query('SELECT * FROM bp.companies_in_area($1,false)',[polygon])).rows.length,0,'Coarse pin should be excluded');
    assert.equal((await db.query('SELECT * FROM bp.companies_in_area($1,true)',[polygon])).rows.length,1);
    await db.exec("UPDATE bp.company_locations SET accuracy='address'");
    await db.exec(`INSERT INTO bp.company_locations(company_id,location_key,kind,city,state,latitude,longitude,accuracy,observed_on,document_version_id)
      SELECT company_id,'newer-hq','hq','New City',state,20,80,'address',observed_on+1,document_version_id FROM bp.company_locations`);
    assert.equal((await db.query('SELECT * FROM bp.companies_in_area($1,false)',[polygon])).rows.length,0,'Historical HQ must not count');
    await assert.rejects(()=>db.query('SELECT * FROM bp.companies_in_area($1,false)',[JSON.stringify({type:'Polygon',coordinates:[[[0,0],[1,1],[1,0],[0,1],[0,0]]]})]),/valid polygon/);
  } finally { await db.close(); }
});
