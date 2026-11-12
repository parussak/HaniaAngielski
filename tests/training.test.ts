import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { foodModules as modules } from './materials.ts';
import { backup, emptyProgress, keyFor, next, questionFor, recordAnswer, validateBackup, type Item, type Module, type Progress, type Session } from '../src/core.ts';
import { freshAdventure, journeyKey, lessonKey, lessons, makeLessonSession, nextLesson, rewardCompletion, stars, unlocked, validateJourney, type Journey, type Lesson } from '../src/adventure.ts';
import { earlierMapKeys, makeTrainingSession, practicedItems, selectTrainingItems, validateTrainingPlan } from '../src/learning/training.ts';
import { compactHistory, type HistoryPage } from '../src/history.ts';
import { eligibleModules } from '../src/core.ts';
import { assembleModule, validateModules } from '../src/content-validation.ts';
import { recordStageError, reviewStats, seedStageReviews, settleStageRewards, stageKey } from '../src/stage-review.ts';
import { mapProgress, reviewProgressText } from '../src/learning/map-progress.ts';
import { getNextStep } from '../src/next-step.ts';

const m = modules[0];
const food = validateJourney(JSON.parse(readFileSync(new URL('../public/content/02-food/sciezka.json', import.meta.url), 'utf8')), m);
const item = (id: string, type: Item['type'] = 'word', mod = m): Item => ({ key: keyFor(mod, type, id), moduleId: mod.id, id, type, version: 1, input: 'text' });
function attempt(p: Progress, items: Item[], wrong = false) {
    const session: Session = { id: crypto.randomUUID(), moduleId: m.id, mode: 'quiz', answerMode: 'text', previous: false, items: structuredClone(items), index: 0, phase: 'question', startedAt: new Date().toISOString(), completedAt: null, lastCorrect: null, attempts: [], repeatKeys: [] };
    p.active = session;
    recordAnswer(p, questionFor(modules, session.items[0]), wrong ? 'wrong' : questionFor(modules, session.items[0]).answers[0]);
    return session;
}
function finish(p: Progress, available = modules) {
    const s = p.active!;
    while (p.active) {
        if (s.phase !== 'feedback') recordAnswer(p, questionFor(available, s.items[s.index]), questionFor(available, s.items[s.index]).answers[0]);
        next(p);
    }
    return s;
}
function seedAll(p: Progress) {
    for (const w of m.words) finishAfterAttempt(p, item(w.id));
    for (const q of m.exercises.filter(q => q.kind === 'grammar')) finishAfterAttempt(p, item(q.id, 'exercise'));
}
function finishAfterAttempt(p: Progress, it: Item) { attempt(p, [it]); finish(p); }
function secondMap(): Journey {
    return { version: 1, moduleId: m.id, id: 'second', title: 'Druga mapa', stages: [{ ...structuredClone(food.stages[0]), lessons: [
        { ...structuredClone(food.stages[0].lessons[0]), id: 'new-1' },
        { ...structuredClone(food.stages[0].lessons[1]), id: 'new-2' },
        { id: 'training-1', title: 'Trening', intro: 'Wracamy do poznanego materiału.', role: 'training', wordIds: [], exerciseIds: [], ruleIds: [] },
        { ...structuredClone(food.stages[0].lessons[2]), id: 'new-3' },
    ] }] };
}

test('poznanie wymaga próby; błąd w niedokończonej sesji wystarcza, samo oznaczenie fiszki nie', () => {
    const p = emptyProgress();
    p.words[keyFor(m, 'word', 'apple')] = 'known';
    assert.equal(practicedItems(modules, m, p).length, 0);
    attempt(p, [item('apple')], true);
    assert.equal(practicedItems(modules, m, p).length, 1);
    assert.equal(practicedItems(modules, m, p)[0].correct, 0);
    assert.equal(makeTrainingSession(modules, m, emptyProgress(), 'text'), null);
});

test('quiz i fiszka jednego słówka nie dublują znaczenia; nowa rewizja nie dziedziczy starych prób', () => {
    const p = emptyProgress(), q = m.exercises.find(q => q.wordId === 'apple')!;
    finishAfterAttempt(p, item(q.id, 'exercise'));
    finishAfterAttempt(p, item('apple'));
    const pool = practicedItems(modules, m, p);
    assert.equal(pool.length, 1);
    assert.equal(pool[0].item.type, 'word');
    assert.equal(pool[0].total, 2);
    const changed = structuredClone(m);
    changed.words.find(w => w.id === 'apple')!.rev = 2;
    changed.exercises.find(x => x.id === q.id)!.rev = 2;
    assert.equal(practicedItems([changed], changed, p).length, 0);
});

