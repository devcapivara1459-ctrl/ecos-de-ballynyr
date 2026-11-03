import { questions } from './questions';
export function validAnswers(value:unknown,complete=false): value is number[] {
  return Array.isArray(value) && value.length <= questions.length && (!complete || value.length===questions.length) &&
    value.every((n,i)=>Number.isInteger(n)&&n>=0&&n<questions[i].a.length);
}
export function playerName(value:unknown): value is string {
  return typeof value==='string' && value.trim().length>=2 && value.length<=80 && !/[\u0000-\u001f\u007f]/.test(value);
}
