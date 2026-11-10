import { journeyKey, journeyForProgress, lessons, orderedJourneys, unlocked, type Journey, type Lesson } from '../adventure.ts';
import { inputFor, questionFor, resolveItem, shuffle } from './questions.ts';
import { keyFor, type AnswerMode, type Item, type Module, type Progress, type Session } from './model.ts';
import { sameCourse } from './scope.ts';
import { answerHistory } from './known-material.ts';

interface Practice { item: Item; total: number; correct: number; last: number; difficult: boolean }

// Read both current attempts and the compact historical totals. Opening an intro
// or marking an old passive flashcard "known" is not itself an answer attempt.
export function practicedItems(modules: Module[], selected: Module, p: Progress): Practice[] {
    const counts = answerHistory(p);
    const result = new Map<string, Practice>();
    const difficult = new Set(p.difficult);
    const remembered = new Set(p.encountered ?? []);
    for (const m of modules.filter(m => sameCourse(m, selected))) {
        const source: Item[] = [
            ...m.words.map(w => ({ key: keyFor(m, 'word', w.id), moduleId: m.id, version: w.rev ?? 1, type: 'word' as const, id: w.id, input: 'text' as const })),
            ...m.exercises.map(q => ({ key: keyFor(m, 'exercise', q.id), moduleId: m.id, version: q.rev ?? 1, type: 'exercise' as const, id: q.id, input: 'text' as const })),
        ];
        for (const original of source) {
            const stat = counts.get(original.key) ?? (remembered.has(original.key) ? { total: 1, correct: 0, last: 0 } : undefined);
            if (!stat?.total || !resolveItem(modules, original)) continue;
            const q = original.type === 'exercise' ? m.exercises.find(q => q.id === original.id) : undefined;
            if (q && !q.requires.every(id => modules.some(other => other.id === id && sameCourse(other, selected)))) continue;
            // A vocabulary quiz and its flashcard exercise the same meaning.
            const word = q?.kind === 'vocabulary' && q.wordId ? m.words.find(w => w.id === q.wordId) : undefined;
            const item: Item = word ? { key: keyFor(m, 'word', word.id), moduleId: m.id, version: word.rev ?? 1, type: 'word', id: word.id, input: 'text' } : original;
            const previous = result.get(item.key);
            result.set(item.key, { item, total: (previous?.total ?? 0) + stat.total, correct: (previous?.correct ?? 0) + stat.correct, last: Math.max(previous?.last ?? 0, stat.last), difficult: !!previous?.difficult || difficult.has(original.key) || difficult.has(item.key) || p.words[item.key] === 'review' });
        }
    }
    return [...result.values()];
}

export function earlierMapKeys(modules: Module[], journeys: Journey[], current: Journey): Set<string> {
    const selected = modules.find(m => m.id === current.moduleId);
    if (!selected) return new Set();
    const ordered = orderedJourneys(modules.filter(m => sameCourse(m, selected)), journeys);
    const index = ordered.findIndex(j => journeyKey(j) === journeyKey(current));
    const keys = new Set<string>();
    for (const j of ordered.slice(0, Math.max(0, index))) {
        const m = modules.find(m => m.id === j.moduleId)!;
        for (const { lesson } of lessons(j).flatMap(entry=>[entry,...(entry.lesson.update?[{...entry,lesson:{...entry.lesson,...entry.lesson.update}}]:[])])) {
            if (lesson.role === 'training') continue;
            for (const id of lesson.wordIds) keys.add(keyFor(m, 'word', id));
            for (const id of lesson.exerciseIds) {
                const q = m.exercises.find(q => q.id === id)!;
                keys.add(q.kind === 'vocabulary' && q.wordId ? keyFor(m, 'word', q.wordId) : keyFor(m, 'exercise', id));
            }
        }
    }
    return keys;
}

