'use client';
import {useEffect,useRef,useState} from 'react';
import {questions} from '../../../lib/questions';
type Character={id:string;name:string;tag:string;text:string};
export default function Journey({token}:{token:string}) {
 const [stage,setStage]=useState<'loading'|'intro'|'quiz'|'result'|'unavailable'>('loading');
 const [name,setName]=useState('');const [answers,setAnswers]=useState<number[]>([]);
 const [idx,setIdx]=useState(0);const [selected,setSelected]=useState<number|null>(null);
 const [character,setCharacter]=useState<Character|null>(null);const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);const lock=useRef(false);const heading=useRef<HTMLHeadingElement>(null);
 const [recoverable,setRecoverable]=useState(false),[canRecover,setCanRecover]=useState(false),[masterKey,setMasterKey]=useState('');
 async function api(endpoint:string,payload:object) {
  const res=await fetch(`/api/quiz/${endpoint}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,...payload})});
  const data=await res.json();if(!res.ok)throw Error(data.error||'Não foi possível continuar.');return data;
 }
 useEffect(()=>{let active=true;
  fetch('/api/quiz/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})})
  .then(async r=>{const d=await r.json();if(!r.ok){if(active){setRecoverable(!!d.recoverable);setCanRecover(!!d.canRecover);}throw Error(d.error);}return d;})
  .then(d=>{if(!active)return;setName(d.name);setStage(d.stage);if(d.character)setCharacter(d.character);
   if(d.answers){setAnswers(d.answers);setIdx(Math.min(d.answers.length,11));if(d.answers.length===12)setSelected(d.answers[11]);}})
  .catch(e=>{if(active){setError(e.message);setStage('unavailable');}});return()=>{active=false;};
 },[token]);
 useEffect(()=>{if(stage==='quiz'||stage==='result')heading.current?.focus();},[idx,stage]);
 async function start(){if(lock.current)return;lock.current=true;setBusy(true);setError('');
  try{await api('start',{name});setStage('quiz');}catch(e){setError(e instanceof Error?e.message:'Falha ao iniciar.');}finally{lock.current=false;setBusy(false);}}
 async function recover(){if(lock.current)return;lock.current=true;setBusy(true);setError('');
  try{
   if(!canRecover){const r=await fetch('/api/admin/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:masterKey})});const d=await r.json();if(!r.ok)throw Error(d.error);setCanRecover(true);}
   const d=await api('recover',{});setName(d.name);setAnswers(d.answers);setIdx(Math.min(d.answers.length,11));setSelected(d.answers.length===12?d.answers[11]:null);setStage('quiz');
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível retomar.');}finally{setMasterKey('');lock.current=false;setBusy(false);}}
 async function proceed(){if(selected===null||lock.current)return;lock.current=true;setBusy(true);setError('');
  const next=[...answers.slice(0,idx),selected];
  try{await api('progress',{answers:next});setAnswers(next);
   if(idx===11){const d=await api('submit',{answers:next});setCharacter(d.character);setStage('result');}
   else{setIdx(idx+1);setSelected(null);}
  }catch(e){setError(e instanceof Error?e.message:'Falha ao salvar.');}finally{lock.current=false;setBusy(false);}}
 return <main className={`journey ${stage==='result'?'revealed':''}`}>
 {stage==='loading'?<section className="center"><div className="seal small" aria-hidden="true">✦</div><p role="status">A névoa se abre…</p></section>:
 stage==='unavailable'?<section className="center"><div className="eyebrow">O CAMINHO ESTÁ FECHADO</div><h1>Um chamado<br/>silencioso.</h1><p role="alert" className="error">{error}</p>{recoverable&&<><p className="small-copy">O mestre pode autorizar a retomada aqui. As respostas salvas serão mantidas e a sessão anterior deixará de funcionar.</p><form onSubmit={e=>{e.preventDefault();void recover();}}>{!canRecover&&<><label htmlFor="recovery-key">Chave do mestre para autorizar a retomada</label><input id="recovery-key" type="password" autoComplete="current-password" value={masterKey} onChange={e=>setMasterKey(e.target.value)} required/></>}<button className="primary" disabled={busy||(!canRecover&&!masterKey)}>{busy?'Autorizando…':'Autorizar retomada neste navegador'}</button></form></>}<a href="/" className="text-link" style={{marginTop:24}}>Voltar ao limiar</a></section>:
 stage==='intro'?<section className="center intro"><div className="eyebrow">UM CONVITE • UM DESTINO</div><div className="seal" aria-hidden="true">✦</div><h1>O chamado<br/><em>é seu.</em></h1><p>Uma vila distante repousa entre a névoa e o silêncio. Algo o chama para lá.</p><div className="rule"/><p className="small-copy">Doze escolhas revelarão o caminho que mais se aproxima do seu. Responda como você agiria.</p>
 <form onSubmit={e=>{e.preventDefault();void start();}}><label htmlFor="name">Como devemos chamar você?</label><input id="name" autoComplete="given-name" minLength={2} maxLength={80} required value={name} onChange={e=>setName(e.target.value)} placeholder="Seu nome"/><button className="primary" disabled={busy||name.trim().length<2}>{busy?'Abrindo o caminho…':'Atender ao chamado'} <span aria-hidden="true">→</span></button></form>
 <p className="fine-print">Seu progresso fica salvo neste navegador. O convite é individual e só pode ser iniciado uma vez.</p></section>:
 stage==='quiz'?<section className="quiz-shell"><div className="quiz-top"><span className="eyebrow">O CAMINHO</span><span className="counter">{String(idx+1).padStart(2,'0')} <span>/ 12</span></span></div><div className="progress" role="progressbar" aria-label="Perguntas concluídas" aria-valuemin={0} aria-valuemax={12} aria-valuenow={idx}><span style={{width:`${idx/12*100}%`}}/></div>
 <div key={idx} className="question"><div className="chapter">✦ &nbsp; ESCOLHA {String(idx+1).padStart(2,'0')}</div><h1 ref={heading} tabIndex={-1}>{questions[idx].q}</h1><p className="prompt">Escute seu primeiro impulso.</p><div className="choices" role="group" aria-label="Escolha uma resposta">{questions[idx].a.map((a,i)=><button className={selected===i?'choice selected':'choice'} aria-pressed={selected===i} disabled={busy} key={i} onClick={()=>setSelected(i)}><span className="choice-letter">{String.fromCharCode(65+i)}</span><span>{a}</span><span className="choice-mark" aria-hidden="true">{selected===i?'✦':'·'}</span></button>)}</div></div>
 <div className="quiz-actions"><button className="ghost" disabled={busy||idx===0} onClick={()=>{setIdx(idx-1);setSelected(answers[idx-1]??null);setError('');}}>← Voltar</button><button className="primary" disabled={busy||selected===null} onClick={()=>void proceed()}>{busy?'Guardando sua escolha…':idx===11?'Revelar meu destino':'Continuar'} <span aria-hidden="true">→</span></button></div><p className="fine-print">Suas escolhas são salvas ao continuar.</p></section>:
 character?<section className="reveal"><div className="reveal-art"><div className="portrait-halo"/><img className="portrait" src={`/api/portrait?id=${character.id}&token=${encodeURIComponent(token)}`} alt={`Ilustração original de ${character.name}`}/></div><div className="reveal-copy"><div className="eyebrow">A NÉVOA RECONHECE VOCÊ</div><p className="gold">{character.tag}</p><h1 ref={heading} tabIndex={-1}>{character.name}</h1><div className="rule"/><p>{character.text}</p><div className="destiny-stamp"><span aria-hidden="true">✦</span><div>Um lugar que pertence a você.<small>Seu destino está selado.</small></div></div><p className="fine-print">Guarde esta descoberta para a aventura. Você pode voltar a esta página neste navegador.</p><a className="text-link" href="/">Voltar ao limiar →</a></div></section>:null}
 {error&&stage!=='unavailable'&&<p className="error floating-error" role="alert">{error} Você pode tentar novamente.</p>}
 </main>;
}
