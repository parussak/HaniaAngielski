import {resumeStudy} from './helpers.ts';
import {finishCurrent,answerCurrent} from './helpers.ts';
import {openBackup} from './navigation.ts';
import {test,expect,type Page} from './fixtures.ts';
import {readFileSync} from 'node:fs';
import {foodModules as modules} from '../materials.ts';
import {backup,emptyProgress,questionFor,type Progress} from '../../src/core.ts';
import {freshAdventure,lessons,makeLessonSession,type Journey} from '../../src/adventure.ts';
const read=(f:string):Journey=>JSON.parse(readFileSync(new URL(`../../public/content/02-food/${f}.json`,import.meta.url),'utf8'));
const first=read('sciezka'),second=read('sciezka-praktyka'),at='2026-11-09T12:00:00.000Z';
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
function fixture(){const p=emptyProgress();p.adventure=freshAdventure();p.adventure.earned=9;p.adventure.reviewSchema=1;for(const e of lessons(second).slice(0,3))p.adventure.completed[e.key]={at};return p;}
async function restore(page:Page,p:Progress){await page.goto('./');await openBackup(page);await page.locator('#import-file').setInputFiles({name:'maps.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(p)))});await page.getByRole('button',{name:'Zastąp postępy',exact:true}).tap();await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();}
async function catalog(page:Page){await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();await page.getByRole('button',{name:/Wybierz przygodę/}).tap();}
async function open(page:Page,j:Journey){await catalog(page);await page.getByRole('button',{name:`Otwórz mapę ${j.title}`,exact:true}).tap();}
const finish=(page:Page,_ids:string[],_type:string)=>finishCurrent(page,modules);

test('pusty trening prowadzi do przygotowania, a potem działa i daje trzy gwiazdki tylko raz',async({page})=>{
 await restore(page,fixture());await open(page,second);await resumeStudy(page);
 await expect(page.getByRole('heading',{name:'Przygotuj się do rozgrzewki',exact:true})).toBeVisible();
 await page.setViewportSize({width:320,height:640});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.screenshot({path:'test-results/training-preparation-mobile.png',fullPage:true});
 await page.getByRole('button',{name:'Poznaj wcześniejszy materiał →',exact:true}).tap();
 await expect(page.getByRole('heading',{name:first.stages[0].lessons[0].title,exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Zaczynam ćwiczenia →',exact:true}).tap();
 await finish(page,first.stages[0].lessons[0].wordIds,'word');await expect(page.locator('.lesson-reward')).toContainText('+3 ★');
 await open(page,second);await expect(page.locator('.lead')).toContainText('3 z 5');await resumeStudy(page);
 await expect(page.getByRole('heading',{name:'Koci trening',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Zaczynam ćwiczenia →',exact:true}).tap();
 await expect(page.locator('.question')).toBeVisible();
 // Selection order may be shuffled, but every answer comes from the earlier lesson.
 while(await page.locator('.question').count()){
  const prompt=await page.locator('.question').innerText(),word=modules[0].words.find(w=>w.front===prompt)!;
  expect(first.stages[0].lessons[0].wordIds).toContain(word.id);
  await answerCurrent(page,modules);await page.getByRole('button',{name:/Dalej/}).tap();await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');
 }
 await expect(page.locator('.lesson-reward')).toContainText('+3 ★');await open(page,second);
 await page.getByRole('button',{name:/Koci trening Ukończona/}).tap();await page.getByRole('button',{name:'Zaczynam ćwiczenia →',exact:true}).tap();
 await expect(page.locator('.question')).toBeVisible();
 while(await page.locator('.question').count()){
  const prompt=await page.locator('.question').innerText(),value=modules[0].words.find(w=>w.front===prompt)?.back;
  await answerCurrent(page,modules);
  await expect(page.locator('.feedback.correct')).toBeVisible();await page.getByRole('button',{name:/Dalej/}).tap();await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');
 }
 await page.getByRole('button',{name:'Domek',exact:true}).tap();await expect(page.locator('.star-wallet')).toContainText('16');
});

test('404 drugiej mapy pozostawia pierwszą, a ponowienie odzyskuje obie bez utraty aktywnej sesji',async({page})=>{
 const p=fixture();p.active=makeLessonSession(modules,first,first.stages[0].lessons[0],'text',p);
 const prompt=questionFor(modules,p.active.items[0]).prompt;
 await page.route('**/content/02-food/sciezka-praktyka.json',r=>r.fulfill({status:404,body:'missing'}));
 await restore(page,p);await catalog(page);await expect(page.locator('.adventure-invite')).toHaveCount(1);await expect(page.locator('.map-load-error')).toBeVisible();
 await page.getByRole('button',{name:`Otwórz mapę ${first.title}`,exact:true}).tap();await expect(page.locator('.journey-stage')).toHaveCount(7);
 await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();await resumeStudy(page);await expect(page.locator('.question')).toHaveText(prompt);
 await catalog(page);await page.unroute('**/content/02-food/sciezka-praktyka.json');await page.getByRole('button',{name:'Spróbuj wczytać mapy ponownie',exact:true}).tap();
 await catalog(page);await expect(page.locator('.adventure-invite')).toHaveCount(2);await expect(page.locator('.map-load-error')).toHaveCount(0);
 await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();await resumeStudy(page);await expect(page.locator('.question')).toHaveText(prompt);
 await page.getByRole('button',{name:'Domek',exact:true}).tap();await expect(page.locator('.star-wallet')).toContainText('9');
});

test('niepoprawna pierwsza mapa nie ukrywa drugiej; rozgrzewka może przygotować materiał bieżącej mapy',async({page})=>{
 await page.route('**/content/02-food/sciezka.json',r=>r.fulfill({contentType:'application/json',body:'{broken'}));
 await restore(page,fixture());await open(page,second);await resumeStudy(page);
 await expect(page.locator('.training-preparation')).toContainText('Dzienniczek posiłków');
 await expect(page.getByRole('button',{name:'Poznaj wcześniejszy materiał →',exact:true})).toBeVisible();
 await page.unroute('**/content/02-food/sciezka.json');await catalog(page);await page.getByRole('button',{name:'Spróbuj wczytać mapy ponownie',exact:true}).tap();
 await open(page,second);await resumeStudy(page);await expect(page.getByRole('button',{name:'Poznaj wcześniejszy materiał →',exact:true})).toBeVisible();
});

test('sesja uszkodzonej mapy pozostaje zapisana, po naprawie wraca do tego samego pytania',async({page})=>{
 const p=fixture();p.active=makeLessonSession(modules,first,first.stages[0].lessons[0],'text',p);const prompt=questionFor(modules,p.active.items[0]).prompt;
 await page.route('**/content/02-food/sciezka.json',r=>r.fulfill({json:{version:99}}));await restore(page,p);
 await resumeStudy(page);await expect(page.getByRole('heading',{name:'Wczytaj mapę tej lekcji',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Wybierz inną mapę',exact:true}).tap();await expect(page.locator('.adventure-invite h2')).toHaveText(second.title);
 await page.unroute('**/content/02-food/sciezka.json');await page.getByRole('button',{name:'Spróbuj wczytać mapy ponownie',exact:true}).tap();
 await resumeStudy(page);await expect(page.locator('.question')).toHaveText(prompt);await expect(page.locator('.study-heading .tag')).toHaveText('1 / 5');
});
