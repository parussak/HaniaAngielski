// D-53: dialogue scenes with several gaps. The scene itself is synthetic and is
// served in place of the module's dialogue file — adding one needs no code change.
import {test,expect,type Page} from './fixtures.ts';
import {openBackup,openMap,openModule} from './navigation.ts';
import {answerCurrent,resumeStudy} from './helpers.ts';
import {readFileSync} from 'node:fs';
import {food} from '../materials.ts';
import {sceneEntry} from '../fixtures/scenes.ts';
import {compileScene} from '../../src/learning/scenes.ts';
import {validateModules} from '../../src/content-validation.ts';
import type {Progress} from '../../src/core.ts';
const read=(file:string)=>JSON.parse(readFileSync(new URL(`../../public/content/02-food/${file}`,import.meta.url),'utf8'));
const entry=sceneEntry('talk',food.id),compiled=compileScene(entry);
const modules=validateModules([{...food,exercises:[...food.exercises,...compiled.exercises],scenes:[...(food.scenes??[]),compiled.scene]}]);
const key=(gap:string)=>`${food.id}@1:exercise:talk--${gap}`;
/** The first lesson of the published map with three words and the scene. */
function withScene(){const j=read('sciezka.json'),l=j.stages[0].lessons[0];l.wordIds=l.wordIds.slice(0,3);l.exerciseIds=compiled.scene.gapIds;return j;}
async function serve(page:Page,dialogues:unknown[]){await page.route('**/content/02-food/rozmowki.json',r=>r.fulfill({json:dialogues}));await page.route('**/content/02-food/sciezka.json',r=>r.fulfill({json:withScene()}));}
async function exported(page:Page){await openBackup(page);const wait=page.waitForEvent('download');await page.getByRole('button',{name:'Zapisz kopię postępów',exact:true}).click();return JSON.parse(readFileSync((await(await wait).path())!,'utf8')).progress as Progress;}
const scene=(page:Page)=>page.locator('.scene:not(.scene-summary .scene)');
const noScroll=async(page:Page)=>expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();

