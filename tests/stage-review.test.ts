import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {foodModules as modules} from './materials.ts';
import {validateJourney,makeLessonSession,rewardCompletion,lessonKey,unlocked,freshAdventure,stars} from '../src/adventure.ts';
import {seedStageReviews,seedReviewArchive,recordStageError,stageKey,reviewState,reviewStats,makeStageReviewSession,finishStageReview,settleStageRewards} from '../src/stage-review.ts';
import {emptyProgress,recordAnswer,questionFor,next,backup,validateBackup,currentStats,keyFor,type Progress,type Session,type Item} from '../src/core.ts';
import {compactHistory,type HistoryPage} from '../src/history.ts';
import {fullBackup,validateFullBackup} from '../src/history-backup.ts';
const m=modules[0],j=validateJourney(JSON.parse(readFileSync(new URL('../public/content/02-food/sciezka.json',import.meta.url),'utf8')),m),stage=j.stages[0],id=stageKey(j,stage);
const word=(index:number):Item=>({key:keyFor(m,'word',m.words[index].id),moduleId:m.id,version:1,type:'word',id:m.words[index].id,input:'text'});
function withErrors(count=1){
  const p=seedStageReviews(emptyProgress(),[j]);p.active=makeLessonSession(modules,j,stage.lessons[0],'text',p);
  for(let i=0;i<count;i++)recordStageError(p,p.active,word(i),[j]);p.active=null;return p;
}
function answer(p:Progress,value:string){const s=p.active!,item=s.items[s.index],correct=recordAnswer(p,questionFor(modules,item),value);if(correct===false)recordStageError(p,s,item,[j]);}
function tour(p:Progress,wrong=false){
  const s=makeStageReviewSession(modules,j,stage,'text',p)!;assert.ok(s);p.active=s;let first=true;
  while(p.active){const q=questionFor(modules,s.items[s.index]);answer(p,first&&wrong?'wrong':q.answers[0]);if(first&&wrong){s.phase='retry';answer(p,q.answers[0]);}first=false;next(p);}
  assert.equal(finishStageReview(p,s),true);settleStageRewards(p,[j]);return s;
}
function completeLessons(p:Progress){p.adventure??=freshAdventure();for(const l of stage.lessons)p.adventure.completed[lessonKey(j,l)]={at:'2026-11-09T12:00:00Z'};}

