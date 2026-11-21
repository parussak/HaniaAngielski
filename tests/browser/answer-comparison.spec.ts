import {resumeStudy} from './helpers.ts';
import {openBackup} from './navigation.ts';
import {test,expect} from './fixtures.ts';
import {foodModules as modules} from '../materials.ts';
import {backup,emptyProgress,isCorrect,makeSession,questionFor,type Mode} from '../../src/core.ts';

test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});

for(const [mode,input] of [['flashcards-basic','text'],['flashcards','choice'],['quiz','choice'],['grammar','text'],['review','choice']] as const){
  test(`${mode}: pokazuje udzieloną i poprawną odpowiedź bez wyróżniania różnic`,async({page})=>{
    const p=emptyProgress(),m=modules[0];p.active=makeSession(modules,m,mode as Mode,input,false,p);
    const type=mode.startsWith('flashcards')?'word':'exercise';
    const id=type==='word'?'apple':'g-container-water';
    const displayed=type==='word'?'an apple':'bottle';
    p.active.items=[{key:`${m.id}@1:${type}:${id}`,moduleId:m.id,version:1,type,id,input}];
    await page.goto('./');
    await expect(page.locator('.home-hero')).toBeVisible();
    await openBackup(page);
    await page.locator('#import-file').setInputFiles({name:'session.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(p)))});
    await page.getByRole('button',{name:'Zastąp postępy',exact:true}).tap();
    await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();await resumeStudy(page);
    let given='';
    if(input==='text'||mode==='review'){
      given=type==='word'?'aple':'botle';await page.getByRole('textbox').fill(given);await page.getByRole('button',{name:/Sprawdź/}).tap();
    }else{
      const options=page.locator('.option');
      await expect(options.first()).toBeVisible();
      // Options show full forms ("an apple"), so the wrong one is chosen by grading, not by comparing with "apple".
      const q=questionFor(modules,p.active.items[0]);
      for(const option of await options.all()){const answer=(await option.getAttribute('data-answer'))!;if(!isCorrect(q,answer)){given=answer;await option.tap();break;}}
      expect(given).not.toBe('');
    }
    await expect(page.locator('.given-answer p')).toHaveText(given);
    await expect(page.locator('.expected-answer p')).toHaveText(displayed);
    await expect(page.locator('.answer-comparison mark')).toHaveCount(0);
    await page.reload();await resumeStudy(page);
    await expect(page.locator('.given-answer p')).toHaveText(given);
    if(mode==='grammar'){
      await page.getByRole('button',{name:'Spróbuję jeszcze raz'}).tap();
      const second='<img src=x onerror=alert(1)>';
      await page.getByRole('textbox').fill(second);await page.getByRole('button',{name:/Sprawdź/}).tap();
      await expect(page.locator('.given-answer p')).toHaveText(second);
      await expect(page.locator('.given-answer img')).toHaveCount(0);
      await page.reload();await resumeStudy(page);
      await expect(page.locator('.given-answer p')).toHaveText(second);
      await page.screenshot({path:'test-results/answer-comparison-mobile.png'});
    }
    const next=await page.getByRole('button',{name:'Dalej',exact:false}).boundingBox();
    const nav=await page.locator('.sidebar nav').boundingBox();expect(next!.y+next!.height).toBeLessThanOrEqual(nav!.y);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  });
}
