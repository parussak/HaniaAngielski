// Real HTMLAudioElement/Opus decoding; no system voice required. Separate from the silent-device regressions.
import {test,expect,type Page,type BrowserContext} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {foodModules as modules,foodCourse} from '../materials.ts';
import {backup,emptyProgress,makeSession,keyFor,type Progress} from '../../src/core.ts';
import {lessons,validateJourney,makeLessonSession} from '../../src/adventure.ts';
import {openBackup} from './navigation.ts';
import {resumeStudy,answerCurrent} from './helpers.ts';
const m=modules[0],j=validateJourney(JSON.parse(readFileSync(new URL('../../public/content/02-food/sciezka.json',import.meta.url),'utf8')),m);
const manifest=JSON.parse(readFileSync(new URL('../../audio/generated/manifest.json',import.meta.url),'utf8'));
const appleFile=manifest.modules[0].references.find((r:any)=>r.key===keyFor(m,'word','apple')).clip+'.ogg';
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
async function device(context:BrowserContext,tts=false){
 await context.route('**/content/katalog.json',r=>r.fulfill({json:{version:1,coursesFile:'kursy.json',modules:['02-food']}}));await context.route('**/content/kursy.json',r=>r.fulfill({json:{version:1,courses:[foodCourse]}}));
 await context.addInitScript(({tts})=>{
  const w=window as any;w.__tts=[];w.__media=[];w.__plays=[];w.__playing=0;
  w.SpeechSynthesisUtterance=class{text:string;lang='';rate=1;voice:unknown=null;constructor(text:string){this.text=text;}};
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>tts?[{lang:'en-GB',localService:true}]:[],speak:(u:any)=>w.__tts.push({text:u.text,lang:u.lang,rate:u.rate}),cancel(){},addEventListener(){}}});
  const original=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){w.__media.push(this);w.__plays.push({src:this.src,rate:this.playbackRate,pitch:this.preservesPitch});this.addEventListener('playing',()=>w.__playing++,{once:true});return original.call(this);};
 },{tts});
}
function seed(){
 const p=emptyProgress();p.adventure={version:1,earned:12,purchases:{pillow:{cost:6,slot:null}},completed:{},reviewSchema:1};p.active=makeSession(modules,m,'flashcards','text',false,p);p.active.mode='lesson';p.active.lesson={id:lessons(j)[0].key,title:'Lekcja ze słuchu'};
 p.active.items=['apple','water'].map(id=>({key:keyFor(m,'word',id),moduleId:m.id,type:'word' as const,id,version:1,input:'text' as const,listen:true}));return p;
}
function classic(mode:'flashcards'|'flashcards-basic'|'quiz',course=false){
 const p=seed(),s=p.active!;s.mode=mode;delete s.lesson;
 s.items=s.items.map((item,i)=>{
  const q=m.exercises.find(q=>q.kind==='vocabulary'&&q.wordId===item.id)!;
  const result=mode==='quiz'?{...item,key:keyFor(m,'exercise',q.id),type:'exercise' as const,id:q.id,version:q.rev??1}: {...item};
  delete result.listen;result.input=i?'choice':'text';return result;
 });
 if(course)s.scope={kind:'course',courseId:foodCourse.id};return p;
}
async function restore(page:Page,p:Progress){await page.goto('./');await openBackup(page);await page.locator('#import-file').setInputFiles({name:'recordings.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(p)))});await page.getByRole('button',{name:'Zastąp postępy',exact:true}).click();await page.getByRole('button',{name:'Moja nauka',exact:true}).click();await resumeStudy(page);}
async function exported(page:Page){await openBackup(page);const wait=page.waitForEvent('download');await page.getByRole('button',{name:'Zapisz kopię postępów',exact:true}).click();return JSON.parse(readFileSync((await(await wait).path())!,'utf8')).progress as Progress;}
async function back(page:Page){await page.getByRole('button',{name:'Moja nauka',exact:true}).click();await resumeStudy(page);}
const plays=(page:Page)=>page.evaluate(()=>(window as any).__plays as {src:string;rate:number;pitch:boolean}[]);
async function finish(page:Page){for(const answer of ['apple','water']){await page.getByRole('textbox').fill(answer);await page.getByRole('button',{name:/Sprawdź/}).click();await page.getByRole('button',{name:/Dalej/}).click();}await expect(page.locator('.lesson-reward')).toContainText('+3 ★');}

for(const [mode,course] of [['flashcards',false],['flashcards-basic',false],['quiz',false],['flashcards',true],['quiz',true]] as const){
 test(`klasyczne ${mode}, zakres ${course?'kursu':'modułu'}: odsłuch po odpowiedzi, Wolniej, bez zmiany wyników i gwiazdek`,async({page,context})=>{
  await device(context);await restore(page,classic(mode,course));await expect(page.locator('.listen')).toHaveCount(0);expect(await plays(page)).toHaveLength(0);
  await page.getByRole('textbox').fill('banana');await page.getByRole('button',{name:/Sprawdź/}).click();await expect(page.locator('.feedback.incorrect')).toBeVisible();
  await expect(page.getByRole('button',{name:'Posłuchaj odpowiedzi',exact:true})).toBeVisible();expect(await plays(page)).toHaveLength(0);
  const before=await exported(page);await back(page);await page.getByRole('button',{name:'Posłuchaj odpowiedzi',exact:true}).click();await expect.poll(()=>page.evaluate(()=>(window as any).__playing)).toBeGreaterThan(0);
  expect((await plays(page)).at(-1)).toMatchObject({rate:0.95,pitch:true});expect((await plays(page)).at(-1)!.src).toContain(appleFile);
  await page.getByRole('button',{name:'Wolniej',exact:true}).click();expect((await plays(page)).at(-1)).toMatchObject({rate:0.665,pitch:true});expect(await exported(page)).toEqual(before);
  await back(page);await page.getByRole('button',{name:/Dalej/}).click();await expect(page.locator('.listen')).toHaveCount(0);
  await page.locator('.option[data-answer="water"]').click();await expect(page.locator('.feedback.correct')).toBeVisible();await expect(page.getByRole('button',{name:'Posłuchaj odpowiedzi',exact:true})).toBeVisible();
  await page.getByRole('button',{name:/Dalej/}).click();const saved=await exported(page);expect(saved.adventure!.earned).toBe(12);expect(saved.adventure!.purchases).toEqual(before.adventure!.purchases);expect(saved.sessions.at(-1)!.attempts).toHaveLength(2);
 });
}

test('Cori jest pierwsze także przy głosie systemowym; prawdziwe nagranie gra, wolniej i bez zmiany kopii',async({page,context})=>{
 await device(context,true);await restore(page,seed());await expect(page.locator('.listen')).toBeVisible();const before=await exported(page);await back(page);
 await page.getByRole('button',{name:'Posłuchaj jeszcze raz',exact:true}).click();await expect.poll(()=>page.evaluate(()=>(window as any).__playing)).toBeGreaterThan(0);expect((await plays(page)).at(-1)).toMatchObject({rate:0.95,pitch:true});await page.getByRole('button',{name:'Wolniej',exact:true}).click();
 expect((await plays(page)).at(-1)).toMatchObject({rate:0.665,pitch:true});expect((await plays(page)).at(-1)!.src).toContain(new URL('audio/clips/',await page.evaluate(()=>document.baseURI)).href);expect(await page.evaluate(()=>(window as any).__tts)).toEqual([]);expect(await exported(page)).toEqual(before);
 await back(page);await finish(page);const saved=await exported(page);expect(saved.adventure!.earned).toBe(15);expect(saved.adventure!.purchases).toEqual(before.adventure!.purchases);expect(saved.sessions.at(-1)!.attempts).toHaveLength(2);
});

test('brak pliku przechodzi do syntezatora, zachowując tekst i sposób odpowiedzi',async({page,context})=>{
 await device(context,true);await page.route(`**/audio/clips/${appleFile}`,r=>r.fulfill({status:404,body:'missing'}));await restore(page,seed());await page.getByRole('button',{name:'Posłuchaj jeszcze raz',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>(window as any).__tts.length)).toBeGreaterThan(0);expect(await page.evaluate(()=>(window as any).__tts.at(-1))).toMatchObject({text:'an apple',lang:'en-GB'});await expect(page.locator('.listen')).toBeVisible();await finish(page);
});

test('uszkodzony klip bez głosu daje zwykłe zadanie, nie gubi wpisu i nie wyłącza następnego nagrania',async({page,context})=>{
 await device(context);let release!:()=>void;const gate=new Promise<void>(resolve=>release=resolve);await page.route(`**/audio/clips/${appleFile}`,async r=>{await gate;await r.fulfill({status:200,contentType:'audio/ogg',body:'broken media'});});
 await restore(page,seed());await page.getByRole('button',{name:'Posłuchaj jeszcze raz',exact:true}).click();await page.getByRole('textbox').fill('ap');release();await expect(page.locator('.listen')).toHaveCount(0);await expect(page.getByRole('textbox')).toHaveValue('ap');await expect(page.locator('.question')).toContainText(m.words.find(w=>w.id==='apple')!.front);
 await page.getByRole('textbox').fill('apple');await page.getByRole('button',{name:/Sprawdź/}).click();await page.getByRole('button',{name:/Dalej/}).click();await expect(page.locator('.listen')).toBeVisible();await page.getByRole('button',{name:'Posłuchaj jeszcze raz',exact:true}).click();await expect.poll(()=>page.evaluate(()=>(window as any).__playing)).toBeGreaterThan(0);
});

test('brak indeksu i głosu nie blokuje lekcji',async({page,context})=>{
 await device(context);await page.route('**/audio/catalog.json',r=>r.fulfill({status:404,body:'missing'}));await restore(page,seed());await expect(page.locator('.listen')).toHaveCount(0);await finish(page);
});

test('historyjka odtwarza tylko ukończone kwestie i podsumowanie, także z klawiatury',async({page,context})=>{
 await device(context);const p=seed(),lesson=lessons(j).find(l=>l.lesson.id==='restaurant-dialogue-1')!.lesson;p.active=makeLessonSession(modules,j,lesson,'mixed',p);await restore(page,p);await expect(page.locator('.scene-say')).toHaveCount(0);
 await answerCurrent(page,modules);await page.getByRole('button',{name:'Posłuchaj tej kwestii wolniej',exact:true}).click();expect((await plays(page)).at(-1)).toMatchObject({rate:0.63,pitch:true});await page.getByRole('button',{name:'Posłuchaj tej kwestii',exact:true}).focus();await page.keyboard.press('Enter');await expect.poll(()=>page.evaluate(()=>(window as any).__playing)).toBeGreaterThan(0);expect((await plays(page)).at(-1)).toMatchObject({rate:0.9,pitch:true});
 for(let i=1;i<5;i++)await answerCurrent(page,modules);await expect(page.locator('.scene-summary .scene-say')).toHaveCount(7);await expect(page.locator('.scene-summary .scene-slow')).toHaveCount(7);await page.locator('.scene-summary .scene-slow').last().click();expect((await plays(page)).at(-1)).toMatchObject({rate:0.63,pitch:true});await page.locator('.scene-summary .scene-say').last().click();expect(await page.evaluate(()=>(window as any).__tts)).toEqual([]);await page.getByRole('button',{name:/Dalej/}).click();await expect(page.locator('.lesson-reward')).toContainText('+3 ★');
});

test.describe('offline',()=>{test.use({serviceWorkers:'allow'});
 test('klasyczny quiz: odsłuch i Wolniej po zimnym starcie offline, bez nowej nagrody',async({page,context})=>{
  test.skip(process.env.HANIA_TEST_BUILD!=='1'||!!process.env.HANIA_BASE_URL,'Wymaga lokalnego wydania PWA.');await device(context);await restore(page,classic('quiz'));
  await page.getByRole('textbox').fill('apple');await page.getByRole('button',{name:/Sprawdź/}).click();await expect(page.getByRole('button',{name:'Posłuchaj odpowiedzi',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Moja nauka',exact:true}).click();await expect(page.locator('[data-offline-status]')).toContainText('Materiały gotowe');await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);await page.close();const offline=await context.newPage();await offline.goto('./');await resumeStudy(offline);
  await offline.getByRole('button',{name:'Posłuchaj odpowiedzi',exact:true}).click();await expect.poll(()=>offline.evaluate(()=>(window as any).__playing)).toBeGreaterThan(0);expect((await plays(offline)).at(-1)).toMatchObject({rate:0.95,pitch:true});
  await offline.getByRole('button',{name:'Wolniej',exact:true}).click();expect((await plays(offline)).at(-1)).toMatchObject({rate:0.665,pitch:true});
  await offline.getByRole('button',{name:/Dalej/}).click();await offline.locator('.option[data-answer="water"]').click();await offline.getByRole('button',{name:/Dalej/}).click();expect((await exported(offline)).adventure!.earned).toBe(12);
 });
 test('zimny start PWA gra Opus bez syntezatora i odpowiada na Range offline, zachowując nagrodę',async({page,context})=>{
  test.skip(process.env.HANIA_TEST_BUILD!=='1'||!!process.env.HANIA_BASE_URL,'Wymaga lokalnego wydania PWA.');await device(context);await restore(page,seed());await page.getByRole('button',{name:'Moja nauka',exact:true}).click();await expect(page.locator('[data-offline-status]')).toContainText('Materiały gotowe');await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);await page.close();const offline=await context.newPage();await offline.goto('./');await resumeStudy(offline);await expect(offline.locator('.listen')).toBeVisible();await offline.getByRole('button',{name:'Posłuchaj jeszcze raz',exact:true}).click();await expect.poll(()=>offline.evaluate(()=>(window as any).__playing)).toBeGreaterThan(0);expect((await plays(offline)).at(-1)).toMatchObject({rate:0.95,pitch:true});
  const range=await offline.evaluate(async()=>{const url=(window as any).__plays.at(-1).src;const r=await fetch(url,{headers:{Range:'bytes=0-63'}});const bad=await fetch(url,{headers:{Range:'bytes=999999999-'}});return {status:r.status,length:(await r.arrayBuffer()).byteLength,type:r.headers.get('Content-Type'),content:r.headers.get('Content-Range'),bad:bad.status};});expect(range).toMatchObject({status:206,length:64,type:'audio/ogg',bad:416});expect(range.content).toMatch(/^bytes 0-63\//);await finish(offline);expect((await exported(offline)).adventure!.earned).toBe(15);
 });
});
