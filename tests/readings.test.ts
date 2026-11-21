// D-68: czytanki. Wszystkie dane są syntetyczne: mechanika nie zna kursu ani modułu.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readingEntry,readingModule,readingJourney,readingQuestionIds} from './fixtures/readings.ts';
import {advanceReading,knownReadings,makeReadingSession,readingContext,readingView,translateInReading} from '../src/learning/readings.ts';
import {compileReading,readingTokens} from '../src/learning/reading-format.ts';
import {assembleModule,validateModules} from '../src/content-validation.ts';
import {backup,emptyProgress,makeSession,next,questionFor,recordAnswer,validateBackup,type Progress,type Session} from '../src/core.ts';
import {makeLessonSession,validateJourney,rewardCompletion} from '../src/adventure.ts';
import {varyLesson} from '../src/learning/lesson-variety.ts';
import {rememberError} from '../src/learning/retention.ts';
import {retryAnswer} from '../src/learning/retry.ts';
import {readLibrary} from '../src/materials/library.ts';

const m=readingModule(),modules=[m],j=validateJourney(readingJourney(),m),lesson=j.stages[0].lessons[1];
const ids=readingQuestionIds();
const started=(p=emptyProgress())=>varyLesson(makeLessonSession(modules,j,lesson,'mixed',p),modules,[j],j,lesson,p);
/** Answers the current question the way the app does; a reading question keeps its feedback until „Dalej”. */
function answer(p:Progress,value:string){const s=p.active!,item=s.items[s.index],ok=recordAnswer(p,questionFor(modules,item),value);if(ok===false)rememberError(p,item);return ok;}
const right=(p:Progress)=>answer(p,questionFor(modules,p.active!.items[p.active!.index]).answers[0]);
/** Presses „Dalej” as the reading controller does: optional move to the next question, then one more sentence. */
function dalej(p:Progress,shown:number|undefined){const v=readingView(modules,p.active!,shown)!;if(!v.next||v.next==='finish')return v.visible;if(v.next.advance)advanceReading(p,modules);return v.next.shown;}

test('format: czytanka staje się zwykłymi zadaniami wyboru, po jednym na pytanie, ze stałymi identyfikatorami',()=>{
 const {reading,exercises}=compileReading(readingEntry());
 assert.deepEqual(exercises.map(q=>q.id),ids);assert.deepEqual(reading.questionIds,ids);
 assert.ok(exercises.every(q=>q.kind==='reading'&&q.responseType==='choice'&&q.source&&q.requires.includes('reading-unit')));
 const tap=exercises[1];assert.equal(tap.reading!.type,'tap');assert.equal(tap.reading!.sentence,'s2');
 // A tap question chooses among the words of its sentence; exactly one of them is right.
 assert.deepEqual(tap.options,readingTokens('Olek has got some apples.'));assert.deepEqual(tap.options,['Olek','has','got','some','apples']);
 assert.deepEqual(exercises[0].reading!.refs,['s1']);assert.deepEqual(tap.reading!.refs,['s2']);
 assert.deepEqual(exercises[0].reading!.glossary,{where:'gdzie','are they sitting':'oni siedzą'});
 assert.equal(m.readings!.length,1);assert.equal(m.exercises.filter(q=>q.reading).length,3);
});

