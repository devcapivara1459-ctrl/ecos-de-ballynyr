import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { db,hashToken } from '../../../lib/db';
import { characters } from '../../../lib/data';
import { failure,HttpError,isAdmin,playerSession,tokenInput } from '../../../lib/security';
export const runtime='nodejs';
export async function GET(req:Request) {
  try {
    const url=new URL(req.url);const id=url.searchParams.get('id');
    if(!characters.some(c=>c.id===id)) throw new HttpError(404,'Imagem indisponível.');
    if(!await isAdmin()) {
      const token=url.searchParams.get('token');tokenInput(token);
      const session=await playerSession(token);if(!session) throw new HttpError(401,'Acesso restrito.');
      const rows=await db()`SELECT id FROM invites WHERE token_hash=${hashToken(token)} AND session_hash=${hashToken(session)} AND status='completed' AND character_id=${id}`;
      if(!rows.length) throw new HttpError(403,'Acesso restrito.');
    }
    const bytes=await readFile(path.join(process.cwd(),'assets','portraits',`${id}.png`));
    return new Response(bytes,{headers:{'Content-Type':'image/png','Cache-Control':'private, no-store'}});
  }catch(e){return failure(e);}
}
