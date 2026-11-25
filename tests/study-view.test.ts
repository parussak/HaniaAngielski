import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {AppState} from '../src/app/state.ts';
import {emptyProgress,type Progress,type Session} from '../src/learning/model.ts';
import {makeSession,recordAnswer} from '../src/learning/session.ts';
import {questionFor} from '../src/learning/questions.ts';
import {makeLessonSession} from '../src/learning/lesson-session.ts';
import {validateJourney} from '../src/learning/journey-validation.ts';
import {varyLesson} from '../src/learning/lesson-variety.ts';
import {studyView} from '../src/views/study.ts';
import {engineModule,engineModules} from './fixtures/engine.ts';
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
test('polecenie z dwoma krokami jest osobno od zdania z luką',()=>{
 const modules=structuredClone(engineModules),module=modules[0];
 const progress=emptyProgress(),session=makeSession(modules,module,'grammar','text',false,progress);
 const task=module.exercises.find(q=>q.id===session.items[0].id)!;
 task.prompt='Przeczytaj zdanie.\nWpisz brakujące słowo.\n\nI ___ apples & pears.';
 const html=studyView(stateFor(modules,session));
 assert.match(html, />Przeczytaj zdanie\.\nWpisz brakujące słowo\.<\/p>\s*<h2[^>]*>I ___ apples &amp; pears\.<\/h2>/);
 assert.match(html, /id="answer-form"/);
});
test('wpisywanie brakującego słowa używa wspólnego układu dla starszych poleceń z różnych modułów',()=>{
 for(const [moduleId,instruction,sentence] of [
  ['first-unit','Wpisz nazwę opakowania (butelka):','a ___ of water.'],
  ['second-unit','Uzupełnij krótką odpowiedź:','Is there any milk? Yes, there ___.'],
 ]){
  const module=engineModule(moduleId),modules=[module];
  const progress=emptyProgress(),session=makeSession(modules,module,'grammar','text',false,progress);
  const item=session.items[0],task=module.exercises.find(q=>q.id===item.id)!;
  task.prompt=`${instruction} ${sentence}`;
  const html=studyView(stateFor(modules,session));
  assert.ok(html.includes(`<p class="exercise-instruction">${instruction}</p><h2 class="question">${sentence}</h2>`));
  assert.match(html, /id="answer-hint"[\s\S]*id="answer-form"/);
  item.input='choice';
  assert.ok(studyView(stateFor(modules,session)).includes(`<h2 class="question">${task.prompt}</h2>`));
 }
});
test('niejednoznaczne polecenie i luka bez zdania zachowują pełny tekst',()=>{
 const module=engineModule(),modules=[module];
 const progress=emptyProgress(),session=makeSession(modules,module,'grammar','text',false,progress);
 const task=module.exercises.find(q=>q.id===session.items[0].id)!;
 for(const prompt of ['Przeczytaj notatkę: „Milk and bread”. Wpisz składnik: I need ___.','Wpisz nazwę składnika: ___.']){
  task.prompt=prompt;
  const html=studyView(stateFor(modules,session));
  assert.ok(html.includes(`<h2 class="question">${prompt}</h2>`));
  assert.match(html, /id="answer-form"/);
 }
});
test('wspólny wybór oddziela polecenie od pytania i pokazuje przyciski zamiast pola tekstowego',()=>{
 for(const [moduleId,instruction,sentence] of [
  ['choice-first','Wybierz:','Where is the library?'],
  ['choice-second','Uzupełnij:','My sister is in the ___.'],
 ]){
  const module=engineModule(moduleId),modules=[module];
  const progress=emptyProgress(),session=makeSession(modules,module,'grammar','choice',false,progress);
  const task=module.exercises.find(q=>q.id===session.items[0].id)!;
  task.prompt=`${instruction} ${sentence}`;
  const html=studyView(stateFor(modules,session));
  assert.ok(html.includes(`<p class="exercise-instruction">${instruction}</p><h2 class="question">${sentence}</h2>`));
  assert.match(html, /class="answer-options"[\s\S]*data-action="answer"/);
  assert.doesNotMatch(html, /id="answer-form"/);
 }
});
test('bank słów pokazuje instrukcje nad jednym zdaniem także po uzupełnieniu luki',()=>{
 const modules=structuredClone(engineModules),module=modules[0];
 const progress=emptyProgress(),session=makeSession(modules,module,'grammar','choice',false,progress);
 const item=session.items[0],task=module.exercises.find(q=>q.id===item.id)!;
 item.presentation='bank';
 for(const separator of [' ','\n\n']){
  task.prompt=`Wybierz:${separator}I am hungry. I eat ___.`;
  for(const boardSummary of [false,true]){
   session.boardSummary=boardSummary;
   const html=studyView(stateFor(modules,session));
   assert.match(html, /Wybierz słowo z banku i dotknij luki\.<\/p>[\s\S]*class="gap-sentences"[\s\S]*class="bank-options"[\s\S]*<details[^>]*><summary>Jak przenieść lub odłożyć słowo\?/);
   assert.doesNotMatch(html, />Wybierz:<\/p>|class="board-required"/);
   assert.match(html, /I am hungry\.[\s\S]*<br>I eat [\s\S]*<\/button>\.<\/span>/);
   assert.equal(html.split('I am hungry.').length-1,2); // Treść zdania i etykieta luki.
   assert.doesNotMatch(html, /class="question"/);
  }
 }
 task.prompt='Wybierz nazwę owocu.\n\nI eat ___.';
 assert.match(studyView(stateFor(modules,session)), />Wybierz nazwę owocu\.<\/p>/);
});
test('wzorzec obejmuje widoki sesji, informacji zwrotnej, sceny i czytanki',()=>{
 const html=cases();
 assert.match(html['sesja bez modułu'],/Potrzebny jest moduł/);
 assert.match(html['quiz informacja błędna'],/Spokojnie/);
 assert.match(html['quiz informacja poprawna'],/Tak jest/);
 assert.ok(Object.values(html).some(v=>v.includes('class="dialogue')||v.includes('scene')));
 assert.ok(Object.values(html).some(v=>v.includes('reading')));
});
