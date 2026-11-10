import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {modules} from './materials.ts';
import {validateJourney,lessons,nextLesson,unlocked,makeLessonSession,rewardCompletion,purchase,place,stars,freshAdventure} from '../src/adventure.ts';
import {emptyProgress,recordAnswer,questionFor,next,validateBackup,backup,type Progress,type Session} from '../src/core.ts';
import {settleStageRewards} from '../src/stage-review.ts';
const j=validateJourney(JSON.parse(readFileSync(new URL('../public/content/02-food/sciezka.json',import.meta.url),'utf8')),modules[0]);
function finish(p:Progress,wrong=false){const s=p.active!;let first=true;while(p.active){const q=questionFor(modules,s.items[s.index]);recordAnswer(p,q,wrong&&first?'wrong':q.answers[0]);if(wrong&&first){s.phase='retry';recordAnswer(p,q,q.answers[0]);}first=false;next(p);}return s;}

test('Food ma siedem etapów i obejmuje wszystkie 97 słówek oraz zadania bez późniejszych modułów',()=>{
  assert.equal(j.stages.length,7);assert.equal(lessons(j).length,41);
  const all=lessons(j).flatMap(l=>l.lesson.wordIds);assert.equal(new Set(all).size,97);assert.equal(all.length,97);
  const exerciseIds=new Set(lessons(j).flatMap(l=>l.lesson.exerciseIds));
  for(const q of modules[0].exercises.filter(q=>q.kind!=='vocabulary'&&!q.id.startsWith('food-')))assert.ok(exerciseIds.has(q.id),q.id);
  assert.ok(lessons(j).every(l=>l.lesson.exerciseIds.length+l.lesson.wordIds.length<=8));
});
test('dowolna lekcja jest dostępna; pierwsze ukończenie daje trzy gwiazdki, pełna powtórka jedną',()=>{
  const p=emptyProgress(),l=lessons(j)[0].lesson,second=lessons(j)[1].lesson;
  assert.equal(unlocked(j,second,p),true);assert.ok(makeLessonSession(modules,j,second,'mixed',p));
  p.active=makeLessonSession(modules,j,l,'text',p);assert.equal(rewardCompletion(p,p.active),0);
  const s=finish(p,true);assert.equal(s.attempts[0].first,false);assert.equal(rewardCompletion(p,s),3);assert.equal(stars(p),3);
  assert.equal(rewardCompletion(p,s),0);assert.equal(unlocked(j,second,p),true);assert.equal(nextLesson(j,p)?.lesson.id,second.id);
  p.active=makeLessonSession(modules,j,l,'choice',p);assert.equal(rewardCompletion(p,finish(p)),1);assert.equal(stars(p),4);
  assert.deepEqual(validateBackup(backup(p)).progress,p);
});
test('zakup, powtórny zakup, zamiana i schowanie przedmiotu zachowują saldo i własność',()=>{
  const p=emptyProgress();assert.equal(purchase(p,'pillow'),false);p.adventure=freshAdventure();p.adventure.earned=20;
  assert.equal(purchase(p,'pillow'),true);assert.equal(stars(p),14);assert.equal(purchase(p,'pillow'),false);assert.equal(stars(p),14);
  assert.equal(purchase(p,'yarn'),true);assert.equal(stars(p),10);
  assert.equal(place(p,'pillow','front'),true);assert.equal(p.adventure.purchases.pillow.slot,'front');assert.equal(p.adventure.purchases.yarn.slot,'rug');
  assert.equal(place(p,'pillow',null),true);assert.ok(p.adventure.purchases.pillow);assert.equal(stars(p),10);
  assert.equal(place(p,'scratcher','left'),false);assert.equal(purchase(p,'scratcher'),false);
  assert.deepEqual(validateBackup(backup(p)).progress,p);
  const invalid=backup(p);invalid.progress.adventure!.earned=1;assert.throws(()=>validateBackup(invalid));
});
test('ogólna powtórka nie nalicza już premii dziennej, dawne gwiazdki pozostają',()=>{
  const p=emptyProgress();p.active=makeLessonSession(modules,j,lessons(j)[0].lesson,'text',p);const s=finish(p);
  const review:Session={...s,mode:'review',lesson:undefined};review.completedAt='2026-11-09T12:00:00Z';
  p.adventure=freshAdventure();p.adventure.earned=7;p.adventure.reviewDay='2026-11-08';
  assert.equal(rewardCompletion(p,review),0);assert.equal(rewardCompletion(p,{...review,id:'again'}),0);
  assert.equal(rewardCompletion(p,{...review,completedAt:'2026-11-08T12:00:00Z'}),0);
  assert.equal(rewardCompletion(p,{...review,completedAt:'2026-11-10T12:00:00Z'}),0);assert.equal(stars(p),7);
});
test('pełna ścieżka Food: wszystkie lekcje, odznaka i stały budżet gwiazdek',()=>{
  const p=emptyProgress();for(const {lesson,key} of lessons(j)){
    assert.ok(unlocked(j,lesson,p));p.active=makeLessonSession(modules,j,lesson,'mixed',p);
    assert.equal(rewardCompletion(p,finish(p)),3);assert.ok(p.adventure?.completed[key]);
    settleStageRewards(p,[j]);
  }
  assert.equal(nextLesson(j,p),undefined);assert.equal(stars(p),144);assert.equal(p.sessions.length,41);
});
