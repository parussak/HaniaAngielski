import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {modules} from './materials.ts';
import {requiresChoice,inputFor,emptyProgress,makeSession,questionFor,keyFor,type AnswerMode,type Item} from '../src/core.ts';
import {validateJourney,makeLessonSession} from '../src/adventure.ts';
import {recordStageError,makeStageReviewSession} from '../src/stage-review.ts';
import {answerHint,isCorrect} from '../src/learning/questions.ts';
const m=modules[0],j=validateJourney(JSON.parse(readFileSync(new URL('../public/content/02-food/sciezka.json',import.meta.url),'utf8')),m);

test('luka wymaga fragmentu zgodnego z zadaniem, nie całego zdania; wskazówka nie zamienia wyboru ani fiszek',()=>{
  for(const [id,fragment,sentence] of [
    ['g-container-water','bottle','a bottle of water'],
    ['g-lot-water','a lot of','There is a lot of water.'],
    ['d-how-many','many','How many eggs are there?']
  ]){
    const q=m.exercises.find(q=>q.id===id)!;
    assert.ok(isCorrect(q,fragment),id);assert.ok(!isCorrect(q,sentence),id);
    assert.ok(answerHint(q,'text')?.includes('tylko brakujący fragment'));
    assert.equal(answerHint(q,'choice'),null);
  }
  assert.equal(answerHint({...m.exercises[0],prompt:'Napisz całe zdanie po angielsku.'},'text'),null);
  assert.equal(answerHint({...m.exercises[0],kind:'vocabulary',prompt:'Hasło ___'},'text'),null);
});

test('obie powtórki zachowują lukę i klucz krótkiej odpowiedzi, bez konwersji na pełne zdanie',()=>{
  const p=emptyProgress(),id='g-container-water',key=keyFor(m,'exercise',id);
  p.difficult=[key];const original=m.exercises.find(q=>q.id===id)!;
  const general=makeSession(modules,m,'review','choice',false,p);
  const lesson=makeLessonSession(modules,j,j.stages[0].lessons[0],'text',p);
  recordStageError(p,lesson,general.items[0],[j]);
  const stage=makeStageReviewSession(modules,j,j.stages[0],'choice',p)!;
  for(const s of [general,stage]){
    const q=questionFor(modules,s.items[0]);assert.equal(s.items[0].input,'text');
    assert.equal(q.prompt,original.prompt);assert.deepEqual(q.answers,['bottle']);
    assert.ok(answerHint(q,inputFor(q,s.items[0].input,s.mode)));
  }
});

test('podane warianty bez nawiasów wymuszają wybór, również w pytaniach o policzalność',()=>{
  const questions=m.exercises.filter(q=>q.id.startsWith('g-count-'));assert.equal(questions.length,8);
  for(const q of questions){assert.equal(requiresChoice(q),true,q.id);assert.equal(inputFor(q,'text'), 'choice');assert.equal(inputFor(q,'text','review'),'choice');}
  const base=questions[0];
  for(const prompt of ['policzalne czy niepoliczalne?','policzalna lub niepoliczalna?','policzalny/niepoliczalny?','POLICZALNY ALBO NIEPOLICZALNY?'])assert.ok(requiresChoice({...base,prompt}),prompt);
  const some=m.exercises.find(q=>q.id==='g-some-milk-positive')!;
  for(const prompt of ['Wybierz some lub any: ___ milk.','Uzupełnij some/any: ___ milk.','some or any?','Uzupełnij [some/any]: ___ milk.'])assert.ok(requiresChoice({...some,responseType:undefined,prompt}),prompt);
  assert.ok(requiresChoice({...some,responseType:undefined,prompt:'Wybierz a (slice) albo an egg.',options:['a (slice)','an egg']}));
});
test('powtórka ogólna zawsze wymaga wpisywania, poza wariantami podanymi w pytaniu',()=>{
  const p=emptyProgress();p.words[keyFor(m,'word','apple')]='review';
  p.difficult=[keyFor(m,'exercise','g-container-water'),keyFor(m,'exercise','d-to-drink'),keyFor(m,'exercise','g-count-milk'),keyFor(m,'exercise','g-some-milk-positive')];
  for(const preference of ['choice','mixed','text'] as AnswerMode[]){
    const s=makeSession(modules,m,'review',preference,false,p);assert.equal(s.answerMode,'text');
    assert.equal(s.items.length,5);for(const item of s.items)assert.equal(item.input,requiresChoice(questionFor(modules,item))?'choice':'text',item.id);
  }
  const fill=m.exercises.find(q=>q.id==='g-container-water')!;assert.equal(inputFor(fill,'choice','review'),'text');assert.equal(inputFor(fill,'choice','grammar'),'choice');
  const word=questionFor(modules,{key:keyFor(m,'word','biscuit'),moduleId:m.id,version:1,type:'word',id:'biscuit',input:'choice'});
  assert.equal(requiresChoice(word),false);assert.equal(inputFor(word,'choice','review'),'text');
  assert.equal(inputFor({...fill,prompt:'Uzupełnij: Is there any milk?'},'choice','review'),'text');
});
test('powtórka etapowa używa tej samej zasady dla słówek, luk, dialogów i pytań zamkniętych',()=>{
  for(const preference of ['choice','mixed','text'] as AnswerMode[]){
    const p=emptyProgress(),first=makeLessonSession(modules,j,j.stages[0].lessons[0],'text',p);
    const ids=['g-container-water','d-to-drink','g-count-milk','g-some-milk-positive'];
    const items:Item[]=[{key:keyFor(m,'word','apple'),moduleId:m.id,version:1,type:'word',id:'apple',input:'choice'},...ids.map(id=>({key:keyFor(m,'exercise',id),moduleId:m.id,version:1,type:'exercise' as const,id,input:'choice' as const}))];
    for(const item of items)recordStageError(p,first,item,[j]);
    const s=makeStageReviewSession(modules,j,j.stages[0],preference,p)!;assert.equal(s.answerMode,'text');
    for(const item of s.items)assert.equal(item.input,requiresChoice(questionFor(modules,item))?'choice':'text',item.id);
  }
});
