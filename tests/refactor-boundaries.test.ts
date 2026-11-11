import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {journeyKey,lessonKey,lessons,type Journey} from '../src/learning/journey.ts';
import * as oldJourneyAPI from '../src/adventure.ts';
import {polishCount} from '../src/polish-count.ts';
import {exerciseCount} from '../src/learning/map-progress.ts';
import {pendingLabel} from '../src/stage-review.ts';
import {validateBackup,backup} from '../src/core.ts';
import {slotIds} from '../src/house/catalog.ts';
import {legacyCourse} from '../src/materials/identity.ts';

// An architectural guard checks runtime imports after type erasure, rather
// than relying on source filenames, formatting or the spelling of UI text.
function reachable(file:URL,seen=new Set<string>()):Set<string>{
 if(seen.has(file.href))return seen;seen.add(file.href);
 const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 const source=ts.createSourceFile('runtime.js',code,ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS);
 for(const node of source.statements){
  if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier&&ts.isStringLiteral(node.moduleSpecifier)){
   const spec=node.moduleSpecifier.text;if(spec.startsWith('.')&&spec.endsWith('.ts'))reachable(new URL(spec,file),seen);
  }
 }
 return seen;
}
test('domek nie zależy w czasie działania od modułu map i przyznawania nagród',()=>{
 const imports=reachable(new URL('../src/house/progress.ts',import.meta.url));
 assert.ok(!imports.has(new URL('../src/adventure.ts',import.meta.url).href));
});
test('wydzielone klucze map zachowują stare API, klucze i kolejność lekcji',()=>{
 const j=JSON.parse(readFileSync(new URL('../public/content/02-food/sciezka.json',import.meta.url),'utf8')) as Journey;
 assert.equal(oldJourneyAPI.journeyKey,journeyKey);assert.equal(oldJourneyAPI.lessonKey,lessonKey);assert.equal(oldJourneyAPI.lessons,lessons);
 assert.equal(journeyKey(j),'unit-2-food');assert.equal(lessons(j)[0].key,`unit-2-food/${j.stages[0].lessons[0].id}`);
 assert.equal(journeyKey({...j,id:'practice'}),'unit-2-food/practice');assert.equal(lessons(j).length,41);
});
test('wspólna odmiana zachowuje formy liczebników i etykiety powtórek',()=>{
 for(const [n,word] of [[0,'ćwiczeń'],[1,'ćwiczenie'],[2,'ćwiczenia'],[4,'ćwiczenia'],[5,'ćwiczeń'],[12,'ćwiczeń'],[14,'ćwiczeń'],[21,'ćwiczeń'],[22,'ćwiczenia'],[112,'ćwiczeń']] as const){
  assert.equal(exerciseCount(n),`${n} ${word}`);assert.equal(polishCount(n,'ćwiczenie','ćwiczenia','ćwiczeń'),`${n} ${word}`);
 }
 assert.equal(pendingLabel({words:1,tasks:2}),'1 słówko i 2 zadania');assert.equal(pendingLabel({words:12,tasks:0}),'12 słówek');
});
test('wspólne identyfikatory nie zmieniają starej kopii ani walidacji miejsc i portfela angielskiego',()=>{
 const old=JSON.parse(readFileSync(new URL('./fixtures/backup-v1.json',import.meta.url),'utf8'));
 assert.equal(JSON.stringify(validateBackup(old)),JSON.stringify(old));
 for(const slot of [...slotIds,null]){
  const b=backup(old.progress);b.progress.adventure={version:1,earned:10,completed:{},purchases:{pillow:{cost:6,slot}}};
  assert.deepEqual(validateBackup(b),b);
 }
 const b=backup(old.progress);b.progress.adventure={version:1,earned:10,completed:{},purchases:{pillow:{cost:6,slot:'outside'}}};
 assert.throws(()=>validateBackup(b));b.progress.adventure.purchases.pillow.slot=null;
 b.progress.adventure.courseHomes={[legacyCourse]:{earned:0,purchases:{}}};assert.throws(()=>validateBackup(b));
});
