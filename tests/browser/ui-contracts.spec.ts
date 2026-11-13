import {resumeStudy} from './helpers.ts';
import {test,expect} from './fixtures.ts';
import {openBackup,openModule} from './navigation.ts';
import {foodModules as modules} from '../materials.ts';
import {backup,emptyProgress,makeSession,keyFor} from '../../src/core.ts';

test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});

test('strona ładuje lokalną ikonę, manifest i systemową czcionkę',async({page})=>{
 const externalFonts:string[]=[];
 page.on('request',request=>{if(/fonts\.(googleapis|gstatic)\.com/.test(request.url()))externalFonts.push(request.url());});
 await page.goto('./');await expect(page.locator('.home-hero')).toBeVisible();
 for(const rel of ['icon','manifest']){
  const href=await page.locator(`head link[rel="${rel}"]`).getAttribute('href');
  expect(href).toBeTruthy();const url=new URL(href!,page.url());
  expect(url.origin).toBe(new URL(page.url()).origin);
  const response=await page.request.get(url.href);expect(response.ok()).toBeTruthy();
  if(rel==='manifest')expect((await response.json()).display).toBe('standalone');
 }
 expect(await page.locator('body').evaluate(el=>getComputedStyle(el).fontFamily)).toContain('system-ui');
 expect(externalFonts).toEqual([]);
});

test('ustawienia, pole odpowiedzi, źródło i podsumowanie poprawki są dostępne w interfejsie',async({page})=>{
 const module=modules[0],q=module.exercises.find(q=>q.id==='g-there-milk')!;
 await page.goto('./');await openModule(page);
 await expect(page.getByText('Trochę wybieram, trochę wpisuję',{exact:true})).toBeVisible();
 const p=emptyProgress();p.active=makeSession(modules,module,'grammar','text',false,p);
 p.active.items=[{key:keyFor(module,'exercise',q.id),moduleId:module.id,id:q.id,type:'exercise',version:q.rev??1,input:'text'}];
 await openBackup(page);
 await page.locator('#import-file').setInputFiles({name:'ui.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(p)))});
 await page.getByRole('button',{name:'Zastąp postępy',exact:true}).click();
 await page.getByRole('button',{name:'Moja nauka',exact:true}).click();
 await resumeStudy(page);
 const answer=page.getByRole('textbox',{name:'Twoja odpowiedź',exact:true});
 await expect(answer).toHaveAttribute('autocorrect','off');await expect(answer).toHaveAttribute('enterkeyhint','done');
 await expect(answer).toHaveAttribute('autocapitalize','off');await expect(answer).toHaveAttribute('spellcheck','false');
 await expect(page.getByRole('button',{name:/Sprawdź/}).locator('svg')).toHaveAttribute('aria-hidden','true');
 await answer.fill('are');await page.getByRole('button',{name:/Sprawdź/}).click();
 await expect(page.locator('.source-reference')).toHaveText(`Źródło: ${q.source}`);
 await page.getByRole('button',{name:'Spróbuję jeszcze raz',exact:true}).click();
 await answer.fill(q.answers[0]);await page.getByRole('button',{name:/Sprawdź/}).click();
 await page.getByRole('button',{name:/^Dalej/}).click();
 await expect(page.locator('.rating-value')).toHaveText('0 / 3 łapki');
});
