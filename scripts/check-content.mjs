import { readLibrary } from '../src/materials/library.ts';
import { readFileSync, existsSync } from 'node:fs';
import { journeyKey, validateJourney } from '../src/adventure.ts';
import { validateTrainingPlan } from '../src/learning/training.ts';
const {courses,modules}=await readLibrary(async path=>JSON.parse(readFileSync(new URL(`../public/content/${path}`,import.meta.url),'utf8')));
const journeys=[];
for(const module of modules){
  const paths=module.journeyPaths??(module.journeyPath?[module.journeyPath]:module.id==='unit-2-food'?['02-food/sciezka.json']:[]);
  for(const path of paths)journeys.push(validateJourney(JSON.parse(readFileSync(new URL(`../public/content/${path}`,import.meta.url),'utf8')),module));
  for(const element of [...module.words,...module.exercises]){
    if(element.illustration?.src&&!existsSync(new URL(`../public/${element.illustration.src}`,import.meta.url)))throw new Error(`Brak ilustracji: ${module.id}/${element.id}.`);
  }
}
if(new Set(journeys.map(journeyKey)).size!==journeys.length)throw new Error('Powtórzony identyfikator mapy.');
validateTrainingPlan(modules,journeys);
for(const journey of journeys)for(const stage of journey.stages){if(!existsSync(new URL(`../public/${stage.illustration}`,import.meta.url)))throw new Error(`Brak ilustracji etapu ${stage.id}.`);}
for (const m of modules) console.log(`${m.name}: ${m.words.length} fiszek, ${m.exercises.length} zadań, ${m.grammar.length} zasad — poprawne pliki.`);
console.log(`${journeys.length} map: poprawne odwołania do materiałów, treningi i ilustracje.`);
console.log(`${courses.length} kursów: poprawne języki, podręczniki i przypisania modułów.`);
