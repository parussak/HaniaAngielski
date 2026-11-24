import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {AppState} from '../src/app/state.ts';
import {emptyProgress,makeSession,questionFor,recordAnswer,type Progress,type Session} from '../src/core.ts';
import {makeLessonSession} from '../src/learning/lesson-session.ts';
import {validateJourney} from '../src/learning/journey-validation.ts';
import {varyLesson} from '../src/learning/lesson-variety.ts';
import {studyView} from '../src/views/study.ts';
import {engineModules} from './fixtures/engine.ts';
import {sceneJourney,sceneModule} from './fixtures/scenes.ts';
import {readingJourney,readingModule} from './fixtures/readings.ts';

Object.defineProperty(globalThis,'document',{configurable:true,value:{baseURI:'https://example.test/app/'}});
// Test utrwalający: HTML ekranu nauki ma się nie zmienić przy podziale `views/study.ts`.
// Odświeżenie wzorca (tylko świadomie): UPDATE_STUDY_VIEW=1 node --test tests/study-view.test.ts
const file=new URL('./fixtures/study-view-snapshots.json',import.meta.url);
function stateFor(modules:ReturnType<typeof sceneModule>[],active:Session|null,edit:(s:AppState)=>void=()=>{}){
 const state=new AppState();state.modules=modules;state.progress=emptyProgress();state.progress.active=active;edit(state);return state;
}
function lesson(m:ReturnType<typeof sceneModule>,journey:ReturnType<typeof sceneJourney>,index:number){
 const modules=[m],j=validateJourney(journey,m),l=j.stages[0].lessons[index],p:Progress=emptyProgress();
 return {modules,session:varyLesson(makeLessonSession(modules,j,l,'mixed',p),modules,[j],j,l,p),journey:j};
}
// Sesje losują kolejność; wzorzec wymaga powtarzalnego losowania.
function seeded<T>(run:()=>T):T{
 const original=Math.random,uuid=Object.getOwnPropertyDescriptor(crypto,'randomUUID')??Object.getOwnPropertyDescriptor(Object.getPrototypeOf(crypto),'randomUUID');let seed=12345,counter=0;
 Object.defineProperty(crypto,'randomUUID',{configurable:true,value:()=>`00000000-0000-4000-8000-${String(++counter).padStart(12,'0')}`});
 Math.random=()=>{seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296;};
 try{return run();}finally{Math.random=original;delete (crypto as {randomUUID?:unknown}).randomUUID;if(uuid&&!('randomUUID' in crypto))Object.defineProperty(crypto,'randomUUID',uuid);}
}
function cases(){return seeded(build);}
function build(){
 const out:Record<string,string>={};
 const render=(name:string,state:AppState)=>{out[name]=studyView(state);};
 render('brak sesji',stateFor(engineModules,null));
 const make=(mode:'flashcards'|'quiz',answerMode:'text'|'choice')=>{const p=emptyProgress();return makeSession(engineModules,engineModules[0],mode,answerMode,false,p);};
 const text=make('flashcards','text');
 render('sesja bez modułu',stateFor([],text));
 render('fiszka wpisywana',stateFor(engineModules,text));
 render('fiszka z błędem zapisu',stateFor(engineModules,text,s=>{s.storageError='błąd';}));
 const choice=make('quiz','choice');
 render('quiz z wyborem',stateFor(engineModules,choice));
 for(const [label,answer] of [['błędna','zły'],['poprawna',null]] as const){
  const s=structuredClone(choice),p=emptyProgress();p.active=s;
  const q=questionFor(engineModules,s.items[0]);recordAnswer(p,q,answer??q.answers[0]);
  render(`quiz informacja ${label}`,stateFor(engineModules,p.active));
 }
 const retry=structuredClone(choice);retry.phase='retry';
 render('quiz ponowna próba',stateFor(engineModules,retry));
 const gr=make('quiz','text');gr.index=gr.items.findIndex(i=>questionFor(engineModules,i).kind==='grammar');
 if(gr.index>=0)render('gramatyka',stateFor(engineModules,gr));
 const sceneM=sceneModule(),scene=lesson(sceneM,sceneJourney(),1);
 const readM=readingModule(),reading=lesson(readM,readingJourney(),1);
 for(const [name,part] of [['scena',scene],['czytanka',reading]] as const){
  const n=part.session.items.length;
  for(let i=0;i<n;i++){
   const s=structuredClone(part.session);s.index=i;
   render(`${name} ${i}`,stateFor(part.modules,s));
   const p=emptyProgress();p.active=structuredClone(s);
   recordAnswer(p,questionFor(part.modules,s.items[i]),'zły');
   render(`${name} ${i} po złej odpowiedzi`,stateFor(part.modules,p.active));
  }
 }
 // Tablice: pary, bank słów, podsumowanie planszy i błąd planszy — ustawione ręcznie, bez losowania lekcji.
 const words=lesson(sceneM,sceneJourney(),0).session;
 const pairs=structuredClone(words);pairs.items.slice(0,3).forEach(i=>{i.pairGroup=pairs.items[0].key;i.input='choice';});
 render('pary',stateFor([sceneM],pairs));
 render('pary z błędem',stateFor([sceneM],pairs,s=>{s.boardError={key:pairs.items[0].key,answer:'x'};}));
 const bank=structuredClone(scene.session);const gap=bank.items.findIndex(i=>questionFor([sceneM],i).prompt.includes('___')||questionFor([sceneM],i).dialogue);
 if(gap>=0){bank.index=gap;bank.items[gap].input='choice';bank.items[gap].presentation='bank';render('bank luk',stateFor([sceneM],bank));
  const summary=structuredClone(bank);summary.boardSummary=true;render('podsumowanie banku',stateFor([sceneM],summary));}
 const wordSummary=structuredClone(pairs);wordSummary.boardSummary=true;render('podsumowanie par',stateFor([sceneM],wordSummary));
 return out;
}
test('HTML ekranu nauki zgadza się ze wzorcem',()=>{
 const html=cases();
 if(process.env.UPDATE_STUDY_VIEW==='1'||!existsSync(file)){writeFileSync(file,JSON.stringify(html,null,1));}
 const expected=JSON.parse(readFileSync(file,'utf8')) as Record<string,string>;
 assert.deepEqual(Object.keys(html),Object.keys(expected));
 for(const name of Object.keys(expected))assert.equal(html[name],expected[name],name);
});
test('wzorzec obejmuje widoki sesji, informacji zwrotnej, sceny i czytanki',()=>{
 const html=cases();
 assert.match(html['sesja bez modułu'],/Potrzebny jest moduł/);
 assert.match(html['quiz informacja błędna'],/Spokojnie/);
 assert.match(html['quiz informacja poprawna'],/Tak jest/);
 assert.ok(Object.values(html).some(v=>v.includes('class="dialogue')||v.includes('scene')));
 assert.ok(Object.values(html).some(v=>v.includes('reading')));
});
