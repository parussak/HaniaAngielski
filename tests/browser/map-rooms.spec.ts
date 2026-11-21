import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {backup,emptyProgress} from '../../src/core.ts';
import {freshAdventure,lessons,type Journey} from '../../src/adventure.ts';
import {openBackup} from './navigation.ts';

test('stacja za samą mapę Technology, link do zamkniętej mapy i zakupy po odświeżeniu',async({page})=>{
 const map:Journey=JSON.parse(readFileSync(new URL('../../public/content/03-technology/sciezka.json',import.meta.url),'utf8'));
 const p=emptyProgress();
 p.adventure=freshAdventure();p.adventure.earned=30;
 for(const entry of lessons(map))p.adventure.completed[entry.key]={at:'2026-11-20T12:00:00Z'};
 await page.goto('./');await openBackup(page);
 await page.locator('#import-file').setInputFiles({name:'rooms.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(p)))});
 await page.getByRole('button',{name:'Zastąp postępy',exact:true}).click();
 await page.getByRole('button',{name:'Domek',exact:true}).click();
 const tiles=page.locator('.house-cell');
 const salon=tiles.first(),station=page.getByRole('button',{name:'Stacja z warsztatem łazików'});
 await expect(station).toBeVisible();
 await page.setViewportSize({width:1080,height:850});
 await expect.poll(async()=>Math.abs((await salon.boundingBox())!.y-(await tiles.nth(1).boundingBox())!.y)).toBeLessThan(2);
 await page.screenshot({path:'test-results/house-cutaway.png',fullPage:true});
 await page.setViewportSize({width:320,height:760});
 const first=(await salon.boundingBox())!,locked=(await tiles.nth(1).boundingBox())!;
 expect(locked.y).toBeGreaterThan(first.y+first.height);
 expect(locked.height).toBeCloseTo(first.height,0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 const link=page.getByRole('link',{name:/Przejdź do mapy „Kocia kuchnia/});
 await link.click();await expect(page.getByRole('heading',{name:'Kocia kuchnia — Food w praktyce',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Domek',exact:true}).click();await station.click();
 await expect(page.locator('.room-background')).toHaveAttribute('src',/rover-station.svg$/);
 await page.getByRole('button',{name:'Kup za 8 ★'}).click();
 for(const [id,price] of [['moon-rock',4],['toolbox',6],['helper-robot',12]] as const){
  await page.locator(`.decoration-card[data-id="${id}"]`).click();
  await page.getByRole('button',{name:`Kup za ${price} ★`,exact:true}).click();
 }
 await expect(page.locator('.star-wallet')).toHaveText('0 ★');
 await page.getByRole('button',{name:'Na podłodze z boku',exact:true}).click();
 await page.reload();await expect(page.locator('.room-decoration[data-id="rover"]')).toBeVisible();
 for(const [id,slot] of [['moon-rock','bench-left'],['toolbox','bench-right'],['helper-robot','floor-side']]){
  const item=page.locator(`.room-decoration[data-id="${id}"]`);
  await expect(item).toHaveClass(new RegExp('slot-'+slot));
  await expect.poll(()=>item.locator('img').evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);
 }
 await page.locator('.cat-house').screenshot({path:'test-results/rover-station.png'});
 await page.getByRole('button',{name:'← Cały domek'}).click();await expect(station).toBeVisible();
});
