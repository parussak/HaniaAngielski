import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateBackup,type Backup} from '../src/core.ts';
import {validateFullBackup} from '../src/history-backup.ts';
import {backupValidationCases} from './fixtures/backup-validation-cases.ts';

// Captured BEFORE extraction from the original public validator. Do not
// regenerate this reference merely to silence a regression after refactoring.
const expected=JSON.parse(readFileSync(new URL('./fixtures/backup-validation-results.json',import.meta.url),'utf8')) as {name:string;accepted:boolean;sha256?:string;error?:string}[];
test('podział walidacji zachowuje przyjęcia, odrzucenia, wynik i komunikat dla całego zestawu starych i nowych kopii',()=>{
 const cases=backupValidationCases();assert.deepEqual(cases.map(c=>c.name),expected.map(c=>c.name));
 for(const [i,{name,input}] of cases.entries()){
  const before=structuredClone(input),reference=expected[i];
  if(reference.accepted){
   const output=validateBackup(input);assert.equal(createHash('sha256').update(JSON.stringify(output)).digest('hex'),reference.sha256,name);
  }else assert.throws(()=>validateBackup(input),(error:unknown)=>error instanceof Error&&error.message===reference.error,name);
  assert.deepEqual(input,before,`${name}: walidacja nie może modyfikować źródła`);
 }
});

test('walidacja zwraca niezależną kopię dawnych i zagnieżdżonych danych, bez ich normalizowania',()=>{
 for(const name of ['old-v1','homes','history','scoped','unknown-optional-field']){
  const input=backupValidationCases().find(c=>c.name===name)!.input as Backup,before=structuredClone(input);
  const output=validateBackup(input);assert.notEqual(output,input);assert.notEqual(output.progress,input.progress);
  output.progress.words['new-test-key']='known';output.progress.sessions.length=0;
  if(output.progress.adventure){output.progress.adventure.earned=999;output.progress.adventure.purchases={};}
  if(output.archives)output.archives.length=0;
  assert.deepEqual(input,before,name);
 }
});

test('strukturalna walidacja kopii nie zastępuje kontroli integralności pełnej historii',async()=>{
 const input=backupValidationCases().find(c=>c.name==='history')!.input;
 assert.doesNotThrow(()=>validateBackup(input)); // Structurally valid hexadecimal ID, deliberately not a real page hash.
 await assert.rejects(validateFullBackup(input));
 const old=backupValidationCases().find(c=>c.name==='old-v1')!.input;
 assert.deepEqual(await validateFullBackup(old),validateBackup(old));
});
