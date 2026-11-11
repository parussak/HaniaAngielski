import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {foodModules as modules} from './materials.ts';
import {readJourneys,lessons,makeLessonSession,rewardCompletion,freshAdventure,type Journey} from '../src/adventure.ts';
import {mapTrainingPool,trainingPreparation,makeTrainingSession} from '../src/learning/training.ts';
import {emptyProgress,recordAnswer,questionFor,next,backup,validateBackup} from '../src/core.ts';
import {AppState} from '../src/app/state.ts';
import {createProgressController} from '../src/controllers/progress.ts';
import type {ProgressSync} from '../src/sync.ts';
const m=modules[0];
const read=(path:string)=>JSON.parse(readFileSync(new URL(`../public/content/${path}`,import.meta.url),'utf8'));
const first:Journey=read('02-food/sciezka.json'),second:Journey=read('02-food/sciezka-praktyka.json');
const paths=m.journeyPaths!;
const at='2026-11-09T12:00:00.000Z';

test('awaria pobrania lub niepoprawny JSON jednej mapy nie usuwa pozostałej i zachowuje kolejność',async()=>{
 for(const failed of paths)for(const fail of ['network','json','schema']){
  const result=await readJourneys(modules,async path=>{
   if(path!==failed)return read(path);
   if(fail==='network')throw new Error('404');
   if(fail==='json')return JSON.parse('{bad');
   return {version:99};
  });
  assert.deepEqual(result.issues,[{moduleId:m.id,path:failed}]);
  assert.deepEqual(result.journeys.map(j=>j.title),[failed===paths[0]?second.title:first.title]);
 }
});

test('duplikaty tożsamości są izolowane razem, inne mapy i kursy pozostają dostępne',async()=>{
 const extra={...m,id:'other-unit',courseId:'other-course',journeyPaths:['other/sciezka.json']};
 const extraJourney={...first,moduleId:extra.id,stages:[{...first.stages[0],lessons:first.stages[0].lessons}]};
 const result=await readJourneys([m,extra],async path=>path.startsWith('other/')?extraJourney:first);
 assert.equal(result.issues.length,2);assert.deepEqual(result.journeys.map(j=>j.moduleId),[extra.id]);
});

test('ponowne pobranie odzyskuje obie mapy bez zmiany kluczy i sam odczyt nie zmienia wyników',async()=>{
 const p=emptyProgress();p.adventure=freshAdventure();p.adventure.earned=44;p.adventure.completed[`${m.id}/food-words-1`]={at};
 const before=structuredClone(p),result=await readJourneys(modules,async path=>read(path));
 assert.deepEqual(result.issues,[]);assert.deepEqual(result.journeys,[first,second]);assert.deepEqual(p,before);
});

test('brak poznanej puli prowadzi do odblokowanej lekcji wcześniejszej mapy; oglądanie nie daje gwiazdek',()=>{
 const p=emptyProgress();p.adventure=freshAdventure();p.adventure.earned=9;
 for(const e of lessons(second).slice(0,3))p.adventure.completed[e.key]={at};
 const before=structuredClone(p),source=trainingPreparation(modules,[first,second],second,p)!;
 assert.equal(source.journey.moduleId,m.id);assert.equal(source.lesson.id,first.stages[0].lessons[0].id);
 assert.equal(mapTrainingPool(modules,[first,second],second,p).length,0);
 assert.equal(makeTrainingSession(modules,m,p,'text',{journey:second,lesson:second.stages[0].lessons[3],journeys:[first,second]}),null);
 assert.deepEqual(p,before);
});

test('ukończenie przygotowania odblokowuje rzeczywisty trening tylko wcześniejszych pytań, z jedną nagrodą',()=>{
 const p=emptyProgress();p.adventure=freshAdventure();p.adventure.earned=20;
 for(const e of lessons(second).slice(0,3))p.adventure.completed[e.key]={at};
 const source=trainingPreparation(modules,[first,second],second,p)!;
 p.active=makeLessonSession(modules,source.journey,source.lesson,'text',p);
 function finish(){const s=p.active!;while(p.active){recordAnswer(p,questionFor(modules,s.items[s.index]),questionFor(modules,s.items[s.index]).answers[0]);next(p);}return s;}
 const prepared=finish();assert.equal(rewardCompletion(p,prepared),3);
 const session=makeTrainingSession(modules,m,p,'text',{journey:second,lesson:second.stages[0].lessons[3],journeys:[first,second]})!;
 assert.equal(session.items.length,5);assert.ok(session.items.every(i=>prepared.items.some(old=>old.key===i.key)));
 p.active=session;const done=finish();assert.equal(rewardCompletion(p,done),3);assert.equal(rewardCompletion(p,done),0);
 assert.equal(p.adventure!.earned,26);assert.deepEqual(validateBackup(backup(p)).progress,p);
});

test('dawne ukończenia bez historii można powtórzyć w przygotowaniu, bez nowych gwiazdek; obcego kursu nie wybieramy',()=>{
 const p=emptyProgress();p.adventure=freshAdventure();for(const e of lessons(first))p.adventure.completed[e.key]={at};
 const before=structuredClone(p),source=trainingPreparation(modules,[first,second],second,p)!;
 assert.equal(source.lesson.id,first.stages[0].lessons[0].id);
 assert.equal(trainingPreparation(modules,[second],second,p),undefined);
 const other={...m,id:'other-unit',courseId:'other-course'};const otherJourney={...first,moduleId:other.id};
 assert.equal(trainingPreparation([...modules,other],[otherJourney,second],second,p),undefined);
 assert.deepEqual(p,before);
});

test('niepełny katalog nie zamyka migracji starych błędów ani nie rozlicza premii etapu',async()=>{
 const state=new AppState();state.modules=modules;state.journeys=[first];state.journeyIssues=[{moduleId:m.id,path:paths[1]}];
 const p=emptyProgress();p.adventure=freshAdventure();p.adventure.earned=15;
 for(const l of first.stages[0].lessons)p.adventure.completed[`${m.id}/${l.id}`]={at};
 const ports={sync:{} as ProgressSync,run:async(task:()=>Promise<void>)=>task(),render:()=>{},scheduleSync:()=>{}};
 const controller=createProgressController(state,ports),before=structuredClone(p);
 const partial=await controller.prepareProgress(p);assert.deepEqual(partial,before);
 state.journeys=[first,second];state.journeyIssues=[];
 const restored=await controller.prepareProgress(partial);
 assert.equal(restored.adventure!.reviewSchema,1);assert.equal(restored.adventure!.earned,18);
 assert.equal((await controller.prepareProgress(restored)).adventure!.earned,18);
});
