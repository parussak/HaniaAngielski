import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cleanName} from '../src/profile.ts';
test('imię zachowuje polskie litery, normalizuje odstępy i ogranicza długość',()=>{
  assert.equal(cleanName('  Anna   Maria '),'Anna Maria');
  assert.equal(cleanName('Łucja'),'Łucja');
  assert.throws(()=>cleanName('   '));assert.throws(()=>cleanName('a'.repeat(51)));
});
