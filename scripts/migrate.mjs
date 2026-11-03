import { readFile } from 'node:fs/promises';
import pg from 'pg';
const connectionString=process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if(!connectionString) throw new Error('Configure DATABASE_URL_UNPOOLED para a migração.');
const client=new pg.Client({connectionString});
try {
  await client.connect();
  await client.query(await readFile(new URL('../schema.sql',import.meta.url),'utf8'));
  console.log('Migração concluída.');
} finally { await client.end(); }
