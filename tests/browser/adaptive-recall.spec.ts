import {resumeStudy} from './helpers.ts';
import {test,expect,type Page} from './fixtures.ts';
import {openBackup,openMap} from './navigation.ts';
import {backup,emptyProgress,keyFor,type Progress} from '../../src/core.ts';
import {foodModules} from '../materials.ts';
import {readFileSync} from 'node:fs';
import {lessons,type Journey} from '../../src/adventure.ts';
const m=foodModules[0],key=keyFor(m,'word','apple');
function sample(){const p=emptyProgress();p.encountered=[key];p.adventure={version:1,earned:20,purchases:{},completed:{},reviewSchema:1,stageReviews:{'unit-2-food/food':{round:0,items:{[key]:{item:{key,moduleId:m.id,version:1,type:'word',id:'apple',input:'text'},correct:0,due:1}}}}};return p;}
async function restore(page:Page,p:Progress){await page.goto('./');await openBackup(page);await page.locator('#import-file').setInputFiles({name:'profile.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(p)))});await page.getByRole('button',{name:'Zastąp postępy',exact:true}).click();await page.getByRole('button',{name:'Moja nauka',exact:true}).click();}
async function saved(page:Page){await openBackup(page);const wait=page.waitForEvent('download');await page.getByRole('button',{name:'Zapisz kopię postępów',exact:true}).click();const {readFileSync}=await import('node:fs');return JSON.parse(readFileSync((await(await wait).path())!,'utf8')).progress as Progress;}
async function section(page:Page){return page.locator('.journey-stage').filter({has:page.locator('summary strong',{hasText:'Ilości i opakowania'})});}
async function recall(page:Page){const stage=await section(page);if(await stage.getAttribute('open')===null)await stage.locator('summary').click();await expect(stage.locator('.lesson-step')).toHaveCount(9);return stage.locator('.lesson-step').filter({hasText:'Kocia powtórka'}).first();}
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});

test('telefon: dwie stałe powtórki, wznowienie i wspólny licznik bez zapętlania lekcji',async({page,browser})=>{
 await restore(page,sample());await openMap(page);const tile=await recall(page),stage=await section(page);const order=await stage.locator('.lesson-step').evaluateAll(els=>els.map(el=>(el as HTMLElement).dataset.id));
 await expect(page.locator('.cat-invitation-warmup')).toBeVisible();await expect(page.locator('.cat-invitation-training')).toHaveCount(1);
 await page.setViewportSize({width:320,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.screenshot({path:'test-results/adaptive-map-mobile.png',fullPage:true});
 const card=page.locator('.cat-invitation-training');const cat=await card.locator('.cat-artwork').boundingBox(),text=await card.locator('h2').boundingBox();expect(cat!.x+cat!.width).toBeLessThanOrEqual(text!.x);await card.screenshot({path:'test-results/cat-invitation-mobile.png'});
 await tile.click();await expect(page.locator('h1')).toHaveText('Kocia powtórka');await expect(page.locator('input[name="answerMode"]')).toHaveCount(0);await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).click();
 await page.getByRole('textbox').fill('apple');await page.getByRole('button',{name:/Sprawdź/}).click();await expect(page.locator('.feedback.correct')).toBeVisible();await page.reload();await resumeStudy(page);await expect(page.locator('.feedback.correct')).toBeVisible();await page.getByRole('button',{name:/Dalej/}).click();
 await expect(page.getByRole('heading',{name:'Kocia powtórka ukończona!',exact:true})).toBeVisible();await expect(page.locator('.lesson-reward')).toContainText('+3 ★');const p=await saved(page);
 expect(p.adventure!.memory![key].correct).toBe(1);expect(p.adventure!.stageReviews!['unit-2-food/food'].items[key].correct).toBe(1);expect(p.adventure!.earned).toBe(23);
 const context=await browser.newContext({baseURL:test.info().project.use.baseURL,viewport:{width:390,height:844}});try{const second=await context.newPage();await restore(second,p);await openMap(second);await recall(second);expect(await(await section(second)).locator('.lesson-step').evaluateAll(els=>els.map(el=>(el as HTMLElement).dataset.id))).toEqual(order);}finally{await context.close();}
});
test.describe('PWA — powtórka',()=>{
 test.use({serviceWorkers:'allow'});
 test('działa offline po zamknięciu, zachowując zestaw, odpowiedź i nagrodę',async({page,context})=>{
  test.skip(process.env.HANIA_TEST_BUILD!=='1'||!!process.env.HANIA_BASE_URL,'Wymaga lokalnego wydania PWA.');
  await restore(page,sample());await expect(page.locator('[data-offline-status]')).toContainText('Materiały gotowe');await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBeTruthy();await openMap(page);await(await recall(page)).click();await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).click();
  await expect(page.locator('.study-heading h1')).toHaveText('Kocia powtórka');await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');await page.close();await context.setOffline(true);const offline=await context.newPage();await offline.goto('./');await resumeStudy(offline);await expect(offline.locator('.study-heading h1')).toHaveText('Kocia powtórka');await offline.getByRole('textbox').fill('apple');await offline.getByRole('button',{name:/Sprawdź/}).click();await offline.getByRole('button',{name:/Dalej/}).click();await expect(offline.getByRole('heading',{name:'Kocia powtórka ukończona!',exact:true})).toBeVisible();await expect(offline.locator('.lesson-reward')).toContainText('+3 ★');
 });
});

test('zaproszenia: bez poznanego materiału rozgrzewka odsyła do pierwszej lekcji; dobrowolny finał zachowuje zaliczenia',async({page})=>{
 // D-51: the warm-up uses known material of the current module too, so only a profile that knows nothing gets the message.
 await page.goto('./');await openMap(page);await page.getByRole('button',{name:/Rozgrzej łapki/}).click();await expect(page.getByRole('status').filter({hasText:'To początek przygody!'})).toContainText('Zacznij od pierwszej lekcji');await expect(page.locator('.study-heading')).toHaveCount(0);
 const p=sample(),maps=['sciezka','sciezka-praktyka'].map(name=>JSON.parse(readFileSync(new URL(`../../public/content/02-food/${name}.json`,import.meta.url),'utf8')) as Journey);
 for(const j of maps)for(const {key} of lessons(j))p.adventure!.completed[key]={at:'2026-11-12T12:00:00Z'};
 for(const j of maps)for(const stage of j.stages)p.adventure!.stageReviews![`${j.moduleId}/${j.id?j.id+'/':''}${stage.id}`]??={round:0,items:{},rewardedAt:'2026-11-12T12:00:00Z'};
 // The old stage bonus is already settled; this test isolates the finale's 1 star.
 p.adventure!.stageReviews!['unit-2-food/food'].rewardedAt='2026-11-12T12:00:00Z';
 await restore(page,p);await openMap(page);
 await page.locator('button[data-action="module"]').click();await page.getByText('Wpisuję odpowiedź',{exact:true}).click();await page.getByRole('button',{name:/Podejmuję misję/}).click();await expect(page.locator('.study-heading h1')).toHaveText('Misja Kociego Mistrza');
 await page.getByRole('textbox').fill('apple');await page.getByRole('button',{name:/Sprawdź/}).click();await expect(page.locator('.feedback.correct')).toBeVisible();await page.getByRole('button',{name:/Dalej/}).click();await expect(page.getByRole('heading',{name:'Misja Kociego Mistrza ukończona!',exact:true})).toBeVisible();await expect(page.locator('.lesson-reward')).toContainText('+1 ★');
 const result=await saved(page);expect(result.adventure!.completed).toEqual(p.adventure!.completed);expect(result.adventure!.earned).toBe(21);expect(result.adventure!.sectionPlans).toBeUndefined();
});
