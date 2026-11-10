import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {modules} from './materials.ts';
import {freshAdventure,journeyForProgress,lessonForProgress,lessons,makeLessonSession,rewardCompletion,validateJourney} from '../src/adventure.ts';
import {backup,emptyProgress,next,questionFor,recordAnswer,sessionCompatible,validateBackup,type Progress,type Session} from '../src/core.ts';
import {getNextStep} from '../src/next-step.ts';
import {earlierMapKeys,makeTrainingSession,validateTrainingPlan} from '../src/learning/training.ts';
import {makeStageReviewSession,recordStageError,reviewStats,settleStageRewards} from '../src/stage-review.ts';
const read=(name:string)=>JSON.parse(readFileSync(new URL(`../public/content/02-food/${name}.json`,import.meta.url),'utf8'));
const m=modules[0],j=validateJourney(read('sciezka'),m),second=validateJourney(read('sciezka-praktyka'),m);
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const at='2026-11-09T12:00:00.000Z';
function unlockedRestaurant(){const p=emptyProgress();p.adventure=freshAdventure();p.adventure.earned=92;for(const e of lessons(j).filter(e=>j.stages.indexOf(e.stage)<4))p.adventure.completed[e.key]={at};return p;}
function finish(p:Progress){const s=p.active!;while(p.active){recordAnswer(p,questionFor(modules,s.items[s.index]),questionFor(modules,s.items[s.index]).answers[0]);next(p);}return s;}

test('audyt Food: oryginalne mapy, słówka, pytania i objaśnienia nie są podmienione',()=>{
 const base=structuredClone(j);for(const {lesson} of lessons(base))delete lesson.update;
 assert.equal(hash(base),'c863da9654cb74aa8ee08460192ea1002e24e58df4b51fba6cf9d7dac455bdfa');
 for(const [name,expected,count] of [
  ['slownictwo','d1d1acf441ed69ceec80b77fca4db467e855f193197fc2d91d6d8aa9e25aaed1',97],
  ['quiz','0774aac6af4605bb56b27afaaa52380934283dab889e0614e274438a3a9ea2be',97],
  ['cwiczenia','d66b03a4be6101d8d63e201329abc2a843089ff1399cefa2af14f483b929b759',59],
  ['gramatyka','69c0e2c3fb263b5e2c2e6f0b40554a0d23e773ebf7c921f2aa5bd5d10173728c',9],
  ['rozmowki','67f8ff8812e829a7538b67c22479f177d6e4f79ae1bd8124fd489a0c9db66b2b',12]
 ] as const)assert.equal(hash(read(name).slice(0,count)),expected,name);
 assert.ok(j.stages.slice(0,4).every(s=>s.lessons.every(l=>!l.update)));
 assert.ok(j.stages.slice(4).every(s=>s.lessons.every(l=>l.update)));
});

test('ukończona lekcja konta A zostaje oryginalna, nieukończona konta B ma 6–8 zadań, bez migracji gwiazdek',()=>{
 const a=unlockedRestaurant(),b=unlockedRestaurant(),l=j.stages[4].lessons[0],key=`${m.id}/${l.id}`;
 a.adventure!.completed[key]={at};const original=structuredClone(a);
 assert.equal(lessonForProgress(j,l,a).wordIds.length+lessonForProgress(j,l,a).exerciseIds.length,5);
 assert.equal(lessonForProgress(j,l,b).wordIds.length+lessonForProgress(j,l,b).exerciseIds.length,6);
 assert.equal(getNextStep(modules,[j,second],b).kind,'lesson');
 journeyForProgress(j,a);validateBackup(backup(a));assert.deepEqual(a,original);
 for(const {lesson} of lessons(journeyForProgress(j,b)).filter(e=>j.stages.some(s=>['restaurant','reasons','picnic'].includes(s.id)&&s.lessons.some(l=>l.id===e.lesson.id)))){
  assert.ok(lesson.wordIds.length+lesson.exerciseIds.length>=6);assert.ok(lesson.wordIds.length+lesson.exerciseIds.length<=8);
 }
});

