import {openBackup} from './navigation.ts';
import {openModule} from './navigation.ts';
import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const tasks=JSON.parse(readFileSync(new URL('../../public/content/02-food/cwiczenia.json',import.meta.url),'utf8'));
async function oneQuestion(page:any,id='g-count-milk'){
  await page.route('**/content/02-food/cwiczenia.json',(r:any)=>r.fulfill({json:tasks.filter((q:any)=>q.id===id)}));
  await page.route('**/content/02-food/quiz.json',(r:any)=>r.fulfill({json:[]}));
  await page.goto('./');await openModule(page);
}
for(const [width,height] of [[320,640],[360,740],[844,390]])test(`I5: pytanie, opcja i Dalej dostępne nad paskiem ${width}x${height}`,async({page})=>{
  await page.setViewportSize({width,height});await oneQuestion(page);
  await page.getByText('Wybieram odpowiedź',{exact:true}).click();await page.getByRole('button',{name:'Gramatyka',exact:true}).click();
  await expect(page.locator('.question')).toBeVisible();await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');
  const nav=await page.locator('.sidebar nav').boundingBox();
  const option=await page.locator('.option').first().boundingBox();
  expect(option!.y+option!.height).toBeLessThan(nav!.y);
  expect((await page.locator('.question').boundingBox())!.y).toBeGreaterThanOrEqual(0);
  await page.getByRole('button',{name:'policzalny',exact:true}).click();
  await expect(page.locator('.feedback')).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-label','Pytanie 1 z 1');
  const next=await page.getByRole('button',{name:'Dalej',exact:false}).boundingBox();
  expect(next!.y+next!.height).toBeLessThanOrEqual(nav!.y-2);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await page.screenshot({path:`test-results/audit-${width}x${height}.png`});
});
test('K1/D6: po błędzie i poprawce trudność zostaje; retry przenosi fokus do pola',async({page})=>{
  await oneQuestion(page,'g-there-milk');
  await page.getByText('Wpisuję odpowiedź',{exact:true}).click();await page.getByRole('button',{name:'Gramatyka',exact:true}).click();
  await page.getByRole('textbox').fill('are');await page.getByRole('button',{name:/Sprawdź/}).click();
  await page.getByRole('button',{name:'Spróbuję jeszcze raz'}).click();
  await expect(page.getByRole('textbox')).toBeFocused();
  await page.getByRole('textbox').fill('is');await page.getByRole('button',{name:/Sprawdź/}).click();
  await openBackup(page);
  const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Zapisz kopię postępów',exact:true}).click();
  const file=await(await downloaded).path();const p=JSON.parse(readFileSync(file!,'utf8')).progress;
  expect(p.difficult).toContain('unit-2-food@1:exercise:g-there-milk');
});
test('I7: stara kopia i zmiana wersji modułu zachowują fiszkę i jej status',async({page})=>{
  const old=JSON.parse(readFileSync(new URL('../fixtures/backup-v1.json',import.meta.url),'utf8'));
  await page.route('**/content/02-food/modul.json',async route=>{const response=await route.fetch();const m=await response.json();m.version=7;await route.fulfill({json:m});});
  await page.goto('./');await openBackup(page);
  await page.locator('#import-file').setInputFiles({name:'old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(old))});
  await page.getByRole('button',{name:'Zastąp postępy',exact:true}).click();
  await page.getByRole('button',{name:'Moja nauka',exact:true}).click();await page.getByRole('button',{name:'Kontynuuj naukę →',exact:true}).click();
  await expect(page.getByRole('textbox')).toBeVisible();
  await openBackup(page);
  const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Zapisz kopię postępów',exact:true}).click();
  const file=await(await downloaded).path();expect(JSON.parse(readFileSync(file!,'utf8')).progress).toEqual(old.progress);
});
test('czytelność: funkcjonalny tekst ma 12px i kontrast co najmniej 4,5:1',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('./');
  const check=async()=>{
    const failures=await page.evaluate(()=>{
      const rgb=(s:string)=>s.match(/[\d.]+/g)!.map(Number);
      const luminance=(a:number[])=>a.slice(0,3).map(v=>{const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}).reduce((sum,c,i)=>sum+c*[.2126,.7152,.0722][i],0);
      const ratio=(a:number[],b:number[])=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
      const out:string[]=[];
      for(const el of document.querySelectorAll<HTMLElement>('.content p,.content button,.content label,.content legend,.content .exercise-label,.content .tag,.nav-item')){
        if(!el.getClientRects().length||!el.innerText.trim())continue;
        const style=getComputedStyle(el);if(parseFloat(style.fontSize)<12)out.push(`font ${style.fontSize}: ${el.innerText.slice(0,45)}`);
        let backgrounds:number[][]=[[255,255,255]];
        for(let parent:HTMLElement|null=el;parent;parent=parent.parentElement){
          const s=getComputedStyle(parent);
          if(s.backgroundImage!=='none'){const colors=s.backgroundImage.match(/rgba?\([^)]+\)/g);if(colors){backgrounds=colors.map(rgb);break;}}
          const color=rgb(s.backgroundColor);if(color.length<4||color[3]===1){backgrounds=[color];break;}
        }
        const contrast=Math.min(...backgrounds.map(b=>ratio(rgb(style.color),b)));
        if(contrast<4.5)out.push(`contrast ${contrast.toFixed(2)}: ${el.innerText.slice(0,45)}`);
      }
      return out;
    });expect(failures).toEqual([]);
  };
  await expect(page.getByRole('heading',{name:'Dobrze Cię widzieć, Haniu!'})).toBeVisible();await check();
  await openModule(page);await check();
  await page.getByText('Wybieram odpowiedź',{exact:true}).click();
  await page.getByRole('button',{name:'Gramatyka',exact:true}).click();await expect(page.locator('.option').first()).toBeVisible();await check();
});
