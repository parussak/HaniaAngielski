import {openBackup} from './navigation.ts';
import {test,expect} from './fixtures.ts';
import {foodModules as modules} from '../materials.ts';
import {backup,emptyProgress,makeSession,keyFor} from '../../src/core.ts';

test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});

test('starsza powtórka z wpisywaniem pokazuje wybór, gdy polecenie podaje warianty',async({page})=>{
  const p=emptyProgress(),m=modules[0],id='g-count-milk';
  p.difficult=[keyFor(m,'exercise',id)];p.active=makeSession(modules,m,'review','text',false,p);
  p.active.items[0].input='text';
  await page.goto('./');await openBackup(page);
  await page.locator('#import-file').setInputFiles({name:'old-review.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup(p)))});
  await page.getByRole('button',{name:'Zastąp postępy',exact:true}).tap();
  await page.getByRole('button',{name:'Moja nauka',exact:true}).tap();await page.getByRole('button',{name:'Kontynuuj naukę →',exact:true}).tap();
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(page.locator('.option')).toHaveCount(2);
  await page.getByRole('button',{name:'policzalny',exact:true}).tap();
  await expect(page.locator('.given-answer p')).toHaveText('policzalny');
  await page.reload();await page.getByRole('button',{name:'Kontynuuj naukę →',exact:true}).tap();
  await page.getByRole('button',{name:'Spróbuję jeszcze raz'}).tap();
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await page.getByRole('button',{name:'niepoliczalny',exact:true}).tap();
  await expect(page.locator('.feedback.correct')).toBeVisible();
});
