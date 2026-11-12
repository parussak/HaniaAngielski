import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyProgress,keyFor,backup,validateBackup,type Progress} from '../src/core.ts';
import {engineModule} from './fixtures/engine.ts';
import {makeTrainingSession,mapTrainingPool,validateTrainingPlan} from '../src/learning/training.ts';
import {freshAdventure,lessonKey,type Journey} from '../src/adventure.ts';
import {mapProgress,reviewProgressText} from '../src/learning/map-progress.ts';
import {getNextStep} from '../src/next-step.ts';
import {journeyView} from '../src/adventure-view.ts';

const m=engineModule(),j:Journey={version:1,moduleId:m.id,id:'warmup-map',title:'Mapa testowa',stages:[{id:'stage',title:'Etap',cat:'albert',illustration:'illustrations/test.svg',lessons:[
 {id:'one',title:'Nowe słowa 1',intro:'Przykład',wordIds:m.words.slice(0,6).map(w=>w.id),exerciseIds:[],ruleIds:[]},
 {id:'two',title:'Nowe słowa 2',intro:'Przykład',wordIds:m.words.slice(6).map(w=>w.id),exerciseIds:[],ruleIds:[]},
 {id:'warm',title:'Dawny trening',intro:'Przykład',role:'training',wordIds:[],exerciseIds:[],ruleIds:[]},
 {id:'future',title:'Późniejsza gramatyka',intro:'Przykład',wordIds:[],exerciseIds:m.exercises.filter(q=>q.kind==='grammar').slice(0,6).map(q=>q.id),ruleIds:[]},
]}]};
function sample():Progress{
 const p=emptyProgress();p.adventure=freshAdventure();p.adventure.earned=17;
 p.encountered=[keyFor(m,'word',m.words[0].id),keyFor(m,'word',m.words[1].id),keyFor(m,'exercise',j.stages[0].lessons[3].exerciseIds[0])];
 const key=p.encountered[0];p.adventure.stageReviews={[`${m.id}/${j.id}/stage`]:{round:0,items:{[key]:{item:{key,moduleId:m.id,id:m.words[0].id,version:1,type:'word',input:'text'},correct:0,due:1}}}};
 return p;
}
test('rozgrzewka pierwszej mapy korzysta z poznanych wcześniejszych lekcji, bez późniejszych treści',()=>{
 const p=sample();assert.doesNotThrow(()=>validateTrainingPlan([m],[j]));
 const before=structuredClone(p),pool=mapTrainingPool([m],[j],j,p,j.stages[0].lessons[2]);
 assert.deepEqual(new Set(pool.map(v=>v.item.id)),new Set(m.words.slice(0,2).map(w=>w.id)));
 assert.equal(pool.find(v=>v.item.id===m.words[0].id)!.difficult,true);
 const s=makeTrainingSession([m],m,p,'text',{journey:j,journeys:[j],lesson:j.stages[0].lessons[2]})!;
 assert.equal(s.lesson!.id,`${m.id}/${j.id}/warm`);assert.equal(s.lesson!.title,'Kocia rozgrzewka');assert.equal(s.fixedLength,true);
 assert.equal(s.items.length,2);assert.deepEqual(p,before);
});
test('rozgrzewka jest wymagana na mapie, ale nowe błędy nie cofają jej zaliczenia ani sukcesu',()=>{
 const p=sample();for(const l of j.stages[0].lessons.filter(l=>l.role!=='training'))p.adventure!.completed[lessonKey(j,l)]={at:'2026-11-12T12:00:00Z'};
 assert.equal(mapProgress(j,p).complete,false);assert.equal(getNextStep([m],[j],p).kind,'lesson');
 p.adventure!.completed[lessonKey(j,j.stages[0].lessons[2])]={at:'2026-11-12T12:00:00Z'};
 const before=structuredClone(p);assert.equal(mapProgress(j,p).complete,true);assert.match(reviewProgressText(mapProgress(j,p)),/Gratulacje/);
 assert.equal(getNextStep([m],[j],p).kind,'practice');assert.deepEqual(validateBackup(backup(p)).progress,p);assert.deepEqual(p,before);
});
test('wybór rozgrzewki jednego modułu nie miesza kursów ani materiału innych modułów',()=>{
 const other=engineModule('other-unit',m.courseId),foreign=engineModule('foreign-unit','foreign-course'),p=sample();
 p.encountered!.push(keyFor(other,'word',other.words[0].id),keyFor(foreign,'word',foreign.words[0].id));
 const scoped=makeTrainingSession([foreign,m,other],m,p,'text',undefined,true)!;
 assert.ok(scoped.items.every(i=>i.moduleId===m.id));
 const course=makeTrainingSession([foreign,m,other],m,p,'text')!;assert.ok(course.items.some(i=>i.moduleId===other.id));assert.ok(course.items.every(i=>i.moduleId!==foreign.id));
});
test('ukończona mapa z błędami i niedoczytanym archiwum nie pokazuje zaległości',t=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'document');Object.defineProperty(globalThis,'document',{configurable:true,value:{baseURI:'https://example.test/app/'}});
 t.after(()=>{if(original)Object.defineProperty(globalThis,'document',original);else Reflect.deleteProperty(globalThis,'document');});
 const p=sample();for(const l of j.stages[0].lessons)p.adventure!.completed[lessonKey(j,l)]={at:'2026-11-12T12:00:00Z'};
 p.adventure!.reviewArchiveHead='a'.repeat(64);const before=structuredClone(p),html=journeyView(j,p,()=>'',m.courseId);
 assert.match(html,/Mapa ukończona!/);assert.match(html,/is-mastered/);assert.doesNotMatch(html,/has-pending|do utrwalenia|zaległ|stage-review-step|3 samodzielnych/);assert.deepEqual(p,before);
});
