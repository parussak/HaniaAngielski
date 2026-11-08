import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as core from '../src/core.ts';
import {modules} from './materials.ts';
const m=modules[0];const helpers=core as any;
test('I1: kolejność odpowiedzi ma stałe ziarno, zmienia się między sesjami',()=>{
  assert.equal(typeof helpers.optionsFor,'function');
  const q=m.exercises[0];const s=core.makeSession(modules,m,'quiz','choice',false,core.emptyProgress());
  const first=helpers.optionsFor(q,s);assert.deepEqual(helpers.optionsFor(q,structuredClone(s)),first);
  const orders=new Set(Array.from({length:20},(_,i)=>helpers.optionsFor(q,{...s,id:`session-${i}`}).join('|')));
  assert.ok(orders.size>1);assert.deepEqual([...first].sort(),[...q.options].sort());
});
test('I2: znane fiszki pomijane, trudne i niewidziane mają pierwszeństwo',()=>{
  const p=core.emptyProgress();for(const w of m.words)p.words[core.keyFor(m,'word',w.id)]='known';
  assert.equal(core.makeSession(modules,m,'flashcards','mixed',false,p).items.length,0);
  const key=core.keyFor(m,'word',m.words[0].id);p.words[key]='review';
  assert.equal(core.makeSession(modules,m,'flashcards','mixed',false,p).items[0].key,key);
  const qkey=core.keyFor(m,'exercise',m.exercises[0].id);p.difficult=[qkey];
  for(let i=0;i<20;i++)assert.equal(core.makeSession(modules,m,'quiz','mixed',false,p).items[0].key,qkey);
});
test('I7: wersja całego modułu nie kasuje statusów i nie blokuje starej sesji',()=>{
  const old=JSON.parse(readFileSync(new URL('./fixtures/backup-v1.json',import.meta.url),'utf8'));
  const p=core.validateBackup(old).progress;const newer={...m,version:8};
  assert.equal(core.keyFor(newer,'word',m.words[0].id),core.keyFor(m,'word',m.words[0].id));
  assert.ok(core.sessionCompatible([newer],p.active!));assert.deepEqual(core.backup(p).progress,old.progress);
  const changed={...newer,words:newer.words.map(w=>({...w,rev:2}))};
  assert.ok(!core.sessionCompatible([changed],p.active!));
});
test('I2: niewidziane pytanie ma pierwszeństwo przed poprawnie zaliczonymi',()=>{
  const p=core.emptyProgress();const first=core.makeSession(modules,m,'quiz','choice',false,p);
  const questions=m.exercises.filter(q=>q.kind==='vocabulary');
  const items=questions.map(q=>({key:core.keyFor(m,'exercise',q.id),moduleId:m.id,version:q.rev??1,type:'exercise' as const,id:q.id,input:'choice' as const}));
  p.sessions=[{...first,items,index:items.length,completedAt:new Date().toISOString(),attempts:items.slice(1).map(i=>({key:i.key,first:true,answer:'ok',corrections:0,corrected:false}))}];
  assert.equal(core.makeSession(modules,m,'quiz','choice',false,p).items[0].key,items[0].key);
});
test('I6: obce i dawne klucze nie zawyżają statystyk ani powtórek',()=>{
  assert.equal(typeof helpers.currentStats,'function');
  const p=core.emptyProgress();p.words={foreign:'known',[core.keyFor(m,'word',m.words[0].id)]:'known','unknown@1:word:gone':'review'};
  p.difficult=['unknown@1:exercise:gone'];const s=helpers.currentStats(modules,p);
  assert.equal(s.known,1);assert.equal(s.review,0);
});
test('D6/D1/D2/D3: etykiety, wskazówki klawiatury i źródła',()=>{
  const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
  assert.ok(main.includes('Poprawione za drugim razem'));assert.ok(main.includes('Trochę wybieram, trochę wpisuję'));
  assert.ok(main.includes('autocorrect="off"'));assert.ok(main.includes('enterkeyhint="done"'));assert.ok(main.includes('aria-hidden="true"'));
  assert.ok(m.grammar.every(r=>!r.source.includes('PXL_')));
});
