// D-52: a completed lesson stays completed when its content changes.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {engineModule} from './fixtures/engine.ts';
import {backup,emptyProgress,keyFor,next,questionFor,recordAnswer,sessionCompatible,validateBackup,type Item,type Progress,type Session} from '../src/core.ts';
import {freshAdventure,journeyForProgress,lessonForProgress,lessonKey,lessons,makeLessonSession,nextLesson,rewardCompletion,validateJourney,type Journey} from '../src/adventure.ts';
import {legendarySession,followingLesson} from '../src/learning/lesson-flow.ts';
import {varyLesson} from '../src/learning/lesson-variety.ts';
import {mapProgress} from '../src/learning/map-progress.ts';
import {moduleFinished} from '../src/learning/recall.ts';
import {prepareSectionPlans} from '../src/learning/section-plan.ts';
import {errorItems,finishRetention,memoryFor,rememberError} from '../src/learning/retention.ts';
import {makeStageReviewSession,recordStageError,reviewStats} from '../src/stage-review.ts';
import {ProgressSync,SyncConflict,type AccountCache,type RemoteProgress,type SyncPorts} from '../src/sync.ts';

// The legacy English course keeps its wallet in adventure.earned, like Hania's Food.
const m=engineModule('stays-unit','angielski-hani'),at='2026-11-01T12:00:00.000Z';
const w=(from:number,to:number)=>m.words.slice(from,to).map(v=>v.id);
const g=(from:number,to:number)=>m.exercises.filter(q=>q.kind==='grammar').slice(from,to).map(q=>q.id);
/** The map as Hania completed it. `second` already carries one published update. */
function published():Journey{return validateJourney({version:1,moduleId:m.id,id:'stays',title:'Mapa',stages:[{id:'stage',title:'Etap',cat:'albert',illustration:'illustrations/test.svg',lessons:[
 {id:'first',title:'Pierwsza',intro:'Stary wstęp',wordIds:w(0,6),exerciseIds:[],ruleIds:[]},
 {id:'second',title:'Druga',intro:'Oryginał',wordIds:w(6,12),exerciseIds:[],ruleIds:[],update:{edition:2,title:'Druga — wydanie 2',intro:'Wydanie 2',wordIds:w(6,10),exerciseIds:g(0,2),ruleIds:[]}},
]}]},m);}
/** The same lesson IDs later: `first` edited in place, the update of `second` edited again. */
function changed():Journey{const j=published(),[first,second]=j.stages[0].lessons;
 first.intro='Nowy wstęp';first.wordIds=w(0,4);first.exerciseIds=g(4,8);
 second.update={edition:2,title:'Druga — kolejna poprawka',intro:'Trzecia treść',wordIds:w(8,12),exerciseIds:g(8,12),ruleIds:[]};
 return validateJourney(j,m);}
function hania(j=published()){const p=emptyProgress();p.adventure=freshAdventure();p.adventure.earned=6;for(const e of lessons(j))p.adventure.completed[e.key]={at};return p;}
function finish(p:Progress,s:Session,wrongFirst=false){p.active=s;let first=wrongFirst;while(p.active){const item=s.items[s.index],q=questionFor([m],item);if(recordAnswer(p,q,first?'wrong':q.answers[0])===false)rememberError(p,item);first=false;next(p);}finishRetention(p,s);return s;}
const ids=(s:Session)=>new Set(s.items.map(i=>i.id));

test('stare ukończenie + zmieniona lekcja = nadal ukończona, 100% i brak nowego obowiązku',()=>{
 const p=hania(),before=structuredClone(p),j=changed();
 for(const stage of [undefined,j.stages[0]]){const stats=mapProgress(j,p,stage);assert.equal(stats.percent,100);assert.equal(stats.complete,true);assert.equal(stats.done,2);assert.equal(stats.total,2);}
 assert.equal(nextLesson(j,p),undefined);assert.equal(moduleFinished([{...m,journeyPaths:['x']}],[j],m,p),true);
 // Both accounts, completed or not, read the same current content.
 const current=journeyForProgress(j,p).stages[0].lessons;
 assert.deepEqual(current[0].wordIds,w(0,4));assert.deepEqual(current[0].exerciseIds,g(4,8));assert.equal(current[1].title,'Druga — kolejna poprawka');assert.deepEqual(current[1].wordIds,w(8,12));
 assert.deepEqual(journeyForProgress(j,emptyProgress()).stages[0].lessons,current);
 assert.deepEqual(p,before,'odczyt nie zmienia postępów');
});

