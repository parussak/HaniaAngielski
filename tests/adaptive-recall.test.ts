import {test} from 'node:test';
import assert from 'node:assert/strict';
import {engineModule} from './fixtures/engine.ts';
import {backup,emptyProgress,keyFor,next,questionFor,recordAnswer,validateBackup,type Progress,type Session} from '../src/core.ts';
import {freshAdventure,journeyForProgress,lessonKey,lessons,rewardCompletion,type Journey} from '../src/adventure.ts';
import {prepareSectionPlans,sectionKey} from '../src/learning/section-plan.ts';
import {makeRecallSession,makeRitualSession,moduleFinished} from '../src/learning/recall.ts';
import {finishRetention,memoryFor,rememberError,errorItems} from '../src/learning/retention.ts';
import {mapProgress} from '../src/learning/map-progress.ts';
const m=engineModule(),at='2026-11-12T12:00:00Z';
function map():Journey{return {version:1,moduleId:m.id,title:'Mapa',stages:[
 {id:'before',title:'Wcześniej',cat:'albert',illustration:'illustrations/test.svg',lessons:[{id:'first',title:'Pierwsza',intro:'Przykład',wordIds:[m.words[0].id],exerciseIds:[],ruleIds:[]}]},
 {id:'seven',title:'Siedem',cat:'maja',illustration:'illustrations/test.svg',adaptiveReviews:true,lessons:Array.from({length:7},(_,i)=>({id:`base-${i}`,title:`Lekcja ${i}`,intro:'Przykład',wordIds:[m.words[i+1].id],exerciseIds:[],ruleIds:[]}))},
]};}
function planned(){const j=map(),p=emptyProgress();prepareSectionPlans([j],p,()=>0);return {raw:j,j:journeyForProgress(j,p),p};}
function completed(p:Progress,s:Session,wrong=false){p.active=s;while(p.active){const q=questionFor([m],s.items[s.index]);const correct=recordAnswer(p,q,wrong?'wrong':q.answers[0]);if(correct===false)rememberError(p,s.items[s.index]);next(p);}finishRetention(p,s);}
function remembered(p:Progress){const item={key:keyFor(m,'word',m.words[0].id),moduleId:m.id,version:1,type:'word' as const,id:m.words[0].id,input:'text' as const};rememberError(p,item);p.encountered=[item.key];return item;}

