// Zgłaszanie problemu z zadania: czysta logika (wypowiedzi na ekranie, kategorie, dokument do Firestore).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sceneModule,sceneJourney} from './fixtures/scenes.ts';
import {readingModule,readingJourney} from './fixtures/readings.ts';
import {engineModule} from './fixtures/engine.ts';
import {emptyProgress,type Module} from '../src/learning/model.ts';
import {validateJourney} from '../src/learning/journey-validation.ts';
import {makeLessonSession} from '../src/learning/lesson-session.ts';
import {makeSession,recordAnswer,next} from '../src/learning/session.ts';
import {questionFor} from '../src/learning/questions.ts';
import {readingView} from '../src/learning/readings.ts';
import {markListening} from '../src/learning/listening.ts';
import {buildReport,categoriesFor,planCategory,readingReportable,reportDocument,reportSubject,reportableUtterances,screenUtterances,parseReports,type PlaybackRecord} from '../src/learning/problem-report.ts';

const english=(m:Module):Module=>({...m,languageCode:'en'});
const scenes=english(sceneModule()),sceneModules=[scenes],sceneMap=validateJourney(sceneJourney(),scenes);
function atScene(){
 const p=emptyProgress();p.active=makeLessonSession(sceneModules,sceneMap,sceneMap.stages[0].lessons[1],'mixed',p);const s=p.active;
 while(!s.items[s.index].sceneGroup){const q=questionFor(sceneModules,s.items[s.index]);recordAnswer(p,q,q.answers[0]);next(p);}
 return s;
}
/** The finished conversation: every line is heard with its gaps filled in (as on the scene summary). */
function finishedScene(){const s=atScene();s.boardSummary=true;return s;}
const nothing={canSpeak:()=>true,recordingOf:()=>undefined,last:undefined};

test('kategorie: dwie pierwsze tylko przy materiale z dźwiękiem, w kolejności z zadania',()=>{
 assert.deepEqual(categoriesFor(true),['no-sound','unclear','wrong-content','other']);
 assert.deepEqual(categoriesFor(false),['wrong-content','other']);
});

test('scena: każda kwestia jest osobną wypowiedzią z numerem i mówiącym, tak jak jest odtwarzana',()=>{
 const found=screenUtterances(sceneModules,finishedScene());
 assert.deepEqual(found.map(u=>[u.line,u.speaker,u.text]),[[1,'Ala','Alpha uno talk?'],[2,'Olek','Beta duo and gamma trio.'],[3,'Ala','No gap here.'],[4,'Olek','Delta quattro!']]);
 assert.ok(found.every(u=>u.language==='en'));
});

test('scena w trakcie: kwestia z otwartą luką nie jest odtwarzana, więc nie jest wypowiedzią do zgłoszenia',()=>{
 const s=atScene();assert.deepEqual(screenUtterances(sceneModules,s),[]);
 const p=emptyProgress();p.active=s;const q=questionFor(sceneModules,s.items[s.index]);recordAnswer(p,q,q.answers[0]);next(p);
 assert.deepEqual(screenUtterances(sceneModules,s).map(u=>[u.line,u.text]),[[1,'Alpha uno talk?']]);
});

test('scena: druga kwestia niewyraźna wskazuje właśnie drugą kwestię, a nie całą lekcję',()=>{
 const all=screenUtterances(sceneModules,finishedScene());
 const last:PlaybackRecord={text:all[1].text,language:'en',via:'recording',recordingFile:`clips/${'c'.repeat(64)}.ogg`};
 const {list,lastIndex}=reportableUtterances(all,{canSpeak:()=>true,recordingOf:(text)=>text===all[1].text?last.recordingFile:undefined,last});
 assert.equal(lastIndex,1);
 const report=buildReport({id:'a'.repeat(32),now:new Date('2026-11-24T10:00:00Z'),category:'unclear',subject:reportSubject(sceneModules,finishedScene())!,utterance:list[lastIndex!]});
 assert.equal(report.audio?.line,2);assert.equal(report.audio?.speaker,'Olek');assert.equal(report.audio?.text,'Beta duo and gamma trio.');
 assert.equal(report.audio?.recordingFile,last.recordingFile);assert.equal(report.audio?.playback,'recording');
});

test('nagrania i sposób odtwarzania zapisujemy tylko wtedy, gdy je znamy',()=>{
 const all=screenUtterances(sceneModules,finishedScene());
 const {list,lastIndex}=reportableUtterances(all,nothing);
 assert.equal(lastIndex,undefined);
 assert.ok(list.every(u=>u.recordingFile===undefined&&u.playback===undefined));
 const report=buildReport({id:'b'.repeat(32),now:new Date(),category:'no-sound',subject:reportSubject(sceneModules,finishedScene())!,utterance:list[0]});
 assert.deepEqual(Object.keys(report.audio!).sort(),['language','line','speaker','text']);
});

test('ostatnia próba odtworzenia, która się nie udała, nadal jest zgłaszalna, nawet gdy urządzenie już milczy',()=>{
 const all=screenUtterances(sceneModules,finishedScene());
 const last:PlaybackRecord={text:all[3].text,language:'en',via:'none',recordingFailed:true};
 const {list,lastIndex}=reportableUtterances(all,{canSpeak:()=>false,recordingOf:()=>undefined,last});
 assert.deepEqual(list.map(u=>u.line),[4]);assert.equal(lastIndex,0);
 assert.equal(list[0].playback,'none');assert.equal(list[0].recordingFailed,true);
});

