// D-53: dialogue scenes with several gaps. All data is synthetic: the mechanics know no course or module.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sceneEntry,sceneModule,sceneJourney} from './fixtures/scenes.ts';
import {compileScene,continueScene,groupScenes,sceneGapIds,sceneView} from '../src/learning/scenes.ts';
import {validateModules} from '../src/content-validation.ts';
import {backup,emptyProgress,keyFor,makeSession,next,questionFor,recordAnswer,validateBackup,type Progress,type Session} from '../src/core.ts';
import {makeLessonSession,validateJourney,freshAdventure,rewardCompletion} from '../src/adventure.ts';
import {varyLesson} from '../src/learning/lesson-variety.ts';
import {legendarySession} from '../src/learning/lesson-flow.ts';
import {errorItems,rememberError} from '../src/learning/retention.ts';
import {retryAnswer} from '../src/learning/retry.ts';

const m=sceneModule(),modules=[m],j=validateJourney(sceneJourney(),m),lesson=j.stages[0].lessons[1];
const gapIds=['talk--one','talk--two','talk--three','talk--four'];
const started=(p=emptyProgress())=>varyLesson(makeLessonSession(modules,j,lesson,'mixed',p),modules,[j],j,lesson,p);
test('powrót do błędnej linijki z podsumowania nie wymaga powtarzania poprawnych luk',()=>{
 const p=emptyProgress();p.active=started(p);const s=atScene(p),first=s.items[s.index];
 answer(p,'wrong');next(p);
 while(!s.boardSummary)answer(p,questionFor(modules,s.items[s.index]).answers[0]);
 const count=s.attempts.length,initial=structuredClone(s.attempts.find(a=>a.key===first.key));
 assert.equal(retryAnswer(p,first.key),true);assert.equal(s.phase,'retry');assert.equal(s.boardSummary,undefined);
 answer(p,questionFor(modules,s.items[s.index]).answers[0]);assert.equal(s.boardSummary,true);assert.equal(s.attempts.length,count);
 const corrected=s.attempts.find(a=>a.key===first.key)!;assert.equal(corrected.first,false);assert.equal(corrected.answer,initial!.answer);assert.equal(corrected.corrected,true);
 assert.deepEqual(validateBackup(backup(p)).progress,p);
});
/** Answers the current task the way the app does: a correct scene gap continues without a break. */
function answer(p:Progress,value:string){const s=p.active!,item=s.items[s.index],ok=recordAnswer(p,questionFor(modules,item),value);if(ok===false)rememberError(p,item);else continueScene(p);return ok;}
function atScene(p:Progress){const s=p.active!;while(!s.items[s.index].sceneGroup){recordAnswer(p,questionFor(modules,s.items[s.index]),questionFor(modules,s.items[s.index]).answers[0]);next(p);}return s;}

test('format: scena staje się zwykłymi zadaniami, po jednym na lukę, ze stałymi identyfikatorami',()=>{
 const {scene,exercises}=compileScene(sceneEntry());
 assert.deepEqual(scene.gapIds,gapIds);assert.deepEqual(exercises.map(q=>q.id),gapIds);
 assert.deepEqual(exercises.map(q=>q.scene),[{id:'talk',gap:0,input:'bank'},{id:'talk',gap:1,input:'text'},{id:'talk',gap:2,input:'bank'},{id:'talk',gap:3,input:'text'}]);
 assert.equal(scene.lines.flatMap(l=>l.text.match(/___/g)??[]).length,4);
 // Outside the scene every gap is a short dialogue with exactly one gap and its neighbours filled in.
 for(const q of exercises){assert.equal(q.kind,'dialogue');assert.equal(q.dialogue!.length,2);assert.equal(q.dialogue!.flatMap(l=>l.text.match(/___/g)??[]).length,1);}
 assert.deepEqual(exercises[0].dialogue,[{speaker:'Ala',text:'Alpha ___ talk?'},{speaker:'Olek',text:'Beta duo and gamma trio.'}]);
 assert.deepEqual(exercises[2].dialogue,[{speaker:'Ala',text:'Alpha uno talk?'},{speaker:'Olek',text:'Beta duo and gamma ___.'}]);
 assert.deepEqual(exercises[3].dialogue,[{speaker:'Ala',text:'No gap here.'},{speaker:'Olek',text:'Delta ___!'}]);
 assert.equal(m.scenes!.length,2);assert.ok(m.exercises.some(q=>q.id==='shop--four'));
});

