import {test,expect,type Page} from './fixtures.ts';
import {cueFiles} from '../../src/learning/sound-cues.ts';

test.use({serviceWorkers:'allow',viewport:{width:390,height:844},isMobile:true,hasTouch:true});
test.skip(process.env.HANIA_TEST_BUILD!=='1' || !!process.env.HANIA_BASE_URL,'PWA sprawdzamy na lokalnej, zbudowanej aplikacji.');
async function offlineReady(page:Page){
  await expect(page.locator('[data-offline-status]')).toContainText('Materiały gotowe');
  await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBeTruthy();
}

test('PWA: trzy sygnały dźwiękowe są dostępne bez sieci',async({page,context})=>{
  await page.goto('./');await offlineReady(page);
  await page.close();await context.setOffline(true);
  const offline=await context.newPage();await offline.goto('./');await offlineReady(offline);
  for(const file of Object.values(cueFiles)){
    const result=await offline.evaluate(async f=>{const r=await fetch(new URL(f,document.baseURI));return {ok:r.ok,type:r.headers.get('content-type'),size:(await r.arrayBuffer()).byteLength};},file);
    expect(result.ok,file).toBeTruthy();expect(result.size,file).toBeGreaterThan(1000);
  }
});
