/** Powłoka sieciowa: pobiera mapy modułów z `content/`. Wybór i walidacja map są w learning/journey-validation.ts. */
import {readJourneys} from '../learning/journey-validation.ts';
import type {Module} from '../learning/model.ts';
export async function loadJourneys(modules:Module[]){
  return readJourneys(modules,async path=>{
    const r=await fetch(new URL(`content/${path}`,document.baseURI),{cache:'no-cache'});
    if(!r.ok)throw new Error('Nie można pobrać kociej mapy.');return r.json();
  });
}