test('format: check:content odrzuca błędną czytankę z czytelnym komunikatem',()=>{
 const broken=(edit:(r:any)=>void)=>{const r:any=readingEntry();edit(r);return ()=>readingModule('reading-unit','reading-course',[r]);};
 assert.throws(broken(r=>delete r.source),/source/);
 assert.throws(broken(r=>delete r.sentences[1].translation),/tłumaczenie/);
 assert.throws(broken(r=>r.sentences=r.sentences.slice(0,1)),/zdań/);
 assert.throws(broken(r=>r.sentences[2].id='s1'),/powtórzony/);
 assert.throws(broken(r=>r.questions[0].after='s9'),/after/);
 assert.throws(broken(r=>r.questions[1].answers=['pears']),/słowo/);
 assert.throws(broken(r=>r.questions[1].sentence='s3'),/sentence/);
 assert.throws(broken(r=>r.questions[0].options=['In the garden','In the garden ']),/wariant|jeden/);
 assert.throws(broken(r=>r.questions=[]),/pyta/);
 assert.throws(broken(r=>r.questions=Array.from({length:7},(_,i)=>({...r.questions[0],id:`q${i}`}))),/pyta/);
 assert.throws(broken(r=>r.questions[2].id='where'),/powtórzony/);
 assert.throws(broken(r=>[r.questions[0],r.questions[2]]=[r.questions[2],r.questions[0]]),/kolejno/);
 assert.throws(broken(r=>r.questions[0].refs=['s4']),/refs/);
 assert.throws(broken(r=>r.questionLanguage='polski'),/język/);
 assert.throws(broken(r=>r.glossary={garden:''}),/glossary/);
 assert.throws(broken(r=>r.questions[0].glossary={here:'tutaj'}),/glossary/);
 assert.throws(broken(r=>r.questions[0].glossary={'Where are they sitting':'Gdzie oni siedzą?'}),/glossary/);
 assert.throws(broken(r=>delete r.questions[0].explanation),/zadanie|wyjaśn/);
 // Questions always use the reading text's language, including when explanations are in Polish.
 const meta={languageCode:'en',explanationLanguageCode:'pl'};
 assert.equal(compileReading(readingEntry(),meta).reading.questionLanguage,'en');
 assert.throws(()=>compileReading({...readingEntry(),questionLanguage:'pl'},meta),/język pytań.*językiem tekstu/);
 assert.throws(()=>compileReading({...readingEntry(),questionLanguage:'de'},meta),/język/);
});

test('format: moduł wskazuje czytanki.json w modul.json; inna nazwa pliku jest odrzucana',async()=>{
 const base=readingModule();
 const files=(readingsFile?:string):Record<string,unknown>=>({'katalog.json':{version:1,modules:['01-unit']},
  '01-unit/modul.json':{id:base.id,version:1,order:1,name:'Moduł',subtitle:'Test',language:'Angielski',source:'Dane syntetyczne',label:'TEST',cover:'Test',topics:['Test'],...(readingsFile?{readingsFile}:{})},
  '01-unit/slownictwo.json':base.words.map(({id,front,back,source,answers})=>({id,front,back,source,...(answers?{answers}:{})})),'01-unit/quiz.json':[],
  '01-unit/cwiczenia.json':base.exercises.filter(q=>q.kind==='grammar'),'01-unit/gramatyka.json':[],'01-unit/czytanki.json':[readingEntry('picnic',base.id)]});
 const read=(set:Record<string,unknown>)=>async(path:string)=>{if(!(path in set))throw new Error(`brak ${path}`);return structuredClone(set[path]);};
 const library=await readLibrary(read(files('czytanki.json')));
 assert.deepEqual(library.modules[0].readings!.map(r=>r.id),['picnic']);
 assert.deepEqual(library.modules[0].exercises.filter(q=>q.kind==='reading').map(q=>q.id),ids);
 assert.equal((await readLibrary(read(files()))).modules[0].readings,undefined);
 const wrongLanguage=files('czytanki.json');
 wrongLanguage['01-unit/czytanki.json']=[{...readingEntry('picnic',base.id),questionLanguage:'pl'}];
 await assert.rejects(readLibrary(read(wrongLanguage)),/język pytań.*językiem tekstu/);
 await assert.rejects(readLibrary(read(files('teksty.json'))),/czytanek/);
 // The reading list comes only from the module's own file, never from the metadata.
 const raw:any=files()['01-unit/modul.json'];
 assert.equal(assembleModule({...raw,readings:[{id:'x'}]},files()['01-unit/slownictwo.json'],[],[],[]).readings,undefined);
});

test('mapa: lekcja bierze całą czytankę albo nic; cała czytanka jest wyjątkiem od minimum sześciu zadań',()=>{
 assert.equal(lesson.exerciseIds.length,3);
 const change=(edit:(l:any)=>void)=>()=>{const raw:any=readingJourney();edit(raw.stages[0].lessons[1]);return validateJourney(raw,m);};
 assert.throws(change(l=>l.exerciseIds.pop()),/Niepoprawna mapa/);
 assert.throws(change(l=>{l.wordIds=['word-6','word-7','word-8'];l.exerciseIds=ids.slice(0,2);}),/Niepoprawna mapa/);
 assert.doesNotThrow(change(l=>{l.wordIds=['word-6','word-7','word-8'];}));
});

