import { NextResponse } from 'next/server';
import { adminSecret, body, cookieOptions, equal, failure, HttpError, isAdmin, originGuard, rateLimit, secretToken, sign } from '../../../../lib/security';
export async function GET() { try { return NextResponse.json({authenticated:await isAdmin()}); } catch(e) {return failure(e);} }
export async function POST(req:Request) {
  try {
    originGuard(req); const {key}=await body(req); await rateLimit(req,'admin-login',10);
    if(typeof key!=='string'||!equal(key,adminSecret())) throw new HttpError(401,'Chave incorreta.');
    const payload=`${Date.now()+8*60*60*1000}.${secretToken()}`;
    const res=NextResponse.json({ok:true});
    res.cookies.set('ecos_admin',`${payload}.${sign(payload)}`,{...cookieOptions,maxAge:8*60*60});
    return res;
  }catch(e){return failure(e);}
}
export async function DELETE(req:Request) {
  try { originGuard(req); const res=NextResponse.json({ok:true}); res.cookies.set('ecos_admin','',{...cookieOptions,maxAge:0});return res; }catch(e){return failure(e);}
}
