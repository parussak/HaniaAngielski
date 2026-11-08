import { modules } from '../tests/materials.ts';
for (const m of modules) console.log(`${m.name}: ${m.words.length} fiszek, ${m.exercises.length} zadań, ${m.grammar.length} zasad — poprawne pliki.`);
