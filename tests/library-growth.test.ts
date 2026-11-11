import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readLibrary} from '../src/materials/library.ts';
import {growingLibrary} from './fixtures/growing-library.ts';
import {moduleById,courseById} from './fixtures/select.ts';
import {backup,validateBackup,emptyProgress,makeSession,questionFor,recordAnswer,next,sessionCompatible} from '../src/core.ts';
import {makeCoursePracticeSession} from '../src/learning/course-practice.ts';
import {courseKey} from '../src/learning/scope.ts';
const read=async(path:string)=>JSON.parse(readFileSync(new URL(`../public/content/${path}`,import.meta.url),'utf8'));
test('Food jest wybierany po ID mimo dodatkowego modułu, kursów i innej kolejności',async()=>{
 const base=await readLibrary(read),grown=await readLibrary(growingLibrary(read));
 assert.equal(grown.modules.length,base.modules.length+3);assert.equal(grown.courses.length,base.courses.length+2);
 assert.ok(grown.modules.findIndex(m=>m.id==='unit-2-food')>0);
 assert.deepEqual(moduleById(grown,'unit-2-food'),moduleById(base,'unit-2-food'));
 assert.ok(courseById(grown,'angielski-hani').moduleIds.includes('test-growth-en-unit'));
 assert.throws(()=>moduleById(grown,'missing'));assert.throws(()=>courseById(grown,'missing'));
});
test('rozbudowana biblioteka nie zmienia dawnych kopii Food ani zgodności aktywnej sesji',async()=>{
 const base=await readLibrary(read),grown=await readLibrary(growingLibrary(read));
 const old=JSON.parse(readFileSync(new URL('./fixtures/backup-v1.json',import.meta.url),'utf8'));
 assert.deepEqual(validateBackup(old),old);
 const p=emptyProgress(),food=moduleById(base,'unit-2-food');p.active=makeSession(base.modules,food,'flashcards','text',false,p);
 recordAnswer(p,questionFor(base.modules,p.active.items[0]),'wrong');const before=backup(p);
 assert.ok(sessionCompatible(grown.modules,p.active));assert.deepEqual(backup(validateBackup(before).progress).progress,before.progress);
});
test('sesje i poznane zestawy nie mieszają nowych kursów ani przyszłych modułów',async()=>{
 const library=await readLibrary(growingLibrary(read));
 for(const m of library.modules.filter(m=>m.id.startsWith('test-growth-'))){
  const p=emptyProgress();p.active=makeSession(library.modules,m,'quiz','text',false,p);
  assert.ok(p.active.items.every(i=>i.moduleId===m.id));const q=questionFor(library.modules,p.active.items[0]);
  recordAnswer(p,q,q.answers[0]);next(p);
  const practice=makeCoursePracticeSession(library.modules,m,p,'quiz','text');assert.ok(practice);
  assert.ok(practice.items.every(i=>courseKey(moduleById(library,i.moduleId))===courseKey(m)));
  for(const other of library.modules.filter(other=>courseKey(other)!==courseKey(m)))assert.equal(makeCoursePracticeSession(library.modules,other,p,'quiz','text'),null);
 }
});
