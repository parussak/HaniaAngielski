import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const dialogues=JSON.parse(readFileSync(new URL('../../public/content/02-food/rozmowki.json',import.meta.url),'utf8'));
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
for(const input of ['choice','text'] as const)test(`rozmówki mobilnie: ${input}, błąd, poprawa i wznowienie`,async({page})=>{
  const q=dialogues.find((q:any)=>q.id==='d-to-drink');
  await page.route('**/content/02-food/rozmowki.json',r=>r.fulfill({json:[q]}));
  await page.goto('./');await page.getByRole('button',{name:'Otwórz moduł Food — Fun with food'}).tap();
  await page.getByText(input==='choice'?'Wybieram odpowiedź':'Wpisuję odpowiedź',{exact:true}).tap();
  await page.getByRole('button',{name:'Rozmówki',exact:true}).tap();
  await expect(page.locator('.dialogue-line')).toHaveCount(2);await expect(page.locator('.dialogue-gap')).toHaveCount(1);
  await expect(page.locator('.dialogue')).toContainText('Would you like anything to');
  await expect(page.locator('.question-illustration img')).toHaveAttribute('src',/scene-milkshake-order\.svg$/);
  await page.screenshot({path:`test-results/dialogue-${input}-mobile.png`,fullPage:true});
  const answer=async(value:string)=>{if(input==='choice')await page.getByRole('button',{name:value,exact:true}).tap();else{await page.getByRole('textbox').fill(value);await page.getByRole('button',{name:/Sprawdź/}).tap();}};
  await answer('cook');await expect(page.locator('.given-answer')).toContainText('cook');await expect(page.locator('.expected-answer')).toContainText('drink');
  const nav=await page.locator('.sidebar nav').boundingBox(),next=await page.getByRole('button',{name:/Dalej/}).boundingBox();
  expect(next!.y+next!.height).toBeLessThanOrEqual(nav!.y);
  await page.reload();await page.getByRole('button',{name:'Kontynuuj',exact:true}).tap();await expect(page.locator('.given-answer')).toContainText('cook');
  await page.getByRole('button',{name:'Spróbuję jeszcze raz'}).tap();await answer('drink');await expect(page.locator('.feedback.correct')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  for(const viewport of [{width:320,height:640},{width:844,height:390}]){
    await page.setViewportSize(viewport);
    const bottom=await page.locator('.sidebar nav').boundingBox(),next=await page.getByRole('button',{name:/Dalej/}).boundingBox();
    expect(next!.y+next!.height).toBeLessThanOrEqual(bottom!.y);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  }
});

test('galeria słówek i scenek: przezroczyste SVG bez tekstu odpowiedzi',async({page})=>{
  await page.goto('./');await page.setViewportSize({width:1200,height:1100});
  await page.evaluate(async()=>{
    const ids=['word-apple','word-bread','word-milk','word-flour','word-sugar','word-water','word-cheese','word-jam','word-vegetable','word-egg','word-yoghurt','word-toaster','scene-milk-present','scene-milk-missing','scene-two-eggs','scene-sport-hungry','scene-ordering','scene-drink-offer','scene-chips-request','scene-loves-eggs'];
    const images=await Promise.all(ids.map(async id=>{const url=new URL(`illustrations/${id}.svg`,document.baseURI).href;const response=await fetch(url),svg=await response.text();if(!response.ok||svg.includes('<text'))throw new Error(`Niepoprawny obrazek ${id}`);const img=new Image();img.src=url;await img.decode();return `<figure><img src="${url}"><figcaption>${id}</figcaption></figure>`;}));
    document.body.innerHTML='<style>body{background:#faf7ff;color:#76558d;font:14px system-ui}.art-gallery{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:16px}.art-gallery figure{margin:0;padding:10px;background:white;border:1px solid #e4d7ee;border-radius:14px;text-align:center}.art-gallery img{width:100%;height:150px;object-fit:contain}</style><div class="art-gallery">'+images.join('')+'</div>';
  });
  await page.screenshot({path:'test-results/food-art-gallery.png',fullPage:true});
  await expect(page.locator('.art-gallery img')).toHaveCount(20);
});
