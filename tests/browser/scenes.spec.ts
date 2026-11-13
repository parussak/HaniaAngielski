// D-53: dialogue scenes with several gaps. The scene itself is synthetic and is
// served in place of the module's dialogue file — adding one needs no code change.
import {test,expect,type Page} from './fixtures.ts';
import {openBackup,openMap,openModule} from './navigation.ts';
import {answerCurrent,resumeStudy} from './helpers.ts';
import {readFileSync} from 'node:fs';
import {emptyProgress,backup} from '../../src/core.ts';
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
  await page.getByRole('button',{name:'Popraw tę linijkę'}).tap();await page.getByRole('textbox').fill('duo');await page.getByRole('button',{name:/Sprawdź/}).tap();
  await expect(scene(page)).toHaveAttribute('data-key',key('three'));await expect(scene(page).locator('.scene-filled')).toHaveText(['uno','duo']);await expect(scene(page).locator('.dialogue-line')).toHaveCount(2);
  await page.reload();await resumeStudy(page);await expect(scene(page)).toHaveAttribute('data-key',key('three'));await expect(scene(page).locator('.scene-filled')).toHaveText(['uno','duo']);
  await page.setViewportSize({width:320,height:640});await noScroll(page);await page.screenshot({path:'test-results/scene-middle-320.png',fullPage:true});await page.setViewportSize({width:390,height:844});
  // Gap 3 wrong and left with "Dalej": the conversation goes on, the session does not grow.
  await page.locator('.option[data-answer="nope"]').tap();await expect(page.locator('.feedback.incorrect')).toContainText('Wyjaśnienie trzeciej luki.');await page.getByRole('button',{name:/Dalej/}).tap();
  await expect(scene(page)).toHaveAttribute('data-key',key('four'));await expect(scene(page).locator('.dialogue-line')).toHaveCount(4);await expect(page.locator('.study-heading .tag')).toHaveText('7 / 7');
  await page.screenshot({path:'test-results/scene-last-gap-mobile.png',fullPage:true});
  await page.getByRole('textbox').fill('quattro');await page.getByRole('button',{name:/Sprawdź/}).tap();
  // One summary for the whole conversation.
  await expect(page.locator('.scene-summary')).toContainText('Rozmowa ukończona!');await expect(page.locator('.scene-summary')).not.toContainText('poprawnie za pierwszym razem');await expect(page.locator('.scene-summary .dialogue-line')).toHaveCount(4);
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
 await expect(page.locator('.scene-summary')).toContainText('Rozmowa ukończona!');await page.getByRole('button',{name:/Dalej/}).focus();await page.keyboard.press('Enter');
 await expect(page.locator('.scene-summary')).toHaveCount(0);
});

