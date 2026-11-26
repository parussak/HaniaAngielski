import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyProgress,type Progress} from '../src/learning/model.ts';
import {makeSession,next,recordAnswer} from '../src/learning/session.ts';
import {questionFor} from '../src/learning/questions.ts';
import {answerOnBoard} from '../src/learning/boards.ts';
import {retryAnswer} from '../src/learning/retry.ts';
import {completedTasks} from '../src/learning/task-progress.ts';
import {createTaskPreviewController,type TaskPreviewState} from '../src/controllers/task-preview.ts';
import {AppState} from '../src/app/state.ts';
import {taskScreenView} from '../src/views/task-screen.ts';
import {speaker} from '../src/speech.ts';
import {engineModule} from './fixtures/engine.ts';
import {sceneModule} from './fixtures/scenes.ts';

Object.defineProperty(globalThis,'document',{configurable:true,value:{baseURI:'https://example.test/app/'}});
const module=engineModule(),modules=[module];
/** Sesja z samych luk jednej sceny, w kolejności rozmowy. */
function sceneSession(){
 const scene=sceneModule(),p=emptyProgress(),s=makeSession([scene],scene,'dialogue','mixed',false,p);
 const group=s.items.find(i=>i.sceneGroup)!.sceneGroup;
 s.items=s.items.filter(i=>i.sceneGroup===group);p.active=s;
 return {scene,p,s};
}
function start(){
 const p=emptyProgress();p.active=makeSession(modules,module,'flashcards','text',false,p);return p;
}
function answer(p:Progress,correct=true){
 const q=questionFor(modules,p.active!.items[p.active!.index]);recordAnswer(p,q,correct?q.answers[0]:'zle');
}
const done=(p:Progress)=>[...completedTasks(p.active!)].sort((a,b)=>a-b);

test('zadanie jest ukończone dopiero po przejściu dalej, także z błędną odpowiedzią',()=>{
 const p=start();assert.deepEqual(done(p),[]);
 answer(p);assert.deepEqual(done(p),[],'informacja zwrotna jeszcze na ekranie');
 next(p);assert.deepEqual(done(p),[0]);
 answer(p,false);retryAnswer(p);assert.deepEqual(done(p),[0],'poprawka trwa');
 answer(p);next(p);assert.deepEqual(done(p),[0,1]);
 answer(p,false);next(p);assert.deepEqual(done(p),[0,1,2]);
});

test('plansza par: błędna para na otwartej planszy nie jest ukończona, dobrana jest',()=>{
 const p=start(),s=p.active!;
 s.items=s.items.slice(0,3);for(const item of s.items)item.pairGroup=s.items[0].key;
 const [first,second]=s.items.map(item=>item.key),right=(key:string)=>questionFor(modules,s.items.find(i=>i.key===key)!).answers[0];
 answerOnBoard(p,modules,[],first,'zle');
 assert.deepEqual(done(p),[]);
 answerOnBoard(p,modules,[],second,right(second));
 assert.deepEqual(done(p).map(i=>s.items[i].key),[second]);
});

test('poprawka wcześniejszej linijki sceny nie odbiera ✓ już rozwiązanym lukom',()=>{
 const {scene,p,s}=sceneSession(),size=s.items.length;
 for(let i=0;i<size;i++){const q=questionFor([scene],s.items[i]);s.index=i;s.phase='question';recordAnswer(p,q,i===0?'zle':q.answers[0]);}
 s.boardSummary=true;
 assert.equal(retryAnswer(p,s.items[0].key),true);
 const completed=completedTasks(s);
 assert.equal(completed.has(0),false);
 for(let i=1;i<size;i++)assert.equal(completed.has(i),true,`luka ${i}`);
});

test('kontroler otwiera tylko ukończone zadania i nie zmienia sesji ani postępów',()=>{
 const p=start();answer(p);next(p);answer(p,false);next(p);
 const state:TaskPreviewState={progress:p},controller=createTaskPreviewController(state),before=structuredClone(p);
 for(const task of [2,3,99,-1,Number.NaN]){controller.handleAction('task-preview',{task});assert.equal(state.taskPreview,undefined,`zadanie ${task}`);}
 controller.handleAction('task-preview',{task:1});
 assert.deepEqual(state.taskPreview,{sessionId:p.active!.id,position:1});
 controller.handleAction('task-preview-close');
 assert.equal(state.taskPreview,undefined);
 assert.deepEqual(p,before);
});

function screen(p:Progress,position?:number,mods=modules){
 const state=new AppState();state.modules=mods;state.progress=p;
 if(position!==undefined)state.taskPreview={sessionId:p.active!.id,position};
 return taskScreenView(state);
}

test('podgląd ze starego zapisu bez ostatniej odpowiedzi mówi o tym i nie zgaduje',()=>{
 const p=start();answer(p,false);retryAnswer(p);answer(p,false);next(p);
 delete p.active!.attempts[0].lastAnswer;
 assert.match(screen(p,0),/nie jest dostępna w tym starszym zapisie/);
});

test('podgląd innej sesji jest ignorowany',()=>{
 const p=start();answer(p);next(p);
 const state=new AppState();state.modules=modules;state.progress=p;state.taskPreview={sessionId:'inna',position:0};
 assert.doesNotMatch(taskScreenView(state),/class="task-preview"/);
});

test('podgląd zadania ze słuchu pozwala odtworzyć nagranie, ale nie włącza go sam',()=>{
 const spoken=structuredClone(module);spoken.languageCode='en';
 const p=emptyProgress();p.active=makeSession([spoken],spoken,'flashcards','text',false,p);
 p.active.items[0].listen=true;answer(p);next(p);
 const device=speaker(),available=device.available;
 try{
  device.available=()=>true;
  const html=screen(p,0,[spoken]).split('class="task-preview"')[1];
  assert.match(html,/Posłuchaj jeszcze raz/);assert.match(html,/Wolniej/);
  assert.doesNotMatch(html,/data-autoplay/);
 }finally{device.available=available;}
});

test('podgląd luki sceny nie zdradza odpowiedzi na nieukończone luki',()=>{
 const {scene,p,s}=sceneSession(),q=questionFor([scene],s.items[0]);recordAnswer(p,q,q.answers[0]);s.index=1;s.phase='question';
 const html=screen(p,0,[scene]).split('class="task-preview"')[1].split('class="feedback')[0];
 for(const item of s.items.slice(1)){
  const hidden=questionFor([scene],item).answers[0];
  assert.doesNotMatch(html,new RegExp(`>[^<]*\\b${hidden}\\b`),hidden);
 }
});