test('dodatkowy trening korzysta tylko z poznanego zakresu kursu; nie dodaje minimum ani duplikatów', () => {
    const p = emptyProgress();
    finishAfterAttempt(p, item('apple'));
    finishAfterAttempt(p, item('g-so-sport', 'exercise'));
    const session = makeTrainingSession(modules, m, p, 'text')!;
    assert.equal(session.items.length, 2);
    assert.equal(new Set(session.items.map(i => i.key)).size, 2);
    assert.equal(session.training?.kind, 'extra');
    assert.equal(session.lesson, undefined);
    assert.equal(session.items.find(i => i.id === 'g-so-sport')?.input, 'choice');
    assert.equal(session.items.find(i => i.id === 'apple')?.input, 'text');
});

test('trening zwykle ma osiem zadań i łączy materiał bez stałych proporcji', () => {
    const p = emptyProgress(); seedAll(p);
    const s = makeTrainingSession(modules, m, p, 'mixed')!;
    assert.equal(s.items.length, 8);
    assert.ok(s.items.some(i => i.type === 'word'));
    assert.ok(s.items.some(i => i.type === 'exercise'));
    assert.equal(new Set(s.items.map(i => i.key)).size, 8);
    const onlyWords = selectTrainingItems(practicedItems(modules, m, p).filter(x => x.item.type === 'word'));
    assert.equal(onlyWords.length, 8);
});

test('bezbłędne pozycje wracają; trudne mają większą szansę, lecz nie wypierają reszty stale', () => {
    const p = emptyProgress();
    for (const w of m.words.slice(0, 15)) finishAfterAttempt(p, item(w.id));
    const difficult = keyFor(m, 'word', m.words[0].id); p.difficult.push(difficult);
    let pool = practicedItems(modules, m, p);
    const picked = new Set<string>();
    for (let run = 0; run < 20; run++) {
        for (const it of selectTrainingItems(pool, 8, () => 0.5)) {
            picked.add(it.key);
            pool.find(x => x.item.key === it.key)!.total++;
        }
    }
    assert.equal(picked.size, 15);
    pool = practicedItems(modules, m, p);
    assert.ok(selectTrainingItems(pool, 8, () => 0.5).some(i => i.key === difficult));
});

test('historyczne próby po kompakcji nadal zasilają trening bez czytania całego archiwum', async () => {
    const p = emptyProgress();
    for (let i = 0; i < 36; i++) finishAfterAttempt(p, item(m.words[i].id));
    const pages: HistoryPage[] = [];
    const compacted = await compactHistory(p, async page => { pages.push(page); });
    assert.ok(pages.length > 0);
    assert.equal(practicedItems(modules, m, compacted).length, 36);
    assert.equal(practicedItems(modules, m, compacted).find(x => x.item.id === m.words[0].id)!.total, 1);
    assert.deepEqual(validateBackup(backup(compacted)).progress, compacted);
});

test('pierwsza mapa nie ma puli wcześniejszych map; trening drugiej nie bierze nowych treści', () => {
    const p = emptyProgress(); seedAll(p);
    const j = secondMap(), training = j.stages[0].lessons[2];
    p.adventure = freshAdventure();
    for (const l of j.stages[0].lessons.slice(0, 2)) p.adventure.completed[lessonKey(j, l)] = { at: new Date().toISOString() };
    assert.equal(earlierMapKeys(modules, [food, j], food).size, 0);
    const allowed = earlierMapKeys(modules, [food, j], j);
    assert.ok(allowed.size > 0);
    const s = makeTrainingSession(modules, m, p, 'mixed', { journey: j, lesson: training, journeys: [food, j] })!;
    assert.equal(s.training?.kind, 'map');
    assert.ok(s.items.every(it => allowed.has(it.key)));
    assert.equal(s.lesson?.id, `${m.id}/second/training-1`);
    assert.equal(makeTrainingSession(modules, m, emptyProgress(), 'mixed', { journey: j, lesson: training, journeys: [food, j] }),null);
});

