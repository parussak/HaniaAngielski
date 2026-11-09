import {type Page} from '@playwright/test';
export async function openModule(page:Page){
  await page.getByRole('button',{name:/Przejdź do modułów/}).click();
  await page.getByRole('button',{name:'Otwórz moduł Food — Fun with food'}).click();
}
export async function openMap(page:Page){
  await page.getByRole('button',{name:/Wybierz przygodę/}).click();
  await page.getByRole('button',{name:'Otwórz mapę Przygotowania do kociego pikniku',exact:true}).click();
}
