import {readFileSync} from 'node:fs';
import {test,expect,type Page} from './fixtures.ts';
import {resumeStudy} from './helpers.ts';
import {openBackup} from './navigation.ts';
import {foodModules as modules} from '../materials.ts';
import {backup} from '../../src/learning/backup.ts';
import {emptyProgress,type Progress} from '../../src/learning/model.ts';
import {makeSession,next,recordAnswer} from '../../src/learning/session.ts';
import {questionFor} from '../../src/learning/questions.ts';

test.use({viewport:{width:320,height:720},isMobile:true,hasTouch:true});

/** Osiem wpisywanych zadań: cztery za nami (drugie błędnie), jesteśmy na piątym. */
function atTaskFive(){
 const p=emptyProgress(),s=makeSession(modules,modules[0],'flashcards','text',false,p);
 s.items=s.items.slice(0,8);p.active=s;
 const answers:string[]=[];
 for(let i=0;i<4;i++){
  const q=questionFor(modules,s.items[i]);answers.push(i===1?'zla odpowiedz':q.answers[0]);
  recordAnswer(p,q,answers[i]);next(p);
 }
 return {p,answers,question:(i:number)=>questionFor(modules,s.items[i])};
}
async function restore(page:Page,p:Progress){await page.goto('./');await openBackup(page);await page.locator('#import-file').setInputFiles({name:'preview.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(p)))});await page.getByRole('button',{name:'Zastąp postępy',exact:true}).click();await page.getByRole('button',{name:'Moja nauka',exact:true}).click();await resumeStudy(page);}
async function exported(page:Page){await openBackup(page);const wait=page.waitForEvent('download');await page.getByRole('button',{name:'Zapisz kopię postępów',exact:true}).click();return JSON.parse(readFileSync((await(await wait).path())!,'utf8')).progress as Progress;}
const number=(page:Page,n:number)=>page.locator('.task-numbers button').nth(n-1);
const status=(page:Page)=>page.locator('.task-status');
const idle=(page:Page)=>expect(page.locator('#app')).toHaveAttribute('aria-busy','false');

test('podgląd ukończonego zadania i powrót zachowują wpisany tekst, a postępów nie zmieniają',async({page})=>{
 const {p,answers,question}=atTaskFive();await restore(page,p);
 await expect(status(page)).toHaveText('Zadanie 5 z 8 · Ukończone 4 z 8');
 await expect(page.locator('.task-numbers button')).toHaveCount(8);
 for(const n of [1,2,3,4]){await expect(number(page,n)).toBeEnabled();await expect(number(page,n)).toContainText('✓');}
 await expect(number(page,5)).toHaveAttribute('aria-current','step');await expect(number(page,5)).not.toContainText('✓');
 for(const n of [6,7,8])await expect(number(page,n)).toBeDisabled();
 const box=(await number(page,2).boundingBox())!;expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);

 await page.getByRole('textbox').fill('moj niedokonczony tekst');
 await number(page,2).tap();await idle(page);
 await expect(status(page)).toHaveText('Zadanie 2 z 8 · Ukończone 4 z 8');
 await expect(number(page,2)).toHaveAttribute('aria-current','step');
 await expect(page.locator('.task-preview .question')).toHaveText(question(1).prompt);
 await expect(page.locator('.task-preview .given-answer')).toContainText(answers[1]);
 await expect(page.locator('.task-preview .feedback.incorrect')).toContainText(question(1).explanation);
 await expect(page.getByRole('textbox')).toHaveCount(0);
 await expect(page.getByRole('button',{name:/Dalej|Spróbuję|Sprawdź|Zgłoś/})).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/task-preview-320.png'});

 await number(page,3).tap();await idle(page);
 await expect(page.locator('.task-preview .feedback.correct')).toBeVisible();
 await expect(page.locator('.task-preview .given-answer')).toContainText(answers[2]);

 await page.getByRole('button',{name:'Wróć do zadania 5 →'}).tap();await idle(page);
 await expect(status(page)).toHaveText('Zadanie 5 z 8 · Ukończone 4 z 8');
 await expect(page.getByRole('textbox')).toHaveValue('moj niedokonczony tekst');
 await expect(page.locator('.study-heading .tag')).toHaveCount(0);
 await page.screenshot({path:'test-results/task-numbers-320.png'});

 await number(page,1).tap();await idle(page);
 const saved=await exported(page);
 expect(saved.active).toEqual(p.active);expect(saved.words).toEqual(p.words);expect(saved.difficult).toEqual(p.difficult);expect(saved.adventure).toEqual(p.adventure);
});

test('po sprawdzeniu odpowiedzi powrót pokazuje tę samą informację zwrotną i sesja toczy się dalej',async({page})=>{
 const {p,question}=atTaskFive();await restore(page,p);
 await page.getByRole('textbox').fill('inna zla');await page.getByRole('button',{name:/Sprawdź/}).tap();await idle(page);
 await expect(page.locator('.feedback.incorrect')).toBeVisible();
 await expect(status(page)).toHaveText('Zadanie 5 z 8 · Ukończone 4 z 8');
 await number(page,2).tap();await idle(page);
 await number(page,5).tap();await idle(page);
 await expect(page.locator('.feedback.incorrect .given-answer')).toContainText('inna zla');
 await expect(page.locator('.feedback')).toContainText(question(4).explanation);
 await page.getByRole('button',{name:/Dalej/}).tap();await idle(page);
 await expect(status(page)).toHaveText('Zadanie 6 z 8 · Ukończone 5 z 8');
 await expect(number(page,5)).toContainText('✓');
});
