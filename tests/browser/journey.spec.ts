import {openGeneralReview} from './navigation.ts';
import {openModule} from './navigation.ts';
import {test,expect} from './fixtures.ts';
import {foodModules as modules} from '../materials.ts';
import {vocabularyFullAnswer} from '../../src/learning/vocabulary-answer.ts';
test.use({isMobile:true,hasTouch:true,viewport:{width:390,height:844}});
test('telefon: fiszki, quiz mieszany, powtórka błędów i brak błędów zasobów',async({page})=>{
  const failures:string[]=[];
  const origin=new URL(test.info().project.use.baseURL!).origin;
  page.on('pageerror',err=>failures.push(err.message));
  page.on('response',response=>{if(response.url().startsWith(origin) && response.status()>=400) failures.push(`${response.status()} ${response.url()}`);});
  await page.goto('./');
  await openModule(page);
  await page.getByText('Wpisuję odpowiedź',{exact:true}).tap();
  await page.getByRole('button',{name:'Fiszki podstawa',exact:true}).tap();
  const reviewWord=await page.locator('.question').innerText();
  await page.getByRole('textbox').fill('wrong');
  await page.getByRole('button',{name:/Sprawdź/}).tap();
  await page.getByRole('button',{name:'Dalej',exact:false}).tap();
  await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');
  const front=await page.locator('.question').innerText();
  await page.getByRole('textbox').fill(modules[0].words.find(w=>w.front===front)!.back);
  await page.getByRole('button',{name:/Sprawdź/}).tap();
  await page.getByRole('button',{name:'Dalej',exact:false}).tap();
  await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');
  await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();
  await openModule(page);
  await page.getByText('Trochę wybieram, trochę wpisuję',{exact:true}).tap();
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:/^Quiz słownictwa/}).tap();
  const all=modules[0].exercises;
  let sawText=false,sawChoice=false,wrongQuestion='';
  for(let index=0;index<10;index++) {
    const prompt=await page.locator('.question').innerText();
    if(index===0)wrongQuestion=prompt;
    const word=all.find(w=>w.prompt===prompt)!;
    if(await page.getByRole('textbox').isVisible()) {
      sawText=true; await page.getByRole('textbox').fill(index===0?'wrong':word.answers[0]);
      await page.getByRole('button',{name:/Sprawdź/}).tap();
    }else{
      sawChoice=true;
      if(index===0) { const wrong=page.locator('.option').filter({hasNotText:word.answers[0]}).first(); await wrong.tap(); }
      else await page.getByRole('button',{name:vocabularyFullAnswer(word),exact:true}).tap();
    }
    await expect(page.locator('.feedback')).toBeVisible();
    await page.getByRole('button',{name:'Dalej',exact:false}).tap();
    await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');
  }
  expect(sawText).toBeTruthy();expect(sawChoice).toBeTruthy();
  // Dziesięć zadań kończy sesję. Błąd pozostaje w osobnej powtórce.
  await expect(page.getByRole('heading',{name:'Dobra robota, Haniu!'})).toBeVisible();
  await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();
  await openModule(page);
  await openGeneralReview(page);
  await expect(page.locator('.question')).toBeVisible();
  expect([wrongQuestion,reviewWord]).toContain(await page.locator('.question').innerText());
  expect(failures).toEqual([]);
});
