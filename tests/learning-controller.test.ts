import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AppState} from '../src/app/state.ts';
import {createLearningController} from '../src/controllers/learning.ts';
import {makeSession,recordAnswer,questionFor,replaceActive,type Progress} from '../src/core.ts';
import {makeLessonSession,type Journey} from '../src/adventure.ts';
import {recordStageError} from '../src/stage-review.ts';
import {creditStars} from '../src/house/progress.ts';
import {engineModule} from './fixtures/engine.ts';
import {courseFixture} from './fixtures/course-materials.ts';

const entries = [
 {action:'mode',data:{mode:'grammar'},message:'Rozpoczęcie nowej sesji zastąpi niedokończoną sesję. Zakończona historia i zapisane trudności pozostaną. Kontynuować?'},
 {action:'course-mode',data:{mode:'quiz'},message:'Nowa sesja zastąpi niedokończoną sesję. Zakończone wyniki pozostaną zachowane. Kontynuować?'},
 {action:'begin-lesson',data:{id:'lesson'},message:'Rozpocząć lekcję zamiast niedokończonej sesji? Ukończone wyniki pozostaną zachowane.'},
 {action:'extra-training',data:{},message:'Rozpocząć trening zamiast niedokończonej sesji? Ukończone wyniki pozostaną zachowane.'},
 {action:'stage-review',data:{id:'stage'},message:'Rozpocząć powtórkę zamiast niedokończonej sesji? Ukończone wyniki pozostaną zachowane.'},
];
function setup() {
 const state=new AppState(),course=courseFixture().courses[0];
 state.modules=[engineModule('controller-unit',course.id)];state.selected=state.modules[0];
 course.moduleIds=[state.selected.id];state.courses=[course];state.selectedCourseId=course.id;
 const journey:Journey={version:1,moduleId:state.selected.id,title:'Mapa testowa',stages:[{id:'stage',title:'Etap',cat:'',illustration:'',lessons:[{id:'lesson',title:'Lekcja',intro:'Wprowadzenie',wordIds:state.selected.words.slice(0,8).map(w=>w.id),exerciseIds:[],ruleIds:[]}]}]};
 state.journeys=[journey];
 state.progress.active=makeLessonSession(state.modules,journey,journey.stages[0].lessons[0],'text',state.progress);
 const session=state.progress.active,item=session.items[0];
 recordAnswer(state.progress,questionFor(state.modules,item),'błąd');
 recordStageError(state.progress,session,item,state.journeys);
 creditStars(state.progress,23,course.id);
 state.progress.sessions=[{...structuredClone(session),id:'history',completedAt:'2026-11-01T12:00:00.000Z'}];
 state.lastReward=7;state.lastStageReward=3;state.screen='setup';
 let saves=0,fail=false;
 const controller=createLearningController(state,{
  courses:{select:async()=>false,restore:async()=>{},followSession:async()=>{}},scheduleReviewMigration:()=>{},
  mutate:async(change:(p:Progress)=>void)=>{const draft=structuredClone(state.progress);change(draft);if(fail)throw Error('Zapis niedostępny');state.progress=draft;saves++;},
 });
 return {state,controller,saves:()=>saves,fail:()=>{fail=true;}};
}
for(const entry of entries) for(const scenario of ['odmowa','zgoda','bez aktywnej sesji','błąd zapisu']) {
 test(`${entry.action}: ${scenario} zachowuje kontrakt zastępowania sesji`,async(t)=>{
  const f=setup();if(scenario==='bez aktywnej sesji')f.state.progress.active=null;
  if(scenario==='błąd zapisu')f.fail();
  const before=structuredClone(f.state.progress),messages:string[]=[];
  const original=Object.getOwnPropertyDescriptor(globalThis,'window');
  Object.defineProperty(globalThis,'window',{configurable:true,value:{confirm:(message:string)=>{messages.push(message);return scenario!=='odmowa';}}});
  t.after(()=>{if(original)Object.defineProperty(globalThis,'window',original);else Reflect.deleteProperty(globalThis,'window');});
  const run=()=>f.controller.handleAction(entry.action,{dataset:entry.data} as HTMLElement);
  if(scenario==='błąd zapisu')await assert.rejects(run(),/Zapis niedostępny/);
  else assert.equal(await run(),true);
  assert.deepEqual(messages,scenario==='bez aktywnej sesji'?[]:[entry.message]);
  if(scenario==='odmowa'||scenario==='błąd zapisu'){
   assert.deepEqual(f.state.progress,before);assert.equal(f.saves(),0);
   assert.equal(f.state.screen,'setup');assert.equal(f.state.lastReward,7);assert.equal(f.state.lastStageReward,3);
  }else{
   assert.equal(f.saves(),1);assert.equal(f.state.screen,'study');
   assert.ok(f.state.progress.active);assert.notEqual(f.state.progress.active?.id,before.active?.id);
   const expected=structuredClone(before);replaceActive(expected,f.state.progress.active!);
   assert.deepEqual(f.state.progress,expected);
   assert.equal(f.state.lastReward,entry.action==='mode'?7:0);assert.equal(f.state.lastStageReward,entry.action==='mode'?3:0);
  }
 });
}
