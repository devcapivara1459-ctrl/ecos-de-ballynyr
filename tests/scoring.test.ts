import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rank,characters,questions} from '../lib/data';
test('preserva os pesos originais 3/1 e desempate determinístico',()=>{
 const answers=Array(12).fill(0);const expected:Record<string,number>={};
 for(const c of characters)expected[c.id]=0;
 questions.forEach(q=>{expected[q.a[0][1]]+=3;expected[q.a[0][2]]+=1;});
 const result=rank(answers);
 assert.equal(result.length,6);assert.equal(result.reduce((n,r)=>n+r.score,0),48);
 for(const r of result)assert.equal(r.score,expected[r.id]);
 assert.deepEqual(result,rank(answers));
 assert(result.every((r,i)=>i===0||result[i-1].score>=r.score));
});
