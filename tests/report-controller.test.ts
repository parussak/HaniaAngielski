// D-80: zgłaszanie problemu z zadania — kontroler z atrapą portów (dźwięk, kolejka na urządzeniu, wysyłka).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AppState} from '../src/app/state.ts';
import {createReportController} from '../src/controllers/report.ts';
import {sceneModule,sceneJourney} from './fixtures/scenes.ts';
import {engineModule} from './fixtures/engine.ts';
import {validateJourney} from '../src/learning/journey-validation.ts';
import {makeLessonSession} from '../src/learning/lesson-session.ts';
import {makeSession,next,recordAnswer} from '../src/learning/session.ts';
import {questionFor} from '../src/learning/questions.ts';
import {emptyProgress,type Module} from '../src/learning/model.ts';
import {parseReports,type PlaybackRecord,type ProblemReport} from '../src/learning/problem-report.ts';

const scenes:Module={...sceneModule(),languageCode:'en'},sceneMap=validateJourney(sceneJourney(),scenes);
const signedIn={uid:'user-1',email:'a@b.c'};
function sceneState(){
 const state=new AppState(),p=emptyProgress();state.modules=[scenes];state.progress=p;state.user=signedIn;
 p.active=makeLessonSession([scenes],sceneMap,sceneMap.stages[0].lessons[1],'mixed',p);const s=p.active;
 while(!s.items[s.index].sceneGroup){const q=questionFor([scenes],s.items[s.index]);recordAnswer(p,q,q.answers[0]);next(p);}
 s.boardSummary=true;return state;
}
function plainState(){const state=new AppState(),m=engineModule(),p=emptyProgress();state.modules=[m];state.progress=p;state.user=signedIn;p.active=makeSession([m],m,'flashcards','text',false,p);return state;}
interface Options{online?:boolean;last?:PlaybackRecord;speech?:boolean;failWrites?:boolean;failSend?:()=>boolean}
function setup(state:AppState,options:Options={}){
 let stored:unknown=undefined,counter=0,online=options.online??true,draws=0,failWrites=options.failWrites??false;
 const failSend=options.failSend??(()=>false),sent:{uid:string;report:ProblemReport}[]=[];
 const ports={
  speech:{available:()=>options.speech??true,last:()=>options.last,recordingOf:(text:string)=>text==='Beta duo and gamma trio.'?`clips/${'c'.repeat(64)}.ogg`:undefined},
  outbox:{read:async()=>stored,write:async(list:ProblemReport[])=>{if(failWrites)throw Error('Zapis niedostępny');stored=structuredClone(list);}},
  send:async(uid:string,report:ProblemReport)=>{await Promise.resolve();if(failSend())throw Error('Brak połączenia');sent.push({uid,report});},
  isOnline:()=>online,now:()=>new Date('2026-11-24T10:00:00Z'),newId:()=>String(++counter).padStart(32,'a'),changed:()=>{draws++;},
 };
 const controller=createReportController(state,ports);
 return {controller,sent,queue:()=>parseReports(stored),setOnline:(v:boolean)=>{online=v;},draws:()=>draws,failWrites:(v:boolean)=>{failWrites=v;}};
}
type Controller=ReturnType<typeof createReportController>;
const choose=(c:Controller,category:'no-sound'|'unclear'|'wrong-content'|'other')=>c.handleAction('report-category',{category});
/** Delivery runs after the answer to the click; let it finish. */
const settle=()=>new Promise(resolve=>setTimeout(resolve,5));

test('bez trwającej sesji przycisk nic nie otwiera',async()=>{
 const state=new AppState(),{controller}=setup(state);
 await controller.handleAction('report-open');assert.equal(state.report,undefined);
});

test('niewyraźna druga kwestia dialogu: wpis wskazuje drugą kwestię, nagranie i sposób odtwarzania',async()=>{
 const state=sceneState(),before=JSON.stringify(state.progress);
 const last:PlaybackRecord={text:'Beta duo and gamma trio.',language:'en',via:'recording',recordingFile:`clips/${'c'.repeat(64)}.ogg`};
 const {controller,sent,queue}=setup(state,{last});
 await controller.handleAction('report-open');assert.equal(state.report!.step,'category');assert.equal(state.report!.utterances.length,4);assert.equal(state.report!.lastIndex,1);
 await choose(controller,'unclear');assert.equal(state.report!.step,'which');assert.equal(sent.length,0);
 await controller.handleAction('report-utterance',{index:1});await settle();
 assert.equal(sent.length,1);assert.equal(sent[0].uid,'user-1');
 const r=sent[0].report;assert.equal(r.category,'unclear');assert.equal(r.audio!.line,2);assert.equal(r.audio!.speaker,'Olek');assert.equal(r.audio!.text,'Beta duo and gamma trio.');
 assert.equal(r.audio!.recordingFile,last.recordingFile);assert.equal(r.audio!.playback,'recording');assert.equal(r.module,'scene-unit');assert.ok(r.item.startsWith('scene-unit@'));
 assert.equal(state.report!.step,'done');assert.equal(state.report!.outcome,'sent');assert.deepEqual(queue(),[]);
 assert.equal(JSON.stringify(state.progress),before,'zgłoszenie nie zmienia postępów ani sesji');
});

