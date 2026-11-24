import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyProgress,type Progress} from '../src/learning/model.ts';
import {makeLessonSession} from '../src/learning/lesson-session.ts';
import {type Journey} from '../src/learning/journey.ts';
import {createLearningController,type LearningState} from '../src/controllers/learning.ts';
import {engineModule} from './fixtures/engine.ts';
import {courseFixture} from './fixtures/course-materials.ts';

// Kontroler nauki dostaje zwykły obiekt z wąskim LearningState — bez klasy AppState, DOM-u i prawdziwego zapisu.
const element=(dataset:Record<string,string>={})=>({dataset}) as HTMLElement;
function setup(){
 const course=courseFixture().courses[0],m=engineModule('learning-state-unit',course.id);
 course.moduleIds=[m.id];
 const journey:Journey={version:1,moduleId:m.id,title:'Mapa',stages:[{id:'stage',title:'Etap',cat:'',illustration:'',lessons:[
  {id:'first',title:'Pierwsza',intro:'',wordIds:m.words.slice(0,4).map(w=>w.id),exerciseIds:[],ruleIds:[]},
  {id:'second',title:'Druga',intro:'',wordIds:m.words.slice(4,8).map(w=>w.id),exerciseIds:[],ruleIds:[]}]}]};
 const state:LearningState&{progress:Progress}={
  progress:emptyProgress(),courses:[course],selectedCourseId:course.id,modules:[m],selected:m,journeys:[journey],journeyIssues:[],
  selectedJourneyKey:'',introLessonId:'',answerMode:'mixed',previous:false,notice:'',mode:'flashcards-basic',
  lastReward:5,lastStageReward:2,lastSession:null,screen:'home',
 };
 let saves=0;
 const controller=createLearningController(state,{
  courses:{select:async()=>false,restore:async()=>{},followSession:async()=>{}},scheduleReviewMigration:()=>{},
  mutate:async(change:(p:Progress)=>void)=>{const draft=structuredClone(state.progress);change(draft);state.progress=draft;saves++;},
 });
 return {state,controller,journey,saves:()=>saves};
}

test('proste przejścia zmieniają tylko ekran',async()=>{
 const f=setup();
 for(const [action,screen] of [['warmup','warmup'],['courses','courses'],['grammar','grammar'],['module-list','module-list'],['course-practice','course-practice']] as const){
  assert.equal(await f.controller.handleAction(action,element()),true);assert.equal(f.state.screen,screen);
 }
 assert.equal(f.saves(),0);
});

test('lekcja spoza mapy pokazuje komunikat, lekcja z mapy otwiera wprowadzenie w trybie mieszanym',async()=>{
 const f=setup();f.state.answerMode='text';
 await f.controller.handleAction('open-lesson',element({id:'nie-ma-takiej'}));
 assert.equal(f.state.notice,'Najpierw ukończ wcześniejszą lekcję.');assert.equal(f.state.screen,'home');
 await f.controller.handleAction('open-lesson',element({id:'first'}));
 assert.equal(f.state.introLessonId,'first');assert.equal(f.state.answerMode,'mixed');assert.equal(f.state.screen,'lesson-intro');
});

test('„Wznów” bez sesji wraca do nauki, z sesją lekcji otwiera jej wprowadzenie',async()=>{
 const f=setup();
 await f.controller.handleAction('resume',element());assert.equal(f.state.screen,'study');
 const lesson=f.journey.stages[0].lessons[0];
 f.state.progress.active=makeLessonSession(f.state.modules,f.journey,lesson,'text',f.state.progress);
 await f.controller.handleAction('resume',element());
 assert.equal(f.state.screen,'lesson-intro');assert.equal(f.state.introLessonId,'first');assert.equal(f.state.selected,f.state.modules[0]);
});

test('ustawienia zapisują tryb odpowiedzi i przełącznik „poprzednie”',()=>{
 const f=setup();
 f.controller.handleSettingsChange({name:'answerMode',value:'text'} as HTMLInputElement);
 f.controller.handleSettingsChange({id:'previous',checked:true} as HTMLInputElement);
 assert.equal(f.state.answerMode,'text');assert.equal(f.state.previous,true);
});

test('akcja odpowiedzi trafia do właściciela i działa na tym samym wąskim stanie',async()=>{
 const f=setup();
 await f.controller.handleAction('open-lesson',element({id:'first'}));
 await f.controller.handleAction('begin-lesson',element({id:'first'}));
 assert.ok(f.state.progress.active);assert.equal(f.state.screen,'study');
 assert.equal(await f.controller.handleAction('answer',element({answer:'  '})),true);
});
