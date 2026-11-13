import {finishCurrent} from './helpers.ts';
import {test,expect,type Page} from './fixtures.ts';
import {readFileSync} from 'node:fs';
import {backup,emptyProgress,type Progress} from '../../src/core.ts';
import {freshAdventure,lessons,type Journey} from '../../src/adventure.ts';
import {courseFixture} from '../fixtures/course-materials.ts';
import {foodModules as modules} from '../materials.ts';
import {openBackup} from './navigation.ts';
import {purchase,place,settleHouseUnlocks,stars} from '../../src/house/progress.ts';
import {decorations} from '../../src/house/catalog.ts';
const maps=['sciezka','sciezka-praktyka'].map(f=>JSON.parse(readFileSync(new URL(`../../public/content/02-food/${f}.json`,import.meta.url),'utf8')) as Journey);
const at='2026-11-10T12:00:00Z';
function fixture(count=2){const p=emptyProgress();p.adventure=freshAdventure();p.adventure.earned=100;p.adventure.purchases.pillow={cost:6,slot:'right'};p.adventure.reviewSchema=1;p.adventure.stageReviews={};
 for(const j of maps.slice(0,count))for(const s of j.stages){p.adventure.stageReviews[`${j.moduleId}/${s.id}`]={round:0,items:{},rewardedAt:at};for(const l of lessons(j))p.adventure.completed[l.key]={at};}return p;}
async function restore(page:Page,p:Progress){await page.goto('./');await openBackup(page);await page.locator('#import-file').setInputFiles({name:'house.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(p)))});await page.getByRole('button',{name:'Zastąp postępy',exact:true}).tap();await page.getByRole('button',{name:'Domek',exact:true}).tap();}
async function exported(page:Page){await openBackup(page);const download=page.waitForEvent('download');await page.getByRole('button',{name:'Zapisz kopię postępów',exact:true}).tap();return JSON.parse(readFileSync((await(await download).path())!,'utf8')).progress as Progress;}
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});

test('więcej miejsc, warstwy i Moje rzeczy: telefon, schowanie, odtworzenie i zachowane saldo',async({page})=>{
 const p=fixture();p.adventure!.earned=250;settleHouseUnlocks(p,modules,maps);
 for(const d of decorations.filter(d=>!d.map||d.map.split('/')[0]==='unit-2-food'))if(!p.adventure!.purchases[d.id])purchase(p,d.id,'angielski-hani',d.rooms[0]);
 const layout:Record<string,string>={pillow:'floor-cushion',yarn:'front',scratcher:'left',plant:'window',books:'shelf',basket:'right',bowls:'floor-side',lemonade:'shelf-left','picnic-basket':'rug','picnic-blanket':'floor-cover','fruit-bowl':'shelf-right'};
 for(const [id,slot] of Object.entries(layout))place(p,id,slot);
 const balance=stars(p);await restore(page,p);
 await expect(page.locator('.room-decoration')).toHaveCount(11);
 await expect(page.locator('.room-decoration[data-id="picnic-blanket"]')).toHaveClass(/layer-textiles/);
 await page.getByRole('button',{name:'Moje rzeczy (14)',exact:true}).tap();
 await expect(page.locator('.decoration-card')).toHaveCount(14);
 await expect(page.locator('.decoration-card[data-id="pillow"]')).toContainText('W saloniku');
 await page.locator('.decoration-card[data-id="plant"]').tap();
 await expect(page.locator('#house-placement')).toBeFocused();
 await expect(page.getByRole('button',{name:'Lewa strona półki',exact:true})).toContainText('Do schowka: Dzbanek lemoniady');
 await page.getByRole('button',{name:'Lewa strona półki',exact:true}).tap();
 await expect(page.getByRole('status')).toContainText('W schowku: Dzbanek lemoniady');
 await page.getByRole('button',{name:'Schowaj do schowka',exact:true}).tap();
 await expect(page.locator('.decoration-card[data-id="plant"]')).toContainText('W schowku');
 await page.getByRole('button',{name:'Prawa strona półki',exact:true}).tap();
 await expect(page.locator('.room-decoration[data-id="plant"]')).toHaveClass(/slot-shelf-right/);
 for(const width of [320,390]){
  await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  const buttons=await page.locator('.placement-buttons button').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().height));
  expect(buttons.every(height=>height>=44)).toBeTruthy();
 }
 await page.screenshot({path:'test-results/house-layers-storage-mobile.png',fullPage:true});
 const saved=await exported(page);expect(stars(saved)).toBe(balance);expect(saved.adventure!.completed).toEqual(p.adventure!.completed);
 expect(Object.keys(saved.adventure!.purchases)).toHaveLength(14);await restore(page,saved);
 await expect(page.locator('.room-decoration[data-id="plant"]')).toHaveClass(/slot-shelf-right/);
 await page.getByRole('button',{name:'Moje rzeczy (14)',exact:true}).tap();
 await page.locator('.decoration-card[data-id="table"]').tap();
 await expect(page.locator('.kitchen-room')).toBeVisible();
 await page.getByRole('button',{name:'Na dywanie',exact:true}).tap();
 await page.locator('.decoration-card[data-id="mugs"]').tap();
 await page.getByRole('button',{name:'Lewa strona stolika',exact:true}).tap();
 await expect(page.locator('.room-decoration[data-id="table"]')).toHaveClass(/layer-furniture/);
 await expect(page.locator('.room-decoration[data-id="mugs"]')).toHaveClass(/layer-objects/);
 await page.screenshot({path:'test-results/house-layered-kitchen-mobile.png',fullPage:true});
});

