import {openBackup} from './navigation.ts';
import {test,expect} from './fixtures.ts';
import {foodModules as modules} from '../materials.ts';
import {backup,emptyProgress,makeSession,type Mode} from '../../src/core.ts';

test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});

for(const [mode,input] of [['flashcards-basic','text'],['flashcards','choice'],['quiz','choice'],['grammar','text'],['review','choice']] as const){
  test(`${mode}: pokazuje udzieloną i poprawną odpowiedź bez wyróżniania różnic`,async({page})=>{
    const p=emptyProgress(),m=modules[0];p.active=makeSession(modules,m,mode as Mode,input,false,p);
    const type=mode.startsWith('flashcards')?'word':'exercise';
    const id=type==='word'?'apple':'g-container-water';
    const correct=type==='word'?'apple':'bottle';const displayed=type==='word'?'an apple':'bottle';
    p.active.items=[{key:`${m.id}@1:${type}:${id}`,moduleId:m.id,version:1,type,id,input}];
    await page.goto('./');
    await expect(page.locator('.home-hero')).toBeVisible();
    await openBackup(page);
    await page.locator('#import-file').setInputFiles({name:'session.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(p)))});
    await page.getByRole('button',{name:'Zastąp postępy',exact:true}).tap();
    await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();await page.getByRole('button',{name:'Kontynuuj naukę →',exact:true}).tap();
    let given='';
    if(input==='text'||mode==='review'){
      given=type==='word'?'aple':'botle';await page.getByRole('textbox').fill(given);await page.getByRole('button',{name:/Sprawdź/}).tap();
    }else{
      const options=page.locator('.option');
      await expect(options.first()).toBeVisible();
      for(const option of await options.all())if(await option.getAttribute('data-answer')!==correct){given=(await option.getAttribute('data-answer'))!;await option.tap();break;}
    }
    await expect(page.locator('.given-answer p')).toHaveText(given);
    await expect(page.locator('.expected-answer p')).toHaveText(displayed);
    await expect(page.locator('.answer-comparison mark')).toHaveCount(0);
    await page.reload();await page.getByRole('button',{name:'Kontynuuj naukę →',exact:true}).tap();
    await expect(page.locator('.given-answer p')).toHaveText(given);
    if(mode==='grammar'){
      await page.getByRole('button',{name:'Spróbuję jeszcze raz'}).tap();
      const second='<img src=x onerror=alert(1)>';
      await page.getByRole('textbox').fill(second);await page.getByRole('button',{name:/Sprawdź/}).tap();
      await expect(page.locator('.given-answer p')).toHaveText(second);
      await expect(page.locator('.given-answer img')).toHaveCount(0);
      await page.reload();await page.getByRole('button',{name:'Kontynuuj naukę →',exact:true}).tap();
      await expect(page.locator('.given-answer p')).toHaveText(second);
      await page.screenshot({path:'test-results/answer-comparison-mobile.png'});
    }
    const next=await page.getByRole('button',{name:'Dalej',exact:false}).boundingBox();
    const nav=await page.locator('.sidebar nav').boundingBox();expect(next!.y+next!.height).toBeLessThanOrEqual(nav!.y);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  });
}
