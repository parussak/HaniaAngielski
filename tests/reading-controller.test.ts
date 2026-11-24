// Kontroler czytanki widzi tylko wąski ReadingState (najwęższy dostęp do stanu) — bez AppState i bez DOM-u.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readingModule,readingJourney} from './fixtures/readings.ts';
import {createReadingController,readingShown,type ReadingState} from '../src/controllers/reading.ts';
import {makeLessonSession} from '../src/learning/lesson-session.ts';
import {validateJourney} from '../src/learning/journey-validation.ts';
import {varyLesson} from '../src/learning/lesson-variety.ts';
import {emptyProgress,questionFor,recordAnswer,type Progress} from '../src/core.ts';

const m=readingModule(),modules=[m],j=validateJourney(readingJourney(),m),lesson=j.stages[0].lessons[1];

function setup(){
 const p=emptyProgress();p.active=varyLesson(makeLessonSession(modules,j,lesson,'mixed',p),modules,[j],j,lesson,p);
 // Dokładnie pola ReadingState — nic więcej.
 let current=p;
 const state:ReadingState={modules,get progress(){return current;}};
 let saves=0;
 const controller=createReadingController(state,{mutate:async(change:(p:Progress)=>void)=>{const draft=structuredClone(current);change(draft);current=draft;saves++;}});
 const press=(action:string,data:Record<string,string>={})=>controller.handleAction(action,{dataset:data} as unknown as HTMLElement);
 return {state,press,saves:()=>saves,progress:()=>current};
}

test('reading-next: pokazuje kolejne zdanie bez zapisu, a potem zapisuje przejście do pytania',async()=>{
 const {state,press,saves,progress}=setup(),id=progress().active!.id;
 assert.equal(await press('reading-next'),true);
 assert.equal(state.readingShown,undefined,'otwarte pytanie blokuje „Dalej”');assert.equal(saves(),0);
 const item=progress().active!.items[0];recordAnswer(progress(),questionFor(modules,item),questionFor(modules,item).answers[0]);
 assert.equal(await press('reading-next'),true);
 const shown=(state as ReadingState).readingShown;assert.equal(shown?.sessionId,id);assert.equal(readingShown(state),shown!.count);
 assert.equal(progress().active!.index,1,'przejście do pytania jest zapisane');assert.equal(saves(),1);
});

test('readingShown: licznik innej sesji nie obowiązuje',()=>{
 const {state}=setup();
 state.readingShown={sessionId:'inna',count:3};
 assert.equal(readingShown(state),undefined);
});

test('reading-peek: stuknięcie przełącza podgląd tłumaczenia, niewidoczne zdanie jest ignorowane',async()=>{
 const {state,press,saves,progress}=setup(),id=progress().active!.id;
 await press('reading-next');
 await press('reading-peek',{sentence:'s1',word:'garden'});
 assert.deepEqual(state.readingPeek,{sessionId:id,sentence:'s1',word:'garden'});
 await press('reading-peek',{sentence:'s1',word:'garden'});
 assert.equal(state.readingPeek,undefined,'drugie stuknięcie chowa podgląd');
 await press('reading-peek',{sentence:'s3'});
 assert.equal(state.readingPeek,undefined,'zdanie jeszcze niewidoczne');
 assert.equal(saves(),0);
});

test('reading-question-peek: stuknięcie słowa pytania przełącza jego tłumaczenie',async()=>{
 const {state,press,progress}=setup(),s=progress().active!,key=s.items[0].key;
 await press('reading-question-peek',{key,term:'are they sitting'});
 assert.deepEqual(state.readingQuestionPeek,{sessionId:s.id,key,term:'are they sitting'});
 await press('reading-question-peek',{key,term:'are they sitting'});
 assert.equal(state.readingQuestionPeek,undefined);
 await press('reading-question-peek',{key,term:'nie ma w słowniku'});
 assert.equal(state.readingQuestionPeek,undefined);
});

test('kontroler nie obsługuje cudzych akcji',async()=>{
 const {press}=setup();
 assert.equal(await press('answer'),false);
});
