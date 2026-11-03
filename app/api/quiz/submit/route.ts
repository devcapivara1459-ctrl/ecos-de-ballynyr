import { NextResponse } from 'next/server';
import { db,hashToken } from '../../../../lib/db';
import { characters,rank } from '../../../../lib/data';
import { body,failure,HttpError,originGuard,playerSession,rateLimit,tokenInput } from '../../../../lib/security';
import { validAnswers } from '../../../../lib/validation';
export async function POST(req:Request) {
 try {originGuard(req);const {token,answers}=await body(req);tokenInput(token);
 if(!validAnswers(answers,true)) throw new HttpError(400,'Responda às 12 perguntas.');
 const session=await playerSession(token);if(!session) throw new HttpError(401,'Inicie seu convite neste navegador.');
 await rateLimit(req,'submit',40);const candidates=rank(answers).map(c=>c.id);
 const rows=await db()`SELECT ecos_finish(${hashToken(token)},${hashToken(session)},${JSON.stringify(answers)}::jsonb,${candidates}::text[]) AS id`;
 const character=characters.find(c=>c.id===rows[0].id);
 if(!character) throw new HttpError(409,'Não foi possível selar seu destino. Fale com o mestre.');
 return NextResponse.json({character});
 }catch(e){return failure(e);}
}