test('format: zepsuta scena jest odrzucana z opisem błędu',()=>{
 const broken=(change:(e:any)=>void,pattern:RegExp)=>{const e:any=structuredClone(sceneEntry());change(e);assert.throws(()=>sceneModule('scene-unit','scene-course',[e]),pattern);};
 broken(e=>e.gaps.pop(),/liczba luk/);
 broken(e=>e.dialogue[3].text='Delta!',/liczba luk/);
 broken(e=>{e.dialogue=[{speaker:'Ala',text:'Only ___.'},{speaker:'Olek',text:'Yes.'}];e.gaps=e.gaps.slice(0,1);},/2–6 luk/);
 broken(e=>{e.dialogue[2].text='___ ___ ___';e.gaps=[...e.gaps,...e.gaps.slice(0,3).map((g:any,i:number)=>({...g,id:`more-${i}`}))];},/2–6 luk/);
 broken(e=>e.gaps[1].id='one',/powtórzony identyfikator luki/);
 broken(e=>e.gaps[0].id='Zła Nazwa',/każda luka wymaga/);
 broken(e=>e.gaps[0].input='speech',/każda luka wymaga/);
 broken(e=>e.gaps[0].answers=[],/każda luka wymaga/);
 broken(e=>delete e.source,/brak źródła/);
 broken(e=>delete e.title,/tytuł/);
 broken(e=>e.dialogue=e.dialogue.slice(0,1),/2–8 kwestii/);
 // The compiled gaps pass the same checks as every exercise.
 broken(e=>delete e.gaps[0].options,/niepoprawne zadanie \(scene-unit\/talk--one\)/);
 broken(e=>e.gaps[1].options=['nope','never'],/dokładnie jeden poprawny wariant/);
 broken(e=>e.gaps[2].options=['trio','Trio'],/dokładnie jeden poprawny wariant/);
 broken(e=>delete e.gaps[3].explanation,/niepoprawne zadanie/);
 broken(e=>e.gaps[0].ruleId='missing-rule',/brak reguły/);
 broken(e=>e.requires=['other-unit'],/niepoprawne zadanie/);
 assert.throws(()=>sceneModule('scene-unit','scene-course',[sceneEntry('talk'),sceneEntry('talk')]),/powtórzony identyfikator/);
 // A scene script that no longer matches its exercises is rejected as well.
 const drift:any=structuredClone(m);drift.scenes[0].gapIds.pop();assert.throws(()=>validateModules([drift]),/liczba luk|brak zadania/);
 const orphan:any=structuredClone(m);orphan.scenes=[];assert.throws(()=>validateModules([orphan]),/nieistniejącą scenę/);
});

test('mapa: lekcja wymienia luki sceny w exerciseIds — całą scenę albo wcale, w limicie zadań; odczyt nie zmienia mapy',()=>{
 assert.deepEqual(lesson.exerciseIds,['single-talk',...gapIds]);assert.deepEqual(sceneGapIds(m,['talk']),gapIds);
 // The validated map equals the file: nothing is expanded behind the author's back.
 assert.deepEqual(j,sceneJourney());assert.deepEqual(validateJourney(j,m),j);
 const change=(edit:(l:any)=>void)=>{const raw:any=sceneJourney();edit(raw.stages[0].lessons[1]);return ()=>validateJourney(raw,m);};
 assert.throws(change(l=>l.exerciseIds.push('missing--one')),/Niepoprawna mapa/);
 assert.throws(change(l=>l.exerciseIds.pop()),/Niepoprawna mapa/);
 assert.throws(change(l=>l.exerciseIds=['single-talk','talk--three']),/Niepoprawna mapa/);
 // 2 words + 1 dialogue + 8 gaps = 11 tasks: over the limit of 10.
 assert.throws(change(l=>l.exerciseIds.push(...sceneGapIds(m,['shop']))),/Niepoprawna mapa/);
 assert.doesNotThrow(change(l=>{l.wordIds=['word-4'];l.exerciseIds.push(...sceneGapIds(m,['shop']));}));
 // The gaps may be listed in any order; the session follows the script.
 assert.doesNotThrow(change(l=>l.exerciseIds.reverse()));
 // The current content of an updated lesson (D-52) can carry a scene too.
 const updated=validateJourney((()=>{const raw:any=sceneJourney();const l=raw.stages[0].lessons[1];l.update={edition:2,title:l.title,intro:'',wordIds:['word-4','word-5'],exerciseIds:sceneGapIds(m,['shop']),ruleIds:[]};return raw;})(),m);
 assert.deepEqual(updated.stages[0].lessons[1].update!.exerciseIds,['shop--one','shop--two','shop--three','shop--four']);
 // A standalone story can be shorter than six tasks, including on a named map.
 const standalone:any=sceneJourney();standalone.id='story-map';standalone.stages[0].lessons=[{...standalone.stages[0].lessons[1],wordIds:[],exerciseIds:gapIds}];assert.doesNotThrow(()=>validateJourney(standalone,m));
 const tooShort=structuredClone(standalone);tooShort.stages[0].lessons[0].exerciseIds=['single-talk'];assert.throws(()=>validateJourney(tooShort,m));
});

