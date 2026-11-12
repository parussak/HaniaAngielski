import {resumeStudy} from './helpers.ts';
import {test,expect,type Page} from './fixtures.ts';
import {openBackup,openWarmup,openAdditionalWarmup} from './navigation.ts';
import {backup,emptyProgress,keyFor,questionFor,isCorrect,type Progress} from '../../src/core.ts';
import {freshAdventure,lessons,lessonKey,type Journey} from '../../src/adventure.ts';
import {makeTrainingSession} from '../../src/learning/training.ts';
import {foodModules as modules} from '../materials.ts';
import {readFileSync} from 'node:fs';
const maps=['sciezka','sciezka-praktyka'].map(f=>JSON.parse(readFileSync(new URL(`../../public/content/02-food/${f}.json`,import.meta.url),'utf8')) as Journey),m=modules[0],at='2026-11-12T12:00:00Z';
function completed(){
 const p=emptyProgress();p.adventure=freshAdventure();p.adventure.earned=50;p.adventure.reviewSchema=1;p.adventure.stageReviews={};
 for(const j of maps){for(const {key} of lessons(j))p.adventure.completed[key]={at};for(const stage of j.stages)p.adventure.stageReviews[`${j.id?j.moduleId+'/'+j.id:j.moduleId}/${stage.id}`]={round:0,items:{},rewardedAt:at};}
 const key=keyFor(m,'word','apple');p.adventure.stageReviews['unit-2-food/food'].items[key]={item:{key,moduleId:m.id,id:'apple',version:1,type:'word',input:'text'},correct:0,due:1};
 p.encountered=[key,keyFor(m,'word','bread'),keyFor(m,'exercise','g-so-sport')];return p;
}
async function restore(page:Page,p:Progress){await page.goto('./');await openBackup(page);await page.locator('#import-file').setInputFiles({name:'warmup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(p)))});await page.getByRole('button',{name:'Zastąp postępy',exact:true}).click();await page.getByRole('button',{name:'Moja nauka',exact:true}).click();}
async function exported(page:Page){await openBackup(page);const d=page.waitForEvent('download');await page.getByRole('button',{name:'Zapisz kopię postępów',exact:true}).click();return JSON.parse(readFileSync((await(await d).path())!,'utf8')).progress as Progress;}
async function finishWrong(page:Page){
 await expect(page.locator('.question')).toBeVisible();let count=0;
 while(await page.locator('.question').count()){
  expect(++count).toBeLessThanOrEqual(8);
  if(await page.getByRole('textbox').isVisible()){await page.getByRole('textbox').fill('wrong');await page.getByRole('button',{name:/Sprawdź/}).click();}else {
   const prompt=await page.locator('.question').innerText(),word=m.words.find(w=>w.front===prompt);
   const q=word?questionFor(modules,{key:keyFor(m,'word',word.id),moduleId:m.id,version:word.rev??1,type:'word',id:word.id,input:'choice'}):m.exercises.find(q=>q.prompt===prompt)!;
   const options=page.locator('.option');await expect(options.first()).toBeVisible();
   const values=await options.evaluateAll(els=>els.map(el=>(el as HTMLElement).dataset.answer!));
   await options.nth(values.findIndex(text=>!isCorrect(q,text))).click();
  }
  await page.getByRole('button',{name:/Dalej/}).click();await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');
 }
}
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
test('ukończone mapy pozostają sukcesem; dodatkowa rozgrzewka ma koniec mimo błędów',async({page})=>{
 const p=completed();await restore(page,p);await page.getByRole('button',{name:/Wybierz przygodę/}).click();
 await expect(page.locator('.retention-overview.is-mastered')).toHaveCount(2);await expect(page.locator('.has-pending')).toHaveCount(0);
 await page.getByRole('button',{name:`Otwórz mapę ${maps[0].title}`,exact:true}).click();
 await expect(page.locator('.lead')).toContainText('100% ukończenia');await expect(page.locator('.has-pending,.stage-review-step')).toHaveCount(0);
 await expect(page.locator('.module-award')).toContainText('Gratulacje');await page.screenshot({path:'test-results/warmup-completed-map-mobile.png',fullPage:true});
 await openAdditionalWarmup(page);await expect(page.locator('.study-heading h1')).toHaveText('Kocia rozgrzewka');await finishWrong(page);
 await expect(page.getByRole('heading',{name:'Kocia rozgrzewka ukończona!',exact:true})).toBeVisible();await expect(page.locator('.summary')).not.toContainText(/zaległ|do utrwalenia|3\/3/);await expect(page.locator('.lesson-reward')).toContainText('+1 ★');
 const saved=await exported(page);expect(saved.adventure!.completed).toEqual(p.adventure!.completed);expect(saved.adventure!.earned).toBe(51);expect(saved.adventure!.stageReviews!['unit-2-food/food'].items[p.encountered![0]].correct).toBe(0);
 await page.getByRole('button',{name:'Moja nauka',exact:true}).click();await openWarmup(page);await page.setViewportSize({width:320,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.screenshot({path:'test-results/warmup-menu-mobile.png',fullPage:true});
});
test('dawny trening w rozpoczętej sesji jest rozgrzewką i nie otwiera ukończonej mapy',async({page})=>{
 const p=completed(),j=maps[1],l=lessons(j).find(e=>e.lesson.role==='training')!.lesson;
 p.active=makeTrainingSession(modules,m,p,'text',{journey:j,lesson:l,journeys:maps});p.active!.lesson!.title='Dawny trening';const key=lessonKey(j,l),old=p.adventure!.completed[key];
 await restore(page,p);await resumeStudy(page);await expect(page.locator('.study-heading h1')).toHaveText('Koci trening');await finishWrong(page);
 await expect(page.locator('.lesson-reward')).toContainText('+1 ★');const saved=await exported(page);expect(saved.adventure!.completed[key]).toEqual(old);expect(saved.adventure!.completed).toEqual(p.adventure!.completed);
});
