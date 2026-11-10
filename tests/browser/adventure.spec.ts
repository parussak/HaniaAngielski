import {openBackup} from './navigation.ts';
import {openMap} from './navigation.ts';
import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {modules} from '../materials.ts';
import {emptyProgress,makeSession,recordAnswer,questionFor,next,backup} from '../../src/core.ts';
const journey=JSON.parse(readFileSync(new URL('../../public/content/02-food/sciezka.json',import.meta.url),'utf8'));
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
async function finishLesson(page:Page,firstWrong=false){
  await expect(page.locator('.question')).toBeVisible();
  let first=true;
  while(await page.locator('.question').count()){
    const prompt=await page.locator('.question').innerText(),m=modules[0],word=m.words.find(w=>w.front===prompt),q=m.exercises.find(q=>q.prompt===prompt);
    const answer=word?.back??q!.answers[0];
    const submit=async(value:string)=>{if(await page.getByRole('textbox').isVisible()){await page.getByRole('textbox').fill(value);await page.getByRole('button',{name:/Sprawdź/}).tap();}else await page.getByRole('button',{name:value,exact:true}).tap();};
    if(first&&firstWrong){
      const wrong=await page.locator('.option').filter({hasText:/./}).allTextContents();
      if(await page.getByRole('textbox').isVisible())await submit('wrong');
      else {const button=page.locator('.option').filter({hasNotText:answer}).first();expect(wrong.length).toBeGreaterThan(1);await button.tap();}
      await expect(page.locator('.feedback.incorrect')).toBeVisible();await page.getByRole('button',{name:'Spróbuję jeszcze raz'}).tap();await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');
    }
    first=false;await submit(answer);await expect(page.locator('.feedback.correct')).toBeVisible();await page.getByRole('button',{name:/Dalej/}).tap();await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');
  }
}
test('mapa: nauka, nagroda raz, dwa kroki, zakup i ustawienie domku po odświeżeniu',async({page})=>{
  await page.goto('./');await openMap(page);
  await expect(page.locator('.journey-stage')).toHaveCount(7);
  await expect(page.locator('.lesson-step').nth(1)).toBeEnabled();
  await page.screenshot({path:'test-results/journey-map-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Kontynuuj naukę →',exact:true}).tap();
  await expect(page.locator('.learn-word')).toHaveCount(5);await page.getByText('Wpisuję odpowiedź',{exact:true}).tap();
  await page.screenshot({path:'test-results/journey-learn-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).tap();await finishLesson(page,true);
  await expect(page.locator('.lesson-reward')).toContainText('+3');
  const rewardNav=await page.locator('.sidebar nav').boundingBox(),continueButton=await page.getByRole('button',{name:'Wróć na mapę',exact:true}).boundingBox();
  expect(continueButton!.y+continueButton!.height).toBeLessThanOrEqual(rewardNav!.y);
  await page.screenshot({path:'test-results/journey-reward-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Wróć na mapę',exact:true}).tap();await expect(page.locator('.star-wallet')).toContainText('3');
  await page.reload();await openMap(page);
  await page.locator('.lesson-step').first().tap();await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).tap();await finishLesson(page);
  await expect(page.locator('.lesson-reward')).toContainText('+1');
  await page.getByRole('button',{name:'Wróć na mapę',exact:true}).tap();await expect(page.locator('.star-wallet')).toContainText('4');
  await page.getByRole('button',{name:'Kontynuuj naukę →',exact:true}).tap();await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).tap();await finishLesson(page);
  await page.getByRole('button',{name:'Urządź domek',exact:true}).tap();await expect(page.locator('.star-wallet')).toContainText('7');
  await page.getByRole('button',{name:'Kup za 6 ★',exact:true}).tap();await expect(page.locator('.star-wallet')).toContainText('1');
  await page.getByRole('button',{name:'Prawy kącik',exact:true}).tap();await expect(page.locator('.room-decoration')).toHaveClass(/slot-right/);
  await page.screenshot({path:'test-results/cat-house-mobile.png',fullPage:true});
  await page.reload();await page.getByRole('button',{name:'Domek',exact:true}).tap();await expect(page.locator('.room-decoration')).toHaveCount(1);await expect(page.locator('.room-decoration')).toHaveClass(/slot-right/);
  await expect(page.locator('.star-wallet')).toContainText('1');
  for(const width of [320,430]){await page.setViewportSize({width,height:740});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();}
});

test('stara historia po imporcie ma małą migawkę, pełną kopię i działa na drugim urządzeniu',async({page,browser})=>{
  const p=emptyProgress();p.active=makeSession(modules,modules[0],'grammar','text',false,p);p.active.items=p.active.items.slice(0,1);
  recordAnswer(p,questionFor(modules,p.active.items[0]),questionFor(modules,p.active.items[0]).answers[0]);next(p);
  const template=p.sessions[0];p.sessions=Array.from({length:65},(_,i)=>({...structuredClone(template),id:'old-'+i}));
  await page.goto('./');await openBackup(page);
  await page.locator('#import-file').setInputFiles({name:'old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(p)))});
  await page.getByRole('button',{name:'Zastąp postępy',exact:true}).tap();
  await page.getByRole('button',{name:'Moje postępy',exact:true}).tap();await expect(page.getByText('65 ukończonych sesji',{exact:false})).toBeVisible();
  await expect(page.getByRole('button',{name:'Pokaż starsze sesje'})).toBeVisible();
  await page.getByRole('button',{name:'Pokaż starsze sesje'}).tap();await expect(page.locator('.history-row')).toHaveCount(66);
  await openBackup(page);
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Zapisz kopię postępów',exact:true}).tap();
  const file=await (await download).path();const copied=JSON.parse(readFileSync(file!,'utf8'));
  expect(copied.progress.sessions.length).toBeLessThanOrEqual(30);expect(copied.progress.history.sessions).toBe(35);expect(copied.archives.length).toBeGreaterThan(0);
  const context=await browser.newContext({baseURL:test.info().project.use.baseURL,viewport:{width:390,height:844}});
  try{const second=await context.newPage();await second.goto('./');await openBackup(second);await second.locator('#import-file').setInputFiles(file!);await second.getByRole('button',{name:'Zastąp postępy',exact:true}).click();await second.getByRole('button',{name:'Moje postępy',exact:true}).click();await expect(second.getByText('65 ukończonych sesji',{exact:false})).toBeVisible();await second.getByRole('button',{name:'Pokaż starsze sesje'}).click();await expect(second.locator('.history-row')).toHaveCount(66);}finally{await context.close();}
});