test('przebieg: zdania pojawiają się po „Dalej”, pytanie blokuje przejście do odpowiedzi',()=>{
 const p=emptyProgress();p.active=started(p);const s=p.active;
 assert.deepEqual(s.items.map(i=>i.id),ids);assert.ok(s.items.every(i=>i.sceneGroup===s.items[0].key&&i.input==='choice'&&!i.presentation&&!i.options));
 let v=readingView(modules,s)!;
 assert.equal(v.reading.id,'picnic');assert.equal(v.visible,1);assert.equal(v.newest,'s1');
 // The first question follows the first sentence, so it is already open and „Dalej” waits for an answer.
 assert.equal(v.questionOpen,true);assert.equal(v.next,null);
 assert.equal(answer(p,'In the kitchen'),false);v=readingView(modules,s)!;
 assert.equal(v.questionOpen,false);assert.deepEqual(v.next,{advance:true,shown:2});
 let shown=dalej(p,undefined);assert.equal(s.index,1);assert.equal(s.phase,'question');
 v=readingView(modules,s,shown)!;assert.equal(v.visible,2);assert.equal(v.newest,'s2');assert.equal(v.questionOpen,true);
 assert.equal(readingView(modules,s,99)!.visible,2,'nie da się przewinąć tekstu za otwarte pytanie');
 // Tap: the word itself is the answer.
 assert.equal(answer(p,'apples'),true);shown=dalej(p,shown);
 v=readingView(modules,s,shown)!;assert.equal(v.visible,3);assert.equal(v.questionOpen,true);
 assert.equal(right(p),true);v=readingView(modules,s,shown)!;assert.deepEqual(v.next,{advance:false,shown:4});
 shown=dalej(p,shown);v=readingView(modules,s,shown)!;assert.equal(v.visible,4);assert.equal(v.next,'finish');
 assert.deepEqual(v.questions.map(q=>q.status),['answered','answered','answered']);
 next(p);assert.equal(p.active,null);
 const done=p.sessions.at(-1)!;assert.deepEqual(done.attempts.map(a=>a.first),[false,true,true]);
 assert.ok(rewardCompletion(p,done,modules)>0);
});

test('poprawka: błędne pytanie można poprawić od razu albo z końca czytanki; pierwszy wynik zostaje',()=>{
 const p=emptyProgress();p.active=started(p);const s=p.active;
 answer(p,'In the kitchen');assert.equal(retryAnswer(p),true);assert.equal(s.phase,'retry');
 assert.equal(readingView(modules,s)!.questionOpen,true);assert.equal(right(p),true);
 let shown=dalej(p,undefined);answer(p,'some');shown=dalej(p,shown);right(p);shown=dalej(p,shown);
 const first=s.items[1];
 assert.equal(retryAnswer(p,first.key),true);assert.equal(s.index,1);assert.equal(s.phase,'retry');
 let v=readingView(modules,s,shown)!;assert.equal(v.visible,4,'poprawka z końca nie chowa tekstu');assert.equal(v.questionOpen,true);assert.equal(v.next,null);
 right(p);v=readingView(modules,s,shown)!;assert.deepEqual(v.next,{advance:true,shown:4});
 dalej(p,shown);assert.equal(s.index,2);assert.equal(readingView(modules,s,shown)!.next,'finish');
 const attempt=s.attempts.find(a=>a.key===first.key)!;assert.equal(attempt.first,false);assert.equal(attempt.answer,'some');assert.equal(attempt.corrected,true);
 assert.equal(s.attempts.length,3);
});

test('powtórka: błąd z czytanki wraca jako zwykłe zadanie wyboru razem ze swoimi zdaniami',()=>{
 const p=emptyProgress();p.active=started(p);
 answer(p,'At school');let shown=dalej(p,undefined);answer(p,'Olek');shown=dalej(p,shown);right(p);dalej(p,shown);next(p);
 const review=makeSession(modules,m,'review','text',false,p);
 const errors=review.items.filter(i=>ids.includes(i.id));
 assert.deepEqual(errors.map(i=>i.id).sort(),[ids[0],ids[1]].sort());
 assert.ok(errors.every(i=>!i.sceneGroup&&i.input==='choice'));
 assert.equal(readingView(modules,{...review,index:review.items.indexOf(errors[0])}),undefined);
 const where=errors.find(i=>i.id===ids[0])!,fruit=errors.find(i=>i.id===ids[1])!;
 assert.deepEqual(readingContext(modules,where)!.sentences.map(x=>x.id),['s1']);
 const tap=readingContext(modules,fruit)!;assert.deepEqual(tap.sentences.map(x=>x.id),['s2']);assert.equal(tap.tapSentence,'s2');
});