test('wypowiedzi, których urządzenie nie odtwarza, nie są oferowane jako audio',()=>{
 const {list}=reportableUtterances(screenUtterances(sceneModules,finishedScene()),{canSpeak:()=>false,recordingOf:()=>undefined,last:undefined});
 assert.deepEqual(list,[]);
});

test('zadanie ze słuchu zgłasza wypowiedź słówka, a zwykłe zadanie nie ma wypowiedzi',()=>{
 const m=english(engineModule());
 const p=emptyProgress();p.active=markListening([m],makeSession([m],m,'flashcards','text',false,p));
 const s=p.active;const listening=s.items.findIndex(i=>i.listen);assert.ok(listening>=0);s.index=listening;
 const found=screenUtterances([m],s);assert.equal(found.length,1);assert.equal(found[0].language,'en');assert.equal(found[0].line,undefined);
 const plain=s.items.findIndex(i=>!i.listen);assert.ok(plain>=0);s.index=plain;assert.deepEqual(screenUtterances([m],s),[]);
});

test('czytanka: oferuje zdania widoczne do tej pory, nie całą czytankę',()=>{
 const m=english(readingModule()),mods=[m],j=validateJourney(readingJourney(),m);
 const p=emptyProgress();p.active=makeLessonSession(mods,j,j.stages[0].lessons[1],'mixed',p);const s=p.active;
 const first=readingView(mods,s,1)!.visible,later=readingView(mods,s,99)!.visible;
 assert.ok(first>=1&&later>=first);
 assert.equal(readingReportable(mods,s,1).length,first);
 const shownLater=readingReportable(mods,s,99);assert.equal(shownLater.length,later);
 assert.deepEqual(shownLater.map(u=>u.line),Array.from({length:later},(_,i)=>i+1));
});

test('planer: kategoria dźwiękowa z jedną wypowiedzią wysyła od razu, z kilkoma pyta, którą',()=>{
 assert.deepEqual(planCategory('wrong-content',3,undefined),{kind:'send'});
 assert.deepEqual(planCategory('other',3,undefined),{kind:'ask-comment'});
 assert.deepEqual(planCategory('no-sound',1,undefined),{kind:'send',utterance:0});
 assert.deepEqual(planCategory('unclear',4,undefined),{kind:'ask-utterance'});
 assert.deepEqual(planCategory('unclear',0,undefined),{kind:'send'});
});

test('zgłoszenie bez audio nie zawiera pola audio, a komentarz i fragment są przycięte',()=>{
 const subject={course:'kurs',module:'mod',item:'mod@1:word:x',excerpt:'z'.repeat(400)};
 const report=buildReport({id:'c'.repeat(32),now:new Date('2026-11-24T10:00:00Z'),category:'other',comment:`  ${'k'.repeat(900)}  `,subject});
 assert.equal('audio' in report,false);assert.equal(report.comment!.length,500);assert.equal(report.excerpt.length,160);
 const withoutComment=buildReport({id:'d'.repeat(32),now:new Date(),category:'wrong-content',comment:'   ',subject});
 assert.equal('comment' in withoutComment,false);
});

test('dokument do Firestore ma tylko dozwolone pola, bez undefined i bez danych sesji',()=>{
 const report=buildReport({id:'e'.repeat(32),now:new Date('2026-11-24T10:00:00Z'),category:'unclear',subject:{module:'mod',item:'k',excerpt:'e'},utterance:{text:'hi',language:'en',label:'x',line:1,speaker:'Ala'}});
 const doc=reportDocument(report,'user-1');
 assert.equal(doc.uid,'user-1');assert.equal(doc.format,1);assert.ok(doc.createdAt instanceof Date);
 assert.ok(Object.values(doc).every(v=>v!==undefined));assert.equal('course' in doc,false);
 const rules=readFileSync(new URL('../firestore.rules',import.meta.url),'utf8'),block=rules.slice(rules.indexOf('match /zgloszenia/')),allowed=[...block.match(/data\.keys\(\)\.hasOnly\(\[([^\]]+)\]\)/)![1].matchAll(/'(\w+)'/g)].map(m=>m[1]);
 for(const key of Object.keys(doc))assert.ok(allowed.includes(key),`reguły nie znają pola ${key}`);
 const audioAllowed=[...block.match(/audio\.keys\(\)\.hasOnly\(\[([^\]]+)\]\)/)![1].matchAll(/'(\w+)'/g)].map(m=>m[1]);
 for(const key of Object.keys(doc.audio!))assert.ok(audioAllowed.includes(key),`reguły nie znają pola audio.${key}`);
});

test('odczyt kolejki z urządzenia odrzuca uszkodzone wpisy, a poprawne zachowuje',()=>{
 const good=buildReport({id:'f'.repeat(32),now:new Date('2026-11-24T10:00:00Z'),category:'other',comment:'ok',subject:{module:'m',item:'i',excerpt:'e'}});
 assert.deepEqual(parseReports([good,{id:'x'},null,'tekst',{...good,id:'g'.repeat(32),category:'nieznana'}]),[good]);
 assert.deepEqual(parseReports(undefined),[]);assert.deepEqual(parseReports({}),[]);
});
