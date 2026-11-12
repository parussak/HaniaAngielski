import {openWarmup,openStageReview} from './navigation.ts';
import {openBackup} from './navigation.ts';
import {openMap} from './navigation.ts';
import {test,expect,type Page} from './fixtures.ts';
import {readFileSync} from 'node:fs';
import {foodModules as modules} from '../materials.ts';
import {emptyProgress,backup,recordAnswer,questionFor,next,keyFor,type Progress} from '../../src/core.ts';
import {validateJourney,makeLessonSession,lessonKey,freshAdventure} from '../../src/adventure.ts';
const j=validateJourney(JSON.parse(readFileSync(new URL('../../public/content/02-food/sciezka.json',import.meta.url),'utf8')),modules[0]),stage=j.stages[0],id=`${j.moduleId}/${stage.id}`;
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
function oldFixture(){
  const p=emptyProgress();p.active=makeLessonSession(modules,j,stage.lessons[0],'text',p);const s=p.active;
  recordAnswer(p,questionFor(modules,s.items[0]),'wrong');while(p.active){if(s.phase!=='feedback')recordAnswer(p,questionFor(modules,s.items[s.index]),questionFor(modules,s.items[s.index]).answers[0]);next(p);}
  p.adventure=freshAdventure();p.adventure.earned=15;for(const l of stage.lessons)p.adventure.completed[lessonKey(j,l)]={at:s.completedAt!};return p;
}
async function importProgress(page:Page,p:Progress){
  await page.goto('./');await openBackup(page);
  await page.locator('#import-file').setInputFiles({name:'review.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(p)))});
  await page.getByRole('button',{name:'Zastąp postępy',exact:true}).tap();await expect(page.locator('#app')).toHaveAttribute('aria-busy','false');
  await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();await openMap(page);
}
async function openFirstStage(page:Page){const node=page.locator('.journey-stage').first();if(await node.getAttribute('open')===null)await node.locator('summary').tap();return node;}
async function correct(page:Page){
  await expect(page.locator('#answer, .option').first()).toBeVisible();
  const text=await page.locator('.question').innerText(),word=modules[0].words.find(w=>w.front===text),q=modules[0].exercises.find(q=>q.prompt===text),value=word?.back??q!.answers[0];
  if(await page.getByRole('textbox').isVisible()){await page.getByRole('textbox').fill(value);await page.getByRole('button',{name:/Sprawdź/}).tap();}else await page.getByRole('button',{name:value,exact:true}).tap();
  await expect(page.locator('.feedback.correct')).toBeVisible();
}

async function savedProgress(page:Page){await openBackup(page);const promise=page.waitForEvent('download');await page.getByRole('button',{name:'Zapisz kopię postępów',exact:true}).click();return JSON.parse(readFileSync((await(await promise).path())!,'utf8')).progress as Progress;}

test('osobne krótkie rozgrzewki zachowują stare błędy, trzy zaliczenia i jednorazową premię',async({page})=>{
 await importProgress(page,oldFixture());await expect(page.locator('.stage-review-step,.has-pending')).toHaveCount(0);
 const node=await openFirstStage(page);await expect(node.locator('.stage-retention-text')).toContainText('Gratulacje');
 await expect(page.locator('.star-wallet')).toContainText('15');
 for(let i=0;i<3;i++){
  await openStageReview(page);await expect(page.locator('.review-meter')).toHaveCount(0);
  if(i===0){await page.reload();await page.getByRole('button',{name:'Kontynuuj naukę →',exact:true}).click();await expect(page.getByRole('textbox')).toBeVisible();}
  await correct(page);await page.getByRole('button',{name:/Dalej/}).click();
  await expect(page.getByRole('heading',{name:'Kocia rozgrzewka ukończona!',exact:true})).toBeVisible();
  await expect(page.locator('.summary')).not.toContainText(/do utrwalenia|3\/3|zaległo/);
  await expect(page.locator('.lesson-reward')).toContainText(i===2?'+3':'Rozgrzewka ukończona');
  const saved=await savedProgress(page);expect(saved.adventure!.stageReviews![id].items[Object.keys(saved.adventure!.stageReviews![id].items)[0]].correct).toBe(i+1);
  await page.getByRole('button',{name:'Moja nauka',exact:true}).click();await openMap(page);
  await expect(page.locator('.star-wallet')).toContainText(i===2?'18':'15');
 }
 await openWarmup(page);await expect(page.locator('button[data-action="stage-review"][data-id="food"]')).toHaveCount(0);
 await page.screenshot({path:'test-results/warmup-topics-mobile.png',fullPage:true});
});

test('błąd nadal wraca w tle, ale zakończenie rozgrzewki jest pozytywne i skończone',async({page})=>{
 const p=oldFixture(),item={key:keyFor(modules[0],'word','apple'),moduleId:j.moduleId,version:1,type:'word' as const,id:'apple',input:'text' as const};
 p.adventure!.reviewSchema=1;p.adventure!.reviewArchiveHead=null;p.adventure!.stageReviews={[id]:{round:3,items:{[item.key]:{item,correct:2,due:6}}}};
 await importProgress(page,p);await openStageReview(page);await page.getByRole('textbox').fill('aple');await page.getByRole('button',{name:/Sprawdź/}).click();await expect(page.locator('.feedback.incorrect')).toBeVisible();
 await expect(page.locator('.review-meter')).toHaveCount(0);
 for(const viewport of [{width:320,height:640},{width:844,height:390}]){await page.setViewportSize(viewport);const nav=await page.locator('.sidebar nav').boundingBox(),button=await page.getByRole('button',{name:/Dalej/}).boundingBox();expect(button!.y+button!.height).toBeLessThanOrEqual(nav!.y);}
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Spróbuję jeszcze raz'}).click();await correct(page);await page.getByRole('button',{name:/Dalej/}).click();
 await expect(page.getByRole('heading',{name:'Kocia rozgrzewka ukończona!',exact:true})).toBeVisible();
 const saved=await savedProgress(page);expect(saved.adventure!.stageReviews![id].items[item.key].correct).toBe(0);expect(saved.adventure!.earned).toBe(15);
});
