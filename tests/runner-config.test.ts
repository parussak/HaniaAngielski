import {test} from 'node:test';
import assert from 'node:assert/strict';

test('Playwright wybiera polecenie platformy, zbudowaną aplikację i wskazaną przeglądarkę',async()=>{
 const names=['HANIA_BASE_URL','HANIA_TEST_BUILD','HANIA_BROWSER_CHANNEL'];
 const before=names.map(name=>process.env[name]);
 try {
  for(const name of names)delete process.env[name];
  const dev=(await import('../playwright.config.ts?dev')).default;
  assert.equal(dev.use?.channel,undefined);
  assert.equal((dev.webServer as any).command,`${process.platform==='win32'?'npm.cmd':'npm'} run dev -- --port 5184 --strictPort`);
  process.env.HANIA_TEST_BUILD='1';process.env.HANIA_BROWSER_CHANNEL='chrome';
  const built=(await import('../playwright.config.ts?built')).default;
  assert.equal(built.use?.channel,'chrome');assert.equal((built.webServer as any).command,'node scripts/serve-built.mjs');
  assert.equal(built.use?.baseURL,'http://127.0.0.1:5184/HaniaAngielski/');
  process.env.HANIA_BASE_URL='https://example.test/app/';
  const published=(await import('../playwright.config.ts?published')).default;
  assert.equal(published.webServer,undefined);assert.equal(published.use?.baseURL,'https://example.test/app/');
 } finally {names.forEach((name,i)=>{if(before[i]===undefined)delete process.env[name];else process.env[name]=before[i];});}
});
