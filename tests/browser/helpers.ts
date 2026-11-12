import {expect,type Page} from '@playwright/test';
import type {Exercise} from '../../src/core.ts';
import {questionFor,isCorrect,type Module} from '../../src/core.ts';

export async function answerQuestion(page: Page, q: Exercise, correct=true) {
  await expect(page.locator('#answer, .option').first()).toBeVisible();
  const answer=correct?q.answers[0]:q.options.find(o=>!q.answers.includes(o))!;
  if(await page.getByRole('textbox').isVisible()){
    await page.getByRole('textbox').fill(answer);
    await page.getByRole('button',{name:/Sprawdź/}).click();
  }else await page.getByRole('button',{name:answer,exact:true}).click();
}

/** Exercise the visible controls, including matching and answer-bank confirmation. */
export async function answerCurrent(page:Page,modules:Module[],correct=true){
 await expect(page.locator('#answer,.option').first()).toBeVisible();
 const prompt=await page.locator('.question').innerText();let q:Exercise|undefined;
 for(const m of modules){const w=m.words.find(w=>w.front===prompt);q??=w?questionFor(modules,{key:`${m.id}@${w.rev??1}:word:${w.id}`,moduleId:m.id,version:w.rev??1,type:'word',id:w.id,input:'text'}):m.exercises.find(q=>q.prompt===prompt);}
 if(!q)throw new Error(`Nieznane pytanie: ${prompt}`);
 if(await page.getByRole('textbox').isVisible()){await page.getByRole('textbox').fill(correct?q.answers[0]:'wrong');await page.getByRole('button',{name:/Sprawdź/}).click();}
 else {const choices=page.locator('.option'),values=await choices.evaluateAll(els=>els.map(el=>(el as HTMLElement).dataset.answer!));const index=values.findIndex(value=>isCorrect(q!,value)===correct);expect(index).toBeGreaterThanOrEqual(0);await choices.nth(index).click();if(await page.locator('.answer-bank').count())await page.getByRole('button',{name:/Sprawdź/}).click();}
 await expect(page.locator(correct?'.feedback.correct':'.feedback.incorrect')).toBeVisible();
}
export async function finishCurrent(page:Page,modules:Module[],firstWrong=false){
 await expect(page.locator('.question')).toBeVisible();let count=0;
 while(await page.locator('.question').count()){
  expect(++count).toBeLessThanOrEqual(10);
  if(!await page.locator('.feedback').count()){
   if(firstWrong&&count===1){await answerCurrent(page,modules,false);await page.getByRole('button',{name:'Spróbuję jeszcze raz'}).click();}
   await answerCurrent(page,modules);
  }
  await page.getByRole('button',{name:/Dalej/}).click();await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');
 }
}
