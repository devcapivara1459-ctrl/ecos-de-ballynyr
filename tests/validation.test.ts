import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validAnswers,playerName } from '../lib/validation';
import { questions } from '../lib/questions';
test('doze perguntas públicas sem perfis ou pesos',()=>{
 assert.equal(questions.length,12);
 assert(questions.every(q=>q.a.length===4 && q.a.every(a=>typeof a==='string')));
 assert(!JSON.stringify(questions).includes('rhiona'));
});
test('recusa respostas incompletas, fracionárias e fora das alternativas',()=>{
 assert(validAnswers(Array(12).fill(0),true));
 for(const a of [null,{},Array(11).fill(0),Array(13).fill(0),[...Array(11).fill(0),4],[...Array(11).fill(0),0.5]]) assert(!validAnswers(a,true));
 assert(validAnswers([0,1,2]));
});
test('nomes com limites e sem caracteres de controle',()=>{
 assert(playerName('João da Silva'));assert(!playerName(' '));assert(!playerName('a'));assert(!playerName('a'.repeat(81)));assert(!playerName('Ana\nTeste'));
});
