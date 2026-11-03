import { NextResponse } from 'next/server';
import { db,hashToken } from '../../../../lib/db';
import { body,failure,HttpError,originGuard,playerSession,rateLimit,tokenInput } from '../../../../lib/security';
import { validAnswers } from '../../../../lib/validation';
export async function POST(req:Request) {
  try {
    originGuard(req);const {token,answers}=await body(req);tokenInput(token);
    if(!validAnswers(answers)) throw new HttpError(400,'Respostas inválidas.');
    const session=await playerSession(token);if(!session) throw new HttpError(401,'Inicie seu convite neste navegador.');
    await rateLimit(req,'progress',300);
    const rows=await db()`UPDATE invites SET progress=${JSON.stringify(answers)}::jsonb
      WHERE token_hash=${hashToken(token)} AND session_hash=${hashToken(session)} AND status='started' RETURNING id`;
    if(!rows.length) throw new HttpError(409,'A jornada não está mais disponível.');
    return NextResponse.json({ok:true});
  }catch(e){return failure(e);}
}
