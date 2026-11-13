import {test,expect,type Page} from './fixtures.ts';
import {openBackup} from './navigation.ts';
import {foodModules as modules} from '../materials.ts';
import {backup,emptyProgress,makeSession,recordAnswer,questionFor,next,keyFor,type Module,type Progress} from '../../src/core.ts';
import {lessons,type Journey} from '../../src/adventure.ts';
import {readFileSync} from 'node:fs';
import {courseFixture} from '../fixtures/course-materials.ts';
import {readLibrary} from '../../src/materials/library.ts';
const m=modules[0],j=JSON.parse(readFileSync(new URL('../../public/content/02-food/sciezka.json',import.meta.url),'utf8')) as Journey;
const at=(day:number)=>new Date(2026,10,day,10).toISOString();
function addSession(p:Progress,all:Module[],module:Module,day:number,wrong=false){
 const w=module.words[0],s=makeSession(all,module,'flashcards','text',false,p);p.active=s;s.items=[{key:keyFor(module,'word',w.id),moduleId:module.id,type:'word',id:w.id,version:w.rev??1,input:'text'}];recordAnswer(p,questionFor(all,s.items[0]),wrong?'wrong':w.back);if(wrong){s.phase='retry';recordAnswer(p,questionFor(all,s.items[0]),w.back);}next(p);s.completedAt=at(day);
}
async function restore(page:Page,p:Progress){await page.goto('./');await openBackup(page);await page.locator('#import-file').setInputFiles({name:'progress.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(p)))});await page.getByRole('button',{name:'Zastąp postępy',exact:true}).click();}
async function show(page:Page){await page.getByRole('button',{name:'Moje postępy',exact:true}).click();await expect(page.locator('.progress-page')).toBeVisible();}
async function exported(page:Page){await openBackup(page);const wait=page.waitForEvent('download');await page.getByRole('button',{name:'Zapisz kopię postępów',exact:true}).click();return JSON.parse(readFileSync((await(await wait).path())!,'utf8')).progress as Progress;}
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});

test('telefon: spokojny pusty widok, tydzień i szczegóły bez presji; czytelność przy 320 px',async({page})=>{
 await page.goto('./');await show(page);await expect(page.getByText('Tu wyrosną Twoje postępy',{exact:true})).toBeVisible();await expect(page.locator('.progress-days li')).toHaveCount(7);await expect(page.locator('.progress-details')).not.toHaveAttribute('open');await expect(page.getByText('Dokładność pierwszych odpowiedzi:',{exact:false})).not.toBeVisible();
 for(const width of [320,390,430]){await page.setViewportSize({width,height:740});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);for(const b of await page.locator('.progress-page button').all())if(await b.isVisible())expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(44);}
 await page.setViewportSize({width:320,height:740});await page.screenshot({path:'test-results/progress-empty-320.png',fullPage:true});await page.locator('.progress-details > summary').click();await expect(page.getByText('Dokładność pierwszych odpowiedzi:',{exact:false})).toBeVisible();
});

test('ukończona mapa i zdobyte gwiazdki zostają mimo zakupów i błędów; widok nie zmienia kopii',async({page})=>{
 await page.clock.install({time:new Date(2026,10,13,12)});const p=emptyProgress();addSession(p,modules,m,9,true);addSession(p,modules,m,13);
 p.adventure={version:1,earned:45,purchases:{pillow:{cost:6,slot:null}},completed:Object.fromEntries(lessons(j).map(l=>[l.key,{at:at(9)}])),reviewSchema:1};p.difficult=[keyFor(m,'word',m.words[0].id)];
 p.adventure.stageReviews=Object.fromEntries(j.stages.map(s=>[`${j.moduleId}/${s.id}`,{round:0,items:{},rewardedAt:at(9)}]));
 await restore(page,p);const before=await exported(page);await show(page);await expect(page.locator('.progress-highlights strong')).toHaveText([String(lessons(j).length),'1','45 ★']);await expect(page.locator('.progress-highlights')).toContainText('Do wydania: 39 ★');await expect(page.locator('.progress-map').first().getByRole('progressbar')).toHaveAttribute('aria-valuenow','100');await expect(page.locator('.progress-map').first()).toContainText('Ukończona · Gratulacje!');
 await expect(page.locator('.progress-week')).toContainText('2 z 7 dni');await expect(page.locator('.progress-success')).toContainText('udana poprawka');await expect(page.locator('.progress-success')).toContainText('trafny powrót');await page.setViewportSize({width:320,height:740});await page.screenshot({path:'test-results/progress-food-320.png',fullPage:true});
 await expect(page.locator('.progress-details')).not.toHaveAttribute('open');const after=await exported(page);expect(after).toEqual(before);
 await show(page);await page.getByRole('button',{name:'Kontynuuj przygodę →',exact:true}).click();await expect(page.locator('h1')).toHaveText('Dzienniczek posiłków');
});

test('kursy mają osobne liczby i salda, przełączenie w postępach nie zmienia aktywnej lekcji',async({page})=>{
 const fixture=courseFixture(),library=await readLibrary(fixture.read);await page.route('**/content/**',async route=>{const path=new URL(route.request().url()).pathname.split('/content/')[1];if(path in fixture.files)await route.fulfill({json:fixture.files[path]});else await route.continue();});
 const [en,fr]=library.modules,p=emptyProgress();addSession(p,library.modules,en,9);addSession(p,library.modules,fr,13);p.active=makeSession(library.modules,en,'flashcards','text',false,p);
 p.adventure={version:1,earned:99,purchases:{},completed:{},courseHomes:{'english-book':{earned:20,purchases:{pillow:{cost:6,slot:null}}},'french-book':{earned:7,purchases:{}}}};
 await restore(page,p);const before=await exported(page);await show(page);await page.getByRole('group',{name:'Postępy kursu'}).getByRole('button',{name:'Test: english-book',exact:true}).click();await expect(page.locator('.progress-highlights')).toContainText('20 ★');await expect(page.locator('.progress-highlights')).toContainText('14 ★');
 await page.getByRole('group',{name:'Postępy kursu'}).getByRole('button',{name:'Test: french-book',exact:true}).click();await expect(page.locator('.progress-highlights')).toContainText('7 ★');await expect(page.locator('.progress-highlights')).not.toContainText('20 ★');await expect(page.locator('.progress-course')).toHaveText('Test: french-book');await page.locator('.progress-details > summary').click();await expect(page.locator('.progress-history .history-row')).toHaveCount(1);await expect(page.locator('.progress-history')).toContainText('french-book');expect(await exported(page)).toEqual(before);
});

test.describe('offline',()=>{test.use({serviceWorkers:'allow'});
 test('postępy i szczegóły wracają bez internetu bez zmiany wyników',async({page,context})=>{
  test.skip(process.env.HANIA_TEST_BUILD!=='1'||!!process.env.HANIA_BASE_URL,'Lokalne wydanie PWA.');const p=emptyProgress();addSession(p,modules,m,13);await restore(page,p);await page.getByRole('button',{name:'Moja nauka',exact:true}).click();await expect(page.locator('[data-offline-status]')).toContainText('Materiały gotowe');await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);await show(page);await context.setOffline(true);await page.reload();await expect(page.locator('.progress-page')).toBeVisible();await page.locator('.progress-details > summary').click();await expect(page.locator('.progress-history .history-row')).toHaveCount(1);await expect(page.locator('.progress-days li')).toHaveCount(7);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
});
