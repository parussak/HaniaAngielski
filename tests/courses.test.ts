import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readLibrary } from '../src/materials/library.ts';
import { validateCatalog, validateCourses } from '../src/materials/validation.ts';
import { courseFixture } from './fixtures/course-materials.ts';
import { foodCourses as courses, foodModules as modules } from './materials.ts';
import { assembleModule, validateModules } from '../src/content-validation.ts';
import { backup, emptyProgress, eligibleModules, isCorrect, keyFor, makeSession, next, questionFor, recordAnswer, sessionCompatible, validateBackup, type Item } from '../src/core.ts';
import { compareModules, courseKey } from '../src/learning/scope.ts';
import { practicedItems } from '../src/learning/training.ts';
import { getNextStep } from '../src/next-step.ts';
import type { Journey } from '../src/adventure.ts';

const raw = (file: string) => JSON.parse(readFileSync(new URL(`../public/content/02-food/${file}`, import.meta.url), 'utf8'));
const item = (m: typeof modules[number], id = 'coffee-drink'): Item => ({ key: keyFor(m, 'word', id), moduleId: m.id, version: 1, type: 'word', id, input: 'text' });

test('Food ma jawny kurs z nieustalonymi danymi podręcznika; materiały i stare klucze są identyczne', () => {
    const c = courses[0], m = modules[0];
    assert.equal(c.id, 'angielski-hani'); assert.equal(c.targetLanguage, 'en'); assert.equal(c.explanationLanguage, 'pl');
    assert.ok(c.moduleIds.includes('unit-2-food')); assert.deepEqual(c.textbook, { title: null, authors: null, edition: null });
    const legacy = assembleModule(raw('modul.json'), raw('slownictwo.json'), raw('quiz.json'), raw('cwiczenia.json'), raw('gramatyka.json'), raw('rozmowki.json'));
    assert.deepEqual(m.words, legacy.words); assert.deepEqual(m.exercises, legacy.exercises); assert.deepEqual(m.grammar, legacy.grammar);
    assert.deepEqual(m.basicFlashcardIds, legacy.basicFlashcardIds);
    assert.equal(m.meanings!.length, 97);
    for (const w of m.words) assert.equal(keyFor(m, 'word', w.id), keyFor(legacy, 'word', w.id));
    for (const q of m.exercises) assert.equal(keyFor(m, 'exercise', q.id), keyFor(legacy, 'exercise', q.id));
});

test('ten sam format znaczenia wczytuje angielski, francuski i włoski bez wyjątków w silniku', async () => {
    const f = courseFixture(), library = await readLibrary(f.read);
    assert.equal(library.courses.length, 3);
    for (const [i, expected] of ['coffee','café','caffè'].entries()) {
        const m = library.modules[i], q = m.exercises[0];
        assert.equal(m.words[0].front, 'kawa'); assert.equal(m.words[0].back, expected);
        assert.equal(q.answers[0], expected); assert.equal(q.prompt, `${f.courses[i].instructions.translationPrompt}: kawa`);
        assert.deepEqual(m.words[0].illustration, f.entries[0].illustration);
        assert.deepEqual(m.meanings![0].variants, f.entries[0].variants);
        assert.equal(m.courseId, library.courses[i].id); assert.equal(m.explanationLanguageCode, 'pl');
    }
});

test('wariant językowy nie rozszerza samoczynnie odpowiedzi; akcenty i jawne warianty pozostają istotne', async () => {
    const f = courseFixture(); let library = await readLibrary(f.read);
    let q = library.modules[1].exercises[0];
    assert.equal(isCorrect(q, 'café'), true); assert.equal(isCorrect(q, 'cafe'), false); assert.equal(isCorrect(q, 'un café'), false);
    const vocabulary = f.files['french/slownictwo.json'] as { entries: typeof f.entries };
    vocabulary.entries[0].answers = { fr: ['café','un café'] };
    library = await readLibrary(f.read); q = library.modules[1].exercises[0];
    assert.equal(isCorrect(q, 'un café'), true);
    assert.equal(isCorrect(library.modules[2].exercises[0], 'caffe'), false);
    assert.equal(isCorrect(library.modules[2].exercises[0], 'caffè'), true);
});

