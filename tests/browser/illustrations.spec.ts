import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {modules} from '../materials.ts';
import {backup,emptyProgress,makeSession} from '../../src/core.ts';
const tasks=JSON.parse(readFileSync(new URL('../../public/content/02-food/cwiczenia.json',import.meta.url),'utf8'));
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});

test('gramatyka: nawias wymusza wybór, obrazek po odpowiedzi, poprawa i wznowienie',async({page})=>{
  await page.route('**/content/02-food/cwiczenia.json',r=>r.fulfill({json:tasks.filter((q:any)=>q.id==='g-because-sport')}));
  await page.goto('./');await page.getByRole('button',{name:'Otwórz moduł Food — Fun with food'}).tap();
  await page.getByText('Wpisuję odpowiedź',{exact:true}).tap();
  await page.getByRole('button',{name:'Gramatyka',exact:true}).tap();
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(page.locator('.answer-illustration')).toHaveCount(0);
  await page.getByRole('button',{name:'so',exact:true}).tap();
  await expect(page.locator('.answer-illustration [role="img"]')).toHaveAccessibleName('sport — sport');
  await page.screenshot({path:'test-results/grammar-illustration-mobile.png'});
  const nav=await page.locator('.sidebar nav').boundingBox();
  const next=await page.getByRole('button',{name:'Dalej',exact:false}).boundingBox();
  expect(next!.y+next!.height).toBeLessThanOrEqual(nav!.y);
  await page.getByRole('button',{name:'Spróbuję jeszcze raz'}).tap();
  await expect(page.locator('.answer-illustration')).toHaveCount(0);
  await page.getByRole('button',{name:'because',exact:true}).tap();
  await page.reload();await page.getByRole('button',{name:'Kontynuuj',exact:true}).tap();
  await expect(page.locator('.answer-illustration')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});

test('słówko: ilustracja po wpisaniu; stara tekstowa sesja z nawiasem pokazuje przyciski',async({page})=>{
  await page.route('**/content/02-food/modul.json',async route=>{
    const response=await route.fetch();const metadata=await response.json();metadata.basicFlashcardIds=['sugar'];await route.fulfill({json:metadata});
  });
  await page.goto('./');await page.getByRole('button',{name:'Otwórz moduł Food — Fun with food'}).tap();
  await page.getByText('Wpisuję odpowiedź',{exact:true}).tap();await page.getByRole('button',{name:'Fiszki podstawa',exact:true}).tap();
  const front=await page.locator('.question').innerText();const w=modules[0].words.find(w=>w.front===front)!;
  await expect(page.locator('.answer-illustration')).toHaveCount(0);
  await page.getByRole('textbox').fill(w.back);await page.getByRole('button',{name:/Sprawdź/}).tap();
  await expect(page.locator('.answer-illustration figcaption')).toHaveText(w.illustration!.caption);
  await expect(page.locator('.answer-illustration img')).toBeVisible();
  await expect(page.locator('.answer-illustration img')).toHaveJSProperty('complete',true);
  expect(await page.locator('.answer-illustration img').evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);
  await page.screenshot({path:'test-results/word-illustration-mobile.png'});
  const p=emptyProgress();p.active=makeSession(modules,modules[0],'grammar','text',false,p);
  const q=modules[0].exercises.find(q=>q.id==='g-because-sport')!;
  p.active.items=[{key:`unit-2-food@1:exercise:${q.id}`,moduleId:'unit-2-food',version:1,type:'exercise',id:q.id,input:'text'}];
  await page.getByRole('button',{name:'Kopia postępów',exact:true}).tap();
  await page.locator('#import-file').setInputFiles({name:'old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(p)))});
  await page.getByRole('button',{name:'Zastąp postępy',exact:true}).tap();
  await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();await page.getByRole('button',{name:'Kontynuuj',exact:true}).tap();
  await expect(page.getByRole('textbox')).toHaveCount(0);await expect(page.locator('.option')).toHaveCount(2);
});
