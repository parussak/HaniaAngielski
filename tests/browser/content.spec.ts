import {test,expect} from '@playwright/test';

test('zmiana plików treści działa bez zmian kodu, zasady pochodzą z JSON',async({page})=>{
  await page.route('**/content/02-food/modul.json',async route=>{
    const response=await route.fetch(); const data=await response.json();
    data.name='Food po edycji pliku'; await route.fulfill({json:data});
  });
  await page.goto('/');
  await expect(page.getByRole('button',{name:'Otwórz moduł Food po edycji pliku'})).toBeVisible();
  await expect(page.getByText('MATERIAŁ PRZYKŁADOWY')).toHaveCount(0);
  await page.getByRole('button',{name:'Otwórz moduł Food po edycji pliku'}).click();
  await expect(page.getByRole('heading',{name:'Przypomnij sobie zasady'})).toBeVisible();
  await page.getByText('How much czy how many?',{exact:true}).click();
  await expect(page.getByText('How many bottles of water are there?',{exact:true})).toBeVisible();
  await expect(page.locator('.grammar-guide details[open]')).toContainText('liczymy');
});
test('uszkodzony plik materiałów daje czytelny komunikat zamiast pustej strony',async({page})=>{
  await page.route('**/content/02-food/quiz.json',route=>route.fulfill({json:[{id:'broken',wordId:'missing',distractorIds:['apple'],correctPosition:0}]}));
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Nie możemy wczytać aplikacji'})).toBeVisible();
  await expect(page.getByText(/brak wskazanego słówka/)).toBeVisible();
});
