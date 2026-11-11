import {openBackup} from './navigation.ts';
import {test,expect} from './fixtures.ts';
import {foodModules as modules} from '../materials.ts';
import {backup,emptyProgress,makeSession} from '../../src/core.ts';

test.use({isMobile:true,hasTouch:true});
for(const width of [320,390])test(`strona startowa ${width}px: dwa wejścia, kotek, pomoc i osobne katalogi`,async({page})=>{
  await page.setViewportSize({width,height:844});await page.goto('./');
  await expect(page.getByRole('heading',{name:'Dobrze Cię widzieć, Haniu!'})).toBeVisible();
  await expect(page.locator('.cat-illustration')).toBeVisible();
  await expect(page.locator('.update-banner')).toHaveCount(0);
  await expect(page.locator('.next-step-card')).toHaveAttribute('data-step-kind','lesson');
  await expect(page.locator('.stats-grid,.module-card,.adventure-invite')).toHaveCount(0);
  const order=await page.locator('.home-start').evaluate(el=>Array.from(el.children).map(c=>c.className));
  expect(order).toEqual(['welcome','next-step-card','hero home-hero','practice-entry','home-help']);
  const check=async()=>expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await check();
  const hero=await page.locator('.home-hero').boundingBox(),art=await page.locator('.cat-illustration').boundingBox();
  expect(art!.x).toBeGreaterThanOrEqual(hero!.x);expect(art!.x+art!.width).toBeLessThanOrEqual(hero!.x+hero!.width);
  const start=await page.getByRole('button',{name:/Wybierz przygodę/}).boundingBox();
  expect(start!.width).toBeGreaterThan(hero!.width-45);
  await page.screenshot({path:`test-results/home-clean-${width}.png`,fullPage:true});
  await page.getByRole('button',{name:/Wybierz przygodę/}).tap();
  await expect(page.getByRole('heading',{name:'Twoje kocie przygody'})).toBeVisible();
  await expect(page.locator('.catalog-subtitle')).toHaveText(['A2 · Moduł 2 · Food','A2 · Moduł 2 · Food']);
  await expect(page.locator('.adventure-invite h2')).toHaveText(['Przygotowania do kociego pikniku','Kocia kuchnia — Food w praktyce']);await check();
  await page.getByRole('button',{name:'Otwórz mapę Przygotowania do kociego pikniku',exact:true}).tap();
  await expect(page.locator('.journey-stage')).toHaveCount(7);await check();
  await page.getByRole('button',{name:'← Twoje przygody',exact:true}).tap();
  await expect(page.getByRole('heading',{name:'Twoje kocie przygody'})).toBeVisible();
  await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();
  await page.getByRole('button',{name:/Przejdź do modułów/}).tap();
  await expect(page.getByRole('heading',{name:'Ćwicz po swojemu'})).toBeVisible();await check();
  await page.getByRole('button',{name:'Otwórz moduł Food — Fun with food'}).tap();
  await expect(page.getByRole('button',{name:'Fiszki podstawa',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'← Twoje moduły',exact:true}).tap();
  await expect(page.getByRole('heading',{name:'Ćwicz po swojemu'})).toBeVisible();
  await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();
  await expect(page.locator('.home-help')).not.toHaveAttribute('open','');
  await page.locator('.home-help>summary').tap();
  await expect(page.getByRole('heading',{name:'Twoje wyniki i konto'})).toBeVisible();await check();
  if(width===390){
    await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();await page.locator('.home-help>summary').tap();await page.setViewportSize({width:1280,height:900});await page.evaluate(()=>window.scrollTo(0,0));
    await check();await expect(page.locator('.cat-illustration')).toBeVisible();
    await page.screenshot({path:'test-results/home-clean-desktop.png',fullPage:true});
  }
});

test('kontynuacja bezpośrednio pod imieniem przywraca zapisaną sesję',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const p=emptyProgress();p.active=makeSession(modules,modules[0],'grammar','text',false,p);
  await page.goto('./');await openBackup(page);
  await page.locator('#import-file').setInputFiles({name:'resume.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(p)))});
  await page.getByRole('button',{name:'Zastąp postępy',exact:true}).tap();
  await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();
  await expect(page.locator('.welcome + .next-step-card')).toBeVisible();
  await expect(page.locator('.next-step-card')).toContainText('Food · Gramatyka · pytanie 1 z 10');
  await page.reload();await expect(page.locator('.welcome + .next-step-card')).toBeVisible();
  await page.getByRole('button',{name:'Kontynuuj naukę →',exact:true}).tap();
  await expect(page.locator('.question')).toBeVisible();
});
