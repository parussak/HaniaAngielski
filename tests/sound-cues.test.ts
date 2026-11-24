import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {engineModule} from './fixtures/engine.ts';
import {courseFixture} from './fixtures/course-materials.ts';
import {emptyProgress,type Progress} from '../src/learning/model.ts';
import {lessonKey,type Journey} from '../src/learning/journey.ts';
import {makeLessonSession} from '../src/learning/lesson-session.ts';
import {varyLesson} from '../src/learning/lesson-variety.ts';
import {questionFor} from '../src/learning/questions.ts';
import {boardItems} from '../src/learning/boards.ts';
import {finishCue,answerCue,cueFiles,type SoundCue} from '../src/learning/sound-cues.ts';
import {createCuePlayer} from '../src/sounds.ts';
import {createSessionAnswerController,type AnswerState} from '../src/controllers/session-answers.ts';

const course=courseFixture().courses[0],m=engineModule('cue-unit',course.id);
const journey:Journey={version:1,moduleId:m.id,title:'Mapa',stages:[{id:'stage',title:'Etap',cat:'albert',illustration:'illustrations/test.svg',lessons:[
 {id:'words',title:'Słowa',intro:'',wordIds:m.words.slice(0,5).map(w=>w.id),exerciseIds:[],ruleIds:[]},
 {id:'gaps',title:'Luki',intro:'',wordIds:[],exerciseIds:m.exercises.filter(q=>q.kind==='grammar').slice(0,6).map(q=>q.id),ruleIds:[]}]}]};
const element=(payload:Record<string,string|number|boolean>={})=>payload as never;
const lessons=journey.stages[0].lessons;

function setup(lessonIndex=0,done:string[]=[],failSave=false){
 const progress=emptyProgress(),lesson=lessons[lessonIndex];
 for(const id of done){
  progress.adventure??={completed:{},stageReviews:{}} as never;
  progress.adventure!.completed[lessonKey(journey,lessons.find(l=>l.id===id)!)]={at:'2026-01-01T00:00:00.000Z'};
 }
 progress.active=varyLesson(makeLessonSession([m],journey,lesson,'text',progress),[m],[journey],journey,lesson,progress);
 const state:AnswerState={progress,modules:[m],journeys:[journey],journeyIssues:[],screen:'study',lastReward:0,lastStageReward:0,lastSession:null};
 const cues:SoundCue[]=[];
 const mutate=async(change:(p:Progress)=>void)=>{if(failSave)throw new Error('Zapis się nie udał.');const draft=structuredClone(state.progress);change(draft);state.progress=draft;};
 const controller=createSessionAnswerController(state,{mutate,courseId:()=>course.id,playCue:cue=>{cues.push(cue);}});
 const current=()=>state.progress.active!.items[state.progress.active!.index];
 const correct=()=>questionFor([m],current()).answers[0];
 const finishLesson=async()=>{
  for(let guard=0;state.progress.active&&guard<200;guard++){
   for(let i=0;state.progress.active.phase==='question'&&i<100;i++)await controller.handleAction(current().pairGroup?'pair-answer':'answer',element({answer:correct()}));
   await controller.handleAction('next',element());
  }
 };
 return {state,controller,cues,current,correct,finishLesson};
}

test('poprawna odpowiedź gra raz, błędna nie gra wcale',async()=>{
 const f=setup(0);
 await f.controller.handleAction('answer',element({answer:'zdecydowanie-źle'}));
 assert.deepEqual(f.cues,[]);
 await f.controller.handleAction('retry',element({key:f.current().key}));
 await f.controller.handleAction('answer',element({answer:f.correct()}));
 assert.deepEqual(f.cues,['correct'],'poprawka też jest poprawną odpowiedzią');
 const g=setup(0);
 await g.controller.handleAction('answer',element({answer:g.correct()}));
 assert.deepEqual(g.cues,['correct']);
});

test('pusta odpowiedź nie gra',async()=>{
 const f=setup(0);
 await f.controller.handleAction('answer',element({answer:'  '}));
 assert.deepEqual(f.cues,[]);
});

test('luki na planszy: dobre miejsce gra, złe nie',async()=>{
 const f=setup(1),group=boardItems(f.state.progress.active!);
 await f.controller.handleAction('gap-place',element({key:group[0].key,answer:questionFor([m],group[1]).answers[0]}));
 assert.deepEqual(f.cues,[]);
 await f.controller.handleAction('gap-place',element({key:group[0].key,answer:questionFor([m],group[0]).answers[0]}));
 assert.deepEqual(f.cues,['correct']);
});

test('nieudany zapis nie gra nic i nie ukrywa błędu',async()=>{
 const f=setup(0,[],true);
 await assert.rejects(f.controller.handleAction('answer',element({answer:f.correct()})),/Zapis/);
 assert.deepEqual(f.cues,[]);
});

