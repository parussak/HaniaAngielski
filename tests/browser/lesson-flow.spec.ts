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
 const source=page.locator('.pair-source').nth(2);await expect(source).toBeVisible();const key=(await source.getAttribute('data-key'))!,word=m.words.find(w=>key.endsWith(':word:'+w.id))!;await source.click();await expect(source).toHaveAttribute('aria-pressed','true');await page.screenshot({path:'test-results/lesson-pairs-mobile.png',fullPage:true});await page.reload();await resumeStudy(page);await expect(page.locator('.pair-source[aria-pressed="true"]')).toHaveAttribute('data-key',key);await page.locator('.pair-target').filter({hasText:word.back}).first().click();
 // D-51: a matched pair is marked on the board without a break; the summary comes after the whole board.
 const matched=page.locator(`.pair-source[data-key=${JSON.stringify(key)}]`);await expect(matched).toHaveClass(/pair-correct/);await expect(matched).toBeDisabled();await expect(page.locator('.feedback')).toHaveCount(0);await expect(page.getByRole('button',{name:/Dalej/})).toHaveCount(0);
 await finishCurrent(page,modules);await expect(page.locator('.lesson-finish-actions button')).toHaveCount(3);await expect(page.locator('.lesson-reward')).toContainText('+3');const first=await exported(page);const completed=structuredClone(first.adventure!.completed);
 await page.getByRole('button',{name:'Moja nauka',exact:true}).click();await openMap(page);await page.locator('.lesson-step').first().click();await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).click();await finishCurrent(page,modules);await page.getByRole('button',{name:/Poziom legendarny/}).click();await expect(page.locator('.study-heading h1')).toContainText('Poziom legendarny');await finishCurrent(page,modules);await expect(page.locator('.lesson-reward')).toContainText('+1');
 await page.setViewportSize({width:320,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.screenshot({path:'test-results/lesson-legendary-summary-mobile.png',fullPage:true});
 await page.getByRole('button',{name:/Kolejna lekcja/}).click();await expect(page.locator('h1')).toHaveText('Co jest na talerzu?');const saved=await exported(page);expect(saved.adventure!.completed).toEqual(completed);expect(saved.adventure!.earned).toBe(first.adventure!.earned+2);
});
test('dialog: bank wypełnia lukę na wspólnej planszy, zapisuje propozycję i pozwala ją poprawić po błędzie',async({page})=>{
 const p=emptyProgress(),q=m.exercises.find(q=>q.dialogue)!;p.active=makeSession(modules,m,'dialogue','mixed',false,p);p.active.items=[{key:`${m.id}@${q.rev??1}:exercise:${q.id}`,moduleId:m.id,version:q.rev??1,type:'exercise',id:q.id,input:'choice',presentation:'bank'}];
 // D-51: the dialogue is a gap board — lines with speakers, a word placed by tapping it and then the gap.
 await restore(page,p);const gap=page.locator('.answer-bank .gap-target');await expect(gap).toHaveCount(1);await expect(page.locator('.gap-sentence p strong')).toHaveCount(q.dialogue!.length);const wrong=q.options.find(o=>!isCorrect(q,o))!;
 await page.locator('.bank-token').filter({hasText:wrong}).first().click();await gap.click();await expect(gap).toContainText(wrong);await page.reload();await resumeStudy(page);await expect(gap).toContainText(wrong);
 // It is checked immediately; a wrong word stays until the learner moves or returns it.
 await expect(gap).toContainText(wrong);await expect(page.locator('.feedback')).toHaveCount(0);await expect(page.getByRole('button',{name:/Sprawdź/})).toHaveCount(0);
 await expect(page.locator('.bank-empty')).toHaveCount(1);await page.getByRole('button',{name:`Odłóż ${wrong} do banku`,exact:true}).click();await expect(gap).not.toContainText(wrong);await expect(page.locator('.bank-empty')).toHaveCount(0);
 await answerCurrent(page,modules);await expect(page.locator('.board-summary')).toBeVisible();await page.screenshot({path:'test-results/lesson-dialogue-bank-mobile.png',fullPage:true});
 const saved=await exported(page);expect(saved.active!.attempts).toHaveLength(1);expect(saved.active!.attempts[0].first).toBe(false);expect(saved.active!.attempts[0].corrected).toBe(true);
});
test.describe('pary offline',()=>{
 test.use({serviceWorkers:'allow'});
 test('wybrana para i pełna sesja przetrwają zamknięcie bez internetu',async({page,context})=>{
  test.skip(process.env.HANIA_TEST_BUILD!=='1'||!!process.env.HANIA_BASE_URL,'Wymaga lokalnego wydania PWA.');
  await page.goto('./');await expect(page.locator('[data-offline-status]')).toContainText('Materiały gotowe');await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBeTruthy();await openMap(page);await resumeStudy(page);await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).click();await page.locator('.pair-source').nth(1).click();await expect(page.locator('.pair-source').nth(1)).toHaveAttribute('aria-pressed','true');
  await page.close();await context.setOffline(true);const offline=await context.newPage();await offline.goto('./');await resumeStudy(offline);const selected=await offline.locator('.pair-source[aria-pressed="true"]').getAttribute('data-key'),word=m.words.find(w=>selected!.endsWith(':word:'+w.id))!;await offline.locator('.pair-target').filter({hasText:word.back}).first().click();
  // D-51: a matched pair is marked on the board without a break.
  await expect(offline.locator(`.pair-source[data-key=${JSON.stringify(selected)}]`)).toHaveClass(/pair-correct/);await expect(offline.locator('.feedback')).toHaveCount(0);await finishCurrent(offline,modules);await expect(offline.locator('.lesson-reward')).toContainText('+3');
 });
});
