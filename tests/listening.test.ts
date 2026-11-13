// D-58: listening. The speech module and the task selection are tested on synthetic data.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSpeaker,speechRate,type SpeechEnvironment} from '../src/speech.ts';
import {listeningTask,markListening,dictationWords} from '../src/learning/listening.ts';
import {engineModule} from './fixtures/engine.ts';
import {validateModules} from '../src/content-validation.ts';
import {backup,emptyProgress,isCorrect,keyFor,next,plainItem,questionFor,recordAnswer,validateBackup,type Item,type Module,type Session} from '../src/core.ts';
import {makeLessonSession,type Journey} from '../src/adventure.ts';
import {varyLesson} from '../src/learning/lesson-variety.ts';
import {vocabularyAssessment} from '../src/learning/vocabulary-answer.ts';
import {errorItems,rememberError} from '../src/learning/retention.ts';
import {foodModules} from './materials.ts';

/** A fake speech engine that records what it was asked to say. */
function device(voices:{lang:string;localService?:boolean}[],options:{online?:boolean;error?:string;throws?:boolean;stored?:string|null;brokenStorage?:boolean}={}){
 const spoken:{text:string;lang:string;rate:number;voice:unknown}[]=[],saved:Record<string,string>=options.stored?{'male-kroki:sluchanie':options.stored}:{};
 let cancelled=0,changes=0,online=options.online??true;
 class Utterance{lang='';rate=1;voice:unknown=null;onerror:((e:{error?:string})=>void)|null=null;text:string;constructor(text:string){this.text=text;}}
 const env:SpeechEnvironment={Utterance:Utterance as never,online:()=>online,changed:()=>{changes++;},
  storage:{getItem:key=>{if(options.brokenStorage)throw Error('blocked');return saved[key]??null;},setItem:(key,value)=>{if(options.brokenStorage)throw Error('blocked');saved[key]=value;}},
  synth:{getVoices:()=>voices,cancel:()=>{cancelled++;},speak:(u:never)=>{const x=u as unknown as Utterance;if(options.throws)throw Error('no audio');if(options.error){x.onerror?.({error:options.error});return;}spoken.push({text:x.text,lang:x.lang,rate:x.rate,voice:x.voice});}}};
 return {speaker:createSpeaker(env),spoken,saved,env,get cancelled(){return cancelled;},get changes(){return changes;},setOnline:(value:boolean)=>{online=value;}};
}
const english=[{lang:'pl-PL',localService:true},{lang:'en-GB',localService:true}];

test('mowa: głos musi pasować do języka kursu; brak syntezy lub głosu to po prostu brak dźwięku',()=>{
 const d=device(english);
 assert.equal(d.speaker.available('en'),true);assert.equal(d.speaker.available('en-US'),true);assert.equal(d.speaker.available('pl'),true);
 assert.equal(d.speaker.available('fr'),false);assert.equal(d.speaker.available(undefined),false);
 assert.equal(device([{lang:'pl-PL',localService:true}]).speaker.available('en'),false);assert.equal(device([]).speaker.available('en'),false);
 // No speech engine at all (old browser, server): never available, never throws.
 const none=createSpeaker({});assert.equal(none.available('en'),false);assert.equal(none.speak('apple','en'),false);assert.doesNotThrow(()=>none.stop());
 const broken=createSpeaker({Utterance:class{} as never,synth:{getVoices:()=>{throw Error('x');},speak(){},cancel(){}}});assert.equal(broken.available('en'),false);
});

test('mowa: odtwarzanie bez limitu, zwykłe i wolniejsze, głosem języka kursu',()=>{
 const d=device(english);
 assert.equal(d.speaker.speak('an apple','en'),true);assert.equal(d.speaker.speak('an apple','en',true),true);
 for(let i=0;i<20;i++)assert.equal(d.speaker.speak('an apple','en'),true);
 assert.equal(d.spoken.length,22);assert.deepEqual(d.spoken[0],{text:'an apple',lang:'en-GB',rate:speechRate.normal,voice:english[1]});
 assert.equal(d.spoken[1].rate,speechRate.slow);assert.ok(speechRate.slow<speechRate.normal&&speechRate.normal<=1);
 // A new utterance replaces the previous one instead of queueing behind it.
 assert.equal(d.cancelled,22);assert.equal(d.speaker.speak('  ','en'),false);assert.equal(d.speaker.speak('bonjour','fr'),false);assert.equal(d.spoken.length,22);
});

