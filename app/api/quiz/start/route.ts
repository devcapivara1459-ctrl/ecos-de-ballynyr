import { NextResponse } from 'next/server';
import { db,hashToken } from '../../../../lib/db';
import { body,cookieOptions,failure,HttpError,originGuard,playerCookie,playerSession,rateLimit,secretToken,tokenInput } from '../../../../lib/security';
import { playerName } from '../../../../lib/validation';
export async function POST(req:Request) {
 try {originGuard(req);const {token,name}=await body(req);tokenInput(token);
 if(!playerName(name)) throw new HttpError(400,'Informe seu nome (2 a 80 caracteres).');
 await rateLimit(req,'start',40);
 const session=await playerSession(token)||secretToken();
 const rows=await db()`SELECT ecos_start(${hashToken(token)},${hashToken(session)},${name.trim()}) AS state`;
 if(!['started','completed'].includes(rows[0].state)) throw new HttpError(409,'Convite indisponível, expirado ou já iniciado em outro navegador. Fale com o mestre.');
 const response=NextResponse.json({ok:true});response.cookies.set(playerCookie(token),session,cookieOptions);return response;
 }catch(e){return failure(e);}
}