// The published Food scene, with the real files: content only, no test routes.
test.describe('Food',()=>{
 test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const real=[food];
 test('mapa pokazuje historyjki także w ukończonej lekcji i zwiniętych etapach',async({page})=>{
  const p=emptyProgress(),key=`${food.id}/restaurant-dialogue-1`;
  p.adventure={version:1,earned:23,purchases:{},completed:{[key]:{at:'2026-11-01T12:00:00Z'}},reviewSchema:1};
  await page.goto('./');await openBackup(page);await page.locator('#import-file').setInputFiles({name:'story-progress.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(p)))});await page.getByRole('button',{name:'Zastąp postępy',exact:true}).click();await openMap(page);
  await expect(page.locator('.lesson-step .lesson-scene-badge')).toHaveCount(4);
  await expect(page.locator('.stage-scene-count')).toHaveText(['💬 Historyjki: 2','💬 Historyjki: 2']);
  await expect(page.locator('.stage-scene-count').first()).toBeVisible();await expect(page.locator('.story-map-note')).toBeVisible();
  const stage=page.locator('.journey-stage[data-stage-id="restaurant"]');if(await stage.getAttribute('open')===null)await stage.locator('summary').click();
  const lesson=stage.locator('.lesson-step[data-id="restaurant-dialogue-1"]');await expect(lesson).toHaveClass(/lesson-done/);await expect(lesson.locator('.lesson-scene-badge')).toBeVisible();await expect(page.locator('.star-wallet')).toContainText('23');
  await page.setViewportSize({width:320,height:844});await noScroll(page);await stage.screenshot({path:'test-results/story-map-badges-mobile.png'});
  await lesson.click();await expect(page.locator('.lesson-scene-badge')).toBeVisible();await expect(page.locator('.lesson-begin')).toContainText('już ukończona');
  await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).click();await expect(scene(page)).toHaveAttribute('data-position','1');await expect(page.locator('.study-heading .tag')).toHaveText('1 / 5');
  for(let i=0;i<5;i++)await answerCurrent(page,real);
  await page.getByRole('button',{name:/Dalej/}).click();await expect(page.locator('.lesson-reward')).toContainText('+1 ★');
  const saved=await exported(page);expect(saved.adventure!.completed).toEqual(p.adventure!.completed);expect(saved.adventure!.earned).toBe(24);
 });
 async function openDialogueLesson(page:Page){
  await openMap(page);const stage=page.locator('.journey-stage').nth(4);if(await stage.getAttribute('open')===null)await stage.locator('summary').tap();
  await stage.getByRole('button',{name:/Rozmowa przy stoliku(?! —)/}).first().tap();await expect(page.locator('#app')).toContainText('Uzupełniaj historyjkę krok po kroku');
  await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).tap();await expect(page.locator('.study-heading .tag')).toHaveText('1 / 5');
 }
 async function untilScene(page:Page){for(let step=0;!await scene(page).count();step++){expect(step).toBeLessThan(6);await answerCurrent(page,real);await page.getByRole('button',{name:/Dalej/}).tap();await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');}}
 test('telefon: „Zamówienie w restauracji” zamyka lekcję Rozmowa przy stoliku i daje +3 ★',async({page})=>{
  await page.goto('./');await openDialogueLesson(page);await untilScene(page);
  await expect(page.locator('.exercise-label')).toContainText('ZAMÓWIENIE W RESTAURACJI');await expect(scene(page).locator('.dialogue-line')).toHaveCount(1);await expect(scene(page)).toContainText('What');
  const actors=scene(page).locator('.scene-line-avatar .cat-mascot');await expect(actors).toHaveCount(1);const firstCat=await actors.first().getAttribute('data-cat');
  await expect(page.locator('.question-illustration img')).toHaveAttribute('src',/scene-ordering\.svg$/);
  await page.locator('.option[data-answer="would"]').tap();await expect(scene(page)).toHaveAttribute('data-position','2');await expect(page.locator('.question-illustration')).toHaveCount(0);
  await expect(actors).toHaveCount(2);const cast=await actors.evaluateAll(els=>els.map(el=>(el as HTMLElement).dataset.cat));expect(new Set(cast).size).toBe(2);expect(cast[0]).toBe(firstCat);await page.reload();await resumeStudy(page);expect(await actors.evaluateAll(els=>els.map(el=>(el as HTMLElement).dataset.cat))).toEqual(cast);
  await page.setViewportSize({width:320,height:640});await noScroll(page);
  for(const portrait of await actors.all()){const box=(await portrait.locator('svg').boundingBox())!,member=(await portrait.locator('..').boundingBox())!;expect(box.x+box.width).toBeLessThanOrEqual(member.x+member.width+1);}
  await page.screenshot({path:'test-results/scene-food-320.png',fullPage:true});await page.setViewportSize({width:390,height:844});
  for(let gap=2;gap<=5;gap++){await expect(scene(page)).toHaveAttribute('data-position',String(gap));await answerCurrent(page,real);}
  await expect(page.locator('.scene-summary .dialogue-line')).toHaveCount(7);await expect(page.locator('.scene-summary')).toContainText('Rozmowa ukończona!');await expect(page.locator('.scene-summary')).toContainText('Enjoy your meal!');
  const rows=page.locator('.scene-summary .scene-message');await expect(rows).toHaveCount(7);const assigned=await rows.evaluateAll(els=>els.map(el=>({role:(el as HTMLElement).dataset.speaker,cat:(el.querySelector('.cat-mascot') as HTMLElement).dataset.cat})));const roles=new Map(assigned.slice(0,2).map(r=>[r.role,r.cat]));expect([...roles.values()]).toEqual(cast);expect(assigned.every(r=>roles.get(r.role)===r.cat)).toBe(true);
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
   await offline.getByRole('button',{name:'Popraw tę linijkę'}).tap();
   for(let gap=2;gap<=5;gap++){await expect(scene(offline)).toHaveAttribute('data-position',String(gap));await answerCurrent(offline,real);}
   await expect(offline.locator('.scene-summary')).toContainText('Rozmowa ukończona!');await offline.getByRole('button',{name:/Dalej/}).tap();await expect(offline.locator('.lesson-reward')).toContainText('+3 ★');
  });
 });
});
