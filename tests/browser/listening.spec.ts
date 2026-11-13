// D-58: listening, with a mock of the browser's speech synthesis. Other specs run on a
// silent device (fixtures.ts), so they keep exercising the ordinary form of every task.
import {test,expect,type Page,type BrowserContext} from './fixtures.ts';
import {openBackup,openMap} from './navigation.ts';
import {answerCurrent,resumeStudy} from './helpers.ts';
import {readFileSync} from 'node:fs';
import {foodModules as modules} from '../materials.ts';
import {isCorrect,questionFor,keyFor,type Progress} from '../../src/core.ts';
import {vocabularyFullAnswer} from '../../src/learning/vocabulary-answer.ts';

interface Device {voices:{lang:string;localService:boolean}[];fails?:boolean}
/** Installs a speech engine that records every utterance in window.__spoken. */
function speechMock(device:Device){
 const w=window as any;w.__spoken=[];
 w.SpeechSynthesisUtterance=class{text:string;lang='';rate=1;voice:unknown=null;onerror:any=null;constructor(text:string){this.text=text;}};
 Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>device.voices,cancel(){},addEventListener(){},
  speak(u:any){if(device.fails){setTimeout(()=>u.onerror?.({error:'synthesis-failed'}),0);return;}w.__spoken.push({text:u.text,lang:u.lang,rate:u.rate});}}});
}
const english:Device={voices:[{lang:'pl-PL',localService:true},{lang:'en-GB',localService:true}]};
const install=(context:BrowserContext,device:Device)=>context.addInitScript(speechMock,device);
const spoken=(page:Page)=>page.evaluate(()=>(window as any).__spoken as {text:string;lang:string;rate:number}[]);
const idle=(page:Page)=>expect(page.locator('#app')).toHaveAttribute('aria-busy','false');
const noScroll=async(page:Page)=>expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
const listening=(page:Page)=>page.locator('.listen[data-autoplay]');
function fromKey(key:string){const match=key.match(/^(.+)@(\d+):(word|exercise):(.+)$/)!;return questionFor(modules,{key,moduleId:match[1],version:Number(match[2]),type:match[3] as 'word'|'exercise',id:match[4],input:'choice'});}
async function exported(page:Page){await openBackup(page);const wait=page.waitForEvent('download');await page.getByRole('button',{name:'Zapisz kopię postępów',exact:true}).click();return JSON.parse(readFileSync((await(await wait).path())!,'utf8')).progress as Progress;}
async function startFirstLesson(page:Page){await page.goto('./');await openMap(page);await resumeStudy(page);await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).click();await expect(page.locator('.study-heading')).toBeVisible();}
/** Finishes the lesson the ordinary way and reports whether any listening control ever appeared. */
async function finishQuietly(page:Page){
 let heard=0;
 for(let step=0;await page.locator('.study-heading').count();step++){
  expect(step).toBeLessThan(14);await idle(page);if(!await page.locator('.study-heading').count())break;
  heard+=await page.locator('.listen,.scene-say').count();
  if(!await page.locator('.feedback').count())await answerCurrent(page,modules);
  await page.getByRole('button',{name:/Dalej/}).click();await idle(page);
 }
 return heard;
}
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});

