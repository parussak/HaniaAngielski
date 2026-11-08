import { test } from 'node:test';
import assert from 'node:assert/strict';
import { modules } from './materials.ts';
import { indexedDB } from 'fake-indexeddb';
import { backup, emptyProgress, eligibleModules, isCorrect, makeSession, markWord, next, recordAnswer, score, sessionCompatible, validateBackup, type Module } from '../src/core.ts';
import { load, save } from '../src/storage.ts';

const m = modules[0];
test('ocenianie normalizuje spacje i wielkość liter, zachowuje istotne znaki', () => {
  assert.ok(isCorrect(m.exercises[0], '  ' + m.exercises[0].answers[0].toUpperCase() + '  '));
  assert.ok(!isCorrect(m.exercises[0],'not-an-answer'));
  assert.ok(!isCorrect({...m.exercises[0],answers:['café']},'cafe'));
  assert.ok(!isCorrect({...m.exercises[0],answers:['I'],caseSensitive:true},'i'));
});
test('błąd, poprawa, powtórka i podwójne kliknięcie nie zawyżają pierwszego wyniku', () => {
  const p = emptyProgress(); p.active = makeSession(modules,m,'grammar','text',false,p);
  const item = p.active.items[0]; const q = m.exercises.find(e => e.id === item.id)!;
  recordAnswer(p,q,'wrong'); recordAnswer(p,q,q.answers[0]);
  assert.equal(p.active.attempts.length,1); assert.equal(p.active.attempts[0].first,false);
  assert.ok(p.difficult.includes(item.key)); assert.equal(p.active.repeatKeys.length,1);
  p.active.phase = 'retry'; recordAnswer(p,q,q.answers[0]);
  assert.equal(score(p.active).correct,0); assert.equal(score(p.active).corrections,1);
  assert.equal(p.active.attempts[0].corrections,1);
  const restored = validateBackup(JSON.parse(JSON.stringify(backup(p)))).progress;
  assert.equal(restored.active?.phase,'feedback'); assert.equal(restored.active?.lastCorrect,true);
});
test('odkrycie fiszki nie oznacza jej znajomości; trudna fiszka wraca raz', () => {
  const p = emptyProgress(); p.active = makeSession(modules,m,'flashcards','mixed',false,p);
  const key = p.active.items[0].key; p.active.phase = 'revealed';
  assert.equal(Object.keys(p.words).length,0);
  markWord(p,false); assert.equal(p.words[key],'review');
  assert.equal(p.active.items.at(-1)?.key,key);
});
test('zakres pomija późniejsze moduły i zadania wymagające niedozwolonych treści', () => {
  const prior = {...m,id:'prior',order:0,exercises:[],words:[]};
  const future = {...m,id:'future',order:3};
  assert.deepEqual(eligibleModules([prior,m,future],m,false).map(m=>m.id),[m.id]);
  assert.deepEqual(eligibleModules([prior,m,future],m,true).map(m=>m.id),['prior',m.id]);
  const scoped = {...m,exercises:[...m.exercises,{...m.exercises[0],id:'forbidden',requires:['future']}]};
  assert.ok(makeSession([scoped,future],scoped,'quiz','choice',false,emptyProgress()).items.every(i=>i.id!=='forbidden' && i.moduleId!==future.id));
});
test('pełna sesja jest archiwizowana tylko raz i przechodzi eksport', () => {
  const p = emptyProgress(); p.active = makeSession(modules,m,'grammar','choice',false,p);
  while(p.active) {
    const item = p.active.items[p.active.index]; const q = m.exercises.find(e=>e.id===item.id)!;
    recordAnswer(p,q,q.answers[0]); next(p);
  }
  next(p); assert.equal(p.sessions.length,1); assert.equal(score(p.sessions[0]).correct,10);
  assert.deepEqual(validateBackup(backup(p)).progress,p);
});
test('walidacja odrzuca uszkodzone pliki, wersje, indeksy i próby wstrzyknięcia HTML do stanu', () => {
  const p = emptyProgress(); p.active = makeSession(modules,m,'quiz','text',false,p);
  for (const edit of [
    (b:any)=>b.version=99,
    (b:any)=>b.progress.active.index=999,
    (b:any)=>b.progress.active.phase='feedback',
    (b:any)=>b.progress.active.items[0].key='bad',
    (b:any)=>b.progress.words={x:'<script>'},
    (b:any)=>b.progress.sessions=[{}],
    (b:any)=>b.exportedAt='invalid'
  ]) { const b=backup(p); edit(b); assert.throws(()=>validateBackup(b)); }
  assert.throws(()=>validateBackup(null));
});
test('brakujący moduł blokuje wznowienie, a nowe wydanie zachowuje dawną sesję', () => {
  const p = emptyProgress(); p.active = makeSession(modules,m,'quiz','mixed',false,p);
  const restored = validateBackup(backup(p)).progress;
  assert.ok(sessionCompatible(modules,restored.active!));
  assert.ok(!sessionCompatible([],restored.active!));
  assert.ok(sessionCompatible([{...m,version:2}],restored.active!));
  assert.deepEqual(restored,p);
});
test('IndexedDB zapisuje stan, odtwarza kopię i zachowuje stan po nieudanej transakcji',async()=>{
  Object.assign(globalThis,{indexedDB});
  const p=emptyProgress(); p.active=makeSession(modules,m,'quiz','text',false,p);
  await save(p); assert.deepEqual(await load(),p);
  const restored=validateBackup(JSON.parse(JSON.stringify(backup(p)))).progress;
  await save(emptyProgress()); await save(restored); assert.deepEqual(await load(),p);
  const invalid=structuredClone(p) as any; invalid.uncloneable=()=>{};
  await assert.rejects(save(invalid)); assert.deepEqual(await load(),p);
});
