import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {modules} from '../materials.ts';
import {emptyProgress,makeSession,backup,keyFor} from '../../src/core.ts';
import {openBackup} from './navigation.ts';
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
async function start(page:Page,id:string){
  const p=emptyProgress(),m=modules[0];p.active=makeSession(modules,m,'flashcards','text',false,p);
  p.active.items=[{key:keyFor(m,'word',id),moduleId:m.id,version:1,type:'word',id,input:'text'}];
  await page.goto('./');await openBackup(page);
  await page.locator('#import-file').setInputFiles({name:'word.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(p)))});
  await page.getByRole('button',{name:'Zastąp postępy',exact:true}).tap();
  await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();
  await page.getByRole('button',{name:'Kontynuuj naukę →',exact:true}).tap();
}
async function answer(page:Page,value:string){await page.getByRole('textbox').fill(value);await page.getByRole('button',{name:/Sprawdź/}).tap();}

test('telefon: pięć wejść menu, Mapy bez szukania i kopia również dla gościa',async({page})=>{
  await page.goto('./');const nav=page.locator('.sidebar nav');
  await expect(nav.getByRole('button')).toHaveCount(5);
  for(const width of [320,390,430]){
    await page.setViewportSize({width,height:740});
    for(const name of ['Moja nauka','Mapy','Domek','Moje postępy','Konto']){
      const b=nav.getByRole('button',{name,exact:true});await expect(b).toBeInViewport();
      const bounds=await b.boundingBox();expect(bounds!.width).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  }
  await nav.getByRole('button',{name:'Mapy',exact:true}).tap();
  await expect(page.getByRole('button',{name:'Otwórz mapę Przygotowania do kociego pikniku',exact:true})).toBeVisible();
  await openBackup(page);await expect(page.getByRole('button',{name:'Zapisz kopię postępów',exact:true})).toBeVisible();
});

test('brak an zalicza słówko z pomarańczowym wyjaśnieniem bez dodania błędu',async({page})=>{
  await start(page,'apple');await answer(page,'apple');
  await expect(page.locator('.feedback.correct')).toBeVisible();
  await expect(page.locator('.article-note')).toContainText('an apple');
  await expect(page.locator('.article-note')).toContainText('policzalny');
  await page.screenshot({path:'test-results/article-note-mobile.png'});
  await page.getByRole('button',{name:/Dalej/}).tap();await expect(page.locator('.summary-score')).toContainText('1 / 1');
  await openBackup(page);const downloaded=page.waitForEvent('download');
  await page.getByRole('button',{name:'Zapisz kopię postępów',exact:true}).tap();
  const saved=JSON.parse(readFileSync((await(await downloaded).path())!,'utf8')).progress;
  expect(saved.difficult).toEqual([]);expect(saved.sessions[0].attempts[0].first).toBe(true);
});

test('zbędne a jest różowym błędem, poprawny wariant zielony, Dalej kończy bez wymuszonej poprawki',async({page})=>{
  await start(page,'water');await answer(page,'a water');
  await expect(page.locator('.given-answer p')).toHaveText('a water');
  await expect(page.locator('.expected-answer p')).toHaveText('water');
  await expect(page.locator('.article-note')).toContainText('bez a/an');
  await expect(page.locator('.answer-comparison mark, .answer-comparison del')).toHaveCount(0);
  expect(await page.locator('.given-answer').evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(252, 232, 241)');
  expect(await page.locator('.expected-answer').evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(237, 246, 239)');
  await page.screenshot({path:'test-results/pink-feedback-mobile.png'});
  await page.getByRole('button',{name:/Dalej/}).tap();await expect(page.locator('.summary-score')).toContainText('0 / 1');
  await openBackup(page);const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Zapisz kopię postępów',exact:true}).tap();
  const saved=JSON.parse(readFileSync((await(await downloaded).path())!,'utf8')).progress;
  expect(saved.sessions[0].items).toHaveLength(1);expect(saved.difficult).toContain(keyFor(modules[0],'word','water'));
});