test('telefon: posłuchaj i wybierz, posłuchaj i wpisz — bez limitu odtworzeń, wolniej, ta sama ocena i wznowienie',async({page,context})=>{
 await install(context,english);await startFirstLesson(page);
 const seen={choice:0,text:0};
 for(let step=0;await page.locator('.study-heading').count();step++){
  expect(step).toBeLessThan(14);await idle(page);if(!await page.locator('.study-heading').count())break;
  if(await listening(page).count()){
   const key=(await listening(page).getAttribute('data-key'))!,q=fromKey(key),say=vocabularyFullAnswer(q),typing=await page.getByRole('textbox').count()>0;
   // Read out once when the task appears, in the voice of the course language.
   await expect.poll(async()=>(await spoken(page)).at(-1)).toEqual({text:say,lang:'en-GB',rate:0.95});
   const before=(await spoken(page)).length;
   await expect(page.locator('.question')).toHaveText(typing?'Posłuchaj i wpisz to, co słyszysz.':'Posłuchaj i wybierz, co to znaczy.');
   // "Listen again" and "slower" as often as the learner likes.
   for(let again=0;again<3;again++)await page.getByRole('button',{name:'Posłuchaj jeszcze raz'}).click();
   await page.getByRole('button',{name:'Wolniej',exact:true}).click();
   const now=await spoken(page);expect(now.length).toBe(before+4);expect(now.at(-1)).toEqual({text:say,lang:'en-GB',rate:0.665});expect(now.slice(before,before+3).every(u=>u.rate===0.95&&u.text===say)).toBeTruthy();
   expect((await page.locator('.listen button').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().height))).every(h=>h>=44)).toBeTruthy();
   await page.setViewportSize({width:320,height:640});await noScroll(page);await page.screenshot({path:`test-results/listening-${typing?'type':'choose'}-320.png`,fullPage:true});await page.setViewportSize({width:390,height:844});
   if(typing){
    seen.text++;
    // The written word is nowhere on the card before the answer.
    await expect(page.locator('.study-card')).not.toContainText(q.prompt);await expect(page.locator('.study-card')).not.toContainText(q.answers[0]);
    await page.getByRole('textbox').fill('wrong');await page.getByRole('button',{name:/Sprawdź/}).click();
    await expect(page.locator('.feedback.incorrect')).toBeVisible();await expect(page.locator('.expected-answer')).toContainText(say);await expect(page.locator('.question')).toHaveText(q.prompt);
    // Refresh: the same mistake is still there; trying again brings the listening task back.
    await page.reload();await resumeStudy(page);await expect(page.locator('.feedback.incorrect')).toBeVisible();await expect(page.locator('.given-answer')).toContainText('wrong');
    await page.getByRole('button',{name:'Spróbuję jeszcze raz'}).click();await expect(listening(page)).toHaveAttribute('data-key',key);await expect.poll(async()=>(await spoken(page)).at(-1)?.text).toBe(say);
    // Same grading as everywhere: the answer without its article is accepted.
    await page.getByRole('textbox').fill(q.answers[0]);await page.getByRole('button',{name:/Sprawdź/}).click();await expect(page.locator('.feedback.correct')).toBeVisible();
   }else{
    seen.choice++;
    const options=page.locator('.listen-option');await expect(options).toHaveCount(q.options.length);
    const shown=await options.evaluateAll(els=>els.map(el=>({answer:(el as HTMLElement).dataset.answer!,text:el.textContent!,height:el.getBoundingClientRect().height})));
    // Meanings instead of the written answers.
    for(const option of shown){expect(option.text).not.toContain(option.answer.replace(/^an? /,''));expect(option.height).toBeGreaterThanOrEqual(44);}
    expect(shown.some(o=>o.text.includes(q.prompt))).toBeTruthy();
    await options.nth(shown.findIndex(o=>isCorrect(q,o.answer))).click();await expect(page.locator('.feedback.correct')).toBeVisible();
   }
   // The answer can be heard again after it is revealed.
   await expect(page.locator('.feedback .listen-play')).toBeVisible();await expect(page.locator('.feedback .listen[data-autoplay]')).toHaveCount(0);
  }
  else if(!await page.locator('.feedback').count())await answerCurrent(page,modules);
  await page.getByRole('button',{name:/Dalej/}).click();await idle(page);
 }
 expect(seen.choice+seen.text).toBeGreaterThanOrEqual(1);expect(seen.choice).toBeLessThanOrEqual(1);expect(seen.text).toBeLessThanOrEqual(1);
 await expect(page.locator('.lesson-reward')).toContainText('+3 ★');
 const saved=await exported(page),session=saved.sessions.at(-1)!;
 expect(session.items.filter(i=>i.listen)).toHaveLength(seen.choice+seen.text);expect(session.attempts).toHaveLength(session.items.length);
 expect(JSON.stringify(saved)).not.toMatch(/sluchanie/);
});

