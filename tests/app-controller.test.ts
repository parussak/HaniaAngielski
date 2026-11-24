import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyProgress,type Backup} from '../src/learning/model.ts';
import {createAppController,type AppControllerState} from '../src/controllers/app.ts';

// Kontroler aplikacji dostaje zwykły obiekt z wąskim AppControllerState i jawne porty — bez AppState, window i PWA.
function setup(confirmAnswer=true){
 const state:AppControllerState={progress:emptyProgress(),screen:'study',pending:{} as Backup};
 const calls:string[]=[],messages:string[]=[];
 const controller=createAppController(state,{
  confirm:message=>{messages.push(message);return confirmAnswer;},
  installPwa:async()=>{calls.push('install');},prepareOffline:async()=>{calls.push('prepare');},applyUpdate:()=>{calls.push('update');},
 });
 return {state,controller,calls,messages};
}

test('ekrany prostych przejść zerują oczekującą kopię',async()=>{
 for(const screen of ['home','progress','backup'] as const){
  const f=setup();
  assert.equal(await f.controller.handleAction(screen),true);
  assert.equal(f.state.screen,screen);assert.equal(f.state.pending,null);
 }
});

test('instalacja i przygotowanie offline idą przez porty i nie ruszają ekranu',async()=>{
 const f=setup();
 assert.equal(await f.controller.handleAction('pwa-install'),true);
 assert.equal(await f.controller.handleAction('pwa-prepare'),true);
 assert.deepEqual(f.calls,['install','prepare']);assert.equal(f.state.screen,'study');
});

test('aktualizacja bez sesji nie pyta; z sesją pyta i przy odmowie nic nie robi',async()=>{
 const f=setup();
 await f.controller.handleAction('pwa-update');
 assert.deepEqual(f.messages,[]);assert.deepEqual(f.calls,['update']);
 const g=setup(false);g.state.progress.active={id:'s'} as never;
 assert.equal(await g.controller.handleAction('pwa-update'),true);
 assert.equal(g.messages.length,1);assert.deepEqual(g.calls,[]);
 const h=setup(true);h.state.progress.active={id:'s'} as never;
 await h.controller.handleAction('pwa-update');assert.deepEqual(h.calls,['update']);
});

test('cudza akcja nie jest obsługiwana',async()=>{
 const f=setup();
 assert.equal(await f.controller.handleAction('answer'),false);
 assert.equal(f.state.screen,'study');
});