test('mowa offline: tylko głos zapisany na urządzeniu; po powrocie sieci dźwięk wraca',()=>{
 const d=device([{lang:'en-US',localService:false}],{online:false});
 assert.equal(d.speaker.available('en'),false);assert.equal(d.speaker.speak('apple','en'),false);
 d.setOnline(true);assert.equal(d.speaker.available('en'),true);
 const local=device([{lang:'en-US',localService:false},{lang:'en-GB',localService:true}],{online:false});
 assert.equal(local.speaker.available('en'),true);local.speaker.speak('apple','en');assert.equal(local.spoken[0].lang,'en-GB');
});

test('mowa: błąd odtwarzania wyłącza dźwięk do końca wizyty i zgłasza zmianę; przerwanie i brak pierwszego dotknięcia nie są błędem',()=>{
 for(const error of ['interrupted','canceled','not-allowed']){const d=device(english,{error});assert.equal(d.speaker.speak('apple','en'),true);assert.equal(d.speaker.available('en'),true);assert.equal(d.changes,0);}
 const failed=device(english,{error:'synthesis-failed'});failed.speaker.speak('apple','en');
 assert.equal(failed.speaker.available('en'),false);assert.equal(failed.changes,1);assert.equal(failed.speaker.speak('apple','en'),false);assert.equal(failed.changes,1);
 const thrown=device(english,{throws:true});assert.equal(thrown.speaker.speak('apple','en'),false);assert.equal(thrown.speaker.available('en'),false);assert.equal(thrown.changes,1);
});

test('ustawienie: przełącznik jest pamiętany na urządzeniu, poza postępami, i przywraca dźwięk po błędzie',()=>{
 const d=device(english);assert.equal(d.speaker.enabled(),true);
 d.speaker.setEnabled(false);assert.equal(d.speaker.enabled(),false);assert.equal(d.speaker.available('en'),false);assert.equal(d.speaker.speak('apple','en'),false);assert.deepEqual(d.saved,{'male-kroki:sluchanie':'off'});
 assert.equal(device(english,{stored:'off'}).speaker.enabled(),false);assert.equal(device(english,{stored:'on'}).speaker.available('en'),true);
 d.speaker.setEnabled(true);assert.equal(d.speaker.available('en'),true);assert.equal(d.saved['male-kroki:sluchanie'],'on');
 const failed=device(english,{error:'synthesis-failed'});failed.speaker.speak('apple','en');failed.speaker.setEnabled(true);assert.equal(failed.speaker.available('en'),true);
 // Blocked storage (private mode) keeps the default and still lets the switch work for this visit.
 const blocked=device(english,{brokenStorage:true});assert.equal(blocked.speaker.enabled(),true);assert.doesNotThrow(()=>blocked.speaker.setEnabled(false));assert.equal(blocked.speaker.available('en'),false);
 // The saved progress knows nothing about the switch.
 assert.doesNotMatch(JSON.stringify(backup(emptyProgress())),/sluchanie|listen/);
});

/** Engine module with a course language, one entry with an article and one long phrase. */
function spokenModule(id='listen-unit',courseId='listen-course',languageCode='en'):Module{
 const base=structuredClone(engineModule(id,courseId)) as Module&{languageCode?:string};
 base.languageCode=languageCode;base.words[0]={...base.words[0],back:'answer 0',article:{expected:'an',explanation:'Przed samogłoską mówimy an.'}};
 base.words[1]={...base.words[1],back:'this is a much longer phrase',answers:['this is a much longer phrase']};
 for(const q of base.exercises){if(q.wordId==='word-1')q.answers=['this is a much longer phrase'];q.options=q.options.map(o=>o==='answer 1'?'this is a much longer phrase':o);}
 for(const q of base.exercises)if(q.wordId==='word-0')q.article=base.words[0].article;
 return validateModules([base])[0];
}
const m=spokenModule(),modules=[m];
const word=(id:string,input:Item['input'],extra:Partial<Item>={}):Item=>({key:keyFor(m,'word',id),moduleId:m.id,version:1,type:'word',id,input,...extra});
const j:Journey={version:1,moduleId:m.id,title:'Mapa',stages:[{id:'one',title:'Etap',cat:'albert',illustration:'illustrations/test.svg',lessons:[{id:'words',title:'Słowa',intro:'',wordIds:['word-0','word-1','word-2','word-3','word-4','word-5'],exerciseIds:[],ruleIds:[]}]}]};
const started=()=>{const p=emptyProgress();return varyLesson(makeLessonSession(modules,j,j.stages[0].lessons[0],'mixed',p),modules,[j],j,j.stages[0].lessons[0],p);};

