import {resumeStudy} from './helpers.ts';
import {openBackup} from './navigation.ts';
import {test,expect,type Page} from './fixtures.ts';
import {readFileSync} from 'node:fs';
import {foodModules as modules} from '../materials.ts';
import {backup,emptyProgress,keyFor,makeSession,type Progress,type Item} from '../../src/core.ts';
import {freshAdventure,makeLessonSession,type Journey} from '../../src/adventure.ts';
import {makeStageReviewSession,recordStageError} from '../../src/stage-review.ts';
const m=modules[0],j:Journey=JSON.parse(readFileSync(new URL('../../public/content/02-food/sciezka.json',import.meta.url),'utf8'));
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
async function restore(page:Page,p:Progress){await page.goto('./');await openBackup(page);await page.locator('#import-file').setInputFiles({name:'gaps.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(p)))});await page.getByRole('button',{name:'Zastąp postępy',exact:true}).tap();await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();await resumeStudy(page);}
for(const mode of ['grammar','general-review','stage-review'] as const)test(`${mode}: jedno słowo do luki także po błędzie, wznowieniu i poprawce`,async({page})=>{
 const p=emptyProgress(),item:Item={key:keyFor(m,'exercise','g-container-water'),moduleId:m.id,version:1,type:'exercise',id:'g-container-water',input:'text'};
 p.adventure=freshAdventure();p.adventure.earned=11;p.adventure.reviewSchema=1;
 if(mode==='stage-review'){
  const lesson=makeLessonSession(modules,j,j.stages[0].lessons[0],'text',p);recordStageError(p,lesson,item,[j]);
  p.active=makeStageReviewSession(modules,j,j.stages[0],'choice',p);
 }else{
  if(mode==='general-review')p.difficult=[item.key];
  p.active=makeSession(modules,m,mode==='grammar'?'grammar':'review','text',false,p);p.active.items=[item];
 }
 await restore(page,p);await expect(page.locator('.question')).toContainText('a ___ of water.');
 await expect(page.locator('#answer-hint')).toHaveText('Wpisz tylko brakujący fragment, bez przepisywania całego zdania.');
 await expect(page.getByRole('textbox')).toHaveAttribute('aria-describedby','answer-hint');
 await page.getByRole('textbox').fill('jar');await page.getByRole('button',{name:/Sprawdź/}).tap();await expect(page.locator('.feedback.incorrect')).toBeVisible();
 await expect(page.locator('.expected-answer p')).toHaveText('bottle');
 await page.getByRole('button',{name:'Spróbuję jeszcze raz',exact:true}).tap();await expect(page.locator('#answer-hint')).toBeVisible();
 await page.reload();await resumeStudy(page);await expect(page.locator('#answer-hint')).toBeVisible();
 await page.getByRole('textbox').fill('bottle');await page.getByRole('button',{name:/Sprawdź/}).tap();await expect(page.locator('.feedback.correct')).toBeVisible();
 await page.getByRole('button',{name:'Domek',exact:true}).tap();await expect(page.locator('.star-wallet')).toContainText('11');
});