test('3 gwiazdki za trening na mapie tylko raz; trening jest wymagany, błędy nie blokują ukończenia', () => {
    const p = emptyProgress(); seedAll(p);
    const j = secondMap(), [a, b, training, last] = j.stages[0].lessons;
    p.adventure = freshAdventure();
    for (const l of [a, b]) p.adventure.completed[lessonKey(j, l)] = { at: new Date().toISOString() };
    assert.equal(unlocked(j, last, p), true);
    assert.equal(mapProgress(j, p).complete, false);
    p.active = makeTrainingSession(modules, m, p, 'mixed', { journey: j, lesson: training, journeys: [food, j] });
    const s = finish(p);
    assert.equal(rewardCompletion(p, s), 3);
    assert.equal(rewardCompletion(p, s), 0);
    assert.equal(unlocked(j, last, p), true);
    p.adventure.completed[lessonKey(j, last)] = { at: new Date().toISOString() };
    recordStageError(p, s, s.items[0], [food, j]);
    assert.equal(mapProgress(j, p).percent, 100);
    assert.equal(mapProgress(j, p).complete, true);
    assert.equal(mapProgress(j, p).mastered, false);
    assert.equal(nextLesson(j, p), undefined);
    assert.equal(settleStageRewards(p, [j]), 0, 'nie przenosimy starej premii etapu na nową mapę');
    assert.deepEqual(validateBackup(backup(p)).progress, p);
});

test('dodatkowy trening daje jedną gwiazdkę za ukończenie, bez podwójnego naliczania i bez rozrastającej się listy nagród', async () => {
    const p = emptyProgress(); finishAfterAttempt(p, item('apple'));
    const previous = structuredClone(p);
    p.active = makeTrainingSession(modules, m, p, 'text');
    assert.equal(rewardCompletion(p, p.active!), 0);
    assert.equal(p.adventure, undefined);
    const s = finish(p);
    assert.equal(rewardCompletion(p, s), 1);
    assert.equal(rewardCompletion(p, structuredClone(s)), 0);
    assert.equal(stars(p), 1);
    assert.deepEqual(p.adventure!.completed, {});
    assert.equal(getNextStep(modules, [food], p).kind, 'lesson');
    const restored = validateBackup(backup(p)).progress;
    assert.equal(rewardCompletion(restored, restored.sessions.at(-1)!), 0);
    restored.active = makeTrainingSession(modules, m, restored, 'text');
    assert.equal(rewardCompletion(restored, finish(restored)), 1);
    assert.equal(stars(restored), 2);
    assert.deepEqual(previous.sessions[0].attempts, p.sessions[0].attempts);
    for (let i = 0; i < 35; i++) { restored.active = makeTrainingSession(modules, m, restored, 'text'); rewardCompletion(restored, finish(restored)); }
    const compacted = await compactHistory(restored, async () => {});
    assert.equal(rewardCompletion(compacted, s), 0);
    assert.equal(Object.keys(compacted.adventure!.completed).length, 0);
});

test('kursy izolują trening i wcześniejsze moduły, także dwa podręczniki tego samego języka', () => {
    const p = emptyProgress(); finishAfterAttempt(p, item('apple'));
    const other: Module = structuredClone(m); other.id = 'other-book'; other.courseId = 'other'; other.order = 1;
    for (const q of other.exercises) q.requires = [other.id];
    assert.equal(practicedItems([m, other], other, p).length, 0);
    assert.deepEqual(eligibleModules([m, other], m, true).map(x => x.id), [m.id]);
    const invalid = structuredClone(other); invalid.exercises[0].requires.push(m.id);
    assert.throws(() => validateModules([m, invalid]));
});

test('język pytania jest danymi materiału, francuski i włoski zachowują znaki w odpowiedziach', () => {
    for (const [language, languageCode, expected] of [['Francuski', 'fr', 'Podaj po francusku'], ['Włoski', 'it', 'Podaj po włosku']]) {
        const words = [{ ...m.words[0], answers: undefined, back: languageCode === 'fr' ? 'café' : 'caffè' }, m.words[1]];
        const module = assembleModule({ ...m, language, languageCode, instructions: { translationPrompt: expected } }, words, [{ id: 'q', wordId: words[0].id, distractorIds: [words[1].id] }], [], []);
        assert.ok(module.exercises[0].prompt.startsWith(expected));
        assert.equal(module.exercises[0].answers[0], words[0].back);
    }
});

