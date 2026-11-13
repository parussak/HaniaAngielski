// D-52: changed lesson content never reopens a completed lesson or map.
import {test,expect,type Page} from './fixtures.ts';
import {openBackup,openMap} from './navigation.ts';
import {finishCurrent,resumeStudy} from './helpers.ts';
import {readFileSync} from 'node:fs';
import {foodModules as modules} from '../materials.ts';
import {backup,emptyProgress,questionFor,type Progress} from '../../src/core.ts';
import {freshAdventure,lessons,makeLessonSession,type Journey} from '../../src/adventure.ts';
const read=():Journey=>JSON.parse(readFileSync(new URL('../../public/content/02-food/sciezka.json',import.meta.url),'utf8'));
const j=read(),at='2026-11-01T12:00:00.000Z',firstKey=`${j.moduleId}/food-words-1`;
/** The published map with its first, long completed lesson edited in place: 7 tasks instead of 5. */
function changed(){const next=read(),l=next.stages[0].lessons[0];l.intro='Nowy wstęp po poprawce lekcji.';l.wordIds=['apple','biscuit','bread','cereal','cheese','milkshake'];l.exerciseIds=['food-can-pizza'];return next;}
const serveChanged=(page:Page)=>page.route('**/content/02-food/sciezka.json',r=>r.fulfill({json:changed()}));
function finishedMap(){const p=emptyProgress();p.adventure=freshAdventure();p.adventure.earned=144;p.adventure.reviewSchema=1;p.adventure.stageReviews={};
 for(const s of j.stages)p.adventure.stageReviews[`${j.moduleId}/${s.id}`]={round:0,items:{},rewardedAt:at};for(const e of lessons(j))p.adventure.completed[e.key]={at};return p;}
async function restore(page:Page,p:Progress){await page.goto('./');await openBackup(page);await page.locator('#import-file').setInputFiles({name:'hania.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(p)))});await page.getByRole('button',{name:'Zastąp postępy',exact:true}).click();await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');await page.getByRole('button',{name:'Moja nauka',exact:true}).click();}
async function exported(page:Page){await openBackup(page);const wait=page.waitForEvent('download');await page.getByRole('button',{name:'Zapisz kopię postępów',exact:true}).click();return JSON.parse(readFileSync((await(await wait).path())!,'utf8')).progress as Progress;}
async function wallet(page:Page){await page.getByRole('button',{name:'Domek',exact:true}).click();return page.locator('.star-wallet');}
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});

test('telefon: ukończona mapa po zmianie lekcji ma 100%, a powtórka bierze nową treść i daje tylko 1 ★',async({page})=>{
 const p=finishedMap();await serveChanged(page);await restore(page,p);await openMap(page);
 await expect(page.locator('.journey-stage.stage-done')).toHaveCount(j.stages.length);await expect(page.locator('.journey-stage:not(.stage-done)')).toHaveCount(0);
 await expect(page.locator('#app')).toContainText('Gratulacje');await expect(page.locator('#app')).not.toContainText(/now[ey] zada(nia|ń)|do zrobienia|do nadrobienia/i);
 await page.locator('.journey-stage').first().locator('summary').click();const step=page.locator('.lesson-step').first();
 await expect(step).toHaveClass(/lesson-done/);await expect(step).toContainText('Ukończona');await step.click();
 await expect(page.locator('#app')).toContainText('Nowy wstęp po poprawce lekcji.');
 await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).click();await expect(page.locator('.study-heading .tag')).toHaveText(/\/ 7$/);
 await finishCurrent(page,modules);await expect(page.locator('.lesson-reward')).toContainText('+1 ★');await expect(page.locator('.lesson-reward')).not.toContainText('+3');
 await page.reload();await expect(await wallet(page)).toContainText('145');
 await page.setViewportSize({width:320,height:640});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 const saved=await exported(page);onlyOneStarMore(saved,p);expect(saved.sessions.at(-1)!.items.map(i=>i.id).sort()).toEqual(['apple','biscuit','bread','cereal','cheese','food-can-pizza','milkshake']);
 await page.getByRole('button',{name:'Moja nauka',exact:true}).click();await openMap(page);await expect(page.locator('.journey-stage.stage-done')).toHaveCount(j.stages.length);
});
function onlyOneStarMore(saved:Progress,before:Progress){expect(saved.adventure!.completed).toEqual(before.adventure!.completed);expect(saved.adventure!.earned).toBe(before.adventure!.earned+1);expect(saved.adventure!.purchases).toEqual(before.adventure!.purchases);}

test('telefon: rozpoczęta stara sesja wznawia swoje pytania po zmianie treści; poziom legendarny bierze już nową',async({page})=>{
 const p=emptyProgress();p.adventure=freshAdventure();p.adventure.earned=9;p.active=makeLessonSession(modules,j,j.stages[0].lessons[0],'text',p);
 const prompt=questionFor(modules,p.active.items[0]).prompt;
 await serveChanged(page);await restore(page,p);await page.reload();await resumeStudy(page);
 await expect(page.locator('.question')).toHaveText(prompt);await expect(page.locator('.study-heading .tag')).toHaveText('1 / 5');
 await finishCurrent(page,modules);await expect(page.locator('.lesson-reward')).toContainText('+3 ★');
 await page.getByRole('button',{name:/Poziom legendarny/}).click();await expect(page.locator('.study-heading h1')).toContainText('Poziom legendarny');await expect(page.locator('.study-heading .tag')).toHaveText(/\/ 7$/);
 await finishCurrent(page,modules);await expect(page.locator('.lesson-reward')).toContainText('+1 ★');
 const saved=await exported(page);expect(Object.keys(saved.adventure!.completed)).toEqual([firstKey]);expect(saved.adventure!.earned).toBe(13);
 expect(saved.sessions.at(-2)!.items).toHaveLength(5);expect(saved.sessions.at(-1)!.legendary).toBe(true);expect(saved.sessions.at(-1)!.items).toHaveLength(7);
});
