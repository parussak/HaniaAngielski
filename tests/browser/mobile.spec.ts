import {openModule} from './navigation.ts';
import {answerQuestion} from './helpers.ts';
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { modules } from '../materials.ts';
const module = modules[0];

test.describe('telefon — dotyk i małe ekrany', () => {
  test.use({ isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  for (const width of [320, 360, 390, 430]) {
    test(`czytelny układ bez poziomego przewijania: ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('./');
      await expect(page.getByRole('heading',{name:'Dobrze Cię widzieć, Haniu!'})).toBeVisible();
      const checkWidth = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
      await checkWidth();
      await expect(page.locator('.cat-illustration')).toBeVisible();
      for (const nav of await page.locator('.nav-item').all()) {
        const rect = await nav.boundingBox();
        expect(rect!.height).toBeGreaterThanOrEqual(44);
        expect(rect!.width).toBeGreaterThanOrEqual(44);
      }
      if (width === 390) await page.screenshot({path:'test-results/cat-home-mobile.png',fullPage:true});
      await openModule(page);
      await checkWidth();
      await page.getByText('Wybieram odpowiedź',{exact:true}).tap();
      await page.getByRole('button',{name:/^Quiz słownictwa/}).tap();
      await expect(page.locator('.option')).toHaveCount(3);
      await checkWidth();
      const option = page.locator('.option').first();
      expect((await option.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await option.tap();
      await expect(page.locator('.feedback')).toBeVisible();
      await checkWidth();
      await page.getByRole('button',{name:'Moje postępy',exact:true}).tap();
      await checkWidth();
      await page.getByRole('button',{name:'Kopia postępów',exact:true}).tap();
      await checkWidth();
      await expect(page.getByText('Wybierz plik kopii',{exact:true})).toBeVisible();
    });
  }
  test('gramatyka: wpisywanie, błąd, poprawa, obrót telefonu, wznowienie i wynik',async({page})=>{
    await page.setViewportSize({width:390,height:844});
    await page.goto('./');
    await openModule(page);
    await page.getByText('Wpisuję odpowiedź',{exact:true}).tap();
    await page.getByRole('button',{name:/^Gramatyka/}).tap();
    const question = await page.locator('.question').innerText();
    const exercise=module.exercises.find((q:any)=>q.prompt===question);
    await answerQuestion(page,exercise,false);
    await expect(page.getByText('Spokojnie, tak właśnie się uczymy.')).toBeVisible();
    await page.screenshot({path:'test-results/cat-feedback-mobile.png',fullPage:true});
    await page.reload(); await page.getByRole('button',{name:'Kontynuuj naukę →',exact:true}).tap();
    await expect(page.getByText('Spokojnie, tak właśnie się uczymy.')).toBeVisible();
    await page.getByRole('button',{name:'Spróbuję jeszcze raz'}).tap();
    await answerQuestion(page,exercise);
    await page.setViewportSize({width:844,height:390});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    await page.getByRole('button',{name:'Dalej',exact:false}).tap();
    await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');
    await page.setViewportSize({width:390,height:844});
    for(let i=0;i<12;i++) {
      if(await page.getByRole('heading',{name:'Dobra robota, Haniu!'}).isVisible()) break;
      const prompt=await page.locator('.question').innerText();
      const q=module.exercises.find((q:any)=>q.prompt===prompt);
      await answerQuestion(page,q);
      await page.getByRole('button',{name:'Dalej',exact:false}).tap();
      await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');
    }
    await expect(page.locator('.summary-score')).toContainText('9 / 10');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  });
});