test('zapis: odświeżenie wraca do ostatniego pytania z odpowiedzią, bez nowych pól w kopii',()=>{
 const p=emptyProgress();p.active=started(p);
 right(p);let shown=dalej(p,undefined);answer(p,'apples');
 const restored=validateBackup(JSON.parse(JSON.stringify(backup(p)))).progress;
 assert.deepEqual(restored,p);assert.equal(backup(p).version,1);
 // Without the screen's own counter the text returns to the last answered question with its feedback.
 let v=readingView(modules,restored.active!)!;assert.equal(v.visible,2);assert.equal(v.position,1);assert.equal(restored.active!.phase,'feedback');
 shown=dalej(restored,undefined);dalej(restored,shown);
 // Moved on but not answered yet: refreshing shows the text up to the last answered question.
 v=readingView(modules,restored.active!)!;assert.equal(v.visible,2);assert.equal(v.questionOpen,false);assert.deepEqual(v.next,{advance:false,shown:3});
 // Only the fields that scenes already use; nothing new is saved for readings.
 const allowed=new Set(['key','moduleId','version','type','id','input','sceneGroup']);
 assert.ok(restored.active!.items.every(i=>Object.keys(i).every(k=>allowed.has(k))));
 const sessionKeys=new Set(Object.keys(restored.active!));
 for(const key of ['fixedLength','id','moduleId','mode','lesson','answerMode','previous','startedAt','completedAt','items','index','phase','lastCorrect','attempts','repeatKeys'])sessionKeys.delete(key);
 assert.deepEqual([...sessionKeys],[]);
 const old=JSON.parse(readFileSync(new URL('./fixtures/backup-v1.json',import.meta.url),'utf8'));
 assert.doesNotThrow(()=>validateBackup(structuredClone(old)));
 // A damaged group is still rejected by the shared scene-group check.
 const copy=backup(p);delete copy.progress.active!.items[1].sceneGroup;assert.throws(()=>validateBackup(copy));
});

test('zapis: zmieniona później czytanka nie psuje rozpoczętej sesji — pytania wracają jako zwykłe zadania',()=>{
 const p=emptyProgress();p.active=started(p);const s=p.active;
 const longer=readingEntry();longer.questions.push({id:'sun',after:'s4',type:'choice',prompt:'Is the sun warm or cold?',answers:['Warm'],options:['Warm','Cold'],refs:['s4'],explanation:'Warm to ciepłe.'} as any);
 const changed=readingModule('reading-unit','reading-course',[longer]);
 assert.equal(readingView([changed],s),undefined);assert.equal(questionFor([changed],s.items[0]).id,ids[0]);
});

test('tłumaczenie: słowo ze słownictwa modułu, potem z listy czytanki, a bez nich całe zdanie',()=>{
 const r=m.readings![0];
 assert.deepEqual(translateInReading(m,r,'s3','book'),{text:'książka',from:'vocabulary'});
 assert.deepEqual(translateInReading(m,r,'s1','garden.'),{text:'ogród',from:'glossary'});
 assert.deepEqual(translateInReading(m,r,'s2','APPLES'),{text:'jabłka',from:'glossary'});
 assert.deepEqual(translateInReading(m,r,'s4','sun'),{text:'Słońce jest ciepłe.',from:'sentence'});
 assert.deepEqual(translateInReading(m,r,'s4'),{text:'Słońce jest ciepłe.',from:'sentence'});
 assert.equal(translateInReading(m,r,'s9','sun'),undefined);
});

test('tryb „Czytanki”: tylko poznane czytanki, cała czytanka w jednej sesji',()=>{
 const p=emptyProgress();
 assert.deepEqual(knownReadings(modules,m,p),[]);assert.equal(makeReadingSession(modules,m,'picnic',p),null);
 p.active=started(p);right(p);
 assert.deepEqual(knownReadings(modules,m,p).map(r=>r.id),['picnic']);
 const s=makeReadingSession(modules,m,'picnic',p)!;
 assert.equal(s.mode,'reading');assert.equal(s.lesson,undefined);assert.deepEqual(s.items.map(i=>i.id),ids);
 assert.ok(readingView(modules,s));assert.equal(makeReadingSession(modules,m,'missing',p),null);
 const copy=emptyProgress();copy.active=s;assert.deepEqual(validateBackup(backup(copy)).progress.active,s);
 // Rozmówki and quizzes never pick reading questions.
 for(const mode of ['dialogue','quiz','grammar'] as const)assert.ok(makeSession(modules,m,mode,'choice',false,p).items.every(i=>!ids.includes(i.id)));
});