test('błąd w zadaniu bez audio: jeden wybór wystarcza, w zgłoszeniu nie ma pola audio',async()=>{
 const state=plainState(),{controller,sent}=setup(state);
 await controller.handleAction('report-open');assert.deepEqual(state.report!.utterances,[]);
 await choose(controller,'wrong-content');await settle();
 assert.equal(sent.length,1);assert.equal('audio' in sent[0].report,false);assert.equal(sent[0].report.category,'wrong-content');assert.ok(sent[0].report.excerpt.length>0);
});

test('„Coś innego” czeka na opis: pusty opis nie wysyła, krótki opis tak',async()=>{
 const state=plainState(),{controller,sent}=setup(state);
 await controller.handleAction('report-open');await choose(controller,'other');assert.equal(state.report!.step,'comment');
 await controller.submitComment('   ');assert.equal(state.report!.step,'comment');assert.ok(state.report!.problem);assert.equal(sent.length,0);
 await controller.submitComment('Zdjęcie jest ucięte');await settle();
 assert.equal(sent.length,1);assert.equal(sent[0].report.comment,'Zdjęcie jest ucięte');
});

test('podwójne kliknięcie i ponowny wybór nie tworzą kopii zgłoszenia',async()=>{
 const state=plainState(),{controller,sent,queue}=setup(state);
 await controller.handleAction('report-open');
 await Promise.all([choose(controller,'wrong-content'),choose(controller,'wrong-content'),choose(controller,'other')]);await settle();
 assert.equal(sent.length,1);assert.deepEqual(queue(),[]);
});

test('bez internetu: zgłoszenie czeka na urządzeniu, a po powrocie sieci wychodzi raz, z tym samym identyfikatorem',async()=>{
 const state=plainState(),{controller,sent,queue,setOnline}=setup(state,{online:false});
 await controller.handleAction('report-open');await choose(controller,'wrong-content');await settle();
 assert.equal(state.report!.outcome,'waiting-offline');assert.equal(sent.length,0);assert.equal(queue().length,1);
 const id=queue()[0].id;setOnline(true);await controller.flush();await controller.flush();
 assert.equal(sent.length,1);assert.equal(sent[0].report.id,id);assert.deepEqual(queue(),[]);
});

test('gość bez konta: zgłoszenie zostaje na urządzeniu i wychodzi po zalogowaniu',async()=>{
 const state=plainState(),{controller,sent,queue}=setup(state);state.user=null;
 await controller.handleAction('report-open');await choose(controller,'wrong-content');await settle();
 assert.equal(state.report!.outcome,'waiting-login');assert.equal(sent.length,0);assert.equal(queue().length,1);
 await controller.flush();assert.equal(sent.length,0);
 state.user={uid:'user-2',email:'x@y.z'};await controller.flush();assert.equal(sent.length,1);assert.equal(sent[0].uid,'user-2');assert.deepEqual(queue(),[]);
});

test('wysyłka nie udała się: komunikat mówi wprost, że zgłoszenie czeka, a ponowienie nie tworzy drugiego wpisu',async()=>{
 const state=plainState();let fail=true;const {controller,sent,queue}=setup(state,{failSend:()=>fail});
 await controller.handleAction('report-open');await choose(controller,'wrong-content');await settle();
 assert.equal(state.report!.outcome,'waiting-error');assert.equal(queue().length,1);
 fail=false;await controller.flush();assert.equal(sent.length,1);assert.deepEqual(queue(),[]);
});

test('dwie równoległe wysyłki kolejki nie wysyłają tego samego zgłoszenia dwa razy',async()=>{
 const state=plainState();let fail=true;const {controller,sent}=setup(state,{failSend:()=>fail});
 await controller.handleAction('report-open');await choose(controller,'wrong-content');await settle();
 fail=false;await Promise.all([controller.flush(),controller.flush(),controller.flush()]);assert.equal(sent.length,1);
});

test('nie udało się zapisać na urządzeniu: nic nie jest wysłane, Hania wraca do wyboru i może spróbować jeszcze raz',async()=>{
 const state=plainState(),{controller,sent,failWrites}=setup(state,{failWrites:true});
 await controller.handleAction('report-open');await choose(controller,'wrong-content');await settle();
 assert.equal(state.report!.step,'category');assert.ok(state.report!.problem);assert.equal(sent.length,0);
 failWrites(false);await choose(controller,'wrong-content');await settle();assert.equal(sent.length,1);
});

test('zamknięcie w trakcie wysyłki nie przerywa doręczenia',async()=>{
 const state=plainState(),{controller,sent,queue}=setup(state);
 await controller.handleAction('report-open');const pending=choose(controller,'wrong-content');
 await controller.handleAction('report-close');assert.equal(state.report,undefined);await pending;await settle();
 assert.equal(sent.length,1);assert.deepEqual(queue(),[]);
});

test('pytania o dźwięk są tylko przy materiale z dźwiękiem; po nieudanej próbie nadal są',async()=>{
 const silent=sceneState(),a=setup(silent,{speech:false});
 await a.controller.handleAction('report-open');assert.deepEqual(silent.report!.utterances,[]);
 const failed=sceneState(),last:PlaybackRecord={text:'Delta quattro!',language:'en',via:'none',recordingFailed:true},b=setup(failed,{speech:false,last});
 await b.controller.handleAction('report-open');assert.deepEqual(failed.report!.utterances.map(u=>u.line),[4]);
 await choose(b.controller,'no-sound');await settle();assert.equal(b.sent[0].report.audio!.line,4);assert.equal(b.sent[0].report.audio!.playback,'none');assert.equal(b.sent[0].report.audio!.recordingFailed,true);
});
