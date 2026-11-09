import {test} from 'node:test';
import assert from 'node:assert/strict';
import {modules} from './materials.ts';
import {validateModules} from '../src/content-validation.ts';
import {emptyProgress,makeSession,questionFor,recordAnswer,backup,validateBackup,next} from '../src/core.ts';

test('rozmówki są osobnym zakresem, a stare zakresy i identyfikatory pozostają dostępne',()=>{
  const m=modules[0];
  for(const [mode,kind] of [['dialogue','dialogue'],['grammar','grammar'],['quiz','vocabulary']] as const){
    const s=makeSession(modules,m,mode,'mixed',false,emptyProgress());assert.equal(s.items.length,10);
    assert.ok(s.items.every(item=>questionFor(modules,item).kind===kind));
  }
  for(const q of m.exercises.filter(q=>q.kind==='dialogue')){
    assert.equal(q.dialogue!.flatMap(line=>line.text.match(/___/g)??[]).length,1);
    assert.ok(q.answers.every(a=>!a.includes(' ')));assert.ok(q.ruleId&&m.grammar.some(r=>r.id===q.ruleId));
    assert.match(q.source!,/adaptacja/);
  }
});

test('błąd w dialogu, poprawka, kopia i ukończenie zachowują prawdziwy pierwszy wynik',()=>{
  const p=emptyProgress();p.active=makeSession(modules,modules[0],'dialogue','text',false,p);
  p.active.items=p.active.items.slice(0,1);const q=questionFor(modules,p.active.items[0]);
  assert.equal(recordAnswer(p,q,'wrong'),false);
  p.active.phase='retry';assert.equal(recordAnswer(p,q,q.answers[0]),true);
  const restored=validateBackup(backup(p)).progress;
  assert.equal(restored.active!.mode,'dialogue');assert.equal(restored.active!.attempts[0].first,false);
  next(restored);recordAnswer(restored,q,q.answers[0]);next(restored);
  assert.equal(restored.sessions.length,1);assert.equal(restored.sessions[0].attempts[0].first,false);
});

test('walidacja odrzuca brak luki, dwie luki i niepoprawne wypowiedzi w dialogach',()=>{
  for(const change of [
    (q:any)=>q.dialogue.forEach((l:any)=>l.text=l.text.replace('___','like')),
    (q:any)=>q.dialogue.push({speaker:'Gość',text:'___'}),
    (q:any)=>q.dialogue[0].text=null,
    (q:any)=>q.dialogue[0].speaker='',
  ]){const copy=structuredClone(modules),q=copy[0].exercises.find(q=>q.kind==='dialogue')!;change(q);assert.throws(()=>validateModules(copy));}
});
