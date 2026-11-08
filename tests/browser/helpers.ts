import {expect,type Page} from '@playwright/test';
import type {Exercise} from '../../src/core.ts';

export async function answerQuestion(page: Page, q: Exercise, correct=true) {
  await expect(page.locator('#answer, .option').first()).toBeVisible();
  const answer=correct?q.answers[0]:q.options.find(o=>!q.answers.includes(o))!;
  if(await page.getByRole('textbox').isVisible()){
    await page.getByRole('textbox').fill(answer);
    await page.getByRole('button',{name:/Sprawdź/}).click();
  }else await page.getByRole('button',{name:answer,exact:true}).click();
}