test('język objaśnień i polecenie pochodzą z kursu, niezależnie od języka nauki', async () => {
    const f = courseFixture(); f.courses[2].explanationLanguage = 'en'; f.courses[2].instructions.translationPrompt = 'Translate into Italian';
    f.courses[2].instructions.wordExplanationTemplate = '“{answer}” means “{cue}”.';
    const { modules } = await readLibrary(f.read), m = modules[2];
    assert.equal(m.words[0].front, 'coffee'); assert.equal(m.words[0].back, 'caffè');
    assert.equal(m.exercises[0].prompt, 'Translate into Italian: coffee');
    assert.equal(m.explanationLanguageCode, 'en');
    assert.equal(m.exercises[0].explanation, '“caffè” means “coffee”.');
});

test('różne znaczenia identycznego zapisu mają osobne identyfikatory i obrazy, bez automatycznego scalania', async () => {
    const f = courseFixture(), vocabulary = f.files['french/slownictwo.json'] as { entries: typeof f.entries };
    vocabulary.entries.push({ id: 'coffee-colour', source: 'Dane testowe', illustration: { symbol: '🟤', caption: 'Kolor kawowy' }, variants: { pl: { text: 'kolor kawowy' }, fr: { text: 'café' } } });
    const m = (await readLibrary(f.read)).modules[1];
    assert.equal(m.words.filter(w => w.back === 'café').length, 2);
    assert.notEqual(keyFor(m, 'word', 'coffee-drink'), keyFor(m, 'word', 'coffee-colour'));
    assert.notDeepEqual(m.words[0].illustration, m.words[2].illustration);
});

test('wyniki tego samego znaczenia są oddzielne między kursami i nie zmieniają zapisu przy odczycie', async () => {
    const { modules: all } = await readLibrary(courseFixture().read), p = emptyProgress();
    p.active = makeSession(all, all[1], 'flashcards', 'text', false, p); p.active.items = [item(all[1])];
    recordAnswer(p, questionFor(all, p.active.items[0]), 'café'); next(p);
    const before = backup(p);
    assert.equal(practicedItems(all, all[0], p).length, 0); assert.equal(practicedItems(all, all[2], p).length, 0);
    assert.equal(practicedItems(all, all[1], p).length, 1);
    assert.equal(p.words[keyFor(all[1], 'word', 'coffee-drink')], 'known');
    assert.equal(p.words[keyFor(all[0], 'word', 'coffee-drink')], undefined);
    assert.deepEqual(validateBackup(before).progress, p); assert.deepEqual(before.progress, p);
});

test('również dwa podręczniki tego samego języka pozostają osobnymi zakresami', async () => {
    const f = courseFixture(); f.courses[2].targetLanguage = 'fr'; f.courses[2].instructions.translationPrompt = 'Podaj po francusku';
    (f.files['italian/modul.json'] as Record<string, unknown>).language = 'Francuski';
    const all = (await readLibrary(f.read)).modules;
    assert.deepEqual(eligibleModules(all, all[2], true).map(m => m.id), ['it-unit']);
    const session = makeSession(all, all[2], 'quiz', 'text', true, emptyProgress());
    assert.ok(session.items.every(i => i.moduleId === 'it-unit'));
    session.items[0] = item(all[1]); assert.equal(sessionCompatible(all, session), false);
});

test('kontynuacja nie przeskakuje z ukończonego kursu do obcego podręcznika', async () => {
    const all = (await readLibrary(courseFixture().read)).modules;
    const p = emptyProgress(); p.active = makeSession(all, all[1], 'quiz', 'text', false, p);
    const s = p.active;
    while (p.active) { recordAnswer(p, questionFor(all, s.items[s.index]), questionFor(all, s.items[s.index]).answers[0]); next(p); }
    const j: Journey = { version: 1, moduleId: all[2].id, id: 'other', title: 'Inny kurs', stages: [{ id: 'first', title: 'Początek', cat: 'maja', illustration: 'illustrations/word-apple.svg', lessons: [{ id: 'lesson-1', title: 'Inna lekcja', intro: 'Test', wordIds: ['coffee-drink'], exerciseIds: [], ruleIds: [] }] }] };
    const step = getNextStep(all, [j], p);
    assert.equal(step.kind, 'practice'); assert.equal(step.moduleId, all[1].id);
    assert.equal(getNextStep(all, [j], p, all[2].courseId).kind, 'lesson');
});

