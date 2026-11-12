import {resumeStudy} from './helpers.ts';
import {test,expect,type Page} from './fixtures.ts';
import {openMap,openBackup} from './navigation.ts';
import {answerCurrent,finishCurrent} from './helpers.ts';
import {foodModules as modules} from '../materials.ts';
import {backup,emptyProgress,makeSession,isCorrect,type Progress} from '../../src/core.ts';
import {readFileSync} from 'node:fs';
const m=modules[0];
async function exported(page:Page){await openBackup(page);const wait=page.waitForEvent('download');await page.getByRole('button',{name:'Zapisz kopię postępów',exact:true}).click();return JSON.parse(readFileSync((await(await wait).path())!,'utf8')).progress as Progress;}
async function restore(page:Page,p:Progress){await page.goto('./');await openBackup(page);await page.locator('#import-file').setInputFiles({name:'lesson.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(p)))});await page.getByRole('button',{name:'Zastąp postępy',exact:true}).click();await page.getByRole('button',{name:'Moja nauka',exact:true}).click();await resumeStudy(page);}
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
test('telefon: pary, wybór dowolnego hasła, wznowienie, trzy przyciski i legendarny bez utraty ukończenia',async({page})=>{
 await page.goto('./');await openMap(page);await resumeStudy(page);await expect(page.locator('input[name="answerMode"]')).toHaveCount(0);await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).click();
 const source=page.locator('.pair-source').nth(2);await expect(source).toBeVisible();const key=(await source.getAttribute('data-key'))!,word=m.words.find(w=>key.endsWith(':word:'+w.id))!;await source.click();await expect(source).toHaveAttribute('aria-pressed','true');await page.screenshot({path:'test-results/lesson-pairs-mobile.png',fullPage:true});await page.reload();await resumeStudy(page);await expect(page.locator('.pair-source[aria-pressed="true"]')).toHaveAttribute('data-key',key);await page.locator('.pair-target').filter({hasText:word.back}).first().click();await expect(page.locator('.feedback.correct')).toBeVisible();await page.getByRole('button',{name:/Dalej/}).click();await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');
 await finishCurrent(page,modules);await expect(page.locator('.lesson-finish-actions button')).toHaveCount(3);await expect(page.locator('.lesson-reward')).toContainText('+3');const first=await exported(page);const completed=structuredClone(first.adventure!.completed);
 await page.getByRole('button',{name:'Moja nauka',exact:true}).click();await openMap(page);await page.locator('.lesson-step').first().click();await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).click();await finishCurrent(page,modules);await page.getByRole('button',{name:/Poziom legendarny/}).click();await expect(page.locator('.study-heading h1')).toContainText('Poziom legendarny');await finishCurrent(page,modules);await expect(page.locator('.lesson-reward')).toContainText('+1');
 await page.setViewportSize({width:320,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.screenshot({path:'test-results/lesson-legendary-summary-mobile.png',fullPage:true});
 await page.getByRole('button',{name:/Kolejna lekcja/}).click();await expect(page.locator('h1')).toHaveText('Co jest na talerzu?');const saved=await exported(page);expect(saved.adventure!.completed).toEqual(completed);expect(saved.adventure!.earned).toBe(first.adventure!.earned+2);
});
test('dialog: bank wypełnia lukę, zapisuje propozycję i pozwala ją poprawić po błędzie',async({page})=>{
 const p=emptyProgress(),q=m.exercises.find(q=>q.dialogue)!;p.active=makeSession(modules,m,'dialogue','mixed',false,p);p.active.items=[{key:`${m.id}@${q.rev??1}:exercise:${q.id}`,moduleId:m.id,version:q.rev??1,type:'exercise',id:q.id,input:'choice',presentation:'bank'}];
 await restore(page,p);await expect(page.locator('.dialogue')).toBeVisible();const wrong=q.options.find(o=>!isCorrect(q,o))!;await page.locator('.bank-token').filter({hasText:wrong}).first().click();await expect(page.locator('.bank-gap')).toContainText(wrong);await page.reload();await resumeStudy(page);await expect(page.locator('.bank-gap')).toContainText(wrong);await page.getByRole('button',{name:/Sprawdź/}).click();await expect(page.locator('.feedback.incorrect')).toBeVisible();await page.getByRole('button',{name:'Spróbuję jeszcze raz'}).click();await answerCurrent(page,modules);await page.screenshot({path:'test-results/lesson-dialogue-bank-mobile.png',fullPage:true});
});
test.describe('pary offline',()=>{
 test.use({serviceWorkers:'allow'});
 test('wybrana para i pełna sesja przetrwają zamknięcie bez internetu',async({page,context})=>{
  test.skip(process.env.HANIA_TEST_BUILD!=='1'||!!process.env.HANIA_BASE_URL,'Wymaga lokalnego wydania PWA.');
  await page.goto('./');await expect(page.locator('[data-offline-status]')).toContainText('Materiały gotowe');await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBeTruthy();await openMap(page);await resumeStudy(page);await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).click();await page.locator('.pair-source').nth(1).click();await expect(page.locator('.pair-source').nth(1)).toHaveAttribute('aria-pressed','true');
  await page.close();await context.setOffline(true);const offline=await context.newPage();await offline.goto('./');await resumeStudy(offline);const selected=await offline.locator('.pair-source[aria-pressed="true"]').getAttribute('data-key'),word=m.words.find(w=>selected!.endsWith(':word:'+w.id))!;await offline.locator('.pair-target').filter({hasText:word.back}).first().click();await expect(offline.locator('.feedback.correct')).toBeVisible();await offline.getByRole('button',{name:/Dalej/}).click();await expect(offline.locator('#app')).toHaveAttribute('aria-busy','false');await finishCurrent(offline,modules);await expect(offline.locator('.lesson-reward')).toContainText('+3');
 });
});
