import {test} from 'node:test';
import assert from 'node:assert/strict';
import {engineModule} from './fixtures/engine.ts';
import {courseFixture} from './fixtures/course-materials.ts';
import {emptyProgress,type Progress} from '../src/learning/model.ts';
import {questionFor} from '../src/learning/questions.ts';
import {makeLessonSession} from '../src/learning/lesson-session.ts';
import {type Journey} from '../src/learning/journey.ts';
import {varyLesson} from '../src/learning/lesson-variety.ts';
import {boardItems} from '../src/learning/boards.ts';
import {createSessionAnswerController,type AnswerState} from '../src/controllers/session-answers.ts';

// Kontroler odpowiedzi dostaje zwykły obiekt z wąskim AnswerState — bez AppState, DOM-u i prawdziwego zapisu.
const course=courseFixture().courses[0],m=engineModule('answers-unit',course.id);
const j:Journey={version:1,moduleId:m.id,title:'Mapa',stages:[{id:'stage',title:'Etap',cat:'albert',illustration:'illustrations/test.svg',lessons:[{id:'words',title:'Słowa',intro:'',wordIds:m.words.slice(0,5).map(w=>w.id),exerciseIds:[],ruleIds:[]},{id:'gaps',title:'Luki',intro:'',wordIds:[],exerciseIds:m.exercises.filter(q=>q.kind==='grammar').slice(0,6).map(q=>q.id),ruleIds:[]}]}]};
const element=(payload:Record<string,string|number|boolean>={})=>payload as never;
function setup(lesson=0,mode:'mixed'|'text'='mixed'){
 const progress=emptyProgress(),l=j.stages[0].lessons[lesson];
 progress.active=varyLesson(makeLessonSession([m],j,l,mode,progress),[m],[j],j,l,progress);
 const state:AnswerState={progress,modules:[m],journeys:[j],journeyIssues:[],screen:'study',lastReward:7,lastStageReward:3,lastSession:null};
 let saves=0;
 const mutate=async(change:(p:Progress)=>void)=>{const draft=structuredClone(state.progress);change(draft);state.progress=draft;saves++;};
 const controller=createSessionAnswerController(state,{mutate,courseId:()=>course.id});
 const current=()=>state.progress.active!.items[state.progress.active!.index];
 const correct=()=>questionFor([m],current()).answers[0];
 return {state,controller,saves:()=>saves,current,correct};
}

test('pusta odpowiedź i brak sesji nie zapisują niczego',async()=>{
 const f=setup();
 assert.equal(await f.controller.handleAction('answer',element({answer:'  '})),true);assert.equal(f.saves(),0);
 f.state.progress.active=null;
 assert.equal(await f.controller.handleAction('answer',element({answer:'x'})),true);assert.equal(f.saves(),0);
});

test('dobra odpowiedź przechodzi do poprawki, zła zapisuje błąd; „Popraw” wraca do pytania',async()=>{
 const f=setup();
 await f.controller.handleAction('answer',element({answer:f.correct()}));
 assert.equal(f.state.progress.active!.phase,'feedback');assert.equal(f.state.progress.active!.attempts[0].first,true);
 const g=setup();
 await g.controller.handleAction('answer',element({answer:'zdecydowanie-źle'}));
 assert.equal(g.state.progress.active!.attempts[0].first,false);assert.equal(g.saves(),1);
 assert.equal(await g.controller.handleAction('retry',element({key:g.current().key})),true);assert.equal(g.saves(),2);
});

test('zła odpowiedź na planszy luk zapisuje błąd planszy; dobra go nie ustawia',async()=>{
 const f=setup(1),group=boardItems(f.state.progress.active!);
 assert.ok(group.length>1);
 await f.controller.handleAction('gap-place',element({key:group[0].key,answer:questionFor([m],group[1]).answers[0]}));
 assert.deepEqual(f.state.boardError,{key:group[0].key,answer:questionFor([m],group[1]).answers[0]});
 f.state.boardError=undefined;
 await f.controller.handleAction('gap-place',element({key:group[0].key,answer:questionFor([m],group[0]).answers[0]}));
 assert.equal(f.state.boardError,undefined);
});

test('„Dalej” przy niewypełnionej planszy nie zapisuje i nie rusza nagród',async()=>{
 const f=setup(1),before=structuredClone(f.state.progress);
 assert.equal(await f.controller.handleAction('next',element()),true);
 assert.deepEqual(f.state.progress,before);assert.equal(f.saves(),0);assert.equal(f.state.lastReward,7);assert.equal(f.state.screen,'study');
});

test('„Dalej” w środku sesji zeruje nagrody; po ostatnim zadaniu pokazuje podsumowanie z nagrodą',async()=>{
 const f=setup(0,'text');
 const solve=async()=>{for(let i=0;f.state.progress.active!.phase==='question'&&i<100;i++)await f.controller.handleAction(f.current().pairGroup?'pair-answer':'answer',element({answer:f.correct()}));};
 await solve();
 await f.controller.handleAction('next',element());
 assert.deepEqual([f.state.lastReward,f.state.lastStageReward,f.state.screen],[0,0,'study']);
 assert.ok(f.state.progress.active);
 for(let guard=0;f.state.progress.active&&guard<100;guard++){
  await solve();
  await f.controller.handleAction('next',element());
 }
 assert.equal(f.state.progress.active,null);
 assert.equal(f.state.screen,'summary');
 assert.equal(f.state.lastSession,f.state.progress.sessions.at(-1));
 assert.ok(f.state.lastReward>0,'nagroda za lekcję trafia do stanu ekranu');
 assert.equal(f.state.roomDiscovery,undefined);
});

test('cudze akcje przechodzą dalej',async()=>{
 const f=setup();
 assert.equal(await f.controller.handleAction('house',element()),false);
});
