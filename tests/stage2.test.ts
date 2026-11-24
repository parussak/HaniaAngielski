import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {emptyProgress,keyFor} from '../src/learning/model.ts';
import {backup,validateBackup} from '../src/learning/backup.ts';
import {currentStats} from '../src/learning/statistics.ts';
import {optionsFor,sessionCompatible} from '../src/learning/questions.ts';
import {makeSession} from '../src/learning/session.ts';
import {foodModules as modules} from './materials.ts';
const m=modules[0];const helpers:any={optionsFor,currentStats};
test('I1: kolejność odpowiedzi ma stałe ziarno, zmienia się między sesjami',()=>{
  assert.equal(typeof helpers.optionsFor,'function');
  const q=m.exercises[0];const s=makeSession(modules,m,'quiz','choice',false,emptyProgress());
  const first=helpers.optionsFor(q,s);assert.deepEqual(helpers.optionsFor(q,structuredClone(s)),first);
  const orders=new Set(Array.from({length:20},(_,i)=>helpers.optionsFor(q,{...s,id:`session-${i}`}).join('|')));
  assert.ok(orders.size>1);assert.deepEqual([...first].sort(),[...q.options].sort());
});
test('I2: znane fiszki pomijane, trudne i niewidziane mają pierwszeństwo',()=>{
  const p=emptyProgress();for(const w of m.words)p.words[keyFor(m,'word',w.id)]='known';
  assert.equal(makeSession(modules,m,'flashcards','mixed',false,p).items.length,0);
  const key=keyFor(m,'word',m.words[0].id);p.words[key]='review';
  assert.equal(makeSession(modules,m,'flashcards','mixed',false,p).items[0].key,key);
  const qkey=keyFor(m,'exercise',m.exercises[0].id);p.difficult=[qkey];
  for(let i=0;i<20;i++)assert.equal(makeSession(modules,m,'quiz','mixed',false,p).items[0].key,qkey);
});
test('I7: wersja całego modułu nie kasuje statusów i nie blokuje starej sesji',()=>{
  const old=JSON.parse(readFileSync(new URL('./fixtures/backup-v1.json',import.meta.url),'utf8'));
  const p=validateBackup(old).progress;const newer={...m,version:8};
  assert.equal(keyFor(newer,'word',m.words[0].id),keyFor(m,'word',m.words[0].id));
  assert.ok(sessionCompatible([newer],p.active!));assert.deepEqual(backup(p).progress,old.progress);
  const changed={...newer,words:newer.words.map(w=>({...w,rev:2}))};
  assert.ok(!sessionCompatible([changed],p.active!));
});
test('I2: niewidziane pytanie ma pierwszeństwo przed poprawnie zaliczonymi',()=>{
  const p=emptyProgress();const first=makeSession(modules,m,'quiz','choice',false,p);
  const questions=m.exercises.filter(q=>q.kind==='vocabulary');
  const items=questions.map(q=>({key:keyFor(m,'exercise',q.id),moduleId:m.id,version:q.rev??1,type:'exercise' as const,id:q.id,input:'choice' as const}));
  p.sessions=[{...first,items,index:items.length,completedAt:new Date().toISOString(),attempts:items.slice(1).map(i=>({key:i.key,first:true,answer:'ok',corrections:0,corrected:false}))}];
  assert.equal(makeSession(modules,m,'quiz','choice',false,p).items[0].key,items[0].key);
});
test('I6: obce i dawne klucze nie zawyżają statystyk ani powtórek',()=>{
  assert.equal(typeof helpers.currentStats,'function');
  const p=emptyProgress();p.words={foreign:'known',[keyFor(m,'word',m.words[0].id)]:'known','unknown@1:word:gone':'review'};
  p.difficult=['unknown@1:exercise:gone'];const s=helpers.currentStats(modules,p);
  assert.equal(s.known,1);assert.equal(s.review,0);
});
test('źródła reguł gramatycznych nie pokazują nazw plików zdjęć',()=>{
  assert.ok(m.grammar.every(r=>!r.source.includes('PXL_')));
});
