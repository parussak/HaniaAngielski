import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyProgress} from '../src/core.ts';
import {ProgressSync,SyncConflict,validateCache,type AccountCache,type RemoteProgress,type SyncPorts} from '../src/sync.ts';
import {readStored,writeStored,load,save} from '../src/storage.ts';
import {indexedDB} from 'fake-indexeddb';
import {compactHistory,sessionCount,type HistoryPage} from '../src/history.ts';
import {modules} from './materials.ts';
import {makeSession,questionFor,recordAnswer,next} from '../src/core.ts';

const copy=<T>(value:T)=>structuredClone(value);
const sample=(name:string)=>({...emptyProgress(),words:{[name]:'known' as const}});
function server(){
  const remote=new Map<string,RemoteProgress>();
  const make=()=>{
    const disk=new Map<string,AccountCache>();
    const ports:SyncPorts={
      read:async uid=>copy(disk.get(uid)),save:async(uid,cache)=>{disk.set(uid,copy(cache));},
      fetch:async uid=>copy(remote.get(uid)??null),
      push:async(uid,p,revision)=>{const old=remote.get(uid);if((old?.revision??0)!==revision)throw new SyncConflict(copy(old??null));const result={revision:revision+1,progress:copy(p)};remote.set(uid,result);return copy(result);},
    };
    return {sync:new ProgressSync(ports),ports,disk};
  };
  return {remote,make};
}
function deferred<T>(){let resolve!:(value:T)=>void;const promise=new Promise<T>(r=>resolve=r);return {promise,resolve};}

test('stary duży zapis z chmury jest migrowany przed kolejnym wysłaniem bez utraty sesji',async()=>{
  const p=emptyProgress();p.active=makeSession(modules,modules[0],'grammar','text',false,p);p.active.items=p.active.items.slice(0,1);recordAnswer(p,questionFor(modules,p.active.items[0]),questionFor(modules,p.active.items[0]).answers[0]);next(p);
  const one=p.sessions[0];p.sessions=Array.from({length:80},(_,i)=>({...copy(one),id:'old-'+i}));
  const serverState=server(),{sync,ports}=serverState.make(),pages=new Map<string,HistoryPage>();
  ports.prepare=progress=>compactHistory(progress,async page=>{pages.set(page.id,page);});
  serverState.remote.set('a',{revision:1,progress:p});await sync.connect('a',emptyProgress());await sync.sync();
  assert.equal(sync.status,'pending');assert.equal(sessionCount(sync.cache!.progress),80);assert.equal(sync.cache!.progress.sessions.length,30);assert.ok(pages.size);
  await sync.sync();assert.equal(sync.status,'saved');assert.equal(sessionCount(serverState.remote.get('a')!.progress),80);
});
test('zmiana z drugiego urządzenia nie jest nadpisana przez lokalny krok oparty na starszej wersji',async()=>{
  const state=server(),{sync}=state.make();await sync.connect('a',emptyProgress());await sync.sync();
  const version=sync.cache!.localVersion;state.remote.set('a',{revision:1,progress:sample('other-device')});await sync.sync();
  await assert.rejects(sync.save(sample('stale'),version),/zmieniły się w tle/);assert.deepEqual(sync.cache!.progress,sample('other-device'));
});

test('pierwsze połączenie pobiera konto, nie wysyła automatycznie postępów gościa',async()=>{
  const s=server();s.remote.set('a',{revision:3,progress:sample('cloud')});const {sync}=s.make();
  await sync.connect('a',sample('guest'));await sync.sync();
  assert.equal(sync.offerGuest,true);assert.deepEqual(sync.cache!.progress,sample('cloud'));
  assert.deepEqual(s.remote.get('a')!.progress,sample('cloud'));
  await sync.useGuest(sample('guest'));await sync.sync();
  assert.deepEqual(s.remote.get('a')!.progress,sample('guest'));
  assert.deepEqual(sync.cache!.recovery,sample('cloud'));
});

test('offline: lokalna zmiana przetrwa wznowienie; ponowne połączenie ją wysyła',async()=>{
  const s=server(),{sync,ports}=s.make();await sync.connect('a',emptyProgress());await sync.sync();
  await sync.save(sample('first'));
  const fetch=ports.fetch;ports.fetch=async()=>{throw new Error('offline');};await sync.sync();
  assert.equal(sync.status,'error');assert.equal(sync.cache!.dirty,true);
  const resumed=new ProgressSync(ports);await resumed.connect('a',emptyProgress());assert.deepEqual(resumed.cache!.progress,sample('first'));
  ports.fetch=fetch;await resumed.sync();assert.equal(resumed.status,'saved');assert.deepEqual(s.remote.get('a')!.progress,sample('first'));
});

