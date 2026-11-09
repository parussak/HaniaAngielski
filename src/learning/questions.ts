import { normalizeAnswer } from '../answers.ts';
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
export function eligibleModules(modules: Module[], selected: Module, previous: boolean) {
    return modules.filter(m => m.id === selected.id || (previous && m.order < selected.order));
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
        return data as Exercise;
    const word = data as Word;
    const module = modules.find(m => m.id === item.moduleId)!;
    const linked = module.exercises.find(q => q.kind === 'vocabulary' && q.wordId === word.id);
    const answers = word.answers ?? [word.back];
    const options = linked?.options ?? [word.back, ...module.words.filter(w => !answers.some(a => normalizeAnswer(a) === normalizeAnswer(w.back))).map(w => w.back).filter((v, i, a) => a.indexOf(v) === i).slice(0, 2)];
    return { illustration: word.illustration, id: word.id, kind: 'vocabulary', prompt: word.front, answers, options, explanation: linked?.explanation ?? '„' + word.back + '” oznacza „' + word.front + '”.', requires: [module.id], caseSensitive: false, source: word.source };
}
export function sessionCompatible(modules: Module[], s: Session) { return s.items.every(item => !!resolveItem(modules, item)); }
export function isCorrect(exercise: Exercise, answer: string) {
    return exercise.answers.some(a => normalizeAnswer(a, exercise.caseSensitive) === normalizeAnswer(answer, exercise.caseSensitive));
}
