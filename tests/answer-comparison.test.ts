import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compareAnswer,closestAnswer} from '../src/answer-comparison.ts';
import {engineModules as modules} from './fixtures/engine.ts';
import {backup,emptyProgress,makeSession,questionFor,recordAnswer,validateBackup} from '../src/core.ts';

test('porównanie wyróżnia brakujące, nadmiarowe i zamienione litery i słowa',()=>{
  const missing=compareAnswer('botle','bottle');
  assert.equal(missing.given.map(p=>p.text).join(''),'botle');
  assert.equal(missing.expected.map(p=>p.text).join(''),'bottle');
  assert.equal(missing.expected.filter(p=>p.different).map(p=>p.text).join(''),'t');
  assert.ok(compareAnswer('appple','apple').given.some(p=>p.different));
  const words=compareAnswer('I like milk','I would like milk');
  assert.equal(words.expected.filter(p=>p.different).map(p=>p.text).join(''),'would ');
  assert.ok(compareAnswer('cat','car').given.some(p=>p.different && p.text==='t'));
  assert.equal(closestAnswer('frying pn',['pan','frying pan']).answer,'frying pan');
});

test('porównanie stosuje tolerancję oceniania i zachowuje oryginalny tekst',()=>{
  const c=compareAnswer('  I’D   like milk!','I\'d like milk.');
  assert.equal(c.distance,0);
  assert.equal(c.given.map(p=>p.text).join(''),'  I’D   like milk!');
  assert.ok(compareAnswer('i','I',true).distance>0);
  assert.ok(compareAnswer('cafe','café').distance>0);
  assert.ok(compareAnswer('x'.repeat(2000),'apple').given.every(p=>p.different));
});

test('ostatnia odpowiedź przetrwa kopię, pierwsza próba i wynik pozostają osobno',()=>{
  const p=emptyProgress();p.active=makeSession(modules,modules[0],'flashcards','text',false,p);
  const q=questionFor(modules,p.active.items[0]);
  recordAnswer(p,q,'first mistake');
  p.active.phase='retry';recordAnswer(p,q,'second mistake');
  const attempt=p.active.attempts[0];
  assert.equal(attempt.answer,'first mistake');assert.equal(attempt.lastAnswer,'second mistake');
  assert.equal(attempt.first,false);
  assert.deepEqual(validateBackup(backup(p)).progress,p);
  const old=backup(p);delete old.progress.active!.attempts[0].lastAnswer;
  assert.doesNotThrow(()=>validateBackup(old));
  const bad=backup(p);(bad.progress.active!.attempts[0] as any).lastAnswer={bad:true};
  assert.throws(()=>validateBackup(bad));
  p.active.phase='retry';recordAnswer(p,q,q.answers[0]);
  assert.equal(attempt.lastAnswer,q.answers[0]);assert.equal(attempt.answer,'first mistake');
  assert.equal(attempt.first,false);assert.equal(attempt.corrected,true);
});