test('Food: jedna mapa daje wyposażenie, obie kuchnię; przenoszenie i kopia zachowują zakup oraz saldo',async({page})=>{
 await restore(page,fixture(1));await expect(page.getByRole('button',{name:/Kocia kuchnia · ukończ/})).toBeDisabled();
 await page.locator('.decoration-card[data-id="bowls"]').tap();await expect(page.getByRole('button',{name:'Kup za 6 ★',exact:true})).toBeEnabled();
 await expect(page.locator('.room-decoration')).toHaveClass(/slot-right/);
 await restore(page,fixture());await expect(page.locator('.star-wallet')).toHaveText('94 ★');
 await page.getByRole('button',{name:'Kocia kuchnia',exact:true}).tap();
 await expect(page.locator('.kitchen-room')).toBeVisible();await expect(page.getByRole('button',{name:'Kup za 10 ★',exact:true})).toBeEnabled();
 await page.getByRole('button',{name:'Kup za 10 ★',exact:true}).tap();await expect(page.locator('.star-wallet')).toHaveText('84 ★');
 await page.getByRole('button',{name:'Koci salonik',exact:true}).tap();await page.locator('.decoration-card[data-id="bowls"]').tap();await page.getByRole('button',{name:'Kup za 6 ★',exact:true}).tap();
 await page.getByRole('button',{name:'Koci salonik',exact:true}).tap();await page.locator('.decoration-card[data-id="bowls"]').tap();
 await page.getByRole('button',{name:'Lewy kącik',exact:true}).tap();await expect(page.locator('.room-decoration[data-id="bowls"]')).toHaveClass(/slot-left/);
 await expect(page.locator('.star-wallet')).toHaveText('78 ★');
 for(const width of [320,390,430]){await page.setViewportSize({width,height:740});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();}
 await page.screenshot({path:'test-results/house-salon-mobile.png',fullPage:true});
 await page.getByRole('button',{name:'Kocia kuchnia',exact:true}).tap();await expect(page.locator('.room-decoration[data-id="bowls"]')).toHaveCount(0);
 await page.screenshot({path:'test-results/house-kitchen-mobile.png',fullPage:true});
 const saved=await exported(page);expect(saved.adventure!.purchases.pillow).toEqual({cost:6,slot:'right'});
 expect(saved.adventure!.purchases.bowls.room).toBeUndefined();expect(saved.adventure!.purchases['cat-toaster'].room).toBe('kitchen');
 expect(saved.adventure!.rooms).toEqual(['kitchen']);expect(saved.adventure!.unlockedItems).toHaveLength(8);
 await restore(page,saved);await expect(page.locator('.star-wallet')).toHaveText('78 ★');
});

