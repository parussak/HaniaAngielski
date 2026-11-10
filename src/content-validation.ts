import { normalizeAnswer } from './answers.ts';
import type { Exercise,Module,Word } from './core.ts';
import { compareModules, sameCourse, translationPrompt } from './learning/scope.ts';
import type { Course } from './materials/model.ts';
import { compileVocabulary } from './materials/vocabulary.ts';
import { languageCode } from './materials/validation.ts';
import { wordExplanation } from './materials/presentation.ts';

// Pytania słownikowe wskazują słówka, zamiast dublować ich tekst i odpowiedzi.
export function assembleModule(metadata: any, inputWords: unknown, quiz: any, exercises: any, grammar: any, dialogues: any = [], course?: Course) {
  if (!metadata || typeof metadata !== 'object' || !Array.isArray(quiz) || !Array.isArray(exercises) || !Array.isArray(grammar)) throw new Error('Niepoprawne pliki modułu.');
  if(course){
    if(!course.moduleIds.includes(metadata.id)||metadata.courseId!==undefined&&metadata.courseId!==course.id||metadata.languageCode!==undefined&&metadata.languageCode!==course.targetLanguage||metadata.explanationLanguageCode!==undefined&&metadata.explanationLanguageCode!==course.explanationLanguage)throw new Error('Moduł nie pasuje do kursu lub języka.');
    metadata={...metadata,courseId:course.id,languageCode:course.targetLanguage,explanationLanguageCode:course.explanationLanguage,courseOrder:course.moduleIds.indexOf(metadata.id)+1,instructions:{...course.instructions}};
  }
  const {words,meanings}=compileVocabulary(inputWords,metadata,course);
  const vocabulary = new Map<string, Word>(words.map(w=>[w.id,w]));
  const compiled: Exercise[] = quiz.map((entry: any) => {
    if (!entry || typeof entry.id!=='string' || typeof entry.wordId!=='string' || !Array.isArray(entry.distractorIds) || entry.distractorIds.length<1 || !entry.distractorIds.every((id: unknown)=>typeof id==='string') || (entry.prompt!==undefined && typeof entry.prompt!=='string') || (entry.explanation!==undefined && typeof entry.explanation!=='string')) throw new Error('Niepoprawny wpis w quiz.json.');
    const word = vocabulary.get(entry.wordId);
    const distractors: (Word | undefined)[] = entry.distractorIds.map((id: string)=>vocabulary.get(id));
    if (!word || distractors.some(w=>!w)) throw new Error(`Quiz ${entry.id}: brak wskazanego słówka.`);
    const options=distractors.map(w=>w!.back);
    options.unshift(word.back);
    return { illustration:word.illustration, id:entry.id, wordId:word.id, rev:entry.rev??word.rev??1, kind:'vocabulary', prompt:entry.prompt ?? `${translationPrompt(metadata)}: ${word.front}`, answers:word.answers ?? [word.back], options, explanation:entry.explanation ?? wordExplanation(metadata,word), requires:[metadata.id], caseSensitive:false, source:word.source };
  });
  if(!Array.isArray(dialogues))throw new Error('Niepoprawny plik rozmówek.');
  return {...metadata, words, meanings, exercises:[...compiled,...exercises,...dialogues], grammar};
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
    if(m.journeyPath!==undefined && (typeof m.journeyPath!=='string'||!/^([a-z0-9-]+)\/sciezka\.json$/.test(m.journeyPath)))return fail('niepoprawna ścieżka mapy modułu.');
    if(m.courseId!==undefined && (typeof m.courseId!=='string'||!/^[a-z0-9-]+$/.test(m.courseId)))return fail('niepoprawny identyfikator kursu.');
    if(m.languageCode!==undefined && !languageCode(m.languageCode))return fail('niepoprawny kod języka.');
    if(m.explanationLanguageCode!==undefined&&!languageCode(m.explanationLanguageCode))return fail('niepoprawny język objaśnień.');
    if(m.courseOrder!==undefined&&(!Number.isSafeInteger(m.courseOrder)||(m.courseOrder as number)<1))return fail('niepoprawna kolejność w kursie.');
    if(m.instructions!==undefined&&(!obj(m.instructions)||!text(m.instructions.translationPrompt)))return fail('niepoprawne polecenia kursu.');
    if(obj(m.instructions)&&m.instructions.wordExplanationTemplate!==undefined&&!text(m.instructions.wordExplanationTemplate))return fail('niepoprawny wzór objaśnienia.');
    if(m.journeyPaths!==undefined && (!Array.isArray(m.journeyPaths)||m.journeyPaths.length<1||m.journeyPaths.length>3||new Set(m.journeyPaths).size!==m.journeyPaths.length||!m.journeyPaths.every(path=>typeof path==='string'&&/^[a-z0-9-]+\/[a-z0-9-]+\.json$/.test(path))||m.journeyPath!==undefined))return fail('niepoprawna lista map modułu.');
    if(m.level!==undefined && !['A1','A2','B1','B2','C1','C2'].includes(m.level as string))return fail('niepoprawny poziom modułu.');
    if (!Array.isArray(m.words) || !m.words.length || !m.words.every(w=>obj(w) && text(w.id) && text(w.front) && text(w.back) && text(w.source) && (w.answers===undefined || texts(w.answers)))) return fail(`sprawdź slownictwo.json (${m.id}).`);
    if(m.basicFlashcardIds!==undefined && (!texts(m.basicFlashcardIds)||new Set(m.basicFlashcardIds).size!==m.basicFlashcardIds.length||!m.basicFlashcardIds.every(id=>(m.words as Word[]).some(w=>w.id===id))))return fail(`sprawdź listę podstawowych fiszek (${m.id}).`);
    if (!Array.isArray(m.grammar) || !m.grammar.every(r=>obj(r) && text(r.id) && text(r.title) && text(r.explanation) && texts(r.examples) && text(r.source))) return fail(`sprawdź gramatyka.json (${m.id}).`);
    if (!Array.isArray(m.exercises) || !m.exercises.length) return fail(`brak zadań (${m.id}).`);
    for (const q of m.exercises) {
      if (!obj(q) || !text(q.id) || !['grammar','vocabulary','dialogue'].includes(q.kind as string) || !text(q.prompt) || !texts(q.answers) || !texts(q.options) || q.options.length<2 || new Set(q.options).size!==q.options.length || !text(q.explanation) || !texts(q.requires) || !q.requires.includes(m.id as string) || typeof q.caseSensitive!=='boolean' || !text(q.source)) return fail(`niepoprawne zadanie (${m.id}/${q?.id ?? '?'}).`);
      if(q.kind==='dialogue' && (!Array.isArray(q.dialogue) || q.dialogue.length<2 || q.dialogue.length>6 || !q.dialogue.every(line=>obj(line)&&text(line.speaker)&&text(line.text)&&line.speaker.length<=40&&line.text.length<=300) || q.dialogue.reduce((n,line)=>n+(line.text.match(/___/g)?.length??0),0)!==1))return fail(`rozmówka wymaga krótkiego dialogu z jedną luką (${q.id}).`);
      if(q.dialogue!==undefined && q.kind!=='dialogue')return fail(`dialog jest dozwolony tylko w rozmówkach (${q.id}).`);
      const normalized = (s: string) => normalizeAnswer(s,q.caseSensitive as boolean);
      if (q.options.filter(o=>(q.answers as string[]).some(a=>normalized(a)===normalized(o))).length !== 1) return fail(`zadanie musi mieć dokładnie jeden poprawny wariant wyboru (${q.id}).`);
      if (q.responseType !== undefined && q.responseType !== 'choice') return fail(`niepoprawny sposób odpowiedzi (${q.id}).`);
      if (q.ruleId !== undefined && !m.grammar.some(r=>r.id===q.ruleId)) return fail(`brak reguły dla ${q.id}.`);
    }
    unique(m.words,`${m.id}/słówka`); unique(m.exercises,`${m.id}/zadania`); unique(m.grammar,`${m.id}/gramatyka`);
    for(const word of m.words)if(word.answers && new Set(word.answers.map((a: string)=>normalizeAnswer(a))).size!==word.answers.length)return fail(`powtórzona odpowiedź: ${word.id}.`);
    for(const element of [...m.words,...m.exercises]){
      if(element.illustration && element.illustration.scene!==undefined && typeof element.illustration.scene!=='boolean')return fail(`niepoprawny typ scenki ${element.id}.`);
      if(element.illustration!==undefined && (!obj(element.illustration) || !((text(element.illustration.symbol) && element.illustration.symbol.length<=24 && element.illustration.src===undefined) || (text(element.illustration.src) && /^illustrations\/[a-z0-9-]+\.svg$/.test(element.illustration.src) && element.illustration.symbol===undefined)) || !text(element.illustration.caption)))return fail(`niepoprawna ilustracja ${element.id}.`);
    }
    for(const element of [...m.words,...m.exercises])if(element.rev!==undefined && (!Number.isSafeInteger(element.rev)||element.rev<1))return fail(`niepoprawna rewizja ${element.id}.`);
  }
  const modules = input as Module[]; unique(modules,'moduły');
  for(const m of modules) for(const q of m.exercises) for(const required of q.requires) {
    const dependency = modules.find(x=>x.id===required);
    if (!dependency || !sameCourse(dependency,m) || compareModules(dependency,m)>0) fail(`niedostępny, obcy lub późniejszy moduł w ${q.id}.`);
  }
  return structuredClone(modules).sort(compareModules);
}
