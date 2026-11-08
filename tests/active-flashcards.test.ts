import {test} from 'node:test';
import assert from 'node:assert/strict';
import {modules} from './materials.ts';
import {emptyProgress,makeSession,questionFor,recordAnswer,backup,validateBackup,next,currentStats} from '../src/core.ts';

test('aktywne fiszki: wybór, wpisywanie i tryb mieszany korzystają z materiału',()=>{
  for(const mode of ['choice','text','mixed'] as const){
    const s=makeSession(modules,modules[0],'flashcards-basic',mode,false,emptyProgress());
    assert.deepEqual(s.items.map(i=>i.input),s.items.map((_,i)=>mode==='mixed'?(i%2?'text':'choice'):mode));
    for(const item of s.items){
      const q=questionFor(modules,item);
      const word=modules[0].words.find(w=>w.id===item.id)!;
      assert.equal(q.prompt,word.front);
      assert.deepEqual(q.answers,word.answers??[word.back]);
      assert.ok(q.options.includes(word.back));
      assert.equal(q.options.filter(o=>q.answers.includes(o)).length,1);
    }
  }
});

test('fiszka po błędzie i poprawce nadal wymaga powtórki; kopia zachowuje odpowiedzi',()=>{
  const p=emptyProgress();
  p.active=makeSession(modules,modules[0],'flashcards-basic','text',false,p);
  p.active.items=p.active.items.slice(0,1);
  const item=p.active.items[0],q=questionFor(modules,item);
  recordAnswer(p,q,'wrong');
  assert.equal(p.words[item.key],'review');
  assert.deepEqual(validateBackup(backup(p)).progress,p);
  p.active.phase='retry';recordAnswer(p,q,q.answers[0]);
  assert.equal(p.words[item.key],'review');
  assert.ok(p.difficult.includes(item.key));
  next(p);recordAnswer(p,q,q.answers[0]);next(p);
  assert.equal(p.sessions[0].attempts[0].first,false);
  assert.equal(p.sessions[0].attempts[0].corrected,true);
  assert.equal(currentStats(modules,p).accuracy,0);
  p.active=makeSession(modules,modules[0],'flashcards-basic','choice',false,p);
  assert.equal(p.active.items[0].key,item.key);
  recordAnswer(p,q,q.answers[0]);
  assert.equal(p.words[item.key],'known');
  assert.ok(!p.difficult.includes(item.key));
});

test('stara odkryta fiszka wymaga odpowiedzi i nie traci kompatybilności kopii',()=>{
  const p=emptyProgress();p.active=makeSession(modules,modules[0],'flashcards','text',false,p);
  p.active.phase='revealed';
  assert.deepEqual(validateBackup(backup(p)).progress,p);
  const item=p.active.items[0];recordAnswer(p,questionFor(modules,item),questionFor(modules,item).answers[0]);
  assert.equal(p.active.phase,'feedback');assert.equal(p.words[item.key],'known');
  assert.deepEqual(validateBackup(backup(p)).progress,p);
});
