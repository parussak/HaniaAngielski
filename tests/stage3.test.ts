import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {foodModules as modules} from './materials.ts';
import {normalizeAnswer} from '../src/answers.ts';
const read=(path:string)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('etap 3: CI testuje push bez automatycznej publikacji',()=>{
  assert.ok(existsSync(new URL('../.github/workflows/checks.yml',import.meta.url)));
  const ci=read('.github/workflows/checks.yml');assert.ok(ci.includes('push:'));assert.ok(ci.includes('npm test'));assert.ok(ci.includes('npm run check:content'));assert.ok(!ci.includes('deploy-pages'));
});
test('etap 3: brak zbędnych wariantów answers i krótkie objaśnienia',()=>{
  for(const w of modules[0].words){const answers=w.answers??[w.back];assert.equal(new Set(answers.map(a=>normalizeAnswer(a))).size,answers.length,w.id);}
  for(const q of modules[0].exercises.filter(q=>q.id.startsWith('g-count-')||q.id==='g-short-eggs'))assert.ok(q.explanation.length<180,q.id);
});
