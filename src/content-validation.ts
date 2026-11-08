import type { Module, Word, Exercise } from './core.ts';

// Pytania słownikowe wskazują słówka, zamiast dublować ich tekst i odpowiedzi.
export function assembleModule(metadata: any, words: any, quiz: any, exercises: any, grammar: any) {
  if (!metadata || typeof metadata !== 'object' || !Array.isArray(words) || !Array.isArray(quiz) || !Array.isArray(exercises) || !Array.isArray(grammar)) throw new Error('Niepoprawne pliki modułu.');
  if (!words.every(w=>w && typeof w.id==='string' && typeof w.front==='string' && typeof w.back==='string')) throw new Error('Niepoprawne słówko w slownictwo.json.');
  const vocabulary = new Map<string, Word>(words.map(w=>[w.id,w]));
  const compiled: Exercise[] = quiz.map((entry: any) => {
    if (!entry || typeof entry.id!=='string' || typeof entry.wordId!=='string' || !Array.isArray(entry.distractorIds) || entry.distractorIds.length<1 || !entry.distractorIds.every((id: unknown)=>typeof id==='string') || !Number.isInteger(entry.correctPosition) || entry.correctPosition<0 || entry.correctPosition>entry.distractorIds.length || (entry.prompt!==undefined && typeof entry.prompt!=='string') || (entry.explanation!==undefined && typeof entry.explanation!=='string')) throw new Error('Niepoprawny wpis w quiz.json.');
    const word = vocabulary.get(entry.wordId);
    const distractors: (Word | undefined)[] = entry.distractorIds.map((id: string)=>vocabulary.get(id));
    if (!word || distractors.some(w=>!w)) throw new Error(`Quiz ${entry.id}: brak wskazanego słówka.`);
    const options=distractors.map(w=>w!.back);
    options.splice(entry.correctPosition,0,word.back);
    return { id:entry.id, kind:'vocabulary', prompt:entry.prompt ?? `Podaj po angielsku: ${word.front}`, answers:word.answers ?? [word.back], options, explanation:entry.explanation ?? `„${word.back}” oznacza „${word.front}”.`, requires:[metadata.id], caseSensitive:false, source:word.source };
  });
  return {...metadata, words, exercises:[...compiled,...exercises], grammar};
}

export function validateModules(input: unknown): Module[] {
  const fail = (message: string): never => { throw new Error(`Błąd materiałów: ${message}`); };
  const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
  const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
  const texts = (v: unknown): v is string[] => Array.isArray(v) && v.length > 0 && v.every(text);
  const unique = (items: {id: string}[], scope: string) => { if (new Set(items.map(i=>i.id)).size !== items.length) fail(`powtórzony identyfikator (${scope}).`); };
  if (!Array.isArray(input) || !input.length) return fail('katalog modułów jest pusty.');
  for (const m of input) {
    if (!obj(m) || !['id','name','subtitle','language','source','label','cover'].every(k=>text(m[k])) || !Number.isSafeInteger(m.version) || (m.version as number)<1 || !Number.isSafeInteger(m.order) || (m.order as number)<1 || !texts(m.topics)) return fail('niepoprawny opis modułu.');
    if (!Array.isArray(m.words) || !m.words.length || !m.words.every(w=>obj(w) && text(w.id) && text(w.front) && text(w.back) && text(w.source) && (w.answers===undefined || texts(w.answers)))) return fail(`sprawdź slownictwo.json (${m.id}).`);
    if (!Array.isArray(m.grammar) || !m.grammar.every(r=>obj(r) && text(r.id) && text(r.title) && text(r.explanation) && texts(r.examples) && text(r.source))) return fail(`sprawdź gramatyka.json (${m.id}).`);
    if (!Array.isArray(m.exercises) || !m.exercises.length) return fail(`brak zadań (${m.id}).`);
    for (const q of m.exercises) {
      if (!obj(q) || !text(q.id) || !['grammar','vocabulary'].includes(q.kind as string) || !text(q.prompt) || !texts(q.answers) || !texts(q.options) || q.options.length<2 || new Set(q.options).size!==q.options.length || !text(q.explanation) || !texts(q.requires) || !q.requires.includes(m.id as string) || typeof q.caseSensitive!=='boolean' || !text(q.source)) return fail(`niepoprawne zadanie (${m.id}/${q?.id ?? '?'}).`);
      const normalized = (s: string) => q.caseSensitive ? s.trim() : s.trim().toLocaleLowerCase();
      if (q.options.filter(o=>(q.answers as string[]).some(a=>normalized(a)===normalized(o))).length !== 1) return fail(`zadanie musi mieć dokładnie jeden poprawny wariant wyboru (${q.id}).`);
      if (q.ruleId !== undefined && !m.grammar.some(r=>r.id===q.ruleId)) return fail(`brak reguły dla ${q.id}.`);
    }
    unique(m.words,`${m.id}/słówka`); unique(m.exercises,`${m.id}/zadania`); unique(m.grammar,`${m.id}/gramatyka`);
  }
  const modules = input as Module[]; unique(modules,'moduły');
  for(const m of modules) for(const q of m.exercises) for(const required of q.requires) {
    const dependency = modules.find(x=>x.id===required);
    if (!dependency || dependency.order>m.order) fail(`niedostępny lub późniejszy moduł w ${q.id}.`);
  }
  return structuredClone(modules).sort((a,b)=>a.order-b.order);
}
