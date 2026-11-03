import 'server-only';
import { neon } from '@neondatabase/serverless';
import { createHash } from 'node:crypto';
export function db() {
  if (!process.env.DATABASE_URL) throw new Error('Banco não configurado');
  return neon(process.env.DATABASE_URL);
}
export function hashToken(token: string) { return createHash('sha256').update(token).digest('hex'); }