test('procent to ukończenie lekcji; zero błędów przed nauką nie daje ukończenia ani gratulacji', () => {
    const p = emptyProgress();
    assert.equal(mapProgress(food, p).percent, 0);
    assert.equal(mapProgress(food, p).mastered, false);
    assert.doesNotMatch(reviewProgressText(mapProgress(food, p)), /Gratulacje/);
    p.adventure = freshAdventure();
    for (const { key } of lessons(food)) p.adventure.completed[key] = { at: new Date().toISOString() };
    const s = makeLessonSession(modules, food, food.stages[0].lessons[0], 'text', p);
    recordStageError(p, s, s.items[0], [food]);
    assert.equal(mapProgress(food, p).percent, 100);
    assert.equal(mapProgress(food, p).pending, 1);
    assert.equal(reviewProgressText(mapProgress(food, p)), 'Ukończone · Gratulacje!');
    const entry = p.adventure.stageReviews![stageKey(food, food.stages[0])].items[s.items[0].key];
    entry.correct = 3; entry.due = 0;
    assert.equal(reviewStats(p, food).pending, 0);
    assert.equal(mapProgress(food, p).mastered, true);
    assert.match(reviewProgressText(mapProgress(food, p)), /Gratulacje/);
    p.adventure.reviewArchiveHead = 'a'.repeat(64);
    assert.equal(mapProgress(food, p).mastered, false);
});

test('stare ukończenia, aktywna sesja i gwiazdki nie zmieniają się przy odczycie treningu i postępu', () => {
    const p = seedStageReviews(emptyProgress(), [food]);
    p.adventure = freshAdventure(); p.adventure.earned = 17;
    p.adventure.completed[lessonKey(food, food.stages[0].lessons[0])] = { at: '2026-11-08T12:00:00Z' };
    p.active = makeLessonSession(modules, food, food.stages[0].lessons[1], 'text', p);
    recordAnswer(p, questionFor(modules, p.active.items[0]), 'wrong');
    const before = structuredClone(p);
    practicedItems(modules, m, p); makeTrainingSession(modules, m, p, 'mixed'); mapProgress(food, p);
    assert.deepEqual(p, before);
    assert.deepEqual(validateBackup(backup(p)).progress, before);
});

test('kopie odrzucają treningi z niepoprawną rolą, nagrodą przed ukończeniem i niezgodnym trybem', () => {
    const p = emptyProgress(); finishAfterAttempt(p, item('apple'));
    p.active = makeTrainingSession(modules, m, p, 'text');
    const bad = backup(p); bad.progress.active!.training!.rewarded = true;
    assert.throws(() => validateBackup(bad));
    const badMode = backup(p); badMode.progress.active!.mode = 'quiz';
    assert.throws(() => validateBackup(badMode));
});

test('kilka map tego samego modułu nie współdzieli ukończeń o identycznym ID lekcji', () => {
    const first = structuredClone(food), second = structuredClone(food); first.id = 'one'; second.id = 'two';
    const p = emptyProgress(); p.adventure = freshAdventure();
    p.adventure.completed[lessonKey(first, first.stages[0].lessons[0])] = { at: new Date().toISOString() };
    assert.notEqual(journeyKey(first), journeyKey(second));
    assert.equal(mapProgress(first, p).done, 1);
    assert.equal(mapProgress(second, p).done, 0);
    assert.notEqual(stageKey(first, first.stages[0]), stageKey(second, second.stages[0]));
});

test('walidacja nowych map pilnuje 6–10 zadań i treningów po 2–3 lekcjach; stare Food nadal poprawne', () => {
    assert.doesNotThrow(() => validateJourney(food, m));
    const j = secondMap();
    assert.throws(() => validateJourney(j, m), 'nowa mapa nie przejmuje wyjątku krótkich lekcji Food');
    for (const { lesson } of lessons(j).filter(x => x.lesson.role !== 'training')) lesson.wordIds = m.words.slice(0, 6).map(w => w.id);
    assert.doesNotThrow(() => validateJourney(j, m));
    assert.doesNotThrow(() => validateTrainingPlan(modules, [food, j]));
    assert.doesNotThrow(() => validateTrainingPlan(modules, [j]), 'rozgrzewka może korzystać z wcześniejszych lekcji tej samej mapy');
    const tooEarly = structuredClone(j);
    [tooEarly.stages[0].lessons[0], tooEarly.stages[0].lessons[2]] = [tooEarly.stages[0].lessons[2], tooEarly.stages[0].lessons[0]];
    assert.throws(() => validateTrainingPlan(modules, [food, tooEarly]));
    const tooLong = structuredClone(j); tooLong.stages[0].lessons[0].wordIds = m.words.slice(0, 11).map(w => w.id);
    assert.throws(() => validateJourney(tooLong, m));
    const repeated = structuredClone(j); repeated.stages[0].lessons.push({ ...structuredClone(j.stages[0].lessons[2]), id: 'training-2' });
    assert.throws(() => validateTrainingPlan(modules, [food, repeated]), 'trening nie liczy się do nowych lekcji');
});