test('dobór: najwyżej dwa zwykłe słówka — jedno do wyboru, jedno do wpisania; nigdy pary, luki ani sceny',()=>{
 for(let run=0;run<30;run++){
  const s=started(),marked=s.items.filter(i=>i.listen);
  assert.ok(marked.length>=1&&marked.length<=2);assert.equal(new Set(marked.map(i=>i.input)).size,marked.length);
  assert.ok(marked.every(i=>i.type==='word'&&!i.pairGroup&&!i.gapGroup&&!i.sceneGroup&&!i.presentation&&listeningTask(modules,i)));
  assert.equal(s.items.length,6);assert.equal(new Set(s.items.map(i=>i.key)).size,6);
 }
 // Marking again gives the same result; it never adds, removes or reorders tasks.
 const s=started(),before=structuredClone(s.items);markListening(modules,s);assert.deepEqual(s.items,before);
 const only=markListening(modules,{items:[word('word-2','choice',{pairGroup:keyFor(m,'word','word-2')}),word('word-3','choice',{pairGroup:keyFor(m,'word','word-2')}),word('word-1','text')]});
 assert.deepEqual(only.items.map(i=>i.listen),[undefined,undefined,undefined]);
});

test('zadanie: mówimy pełną odpowiedź; wybór pokazuje znaczenia zamiast pisanej odpowiedzi; długie hasło nie jest dyktandem',()=>{
 const choose=listeningTask(modules,word('word-2','choice',{listen:true}))!;
 assert.equal(choose.text,'answer 2');assert.equal(choose.language,'en');
 const q=questionFor(modules,word('word-2','choice'));assert.deepEqual(choose.choices!.map(c=>c.answer),q.options);
 assert.deepEqual(choose.choices!.map(c=>c.label),q.options.map(o=>m.words.find(w=>w.back===o.replace(/^an /,''))!.front));
 assert.ok(choose.choices!.every(c=>!c.label.includes('answer')));
 // The article is spoken, so "an" can be heard.
 assert.equal(listeningTask(modules,word('word-0','text',{listen:true}))!.text,'an answer 0');
 assert.equal('this is a much longer phrase'.split(' ').length>dictationWords,true);
 assert.equal(listeningTask(modules,word('word-1','text',{listen:true})),undefined);assert.ok(listeningTask(modules,word('word-1','choice',{listen:true})));
 // Without the mark, without a course language or for a non-vocabulary task there is nothing to say.
 assert.equal(listeningTask(modules,word('word-2','choice')),undefined);
 assert.equal(listeningTask([engineModule()],{...word('word-2','choice',{listen:true}),moduleId:'engine-unit',key:'engine-unit@1:word:word-2'}),undefined);
 assert.equal(listeningTask(modules,{key:keyFor(m,'exercise','grammar-0'),moduleId:m.id,version:1,type:'exercise',id:'grammar-0',input:'choice',listen:true}),undefined);
 assert.equal(listeningTask(modules,{...word('missing','choice',{listen:true})}),undefined);
});

test('ocena: słuchanie nie zmienia pytania, odpowiedzi ani zasad a/an',()=>{
 for(const id of ['word-0','word-2'])for(const input of ['choice','text'] as const){
  const plain=questionFor(modules,word(id,input)),heard=questionFor(modules,word(id,input,{listen:true}));assert.deepEqual(heard,plain);
 }
 const q=questionFor(modules,word('word-0','text',{listen:true}));
 assert.equal(isCorrect(q,'an answer 0'),true);assert.equal(isCorrect(q,'answer 0'),true);assert.equal(isCorrect(q,'a answer 0'),false);assert.equal(isCorrect(q,'wrong'),false);
 assert.equal(vocabularyAssessment(q,'answer 0')!.note,'Przed samogłoską mówimy an.');assert.equal(vocabularyAssessment(q,'an answer 0')!.note,null);
});

