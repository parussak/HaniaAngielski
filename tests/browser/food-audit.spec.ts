import {resumeStudy} from './helpers.ts';
import {finishCurrent,answerCurrent} from './helpers.ts';
import {openBackup} from './navigation.ts';
import {test,expect,type Page} from './fixtures.ts';
import {readFileSync} from 'node:fs';
import {foodModules as modules} from '../materials.ts';
import {backup,emptyProgress,questionFor,type Progress} from '../../src/core.ts';
import {freshAdventure,lessons,makeLessonSession,type Journey} from '../../src/adventure.ts';
import {openMap} from './navigation.ts';
const read=(f:string):Journey=>JSON.parse(readFileSync(new URL(`../../public/content/02-food/${f}.json`,import.meta.url),'utf8'));
const j=read('sciezka'),second=read('sciezka-praktyka'),at='2026-11-09T12:00:00.000Z';
function progress(all=false){const p=emptyProgress();p.adventure=freshAdventure();p.adventure.earned=144;p.adventure.reviewSchema=1;p.adventure.stageReviews={};for(const s of j.stages.filter((_,i)=>all||i<4)){p.adventure.stageReviews[`${j.moduleId}/${s.id}`]={round:0,items:{},rewardedAt:at};for(const l of s.lessons)p.adventure.completed[`${j.moduleId}/${l.id}`]={at};}return p;}
async function restore(page:Page,p:Progress){await page.goto('./');await openBackup(page);await page.locator('#import-file').setInputFiles({name:'food.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(p)))});await page.getByRole('button',{name:'Zastąp postępy',exact:true}).tap();await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();}
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});

test('telefon: ukończona restauracja zachowuje pięć pytań, nieukończona dostaje sześć',async({page})=>{
 const p=progress();p.adventure!.completed[`${j.moduleId}/restaurant-words-1`]={at};await restore(page,p);await openMap(page);
 const stage=page.locator('.journey-stage').nth(4);
 await stage.getByRole('button',{name:/Pierwsze zamówienie/}).tap();
 await expect(page.locator('.lesson-begin')).toContainText('do 10 zadań');
 await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).tap();await expect(page.locator('.study-heading .tag')).toHaveText('1 / 5');
 await restore(page,progress());await openMap(page);await stage.getByRole('button',{name:/Pierwsze zamówienie/}).tap();
 await expect(page.locator('.lesson-begin')).toContainText('do 10 zadań');await expect(page.locator('.lesson-rule')).toHaveCount(1);
 await page.setViewportSize({width:320,height:640});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.screenshot({path:'test-results/food-updated-lesson-mobile.png',fullPage:true});
});

test('telefon: dawna rozpoczęta sesja wznawia te same pytania i nie zmienia salda',async({page})=>{
 const p=progress(),l=structuredClone(j.stages[4].lessons[0]);delete l.update;p.active=makeLessonSession(modules,j,l,'text',p);
 const prompt=questionFor(modules,p.active.items[0]).prompt;
 await restore(page,p);await page.reload();await resumeStudy(page);
 await expect(page.locator('.question')).toHaveText(prompt);await expect(page.locator('.study-heading .tag')).toHaveText('1 / 5');
 await page.getByRole('button',{name:'Domek',exact:true}).tap();await expect(page.locator('.star-wallet')).toContainText('144');
});

test('telefon: po starej mapie kontynuacja otwiera nową, przyznaje trzy gwiazdki i zachowuje odznakę',async({page})=>{
 await restore(page,progress(true));await page.getByRole('button',{name:'Domek',exact:true}).tap();await expect(page.locator('.module-award')).toContainText('Odznaka kociego kucharza');
 await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();await expect(page.locator('.next-step-detail')).toContainText('Dzienniczek posiłków');
 await resumeStudy(page);await expect(page.getByRole('heading',{name:'Dzienniczek posiłków',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).tap();
 await finishCurrent(page,modules);
 await expect(page.locator('.lesson-reward')).toContainText('+3 ★');await page.reload();
 await expect(page.locator('.next-step-detail')).toContainText('Naleśnik krok po kroku');await page.getByRole('button',{name:'Domek',exact:true}).tap();await expect(page.locator('.star-wallet')).toContainText('147');
 await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();await page.getByRole('button',{name:/Wybierz przygodę/}).tap();await expect(page.locator('.adventure-invite')).toHaveCount(2);
 await page.getByRole('button',{name:`Otwórz mapę ${second.title}`,exact:true}).tap();await expect(page.locator('.lead')).toContainText('1 z 5');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.screenshot({path:'test-results/food-second-map-mobile.png',fullPage:true});
});

test.describe('PWA Food',()=>{
 test.use({serviceWorkers:'allow'});
 test('druga mapa uruchamia się offline po zamknięciu strony i zachowuje odpowiedź',async({page,context})=>{
  test.skip(process.env.HANIA_TEST_BUILD!=='1'||!!process.env.HANIA_BASE_URL,'Wymaga lokalnego buildu z service workerem.');
  await restore(page,progress(true));await expect(page.locator('[data-offline-status]')).toContainText('Materiały gotowe');
  await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBeTruthy();
  await page.close();await context.setOffline(true);const offline=await context.newPage();await offline.goto('./');
  await resumeStudy(offline);await expect(offline.getByRole('heading',{name:'Dzienniczek posiłków',exact:true})).toBeVisible();
  await offline.getByRole('button',{name:'Zaczynam ćwiczenia →'}).tap();
  await answerCurrent(offline,modules);
  await offline.reload();await resumeStudy(offline);await expect(offline.locator('.feedback.correct')).toBeVisible();await expect(offline.locator('.study-heading .tag')).toHaveText('1 / 6');
  await offline.getByRole('button',{name:/Dalej/}).tap();await expect(offline.locator('.question')).toContainText('Dzienniczek:');await expect(offline.locator('.study-heading .tag')).toHaveText('2 / 6');
 });
});