test('nowa sesja ukończonej lekcji bierze aktualną treść i daje tylko 1 ★, bez podwójnej nagrody',()=>{
 const p=hania(),j=changed(),l=j.stages[0].lessons[0],key=lessonKey(j,l);
 const replay=makeLessonSession([m],j,l,'mixed',p);assert.deepEqual(ids(replay),new Set([...w(0,4),...g(4,8)]));
 finish(p,replay);assert.equal(rewardCompletion(p,replay,[m]),1);assert.equal(rewardCompletion(p,replay,[m]),0);
 assert.equal(p.adventure!.earned,7);assert.deepEqual(p.adventure!.completed[key],{at});
 // Processing the same finished session again after a backup round trip pays nothing.
 const restored=validateBackup(backup(p)).progress;assert.equal(rewardCompletion(restored,restored.sessions.at(-1)!,[m]),0);assert.equal(restored.adventure!.earned,7);
 const legendary=legendarySession([m],replay,{journey:j,lesson:l,progress:p})!;assert.equal(legendary.legendary,true);assert.deepEqual(ids(legendary),ids(replay));
 finish(p,legendary);assert.equal(rewardCompletion(p,legendary,[m]),1);assert.equal(rewardCompletion(p,legendary,[m]),0);assert.equal(p.adventure!.earned,8);
 assert.equal(mapProgress(j,p).percent,100);assert.deepEqual(validateBackup(backup(p)).progress,p);
});

test('poziom legendarny po dawnej sesji używa aktualnej treści, a zestawy dynamiczne kopiuje jak dotąd',()=>{
 const old=published(),j=changed(),p=emptyProgress(),l=old.stages[0].lessons[0];
 const first=finish(p,makeLessonSession([m],old,l,'mixed',p));assert.equal(rewardCompletion(p,first,[m]),3);
 const current=j.stages[0].lessons[0],legendary=legendarySession([m],first,{journey:j,lesson:current,progress:p})!;
 assert.deepEqual(ids(legendary),new Set([...w(0,4),...g(4,8)]));assert.equal(legendary.lesson!.id,first.lesson!.id);assert.equal(legendary.attempts.length,0);assert.equal(legendary.lessonRewarded,undefined);
 finish(p,legendary);assert.equal(rewardCompletion(p,legendary,[m]),1);assert.equal(p.adventure!.earned,4);
 // Without a lesson context, and for recall or training sets, the finished set is copied.
 assert.deepEqual(legendarySession([m],first)!.items.map(i=>i.key),first.items.map(i=>i.key));
 const recall=structuredClone(first);recall.recall={stageId:`${m.id}/stays/stage`};
 assert.deepEqual(legendarySession([m],recall,{journey:j,lesson:current,progress:p})!.items.map(i=>i.key),first.items.map(i=>i.key));
 assert.equal(legendarySession([m],{...first,completedAt:null},{journey:j,lesson:current,progress:p}),null);
});

test('rozpoczęta stara sesja wznawia swój zestaw po zmianie treści i kończy lekcję za 3 ★',()=>{
 const old=published(),j=changed(),p=emptyProgress();p.adventure=freshAdventure();
 const l=old.stages[0].lessons[0];p.active=varyLesson(makeLessonSession([m],old,l,'mixed',p),[m],[old],old,l,p);
 const q=questionFor([m],p.active.items[0]);recordAnswer(p,q,q.answers[0]);next(p);const saved=structuredClone(p.active!);assert.equal(saved.index,1);
 const restored=validateBackup(backup(p)).progress;assert.deepEqual(restored.active,saved);assert.ok(sessionCompatible([m],restored.active!));
 // The definition is current, the started set is not rebuilt.
 assert.deepEqual(lessonForProgress(j,j.stages[0].lessons[0],restored).exerciseIds,g(4,8));assert.deepEqual(ids(restored.active!),new Set(w(0,6)));
 const s=restored.active!;while(restored.active){const q=questionFor([m],s.items[s.index]);recordAnswer(restored,q,q.answers[0]);next(restored);}
 assert.equal(rewardCompletion(restored,s,[m]),3);assert.equal(rewardCompletion(restored,s,[m]),0);assert.ok(restored.adventure!.completed[lessonKey(j,l)]);
 assert.equal(followingLesson([m],[j],restored,s)!.lesson.id,'second');
});

test('stara kopia postępów wczytuje się bez zmian, bez migracji i bez nowych pól',()=>{
 const p=hania();p.adventure!.completed[`${m.id}/stays/second`]={at,edition:2};
 const file=JSON.parse(JSON.stringify(backup(p))),text=JSON.stringify(file.progress);
 const loaded=validateBackup(file).progress;assert.deepEqual(loaded,p);
 const j=changed();mapProgress(j,loaded);journeyForProgress(j,loaded);nextLesson(j,loaded);prepareSectionPlans([j],loaded);
 assert.equal(JSON.stringify(backup(loaded).progress),text);assert.equal(backup(loaded).version,1);
 const invalid=JSON.parse(JSON.stringify(file));invalid.progress.adventure.completed[`${m.id}/stays/first`].edition=3;assert.throws(()=>validateBackup(invalid));
});

