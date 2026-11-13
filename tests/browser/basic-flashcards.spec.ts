import {resumeStudy} from './helpers.ts';
import {openBackup} from './navigation.ts';
import {openModule} from './navigation.ts';
import {test,expect} from './fixtures.ts';
import {readFileSync} from 'node:fs';
import {foodModules as modules} from '../materials.ts';
import {questionFor,keyFor} from '../../src/core.ts';
import {vocabularyFullAnswer} from '../../src/learning/vocabulary-answer.ts';
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
test('telefon: wybór podstawy i pełnych fiszek, zakres zapisany w kopii',async({page})=>{
  await page.goto('./');await openModule(page);
  await expect(page.getByRole('button',{name:'Fiszki podstawa',exact:true})).toBeVisible();
  await expect(page.locator('#mode-description-flashcards-basic')).toContainText('38');
  await expect(page.locator('#mode-description-flashcards')).toContainText('97');
  await expect(page.getByRole('group',{name:'Sposób odpowiadania'})).toBeVisible();
  await page.screenshot({path:'test-results/active-flashcards-setup-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Fiszki podstawa',exact:true}).tap();
  await expect(page.getByRole('heading',{name:'Fiszki podstawa',exact:true})).toBeVisible();
  await expect(page.locator('.option')).toHaveCount(3);
  await page.screenshot({path:'test-results/active-flashcard-mobile.png'});
  await expect(page.getByRole('button',{name:'Pokaż odpowiedź'})).toHaveCount(0);
  await openBackup(page);
  const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Zapisz kopię postępów',exact:true}).tap();
  const file=await(await downloaded).path();const session=JSON.parse(readFileSync(file!,'utf8')).progress.active;
  expect(session.mode).toBe('flashcards-basic');
  expect(session.items.every((i:any)=>i.type==='word'&&modules[0].basicFlashcardIds!.includes(i.id))).toBeTruthy();
  await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();
  await openModule(page);
  page.once('dialog',d=>d.accept());
  await page.getByRole('button',{name:'Fiszki',exact:true}).tap();
  await expect(page.getByRole('heading',{name:'Fiszki',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});

test('telefon: aktywne fiszki mieszane, błąd, poprawa, wznowienie i wynik',async({page})=>{
  await page.goto('./');await openModule(page);
  await expect(page.getByRole('button',{name:/Rozpocznij naukę/})).toHaveCount(0);
  await page.getByRole('button',{name:'Fiszki podstawa',exact:true}).tap();
  let sawText=false,sawChoice=false;
  for(let i=0;i<10;i++){
    const front=await page.locator('.question').innerText();
    const word=modules[0].words.find(w=>w.front===front)!;
    const full=vocabularyFullAnswer(questionFor(modules,{key:keyFor(modules[0],'word',word.id),moduleId:modules[0].id,version:word.rev??1,type:'word',id:word.id,input:'choice'}));
    if(await page.getByRole('textbox').isVisible()){
      sawText=true;await page.getByRole('textbox').fill(word.back);await page.getByRole('button',{name:/Sprawdź/}).tap();
    }else{
      sawChoice=true;
      if(i===0)await page.locator('.option').filter({hasNotText:word.back}).first().tap();
      else await page.getByRole('button',{name:full,exact:true}).tap();
    }
    if(i===0){
      await expect(page.locator('.feedback.incorrect')).toContainText(word.back);
      await page.reload();await resumeStudy(page);
      await page.getByRole('button',{name:'Spróbuję jeszcze raz'}).tap();
      await page.getByRole('button',{name:full,exact:true}).tap();
      await expect(page.locator('.feedback.correct')).toBeVisible();
    }
    await page.getByRole('button',{name:'Dalej',exact:false}).tap();
    await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');
  }
  expect(sawText&&sawChoice).toBeTruthy();
  await expect(page.locator('.rating-value')).toHaveText('2,5 / 3 łapki');
  await expect(page.getByRole('img',{name:'Ocena: 2,5 z 3 kocich łapek',exact:true})).toBeVisible();
  await page.setViewportSize({width:320,height:720});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.screenshot({path:'test-results/lesson-half-paws-320.png',fullPage:true});
  await expect(page.locator('.lesson-rating')).toContainText('Poprawki pomagają w nauce.');
});
