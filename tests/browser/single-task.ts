import {readFileSync} from 'node:fs';
import type {Page} from '@playwright/test';
const read=(file:string)=>JSON.parse(readFileSync(new URL(`../../public/content/angielski-hani/02-food/${file}`,import.meta.url),'utf8'));
/**
 * Serves Food with exactly one grammar task. D-74: a rule without a grammar task is a content error,
 * so only that task's rule is served, and the dialogues (which point to other rules) are left out.
 */
export async function serveSingleTask(page:Page,id:string){
  const tasks=read('cwiczenia.json'),rules=read('gramatyka.json'),task=tasks.find((q:any)=>q.id===id);
  const base='**/content/angielski-hani/02-food/';
  await page.route(`${base}cwiczenia.json`,r=>r.fulfill({json:[task]}));
  await page.route(`${base}gramatyka.json`,r=>r.fulfill({json:rules.filter((x:any)=>x.id===task.ruleId)}));
  await page.route(`${base}rozmowki.json`,r=>r.fulfill({json:[]}));
}
