// D-68: czytanki. The reading is synthetic and is served in place of the module's files —
// adding one needs no code change, only czytanki.json pointed to by modul.json.
import {test,expect,type Page,type BrowserContext} from './fixtures.ts';
import {openMap,openModule} from './navigation.ts';
import {resumeStudy} from './helpers.ts';
import {readFileSync} from 'node:fs';
import {food} from '../materials.ts';
import {readingEntry,readingQuestionIds} from '../fixtures/readings.ts';
const read=(file:string)=>JSON.parse(readFileSync(new URL(`../../public/content/02-food/${file}`,import.meta.url),'utf8'));
/** The first lesson of the published map becomes the whole reading (D-54). */
function withReading(){const j=read('sciezka.json'),l=j.stages[0].lessons[0];l.wordIds=[];l.exerciseIds=readingQuestionIds();return j;}
async function serve(page:Page){
 await page.route('**/content/02-food/modul.json',r=>r.fulfill({json:{...read('modul.json'),readingsFile:'czytanki.json'}}));
 await page.route('**/content/02-food/czytanki.json',r=>r.fulfill({json:[readingEntry('picnic',food.id)]}));
 await page.route('**/content/02-food/sciezka.json',r=>r.fulfill({json:withReading()}));
}
const idle=(page:Page)=>expect(page.locator('#app')).toHaveAttribute('aria-busy','false');
const reading=(page:Page)=>page.locator('.reading:not(.reading-context)');
const next=(page:Page)=>page.locator('[data-reading-next]');
const noScroll=async(page:Page)=>expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
async function startReading(page:Page){await serve(page);await page.goto('./');await openMap(page);await resumeStudy(page);await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).click();await idle(page);await expect(reading(page)).toBeVisible();}

test.describe('telefon',()=>{
 test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 test('czytanka w lekcji: zdania po „Dalej”, pytania blokują przejście, tłumaczenie na dotknięcie, wznowienie i ponowne czytanie',async({page})=>{
  await startReading(page);
  await expect(page.locator('.exercise-label')).toContainText('CZYTANKA PICNIC');await expect(page.locator('.study-heading .tag')).toHaveText('1 / 3');
  // The first question follows the first sentence: open, so „Dalej” waits and no translation can give the answer away.
  await expect(reading(page)).toHaveAttribute('data-visible','1');await expect(reading(page).locator('.reading-sentence')).toHaveCount(1);
  await expect(page.getByRole('heading',{name:'Gdzie siedzą?'})).toBeVisible();await expect(next(page)).toBeDisabled();
  await expect(reading(page).locator('.reading-word')).toHaveCount(0);await expect(page.getByRole('button',{name:'Pokaż tłumaczenie zdania'})).toHaveCount(0);
  expect((await page.locator('.reading .option').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().height))).every(h=>h>=44)).toBeTruthy();
  // A mistake: ordinary feedback with the explanation and a voluntary correction.
  await page.getByRole('button',{name:'w kuchni'}).tap();await idle(page);
  await expect(page.locator('.reading .feedback.incorrect')).toContainText('Zdanie mówi: in the garden.');await expect(page.getByRole('button',{name:'Popraw odpowiedź'})).toBeVisible();await expect(next(page)).toBeEnabled();
  // Now translations: a word from the reading's list, then the whole sentence.
  await page.getByRole('button',{name:'Przetłumacz: garden'}).tap();await idle(page);
  await expect(page.locator('.reading-translation')).toHaveText('„garden” — ogród');
  await page.getByRole('button',{name:'Przetłumacz: sit'}).tap();await idle(page);
  await expect(page.locator('.reading-translation')).toContainText('Ala i Olek siedzą w ogrodzie.');
  await page.getByRole('button',{name:'Pokaż tłumaczenie zdania'}).tap();await idle(page);
  await expect(page.locator('.reading-translation')).toHaveText('Tłumaczenie zdania: Ala i Olek siedzą w ogrodzie.');
  await noScroll(page);
  // „Dalej”: the next sentence, and the tap question about it.
  await next(page).tap();await idle(page);
  await expect(reading(page)).toHaveAttribute('data-visible','2');await expect(page.locator('.reading-translation')).toHaveCount(0);
  await expect(page.locator('.reading-done.incorrect')).toContainText('w kuchni');await expect(page.locator('.study-heading .tag')).toHaveText('2 / 3');
  await expect(page.locator('.reading-tap .reading-answer')).toHaveText(['Olek','has','got','some','apples']);await expect(next(page)).toBeDisabled();
  await page.locator('.reading-answer',{hasText:'apples'}).tap();await idle(page);await expect(page.locator('.reading .feedback.correct')).toContainText('Apples to jabłka.');
  await page.setViewportSize({width:320,height:640});await noScroll(page);await page.screenshot({path:'test-results/reading-middle-320.png',fullPage:true});await page.setViewportSize({width:390,height:844});
  // Refresh: back to the last answered question, with its feedback; no saved sentence counter is needed.
  await page.reload();await resumeStudy(page);await idle(page);
  await expect(reading(page)).toHaveAttribute('data-visible','2');await expect(page.locator('.reading .feedback.correct')).toContainText('Apples to jabłka.');
  // On a computer → works like „Dalej”.
  await page.keyboard.press('ArrowRight');await idle(page);await expect(reading(page)).toHaveAttribute('data-visible','3');
  await page.getByRole('button',{name:'książkę'}).tap();await idle(page);await next(page).tap();await idle(page);
  await expect(reading(page)).toHaveAttribute('data-visible','4');
  // The end: the earlier mistake can still be corrected, then the reading closes.
  await page.getByRole('button',{name:'Popraw odpowiedź'}).tap();await idle(page);await expect(next(page)).toBeDisabled();
  await page.getByRole('button',{name:'w ogrodzie'}).tap();await idle(page);await next(page).tap();await idle(page);
  await expect(page.getByRole('button',{name:/Zakończ czytankę/})).toBeVisible();await page.screenshot({path:'test-results/reading-end-mobile.png',fullPage:true});
  await page.getByRole('button',{name:/Zakończ czytankę/}).tap();await idle(page);
  await expect(page.locator('.study-heading')).toHaveCount(0);
  // „Czytanki”: the known reading can be read again in the module.
  await openModule(page);await expect(page.getByRole('heading',{name:'Czytanki'})).toBeVisible();
  await page.getByRole('button',{name:/Czytanka picnic/}).tap();await idle(page);
  await expect(reading(page)).toHaveAttribute('data-visible','1');await expect(page.locator('.study-heading h1')).toHaveText('Czytanki');
 });
});

