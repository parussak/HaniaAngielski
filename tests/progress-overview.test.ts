import {test} from 'node:test';
import assert from 'node:assert/strict';
import {engineModule} from './fixtures/engine.ts';
import {emptyProgress,makeSession,questionFor,recordAnswer,next,keyFor,backup,validateBackup,type Module,type Progress} from '../src/core.ts';
import {courseProgressOverview} from '../src/learning/progress-overview.ts';
import {journeyKey,lessons,type Journey} from '../src/adventure.ts';
import {AppState} from '../src/app/state.ts';
import {progressView} from '../src/views/progress.ts';
import {courseFixture} from './fixtures/course-materials.ts';
const m=engineModule('en-unit','english-book'),fr=engineModule('fr-unit','french-book'),all=[m,fr];
const now=new Date(2026,10,13,12),stamp=(day:number)=>new Date(2026,10,day,10).toISOString();
const map=(moduleId=m.id,id='one'):Journey=>({version:1,moduleId,id,title:'Mapa testowa',stages:[{id:'stage',title:'Etap',cat:'albert',illustration:'illustrations/test.svg',lessons:[{id:'lesson',title:'Lekcja',intro:'',wordIds:[m.words[0].id],exerciseIds:[],ruleIds:[]}]}]});
function session(p:Progress,module=m,day=13,answer='answer 0',corrected=false){
 const s=makeSession(all,module,'flashcards','text',false,p);p.active=s;s.items=[{key:keyFor(module,'word',module.words[0].id),moduleId:module.id,type:'word',id:module.words[0].id,version:1,input:'text'}];
 recordAnswer(p,questionFor(all,s.items[0]),answer);if(corrected){s.phase='retry';recordAnswer(p,questionFor(all,s.items[0]),'answer 0');}next(p);s.completedAt=stamp(day);return s;
}
const overview=(p:Progress,course='english-book',older:Progress['sessions']=[])=>courseProgressOverview(all,[map(),map(m.id,'two'),map(fr.id)],[],p,course,older,now);

test('postęp map jest osobny od błędów, powtórek i zakupów; odczyt nie zmienia kopii',()=>{
 const p=emptyProgress(),j=map();p.adventure={version:1,earned:30,purchases:{pillow:{cost:6,slot:null}},completed:{[lessons(j)[0].key]:{at:stamp(9)}}};p.difficult=[keyFor(m,'word',m.words[0].id)];
 p.adventure.courseHomes={'english-book':{earned:30,purchases:structuredClone(p.adventure.purchases)}};
 session(p,m,12,'wrong');session(p,m,13,'wrong',true);const before=structuredClone(p),v=overview(p);
 assert.equal(v.done,1);assert.equal(v.total,2);assert.equal(v.completeMaps,1);assert.equal(v.maps[0].percent,100);assert.equal(v.maps[1].percent,0);assert.equal(v.recentSuccess.corrections,1);assert.equal(v.recentSuccess.returns,0);
 assert.deepEqual(p,before);assert.deepEqual(validateBackup(backup(p)).progress,p);
 const state=new AppState();Object.assign(state,{modules:all,courses:courseFixture().courses,selectedCourseId:'english-book',selected:m,journeys:[j,map(m.id,'two')] ,progress:p});
 const html=progressView(state,now);assert.match(html,/30 ★/);assert.match(html,/Do wydania: 24 ★/);assert.match(html,/1 z 1/);assert.deepEqual(p,before);
});

test('tydzień liczy lokalne dni od poniedziałku, pomija puste próby i przyszłość, rozdziela kursy',()=>{
 const p=emptyProgress();session(p,m,9,'wrong');session(p,m,9);session(p,m,12,'');session(p,m,15);session(p,fr,10);session(p,m,8);
 const v=overview(p);assert.equal(v.activeDays,1);assert.equal(v.weeklySessions,2);assert.equal(v.week[0].date.getDay(),1);assert.equal(v.week[0].active,true);assert.equal(v.week[4].today,true);assert.equal(v.week[6].future,true);
 assert.equal(overview(p,'french-book').activeDays,1);assert.equal(overview(p,'french-book').totalSessions,1);
});

test('archiwum nie dubluje sum, a wczytane daty uzupełniają tydzień bez zmiany wyników',()=>{
 const p=emptyProgress(),old=session(p,m,9);p.sessions=[];p.history={head:null,sessions:7,items:{[old.items[0].key]:{total:5,correct:3}},modules:{[m.id]:{sessions:5,total:5,correct:3}},courses:{'english-book':{sessions:2,total:2,correct:2}}};
 session(p,m,13);const before=structuredClone(p),v=overview(p,'english-book',[old,old,p.sessions[0]]);
 assert.equal(v.totalSessions,8);assert.equal(v.sessions.length,2);assert.equal(v.activeDays,2);assert.equal(v.recentSuccess.returns,1);assert.equal(overview(p).activeDays,1);assert.deepEqual(p,before);
});

test('sukcesy nie uznają poprawki za pierwsze trafienie, słowa z quizu nie dublują fiszki',()=>{
 const p=emptyProgress();session(p,m,9,'wrong',true);let v=overview(p);assert.equal(v.recentSuccess.returns,0);assert.equal(v.recentSuccess.words,1);
 session(p,m,13);v=overview(p);assert.equal(v.recentSuccess.returns,1);assert.equal(v.recentSuccess.words,1);
 const s=makeSession(all,m,'quiz','text',false,p),q=m.exercises[0];p.active=s;s.items=[{key:keyFor(m,'exercise',q.id),moduleId:m.id,type:'exercise',id:q.id,version:1,input:'text'}];recordAnswer(p,q,q.answers[0]);next(p);assert.equal(overview(p).recentSuccess.words,1);
});

test('pusty kurs i awaria mapy nie udają ukończenia, mapy o tych samych nazwach nie mieszają kluczy',()=>{
 const p=emptyProgress(),v=overview(p);assert.equal(v.done,0);assert.equal(v.completeMaps,0);assert.equal(v.recentSuccess.words,0);
 const j=map();p.adventure={version:1,earned:0,purchases:{},completed:{[lessons(j)[0].key]:{at:stamp(9)}}};
 const broken=courseProgressOverview(all,[j],[{moduleId:m.id,path:'missing.json'}],p,'english-book',[],now);assert.equal(broken.incompleteLibrary,true);assert.equal(broken.maps[0].complete,true);
 assert.notEqual(journeyKey(j),journeyKey(map(fr.id)));
});

test('samo pominięcie, również w archiwum, nie daje przećwiczonego słowa ani trafnego powrotu',()=>{
 const p=emptyProgress(),skipped=session(p,m,9,'');p.history={head:null,sessions:1,items:{[skipped.items[0].key]:{total:1,correct:0}},modules:{[m.id]:{sessions:1,total:1,correct:0}}};p.sessions=[];
 assert.equal(overview(p).recentSuccess.words,0);session(p,m,13);assert.equal(overview(p).recentSuccess.returns,0);assert.equal(overview(p).recentSuccess.words,1);
});

test('rozpoczęta sesja innego kursu nie ukrywa następnego kroku wybranego kursu',()=>{
 const p=emptyProgress();p.active=makeSession(all,m,'flashcards','text',false,p);const before=structuredClone(p),state=new AppState();
 Object.assign(state,{modules:all,courses:courseFixture().courses,selectedCourseId:'french-book',selected:fr,journeys:[map(),map(fr.id)],progress:p});
 assert.match(progressView(state,now),/data-action="next-step"/);assert.deepEqual(p,before);
});
