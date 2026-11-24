// D-80: zgłaszanie problemu z zadania na telefonie. Adapter Firebase jest atrapą, która zapisuje wysłane zgłoszenia;
// reguły Firestore tu nie działają (patrz docs/zgloszenia-problemow.md, „Co sprawdzono”).
import {test,expect,type BrowserContext,type Page} from './fixtures.ts';
import {openMap} from './navigation.ts';
import {answerCurrent,resumeStudy} from './helpers.ts';
import {readFileSync} from 'node:fs';
import {food} from '../materials.ts';
import {sceneEntry} from '../fixtures/scenes.ts';
import {compileScene} from '../../src/learning/scenes.ts';
import {validateModules} from '../../src/content-validation.ts';
import type {ProblemReport} from '../../src/learning/problem-report.ts';

const read=(file:string)=>JSON.parse(readFileSync(new URL(`../../public/content/angielski-hani/02-food/${file}`,import.meta.url),'utf8'));
const entry=sceneEntry('talk',food.id),compiled=compileScene(entry);
const modules=validateModules([{...food,exercises:[...food.exercises,...compiled.exercises],scenes:[...(food.scenes??[]),compiled.scene]}]);
function withScene(){const j=read('sciezka.json'),l=j.stages[0].lessons[0];l.wordIds=l.wordIds.slice(0,3);l.exerciseIds=compiled.scene.gapIds;return j;}
async function serveScene(page:Page){await page.route('**/content/angielski-hani/02-food/rozmowki.json',r=>r.fulfill({json:[...read('rozmowki.json'),entry]}));await page.route('**/content/angielski-hani/02-food/sciezka.json',r=>r.fulfill({json:withScene()}));}

const mockSDK=String.raw`
export const restoreUser=async()=>JSON.parse(localStorage.getItem('test-user')??'null');
export async function login(email,password,register,name=''){const user={uid:email,email,displayName:register?name:null};localStorage.setItem('test-user',JSON.stringify(user));return user;}
export async function logout(){localStorage.removeItem('test-user');}
export const firebaseMessage=e=>e.message;
export const fetchProgress=async()=>null;
export const pushProgress=async(uid,progress,revision)=>({revision:revision+1,progress});
export async function sendReport(uid,report){const r=await fetch(new URL('__test/reports',document.baseURI),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({uid,report})});if(!r.ok)throw new Error('Chmura niedostępna');}
`;
/** The cloud stand-in: it keeps every report it was sent, once per document id, like Firestore under a fixed id. */
async function cloud(context:BrowserContext){
 const documents=new Map<string,{uid:string;report:ProblemReport}>(),posts:string[]=[];
 await context.route(/\/(?:assets\/firebase-[^/]+\.js|src\/firebase\.ts)(?:\?.*)?$/,r=>r.fulfill({contentType:'application/javascript',body:mockSDK}));
 await context.route('**/__test/reports',async route=>{const body=route.request().postDataJSON() as {uid:string;report:ProblemReport};posts.push(body.report.id);documents.set(body.report.id,body);await route.fulfill({json:{}});});
 return {documents,posts};
}
interface Device{voices:{lang:string;localService:boolean}[]}
function speechMock(device:Device){
 const w=window as any;w.__spoken=[];
 w.SpeechSynthesisUtterance=class{text:string;lang='';rate=1;voice:unknown=null;onerror:any=null;constructor(text:string){this.text=text;}};
 Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>device.voices,cancel(){},addEventListener(){},speak(u:any){w.__spoken.push({text:u.text,lang:u.lang});}}});
}
const english:Device={voices:[{lang:'en-GB',localService:true}]};
const idle=(page:Page)=>expect(page.locator('#app')).toHaveAttribute('aria-busy','false');
const dialog=(page:Page)=>page.getByRole('dialog');
async function signIn(page:Page,email='hania@example.test'){
 await page.getByRole('button',{name:'Ustawienia konta',exact:true}).click();
 await page.getByRole('textbox',{name:'E-mail'}).fill(email);await page.getByLabel('Hasło',{exact:true}).fill('test-password');
 await page.getByRole('button',{name:'Zaloguj się',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Twoje konto',exact:true})).toBeVisible();await expect(page.getByRole('status')).toContainText('Wyniki zapisane na koncie.');
}
async function startLesson(page:Page){await page.goto('./');await openMap(page);await resumeStudy(page);await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).click();await expect(page.locator('.study-heading')).toBeVisible();}
const noScroll=async(page:Page)=>expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();

test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});