export function validateTrainingPlan(modules: Module[], journeys: Journey[]) {
    for (const journey of journeys) {
        let introduced = 0;
        const earlier = earlierMapKeys(modules, journeys, journey);
        for (const { lesson } of lessons(journey)) {
            if (lesson.role !== 'training') { introduced++; continue; }
            if (!earlier.size) throw new Error(`Trening ${lesson.id}: brak materiału wcześniejszych map.`);
            if (introduced < 2 || introduced > 3) throw new Error(`Trening ${lesson.id}: wymagane 2–3 lekcje nowego materiału przed treningiem.`);
            introduced = 0;
        }
    }
}

// This is a bounded selection policy, not a spaced-repetition scheduler. There
// are no due dates or invented SM-2/FSRS parameters. Correct items stay eligible.
export function selectTrainingItems(pool: Practice[], count = 8, random = Math.random): Item[] {
    const ranked = shuffle(pool, random).sort((a, b) => a.total / (a.difficult ? 2 : 1) - b.total / (b.difficult ? 2 : 1) || a.last - b.last);
    const selected = ranked.slice(0, count);
    // Both kinds participate when available, without a fixed percentage split.
    for (const type of ['word', 'exercise'] as const) {
        if (selected.length > 1 && !selected.some(x => x.item.type === type)) {
            const candidate = ranked.find(x => x.item.type === type);
            if (candidate) selected[selected.length - 1] = candidate;
        }
    }
    return selected.map(x => structuredClone(x.item));
}

export function mapTrainingPool(modules:Module[],journeys:Journey[],journey:Journey,p:Progress){
    const selected=modules.find(m=>m.id===journey.moduleId);if(!selected)return [];
    const allowed=earlierMapKeys(modules,journeys,journey);
    return practicedItems(modules,selected,p).filter(x=>allowed.has(x.item.key));
}

// A separate earlier lesson introduces material; the training itself never does.
export function trainingPreparation(modules:Module[],journeys:Journey[],journey:Journey,p:Progress){
    const selected=modules.find(m=>m.id===journey.moduleId);if(!selected)return;
    const ordered=orderedJourneys(modules.filter(m=>sameCourse(m,selected)),journeys);
    const index=ordered.findIndex(j=>journeyKey(j)===journeyKey(journey));
    for(const original of ordered.slice(0,Math.max(0,index))){
        const source=journeyForProgress(original,p);
        const candidates=lessons(source).filter(e=>e.lesson.role!=='training'&&unlocked(source,e.lesson,p));
        const candidate=candidates.find(e=>!p.adventure?.completed[e.key])??candidates[0];
        if(candidate)return {journey:source,lesson:candidate.lesson};
    }
}

export function makeTrainingSession(modules: Module[], selected: Module, p: Progress, answerMode: AnswerMode, context?: { journey: Journey; lesson: Lesson; journeys: Journey[] }): Session | null {
    let pool = context?mapTrainingPool(modules,context.journeys,context.journey,p):practicedItems(modules, selected, p);
    if (context) {
        if (context.journey.moduleId !== selected.id || context.lesson.role !== 'training' || !unlocked(context.journey, context.lesson, p))
            throw new Error('Najpierw ukończ wcześniejszą lekcję.');
    }
    const items = selectTrainingItems(pool, context?.lesson.targetCount ?? 8);
    if (!items.length) return null;
    items.forEach((item, index) => { item.input = inputFor(questionFor(modules, item), answerMode === 'mixed' ? (index % 2 ? 'text' : 'choice') : answerMode); });
    return { id: crypto.randomUUID(), moduleId: selected.id, mode: context ? 'lesson' : 'training', training: { kind: context ? 'map' : 'extra' },
        ...(context ? { lesson: { id: `${journeyKey(context.journey)}/${context.lesson.id}`, title: context.lesson.title } } : {}),
        answerMode, previous: true, startedAt: new Date().toISOString(), completedAt: null, items, index: 0, phase: 'question', lastCorrect: null, attempts: [], repeatKeys: [] };
}
