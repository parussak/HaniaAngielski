// D-53: the Food scenes are content. The mechanics are tested on synthetic data in scenes.test.ts.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {foodModules as modules} from './materials.ts';
import {emptyProgress,questionFor,isCorrect,keyFor} from '../src/core.ts';
import {freshAdventure,lessons,lessonForProgress,makeLessonSession,nextLesson,validateJourney,type Journey} from '../src/adventure.ts';
import {varyLesson} from '../src/learning/lesson-variety.ts';
import {sceneView} from '../src/learning/scenes.ts';
const m=modules[0],read=(f:string):Journey=>JSON.parse(readFileSync(new URL(`../public/content/02-food/${f}.json`,import.meta.url),'utf8'));
const j=read('sciezka'),second=read('sciezka-praktyka'),scenes=m.scenes??[];
const placed={'restaurant-dialogue-1':'food-scene-order','restaurant-dialogue-2':'food-scene-drinks','picnic-inventory':'food-scene-shopping','picnic-finale':'food-scene-picnic'};
const words=(text:string)=>text.toLowerCase().replace(/[’]/g,"'").match(/[a-z']+/g)??[];

test('Food ma cztery sceny: adaptacje ze źródłem, regułą i jednowyrazowymi odpowiedziami',()=>{
 assert.deepEqual(scenes.map(s=>s.id),Object.values(placed));
 for(const scene of scenes){
  assert.ok(scene.gapIds.length>=4&&scene.gapIds.length<=5,scene.id);
  for(const id of scene.gapIds){
   const q=m.exercises.find(q=>q.id===id)!;
   assert.match(q.source!,/adaptacja, nie cytat/);assert.match(q.source!,/podręcznik, s\. \d+/);
   assert.ok(q.ruleId&&m.grammar.some(r=>r.id===q.ruleId),id);assert.ok(q.answers.every(a=>!a.includes(' ')),id);
   assert.equal(q.options.filter(o=>isCorrect(q,o)).length,1,id);assert.ok(q.explanation.length>20,id);
  }
 }
 // Both ways of answering are used, and they alternate inside a scene.
 for(const scene of scenes)assert.equal(new Set(scene.gapIds.map(id=>m.exercises.find(q=>q.id===id)!.scene!.input)).size,2,scene.id);
});

test('sceny Food używają wyłącznie słów, które moduł już zawiera',()=>{
 // Everything published before the scenes: vocabulary, grammar examples and earlier tasks.
 const earlier=m.exercises.filter(q=>!q.scene);
 const known=new Set([...m.words.flatMap(w=>[w.back,...(w.answers??[])]),...m.grammar.flatMap(r=>r.examples),...earlier.flatMap(q=>[q.prompt,...q.answers,...q.options,...(q.dialogue??[]).map(l=>l.text)])].flatMap(words));
 for(const scene of scenes){
  let gap=0;const text=scene.lines.map(l=>l.text.replace(/___/g,()=>{const id=scene.gapIds[gap++];return m.exercises.find(q=>q.id===id)!.answers[0];})).join(' ');
  assert.equal(gap,scene.gapIds.length);
  for(const word of words(text))assert.ok(known.has(word),`${scene.id}: „${word}” nie występuje w materiale modułu`);
 }
});

test('sceny są w czterech istniejących lekcjach; mapy mają te same lekcje, a ukończona zostaje ukończona',()=>{
 assert.equal(lessons(j).length,41);assert.equal(lessons(second).length,5);assert.doesNotThrow(()=>validateJourney(j,m));
 const p=emptyProgress();p.adventure=freshAdventure();
 for(const e of lessons(j))p.adventure.completed[e.key]={at:'2026-11-01T12:00:00.000Z'};
 assert.equal(nextLesson(j,p),undefined);
 for(const {lesson} of lessons(j)){
  const current=lessonForProgress(j,lesson,p),sceneId=placed[lesson.id as keyof typeof placed];
  const listed=scenes.filter(s=>s.gapIds.some(id=>current.exerciseIds.includes(id))).map(s=>s.id);
  assert.deepEqual(listed,sceneId?[sceneId]:[],lesson.id);
  // The original definition of every lesson is untouched (D-52: only the current content changes).
  assert.ok(!lesson.exerciseIds.some(id=>id.includes('--')),lesson.id);
  if(sceneId)assert.ok(current.wordIds.length+current.exerciseIds.length<=8,lesson.id);
 }
});

test('historyjka Food jest całą lekcją, także przy dostępnym poznanym materiale do powtórek',()=>{
 for(const [lessonId,sceneId] of Object.entries(placed)){
  const lesson=lessons(j).find(e=>e.lesson.id===lessonId)!.lesson,p=emptyProgress(),scene=scenes.find(s=>s.id===sceneId)!;
  p.encountered=m.words.map(w=>keyFor(m,'word',w.id));
  const s=varyLesson(makeLessonSession(modules,j,lesson,'mixed',p),modules,[j,second],j,lesson,p);
  assert.equal(s.items.length,scene.gapIds.length,lessonId);assert.deepEqual(s.items.map(i=>i.id),scene.gapIds);
  s.index=s.items.length-scene.gapIds.length;assert.equal(sceneView(modules,s)!.scene.id,sceneId);
  for(const item of s.items.slice(s.index))assert.equal(item.input,questionFor(modules,item).scene!.input==='bank'?'choice':'text');
 }
});
