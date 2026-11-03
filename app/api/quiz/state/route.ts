import { NextResponse } from 'next/server';
import { db,hashToken } from '../../../../lib/db';
import { characters } from '../../../../lib/data';
import { body,failure,HttpError,originGuard,playerSession,rateLimit,tokenInput } from '../../../../lib/security';
export async function POST(req:Request) {
  try {
    originGuard(req);const {token}=await body(req);tokenInput(token);await rateLimit(req,'state',300);
    const rows=await db()`SELECT status,session_hash,player_name,progress,character_id,expires_at FROM invites WHERE token_hash=${hashToken(token)}`;
    const i=rows[0];if(!i || i.status==='revoked') throw new HttpError(404,'Este convite não está disponível. Fale com o mestre.');
    if(i.status==='new') {
      if(new Date(i.expires_at)<new Date()) throw new HttpError(410,'Este convite expirou. Fale com o mestre.');
      return NextResponse.json({stage:'intro',name:i.player_name||''});
    }
    const session=await playerSession(token);
    if(!session || hashToken(session)!==i.session_hash) throw new HttpError(409,'Este convite já foi iniciado em outro navegador. Fale com o mestre.');
    return NextResponse.json({stage:i.status==='completed'?'result':'quiz',name:i.player_name,answers:i.progress,
      character:i.status==='completed'?characters.find(c=>c.id===i.character_id):undefined});
  }catch(e){return failure(e);}
}
