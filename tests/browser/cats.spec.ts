import {openModule} from './navigation.ts';
import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const catalog=JSON.parse(readFileSync(new URL('../../public/cats/catalog.json',import.meta.url),'utf8'));
const tasks=JSON.parse(readFileSync(new URL('../../public/content/02-food/cwiczenia.json',import.meta.url),'utf8'));

test('kotki reagują na błąd i poprawę, wracają po odświeżeniu i bawią na koniec',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.route('**/content/02-food/cwiczenia.json',r=>r.fulfill({json:tasks.filter((q:any)=>q.id==='g-count-milk')}));
  await page.goto('./');await openModule(page);await page.getByText('Wpisuję odpowiedź',{exact:true}).click();await page.getByRole('button',{name:'Gramatyka',exact:true}).click();
  await expect(page.locator('.cat-mascot')).toHaveCount(0);
  await expect(page.getByRole('textbox')).toHaveCount(0);await page.getByRole('button',{name:'policzalny',exact:true}).click();
  const mascot=page.locator('.feedback .cat-mascot');await expect(mascot).toHaveAttribute('data-mood','teacher');
  await expect(mascot.locator('figcaption')).toHaveCount(0);
  const cat=await mascot.getAttribute('data-cat'),frame=await mascot.locator('svg').getAttribute('viewBox');
  await page.screenshot({path:'test-results/cat-teacher-mobile.png'});
  await page.reload();await page.getByRole('button',{name:'Kontynuuj naukę →',exact:true}).click();await expect(mascot).toHaveAttribute('data-cat',cat!);await expect(mascot.locator('svg')).toHaveAttribute('viewBox',frame!);
  await page.getByRole('button',{name:'Spróbuję jeszcze raz'}).click();await expect(page.locator('.cat-mascot')).toHaveCount(0);
  await page.getByRole('button',{name:'niepoliczalny',exact:true}).click();await expect(mascot).toHaveAttribute('data-mood',/^(happy|celebrating)$/);await expect(mascot).toHaveAttribute('data-cat',cat!);
  await page.screenshot({path:'test-results/cat-success-mobile.png'});
  await page.getByRole('button',{name:'Dalej',exact:false}).click();
  await expect(page.getByRole('heading',{name:'Dobra robota, Haniu!'})).toBeVisible();await expect(page.locator('.summary .cat-mascot')).toHaveAttribute('data-mood','funny');
  await expect(page.locator('.summary-score')).toContainText('0 / 1');await page.screenshot({path:'test-results/cat-summary-mobile.png'});
});

test('galeria zaakceptowanych 25 wariantów — kontrola kadrowania',async({page})=>{
  await page.setViewportSize({width:1250,height:1400});await page.goto('./');
  await page.evaluate(async catalog=>{
    await Promise.all(Object.values(catalog.sheets).map(async(sheet:any)=>{
      const img=new Image();img.src=new URL(sheet.src,document.baseURI).href;await img.decode();
      const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
      const ctx=canvas.getContext('2d')!;ctx.drawImage(img,0,0);
      if(ctx.getImageData(0,0,1,1).data[3]!==0)throw new Error(`Tło planszy ${sheet.src} musi być przezroczyste.`);
    }));
    const moods=['happy','teacher','celebrating','funny-0','funny-1'];
    let html='<style>body{margin:0;padding:20px;background:#faf7ff;color:#503765;font:15px system-ui}.gallery{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}.gallery figure{margin:0;padding:8px;border:1px solid #ddcdec;border-radius:12px;text-align:center;background:#f7f1fc}.gallery svg{display:block;width:100%;height:190px;overflow:hidden}.gallery figcaption{font-size:14px}</style><div class="gallery">';
    for(const mood of moods)for(const cat of catalog.cats){
      const frame=mood.startsWith('funny-')?cat.funny[Number(mood.at(-1))]:cat[mood],sheet=catalog.sheets[frame.sheet],id=`clip-${cat.id}-${mood}`;
      html+=`<figure><svg viewBox="${frame.x} ${frame.y} ${frame.width} ${frame.height}"><defs><clipPath id="${id}">${frame.clip?`<polygon points="${frame.clip.map((p:number[])=>p.join(',')).join(' ')}"/>`:`<rect x="${frame.x}" y="${frame.y}" width="${frame.width}" height="${frame.height}"/>`}</clipPath></defs><image href="${new URL(sheet.src,document.baseURI).href}" width="${sheet.width}" height="${sheet.height}" clip-path="url(#${id})"/></svg><figcaption>${cat.name} · ${mood}</figcaption></figure>`;
    }
    document.body.innerHTML=html+'</div>';
  },catalog);
  await page.screenshot({path:'test-results/cats-gallery.png',fullPage:true});
  await expect(page.locator('.gallery figure')).toHaveCount(25);
});
