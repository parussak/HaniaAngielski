import {test,expect,type Page} from './fixtures.ts';
import {backup,emptyProgress,makeSession,type Progress} from '../../src/core.ts';
import {creditStars,purchase} from '../../src/house/progress.ts';
import {foodModules} from '../materials.ts';
import {openBackup} from './navigation.ts';
import {readFileSync} from 'node:fs';

function sample(){const p=emptyProgress();creditStars(p,30);purchase(p,'pillow');p.active=makeSession(foodModules,foodModules[0],'grammar','text',false,p);return p;}
async function restore(page:Page,p:Progress){await page.goto('./');await openBackup(page);await page.locator('#import-file').setInputFiles({name:'grid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(p)))});await page.getByRole('button',{name:'Zastąp postępy',exact:true}).click();await page.getByRole('button',{name:'Domek',exact:true}).click();}
async function exported(page:Page){await openBackup(page);const next=page.waitForEvent('download');await page.getByRole('button',{name:'Zapisz kopię postępów',exact:true}).click();return JSON.parse(readFileSync((await(await next).path())!,'utf8')).progress as Progress;}
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});

test('siatka: mysz, stały rozmiar, błędny ruch, strzałki i wznowienie bez zmiany postępów',async({page})=>{
 const p=sample();await restore(page,p);
 const item=page.locator('.grid-item[data-id="pillow"]');
 const first=await item.boundingBox();
 await page.getByRole('button',{name:'Urządź pokój',exact:true}).click();
 await page.locator('.cat-house').scrollIntoViewIfNeeded();
 const room=(await page.locator('.cat-house').boundingBox())!,box=(await item.boundingBox())!;
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
 await page.mouse.move(box.x+box.width/2+room.width*5/24,box.y+box.height/2+room.height/15,{steps:8});await page.mouse.up();
 await expect(item).toHaveAttribute('data-x','15');await expect(item).toHaveAttribute('data-y','11');
 const after=(await item.boundingBox())!;expect(after.width).toBeCloseTo(first!.width,1);expect(after.height).toBeCloseTo(first!.height,1);
 await page.getByRole('button',{name:'Przesuń w prawo',exact:true}).click();await expect(item).toHaveAttribute('data-x','16');
 // Above the floor is invalid for a cushion: the pointer preview must roll back.
 const b=(await item.boundingBox())!;await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2,room.y+20,{steps:8});await page.mouse.up();
 await expect(page.getByRole('status').filter({hasText:/mieścić|pasujący/})).toBeVisible();await expect(page.locator('[data-grid-message]')).toBeEmpty();await expect(item).toHaveAttribute('data-y','11');
 for(const width of [320,390]){await page.setViewportSize({width,height:844});await expect(item).toBeVisible();const r=(await page.locator('.cat-house').boundingBox())!,i=(await item.boundingBox())!;expect(i.width/r.width).toBeCloseTo(3/24,2);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();}
 await page.screenshot({path:'test-results/house-grid-mobile.png',fullPage:true});
 const saved=await exported(page);expect(saved.adventure!.purchases.pillow.position).toEqual({x:16,y:11});expect(saved.active).toEqual(p.active);expect(saved.adventure!.earned).toBe(30);expect(saved.adventure!.purchases.pillow.cost).toBe(6);
 await restore(page,saved);await expect(item).toHaveAttribute('data-x','16');
});

test('siatka: rzeczywisty gest dotykowy, anulowanie gestu i schowek',async({page,context})=>{
 await restore(page,sample());await page.getByRole('button',{name:'Urządź pokój',exact:true}).tap();await page.locator('.cat-house').scrollIntoViewIfNeeded();
 const cdp=await context.newCDPSession(page),item=page.locator('.grid-item[data-id="pillow"]'),r=(await page.locator('.cat-house').boundingBox())!;
 const gesture=async(cancel:boolean)=>{
  const b=(await item.boundingBox())!,x=b.x+b.width/2,y=b.y+b.height/2;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+r.width*3/24,y,id:1}]});
  await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});
 };
 
 await gesture(true);await expect(item).toHaveAttribute('data-x','10');
 await gesture(false);await expect(item).toHaveAttribute('data-x','13');
 await page.getByRole('button',{name:'Schowaj wybrany przedmiot',exact:true}).tap();
 await expect(page.locator('.room-decoration.unplaced')).toHaveCount(1);
 await expect(page.locator('.owned-location')).toHaveText('W schowku');
 await page.getByRole('button',{name:'Ustaw w miejscu podglądu',exact:true}).tap();await expect(item).not.toHaveClass(/unplaced/);
 await page.getByRole('button',{name:'Gotowe — zakończ urządzanie',exact:true}).tap();
 await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();
 await expect(page.getByRole('heading',{name:'Dobrze Cię widzieć, Haniu!'})).toBeVisible();
});

test.describe('siatka offline',()=>{
 test.use({serviceWorkers:'allow'});
 test.skip(process.env.HANIA_TEST_BUILD!=='1'||!!process.env.HANIA_BASE_URL,'Wymaga lokalnego wydania PWA.');
 test('współrzędne przetrwają zimny start bez internetu',async({page,context})=>{
  await page.goto('./');await expect(page.locator('[data-offline-status]')).toContainText('Materiały gotowe');await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBeTruthy();
  await restore(page,sample());await page.getByRole('button',{name:'Urządź pokój',exact:true}).tap();
  await page.getByRole('button',{name:'Przesuń w prawo',exact:true}).tap();await expect(page.locator('.grid-item[data-id="pillow"]')).toHaveAttribute('data-x','11');
  await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');await page.close();await context.setOffline(true);
  const second=await context.newPage();await second.goto('./');await second.getByRole('button',{name:'Domek',exact:true}).tap();
  await expect(second.locator('.grid-item[data-id="pillow"]')).toHaveAttribute('data-x','11');await expect(second.locator('.star-wallet')).toHaveText('24 ★');
 });
});
