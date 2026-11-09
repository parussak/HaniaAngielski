import { readFileSync } from 'node:fs';
import { assembleModule, validateModules } from '../src/content-validation.ts';
const base = new URL('../public/content/', import.meta.url);
const read = (path: string) => JSON.parse(readFileSync(new URL(path,base),'utf8'));
const catalog=read('katalog.json');
export const modules=validateModules(catalog.modules.map((path: string)=>assembleModule(
  read(`${path}/modul.json`), read(`${path}/slownictwo.json`), read(`${path}/quiz.json`), read(`${path}/cwiczenia.json`), read(`${path}/gramatyka.json`), read(`${path}/modul.json`).dialoguesFile?read(`${path}/rozmowki.json`):[]
)));