test('kolejność kursu jest niezależna od numeru działu i od kolejności plików w katalogu', async () => {
    const f = courseFixture(); f.courses[0].moduleIds.push('en-second');
    (f.files['katalog.json'] as { modules: string[] }).modules.unshift('second');
    for (const file of ['modul.json','slownictwo.json','quiz.json','cwiczenia.json','gramatyka.json']) f.files[`second/${file}`] = structuredClone(f.files[`english/${file}`]);
    Object.assign(f.files['english/modul.json'] as object, { order: 9 });
    Object.assign(f.files['second/modul.json'] as object, { id: 'en-second', order: 1 });
    const all = (await readLibrary(f.read)).modules, first = all.find(m => m.id === 'en-unit')!, second = all.find(m => m.id === 'en-second')!;
    assert.ok(compareModules(first, second) < 0);
    assert.equal(first.order, 9); assert.equal(second.order, 1);
    assert.deepEqual(eligibleModules(all, second, true).map(m => m.id), ['en-unit','en-second']);
    assert.deepEqual(eligibleModules(all, first, true).map(m => m.id), ['en-unit']);
});

test('stary katalog bez kursów jest odczytywany; nie zgadujemy wspólnego podręcznika z języka', async () => {
    const f = courseFixture(); delete (f.files['katalog.json'] as Record<string, unknown>).coursesFile;
    const library = await readLibrary(f.read);
    assert.equal(library.courses.length, 3);
    assert.equal(courseKey(library.modules[0]), 'legacy-en-unit');
    assert.deepEqual(library.courses[0].textbook, { title: null, authors: null, edition: null });
    assert.equal(library.modules[0].words[0].back, 'coffee');
});

test('walidacja odrzuca zły rejestr, niebezpieczne ścieżki, brak przypisania i podwójne użycie modułu', async () => {
    for (const change of [
        (f: ReturnType<typeof courseFixture>) => f.courses[1].moduleIds.push('missing'),
        (f: ReturnType<typeof courseFixture>) => f.courses[1].moduleIds.push('en-unit'),
        (f: ReturnType<typeof courseFixture>) => f.courses[1].moduleIds.splice(0),
        (f: ReturnType<typeof courseFixture>) => { f.courses[1].id = f.courses[0].id; },
        (f: ReturnType<typeof courseFixture>) => { (f.files['french/modul.json'] as Record<string, unknown>).courseId = 'english-book'; },
        (f: ReturnType<typeof courseFixture>) => { (f.files['french/modul.json'] as Record<string, unknown>).languageCode = 'it'; },
    ]) { const f = courseFixture(); change(f); await assert.rejects(readLibrary(f.read)); }
    assert.throws(() => validateCatalog({ version: 1, modules: ['../outside'] }));
    assert.throws(() => validateCatalog({ version: 1, modules: ['food','food'] }));
    assert.throws(() => validateCatalog({ version: 1, modules: ['food'], coursesFile: '../../outside.json' }));
    const f = courseFixture(); f.courses[0].targetLanguage = 'not a language';
    assert.throws(() => validateCourses({ version: 1, courses: f.courses }));
});

test('nowy format znaczeń wymaga wariantów kursu, źródła, ilustracji i jednoznacznych odpowiedzi', async () => {
    for (const change of [
        (entry: Record<string, any>) => { delete entry.variants.fr; },
        (entry: Record<string, any>) => { delete entry.variants.pl; },
        (entry: Record<string, any>) => { delete entry.source; },
        (entry: Record<string, any>) => { delete entry.illustration; },
        (entry: Record<string, any>) => { entry.variants.fr.forms = ['']; },
        (entry: Record<string, any>) => { entry.answers = { fr: ['café','café'] }; },
        (entry: Record<string, any>) => { entry.answers = { fr: ['un café'] }; },
    ]) { const f = courseFixture(); const entry = (f.files['french/slownictwo.json'] as { entries: Record<string, any>[] }).entries[0]; change(entry); await assert.rejects(readLibrary(f.read)); }
});

test('zależności ćwiczeń nie przekraczają kursu i respektują kolejność podręcznika', async () => {
    const all = (await readLibrary(courseFixture().read)).modules;
    all[1].exercises[0].requires.push(all[0].id);
    assert.throws(() => validateModules(all));
});

test('stara kopia z aktywnym Food zachowuje dokładny zapis, pytania i zgodność po przypisaniu kursu', () => {
    const old = JSON.parse(readFileSync(new URL('./fixtures/backup-v1.json', import.meta.url), 'utf8'));
    const saved = validateBackup(old), before = structuredClone(saved.progress);
    if (saved.progress.active) assert.ok(sessionCompatible(modules, saved.progress.active));
    for (const session of [...saved.progress.sessions, ...(saved.progress.active ? [saved.progress.active] : [])])
        for (const i of session.items) assert.doesNotThrow(() => questionFor(modules, i));
    getNextStep(modules, [], saved.progress); practicedItems(modules, modules[0], saved.progress);
    assert.deepEqual(saved.progress, before);
});
