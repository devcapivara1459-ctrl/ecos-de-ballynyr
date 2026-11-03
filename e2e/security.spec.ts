import {test,expect,request} from '@playwright/test';
test('limites de entrada, origem, acesso público e tentativas de login',async()=>{
 const baseURL=process.env.TEST_BASE_URL||'http://localhost:3000';
 const client=await request.newContext({baseURL,extraHTTPHeaders:{Origin:new URL(baseURL).origin}});
 expect((await client.post('/api/quiz/start',{headers:{'Content-Type':'application/json'},data:'{invalid'})).status()).toBe(400);
 expect((await client.post('/api/quiz/start',{headers:{'Content-Type':'application/json'},data:'null'})).status()).toBe(400);
 expect((await client.post('/api/quiz/start',{headers:{'Content-Type':'text/plain'},data:'plain'})).status()).toBe(415);
 expect((await client.post('/api/quiz/start',{data:{token:'a'.repeat(9000)}})).status()).toBe(413);
 expect((await client.post('/api/quiz/start',{data:{token:'../secret',name:'Intruso'}})).status()).toBe(400);
 expect((await client.post('/api/quiz/start',{headers:{Origin:'https://evil.example'},data:{}})).status()).toBe(403);
 expect((await client.get('/personagens/rhiona.png')).status()).toBe(404);
 expect((await client.get('/assets/portraits/rhiona.png')).status()).toBe(404);
 expect((await client.get('/api/portrait?id=../../secret')).status()).toBe(404);
 await client.addCookies([{name:'ecos_admin',value:'9999999999999.forged.signature',url:baseURL}]);
 expect((await client.get('/api/admin/invites')).status()).toBe(401);
 const home=await client.get('/');expect(home.headers()['x-frame-options']).toBe('DENY');expect(home.headers()['referrer-policy']).toBe('no-referrer');
 let limited=false;
 for(let i=0;i<12;i++){const r=await client.post('/api/admin/session',{data:{key:'invalid'}});if(r.status()===429){limited=true;break;}expect(r.status()).toBe(401);}
 expect(limited).toBeTruthy();await client.dispose();
});
