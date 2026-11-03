import 'server-only';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db, hashToken } from './db';
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export const secretToken = () => randomBytes(32).toString('base64url');
export function adminSecret() {
  const key = process.env.ADMIN_KEY;
  if (!key) throw new HttpError(503, 'Configure a chave administrativa ADMIN_KEY na Vercel.');
  return key;
}
export function equal(a: string, b: string) { const x=Buffer.from(hashToken(a),'hex'), y=Buffer.from(hashToken(b),'hex'); return timingSafeEqual(x,y); }
export function sign(value: string) { return createHmac('sha256',adminSecret()).update(value).digest('base64url'); }
export const cookieOptions = { httpOnly:true, secure:process.env.NODE_ENV==='production', sameSite:'strict' as const, path:'/', maxAge:60*60*24*30 };
export const playerCookie = (token:string) => `ecos_${hashToken(token).slice(0,24)}`;
export async function playerSession(token:string) { return (await cookies()).get(playerCookie(token))?.value || ''; }
export async function isAdmin() {
  const raw=(await cookies()).get('ecos_admin')?.value;
  if(!raw) return false;
  const [expires,nonce,signature]=raw.split('.');
  return !!signature && Number(expires)>Date.now() && equal(signature,sign(`${expires}.${nonce}`));
}
export async function requireAdmin() { if(!await isAdmin()) throw new HttpError(401,'Sessão expirada. Entre novamente.'); }
export function originGuard(req:Request) {
  const origin=req.headers.get('origin');
  const expected=new URL(process.env.SITE_URL || req.url).origin;
  if(origin!==expected) throw new HttpError(403,'Origem da solicitação não autorizada.');
}
export async function body(req:Request) {
  if(!req.headers.get('content-type')?.includes('application/json')) throw new HttpError(415,'Envie dados JSON.');
  if(Number(req.headers.get('content-length'))>8192) throw new HttpError(413,'Solicitação muito grande.');
  const reader=req.body?.getReader();
  if(!reader) throw new HttpError(400,'Corpo ausente.');
  const decoder=new TextDecoder();let raw='',size=0;
  try { while(true) {
    const {value,done}=await reader.read();if(done) break;
    size+=value.byteLength;
    if(size>8192){await reader.cancel();throw new HttpError(413,'Solicitação muito grande.');}
    raw+=decoder.decode(value,{stream:true});
  }raw+=decoder.decode(); } finally {reader.releaseLock();}
  let parsed;
  try { parsed=JSON.parse(raw); } catch { throw new HttpError(400,'JSON inválido.'); }
  if(!parsed || typeof parsed!=='object' || Array.isArray(parsed)) throw new HttpError(400,'Envie um objeto JSON.');
  return parsed;
}
export function tokenInput(value:unknown): asserts value is string {
  if(typeof value!=='string'||!/^[-\w]{32,100}$/.test(value)) throw new HttpError(400,'Convite inválido.');
}
export async function rateLimit(req:Request,scope:string,limit=100) {
  const ip=req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || 'shared';
  const key=hashToken(`${scope}:${ip}`);
  const rows=await db()`SELECT ecos_rate(${key},${limit}) AS allowed`;
  if(!rows[0].allowed) throw new HttpError(429,'Muitas tentativas. Aguarde alguns minutos.');
}
export function failure(error:unknown) {
  if(error instanceof HttpError) return NextResponse.json({error:error.message},{status:error.status});
  return NextResponse.json({error:'Não foi possível concluir. Tente novamente; se persistir, fale com o mestre.'},{status:503});
}
