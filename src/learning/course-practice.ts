import { normalizeAnswer } from '../answers.ts';
import { knownMaterial } from './known-material.ts';
import { keyFor, type AnswerMode, type Exercise, type Item, type Module, type Progress, type Session } from './model.ts';
import { inputFor, isCorrect, questionFor, requiresChoice, shuffle } from './questions.ts';
import { compareModules, courseKey, sameCourse } from './scope.ts';

export type CoursePracticeMode = 'flashcards' | 'quiz' | 'grammar';
export const coursePracticeLabels: Record<CoursePracticeMode, string> = { flashcards: 'Fiszki z poznanego materiału', quiz: 'Quiz z poznanego materiału', grammar: 'Gramatyka z poznanego materiału' };

export function coursePracticePool(modules: Module[], anchor: Module, p: Progress, mode: CoursePracticeMode): Item[] {
    const available = modules.filter(m => sameCourse(m, anchor)).sort(compareModules), allowed = new Set(available.map(m => m.id));
    const known = knownMaterial(modules, anchor, p), result: Item[] = [];
    for (const m of available) {
        if (mode === 'flashcards') for (const w of m.words) {
            const key = keyFor(m, 'word', w.id);
            if (known.words.has(key)) result.push({ key, moduleId: m.id, version: w.rev ?? 1, type: 'word', id: w.id, input: 'text' });
        }
        if (mode !== 'flashcards') for (const q of m.exercises) {
            if (!q.requires.every(id => allowed.has(id))) continue;
            if (mode === 'grammar' ? q.kind !== 'grammar' : q.kind !== 'vocabulary') continue;
            const key = keyFor(m, 'exercise', q.id);
            if (!known.exercises.has(key) && !(mode === 'quiz' && q.wordId && known.words.has(keyFor(m, 'word', q.wordId)))) continue;
            result.push({ key, moduleId: m.id, version: q.rev ?? 1, type: 'exercise', id: q.id, input: 'text' });
        }
    }
    return result;
}

function knownOptions(q: Exercise, labels: string[]) {
    const correct = q.options.find(o => isCorrect(q, o)) ?? q.answers[0];
    const options = [correct], seen = new Set([normalizeAnswer(correct, q.caseSensitive)]);
    for (const value of [...q.options.filter(o => labels.includes(o)), ...labels]) {
        const normalized = normalizeAnswer(value, q.caseSensitive);
        if (seen.has(normalized) || isCorrect(q, value)) continue;
        seen.add(normalized); options.push(value);
        if (options.length === 4) break;
    }
    return options;
}

export function makeCoursePracticeSession(modules: Module[], anchor: Module, p: Progress, mode: CoursePracticeMode, answerMode: AnswerMode): Session | null {
    const pool = coursePracticePool(modules, anchor, p, mode);
    const difficult = new Set(p.difficult);
    const items = shuffle(pool).sort((a, b) => Number(difficult.has(b.key) || p.words[b.key] === 'review') - Number(difficult.has(a.key) || p.words[a.key] === 'review')).slice(0, 10);
    if (!items.length) return null;
    const known = knownMaterial(modules, anchor, p);
    const labels = modules.filter(m => sameCourse(m, anchor)).flatMap(m => m.words.filter(w => known.words.has(keyFor(m, 'word', w.id))).map(w => w.back));
    items.forEach((item, index) => {
        const q = questionFor(modules, item);
        item.input = inputFor(q, answerMode === 'mixed' ? (index % 2 ? 'text' : 'choice') : answerMode);
        if (q.kind === 'vocabulary' && !requiresChoice(q) && item.input === 'choice') {
            const options = knownOptions(q, labels);
            if (options.length < 2) item.input = 'text';
            else item.options = options;
        }
    });
    return { id: crypto.randomUUID(), moduleId: anchor.id, mode, scope: { kind: 'course', courseId: courseKey(anchor) }, answerMode, previous: true,
        startedAt: new Date().toISOString(), completedAt: null, items, index: 0, phase: 'question', lastCorrect: null, attempts: [], repeatKeys: [] };
}
