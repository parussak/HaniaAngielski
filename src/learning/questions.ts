import { normalizeAnswer } from '../answers.ts';
import { compareModules, courseKey, sameCourse } from './scope.ts';
import { wordExplanation } from '../materials/presentation.ts';
import { vocabularyAssessment,vocabularyFullAnswer } from './vocabulary-answer.ts';
import { type Exercise, type Item, type Mode, type Module, type Session, type Word } from './model.ts';
export function shuffle<T>(input: T[], random = Math.random) {
    const result = [...input];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
export function optionsFor(exercise: Exercise, session: Pick<Session, 'id' | 'index'>) {
    let seed = 2166136261;
    for (const ch of `${session.id}:${session.index}`)
        seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619) >>> 0;
    return shuffle(exercise.options, () => { seed = (seed + 0x6D2B79F5) >>> 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; });
}
export function requiresChoice(q: Exercise) {
    if (q.responseType === 'choice' || /[([][^)\]]*\s*\/\s*[^)\]]*[)\]]/.test(q.prompt))
        return true;
    // Explicit alternatives can also be written as prose, without brackets.
    // Match whole options so "policzalny" cannot match inside "niepoliczalny".
    const options = q.options.map(o => o.trim().normalize('NFC')).filter(Boolean).sort((a, b) => b.length - a.length)
        .map(o => o.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')).join('|');
    const alternatives = new RegExp(`(?:^|[^\\p{L}\\p{N}])(?:${options})\\s*(?:/|czy|lub|albo|or)\\s*(?:${options})(?=$|[^\\p{L}\\p{N}])`, 'iu');
    return alternatives.test(q.prompt.normalize('NFC')) || /\b(?:nie)?policzaln[yae]\s*(?:czy|lub|albo|\/)\s*(?:nie)?policzaln[yae]\b/iu.test(q.prompt);
}
export function inputFor(q: Exercise, preferred: Item['input'], mode?: Mode) {
    return requiresChoice(q) ? 'choice' : mode === 'review' ? 'text' : preferred;
}
export function answerHint(q:Exercise,input:Item['input']){
    const gap=q.prompt.includes('___')||q.dialogue?.some(line=>line.text.includes('___'));
    return input==='text'&&q.kind!=='vocabulary'&&gap?'Wpisz tylko brakujący fragment, bez przepisywania całego zdania.':null;
}
export function eligibleModules(modules: Module[], selected: Module, previous: boolean) {
    return modules.filter(m => sameCourse(m, selected) && (m.id === selected.id || (previous && compareModules(m, selected) < 0))).sort(compareModules);
}
export function resolveItem(modules: Module[], item: Item) {
    const m = modules.find(m => m.id === item.moduleId);
    const element = item.type === 'word' ? m?.words.find(w => w.id === item.id) : m?.exercises.find(e => e.id === item.id);
    return element && (element.rev ?? 1) === item.version ? element : undefined;
}
export function questionFor(modules: Module[], item: Item): Exercise {
    const data = resolveItem(modules, item);
    if (!data)
        throw new Error('Brak materiału do pytania.');
    if (item.type === 'exercise')
        return vocabularyOptions(modules,item,item.options ? { ...data as Exercise, options: [...item.options] } : data as Exercise);
    const word = data as Word;
    const module = modules.find(m => m.id === item.moduleId)!;
    const linked = module.exercises.find(q => q.kind === 'vocabulary' && q.wordId === word.id);
    const answers = word.answers ?? [word.back];
    const options = item.options ?? linked?.options ?? [word.back, ...module.words.filter(w => !answers.some(a => normalizeAnswer(a) === normalizeAnswer(w.back))).map(w => w.back).filter((v, i, a) => a.indexOf(v) === i).slice(0, 2)];
    return vocabularyOptions(modules,item,{ article:word.article, illustration: word.illustration, id: word.id, kind: 'vocabulary', prompt: word.front, answers, options, explanation: linked?.explanation ?? wordExplanation(module,word), requires: [module.id], caseSensitive: false, source: word.source });
}
/** Each vocabulary option uses its own authored article, never the question's distractor article. */
function vocabularyOptions(modules:Module[],item:Item,q:Exercise):Exercise{
    if(q.kind!=='vocabulary')return q;
    const source=modules.find(m=>m.id===item.moduleId)!;
    const words=[source,...modules.filter(m=>m!==source&&sameCourse(m,source))].flatMap(m=>m.words);
    const body=(s:string)=>normalizeAnswer(s).replace(/^(a|an)\s+/,'');
    return {...q,options:q.options.map(option=>{
        if(q.article&&q.answers.some(a=>body(a)===body(option)))return vocabularyFullAnswer({...q,answers:[option]});
        const word=words.find(w=>w.article&&[w.back,...w.answers??[]].some(a=>body(a)===body(option)));
        return word?.article?vocabularyFullAnswer({...q,article:word.article,answers:[option]}):option;
    })};
}
export function sessionCompatible(modules: Module[], s: Session) {
    const anchor = modules.find(m => m.id === s.moduleId);
    return !!anchor && (!s.scope || s.scope.courseId === courseKey(anchor)) && s.items.every(item => {
        const source = modules.find(m => m.id === item.moduleId);
        if (!source || !sameCourse(source, anchor) || !resolveItem(modules, item)) return false;
        if (item.options) { const q = questionFor(modules, item); return !!s.scope && q.kind === 'vocabulary' && item.options.filter(o => isCorrect(q, o)).length === 1; }
        return true;
    });
}
export function isCorrect(exercise: Exercise, answer: string) {
    const vocabulary=vocabularyAssessment(exercise,answer);if(vocabulary)return vocabulary.correct;
    return exercise.answers.some(a => normalizeAnswer(a, exercise.caseSensitive) === normalizeAnswer(answer, exercise.caseSensitive));
}
