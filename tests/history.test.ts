import {test} from 'node:test';
import assert from 'node:assert/strict';
import {indexedDB} from 'fake-indexeddb';
import {engineModules as modules} from './fixtures/engine.ts';
import {emptyProgress,makeSession,recordAnswer,questionFor,next,currentStats,backup,validateBackup} from '../src/core.ts';
import {compactHistory,historyPages,sessionCount,byteSize,publishHistory,type HistoryPage} from '../src/history.ts';
import {fullBackup,validateFullBackup} from '../src/history-backup.ts';
import {putHistoryPage,localHistoryPage} from '../src/storage.ts';
function sample(n:number){
  const p=emptyProgress(),one=makeSession(modules,modules[0],'grammar','text',false,p);one.items=one.items.slice(0,1);p.active=one;const q=questionFor(modules,one.items[0]);recordAnswer(p,q,q.answers[0]);next(p);
  const template=p.sessions[0];p.sessions=Array.from({length:n},(_,i)=>({...structuredClone(template),id:'history-'+i}));return p;
}
test('1500 dawnych sesji przechodzi do części, bieżący zapis pozostaje mały, statystyki i odpowiedzi nie giną',async()=>{
  const original=sample(1500),disk=new Map<string,HistoryPage>(),copy=structuredClone(original);
  const p=await compactHistory(original,async page=>{disk.set(page.id,structuredClone(page));});
  assert.deepEqual(original,copy);assert.ok(p.sessions.length<=30);assert.equal(sessionCount(p),1500);assert.ok(byteSize(p)<150000);
  assert.deepEqual(currentStats(modules,p),currentStats(modules,original));
  const pages=await historyPages(p.history!.head,async id=>disk.get(id)!);
  const restored=[...pages].reverse().flatMap(page=>page.sessions).concat(p.sessions);
  assert.deepEqual(restored,original.sessions);assert.ok([...disk.values()].every(page=>byteSize(page)<200000));
  const complete=await fullBackup(p,async id=>disk.get(id)!);assert.equal(complete.archives!.length,disk.size);await validateFullBackup(JSON.parse(JSON.stringify(complete)));
  const missing=structuredClone(complete);missing.archives=[];await assert.rejects(validateFullBackup(missing),/brakuje/);
  const damaged=structuredClone(complete);damaged.archives![0].sessions[0].attempts[0].answer='changed';await assert.rejects(validateFullBackup(damaged),/Uszkodzona/);
  const wrongStats=structuredClone(complete);wrongStats.progress.history!.sessions++;await assert.rejects(validateFullBackup(wrongStats));
});
test('błąd zapisu części nie modyfikuje poprzednich wyników',async()=>{
  const p=sample(40),before=structuredClone(p);
  await assert.rejects(compactHistory(p,async()=>{throw Error('disk full');}),/disk full/);assert.deepEqual(p,before);
});
test('stare kopie pozostają zgodne, archiwum jest dostępne po ponownym odczycie IndexedDB',async()=>{
  globalThis.indexedDB=indexedDB;const old=sample(2);assert.deepEqual((await validateFullBackup(backup(old))).progress,old);
  const p=await compactHistory(sample(60),putHistoryPage);assert.ok(p.history?.head);
  const exported=await fullBackup(p,async id=>(await localHistoryPage(id))!);const imported=await validateFullBackup(exported);
  assert.equal(sessionCount(imported.progress),60);assert.deepEqual(currentStats(modules,imported.progress),currentStats(modules,sample(60)));
  assert.equal(validateBackup(backup(p)).progress.sessions.length,p.sessions.length);
});
test('kolejne archiwizacje budują łańcuch bez przepisywania poprzednich części',async()=>{
  const disk=new Map<string,HistoryPage>();let writes=0;
  let p=await compactHistory(sample(40),async page=>{writes++;disk.set(page.id,structuredClone(page));});
  const first=p.history!.head!,firstValue=structuredClone(disk.get(first));
  p.sessions.push(...sample(25).sessions.map(s=>({...s,id:'later-'+s.id})));
  p=await compactHistory(p,async page=>{writes++;assert.ok(!disk.has(page.id));disk.set(page.id,structuredClone(page));});
  assert.equal(sessionCount(p),65);assert.deepEqual(disk.get(first),firstValue);assert.equal(writes,2);
  await fullBackup(p,async id=>disk.get(id)!);
});
test('publikacja wysyła tylko nowe części od najstarszej, przerwanie nie potwierdza migawki',async()=>{
  const local=new Map<string,HistoryPage>(),remote=new Map<string,HistoryPage>();
  let p=await compactHistory(sample(40),async page=>{local.set(page.id,page);});
  const firstHead=p.history!.head;await publishHistory(firstHead,null,async id=>local.get(id)!,async page=>{remote.set(page.id,page);});
  p.sessions.push(...sample(30).sessions.map(s=>({...s,id:'later-'+s.id})));p=await compactHistory(p,async page=>{local.set(page.id,page);});
  let confirmed=false;
  await assert.rejects((async()=>{await publishHistory(p.history!.head,firstHead,async id=>local.get(id)!,async()=>{throw Error('offline');});confirmed=true;})(),/offline/);
  assert.equal(confirmed,false);assert.equal(remote.size,1);
  let writes=0;await publishHistory(p.history!.head,firstHead,async id=>local.get(id)!,async page=>{writes++;assert.ok(page.previous===null||remote.has(page.previous));remote.set(page.id,page);});
  assert.equal(writes,1);assert.equal(remote.size,2);
  const secondDevice=await fullBackup(p,async id=>remote.get(id)!);assert.equal(sessionCount(secondDevice.progress),70);
});
