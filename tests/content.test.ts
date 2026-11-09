import { test } from 'node:test';
import assert from 'node:assert/strict';
import { modules } from './materials.ts';
import { assembleModule, validateModules } from '../src/content-validation.ts';

test('materiały Food mają źródła, komplet słów i wszystkie zagadnienia gramatyczne',()=>{
  assert.equal(modules.length,1); const m=modules[0];
  assert.equal(m.id,'unit-2-food'); assert.equal(m.order,2);
  assert.equal(m.words.length,97); assert.equal(m.exercises.filter(q=>q.kind!=='dialogue').length,156);
  assert.equal(m.exercises.filter(q=>q.kind==='dialogue').length,12);
  assert.ok(m.words.every(w=>w.source)); assert.ok(m.exercises.every(q=>q.source));
  for(const rule of m.grammar) assert.ok(m.exercises.some(q=>q.ruleId===rule.id));
  assert.ok(m.words.some(w=>w.back==='flour'));
  assert.ok(m.words.some(w=>w.back==='a carton of juice'));
  assert.ok(m.words.every(w=>!['a dog','a cat','a book'].includes(w.back)));
  assert.ok(m.words.find(w=>w.id==='apple')!.answers!.includes('an apple'));
  assert.ok(!m.words.find(w=>w.id==='apple')!.answers!.includes('a apple'));
});
test('jedna poprawka słówka aktualizuje fiszkę, pytanie i odpowiedź quizu',()=>{
  const m=modules[0]; const words=structuredClone(m.words);
  words[0].front='Zmienione polskie hasło'; words[0].back='edited answer'; words[0].answers=['edited answer'];
  const compiled=assembleModule(m,words,[{id:'one',wordId:words[0].id,distractorIds:[words[1].id,words[2].id]}],[],m.grammar);
  const result=validateModules([compiled])[0];
  assert.equal(result.words[0].front,'Zmienione polskie hasło');
  assert.ok(result.exercises[0].prompt.includes('Zmienione polskie hasło'));
  assert.deepEqual(result.exercises[0].answers,['edited answer']);
  assert.ok(result.exercises[0].options.includes('edited answer'));
  assert.throws(()=>assembleModule(m,words,[{id:'bad',wordId:'missing',distractorIds:[words[1].id]}],[],m.grammar));
});
test('walidator chroni edycję treści: duplikaty, brak klucza, dwa poprawne wybory, nieistniejące zależności',()=>{
  for(const edit of [
    (m:any)=>m.words.push(m.words[0]),
    (m:any)=>m.exercises[0].answers=[],
    (m:any)=>m.exercises[0].answers=[...m.exercises[0].options],
    (m:any)=>m.exercises[0].requires=['unit-2-food','missing'],
    (m:any)=>m.exercises[0].ruleId='missing',
    (m:any)=>m.grammar[0].examples=[],
    (m:any)=>delete m.words[0].source
  ]) {const copy=structuredClone(modules); edit(copy[0]); assert.throws(()=>validateModules(copy));}
});
