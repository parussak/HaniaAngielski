import {openMap} from './navigation.ts';
import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {modules} from '../materials.ts';
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
  await page.goto('./');await page.locator('.sidebar').getByRole('button',{name:'Kopia postępów',exact:true}).tap();
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
test('stare błędy, kafelki każdego etapu, trzy tury, 100% i jednorazowa nagroda 3 ★',async({page})=>{
  await importProgress(page,oldFixture());await expect(page.locator('.stage-review-step')).toHaveCount(7);
  let node=await openFirstStage(page);await expect(node.locator('.stage-retention-text')).toContainText('1 ćwiczenie do utrwalenia');await expect(node.locator('.stage-review-step')).toContainText('1 słówko');
  await expect(page.locator('.star-wallet')).toContainText('15');await expect(page.locator('.retention-overview')).toContainText('1 ćwiczenie do utrwalenia');
  await expect(page.locator('.journey-stage').nth(1).locator('.lesson-step').first()).toBeEnabled();
  await page.screenshot({path:'test-results/stage-review-map-mobile.png',fullPage:true});
  for(let i=0;i<3;i++){
    node=await openFirstStage(page);await node.locator('.stage-review-step').tap();await expect(page.locator('.review-meter')).toContainText(`${i}/3`);
    if(i===0){
      await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();await openMap(page);node=await openFirstStage(page);await node.locator('.stage-review-step').tap();await expect(page.locator('.review-meter')).toContainText('0/3');
      await page.reload();await page.getByRole('button',{name:'Kontynuuj naukę →',exact:true}).tap();await expect(page.locator('.review-meter')).toContainText('0/3');
    }
    await correct(page);await expect(page.locator('.review-meter')).toContainText(`${i}/3`);
    await page.getByRole('button',{name:/Dalej/}).tap();await expect(page.locator('.review-result')).toContainText(i===2?'0 ćwiczeń do utrwalenia':'1 ćwiczenie do utrwalenia');
    if(i<2)await expect(page.locator('.lesson-reward')).toContainText('Tura zapisana');else await expect(page.locator('.lesson-reward')).toContainText('+3');
    await page.getByRole('button',{name:'Wróć na mapę',exact:true}).tap();await expect(page.locator('.star-wallet')).toContainText(i===2?'18':'15');
  }
  node=await openFirstStage(page);await expect(node.locator('.stage-review-step')).toBeDisabled();await expect(node.locator('.stage-retention-text')).toContainText('0 ćwiczeń do utrwalenia');
  await page.screenshot({path:'test-results/stage-review-completed-mobile.png',fullPage:true});
  await page.reload();await openMap(page);await expect(page.locator('.star-wallet')).toContainText('18');
  await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();await page.getByRole('button',{name:/Wybierz przygodę/}).tap();await expect(page.locator('.adventure-invite .retention-overview').first()).toContainText('0 ćwiczeń do utrwalenia');
});
test('nowy błąd zeruje serię, poprawki nie zwiększają jej, mobilne przyciski pozostają nad paskiem',async({page})=>{
  const p=oldFixture(),item={key:keyFor(modules[0],'word','apple'),moduleId:j.moduleId,version:1,type:'word' as const,id:'apple',input:'text' as const};
  p.adventure!.reviewSchema=1;p.adventure!.reviewArchiveHead=null;p.adventure!.stageReviews={[id]:{round:3,items:{[item.key]:{item,correct:2,due:6}}}};
  await importProgress(page,p);const node=await openFirstStage(page);await node.locator('.stage-review-step').tap();await expect(page.locator('.review-meter')).toContainText('2/3');
  await expect(page.locator('.option')).toHaveCount(0);await page.getByRole('textbox').fill('aple');await page.getByRole('button',{name:/Sprawdź/}).tap();await expect(page.locator('.feedback.incorrect')).toBeVisible();await expect(page.locator('.review-meter')).toContainText('0/3');
  for(const viewport of [{width:320,height:640},{width:844,height:390}]){await page.setViewportSize(viewport);const nav=await page.locator('.sidebar nav').boundingBox(),button=await page.getByRole('button',{name:/Dalej/}).boundingBox();expect(button!.y+button!.height).toBeLessThanOrEqual(nav!.y);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();}
  await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Spróbuję jeszcze raz'}).tap();await correct(page);await page.getByRole('button',{name:/Dalej/}).tap();await expect(page.locator('.question')).toBeVisible();await correct(page);await page.getByRole('button',{name:/Dalej/}).tap();
  await expect(page.locator('.review-result')).toContainText('1 słówko');await expect(page.locator('.lesson-reward')).toContainText('Tura zapisana');await page.screenshot({path:'test-results/stage-review-result-mobile.png'});
  await page.getByRole('button',{name:'Wróć na mapę',exact:true}).tap();await expect(page.locator('.star-wallet')).toContainText('15');
});
