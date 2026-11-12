import {expect,type Page} from '@playwright/test';
import {questionFor,isCorrect,type Exercise,type Module} from '../../src/core.ts';
function fromKey(modules:Module[],key:string){const match=key.match(/^(.+)@(\d+):(word|exercise):(.+)$/)!;return questionFor(modules,{key,moduleId:match[1],version:Number(match[2]),type:match[3] as 'word'|'exercise',id:match[4],input:'choice'});}
export async function resumeStudy(page:Page){
 await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');
 if(await page.locator('.study-heading').count())return;
 const resume=page.getByRole('button',{name:'Kontynuuj',exact:true});if(await resume.count()){await resume.click();return;}
 const button=page.getByRole('button',{name:'Kontynuuj naukę →',exact:true});
 if(await button.count())await button.click();else if(await page.locator('.next-step-card button').count())await page.locator('.next-step-card button').click();
 await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');if(await resume.count())await resume.click();
}
export async function answerQuestion(page:Page,q:Exercise,correct=true){
 await expect(page.locator('#answer,.option').first()).toBeVisible();const answer=correct?q.answers[0]:q.options.find(o=>!q.answers.includes(o))!;
 if(await page.getByRole('textbox').isVisible()){await page.getByRole('textbox').fill(answer);await page.getByRole('button',{name:/Sprawdź/}).click();}else await page.getByRole('button',{name:answer,exact:true}).click();
}
export async function answerCurrent(page:Page,modules:Module[],correct=true){
 await expect(page.locator('#answer,.option').first()).toBeVisible();
 if(await page.locator('.pair-board').count()){
  for(let count=0;await page.locator('.pair-board').count();count++){
   expect(count).toBeLessThan(5);const source=page.locator('.pair-source[aria-pressed="true"]:not(:disabled)'),key=(await source.count()?await source.getAttribute('data-key'):await page.locator('.pair-source:not(:disabled)').first().getAttribute('data-key'))!;
   const q=fromKey(modules,key),choices=page.locator('.pair-target:not(:disabled)'),values=await choices.evaluateAll(els=>els.map(el=>(el as HTMLElement).dataset.answer!));
   const index=values.findIndex(value=>isCorrect(q,value)===correct);expect(index).toBeGreaterThanOrEqual(0);await choices.nth(index).click();await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');
   if(!correct){await expect(page.locator('.match-flash').first()).toBeVisible();return;}
  }await expect(page.locator('.board-summary')).toBeVisible();return;
 }
 if(await page.locator('.answer-bank').count()){
  const keys=await page.locator('.gap-target:not(:disabled)').evaluateAll(els=>els.map(el=>(el as HTMLElement).dataset.key!));
  for(const key of keys){const q=fromKey(modules,key),choices=page.locator('.bank-token:not(:disabled)'),values=await choices.evaluateAll(els=>els.map(el=>(el as HTMLElement).dataset.answer!));const index=values.findIndex(value=>isCorrect(q,value)===correct);expect(index).toBeGreaterThanOrEqual(0);await choices.nth(index).click();await page.locator(`.gap-target[data-key=${JSON.stringify(key)}]`).click();}
  await page.getByRole('button',{name:/Sprawdź zdania/}).click();await expect(page.locator(correct?'.board-summary':'.match-flash').first()).toBeVisible();return;
 }
 const prompt=await page.locator('.question').innerText();let q:Exercise|undefined;for(const m of modules){const w=m.words.find(w=>w.front===prompt);q??=w?fromKey(modules,`${m.id}@${w.rev??1}:word:${w.id}`):m.exercises.find(q=>q.prompt===prompt);}if(!q)throw Error(`Nieznane pytanie: ${prompt}`);
 if(await page.getByRole('textbox').isVisible()){await page.getByRole('textbox').fill(correct?q.answers[0]:'wrong');await page.getByRole('button',{name:/Sprawdź/}).click();}else{const choices=page.locator('.option'),values=await choices.evaluateAll(els=>els.map(el=>(el as HTMLElement).dataset.answer!));await choices.nth(values.findIndex(value=>isCorrect(q!,value)===correct)).click();}
 await expect(page.locator(correct?'.feedback.correct':'.feedback.incorrect')).toBeVisible();
}
export async function finishCurrent(page:Page,modules:Module[],firstWrong=false){
 await expect(page.locator('.study-heading')).toBeVisible();let count=0;
 while(await page.locator('.study-heading').count()){
  expect(++count).toBeLessThanOrEqual(14);
  if(!await page.locator('.feedback').count()){
   if(firstWrong&&count===1){const board=await page.locator('.pair-board,.answer-bank').count();await answerCurrent(page,modules,false);if(!board)await page.getByRole('button',{name:'Spróbuję jeszcze raz'}).click();}
   await answerCurrent(page,modules);
  }
  await page.getByRole('button',{name:/Dalej/}).click();await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');
 }
}
