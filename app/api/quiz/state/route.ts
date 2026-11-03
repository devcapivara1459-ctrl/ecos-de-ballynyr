import { NextResponse } from 'next/server';
import { db,hashToken } from '../../../../lib/db';
import { characters } from '../../../../lib/data';
import { body,cookieOptions,failure,HttpError,isAdmin,originGuard,playerCookie,playerSession,rateLimit,secretToken,tokenInput } from '../../../../lib/security';
export async function POST(req:Request) {
  try {
    originGuard(req);const {token}=await body(req);tokenInput(token);await rateLimit(req,'state',300);
    const rows=await db()`SELECT status,session_hash,player_name,progress,character_id,expires_at FROM invites WHERE token_hash=${hashToken(token)}`;
    const i=rows[0];if(!i || i.status==='revoked') throw new HttpError(404,'Este convite não está disponível. Fale com o mestre.');
    if(i.status==='new') {
      if(new Date(i.expires_at)<new Date()) throw new HttpError(410,'Este convite expirou. Fale com o mestre.');
      const response=NextResponse.json({stage:'intro',name:i.player_name||''});
      // Establish the browser session before consuming the invite. If the start
      // response is interrupted, retrying still presents the original session.
      if(!await playerSession(token)) response.cookies.set(playerCookie(token),secretToken(),cookieOptions);
      return response;
    }
    const session=await playerSession(token);
    if(!session || hashToken(session)!==i.session_hash) return NextResponse.json({
      error:i.status==='completed'?'Este convite já foi concluído. Abra no navegador usado para responder.':'Este convite já foi iniciado, mas a sessão não foi encontrada neste navegador. Abra no navegador original ou peça ao mestre para autorizar a retomada.',
      recoverable:i.status==='started',canRecover:i.status==='started'&&await isAdmin(),
    },{status:409});
    return NextResponse.json({stage:i.status==='completed'?'result':'quiz',name:i.player_name,answers:i.progress,
      character:i.status==='completed'?characters.find(c=>c.id===i.character_id):undefined});
  }catch(e){return failure(e);}
}