test('sesja: luki sceny są razem, w kolejności rozmowy, na końcu lekcji i ze sposobem odpowiedzi z danych',()=>{
 for(let run=0;run<20;run++){
  const s=started(),scene=s.items.filter(i=>i.sceneGroup);
  assert.equal(s.items.length,7);assert.deepEqual(s.items.slice(-4).map(i=>i.id),gapIds);assert.deepEqual(scene.map(i=>i.id),gapIds);
  assert.deepEqual(scene.map(i=>i.input),['choice','text','choice','text']);
  assert.ok(scene.every(i=>i.sceneGroup===scene[0].key&&!i.pairGroup&&!i.gapGroup&&!i.presentation&&!i.options));
  assert.deepEqual(new Set(s.items.slice(0,3).map(i=>i.id)),new Set(['word-4','word-5','single-talk']));
  assert.ok(s.items.slice(0,3).every(i=>!i.sceneGroup));
 }
 // Supplementary known material never pushes a lesson with a scene over 10 tasks.
 const p=emptyProgress();p.encountered=m.words.slice(0,4).map(w=>keyFor(m,'word',w.id));
 const full=validateJourney((()=>{const raw:any=sceneJourney();raw.stages[0].lessons[1].wordIds=[];raw.stages[0].lessons[1].exerciseIds=['single-talk',...sceneGapIds(m,['shop','talk']).reverse()];return raw;})(),m),l=full.stages[0].lessons[1];
 const big=varyLesson(makeLessonSession(modules,full,l,'mixed',p),modules,[full],full,l,p);
 assert.ok(big.items.length<=10);assert.equal(new Set(big.items.filter(i=>i.sceneGroup).map(i=>i.sceneGroup)).size,2);assert.deepEqual(big.items.slice(-8).map(i=>i.id),[...gapIds,'shop--one','shop--two','shop--three','shop--four']);
 // A lone gap is not a scene: it stays an ordinary single-gap dialogue.
 const alone={items:[{key:keyFor(m,'exercise','talk--two'),moduleId:m.id,version:1,type:'exercise' as const,id:'talk--two',input:'choice' as const}]};
 assert.equal(groupScenes(modules,alone).items[0].sceneGroup,undefined);assert.equal(alone.items[0].input,'choice');
});