test('telefon: niewyraźna druga kwestia dialogu trafia do wpisu z numerem kwestii, a zadanie zostaje bez zmian',async({page,context})=>{
 await context.addInitScript(speechMock,english);const backend=await cloud(context);await serveScene(page);
 await page.goto('./');await signIn(page);await page.getByRole('button',{name:'Moja nauka',exact:true}).click();await openMap(page);await resumeStudy(page);await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).click();
 const scene=page.locator('.scene:not(.scene-summary .scene)');
 for(let step=0;!await scene.count();step++){expect(step).toBeLessThan(4);await answerCurrent(page,modules);await page.getByRole('button',{name:/Dalej/}).click();await idle(page);}
 await page.locator('.option[data-answer="uno"]').click();await idle(page);
 await page.getByRole('textbox').fill('duo');await page.getByRole('button',{name:/Sprawdź/}).click();await idle(page);
 await page.locator('.option[data-answer="trio"]').click();await idle(page);
 await expect(scene.locator('.scene-say')).toHaveCount(3);
 // The learner replays the second line, then starts typing the last gap.
 await scene.locator('.scene-say').nth(1).click();
 await expect.poll(()=>page.evaluate(()=>(window as any).__spoken.at(-1)?.text)).toBe('Beta duo and gamma trio.');
 await page.getByRole('textbox').fill('qua');const tag=await page.locator('.study-heading .tag').innerText();

 await page.getByRole('button',{name:'Zgłoś problem',exact:true}).click();
 await expect(dialog(page).getByRole('heading',{name:'Co jest nie tak?'})).toBeVisible();
 await expect(dialog(page).getByRole('button')).toHaveText(['Nic nie słychać','Słychać, ale trudno zrozumieć','W zadaniu lub odpowiedzi jest błąd','Coś innego','Zamknij']);
 expect((await dialog(page).getByRole('button').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().height))).every(h=>h>=44)).toBeTruthy();
 await noScroll(page);
 await dialog(page).getByRole('button',{name:'Słychać, ale trudno zrozumieć'}).click();
 await expect(dialog(page).getByRole('heading',{name:'Której wypowiedzi to dotyczy?'})).toBeVisible();
 const choices=dialog(page).locator('.report-choice');await expect(choices).toHaveCount(3);
 await expect(choices.nth(1)).toContainText('Kwestia 2 · Olek');await expect(choices.nth(1)).toContainText('ostatnio odtwarzana');await expect(choices.nth(1)).toContainText('Beta duo and gamma trio.');
 await choices.nth(1).click();
 await expect(dialog(page).getByRole('status')).toHaveText('Wysłano. Dziękujemy!');
 expect(backend.posts).toHaveLength(1);
 const {uid,report}=[...backend.documents.values()][0];
 expect(uid).toBe('hania@example.test');expect(report.category).toBe('unclear');expect(report.module).toBe(food.id);expect(report.item).toBe(`${food.id}@1:exercise:talk--four`);
 expect(report.audio).toEqual({text:'Beta duo and gamma trio.',language:'en',line:2,speaker:'Olek',playback:'device-voice'});

 await page.screenshot({path:'test-results/report-done-390.png'});
 await dialog(page).getByRole('button',{name:'Wróć do zadania'}).click();
 await expect(dialog(page)).toHaveCount(0);
 // Same task, same typed answer, same place in the lesson.
 await expect(page.getByRole('textbox')).toHaveValue('qua');await expect(page.locator('.study-heading .tag')).toHaveText(tag);
 await page.getByRole('textbox').fill('quattro');await page.getByRole('button',{name:/Sprawdź/}).click();await idle(page);
 await expect(page.locator('.board-summary')).toBeVisible();
});

test('telefon: błąd w zadaniu bez dźwięku — tylko dwie odpowiedzi, wystarczy jedno kliknięcie, zamknięcie bez wysyłki nic nie wysyła',async({page,context})=>{
 const backend=await cloud(context);await page.goto('./');await signIn(page);await page.getByRole('button',{name:'Moja nauka',exact:true}).click();await openMap(page);await resumeStudy(page);await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).click();
 await expect(page.locator('.study-heading')).toBeVisible();
 const typed=await page.getByRole('textbox').count()>0;if(typed)await page.getByRole('textbox').fill('moja odpowiedź');
 const heading=await page.locator('.question').innerText();
 // Closing without choosing sends nothing and leaves the task alone.
 await page.getByRole('button',{name:'Zgłoś problem',exact:true}).click();
 await expect(dialog(page).getByRole('button')).toHaveText(['W zadaniu lub odpowiedzi jest błąd','Coś innego','Zamknij']);
 await dialog(page).getByRole('button',{name:'Zamknij'}).click();await expect(dialog(page)).toHaveCount(0);expect(backend.posts).toHaveLength(0);
 await page.getByRole('button',{name:'Zgłoś problem',exact:true}).click();
 await page.keyboard.press('Escape');await expect(dialog(page)).toHaveCount(0);
 await page.getByRole('button',{name:'Zgłoś problem',exact:true}).click();
 await dialog(page).getByRole('button',{name:'W zadaniu lub odpowiedzi jest błąd'}).dblclick();
 await expect(dialog(page).getByRole('status')).toHaveText('Wysłano. Dziękujemy!');
 expect(backend.posts).toHaveLength(1);
 const {report}=[...backend.documents.values()][0];
 expect(report.category).toBe('wrong-content');expect('audio' in report).toBe(false);expect(report.module).toBe(food.id);expect(report.excerpt.length).toBeGreaterThan(0);
 await dialog(page).getByRole('button',{name:'Wróć do zadania'}).click();
 await expect(page.locator('.question')).toHaveText(heading);if(typed)await expect(page.getByRole('textbox')).toHaveValue('moja odpowiedź');
});