test.describe('telefon',()=>{
 test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 test('scena w lekcji: kwestie po kolei, bank i wpisywanie, każda luka oceniana osobno, wznowienie w środku i błąd w powtórkach',async({page})=>{
  await serve(page,[...read('rozmowki.json'),entry]);
  await page.goto('./');await openMap(page);await resumeStudy(page);await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).tap();
  // The three words come first; the scene closes the lesson.
  await expect(page.locator('.study-heading .tag')).toHaveText('1 / 7');
  for(let step=0;!await scene(page).count();step++){expect(step).toBeLessThan(4);await answerCurrent(page,modules);await page.getByRole('button',{name:/Dalej/}).tap();await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');}
  await expect(page.locator('.study-heading .tag')).toHaveText('4 / 7');await expect(page.locator('.exercise-label')).toContainText('ROZMOWA TALK');
  // Gap 1, bank: only the first line is shown; every answer button is at least 44 px high.
  await expect(scene(page)).toHaveAttribute('data-key',key('one'));await expect(scene(page).locator('.dialogue-line')).toHaveCount(1);await expect(scene(page).locator('.scene-current')).toHaveCount(1);
  await expect(page.locator('.option')).toHaveCount(3);await expect(page.getByRole('textbox')).toHaveCount(0);
  expect((await page.locator('.option').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().height))).every(h=>h>=44)).toBeTruthy();
  await page.locator('.option[data-answer="uno"]').tap();
  // Correct: no feedback step, the second line appears and the first keeps its answer.
  await expect(scene(page)).toHaveAttribute('data-key',key('two'));await expect(page.locator('.feedback')).toHaveCount(0);await expect(page.getByRole('button',{name:/Dalej/})).toHaveCount(0);
  await expect(scene(page).locator('.dialogue-line')).toHaveCount(2);await expect(scene(page).locator('.scene-filled')).toHaveText(['uno']);await expect(page.locator('.study-heading .tag')).toHaveText('5 / 7');
  // Gap 2, typing: a mistake shows the Polish explanation and both ways forward.
  await expect(page.locator('.option')).toHaveCount(0);await page.getByRole('textbox').fill('wrong');await page.getByRole('button',{name:/Sprawdź/}).tap();
  await expect(page.locator('.feedback.incorrect')).toContainText('Wyjaśnienie drugiej luki.');await expect(page.locator('.given-answer')).toContainText('wrong');await expect(page.locator('.expected-answer')).toContainText('duo');
  await expect(page.locator('.study-heading .tag')).toHaveText('5 / 7');await noScroll(page);
  // Refresh in the middle of the scene: the same gap, the same mistake, earlier answers kept.
  await page.reload();await resumeStudy(page);await expect(page.locator('.feedback.incorrect')).toContainText('Wyjaśnienie drugiej luki.');await expect(scene(page)).toHaveAttribute('data-key',key('two'));await expect(scene(page).locator('.scene-filled')).toHaveText(['uno']);
  await page.getByRole('button',{name:'Spróbuję jeszcze raz'}).tap();await page.getByRole('textbox').fill('duo');await page.getByRole('button',{name:/Sprawdź/}).tap();
  await expect(scene(page)).toHaveAttribute('data-key',key('three'));await expect(scene(page).locator('.scene-filled')).toHaveText(['uno','duo']);await expect(scene(page).locator('.dialogue-line')).toHaveCount(2);
  await page.reload();await resumeStudy(page);await expect(scene(page)).toHaveAttribute('data-key',key('three'));await expect(scene(page).locator('.scene-filled')).toHaveText(['uno','duo']);
  await page.setViewportSize({width:320,height:640});await noScroll(page);await page.screenshot({path:'test-results/scene-middle-320.png',fullPage:true});await page.setViewportSize({width:390,height:844});
  // Gap 3 wrong and left with "Dalej": the conversation goes on, the session does not grow.
  await page.locator('.option[data-answer="nope"]').tap();await expect(page.locator('.feedback.incorrect')).toContainText('Wyjaśnienie trzeciej luki.');await page.getByRole('button',{name:/Dalej/}).tap();
  await expect(scene(page)).toHaveAttribute('data-key',key('four'));await expect(scene(page).locator('.dialogue-line')).toHaveCount(4);await expect(page.locator('.study-heading .tag')).toHaveText('7 / 7');
  await page.screenshot({path:'test-results/scene-last-gap-mobile.png',fullPage:true});
  await page.getByRole('textbox').fill('quattro');await page.getByRole('button',{name:/Sprawdź/}).tap();
  // One summary for the whole conversation.
  await expect(page.locator('.scene-summary')).toContainText('Rozmowa ukończona!');await expect(page.locator('.scene-summary')).toContainText('2 / 4');await expect(page.locator('.scene-summary .dialogue-line')).toHaveCount(4);
  await expect(page.locator('.scene-summary .scene-filled')).toHaveText(['uno','duo','trio','quattro']);await expect(page.locator('.scene-summary li')).toHaveCount(4);await noScroll(page);
  await page.screenshot({path:'test-results/scene-summary-mobile.png',fullPage:true});
  await page.reload();await resumeStudy(page);await expect(page.locator('.scene-summary')).toContainText('Rozmowa ukończona!');
  await page.getByRole('button',{name:/Dalej/}).tap();await expect(page.locator('.lesson-reward')).toContainText('+3 ★');
  const saved=await exported(page),session=saved.sessions.at(-1)!,result=Object.fromEntries(session.attempts.filter(a=>a.key.includes('talk--')).map(a=>[a.key.split('--')[1],[a.first,a.corrected]]));
  expect(session.items).toHaveLength(7);expect(result).toEqual({one:[true,false],two:[false,true],three:[false,false],four:[true,false]});
  expect(session.items.slice(-4).map(i=>i.sceneGroup)).toEqual(Array(4).fill(key('one')));
  // Both mistakes wait for a review; correct gaps do not.
  expect(Object.keys(saved.adventure!.memory??{}).filter(k=>k.includes('talk--')).sort()).toEqual([key('three'),key('two')]);expect(saved.difficult).toEqual(expect.arrayContaining([key('two'),key('three')]));expect(saved.difficult).not.toContain(key('one'));
 });
});

test('klawiatura: scena w trybie Rozmówki — Enter wybiera z banku i zatwierdza wpisaną odpowiedź',async({page})=>{
 await serve(page,[read('rozmowki.json')[0],entry]);
 await page.goto('./');await openModule(page);await page.getByText('Wybieram odpowiedź',{exact:true}).click();await page.getByRole('button',{name:'Rozmówki',exact:true}).click();
 await expect(page.locator('.study-heading .tag')).toHaveText('1 / 5');
 if(!await scene(page).count()){await answerCurrent(page,modules);await page.getByRole('button',{name:/Dalej/}).click();}
 await expect(scene(page)).toHaveAttribute('data-key',key('one'));
 // The way of answering comes from the scene, not from the session setting.
 await page.locator('.option[data-answer="uno"]').focus();await page.keyboard.press('Enter');
 await expect(scene(page)).toHaveAttribute('data-key',key('two'));await expect(page.locator('#answer')).toBeFocused();await page.keyboard.type('duo');await page.keyboard.press('Enter');
 await expect(scene(page)).toHaveAttribute('data-key',key('three'));await page.locator('.option[data-answer="trio"]').focus();await page.keyboard.press('Space');
 await expect(scene(page)).toHaveAttribute('data-key',key('four'));await expect(page.locator('#answer')).toBeFocused();await page.keyboard.type('4');await page.keyboard.press('Enter');
 await expect(page.locator('.scene-summary')).toContainText('4 / 4');await page.getByRole('button',{name:/Dalej/}).focus();await page.keyboard.press('Enter');
 await expect(page.locator('.scene-summary')).toHaveCount(0);
});

