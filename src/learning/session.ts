import { isFlashcardMode, keyFor, type AnswerMode, type Exercise, type Item, type Mode, type Module, type Progress, type Session } from './model.ts';
import { eligibleModules, inputFor, isCorrect, questionFor, shuffle } from './questions.ts';
function remember(p: Progress, keys: string[]) {
    if (!keys.length) return;
    p.encountered = [...new Set([...(p.encountered ?? []), ...keys])];
}
export function replaceActive(p: Progress, session: Session) {
    remember(p, p.active?.attempts.map(a => a.key) ?? []);
    p.active = session;
}
export function makeSession(modules: Module[], selected: Module, mode: Mode, answerMode: AnswerMode, previous: boolean, progress: Progress): Session {
    const available = eligibleModules(modules, selected, previous);
    const allowed = new Set(available.map(m => m.id));
    const items: Item[] = [];
    for (const m of available) {
        if (isFlashcardMode(mode) || mode === 'review') {
            for (const w of m.words) {
                if (mode === 'flashcards-basic' && m.basicFlashcardIds && !m.basicFlashcardIds.includes(w.id))
                    continue;
                const key = keyFor(m, 'word', w.id);
                if (mode === 'review' && !progress.difficult.includes(key) && progress.words[key] !== 'review')
                    continue;
                if (isFlashcardMode(mode) && progress.words[key] === 'known')
                    continue;
                items.push({ key, moduleId: m.id, version: w.rev ?? 1, type: 'word', id: w.id, input: 'text' });
            }
        }
        if (!isFlashcardMode(mode)) {
            for (const e of m.exercises) {
                const key = keyFor(m, 'exercise', e.id);
                if (!e.requires.every(id => allowed.has(id)))
                    continue;
                if (mode === 'grammar' && e.kind !== 'grammar')
                    continue;
                if (mode === 'quiz' && e.kind !== 'vocabulary')
                    continue;
                if (mode === 'dialogue' && e.kind !== 'dialogue')
                    continue;
                if (mode === 'review' && !progress.difficult.includes(key))
                    continue;
                items.push({ key, moduleId: m.id, version: e.rev ?? 1, type: 'exercise', id: e.id, input: 'text' });
            }
        }
    }
    const seen = new Set([...Object.keys(progress.history?.items ?? {}), ...Object.keys(progress.words), ...progress.sessions.flatMap(s => s.attempts.map(a => a.key)), ...(progress.active?.attempts.map(a => a.key) ?? [])]);
    const priority = (item: Item) => progress.difficult.includes(item.key) || progress.words[item.key] === 'review' ? 0 : !seen.has(item.key) ? 1 : 2;
    const selectedItems = [0, 1, 2].flatMap(rank => shuffle(items.filter(i => priority(i) === rank))).slice(0, 10);
    let questionIndex = 0;
    for (const item of selectedItems) {
        item.input = inputFor(questionFor(modules, item), answerMode === 'mixed' ? (questionIndex++ % 2 ? 'text' : 'choice') : answerMode, mode);
    }
    return { id: crypto.randomUUID(), moduleId: selected.id, mode, answerMode: mode === 'review' ? 'text' : answerMode, previous, startedAt: new Date().toISOString(), completedAt: null, items: selectedItems, index: 0, phase: 'question', lastCorrect: null, attempts: [], repeatKeys: [] };
}
export function recordAnswer(p: Progress, exercise: Exercise, answer: string) {
    const s = p.active;
    if (!s || !['question', 'retry', 'revealed'].includes(s.phase))
        return;
    const item = s.items[s.index];
    const correct = isCorrect(exercise, answer);
    let attempt = s.attempts.find(a => a.key === item.key);
    const firstInSession = !attempt;
    remember(p, [item.key]);
    if (!attempt) {
        attempt = { key: item.key, first: correct, answer, corrections: 0, corrected: false };
        s.attempts.push(attempt);
    }
    else {
        attempt.corrections++;
        attempt.corrected ||= correct;
    }
    attempt.lastAnswer = answer;
    if (!correct) {
        if (!p.difficult.includes(item.key))
            p.difficult.push(item.key);
        if (!s.repeatKeys.includes(item.key)) {
            s.repeatKeys.push(item.key);
            s.items.push({ ...item });
        }
    }
    else if (firstInSession && !s.repeatKeys.includes(item.key))
        p.difficult = p.difficult.filter(k => k !== item.key);
    if (item.type === 'word')
        p.words[item.key] = correct && firstInSession && !s.repeatKeys.includes(item.key) ? 'known' : 'review';
    s.phase = 'feedback';
    s.lastCorrect = correct;
    return correct;
}
export function markWord(p: Progress, known: boolean) {
    const s = p.active;
    if (!s || s.phase !== 'revealed')
        return;
    const item = s.items[s.index];
    if (item.type !== 'word')
        return;
    p.words[item.key] = known && !s.repeatKeys.includes(item.key) ? 'known' : 'review';
    if (!known && !p.difficult.includes(item.key))
        p.difficult.push(item.key);
    if (known && !s.repeatKeys.includes(item.key) && !s.items.slice(0, s.index).some(i => i.key === item.key))
        p.difficult = p.difficult.filter(k => k !== item.key);
    if (!known && !s.repeatKeys.includes(item.key)) {
        s.repeatKeys.push(item.key);
        s.items.push({ ...item });
    }
    next(p);
}
export function next(p: Progress) {
    const s = p.active;
    if (!s)
        return;
    s.index++;
    s.phase = 'question';
    s.lastCorrect = null;
    if (s.index >= s.items.length) {
        s.completedAt = new Date().toISOString();
        p.sessions.push(s);
        p.active = null;
    }
}
