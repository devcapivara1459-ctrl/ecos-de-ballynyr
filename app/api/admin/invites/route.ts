import { NextResponse } from 'next/server';
import { db,hashToken } from '../../../../lib/db';
import { characters } from '../../../../lib/data';
import { body,failure,HttpError,originGuard,rateLimit,requireAdmin,secretToken } from '../../../../lib/security';
import { playerName } from '../../../../lib/validation';
export async function GET() {
 try {await requireAdmin();const sql=db();const [invites,audit]=await Promise.all([
 sql`SELECT id,player_name,status,character_id,created_at,completed_at,expires_at FROM invites ORDER BY created_at`,
 sql`SELECT event,invite_id,created_at FROM audit_log ORDER BY id DESC LIMIT 30`]);
 return NextResponse.json({invites,audit,characters});}catch(e){return failure(e);}
}
export async function POST(req:Request) {
 try {originGuard(req);await requireAdmin();await rateLimit(req,'admin-write',60);
 const {name}=await body(req);if(!playerName(name)) throw new HttpError(400,'Informe o nome do jogador (2 a 80 caracteres).');
 const token=secretToken();const rows=await db()`SELECT ecos_create(${crypto.randomUUID()}::uuid,${hashToken(token)},${name.trim()}) AS ok`;
 if(!rows[0].ok) throw new HttpError(409,'Os seis lugares já possuem convites.');
 return NextResponse.json({url:`${new URL(process.env.SITE_URL||req.url).origin}/convite/${token}`},{status:201});
 }catch(e){return failure(e);}
}
export async function PATCH(req:Request) {
 try {originGuard(req);await requireAdmin();await rateLimit(req,'admin-write',60);
 const {id,action}=await body(req);
 if(typeof id!=='string'||!/^[-a-f0-9]{36}$/.test(id)||!['rotate','revoke'].includes(action)) throw new HttpError(400,'Operação inválida.');
 const token=secretToken();const rows=await db()`SELECT ecos_manage(${id}::uuid,${action},${hashToken(token)}) AS ok`;
 if(!rows[0].ok) throw new HttpError(409,'Somente convites pendentes ou iniciados podem ser alterados.');
 return NextResponse.json({ok:true,url:action==='rotate'?`${new URL(process.env.SITE_URL||req.url).origin}/convite/${token}`:undefined});
 }catch(e){return failure(e);}
}
