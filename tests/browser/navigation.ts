import {type Page} from '@playwright/test';
export async function openBackup(page:Page){
  await page.locator('.sidebar nav').getByRole('button',{name:'Konto',exact:true}).click();
  await page.getByRole('button',{name:'Kopia postępów',exact:true}).click();
}
export async function openModule(page:Page){
  await page.getByRole('button',{name:/Przejdź do modułów/}).click();
  await page.getByRole('button',{name:'Otwórz moduł Food — Fun with food'}).click();
}
export async function openMap(page:Page){
  await page.getByRole('button',{name:/Wybierz przygodę/}).click();
  await page.getByRole('button',{name:'Otwórz mapę Przygotowania do kociego pikniku',exact:true}).click();
}
export async function openWarmup(page:Page){
 if(await page.locator('h1').filter({hasText:/^Kocia rozgrzewka$/}).count()&&await page.locator('button[data-action="extra-training"]').count())return;
 if(!await page.locator('button[data-action="warmup"]').count())await page.getByRole('button',{name:'Moja nauka',exact:true}).click();
 await page.locator('button[data-action="warmup"]').first().click();
}
export async function openStageReview(page:Page,stage='food'){
 await openWarmup(page);await page.locator(`button[data-action="stage-review"][data-id="${stage}"]`).first().click();
}
export async function openGeneralReview(page:Page){
 await openWarmup(page);const details=page.locator('details').filter({hasText:'Inne zadania do poćwiczenia'});if(await details.getAttribute('open')===null)await details.locator('summary').click();await page.locator('button[data-mode="review"]').first().click();
}
export async function openAdditionalWarmup(page:Page){await openWarmup(page);await page.getByRole('button',{name:'Zacznij rozgrzewkę →',exact:true}).click();}