/** Records every utterance, as in listening.spec.ts. */
function speechMock(){
 const w=window as any;w.__spoken=[];
 w.SpeechSynthesisUtterance=class{text:string;lang='';rate=1;voice:unknown=null;onerror:any=null;constructor(text:string){this.text=text;}};
 Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[{lang:'pl-PL',localService:true},{lang:'en-GB',localService:true}],cancel(){},addEventListener(){},speak(u:any){w.__spoken.push({text:u.text,lang:u.lang,rate:u.rate});}}});
}
const spoken=(page:Page)=>page.evaluate(()=>((window as any).__spoken as {text:string;rate:number}[]).map(u=>`${u.text}@${u.rate}`));
test('słuchanie: każde nowe zdanie jest odczytane raz, w tempie dialogów; wyłączone słuchanie milczy',async({page,context}:{page:Page;context:BrowserContext})=>{
 await context.addInitScript(speechMock);
 await startReading(page);
 await expect.poll(()=>spoken(page)).toEqual(['Ala and Olek sit in the garden.@0.9']);
 // Answering and a translation do not repeat the sentence.
 await page.getByRole('button',{name:'w ogrodzie'}).click();await idle(page);await page.getByRole('button',{name:'Przetłumacz: garden'}).click();await idle(page);
 expect(await spoken(page)).toEqual(['Ala and Olek sit in the garden.@0.9']);
 await next(page).click();await idle(page);
 await expect.poll(()=>spoken(page)).toEqual(['Ala and Olek sit in the garden.@0.9','Olek has got some apples.@0.9']);
 // Later on request, with „Wolniej”.
 await page.locator('.reading-new').getByRole('button',{name:'Wolniej'}).click();
 await expect.poll(async()=>(await spoken(page)).at(-1)).toBe('Olek has got some apples.@0.63');
 await page.evaluate(()=>{localStorage.setItem('male-kroki:sluchanie','off');(window as any).__spoken=[];});
 // After a refresh the text returns to the last answered question; „Dalej” shows the next sentence again.
 await page.reload();await resumeStudy(page);await idle(page);await expect(reading(page)).toHaveAttribute('data-visible','1');
 await next(page).click();await idle(page);await page.locator('.reading-answer',{hasText:'apples'}).click();await idle(page);await next(page).click();await idle(page);
 await expect(reading(page)).toHaveAttribute('data-visible','3');expect(await spoken(page)).toEqual([]);
});