test('nieudany zapis przy przejściu do podsumowania nie gra sygnału ukończenia',async()=>{
 const f=setup(0);
 await f.finishLesson();
 assert.equal(f.cues.at(-1),'lesson');
 const g=setup(0);
 const real=g.controller;
 // Ostatnie zadanie: odpowiedź zapisana, ale zapis „Dalej” kończy się błędem.
 for(let guard=0;g.state.progress.active&&guard<200;guard++){
  for(let i=0;g.state.progress.active.phase==='question'&&i<100;i++)await real.handleAction(g.current().pairGroup?'pair-answer':'answer',element({answer:g.correct()}));
  if(g.state.progress.active.index===g.state.progress.active.items.length-1)break;
  await real.handleAction('next',element());
 }
 assert.ok(g.state.progress.active,'ostatnie zadanie czeka na „Dalej”');
 const before=g.cues.length;
 const failing=createSessionAnswerController(g.state,{mutate:async()=>{throw new Error('Zapis się nie udał.');},courseId:()=>course.id,playCue:cue=>{g.cues.push(cue);}});
 await assert.rejects(failing.handleAction('next',element()),/Zapis/);
 assert.equal(g.cues.length,before);
});

test('pierwsze ukończenie lekcji, która nie domyka mapy, gra sygnał lekcji',async()=>{
 const f=setup(0);
 await f.finishLesson();
 assert.equal(f.state.screen,'summary');
 assert.equal(f.cues.at(-1),'lesson');
 assert.equal(f.cues.filter(c=>c==='lesson').length,1);
 assert.equal(f.cues.includes('map'),false);
});

test('lekcja domykająca mapę gra tylko sygnał mapy',async()=>{
 const f=setup(0,['gaps']);
 await f.finishLesson();
 assert.equal(f.cues.at(-1),'map');
 assert.equal(f.cues.filter(c=>c==='map').length,1);
 assert.equal(f.cues.includes('lesson'),false);
});

test('powtórka lekcji na już ukończonej mapie gra sygnał lekcji, nie mapy',async()=>{
 const f=setup(0,['words','gaps']);
 await f.finishLesson();
 assert.equal(f.cues.at(-1),'lesson');
 assert.equal(f.cues.includes('map'),false);
});

test('„Dalej” w środku sesji nie gra sygnału ukończenia',async()=>{
 const f=setup(0);
 await f.controller.handleAction('answer',element({answer:f.correct()}));
 f.cues.length=0;
 await f.controller.handleAction('next',element());
 assert.deepEqual(f.cues,[]);
});

test('finishCue: sesja bez lekcji i nieukończona lekcja nie dają sygnału',()=>{
 const before=emptyProgress(),after=structuredClone(before);
 const s=makeLessonSession([m],journey,lessons[0],'text',before);
 assert.equal(finishCue([journey],before,after,{...s,lesson:undefined,completedAt:'2026-01-01T00:00:00.000Z'}),undefined);
 assert.equal(finishCue([journey],before,after,{...s,completedAt:null}),undefined);
 assert.equal(finishCue([journey],before,after,{...s,completedAt:'2026-01-01T00:00:00.000Z',attempts:[]}),undefined);
});

test('answerCue: tylko jawne true',()=>{
 assert.equal(answerCue(true),'correct');
 assert.equal(answerCue(false),undefined);
 assert.equal(answerCue(undefined),undefined);
});

test('odtwarzacz: cicha głośność, wyjątki i odrzucone odtwarzanie nie wychodzą na zewnątrz',async()=>{
 const played:{url:string;volume:number}[]=[];
 const player=createCuePlayer({url:file=>`https://x/${file}`,createAudio:url=>{const a={url,volume:1,play:()=>{played.push({url,volume:a.volume});return Promise.resolve();}};return a;}});
 player.play('correct');player.play('lesson');player.play('map');
 assert.deepEqual(played.map(p=>p.url),[`https://x/${cueFiles.correct}`,`https://x/${cueFiles.lesson}`,`https://x/${cueFiles.map}`]);
 assert.ok(played.every(p=>p.volume>0&&p.volume<=0.4),'łagodna głośność');
 const rejecting=createCuePlayer({url:f=>f,createAudio:()=>({volume:1,play:()=>Promise.reject(new DOMException('blokada','NotAllowedError'))})});
 assert.doesNotThrow(()=>rejecting.play('correct'));await new Promise(r=>setTimeout(r,0));
 const throwing=createCuePlayer({url:f=>f,createAudio:()=>{throw new Error('brak Audio');}});
 assert.doesNotThrow(()=>throwing.play('map'));
 const syncThrow=createCuePlayer({url:f=>f,createAudio:()=>({volume:1,play:()=>{throw new Error('x');}})});
 assert.doesNotThrow(()=>syncThrow.play('lesson'));
});

test('trzy pliki dźwięków są w public/sounds razem z opisem źródła i licencji',()=>{
 for(const file of Object.values(cueFiles))assert.ok(existsSync(new URL(`../public/${file}`,import.meta.url)),`brak public/${file}`);
 const notice=readFileSync(new URL('../public/sounds/ZRODLO.md',import.meta.url),'utf8');
 assert.match(notice,/Kenney/);assert.match(notice,/CC0/);
});