test('ocena: każda luka osobno; poprawna prowadzi dalej bez przerwy, błąd nie wydłuża sesji i trafia do powtórek',()=>{
 const p=emptyProgress();p.adventure=freshAdventure();p.active=started(p);const s=atScene(p),length=s.items.length,first=s.index;
 assert.deepEqual(sceneView(modules,s)!.position,0);
 // Gap 1 (bank), correct: no feedback step, the next gap is on screen.
 assert.equal(answer(p,'uno'),true);assert.equal(s.index,first+1);assert.equal(s.phase,'question');assert.equal(s.boardSummary,undefined);
 // Gap 2 (typing), wrong: feedback with the explanation; the session keeps its length.
 assert.equal(answer(p,'wrong'),false);assert.equal(s.index,first+1);assert.equal(s.phase,'feedback');assert.equal(s.lastCorrect,false);assert.equal(s.items.length,length);
 assert.equal(questionFor(modules,s.items[s.index]).explanation,'Wyjaśnienie drugiej luki.');
 s.phase='retry';s.lastCorrect=null;assert.equal(answer(p,' DUO '),true);assert.equal(s.index,first+2);assert.equal(s.phase,'question');
 // Gap 3 wrong and skipped with "Dalej": the conversation goes on.
 assert.equal(answer(p,'nope'),false);next(p);assert.equal(s.index,first+3);assert.equal(sceneView(modules,s)!.position,3);
 // Gap 4 accepts every listed answer; the last gap closes the scene with one summary.
 assert.equal(answer(p,'4'),true);assert.equal(s.index,first+3);assert.equal(s.phase,'feedback');assert.equal(s.boardSummary,true);
 assert.deepEqual(validateBackup(backup(p)).progress,p);
 delete s.boardSummary;next(p);assert.equal(p.active,null);assert.equal(rewardCompletion(p,s,modules),3);
 const scored=Object.fromEntries(s.attempts.filter(a=>a.key.includes('talk--')).map(a=>[a.key.split(':').at(-1),[a.first,a.corrected]]));
 assert.deepEqual(scored,{'talk--one':[true,false],'talk--two':[false,true],'talk--three':[false,false],'talk--four':[true,false]});
 assert.equal(s.items.length,length);assert.equal(new Set(s.items.map(i=>i.key)).size,length);
 // Both mistakes wait in the error queue as plain items, without the scene grouping.
 const errors=errorItems(modules,p).filter(i=>i.id.startsWith('talk--'));
 assert.deepEqual(errors.map(i=>i.id).sort(),['talk--three','talk--two']);assert.ok(errors.every(i=>!i.sceneGroup));
 // In a review the gap comes back alone, as a short dialogue answered by typing.
 const review=makeSession(modules,m,'review','text',false,p),item=review.items.find(i=>i.id==='talk--three')!;
 assert.ok(item);assert.equal(item.input,'text');assert.equal(item.sceneGroup,undefined);assert.equal(sceneView(modules,{...review,index:review.items.indexOf(item)}),undefined);
 assert.equal(questionFor(modules,item).dialogue!.length,2);
});

test('zapis: środek sceny przechodzi kopię v1 i wznawia tę samą lukę; uszkodzona grupa jest odrzucana',()=>{
 const p=emptyProgress();p.active=started(p);const s=atScene(p);answer(p,'uno');answer(p,'wrong');
 const restored=validateBackup(JSON.parse(JSON.stringify(backup(p)))).progress;
 assert.deepEqual(restored,p);assert.equal(backup(p).version,1);
 const view=sceneView(modules,restored.active!)!;assert.equal(view.position,1);assert.equal(view.scene.id,'talk');assert.equal(restored.active!.phase,'feedback');
 const bad=(edit:(s:Session)=>void)=>{const copy=backup(p);edit(copy.progress.active!);assert.throws(()=>validateBackup(copy));};
 bad(s=>s.items.at(-1)!.sceneGroup='foreign');
 bad(s=>delete s.items.at(-4)!.sceneGroup);
 bad(s=>{const [a]=s.items.splice(-4,1);s.items.splice(0,0,a);s.index++;});
 bad(s=>s.items.find(i=>i.type==='word')!.sceneGroup=s.items.at(-4)!.key);
 bad(s=>{(s.items.at(-1)! as any).presentation='bank';});
 // A session saved before scenes existed has no scene fields and stays valid.
 const old=JSON.parse(readFileSync(new URL('./fixtures/backup-v1.json',import.meta.url),'utf8'));
 assert.ok(!JSON.stringify(old).includes('sceneGroup'));assert.doesNotThrow(()=>validateBackup(structuredClone(old)));
 assert.equal(s.items.filter(i=>i.sceneGroup).length,4);
});