test('błędy trafiają tylko do etapu danej lekcji, powtórka ogólna nie zmienia tej kolejki',()=>{
  const p=withErrors();assert.equal(reviewStats(p,j,stage).pending,1);assert.equal(reviewStats(p,j,j.stages[1]).pending,0);
  const s=makeLessonSession(modules,j,stage.lessons[0],'text',p);recordStageError(p,s,word(0),[j]);assert.equal(reviewStats(p,j,stage).total,1);
  recordStageError(p,{...s,lesson:undefined,mode:'review'},word(1),[j]);assert.equal(reviewStats(p,j,stage).pending,1);
  p.active=null;assert.deepEqual(validateBackup(backup(p)).progress,p);
});
test('otwarcie, niedokończona tura i ponowne otwarcie nie zwiększają licznika; trzy ukończone tury utrwalają',()=>{
  const p=withErrors(),state=reviewState(p,id)!;
  const first=makeStageReviewSession(modules,j,stage,'text',p)!;assert.equal(first.stageReview!.round,1);assert.equal(state.round,0);
  p.active=first;answer(p,questionFor(modules,first.items[0]).answers[0]);assert.equal(state.items[word(0).key].correct,0);assert.equal(finishStageReview(p,first),false);
  const reopened=makeStageReviewSession(modules,j,stage,'text',p)!;assert.equal(reopened.stageReview!.round,1);p.active=null;
  tour(p);assert.equal(state.items[word(0).key].correct,1);assert.equal(state.items[word(0).key].due,3);
  const second=tour(p);assert.equal(second.stageReview!.round,3);assert.equal(state.items[word(0).key].correct,2);assert.equal(state.items[word(0).key].due,6);
  const third=tour(p);assert.equal(third.stageReview!.round,6);assert.equal(state.items[word(0).key].correct,3);assert.equal(reviewStats(p,j,stage).percent,100);
  assert.equal(makeStageReviewSession(modules,j,stage,'text',p),null);assert.equal(finishStageReview(p,third),false);
});
test('po poprawie pozycje wracają rzadziej, a duża kolejka nie pomija najtrudniejszych',()=>{
  const p=withErrors(20),state=reviewState(p,id)!;
  const first=tour(p);assert.equal(first.attempts.length,10);assert.equal(state.round,1);
  const second=makeStageReviewSession(modules,j,stage,'text',p)!;assert.equal(second.stageReview!.round,2);assert.equal(second.items.length,10);
  assert.ok(second.items.every(item=>!first.attempts.some(a=>a.key===item.key)));
  tour(p);assert.equal(state.round,2);const third=makeStageReviewSession(modules,j,stage,'text',p)!;assert.equal(third.stageReview!.round,3);
  assert.ok(third.items.every(item=>first.attempts.some(a=>a.key===item.key)));
});
test('błąd zeruje serię, poprawka i powtórzony element w tej samej turze nie liczą się jako samodzielny sukces',()=>{
  const p=withErrors();tour(p);tour(p);const s=tour(p,true),entry=reviewState(p,id)!.items[word(0).key];
  assert.equal(s.attempts[0].first,false);assert.ok(s.attempts[0].corrected);assert.equal(entry.correct,0);assert.equal(entry.due,s.stageReview!.round+1);
  assert.equal(reviewStats(p,j,stage).pending,1);tour(p);assert.equal(entry.correct,1);
});
test('3 ★ wymagają wszystkich lekcji i 100%, nie blokują następnego etapu i nie wracają po nowym błędzie',()=>{
  const p=withErrors();completeLessons(p);assert.equal(settleStageRewards(p,[j]),0);assert.ok(unlocked(j,j.stages[1].lessons[0],p));
  tour(p);tour(p);assert.equal(stars(p),0);tour(p);assert.equal(stars(p),3);assert.ok(reviewState(p,id)!.rewardedAt);
  assert.equal(settleStageRewards(p,[j]),0);
  const s=makeLessonSession(modules,j,stage.lessons[0],'text',p);recordStageError(p,s,word(0),[j]);assert.equal(reviewStats(p,j,stage).percent,0);assert.equal(stars(p),3);
  tour(p);tour(p);tour(p);assert.equal(stars(p),3);
});
test('100% przed końcem lekcji czeka z nagrodą; etap bez błędów dostaje premię po ostatniej lekcji',()=>{
  const p=withErrors();tour(p);tour(p);tour(p);assert.equal(stars(p),0);completeLessons(p);assert.equal(settleStageRewards(p,[j]),3);
  const clean=seedStageReviews(emptyProgress(),[j]);for(const l of stage.lessons){clean.active=makeLessonSession(modules,j,l,'text',clean);const s=clean.active;while(clean.active){answer(clean,questionFor(modules,s.items[s.index]).answers[0]);next(clean);}rewardCompletion(clean,s);settleStageRewards(clean,[j]);}
  assert.equal(stars(clean),18);assert.equal(reviewStats(clean,j,stage).total,0);assert.equal(settleStageRewards(clean,[j]),0);
});
test('procent liczy pozycje z 3/3, a wspólna pozycja w dwóch etapach jest zaległa, jeśli choć jeden jej nie utrwalił',()=>{
  const p=withErrors(2),state=reviewState(p,id)!;state.items[word(0).key].correct=3;state.items[word(0).key].due=0;
  assert.equal(reviewStats(p,j,stage).percent,50);assert.equal(reviewStats(p,j,stage).words,1);
  const other=stageKey(j,j.stages[6]);p.adventure!.stageReviews![other]={round:0,items:{[word(0).key]:{item:word(0),correct:0,due:1}}};
  assert.equal(reviewStats(p,j).percent,0);assert.equal(reviewStats(p,j).words,2);
});
test('migracja dawnych lekcji i archiwum zachowuje starsze gwiazdki, zakres etapu i nowszą serię',async()=>{
  const legacy=emptyProgress();legacy.active=makeLessonSession(modules,j,stage.lessons[0],'text',legacy);const s=legacy.active;
  recordAnswer(legacy,questionFor(modules,s.items[0]),'wrong');while(legacy.active){if(s.phase!=='feedback')recordAnswer(legacy,questionFor(modules,s.items[s.index]),questionFor(modules,s.items[s.index]).answers[0]);next(legacy);}
  rewardCompletion(legacy,s);legacy.sessions=Array.from({length:60},(_,i)=>({...structuredClone(s),id:'legacy-'+i}));
  const pages=new Map<string,HistoryPage>();const old=await compactHistory(legacy,async page=>{pages.set(page.id,page);});
  const p=seedStageReviews(old,[j]);assert.equal(p.adventure!.earned,3);assert.ok(p.adventure!.reviewArchiveHead);assert.equal(reviewStats(p,j,stage).pending,1);
  const state=reviewState(p,id)!;state.items[word(0).key].correct=1;state.items[word(0).key].due=3;
  while(p.adventure!.reviewArchiveHead)seedReviewArchive(p,pages.get(p.adventure!.reviewArchiveHead)!,[j]);
  assert.equal(state.items[word(0).key].correct,1);assert.deepEqual(currentStats(modules,p),currentStats(modules,old));
  const b=await fullBackup(p,async id=>pages.get(id)!);assert.deepEqual((await validateFullBackup(JSON.parse(JSON.stringify(b)))).progress,p);
  assert.deepEqual(seedStageReviews(p,[j]),p);
});
test('kopie walidują liczniki, odniesienia i tury powtórki, a stare pliki nadal działają',()=>{
  const p=withErrors();p.active=makeStageReviewSession(modules,j,stage,'mixed',p);assert.deepEqual(validateBackup(backup(p)).progress,p);
  for(const change of [
    (v:Progress)=>v.adventure!.stageReviews![id].items[word(0).key].correct=4,
    (v:Progress)=>v.adventure!.stageReviews![id].items[word(0).key].due=-1,
    (v:Progress)=>v.adventure!.stageReviews![id].items[word(0).key].item.key='bad',
    (v:Progress)=>v.active!.stageReview!.round=0,
    (v:Progress)=>v.active!.mode='grammar',
  ]){const copy=structuredClone(p);change(copy);assert.throws(()=>validateBackup(backup(copy)));}
  assert.deepEqual(validateBackup(backup(emptyProgress())).progress,emptyProgress());
  assert.deepEqual(seedStageReviews(emptyProgress(),[j]),emptyProgress());
});
test('błędne zadanie gramatyczne zostaje w swoim etapie i zachowuje wybór odpowiedzi z nawiasu',()=>{
  const p=withErrors(),target=j.stages[2],lesson=target.lessons.find(l=>l.exerciseIds.includes('g-some-milk-positive'))!;
  const item:Item={key:keyFor(m,'exercise','g-some-milk-positive'),moduleId:m.id,version:1,type:'exercise',id:'g-some-milk-positive',input:'text'};
  const s=makeLessonSession(modules,j,stage.lessons[0],'text',p);s.lesson={id:lessonKey(j,lesson),title:lesson.title};s.items=[item];
  recordStageError(p,s,item,[j]);const review=makeStageReviewSession(modules,j,target,'text',p)!;
  assert.equal(review.items.length,1);assert.equal(review.items[0].input,'choice');assert.equal(reviewStats(p,j,target).tasks,1);assert.equal(reviewStats(p,j,stage).tasks,0);
});