test('dwa urządzenia: starszy zapis nie nadpisuje nowego, wybór chmury zachowuje lokalną kopię',async()=>{
  const s=server();s.remote.set('a',{revision:1,progress:sample('initial')});
  const a=s.make().sync,b=s.make().sync;
  await a.connect('a',emptyProgress());await b.connect('a',emptyProgress());await a.sync();await b.sync();
  await a.save(sample('phone'));await b.save(sample('computer'));await a.sync();await b.sync();
  assert.equal(b.status,'conflict');assert.deepEqual(b.cache!.progress,sample('computer'));
  assert.deepEqual(s.remote.get('a')!.progress,sample('phone'));
  await b.resolve('cloud');assert.deepEqual(b.cache!.recovery,sample('computer'));assert.deepEqual(b.cache!.progress,sample('phone'));
});

test('wybór lokalnej wersji ponownie sprawdza, czy konto nie zmieniło się w międzyczasie',async()=>{
  const s=server();s.remote.set('a',{revision:2,progress:sample('remote')});const {sync}=s.make();
  await sync.connect('a',emptyProgress());await sync.save(sample('local'));await sync.sync();assert.equal(sync.status,'conflict');
  s.remote.set('a',{revision:3,progress:sample('newer')});await sync.resolve('local');
  assert.equal(sync.status,'conflict');assert.deepEqual(s.remote.get('a')!.progress,sample('newer'));
  await sync.resolve('local');assert.equal(sync.status,'saved');assert.deepEqual(sync.cache!.recovery,sample('newer'));assert.deepEqual(s.remote.get('a')!.progress,sample('local'));
});

test('odpowiedź udzielona podczas wysyłania nie ginie po potwierdzeniu wcześniejszego zapisu',async()=>{
  const s=server(),{sync,ports}=s.make();await sync.connect('a',emptyProgress());await sync.sync();await sync.save(sample('first'));
  const gate=deferred<void>(),started=deferred<void>(),push=ports.push;
  ports.push=async(...args)=>{started.resolve();await gate.promise;return push(...args);};
  const flight=sync.sync();await started.promise;await sync.save(sample('second'));gate.resolve();await flight;
  assert.equal(sync.cache!.dirty,true);assert.deepEqual(sync.cache!.progress,sample('second'));assert.equal(sync.cache!.revision,1);
  ports.push=push;await sync.sync();assert.deepEqual(s.remote.get('a')!.progress,sample('second'));assert.equal(sync.cache!.dirty,false);
});

test('zmiana konta odcina spóźnioną odpowiedź sieciową starego użytkownika',async()=>{
  const s=server(),{sync,ports}=s.make();await sync.connect('a',emptyProgress());
  const gate=deferred<RemoteProgress|null>(),started=deferred<void>();ports.fetch=async()=>{started.resolve();return gate.promise;};
  const flight=sync.sync();await started.promise;await sync.disconnect();await sync.connect('b',emptyProgress());
  gate.resolve({revision:8,progress:sample('a-private')});await flight;
  assert.equal(sync.uid,'b');assert.deepEqual(sync.cache!.progress,emptyProgress());
});

test('utracone potwierdzenie zapisu nie wywołuje fałszywego konfliktu',async()=>{
  const s=server(),{sync,ports}=s.make();await sync.connect('a',emptyProgress());await sync.save(sample('saved'));
  const push=ports.push;ports.push=async(...args)=>{await push(...args);throw new Error('lost response');};
  await sync.sync();assert.equal(sync.status,'error');await sync.sync();assert.equal(sync.status,'saved');assert.equal(s.remote.get('a')!.revision,1);
});

test('konta i gość mają oddzielne lokalne rekordy, nie zmienia się stary format kopii',async()=>{
  Object.assign(globalThis,{indexedDB});await save(sample('guest'));
  const cache:AccountCache={version:1,progress:sample('private'),dirty:true,revision:0,localVersion:1,lastSync:null,recovery:null};
  await writeStored('account:a',cache);assert.deepEqual(await load(),sample('guest'));
  assert.equal(await readStored('account:b'),undefined);assert.deepEqual(validateCache((await readStored<AccountCache>('account:a'))!),cache);
  assert.throws(()=>validateCache({...cache,revision:-1}));
});
