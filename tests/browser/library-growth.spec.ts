// Deliberately uses unscoped Playwright: this file checks the complete catalog.
import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {growingLibrary} from '../fixtures/growing-library.ts';
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
test('cały rzeczywisty katalog: każdy kurs pokazuje własne moduły bez stałej liczby',async({page})=>{
 await page.goto('./');
 const courses=await page.evaluate(async()=>{const get=async(path:string)=>(await fetch(new URL(`content/${path}`,document.baseURI))).json();const catalog=await get('katalog.json');return Promise.all((catalog.courseFolders as string[]).map(async folder=>{const course=await get(`${folder}/kurs.json`);return {name:course.name,moduleIds:course.modules};}));});
 for(const course of courses){
  await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();await page.getByRole('button',{name:'Wybierz kurs',exact:true}).tap();
  await page.getByRole('button',{name:`Wybierz kurs ${course.name}`,exact:true}).tap();await page.getByRole('button',{name:/Przejdź do modułów/}).tap();
  await expect(page.locator('.module-card')).toHaveCount(course.moduleIds.length);
 }
});
test('dodatkowe kursy i moduł: wybór Food oraz przejście do francuskiego i włoskiego',async({page})=>{
 const read=growingLibrary(async path=>JSON.parse(readFileSync(new URL(`../../public/content/${path}`,import.meta.url),'utf8')));
 await page.route('**/content/**',async route=>{const path=new URL(route.request().url()).pathname.split('/content/')[1];try{await route.fulfill({json:await read(path)});}catch{await route.continue();}});
 await page.goto('./');
 for(const id of ['angielski-hani','test-growth-french-book','test-growth-italian-book']){
  const file=await read('kursy.json'),own=await read('angielski-hani/kurs.json'),c=id==='angielski-hani'?{name:own.name,moduleIds:own.modules}:file.courses.find((c:any)=>c.id===id);
  await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();await page.getByRole('button',{name:'Wybierz kurs',exact:true}).tap();await page.getByRole('button',{name:`Wybierz kurs ${c.name}`,exact:true}).tap();
  await page.getByRole('button',{name:/Przejdź do modułów/}).tap();await expect(page.locator('.module-card')).toHaveCount(c.moduleIds.length);
  if(id==='angielski-hani'){await page.getByRole('button',{name:'Otwórz moduł Food — Fun with food',exact:true}).tap();await expect(page.getByRole('button',{name:'Fiszki podstawa',exact:true})).toBeVisible();}
 }
});
