import {test} from 'node:test';
import assert from 'node:assert/strict';
import {engineModule} from './fixtures/engine.ts';
import {courseFixture} from './fixtures/course-materials.ts';
import {emptyProgress,questionFor,recordAnswer,next,backup,validateBackup} from '../src/core.ts';
import {makeLessonSession,type Journey} from '../src/adventure.ts';
import {varyLesson} from '../src/learning/lesson-variety.ts';
import {answerOnBoard,boardItems,placeGap,gapTokens} from '../src/learning/boards.ts';
import {AppState} from '../src/app/state.ts';
import {restoreNavigation,saveNavigation} from '../src/app/navigation.ts';
import {courseContext} from '../src/views/courses.ts';
const course=courseFixture().courses[0],m=engineModule('board-unit',course.id);
const j:Journey={version:1,moduleId:m.id,title:'Mapa',stages:[{id:'stage',title:'Etap',cat:'albert',illustration:'illustrations/test.svg',lessons:[{id:'words',title:'Słowa',intro:'',wordIds:m.words.slice(0,5).map(w=>w.id),exerciseIds:[],ruleIds:[]},{id:'gaps',title:'Luki',intro:'',wordIds:[],exerciseIds:m.exercises.filter(q=>q.kind==='grammar').slice(0,6).map(q=>q.id),ruleIds:[]}]}]};
function active(index=0){const p=emptyProgress(),l=j.stages[0].lessons[index];p.active=varyLesson(makeLessonSession([m],j,l,'mixed',p),[m],[j],j,l,p);return p;}

test('luka ocenia przy wstawieniu, zostawia błąd i pozwala przenieść lub odłożyć słowo bez dodatkowych prób',()=>{
 const p=active(1),s=p.active!,group=boardItems(s),[a,b]=group,answer=questionFor([m],b).answers[0],tokens=gapTokens([m],s);
 assert.equal(placeGap(p,[m],[j],a.key,answer),false);assert.equal(s.gapPlacements![a.key],answer);assert.equal(s.attempts.length,1);
 assert.deepEqual(validateBackup(backup(p)).progress,p);
 placeGap(p,[m],[j],a.key);assert.equal(s.gapSelection,answer);
 placeGap(p,[m],[j],'',answer);assert.equal(s.gapPlacements![a.key],undefined);assert.equal(s.attempts.length,1);
 placeGap(p,[m],[j],a.key,answer);assert.equal(placeGap(p,[m],[j],b.key,answer),true);
 assert.equal(s.gapPlacements![a.key],undefined);assert.equal(s.gapPlacements![b.key],answer);assert.deepEqual(gapTokens([m],s),tokens);
 assert.equal(placeGap(p,[m],[j],a.key,questionFor([m],a).answers[0]),true);assert.equal(s.boardSummary,true);
 assert.deepEqual(validateBackup(backup(p)).progress,p);
});
test('błąd w parze nie otwiera wyjaśnienia ani następnego pytania; cała plansza kończy się jednym podsumowaniem',()=>{
 const p=active(),s=p.active!,group=boardItems(s),key=group[0].key;
 assert.equal(answerOnBoard(p,[m],[j],key,'wrong'),false);assert.equal(s.index,0);assert.equal(s.phase,'question');assert.equal(s.boardSummary,undefined);assert.equal(s.attempts[0].first,false);assert.equal(p.adventure!.memory![key].correct,0);
 for(const item of [...group].reverse()){assert.equal(answerOnBoard(p,[m],[j],item.key,questionFor([m],item).answers[0]),true);assert.ok(p.active);}
 assert.equal(s.boardSummary,true);assert.equal(s.phase,'feedback');assert.equal(s.items.length,5);assert.equal(s.attempts.length,3);assert.equal(s.attempts.find(a=>a.key===key)!.corrected,true);assert.deepEqual(validateBackup(backup(p)).progress,p);
});
test('dwie luki mają wspólny bank, zapisują rozmieszczenie i nie gubią wyniku po wznowieniu',()=>{
 const p=active(1),s=p.active!,group=boardItems(s);assert.equal(group.length,2);assert.ok(group.every(i=>i.gapGroup));
 s.gapSelection=questionFor([m],group[0]).answers[0];s.gapPlacements=Object.fromEntries(group.map(i=>[i.key,questionFor([m],i).answers[0]]));
 assert.deepEqual(validateBackup(backup(p)).progress,p);
 for(const item of group)answerOnBoard(p,[m],[j],item.key,s.gapPlacements![item.key]);
 assert.equal(s.boardSummary,true);assert.deepEqual(validateBackup(backup(p)).progress,p);
 const bad=backup(p);bad.progress.active!.gapPlacements!['foreign']='x';assert.throws(()=>validateBackup(bad));
});
test('dawna para już pominięta po błędzie nie powoduje skoku poza planszę ani utraty sesji',()=>{
 const p=active(),s=p.active!;recordAnswer(p,questionFor([m],s.items[0]),'wrong');next(p);
 for(const item of boardItems(s).filter(i=>s.items.indexOf(i)>=s.index))answerOnBoard(p,[m],[j],item.key,questionFor([m],item).answers[0]);
 assert.equal(p.active,s);assert.equal(s.boardSummary,true);assert.equal(s.attempts[0].first,false);
});
function state(){const s=new AppState();s.modules=[m];s.courses=[course];s.selected=m;s.selectedCourseId=course.id;s.journeys=[j];s.ready=true;return s;}
test('historia zapisuje ekrany, nie odpowiedzi, i przywraca lekcję tylko właściwemu kontu',t=>{
 const originalHistory=Object.getOwnPropertyDescriptor(globalThis,'history'),originalLocation=Object.getOwnPropertyDescriptor(globalThis,'location');const entries:unknown[]=[];
 const h={state:null as unknown,replaceState(v:unknown){this.state=v;},pushState(v:unknown){this.state=v;entries.push(v);}};
 Object.defineProperty(globalThis,'history',{configurable:true,value:h});Object.defineProperty(globalThis,'location',{configurable:true,value:{pathname:'/app/',search:''}});
 t.after(()=>{if(originalHistory)Object.defineProperty(globalThis,'history',originalHistory);else Reflect.deleteProperty(globalThis,'history');if(originalLocation)Object.defineProperty(globalThis,'location',originalLocation);else Reflect.deleteProperty(globalThis,'location');});
 const s=state();saveNavigation(s);s.screen='map';saveNavigation(s);assert.equal(entries.length,1);saveNavigation(s);assert.equal(entries.length,1);
 s.screen='lesson-intro';s.introLessonId='words';saveNavigation(s);const stored=structuredClone(h.state),other=state();restoreNavigation(other,stored);assert.equal(other.screen,'lesson-intro');assert.equal(other.introLessonId,'words');assert.equal(other.selected.id,m.id);
 const before=structuredClone(other.progress);restoreNavigation(other,{...(stored as object),owner:'someone-else'});assert.equal(other.screen,'home');assert.deepEqual(other.progress,before);saveNavigation(other);
});
test('ramka kursu jest tylko na stronie startowej',()=>{const s=state();assert.match(courseContext(s),/course-context/);for(const screen of ['journeys','map','lesson-intro','study','summary','house','course-practice'] as const){s.screen=screen;assert.equal(courseContext(s),'');}});
