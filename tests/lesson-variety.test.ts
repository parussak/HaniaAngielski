import {test} from 'node:test';
import assert from 'node:assert/strict';
import {engineModule} from './fixtures/engine.ts';
import {emptyProgress,keyFor,backup,validateBackup,questionFor,recordAnswer,next,type Session} from '../src/core.ts';
import {makeLessonSession,lessonKey,freshAdventure,rewardCompletion,type Journey} from '../src/adventure.ts';
import {varyLesson} from '../src/learning/lesson-variety.ts';
import {followingLesson,lessonContext,legendarySession} from '../src/learning/lesson-flow.ts';
import {rememberError} from '../src/learning/retention.ts';
import {recordStageError,makeStageReviewSession} from '../src/stage-review.ts';
const m=engineModule(),words=m.words.slice(0,6).map(w=>w.id),grammar=m.exercises.filter(q=>q.kind==='grammar').slice(0,6).map(q=>q.id);
const j:Journey={version:1,moduleId:m.id,title:'Mapa',stages:[{id:'one',title:'Etap',cat:'albert',illustration:'illustrations/test.svg',lessons:[
 {id:'words',title:'Słowa',intro:'',wordIds:words,exerciseIds:[],ruleIds:[]},
 {id:'grammar',title:'Gramatyka',intro:'',wordIds:[],exerciseIds:grammar,ruleIds:[]},
]}]};
const varied=(p=emptyProgress(),index=0)=>varyLesson(makeLessonSession([m],j,j.stages[0].lessons[index],'mixed',p),[m],[j],j,j.stages[0].lessons[index],p);
test('pary i wpisywanie zachowują wszystkie bazowe zadania i nie zmieniają postępów',()=>{
 const p=emptyProgress(),before=structuredClone(p),s=varied(p);assert.deepEqual(p,before);
 assert.deepEqual(new Set(s.items.map(i=>i.id)),new Set(words));assert.equal(s.items.filter(i=>i.pairGroup).length,3);assert.ok(s.items.some(i=>i.input==='text'));assert.ok(s.items.some(i=>i.input==='choice'));
 p.active=s;s.pairSelection=s.items[2].key;assert.deepEqual(validateBackup(backup(p)).progress,p);
 const broken=backup(p);broken.progress.active!.pairSelection='foreign';assert.throws(()=>validateBackup(broken));
 const badGroup=backup(p);badGroup.progress.active!.items[0].pairGroup='foreign';assert.throws(()=>validateBackup(badGroup));
});
test('gramatyka dostaje tylko poznane wcześniejsze słowa, bez zmiany oryginalnej lekcji',()=>{
 const p=emptyProgress();p.encountered=[keyFor(m,'word',words[0]),keyFor(m,'word',words[1]),keyFor(m,'word',m.words[11].id)];
 const before=structuredClone(j),s=varied(p,1);
 assert.equal(s.items.length,8);assert.ok(grammar.every(id=>s.items.some(i=>i.id===id)));assert.deepEqual(new Set(s.items.filter(i=>i.type==='word').map(i=>i.id)),new Set(words.slice(0,2)));assert.deepEqual(j,before);
 assert.equal(varied(emptyProgress(),1).items.length,6);
});
test('bank odpowiedzi i jego wybór przechodzą kopię, bez zmiany formy źródła',()=>{
 const s=varied(emptyProgress(),1);const item=s.items.find(i=>i.presentation==='bank')!;assert.ok(item);s.index=s.items.indexOf(item);s.draftAnswer=questionFor([m],item).options[1];
 const p=emptyProgress();p.active=s;assert.deepEqual(validateBackup(backup(p)).progress,p);
 const bad=backup(p);bad.progress.active!.items[bad.progress.active!.index].input='text';assert.throws(()=>validateBackup(bad));
});
test('błąd w dobieraniu par trafia do zwykłej powtórki z wpisywaniem i zachowuje klucz słowa',()=>{
 const p=emptyProgress(),s=varied(p);p.active=s;const item=s.items[0];recordAnswer(p,questionFor([m],item),'wrong');rememberError(p,item);recordStageError(p,s,item,[j]);
 const review=makeStageReviewSession([m],j,j.stages[0],'text',p)!;assert.equal(review.items[0].key,item.key);assert.equal(review.items[0].input,'text');assert.equal(review.items[0].pairGroup,undefined);assert.equal(p.adventure!.memory![item.key].item.pairGroup,undefined);
 p.active=review;assert.doesNotThrow(()=>validateBackup(backup(p)));
});
test('kolejna lekcja przechodzi między mapami tego kursu, a na końcu nie tworzy nowego obowiązku',()=>{
 const p=emptyProgress();p.adventure=freshAdventure();const s=varied(p);s.completedAt='2026-11-12T12:00:00Z';
 p.adventure.completed[lessonKey(j,j.stages[0].lessons[0])]={at:s.completedAt};
 assert.equal(followingLesson([m],[j],p,s)!.lesson.id,'grammar');
 p.adventure.completed[lessonKey(j,j.stages[0].lessons[1])]={at:s.completedAt};const other={...structuredClone(j),id:'other'};
 assert.equal(followingLesson([m],[j,other],p,s)!.journey.id,'other');
 for(const l of other.stages[0].lessons)p.adventure.completed[lessonKey(other,l)]={at:s.completedAt};assert.equal(followingLesson([m],[j,other],p,s),undefined);
 assert.equal(lessonContext([j],p,s)!.lesson.id,'words');
});
test('poziom legendarny zachowuje ukończenie i daje tylko jedną gwiazdkę za nową pełną sesję',()=>{
 const p=emptyProgress();p.adventure=freshAdventure();p.adventure.earned=23;const s=varied(p);s.legendary=true;
 const key=s.lesson!.id,old={at:'2026-11-01T12:00:00Z'};p.adventure.completed[key]=old;p.active=s;assert.doesNotThrow(()=>validateBackup(backup(p)));
 while(p.active){recordAnswer(p,questionFor([m],s.items[s.index]),questionFor([m],s.items[s.index]).answers[0]);next(p);}
 assert.equal(rewardCompletion(p,s,[m]),1);assert.equal(rewardCompletion(p,s,[m]),0);assert.equal(p.adventure.earned,23);assert.equal(p.adventure.courseHomes![m.courseId!].earned,1);assert.deepEqual(p.adventure.completed[key],old);assert.doesNotThrow(()=>validateBackup(backup(p)));
});
test('legendarna powtórka bierze cały ukończony zestaw, także dynamiczny, bez kopiowania nagród i odpowiedzi',()=>{
 const p=emptyProgress(),s=varied(p);assert.equal(legendarySession([m],s),null);p.active=s;
 while(p.active){recordAnswer(p,questionFor([m],s.items[s.index]),questionFor([m],s.items[s.index]).answers[0]);next(p);}
 s.lessonRewarded=true;s.retentionCounted=true;s.recall={stageId:`${m.id}/one`};s.lesson!.id=`${m.id}/one-recall-1`;s.answerMode='text';for(const i of s.items){delete i.pairGroup;delete i.presentation;i.input='text';}const before=structuredClone(s),replay=legendarySession([m],s)!;
 assert.notEqual(replay.id,s.id);assert.deepEqual(replay.items,s.items);assert.deepEqual(replay.recall,s.recall);assert.equal(replay.legendary,true);assert.equal(replay.lessonRewarded,undefined);assert.equal(replay.retentionCounted,undefined);assert.equal(replay.completedAt,null);assert.deepEqual(replay.attempts,[]);assert.deepEqual(s,before);
 assert.equal(legendarySession([],s),null);
 p.active=replay;assert.doesNotThrow(()=>validateBackup(backup(p)));
 const legacy=structuredClone(s);delete legacy.fixedLength;legacy.items.push(structuredClone(legacy.items[0]));legacy.index=legacy.items.length;assert.equal(legendarySession([m],legacy)!.items.length,s.items.length);
});
