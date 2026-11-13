import {resumeStudy} from './helpers.ts';
import {finishCurrent} from './helpers.ts';
import {openGeneralReview,openStageReview} from './navigation.ts';
import {openBackup} from './navigation.ts';
import {test,expect,type Page} from './fixtures.ts';
import {readFileSync} from 'node:fs';
import {foodModules as modules} from '../materials.ts';
import {emptyProgress,backup,keyFor,type Progress} from '../../src/core.ts';
import {freshAdventure,lessons,type Journey} from '../../src/adventure.ts';
import {stageKey} from '../../src/stage-review.ts';
const m=modules[0],j:Journey=JSON.parse(readFileSync(new URL('../../public/content/02-food/sciezka.json',import.meta.url),'utf8'));
const practice:Journey=JSON.parse(readFileSync(new URL('../../public/content/02-food/sciezka-praktyka.json',import.meta.url),'utf8'));
const complete=(p:Progress)=>{p.adventure=freshAdventure();p.adventure.reviewSchema=1;for(const l of [...lessons(j),...lessons(practice)])p.adventure.completed[l.key]={at:'2026-11-09T12:00:00.000Z'};};
async function restore(page:Page,p:Progress){
  await page.goto('./');await openBackup(page);
  await page.locator('#import-file').setInputFiles({name:'next-step.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(p)))});
  await page.getByRole('button',{name:'Zastąp postępy',exact:true}).tap();await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();
}
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});

test('ramka rozpoczyna lekcję, wznawia ją po odświeżeniu i wskazuje następną po ukończeniu',async({page})=>{
  await page.goto('./');await resumeStudy(page);
  await expect(page.getByRole('heading',{name:j.stages[0].lessons[0].title,exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).tap();
  const first=await page.locator('.question').innerText();await page.reload();
  // D-51: a refresh restores the exercise itself; the home frame still offers to resume it.
  await expect(page.locator('.question')).toHaveText(first);await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();
  await expect(page.locator('.next-step-card')).toHaveAttribute('data-step-kind','resume');
  await resumeStudy(page);await expect(page.locator('.question')).toHaveText(first);
  await finishCurrent(page,modules);
  await expect(page.locator('.summary')).toBeVisible();await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();
  await expect(page.locator('.next-step-card')).toHaveAttribute('data-step-kind','lesson');
  await expect(page.locator('.next-step-detail')).toContainText(lessons(j)[1].lesson.title);
  await resumeStudy(page);await expect(page.getByRole('heading',{name:lessons(j)[1].lesson.title,exact:true})).toBeVisible();
});

test('kolejna mapa z plików treści jest proponowana po Food, pomimo zaległej powtórki',async({page})=>{
  const folder=new URL('../../public/content/02-food/',import.meta.url);
  const files=Object.fromEntries(['modul.json','slownictwo.json','quiz.json','cwiczenia.json','gramatyka.json','rozmowki.json','sciezka.json'].map(file=>[file,JSON.parse(readFileSync(new URL(file,folder),'utf8'))]));
  const id='unit-3-test';Object.assign(files['modul.json'],{id,order:3,name:'Moduł testowy',cover:'Test',journeyPath:'03-test/sciezka.json'});
  delete files['modul.json'].journeyPaths;
  files['sciezka.json'].moduleId=id;files['sciezka.json'].title='Następna przygoda testowa';
  for(const file of ['cwiczenia.json','rozmowki.json'])for(const q of files[file])q.requires=[id];
  await page.route('**/content/katalog.json',r=>r.fulfill({json:{version:1,coursesFile:'kursy.json',modules:['02-food','03-test']}}));
  const courseFile=JSON.parse(readFileSync(new URL('../../public/content/kursy.json',import.meta.url),'utf8'));
  courseFile.courses[0].moduleIds.push(id);
  await page.route('**/content/kursy.json',r=>r.fulfill({json:courseFile}));
  await page.route('**/content/03-test/*.json',r=>r.fulfill({json:files[new URL(r.request().url()).pathname.split('/').at(-1)!]}));
  const p=emptyProgress();complete(p);const item={key:keyFor(m,'word','apple'),moduleId:m.id,version:1,type:'word' as const,id:'apple',input:'text' as const};
  p.adventure!.stageReviews={[stageKey(j,j.stages[0])]:{round:0,items:{[item.key]:{item,correct:0,due:1}}}};
  await restore(page,p);await page.reload();
  await expect(page.locator('.next-step-card')).toHaveAttribute('data-step-kind','lesson');
  await expect(page.locator('.next-step-detail')).toContainText('Test');
  await page.getByRole('button',{name:'Zacznij następny moduł →',exact:true}).tap();
  await expect(page.locator('.learn-word')).toHaveCount(j.stages[0].lessons[0].wordIds.length);
  await page.getByRole('button',{name:'Zaczynam ćwiczenia →'}).tap();
  await expect(page.locator('.question')).toBeVisible();
});

test('po wszystkich lekcjach ramka prowadzi do zaległej powtórki etapu lub ogólnej',async({page})=>{
  const p=emptyProgress();complete(p);const item={key:keyFor(m,'word','apple'),moduleId:m.id,version:1,type:'word' as const,id:'apple',input:'text' as const};
  p.adventure!.stageReviews={[stageKey(j,j.stages[0])]:{round:0,items:{[item.key]:{item,correct:0,due:1}}}};
  await restore(page,p);await expect(page.locator('.next-step-card')).toHaveAttribute('data-step-kind','practice');
  await resumeStudy(page);await expect(page.getByRole('heading',{name:'Kocia rozgrzewka',exact:true})).toBeVisible();await openStageReview(page);await expect(page.locator('.review-meter')).toHaveCount(0);await expect(page.getByRole('textbox')).toBeVisible();
  p.adventure!.stageReviews={};p.words[item.key]='review';await restore(page,p);
  await expect(page.locator('.next-step-card')).toHaveAttribute('data-step-kind','practice');
  await resumeStudy(page);await openGeneralReview(page);await expect(page.getByRole('textbox')).toBeVisible();await expect(page.locator('.question')).toHaveText('jabłko');
});