test('mechanika nie zna kursu: czytanka w innym module i kursie działa tak samo',()=>{
 const other=readingModule('lecture-3','cours-fr',[readingEntry('jardin','lecture-3')]),journey=validateJourney(readingJourney('lecture-3','jardin'),other),l=journey.stages[0].lessons[1];
 const p=emptyProgress(),s:Session=varyLesson(makeLessonSession([other],journey,l,'mixed',p),[other],[journey],journey,l,p);
 assert.deepEqual(s.items.map(i=>i.id),readingQuestionIds('jardin'));assert.equal(readingView([other],s)!.reading.title,'Czytanka jardin');
 assert.ok(validateModules([other]));
});

test('kontroler: tłumaczenie zostaje po „Dalej”, podgląd niczego nie zapisuje',async()=>{
 const {AppState}=await import('../src/app/state.ts');
 const {createLearningController}=await import('../src/controllers/learning.ts');
 const {courseFixture}=await import('./fixtures/course-materials.ts');
 const state=new AppState(),course={...courseFixture().courses[0],id:m.courseId!,moduleIds:[m.id]};
 state.modules=modules;state.selected=m;state.journeys=[j];state.courses=[course];state.selectedCourseId=course.id;
 state.progress.active=started(state.progress);
 let saves=0;
 const controller=createLearningController(state,{courses:{select:async()=>false,restore:async()=>{},followSession:async()=>{}} as any,scheduleReviewMigration:()=>{},
  mutate:async(change:(p:Progress)=>void)=>{const draft=structuredClone(state.progress);change(draft);state.progress=draft;saves++;}});
 const press=(action:string,data:Record<string,string>={})=>controller.handleAction(action,{dataset:data} as unknown as HTMLElement);
 const key=state.progress.active!.items[0].key;
 await press('reading-question-peek',{key,term:'are they sitting'});
 assert.deepEqual(state.readingQuestionPeek,{sessionId:state.progress.active!.id,key,term:'are they sitting'});
 await press('reading-question-peek',{key,term:'Where are they sitting?'});
 assert.equal(state.readingQuestionPeek?.term,'are they sitting');
 const peek={sessionId:state.progress.active!.id,sentence:'s1',word:'garden'};
 await press('reading-next');await press('reading-peek',{sentence:'s1',word:'garden'});await press('next');
 assert.equal(saves,0);assert.equal(state.readingShown,undefined);assert.deepEqual(state.readingPeek,peek);assert.equal(state.progress.active!.index,0);
 await press('answer',{answer:'In the garden'});assert.equal(saves,1);assert.equal(state.progress.active!.phase,'feedback','poprawna odpowiedź zostaje z wyjaśnieniem');
 await press('reading-peek',{sentence:'s3'});assert.deepEqual(state.readingPeek,peek,'zdanie jeszcze niewidoczne');
 assert.equal(saves,1);
 await press('next');assert.ok(state.progress.active,'„Zakończ” nie działa w środku czytanki');
 await press('reading-next');assert.equal(saves,2);assert.equal(state.progress.active!.index,1);assert.equal(state.readingShown!.count,2);assert.deepEqual(state.readingPeek,peek);
 await press('reading-peek',{sentence:'s2',word:'apples'});assert.deepEqual(state.readingPeek,peek,'słowa zdania z zadaniem tap służą do odpowiedzi');
 await press('reading-peek',{sentence:'s1'});assert.deepEqual(state.readingPeek,{sessionId:peek.sessionId,sentence:'s1'});assert.equal(saves,2);
 await press('answer',{answer:'apples'});await press('reading-next');await press('answer',{answer:'A book'});await press('reading-next');
 assert.equal(state.readingShown!.count,4);await press('next');
 assert.equal(state.progress.active,null);assert.equal(state.screen,'summary');
 // „Czytanki”: the known reading starts again as its own session.
 await press('reading-start',{module:m.id,id:'picnic'});
 assert.equal(state.progress.active!.mode,'reading');assert.equal(state.screen,'study');
});