test('wybór kursu zmienia domek i portfel; stare zakupy należą tylko do angielskiego',async({page})=>{
 const f=courseFixture();f.courses[0].id='angielski-hani';
 await page.route('**/content/**',route=>{const key=new URL(route.request().url()).pathname.split('/content/')[1];return key in f.files?route.fulfill({json:f.files[key]}):route.continue();});
 const p=emptyProgress();p.adventure=freshAdventure();p.adventure.earned=100;p.adventure.purchases.pillow={cost:6,slot:'right'};p.adventure.courseHomes={'french-book':{earned:20,purchases:{}}};
 await restore(page,p);await expect(page.locator('.star-wallet')).toHaveText('94 ★');
 // D-51: the course frame lives only on the home screen.
 await expect(page.locator('.course-context')).toHaveCount(0);const chooseCourse=async()=>{await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();await page.getByRole('button',{name:'Wybierz kurs',exact:true}).tap();};
 await chooseCourse();await page.getByRole('button',{name:'Wybierz kurs Test: french-book',exact:true}).tap();await page.getByRole('button',{name:'Domek',exact:true}).tap();
 await expect(page.locator('.star-wallet')).toHaveText('20 ★');await expect(page.locator('.room-decoration')).toHaveCount(0);await expect(page.getByRole('button',{name:/Kocia kuchnia/})).toHaveCount(0);
 await page.getByRole('button',{name:'Kup za 6 ★',exact:true}).tap();await expect(page.locator('.star-wallet')).toHaveText('14 ★');
 await chooseCourse();await page.getByRole('button',{name:'Wybierz kurs Test: english-book',exact:true}).tap();await page.getByRole('button',{name:'Domek',exact:true}).tap();
 await expect(page.locator('.star-wallet')).toHaveText('94 ★');await expect(page.locator('.room-decoration')).toHaveClass(/slot-right/);
 const saved=await exported(page);expect(saved.adventure!.courseHomes!['french-book'].purchases.pillow.cost).toBe(6);expect(saved.adventure!.purchases.pillow.slot).toBe('right');
});

test('ostatnia lekcja modułu odblokowuje kuchnię i pokazuje zachętę bez dodatkowych gwiazdek za pokój',async({page})=>{
 const p=fixture(),last=lessons(maps[1]).at(-1)!;delete p.adventure!.completed[last.key];
 await restore(page,p);await expect(page.getByRole('button',{name:/Kocia kuchnia · ukończ/})).toBeDisabled();
 await page.getByRole('button',{name:'Mapy',exact:true}).tap();await page.getByRole('button',{name:`Otwórz mapę ${maps[1].title}`,exact:true}).tap();
 await page.locator('.lesson-step').filter({hasText:last.lesson.title}).tap();await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).tap();
 await expect(page.locator('.question')).toBeVisible();
 await finishCurrent(page,modules);
 await expect(page.locator('.lesson-reward')).toContainText('+3');await expect(page.getByRole('status')).toContainText('Nowy pokój: Kocia kuchnia');
 await page.getByRole('button',{name:'Domek',exact:true}).tap();await expect(page.getByRole('button',{name:'Kocia kuchnia',exact:true})).toBeEnabled();await expect(page.locator('.star-wallet')).toHaveText('97 ★');
});

test.describe('domek offline',()=>{
 test.use({serviceWorkers:'allow'});
 test.skip(process.env.HANIA_TEST_BUILD!=='1'||!!process.env.HANIA_BASE_URL,'Wymaga lokalnego wydania PWA.');
 test('kuchnia, nowe grafiki, zakup i ustawienie przetrwają zimny start bez sieci',async({page,context})=>{
  await page.goto('./');await expect(page.locator('[data-offline-status]')).toContainText('Materiały gotowe');await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBeTruthy();
  await restore(page,fixture());await context.setOffline(true);await page.getByRole('button',{name:'Kocia kuchnia',exact:true}).tap();
  await page.getByRole('button',{name:'Kup za 10 ★',exact:true}).tap();await page.getByRole('button',{name:'Na blacie',exact:true}).tap();
  await expect(page.locator('.room-decoration[data-id="cat-toaster"]')).toHaveClass(/slot-counter/);
  await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');
  await page.close();const second=await context.newPage();await second.goto('./');await second.getByRole('button',{name:'Domek',exact:true}).tap();await second.getByRole('button',{name:'Kocia kuchnia',exact:true}).tap();
  await expect(second.locator('.star-wallet')).toHaveText('84 ★');await expect(second.locator('.room-decoration[data-id="cat-toaster"]')).toHaveClass(/slot-counter/);
  expect(await second.locator('.kitchen-room img').evaluateAll(images=>images.every(img=>(img as HTMLImageElement).complete&&(img as HTMLImageElement).naturalWidth>0))).toBeTruthy();
 });
});