test('zapis i wznowienie: znacznik przechodzi kopię v1, błąd trafia do powtórek bez znacznika, zepsuty znacznik jest odrzucany',()=>{
 const p=emptyProgress();p.active=started();const s=p.active;s.index=s.items.findIndex(i=>i.listen);const item=s.items[s.index],left=s.items.length-s.index;
 assert.equal(recordAnswer(p,questionFor(modules,item),'wrong'),false);rememberError(p,item);
 const restored=validateBackup(JSON.parse(JSON.stringify(backup(p)))).progress;
 assert.deepEqual(restored,p);assert.equal(backup(p).version,1);assert.equal(restored.active!.phase,'feedback');assert.equal(restored.active!.items[restored.active!.index].listen,true);
 assert.equal(plainItem(item).listen,undefined);assert.ok(errorItems(modules,p).every(i=>i.listen===undefined));assert.ok(errorItems(modules,p).some(i=>i.key===item.key));
 // The same session on a device without sound: every task still has its ordinary question and can be finished.
 const quiet=restored.active!;quiet.phase='retry';
 while(restored.active){const current=quiet.items[quiet.index],q=questionFor(modules,current);assert.ok(q.prompt.startsWith('Hasło'));recordAnswer(restored,q,q.answers[0]);next(restored);}
 assert.equal(restored.sessions.length,1);assert.equal(restored.sessions[0].attempts.length,left);assert.equal(restored.sessions[0].attempts[0].first,false);
 const bad=(edit:(s:Session)=>void)=>{const copy=backup(p);edit(copy.progress.active!);assert.throws(()=>validateBackup(copy));};
 bad(s=>{(s.items[s.index] as any).listen=false;});
 bad(s=>{s.items[s.index].pairGroup=s.items[s.index].key;});
 bad(s=>{const i=s.items[s.index];Object.assign(i,{type:'exercise',id:'grammar-0',key:keyFor(m,'exercise','grammar-0')});});
 const old=JSON.parse(readFileSync(new URL('./fixtures/backup-v1.json',import.meta.url),'utf8'));
 assert.ok(!JSON.stringify(old).includes('"listen"'));assert.doesNotThrow(()=>validateBackup(old));
});

test('każdy kurs: język mowy pochodzi z kursu, a kod słuchania nie zna żadnego modułu',()=>{
 const fr=spokenModule('lecon-1','francais-test','fr'),task=listeningTask([fr],{key:keyFor(fr,'word','word-2'),moduleId:fr.id,version:1,type:'word',id:'word-2',input:'text',listen:true})!;
 assert.equal(task.language,'fr');
 const d=device([{lang:'fr-FR',localService:true}]);assert.equal(d.speaker.speak(task.text,task.language),true);assert.equal(d.spoken[0].lang,'fr-FR');assert.equal(d.speaker.available('en'),false);
 for(const file of ['../src/speech.ts','../src/learning/listening.ts'])assert.doesNotMatch(readFileSync(new URL(file,import.meta.url),'utf8'),/unit-2-food|02-food|angielski|apple|en-GB|en-US/);
 // No sound file and no network address: the PWA package does not grow.
 assert.doesNotMatch(readFileSync(new URL('../src/speech.ts',import.meta.url),'utf8'),/https?:|\.mp3|\.ogg|\.wav|fetch\(/);
});

test('Food: lekcje słówek dostają słuchanie w języku kursu, a hasła mają znaczenia do wyboru',()=>{
 const food=foodModules[0],journey:Journey=JSON.parse(readFileSync(new URL('../public/content/02-food/sciezka.json',import.meta.url),'utf8')),lesson=journey.stages[0].lessons[0];
 assert.equal(food.languageCode,'en');
 for(let run=0;run<10;run++){
  const p=emptyProgress(),s=varyLesson(makeLessonSession(foodModules,journey,lesson,'mixed',p),foodModules,[journey],journey,lesson,p),marked=s.items.filter(i=>i.listen);
  assert.ok(marked.length>=1&&marked.length<=2);
  for(const item of marked){const task=listeningTask(foodModules,item)!;assert.equal(task.language,'en');assert.ok(isCorrect(questionFor(foodModules,item),task.text));if(task.choices)assert.ok(task.choices.every(c=>food.words.some(w=>w.front===c.label)));}
 }
});