test('treść może się zmienić: poprawiona kwestia zostaje sceną, a zdjęta luka zamienia resztę w zwykłe dialogi',()=>{
 const p=emptyProgress();p.active=started(p);const s=atScene(p);
 const fixed=sceneModule('scene-unit','scene-course',[(()=>{const e=sceneEntry();e.dialogue[2].text='Poprawiona kwestia.';return e;})(),sceneEntry('shop')]);
 assert.equal(sceneView([fixed],s)!.scene.lines[2].text,'Poprawiona kwestia.');
 const shorter:any=structuredClone(m);const scene=shorter.scenes[0];scene.gapIds.pop();scene.lines.pop();
 assert.equal(sceneView([shorter],s),undefined);assert.equal(questionFor([shorter],s.items[s.index]).dialogue!.length,2);
});

test('Rozmówki: scena wchodzi do sesji cała albo wcale, do limitu 10 zadań',()=>{
 for(let run=0;run<30;run++){
  const s=makeSession(modules,m,'dialogue','choice',false,emptyProgress());
  assert.equal(s.items.length,9);assert.ok(s.items.every(i=>questionFor(modules,i).kind==='dialogue'));
  for(const id of ['talk','shop']){
   const group=s.items.filter(i=>i.id.startsWith(id+'--')),start=s.items.indexOf(group[0]);
   assert.deepEqual(group.map(i=>i.id),['one','two','three','four'].map(g=>`${id}--${g}`));assert.deepEqual(s.items.slice(start,start+4),group);
   assert.ok(group.every(i=>i.sceneGroup===group[0].key));assert.deepEqual(group.map(i=>i.input),['choice','text','choice','text']);
  }
  assert.equal(s.items.find(i=>i.id==='single-talk')!.sceneGroup,undefined);
 }
 // Three scenes (12 gaps) do not fit: two whole scenes and the single dialogue are taken, never a part of the third.
 const three=sceneModule('scene-unit','scene-course',[sceneEntry('talk'),sceneEntry('shop'),sceneEntry('cafe')]);
 for(let run=0;run<30;run++){const s=makeSession([three],three,'dialogue','text',false,emptyProgress());assert.equal(s.items.length,9);assert.equal(s.items.filter(i=>i.sceneGroup).length,8);assert.doesNotThrow(()=>{const p=emptyProgress();p.active=s;validateBackup(backup(p));});}
});

test('Poziom legendarny i powtórka ukończonej lekcji dostają tę samą scenę z aktualnej treści',()=>{
 const p=emptyProgress();p.adventure=freshAdventure();p.active=started(p);const s=p.active;
 while(p.active){recordAnswer(p,questionFor(modules,s.items[s.index]),questionFor(modules,s.items[s.index]).answers[0]);next(p);}
 assert.equal(rewardCompletion(p,s,modules),3);
 const legendary=legendarySession(modules,s,{journey:j,lesson,progress:p})!;varyLesson(legendary,modules,[j],j,lesson,p,false);
 assert.equal(legendary.legendary,true);assert.deepEqual(legendary.items.slice(-4).map(i=>i.id),gapIds);assert.ok(legendary.items.slice(-4).every(i=>i.sceneGroup));
 p.active=legendary;assert.doesNotThrow(()=>validateBackup(backup(p)));
});

test('mechanika nie zależy od kursu: ta sama scena działa w innym kursie i module',()=>{
 const other=sceneModule('lecon-3','francais-test',[sceneEntry('cafe','lecon-3')]),journey=validateJourney((()=>{const raw:any=sceneJourney('lecon-3');raw.stages[0].lessons[1].exerciseIds=['single-talk','cafe--one','cafe--two','cafe--three','cafe--four'];return raw;})(),other),l=journey.stages[0].lessons[1];
 const p=emptyProgress(),s=varyLesson(makeLessonSession([m,other],journey,l,'mixed',p),[m,other],[journey],journey,l,p);
 assert.deepEqual(s.items.filter(i=>i.sceneGroup).map(i=>i.key),['one','two','three','four'].map(g=>`lecon-3@1:exercise:cafe--${g}`));
 s.index=s.items.findIndex(i=>i.sceneGroup);assert.equal(sceneView([m,other],s)!.scene.title,'Rozmowa cafe');
 // Source files of the mechanics name no module, course or textbook phrase.
 for(const file of ['../src/learning/scenes.ts','../src/views/lesson-activities.ts'])assert.doesNotMatch(readFileSync(new URL(file,import.meta.url),'utf8'),/unit-2-food|02-food|angielski-hani|pizza|Kelner/);
});
