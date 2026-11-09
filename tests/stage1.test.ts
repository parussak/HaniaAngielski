import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {modules} from './materials.ts';
import {emptyProgress,makeSession,recordAnswer,markWord,isCorrect,backup,validateBackup} from '../src/core.ts';
const m=modules[0];
test('K1: poprawka w tej samej sesji nie usuwa trudności, nowa pierwsza próba usuwa',()=>{
  const p=emptyProgress();p.active=makeSession(modules,m,'grammar','text',false,p);
  const item=p.active.items[0];const q=m.exercises.find(q=>q.id===item.id)!;
  recordAnswer(p,q,'wrong');p.active.phase='retry';recordAnswer(p,q,q.answers[0]);
  assert.ok(p.difficult.includes(item.key));
  p.active=makeSession(modules,m,'review','text',false,p);
  p.active.items=[item];recordAnswer(p,q,q.answers[0]);assert.ok(!p.difficult.includes(item.key));
});
test('K1: fiszka review wchodzi do powtórki, także ze starej kopii',()=>{
  const p=emptyProgress();p.active=makeSession(modules,m,'flashcards','text',false,p);
  const item=p.active.items[0];p.active.phase='revealed';markWord(p,false);
  assert.ok(p.difficult.includes(item.key));
  p.difficult=[]; // stara kopia mogła zawierać tylko status review
  const old=validateBackup(backup(p)).progress;
  assert.ok(makeSession(modules,m,'review','text',false,old).items.some(i=>i.key===item.key));
});
test('K2: sześć opakowań ma jednoznaczną polską podpowiedź',()=>{
  const hints:Record<string,string>={water:'butelka',cola:'puszka',juice:'karton',chocolate:'tabliczka',jam:'słoik',biscuits:'paczka'};
  for(const [id,hint] of Object.entries(hints)) {
    const q=m.exercises.find(q=>q.id===`g-container-${id}`)!;
    assert.ok(q.prompt.includes(`(${hint})`),q.id);assert.equal(q.options.filter(o=>isCorrect(q,o)).length,1);
    if(id==='cola'||id==='juice')assert.ok(!q.options.includes('bottle'));
  }
});
test('I3: co najmniej 30 poprawnych i błędnych zapisów odpowiedzi',()=>{
  const cases:[string,string,boolean][]=[
    ["I'd like a lemonade, please.","I'd like a lemonade please",true],
    ["I'd like a lemonade, please.","I’d like a lemonade, please!",true],
    ['Can I have a vegetarian pizza, please?','Can I have a vegetarian pizza please?',true],
    ['What would you like?','What would you like ?',true],
    ['Anything else?',' anything else... ',true],
    ['Good luck!','GOOD LUCK',true],['apple','apple.',true],['apple',' apple ! ',true],
    ['a lot of','A   LOT   OF',true],['some',' some, ',true],['any','any…',true],
    ["aren't","aren’t",true],['café','cafe\u0301',true],['How many','How many?',true],
    ['How much','how much ?',true],['a bottle of water','a bottle of water.',true],
    ['What would you like?','What you like?',false],['apple','apples',false],['café','cafe',false],
    ['some','any',false],['a lot of','a lot',false],["aren't",'are',false],
    ['frying pan','frying',false],['How much','How many',false],
    ["I'd like a lemonade, please.","I'd like a milkshake please",false],
    ['Can I have a vegetarian pizza, please?','Can I a vegetarian pizza please?',false],
    ['a bottle of water','bottle water',false],['a jar of jam','a bar of jam',false],
    ['breakfast','dinner',false],['rice','Rice.',true],['strawberry',' strawberry ? ',true],['egg','',false]
  ];
  for(const [expected,answer,correct] of cases) assert.equal(isCorrect({...m.exercises[0],answers:[expected]},answer),correct,answer);
});
test('I3: pan akceptuje frying pan bez duplikatów, g-lot-apples ma jednoznaczny zakres',()=>{
  const pan=m.words.find(w=>w.id==='pan')!;assert.ok(pan.answers!.includes('frying pan'));
  assert.equal(new Set(pan.answers).size,pan.answers!.length);
  const q=m.exercises.find(q=>q.id==='g-lot-apples')!;
  // Jeżeli celem jest konkretne wyrażenie z książki, polecenie musi je wskazać.
  assert.ok(q.answers.includes('many') || q.prompt.includes('trzywyrazowe'));
});
test('treści: lunch doprecyzowany, dinner bez lunch jako dystraktora, neutralne so-pizza',()=>{
  const dinner=m.exercises.find(q=>q.id==='v-dinner')!;assert.ok(!dinner.options.includes('lunch'));
  const lunch=m.exercises.find(q=>q.id==='v-lunch')!;assert.ok(/posiłek|południ|lunchu/.test(lunch.prompt));
  const pizza=m.exercises.find(q=>q.id==='g-so-pizza')!;assert.ok(pizza.explanation.includes('W tym zdaniu'));
});
test('D14: hasło na stronie głównej zachowuje spację przy zawijaniu tekstu',()=>{
  const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');assert.ok(main.includes('się od małych kroków.'));
});