// The published Food scene, with the real files: content only, no test routes.
test.describe('Food',()=>{
 test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const real=[food];
 async function openDialogueLesson(page:Page){
  await openMap(page);const stage=page.locator('.journey-stage').nth(4);if(await stage.getAttribute('open')===null)await stage.locator('summary').tap();
  await stage.getByRole('button',{name:/Rozmowa przy stoliku(?! —)/}).first().tap();await expect(page.locator('#app')).toContainText('cała rozmowa przy stoliku');
  await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).tap();await expect(page.locator('.study-heading .tag')).toHaveText(/^1 \/ ([7-9]|10)$/);
 }
 async function untilScene(page:Page){for(let step=0;!await scene(page).count();step++){expect(step).toBeLessThan(6);await answerCurrent(page,real);await page.getByRole('button',{name:/Dalej/}).tap();await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');}}
 test('telefon: „Zamówienie w restauracji” zamyka lekcję Rozmowa przy stoliku i daje +3 ★',async({page})=>{
  await page.goto('./');await openDialogueLesson(page);await untilScene(page);
  await expect(page.locator('.exercise-label')).toContainText('ZAMÓWIENIE W RESTAURACJI');await expect(scene(page).locator('.dialogue-line')).toHaveCount(1);await expect(scene(page)).toContainText('What');
  await expect(page.locator('.question-illustration img')).toHaveAttribute('src',/scene-ordering\.svg$/);
  await page.locator('.option[data-answer="would"]').tap();await expect(scene(page)).toHaveAttribute('data-position','2');await expect(page.locator('.question-illustration')).toHaveCount(0);
  await page.setViewportSize({width:320,height:640});await noScroll(page);await page.screenshot({path:'test-results/scene-food-320.png',fullPage:true});await page.setViewportSize({width:390,height:844});
  for(let gap=2;gap<=5;gap++){await expect(scene(page)).toHaveAttribute('data-position',String(gap));await answerCurrent(page,real);}
  await expect(page.locator('.scene-summary .dialogue-line')).toHaveCount(7);await expect(page.locator('.scene-summary')).toContainText('5 / 5');await expect(page.locator('.scene-summary')).toContainText('Enjoy your meal!');
  await page.screenshot({path:'test-results/scene-food-summary-mobile.png',fullPage:true});
  // A long conversation scrolls inside the card: the last line and the last explanation can be reached.
  for(const part of ['.scene-summary .dialogue-line','.scene-summary li']){await page.locator(part).last().scrollIntoViewIfNeeded();await expect(page.locator(part).last()).toBeInViewport({ratio:0.9});}
  const nav=await page.locator('.sidebar nav').boundingBox(),done=await page.getByRole('button',{name:/Dalej/}).boundingBox();expect(done!.y+done!.height).toBeLessThanOrEqual(nav!.y);
  await page.getByRole('button',{name:/Dalej/}).tap();await expect(page.locator('.lesson-reward')).toContainText('+3 ★');
 });
 test.describe('offline',()=>{
  test.use({serviceWorkers:'allow'});
  test('scena przetrwa zamknięcie bez internetu i wraca do tej samej luki',async({page,context})=>{
   test.skip(process.env.HANIA_TEST_BUILD!=='1'||!!process.env.HANIA_BASE_URL,'Wymaga lokalnego wydania PWA.');
   await page.goto('./');await expect(page.locator('[data-offline-status]')).toContainText('Materiały gotowe');await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBeTruthy();
   await openDialogueLesson(page);await context.setOffline(true);await untilScene(page);
   await answerCurrent(page,real);await expect(scene(page)).toHaveAttribute('data-position','2');await answerCurrent(page,real,false);await expect(page.locator('.feedback.incorrect')).toContainText('Can I have');
   await page.close();const offline=await context.newPage();await offline.goto('./');await resumeStudy(offline);
   await expect(offline.locator('.feedback.incorrect')).toContainText('Can I have');await expect(scene(offline)).toHaveAttribute('data-position','2');await expect(scene(offline).locator('.scene-filled')).toHaveText(['would']);
   await offline.getByRole('button',{name:'Spróbuję jeszcze raz'}).tap();
   for(let gap=2;gap<=5;gap++){await expect(scene(offline)).toHaveAttribute('data-position',String(gap));await answerCurrent(offline,real);}
   await expect(offline.locator('.scene-summary')).toContainText('4 / 5');await offline.getByRole('button',{name:/Dalej/}).tap();await expect(offline.locator('.lesson-reward')).toContainText('+3 ★');
  });
 });
});
