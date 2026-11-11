import {openModule,openMap} from './navigation.ts';
import {test,expect,type Page} from './fixtures.ts';
import {foodModules as modules} from '../materials.ts';
import {pwaServer} from './pwa-server.ts';

test.use({serviceWorkers:'allow',viewport:{width:390,height:844},isMobile:true,hasTouch:true});
test.skip(process.env.HANIA_TEST_BUILD!=='1' || !!process.env.HANIA_BASE_URL,'PWA sprawdzamy na lokalnej, zbudowanej aplikacji.');
async function offlineReady(page:Page){
  await expect(page.locator('[data-offline-status]')).toContainText('Materiały gotowe');
  await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBeTruthy();
}
async function moduleSetup(page:Page){await openModule(page);}

test('PWA: manifest, ikony i zimny start bez sieci; fiszki, quiz, gramatyka i wznowienie',async({page,context})=>{
  await page.goto('./');await offlineReady(page);
  await page.screenshot({path:'test-results/pwa-home-mobile.png',fullPage:true});
  const manifest=await page.evaluate(async()=>{const href=document.querySelector<HTMLLinkElement>('link[rel="manifest"]')!.href;return (await fetch(href)).json();});
  expect(manifest.display).toBe('standalone');expect(manifest.scope).toBe('./');expect(manifest.icons).toHaveLength(3);
  for(const icon of manifest.icons)expect((await page.request.get(new URL(icon.src,page.url()).href)).ok()).toBeTruthy();
  await page.close();await context.setOffline(true);const offline=await context.newPage();await offline.goto('./');
  await expect(offline.getByRole('heading',{name:'Dobrze Cię widzieć, Haniu!'})).toBeVisible();await offlineReady(offline);
  await expect(offline.locator('[data-offline-status]')).toContainText('Teraz jesteś offline');
  await moduleSetup(offline);await offline.getByText('Wpisuję odpowiedź',{exact:true}).tap();await offline.getByRole('button',{name:'Fiszki podstawa',exact:true}).tap();
  const front=await offline.locator('.question').innerText(),word=modules[0].words.find(w=>w.front===front)!;
  await offline.getByRole('textbox').fill(word.back);await offline.getByRole('button',{name:/Sprawdź/}).tap();await expect(offline.locator('.feedback.correct')).toBeVisible();
  for(const mode of ['Quiz słownictwa','Gramatyka','Rozmówki']){
    await offline.getByRole('button',{name:'Moja nauka',exact:true}).tap();await moduleSetup(offline);await offline.getByText('Wybieram odpowiedź',{exact:true}).tap();
    offline.once('dialog',d=>d.accept());await offline.getByRole('button',{name:mode,exact:true}).tap();await expect(offline.locator('.question-illustration')).toBeVisible();
    await offline.locator('.option').first().tap();await expect(offline.locator('.feedback')).toBeVisible();
  }
  const last=await offline.locator('.question').innerText();await offline.reload();await offline.getByRole('button',{name:'Kontynuuj naukę →',exact:true}).tap();
  await expect(offline.locator('.question')).toHaveText(last);await expect(offline.locator('.feedback')).toBeVisible();
  await expect(offline.locator('.cat-mascot')).toBeVisible();
  await expect(offline.locator('.cat-mascot image')).toHaveAttribute('href',/\/cats\/(happy-teachers|play-celebrate)\.png$/);
  expect(await offline.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await offline.screenshot({path:'test-results/pwa-offline-mobile.png'});
  await offline.getByRole('button',{name:'Moja nauka',exact:true}).tap();
  await openMap(offline);await expect(offline.locator('.journey-stage')).toHaveCount(7);
  await offline.getByRole('button',{name:'Kontynuuj naukę →',exact:true}).tap();await expect(offline.locator('.learn-word')).toHaveCount(5);
  offline.once('dialog',d=>d.accept());await offline.getByRole('button',{name:'Zaczynam ćwiczenia →'}).tap();await expect(offline.locator('.option').first()).toBeVisible();
  await offline.locator('.option').filter({hasNotText:'apple'}).first().tap();await expect(offline.locator('.feedback.incorrect')).toBeVisible();
  await offline.getByRole('button',{name:'Moja nauka',exact:true}).tap();await openMap(offline);
  const review=offline.locator('.journey-stage').first().locator('.stage-review-step');await expect(review).toContainText('1 słówko');
  offline.once('dialog',d=>d.accept());await review.tap();await expect(offline.locator('.review-meter')).toContainText('0/3');
  await expect(offline.locator('.option')).toHaveCount(0);await offline.getByRole('textbox').fill('apple');await offline.getByRole('button',{name:/Sprawdź/}).tap();await offline.getByRole('button',{name:/Dalej/}).tap();await expect(offline.locator('.review-result')).toContainText('1 słówko');
  await offline.reload();await openMap(offline);await offline.locator('.journey-stage').first().locator('.stage-review-step').tap();await expect(offline.locator('.review-meter')).toContainText('1/3');
  await offline.getByRole('button',{name:'Domek',exact:true}).tap();await expect(offline.locator('.room-background')).toHaveJSProperty('complete',true);
  expect(await offline.locator('.room-background').evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);
});

test('PWA: konto po zimnym starcie offline zachowuje odpowiedź i synchronizuje po połączeniu',async({page,context})=>{
  const server=await pwaServer();
  try{
    await page.goto(server.url);await offlineReady(page);
    await page.getByRole('button',{name:'Ustawienia konta',exact:true}).tap();await page.getByLabel('E-mail').fill('offline@example.test');await page.getByLabel('Hasło',{exact:true}).fill('test-password');await page.getByRole('button',{name:'Zaloguj się',exact:true}).tap();await expect(page.getByRole('status')).toContainText('Wyniki zapisane na koncie');
    await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();await moduleSetup(page);await context.setOffline(true);await page.getByRole('button',{name:'Fiszki podstawa',exact:true}).tap();
    await expect(page.locator('.question')).toBeVisible();
    await page.reload();await page.getByRole('button',{name:'Kontynuuj naukę →',exact:true}).tap();
    const question=await page.locator('.question').innerText();await page.locator('.option').first().tap();await expect(page.locator('.feedback')).toBeVisible();
    await page.reload();await page.getByRole('button',{name:'Kontynuuj naukę →',exact:true}).tap();await expect(page.locator('.question')).toHaveText(question);await expect(page.locator('.feedback')).toBeVisible();
    await context.setOffline(false);await expect.poll(()=>server.remote.get('offline@example.test')?.progress.active?.attempts.length).toBe(1);
    const cached=await page.evaluate(async()=>{const keys=await caches.keys();return (await Promise.all(keys.map(async key=>(await(await caches.open(key)).keys()).map(r=>r.url)))).flat();});
    expect(cached.some(url=>url.includes('/__cloud/')||url.includes('googleapis.com'))).toBe(false);
  }finally{await context.setOffline(false);await server.close();}
});

test('PWA: dodatkowy trening offline, wznowienie i synchronizacja jednej gwiazdki bez duplikatu',async({page,context})=>{
  const server=await pwaServer();
  try{
    await page.goto(server.url);await offlineReady(page);
    await page.getByRole('button',{name:'Ustawienia konta',exact:true}).tap();await page.getByLabel('E-mail').fill('training@example.test');await page.getByLabel('Hasło',{exact:true}).fill('test-password');await page.getByRole('button',{name:'Zaloguj się',exact:true}).tap();await expect(page.getByRole('status')).toContainText('Wyniki zapisane na koncie');
    await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();await moduleSetup(page);
    await page.getByText('Wpisuję odpowiedź',{exact:true}).tap();await page.getByRole('button',{name:'Fiszki podstawa',exact:true}).tap();
    const prompt=await page.locator('.question').innerText(),word=modules[0].words.find(w=>w.front===prompt)!;
    await page.getByRole('textbox').fill(word.back);await page.getByRole('button',{name:/Sprawdź/}).tap();await expect(page.locator('.feedback.correct')).toBeVisible();
    await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();await moduleSetup(page);await context.setOffline(true);
    page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Dodatkowy trening →',exact:true}).tap();await expect(page.locator('.study-heading .tag')).toHaveText('1 / 1');
    await page.reload();await page.getByRole('button',{name:'Kontynuuj naukę →',exact:true}).tap();await expect(page.locator('.question')).toHaveText(prompt);
    await page.getByRole('textbox').fill(word.back);await page.getByRole('button',{name:/Sprawdź/}).tap();await page.getByRole('button',{name:/Dalej/}).tap();await expect(page.locator('.lesson-reward')).toContainText('+1 ★');
    await page.reload();await expect(page.getByRole('heading',{name:'Dobrze Cię widzieć!'})).toBeVisible();
    await context.setOffline(false);await expect.poll(()=>server.remote.get('training@example.test')?.progress.adventure?.earned).toBe(1);
    const saved=server.remote.get('training@example.test')!.progress;
    expect(saved.sessions.filter((s:any)=>s.training?.kind==='extra')).toHaveLength(1);
    expect(saved.sessions.find((s:any)=>s.training?.kind==='extra').training.rewarded).toBe(true);
    await page.getByRole('button',{name:'Domek',exact:true}).tap();await expect(page.locator('.star-wallet')).toContainText('1');
  }finally{await context.setOffline(false);await server.close();}
});

test('PWA: aktualizacja czeka na zgodę, zachowuje sesję i nie usuwa cache innych stron',async({page})=>{
  const server=await pwaServer();
  try{
    await page.goto(server.url);await offlineReady(page);
    await page.evaluate(async()=>{const cache=await caches.open('another-application');await cache.put('unrelated',new Response('keep'));});
    await moduleSetup(page);await page.getByRole('button',{name:'Fiszki podstawa',exact:true}).tap();const question=await page.locator('.question').innerText();await page.locator('.option').first().tap();await expect(page.locator('.feedback')).toBeVisible();
    await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();server.setVersion(2);
    await page.evaluate(async()=>{await(await navigator.serviceWorker.getRegistration())!.update();});
    await expect(page.getByRole('button',{name:'Zaktualizuj',exact:true})).toBeVisible();
    await expect(page.getByText('Nowe materiały — test aktualizacji',{exact:true})).toHaveCount(0);
    const reload=page.waitForEvent('load');page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Zaktualizuj',exact:true}).tap();await reload;
    await page.getByRole('button',{name:/Przejdź do modułów/}).tap();await expect(page.getByText('Nowe materiały — test aktualizacji',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();
    await page.getByRole('button',{name:'Kontynuuj naukę →',exact:true}).tap();await expect(page.locator('.question')).toHaveText(question);await expect(page.locator('.feedback')).toBeVisible();
    const keys=await page.evaluate(()=>caches.keys());expect(keys).toContain('another-application');expect(keys.filter(k=>k.startsWith('male-kroki-offline-'))).toHaveLength(1);
  }finally{await server.close();}
});

test('PWA: globalne fiszki offline zachowują zakres, poznanie i zapis konta po połączeniu',async({page,context})=>{
  const server=await pwaServer();
  try{
    await page.goto(server.url);await offlineReady(page);
    await page.getByRole('button',{name:'Ustawienia konta',exact:true}).tap();await page.getByLabel('E-mail').fill('global@example.test');await page.getByLabel('Hasło',{exact:true}).fill('test-password');await page.getByRole('button',{name:'Zaloguj się',exact:true}).tap();await expect(page.getByRole('status')).toContainText('Wyniki zapisane na koncie');
    await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();await moduleSetup(page);await page.getByText('Wpisuję odpowiedź',{exact:true}).tap();await page.getByRole('button',{name:'Fiszki podstawa',exact:true}).tap();
    const prompt=await page.locator('.question').innerText(),word=modules[0].words.find(w=>w.front===prompt)!;
    await page.getByRole('textbox').fill(word.back);await page.getByRole('button',{name:/Sprawdź/}).tap();await expect(page.locator('.feedback.correct')).toBeVisible();
    await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();await page.getByRole('button',{name:'Ćwicz cały poznany materiał →',exact:true}).tap();
    await context.setOffline(true);page.once('dialog',d=>d.accept());await page.getByRole('button',{name:/Fiszki z poznanego materiału/}).tap();await expect(page.locator('.question')).toHaveText(prompt);
    await page.reload();await page.getByRole('button',{name:'Kontynuuj naukę →',exact:true}).tap();await expect(page.locator('.question')).toHaveText(prompt);
    await page.getByRole('textbox').fill(word.back);await page.getByRole('button',{name:/Sprawdź/}).tap();await page.getByRole('button',{name:/Dalej/}).tap();await expect(page.getByRole('button',{name:'Wróć do poznanego materiału',exact:true})).toBeVisible();
    await page.reload();await page.getByRole('button',{name:'Ćwicz cały poznany materiał →',exact:true}).tap();await expect(page.getByRole('button',{name:/Fiszki z poznanego materiału/})).toContainText('1 poznane hasło');
    await context.setOffline(false);await expect.poll(()=>server.remote.get('global@example.test')?.progress.sessions.filter((s:any)=>s.scope?.kind==='course').length).toBe(1);
    const saved=server.remote.get('global@example.test')!.progress;expect(saved.sessions.at(-1).scope).toEqual({kind:'course',courseId:'angielski-hani'});expect(saved.encountered).toContain(`unit-2-food@1:word:${word.id}`);expect(saved.adventure?.earned??0).toBe(0);
  }finally{await context.setOffline(false);await server.close();}
});