for(const quiet of [
 {name:'urządzenie bez żadnego głosu',device:undefined,offline:false},
 {name:'tylko polski głos',device:{voices:[{lang:'pl-PL',localService:true}]},offline:false},
 {name:'offline, a głos wymaga sieci',device:{voices:[{lang:'en-US',localService:false}]},offline:true},
 {name:'odtwarzanie zgłasza błąd',device:{...english,fails:true},offline:false},
] as const)test(`powrót do zwykłej formy: ${quiet.name} — lekcja się nie blokuje`,async({page,context})=>{
 if(quiet.device)await install(context,quiet.device as Device);
 await page.goto('./');await openMap(page);if(quiet.offline)await context.setOffline(true);
 await resumeStudy(page);await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).click();await expect(page.locator('.study-heading')).toBeVisible();
 expect(await finishQuietly(page)).toBe(0);
 await expect(page.locator('.lesson-reward')).toContainText('+3 ★');await expect(page.getByRole('alert')).toHaveCount(0);
 if(quiet.offline)await context.setOffline(false);
 // The saved session is the same one a device with sound would get: the mark is there, the form was ordinary.
 const session=(await exported(page)).sessions.at(-1)!;expect(session.items.filter(i=>i.listen).length).toBeGreaterThanOrEqual(1);expect(session.attempts.every(a=>a.first)).toBeTruthy();
 await page.getByRole('button',{name:'Konto',exact:true}).click();await expect(page.locator('.listening-status')).toContainText(quiet.offline?/./:'teraz niedostępny');
});

test('ustawienie: wyłączone słuchanie zostaje po odświeżeniu, a włączone wraca razem z próbą dźwięku',async({page,context})=>{
 await install(context,english);await page.goto('./');await page.getByRole('button',{name:'Konto',exact:true}).click();
 const toggle=page.getByRole('checkbox',{name:'Włącz ćwiczenia ze słuchu'});await expect(toggle).toBeChecked();await expect(page.locator('.listening-status')).toContainText('jest dostępny');
 await page.getByRole('button',{name:'Sprawdź dźwięk',exact:true}).click();expect((await spoken(page)).at(-1)).toEqual({text:vocabularyFullAnswer(questionFor(modules,{key:keyFor(modules[0],'word',modules[0].words[0].id),moduleId:modules[0].id,id:modules[0].words[0].id,version:1,type:'word',input:'text'})),lang:'en-GB',rate:0.95});
 await page.getByRole('button',{name:'Wolniej',exact:true}).click();expect((await spoken(page)).at(-1)!.rate).toBe(0.665);
 await toggle.uncheck();await expect(page.locator('.listening-status')).toContainText('wyłączone');await expect(page.getByRole('button',{name:'Sprawdź dźwięk',exact:true})).toHaveCount(0);
 await page.reload();await expect(page.getByRole('checkbox',{name:'Włącz ćwiczenia ze słuchu'})).not.toBeChecked();
 await page.setViewportSize({width:320,height:640});await noScroll(page);await page.screenshot({path:'test-results/listening-settings-320.png',fullPage:true});await page.setViewportSize({width:390,height:844});
 await openMap(page);await resumeStudy(page);await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).click();await expect(page.locator('.study-heading')).toBeVisible();
 expect(await finishQuietly(page)).toBe(0);await expect(page.locator('.lesson-reward')).toContainText('+3 ★');expect(await spoken(page)).toHaveLength(0);
 // Switched back on with the keyboard: listening returns in the next lesson.
 await page.getByRole('button',{name:'Konto',exact:true}).click();await page.getByRole('checkbox',{name:'Włącz ćwiczenia ze słuchu'}).focus();await page.keyboard.press('Space');
 await expect(page.locator('.listening-status')).toContainText('jest dostępny');await page.reload();await expect(page.getByRole('checkbox',{name:'Włącz ćwiczenia ze słuchu'})).toBeChecked();
 await openMap(page);await page.locator('.lesson-step').nth(1).click();await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).click();await expect(page.locator('.study-heading')).toBeVisible();
 let found=false;for(let step=0;step<8&&!found&&await page.locator('.study-heading').count();step++){await idle(page);found=await listening(page).count()>0;if(found)break;if(!await page.locator('.feedback').count())await answerCurrent(page,modules);await page.getByRole('button',{name:/Dalej/}).click();await idle(page);}
 expect(found).toBeTruthy();
});

