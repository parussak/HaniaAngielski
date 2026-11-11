import {test} from 'node:test';
import assert from 'node:assert/strict';
import {foodModules as modules} from './materials.ts';
import {emptyProgress,makeSession,backup,validateBackup} from '../src/core.ts';
const m=modules[0];
test('dwa zestawy fiszek: 38 z ramek i 97 wszystkich, bez dublowania słówek',()=>{
  const basic=m.basicFlashcardIds!;
  assert.equal(basic.length,38);assert.equal(new Set(basic).size,38);
  assert.equal(m.words.length,97);
  assert.ok(basic.includes('a-carton-of-juice'));assert.ok(basic.includes('flour'));
  assert.ok(!basic.includes('diary'));assert.ok(!basic.includes('have-fun'));
  const p=emptyProgress();
  const session=makeSession(modules,m,'flashcards-basic','mixed',false,p);
  assert.ok(session.items.every(i=>i.type==='word'&&basic.includes(i.id)));
  p.active=session;assert.deepEqual(validateBackup(backup(p)).progress,p);
  assert.ok(makeSession(modules,m,'flashcards','mixed',false,emptyProgress()).items.every(i=>i.type==='word'));
});
test('podstawa i pełne fiszki współdzielą postępy tych samych słów',()=>{
  const p=emptyProgress();
  for(const id of m.basicFlashcardIds!)p.words[`${m.id}@1:word:${id}`]='known';
  assert.equal(makeSession(modules,m,'flashcards-basic','mixed',false,p).items.length,0);
  assert.equal(makeSession(modules,m,'flashcards','mixed',false,p).items.length,10);
});