test('liczniki utrwalenia i kolejki błędów przeżywają usunięcie zadania z lekcji',()=>{
 const old=published(),j=changed(),p=emptyProgress(),l=old.stages[0].lessons[0];
 const s=makeLessonSession([m],old,l,'text',p);p.active=s;
 // word-5 is answered wrongly and later leaves the lesson, but stays in the module file.
 const gone=s.items.find(i=>i.id==='word-5')!;s.index=s.items.indexOf(gone);recordAnswer(p,questionFor([m],gone),'wrong');rememberError(p,gone);recordStageError(p,s,gone,[old]);s.index=0;
 const key=keyFor(m,'word','word-5');assert.equal(memoryFor(p,key)!.correct,0);
 assert.ok(!lessons(journeyForProgress(j,p)).some(e=>e.lesson.wordIds.includes('word-5')));
 assert.ok(errorItems([m],p).some((i:Item)=>i.key===key));assert.equal(reviewStats(p,j,j.stages[0]).pending,1);
 const review=makeStageReviewSession([m],j,j.stages[0],'text',p)!;assert.deepEqual(review.items.map(i=>i.key),[key]);
 p.active=null;finish(p,review);assert.equal(memoryFor(p,key)!.correct,1);assert.equal(mapProgress(j,p).pending,1);
});

test('plan sekcji 7 + 2 i jego ukończenia zostają po zmianie treści lekcji bazowych',()=>{
 const base=(extra:number):Journey=>({version:1,moduleId:m.id,title:'Sekcja',stages:[{id:'seven',title:'Siedem',cat:'maja',illustration:'illustrations/test.svg',adaptiveReviews:true,lessons:Array.from({length:7},(_,i)=>({id:`base-${i}`,title:`Lekcja ${i}`,intro:'',wordIds:[m.words[i].id,...(i===0&&extra?[m.words[11].id]:[])],exerciseIds:[],ruleIds:[]}))}]});
 const old=validateJourney(base(0),m),j=validateJourney(base(1),m),p=emptyProgress();prepareSectionPlans([old],p,()=>0);
 const planned=lessons(journeyForProgress(old,p));assert.equal(planned.length,9);
 p.adventure!.completed=Object.fromEntries(planned.map(e=>[e.key,{at}]));const plan=structuredClone(p.adventure!.sectionPlans);
 prepareSectionPlans([j],p);assert.deepEqual(p.adventure!.sectionPlans,plan);
 const now=lessons(journeyForProgress(j,p));assert.deepEqual(now.map(e=>e.key),planned.map(e=>e.key));assert.equal(now[0].lesson.wordIds.length,2);
 assert.equal(mapProgress(j,p).percent,100);assert.equal(mapProgress(j,p).total,9);
});

test('synchronizacja nie cofa ukończenia: drugie urządzenie z nowszą treścią widzi 100% i tę samą liczbę gwiazdek',async()=>{
 const copy=<T>(v:T)=>structuredClone(v),remote=new Map<string,RemoteProgress>();
 const device=()=>{const disk=new Map<string,AccountCache>();const ports:SyncPorts={read:async uid=>copy(disk.get(uid)),save:async(uid,cache)=>{disk.set(uid,copy(cache));},fetch:async uid=>copy(remote.get(uid)??null),
  push:async(uid,p,revision)=>{const old=remote.get(uid);if((old?.revision??0)!==revision)throw new SyncConflict(copy(old??null));const result={revision:revision+1,progress:copy(p)};remote.set(uid,result);return copy(result);}};return new ProgressSync(ports);};
 const phone=device(),tablet=device(),done=hania();
 await phone.connect('hania',emptyProgress());await phone.save(done);await phone.sync();assert.equal(phone.status,'saved');
 // The tablet already has the changed lessons; content is not part of the synced record.
 await tablet.connect('hania',emptyProgress());await tablet.sync();const j=changed(),p=copy(tablet.cache!.progress);
 assert.deepEqual(p,done);assert.equal(mapProgress(j,p).percent,100);assert.equal(nextLesson(j,p),undefined);
 const l=j.stages[0].lessons[1],replay=finish(p,makeLessonSession([m],j,l,'mixed',p));assert.equal(rewardCompletion(p,replay,[m]),1);
 await tablet.save(p);await tablet.sync();assert.equal(tablet.status,'saved');await phone.sync();
 const back=phone.cache!.progress;assert.deepEqual(back.adventure!.completed,done.adventure!.completed);assert.equal(back.adventure!.earned,7);assert.equal(mapProgress(published(),back).percent,100);
});