test('7 + 2: zapisane losowanie jest stałe, sesja i kopia nie zmieniają kolejności',()=>{
 const {raw,j,p}=planned(),stage=j.stages[1],before=structuredClone(raw),stored=structuredClone(p);
 assert.equal(stage.lessons.length,9);assert.equal(stage.lessons.filter(l=>l.role==='recall').length,2);
 assert.deepEqual(stage.lessons.filter(l=>!l.role).map(l=>l.id),raw.stages[1].lessons.map(l=>l.id));
 prepareSectionPlans([raw],p,()=>.99);assert.deepEqual(p,stored);assert.deepEqual(raw,before);
 const reloaded=validateBackup(backup(p)).progress;assert.deepEqual(journeyForProgress(raw,reloaded),j);
 const other=emptyProgress();prepareSectionPlans([raw],other,()=>.99);assert.notDeepEqual(other.adventure!.sectionPlans,p.adventure!.sectionPlans);
 for(const plan of [p,other].map(v=>v.adventure!.sectionPlans![sectionKey(raw,raw.stages[1])])){assert.ok(plan.after[0]>=2);assert.ok(plan.after[1]<=6);assert.ok(plan.after[1]-plan.after[0]>=2);}
});
test('rozpoczęta lub ukończona sekcja pozostaje bez nowych wymagań i utraty gwiazdek',()=>{
 const j=map(),p=emptyProgress();p.adventure=freshAdventure();p.adventure.earned=31;p.adventure.completed[lessonKey(j,j.stages[1].lessons[0])]={at};
 const before=structuredClone(p);prepareSectionPlans([j],p);assert.deepEqual(p,before);assert.equal(journeyForProgress(j,p).stages[1].lessons.length,7);
 const {p:active,j:plannedMap}=planned();const item=remembered(active);const recall=plannedMap.stages[1].lessons.find(l=>l.role==='recall')!;
 active.active=makeRecallSession([m],[j],plannedMap,recall,active);assert.ok(active.active);assert.deepEqual(validateBackup(backup(active)).progress.active,active.active);assert.equal(item.key,active.active!.items[0].key);
});
test('dwie powtórki liczą się do ukończenia tylko nowej sekcji; nagroda nie nalicza się przy wznowieniu',()=>{
 const {raw,j,p}=planned();for(const {key} of lessons(raw))p.adventure!.completed[key]={at};
 assert.equal(mapProgress(raw,p).complete,false);assert.equal(mapProgress(raw,p,j.stages[1]).total,9);
 remembered(p);for(const l of j.stages[1].lessons.filter(l=>l.role==='recall')){const s=makeRecallSession([m],[raw],j,l,p)!;completed(p,s);assert.equal(rewardCompletion(p,s,[m]),3);assert.equal(rewardCompletion(p,s,[m]),0);}
 assert.equal(mapProgress(raw,p).complete,true);const before=structuredClone(p.adventure!.completed);rememberError(p,p.adventure!.memory![keyFor(m,'word',m.words[0].id)].item);assert.equal(mapProgress(raw,p).complete,true);assert.deepEqual(p.adventure!.completed,before);
});
test('powtórka wybiera wcześniejsze błędy tego kursu; bez błędów tylko poznany materiał',()=>{
 const {raw,j,p}=planned(),l=j.stages[1].lessons.find(l=>l.role==='recall')!,item=remembered(p);
 const future={...item,id:m.words[10].id,key:keyFor(m,'word',m.words[10].id)};rememberError(p,future);
 const foreign=engineModule('foreign','other-course');rememberError(p,{...item,moduleId:foreign.id,id:foreign.words[0].id,key:keyFor(foreign,'word',foreign.words[0].id)});
 let s=makeRecallSession([foreign,m],[raw],j,l,p)!;assert.deepEqual(s.items.map(i=>i.key),[item.key]);assert.equal(s.items[0].input,'text');
 p.adventure!.memory![item.key].correct=3;s=makeRecallSession([m],[raw],j,l,p)!;assert.deepEqual(s.items.map(i=>i.key),[item.key]);
 p.encountered=[];assert.equal(makeRecallSession([m],[raw],j,l,p),null);
});
test('wspólny licznik wymaga trzech osobnych sesji, poprawki nie liczą się, błąd zeruje',()=>{
 const {raw,j,p}=planned(),l=j.stages[1].lessons.find(l=>l.role==='recall')!,item=remembered(p);
 p.adventure!.stageReviews={[`${m.id}/before`]:{round:0,items:{[item.key]:{item,correct:0,due:1}}}};
 for(let n=1;n<=3;n++){const s=makeRecallSession([m],[raw],j,l,p)!;completed(p,s);assert.equal(memoryFor(p,item.key)!.correct,n);finishRetention(p,s);assert.equal(memoryFor(p,item.key)!.correct,n);assert.equal(p.adventure!.stageReviews![`${m.id}/before`].items[item.key].correct,n);}
 assert.equal(errorItems([m],p).length,0);
 const s=makeRecallSession([m],[raw],j,l,p)!;completed(p,s,true);assert.equal(memoryFor(p,item.key)!.correct,0);
 const retry=makeRecallSession([m],[raw],j,l,p)!;p.active=retry;const q=questionFor([m],retry.items[0]);recordAnswer(p,q,'wrong');rememberError(p,item);retry.phase='retry';recordAnswer(p,q,q.answers[0]);next(p);finishRetention(p,retry);assert.equal(memoryFor(p,item.key)!.correct,0);
});
test('otwarcie bierze poprzedni moduł, finał czeka na wszystkie mapy i nie miesza kursów',()=>{
 const {raw,j,p}=planned();assert.equal(makeRitualSession([m],[raw],m,p,'opening','text'),null);
 const earlier=engineModule('earlier',m.courseId,1),foreign=engineModule('foreign','foreign-course',1);p.encountered=[keyFor(earlier,'word',earlier.words[0].id),keyFor(foreign,'word',foreign.words[0].id),keyFor(m,'word',m.words[0].id)];
 const opening=makeRitualSession([m,earlier,foreign],[raw],m,p,'opening','text')!;assert.deepEqual(opening.items.map(i=>i.moduleId),[earlier.id]);p.active=opening;assert.doesNotThrow(()=>validateBackup(backup(p)));p.active=null;
 assert.equal(makeRitualSession([m],[raw],m,p,'finale','text'),null);for(const {key} of lessons(j))p.adventure!.completed[key]={at};
 assert.ok(moduleFinished([m],[raw],m,p));const final=makeRitualSession([m],[raw],m,p,'finale','text')!;assert.ok(final.items.every(i=>i.moduleId===m.id));completed(p,final);assert.equal(rewardCompletion(p,final,[m]),1);assert.equal(rewardCompletion(p,final,[m]),0);
 assert.equal(moduleFinished([m],[raw],{...m,journeyPaths:['one','two']},p),false);
});
test('walidacja odrzuca uszkodzone plany i liczniki bez zmiany kopii wejściowej',()=>{
 const {p}=planned();remembered(p);for(const change of [
 (v:Progress)=>{Object.values(v.adventure!.sectionPlans!)[0].after=[2,3];},
 (v:Progress)=>{Object.values(v.adventure!.sectionPlans!)[0].baseIds.pop();},
 (v:Progress)=>{Object.values(v.adventure!.memory!)[0].correct=4;},
 (v:Progress)=>{Object.values(v.adventure!.memory!)[0].item.key='other';},
 ]){const b=backup(p);change(b.progress);const before=structuredClone(b);assert.throws(()=>validateBackup(b));assert.deepEqual(b,before);}
});