test('rozpoczęta dawna lekcja, błędy i backup pozostają obsługiwane po aktualizacji treści',()=>{
 const p=unlockedRestaurant(),l=j.stages[4].lessons[0],old=structuredClone(l);delete old.update;
 p.active=makeLessonSession(modules,j,old,'text',p);assert.equal(p.active.items.length,5);
 recordAnswer(p,questionFor(modules,p.active.items[0]),'wrong');recordStageError(p,p.active,p.active.items[0],[j]);
 const saved=structuredClone(p.active);
 const restored=validateBackup(backup(p)).progress;
 assert.ok(sessionCompatible(modules,restored.active!));assert.equal(restored.active!.lesson!.edition,undefined);
 assert.equal(lessonForProgress(j,l,restored).exerciseIds.length,0);
 assert.deepEqual(restored.active!.items,saved.items);
 const review=makeStageReviewSession(modules,j,j.stages[4],'choice',restored)!;
 assert.equal(review.items[0].key,saved.items[0].key);assert.equal(reviewStats(restored,j,j.stages[4]).pending,1);
 assert.equal(restored.adventure!.earned,92);
});

test('nowa wersja zapisuje wydanie przy ukończeniu, wznawia się i nie przyznaje ponownej nagrody',()=>{
 const p=unlockedRestaurant(),l=j.stages[4].lessons[0];p.active=makeLessonSession(modules,j,l,'text',p);
 assert.equal(p.active.lesson!.edition,2);assert.equal(p.active.items.length,6);
 const restored=validateBackup(backup(p)).progress;assert.equal(restored.active!.lesson!.edition,2);
 const s=finish(restored);assert.equal(rewardCompletion(restored,s),3);assert.equal(rewardCompletion(restored,s),0);
 assert.equal(restored.adventure!.earned,95);assert.equal(restored.adventure!.completed[s.lesson!.id].edition,2);
 assert.equal(lessonForProgress(j,l,restored).exerciseIds.length,1);
 restored.active=makeLessonSession(modules,j,l,'choice',restored);assert.equal(restored.active.items.length,6);
 assert.equal(rewardCompletion(restored,finish(restored)),0);assert.equal(restored.adventure!.earned,95);
 assert.deepEqual(validateBackup(backup(restored)).progress,restored);
 const invalid=backup(restored);invalid.progress.adventure!.completed[s.lesson!.id].edition=3 as 2;assert.throws(()=>validateBackup(invalid));
});

test('druga mapa ma krótkie lekcje kontekstowe, trening po trzech lekcjach i komplet nowych zadań',()=>{
 validateTrainingPlan(modules,[j,second]);assert.equal(lessons(second)[3].lesson.role,'training');
 const ids=new Set([...lessons(j).flatMap(e=>[...e.lesson.exerciseIds,...e.lesson.update?.exerciseIds??[]]),...lessons(second).flatMap(e=>e.lesson.exerciseIds)]);
 for(const q of m.exercises.filter(q=>q.kind!=='vocabulary'))assert.ok(ids.has(q.id),q.id);
 for(const {lesson} of lessons(second).filter(e=>e.lesson.role!=='training'))assert.equal(lesson.exerciseIds.length,6);
 const p=unlockedRestaurant();for(const e of lessons(j))p.adventure!.completed[e.key]={at};
 const before=structuredClone(p.adventure);
 const step=getNextStep(modules,[j,second],p);assert.equal(step.kind,'lesson');assert.equal(step.journeyId,`${m.id}/food-w-praktyce`);
 assert.deepEqual(p.adventure,before);assert.equal(settleStageRewards(p,[second]),0);
});

test('trening drugiej mapy bierze tylko poznane elementy wcześniejszej, także nowe warianty i odpowiedzi bez błędu',()=>{
 const p=unlockedRestaurant();p.active=makeLessonSession(modules,j,j.stages[4].lessons[0],'text',p);const s=finish(p);rewardCompletion(p,s);
 const priorKeys=earlierMapKeys(modules,[j,second],second);assert.ok(priorKeys.has(s.items.at(-1)!.key));
 for(const e of lessons(second).slice(0,3))p.adventure!.completed[e.key]={at};
 const lesson=lessons(second)[3].lesson;
 const training=makeTrainingSession(modules,m,p,'text',{journey:second,lesson,journeys:[j,second]})!;
 assert.equal(training.items.length,6);assert.ok(training.items.every(i=>s.items.some(old=>old.key===i.key)));
 assert.ok(training.items.some(i=>i.type==='exercise'));assert.ok(training.items.some(i=>i.type==='word'));
 p.active=training;assert.equal(rewardCompletion(p,finish(p)),3);
});

test('walidator aktualizacji odrzuca błędne referencje, zbyt krótkie lekcje i zmianę identyfikatora',()=>{
 for(const edit of [(l:any)=>l.update.exerciseIds=['missing'],(l:any)=>l.update.wordIds=[],(l:any)=>l.update.id='other',(l:any)=>l.update.edition=3]){
  const invalid=structuredClone(j);edit(invalid.stages[4].lessons[0]);assert.throws(()=>validateJourney(invalid,m));
 }
});