test('głośnik w scenie: tylko przy kwestiach bez otwartej luki, także z klawiatury i w podsumowaniu',async({page,context})=>{
 await install(context,english);await page.goto('./');await openMap(page);
 const stage=page.locator('.journey-stage').nth(4);if(await stage.getAttribute('open')===null)await stage.locator('summary').click();
 await stage.getByRole('button',{name:/Rozmowa przy stoliku(?! —)/}).first().click();await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).click();
 const scene=page.locator('.scene:not(.scene-summary .scene)');
 for(let step=0;!await scene.count();step++){expect(step).toBeLessThan(8);await idle(page);if(await scene.count())break;if(!await page.locator('.feedback').count())await answerCurrent(page,modules);if(await scene.count())break;await page.getByRole('button',{name:/Dalej/}).click();await idle(page);}
 // The first line still has its gap open: nothing to play, or the answer would be given away.
 await expect(scene).toHaveAttribute('data-position','1');await expect(scene.locator('.scene-say')).toHaveCount(0);
 await answerCurrent(page,modules);await expect(scene).toHaveAttribute('data-position','2');
 await expect(scene.locator('.dialogue-line')).toHaveCount(2);await expect(scene.locator('.scene-say')).toHaveCount(1);await expect(scene.locator('.scene-now .scene-say')).toHaveCount(0);
 const button=scene.locator('.scene-say'),box=(await button.boundingBox())!;expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);
 await button.click();expect((await spoken(page)).at(-1)).toEqual({text:'What would you like?',lang:'en-GB',rate:0.9});
 await button.focus();await page.keyboard.press('Enter');expect(await spoken(page)).toHaveLength(2);
 await scene.getByRole('button',{name:'Posłuchaj tej kwestii wolniej',exact:true}).click();expect((await spoken(page)).at(-1)).toEqual({text:'What would you like?',lang:'en-GB',rate:0.63});
 // Listening saves nothing and does not move the conversation.
 await expect(scene).toHaveAttribute('data-position','2');await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');
 for(let gap=2;gap<=5;gap++){await expect(scene).toHaveAttribute('data-position',String(gap));await answerCurrent(page,modules);}
 await expect(scene.locator('.scene-slow')).toHaveCount(await scene.locator('.scene-say').count());
 const all=page.locator('.scene-summary .scene-say');await expect(all).toHaveCount(7);await all.last().scrollIntoViewIfNeeded();await all.last().click();
 expect((await spoken(page)).at(-1)!.text).toBe('Enjoy your meal!');await all.nth(1).click();expect((await spoken(page)).at(-1)!.text).toBe('Can I have a chicken sandwich, please?');
 await expect(page.locator('.scene-summary .scene-slow')).toHaveCount(7);await page.locator('.scene-summary .scene-slow').last().click();expect((await spoken(page)).at(-1)).toEqual({text:'Enjoy your meal!',lang:'en-GB',rate:0.63});
 await page.setViewportSize({width:320,height:640});await noScroll(page);await page.screenshot({path:'test-results/listening-scene-320.png',fullPage:true});
});

test.describe('offline',()=>{
 test.use({serviceWorkers:'allow'});
 test('głos zapisany na urządzeniu działa bez sieci, także po zamknięciu strony',async({page,context})=>{
  test.skip(process.env.HANIA_TEST_BUILD!=='1'||!!process.env.HANIA_BASE_URL,'Wymaga lokalnego wydania PWA.');
  await install(context,english);await page.goto('./');await expect(page.locator('[data-offline-status]')).toContainText('Materiały gotowe');await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBeTruthy();
  await openMap(page);await resumeStudy(page);await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).click();await context.setOffline(true);
  for(let step=0;!await listening(page).count();step++){expect(step).toBeLessThan(8);await idle(page);if(await listening(page).count())break;if(!await page.locator('.feedback').count())await answerCurrent(page,modules);await page.getByRole('button',{name:/Dalej/}).click();await idle(page);}
  const key=(await listening(page).getAttribute('data-key'))!,say=vocabularyFullAnswer(fromKey(key));
  await page.close();const offline=await context.newPage();await offline.goto('./');await resumeStudy(offline);
  await expect(listening(offline)).toHaveAttribute('data-key',key);await offline.getByRole('button',{name:'Wolniej',exact:true}).click();
  expect((await spoken(offline)).at(-1)).toEqual({text:say,lang:'en-GB',rate:0.665});
  await answerCurrent(offline,modules);await expect(offline.locator('.feedback.correct')).toBeVisible();
 });
});