test('telefon: „Coś innego” prosi o opis i wysyła go razem ze zgłoszeniem',async({page,context})=>{
 const backend=await cloud(context);await page.goto('./');await signIn(page);await page.getByRole('button',{name:'Moja nauka',exact:true}).click();await openMap(page);await resumeStudy(page);await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).click();
 await page.getByRole('button',{name:'Zgłoś problem',exact:true}).click();await dialog(page).getByRole('button',{name:'Coś innego'}).click();
 await expect(dialog(page).getByLabel('Napisz krótko, co się stało')).toBeFocused();
 await dialog(page).getByRole('button',{name:/Wyślij/}).click();
 // An empty description is stopped by the field itself; nothing is sent and the window stays.
 await expect(dialog(page).getByRole('heading',{name:'Coś innego'})).toBeVisible();expect(backend.posts).toHaveLength(0);
 await dialog(page).getByLabel('Napisz krótko, co się stało').fill('Obrazek jest ucięty');await dialog(page).getByRole('button',{name:/Wyślij/}).click();
 await expect(dialog(page).getByRole('status')).toHaveText('Wysłano. Dziękujemy!');
 expect([...backend.documents.values()][0].report.comment).toBe('Obrazek jest ucięty');
});

test('telefon: bez internetu zgłoszenie czeka na urządzeniu, mówi to wprost i wychodzi jeden raz po powrocie sieci',async({page,context})=>{
 const backend=await cloud(context);await page.goto('./');await signIn(page);await page.getByRole('button',{name:'Moja nauka',exact:true}).click();await openMap(page);await resumeStudy(page);await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).click();
 await expect(page.locator('.study-heading')).toBeVisible();
 await context.setOffline(true);
 await page.getByRole('button',{name:'Zgłoś problem',exact:true}).click();await dialog(page).getByRole('button',{name:'W zadaniu lub odpowiedzi jest błąd'}).click();
 await expect(dialog(page).getByRole('status')).toContainText('Brak internetu. Zgłoszenie czeka na tym urządzeniu');
 await expect(dialog(page)).not.toContainText('Wysłano');expect(backend.posts).toHaveLength(0);
 await dialog(page).getByRole('button',{name:'Wróć do zadania'}).click();await expect(page.locator('.study-heading')).toBeVisible();
 await context.setOffline(false);
 await expect.poll(()=>backend.posts.length).toBe(1);
 await page.reload();await page.waitForTimeout(800);expect(backend.posts).toHaveLength(1);expect(backend.documents.size).toBe(1);
});

test('telefon: gość bez konta zapisuje zgłoszenie na urządzeniu, a po zalogowaniu wychodzi ono do chmury',async({page,context})=>{
 const backend=await cloud(context);await page.goto('./');await openMap(page);await resumeStudy(page);await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).click();
 await expect(page.locator('.study-heading')).toBeVisible();
 await page.getByRole('button',{name:'Zgłoś problem',exact:true}).click();await dialog(page).getByRole('button',{name:'W zadaniu lub odpowiedzi jest błąd'}).click();
 await expect(dialog(page).getByRole('status')).toHaveText('Zapisane na tym urządzeniu. Wyślemy je, gdy zalogujesz się na konto.');expect(backend.posts).toHaveLength(0);
 await dialog(page).getByRole('button',{name:'Wróć do zadania'}).click();
 await page.reload();expect(backend.posts).toHaveLength(0);
 await page.getByRole('button',{name:/Wróć do modułów/}).click();
 await page.getByRole('button',{name:'Ustawienia konta',exact:true}).click();
 await page.getByRole('textbox',{name:'E-mail'}).fill('hania@example.test');await page.getByLabel('Hasło',{exact:true}).fill('test-password');await page.getByRole('button',{name:'Zaloguj się',exact:true}).click();
 await expect.poll(()=>backend.posts.length).toBe(1);expect([...backend.documents.values()][0].uid).toBe('hania@example.test');
});

test('telefon 320 px: okno zgłoszenia mieści się w ekranie, a przycisk jest czytelny',async({page,context})=>{
 await cloud(context);await page.goto('./');await openMap(page);await resumeStudy(page);await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).click();
 await page.setViewportSize({width:320,height:640});await noScroll(page);
 const open=page.getByRole('button',{name:'Zgłoś problem',exact:true}),box=(await open.boundingBox())!;expect(box.height).toBeGreaterThanOrEqual(44);
 await open.click();await noScroll(page);const frame=(await dialog(page).boundingBox())!;expect(frame.x).toBeGreaterThanOrEqual(0);expect(frame.x+frame.width).toBeLessThanOrEqual(320);
 await page.screenshot({path:'test-results/report-320.png'});
});
