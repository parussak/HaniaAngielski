import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {foodModules as modules} from './materials.ts';
import {emptyProgress,makeSession,questionFor,recordAnswer,next,isCorrect,backup,validateBackup,type Exercise} from '../src/core.ts';
import {validateJourney,lessons,makeLessonSession,rewardCompletion,unlocked,stars} from '../src/adventure.ts';
import {vocabularyAssessment,vocabularyFullAnswer} from '../src/learning/vocabulary-answer.ts';
import {compileVocabulary} from '../src/materials/vocabulary.ts';
import {validateModules} from '../src/content-validation.ts';
const m=modules[0];
const journey=validateJourney(JSON.parse(readFileSync(new URL('../public/content/02-food/sciezka.json',import.meta.url),'utf8')),m);
function word(id:string){return questionFor(modules,{key:`${m.id}@1:word:${id}`,moduleId:m.id,version:1,type:'word',id,input:'text'});}

test('słówka: brak a/an jest poprawny z objaśnieniem; zły lub zbędny rodzajnik jest błędem',()=>{
  for(const [id,bare,full,wrong] of [['apple','apple','an apple','a apple'],['sandwich','sandwich','a sandwich','an sandwich'],['a-bottle-of-water','bottle of water','a bottle of water','an bottle of water']]){
    const q=word(id);
    assert.ok(isCorrect(q,bare));assert.ok(vocabularyAssessment(q,bare)?.note);
    assert.ok(isCorrect(q,full));assert.equal(vocabularyAssessment(q,full)?.note,null);
    assert.equal(vocabularyFullAnswer(q),full);assert.equal(isCorrect(q,wrong),false);
    assert.ok(vocabularyAssessment(q,wrong)?.note);
  }
  for(const id of ['water','fruit','chips']){
    const q=word(id);assert.ok(isCorrect(q,q.answers[0]));
    assert.equal(isCorrect(q,`a ${q.answers[0]}`),false);
    assert.ok(vocabularyAssessment(q,`an ${q.answers[0]}`)?.note);
  }
  assert.match(word('fruit').prompt,/ogólnie/);assert.equal(isCorrect(word('fruit'),'fruits'),false);
  assert.match(vocabularyAssessment(word('fruit'),'fruits')!.note!,/rodzaj/i);
});

test('reguła słówek nie przenosi się na gramatykę ani inne języki bez jawnych danych',()=>{
  const grammar:Exercise={...word('apple'),kind:'grammar',answers:['an apple']};
  assert.equal(isCorrect(grammar,'apple'),false);assert.ok(isCorrect(grammar,'an apple'));
  const french:Exercise={...word('apple'),article:undefined,answers:['une pomme']};
  assert.equal(isCorrect(french,'pomme'),false);assert.equal(isCorrect(french,'a une pomme'),false);
  assert.equal(isCorrect(word('apple'),'apples'),false);
});

test('dane rodzajnika przechodzą przez format znaczeń i są walidowane zamiast zgadywane',()=>{
  const data={version:2,entries:[{id:'apple',source:'Dane testowe',illustration:{symbol:'🍎',caption:'Owoc'},
    variants:{pl:{text:'jabłko'},en:{text:'apple'},fr:{text:'une pomme'}},
    articles:{en:{expected:'an',explanation:'Jedno jabłko; przed samogłoską an.'}}}]};
  const en=compileVocabulary(data,{language:'Angielski',languageCode:'en'});
  assert.deepEqual(en.words[0].article,data.entries[0].articles.en);
  assert.deepEqual(en.meanings[0].articles,data.entries[0].articles);
  assert.equal(compileVocabulary(data,{language:'Francuski',languageCode:'fr'}).words[0].article,undefined);
  for(const guidance of [{expected:'the',explanation:'Test'},{expected:'an',explanation:''},{explanation:'Brak expected'}]){
    const invalid=structuredClone(data);(invalid.entries[0] as any).articles.en=guidance;
    assert.throws(()=>compileVocabulary(invalid,{language:'Angielski',languageCode:'en'}));
    const legacy=structuredClone(m);legacy.words[0].article=guidance as any;assert.throws(()=>validateModules([legacy]));
  }
  const grammar=structuredClone(m);grammar.exercises.find(q=>q.kind==='grammar')!.article={expected:'an',explanation:'Test'};
  assert.throws(()=>validateModules([grammar]));
});

test('sesja kończy się po zadanym zestawie nawet przy wszystkich błędach; zapis przechowuje błędy',()=>{
  for(const mode of ['flashcards','quiz','grammar','review'] as const){
    const p=emptyProgress();p.difficult=modules[0].words.map(w=>`${m.id}@1:word:${w.id}`);
    p.active=makeSession(modules,m,mode,'text',false,p);const s=p.active,count=s.items.length;
    assert.ok(count>0);
    while(p.active){const q=questionFor(modules,s.items[s.index]);recordAnswer(p,q,'wrong');assert.equal(s.items.length,count);next(p);}
    assert.equal(s.attempts.length,count);assert.ok(s.attempts.every(a=>!a.first));
    assert.ok(s.items.every(i=>p.difficult.includes(i.key)));
    assert.deepEqual(validateBackup(backup(p)).progress,p);
  }
});

test('dowolna lekcja; każda pełna nowa powtórka +1, bez dublowania po kopii i bez nagrody za przerwanie',()=>{
  const p=emptyProgress(),lesson=lessons(journey).at(-1)!.lesson;
  assert.ok(unlocked(journey,lesson,p));
  function complete(){p.active=makeLessonSession(modules,journey,lesson,'text',p);const s=p.active;
    assert.equal(rewardCompletion(p,s),0);
    while(p.active){recordAnswer(p,questionFor(modules,s.items[s.index]),'wrong');next(p);}return s;
  }
  assert.equal(rewardCompletion(p,complete()),3);
  const firstCompletion=structuredClone(p.adventure!.completed);
  for(let i=0;i<2;i++){
    const s=complete();assert.equal(rewardCompletion(p,s),1);assert.equal(rewardCompletion(p,s),0);
    const restored=validateBackup(backup(p)).progress;
    assert.equal(rewardCompletion(restored,restored.sessions.at(-1)!),0);
    assert.equal(stars(restored),4+i);
  }
  assert.deepEqual(p.adventure!.completed,firstCompletion);assert.equal(stars(p),5);
  for(const flag of ['fixedLength','lessonRewarded'] as const){const invalid=backup(p);(invalid.progress.sessions.at(-1)! as any)[flag]=false;assert.throws(()=>validateBackup(invalid));}
  const old=structuredClone(p.sessions.at(-1)!);delete old.fixedLength;delete old.lessonRewarded;
  assert.equal(rewardCompletion(p,old),0);assert.equal(stars(p),5);
});
