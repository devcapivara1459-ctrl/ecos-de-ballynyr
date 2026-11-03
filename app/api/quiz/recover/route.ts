import { NextResponse } from 'next/server';
import { db,hashToken } from '../../../../lib/db';
import { body,cookieOptions,failure,HttpError,originGuard,playerCookie,rateLimit,requireAdmin,secretToken,tokenInput } from '../../../../lib/security';

export async function POST(req:Request) {
  try {
    originGuard(req);await requireAdmin();const {token}=await body(req);tokenInput(token);
    await rateLimit(req,'admin-write',60);
    const session=secretToken();
    // A single statement locks and replaces only the browser session. Answers,
    // invite token and character availability remain unchanged.
    const rows=await db()`WITH recovered AS (
      UPDATE invites SET session_hash=${hashToken(session)}
      WHERE token_hash=${hashToken(token)} AND status='started'
      RETURNING id,player_name,progress
    ), logged AS (
      INSERT INTO audit_log(event,invite_id)
      SELECT 'journey_recovered',id FROM recovered RETURNING invite_id
    ) SELECT r.player_name,r.progress FROM recovered r JOIN logged l ON l.invite_id=r.id`;
    if(!rows.length) throw new HttpError(409,'Somente uma jornada iniciada e ainda não concluída pode ser retomada pelo mestre.');
    const response=NextResponse.json({stage:'quiz',name:rows[0].player_name,answers:rows[0].progress});
    response.cookies.set(playerCookie(token),session,cookieOptions);
    return response;
  }catch(e){return failure(e);}
}
