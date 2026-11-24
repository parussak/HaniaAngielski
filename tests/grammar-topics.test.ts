import { test } from 'node:test';
import assert from 'node:assert/strict';
import { grammarTopicsFixture } from './fixtures/grammar-topics.ts';
import { readLibrary } from '../src/materials/library.ts';
import { backup, validateBackup } from '../src/learning/backup.ts';
import { emptyProgress, keyFor, type Item, type Module, type Progress } from '../src/learning/model.ts';
import { makeSession, next, recordAnswer } from '../src/learning/session.ts';
import { questionFor, sessionCompatible } from '../src/learning/questions.ts';
import { grammarTopicPool, grammarTopics, makeGrammarTopicSession } from '../src/learning/grammar-topics.ts';

const fixture = grammarTopicsFixture();
const library = await fixture.library();
const modules = library.modules;
const en = library.courses.find(c => c.id === 'english-book')!;
const unit = (id: string) => modules.find(m => m.id === id)!;
const anchor = unit('en-unit-1');
const item = (module: Module, id: string): Item => ({ key: keyFor(module, 'exercise', id), moduleId: module.id, version: 1, type: 'exercise', id, input: 'text' });
function tryItem(p: Progress, i: Item, wrong = false) {
    p.active = makeSession(modules, modules.find(m => m.id === i.moduleId)!, 'quiz', 'text', false, p); p.active.items = [i];
    recordAnswer(p, questionFor(modules, i), wrong ? 'zła' : questionFor(modules, i).answers[0]);
    // The session is finished so that its attempt stays in the history.
    const s = p.active;
    while (p.active) { if (s.phase !== 'feedback') recordAnswer(p, questionFor(modules, s.items[s.index]), questionFor(modules, s.items[s.index]).answers[0]); next(p); }
}

async function failsWith(edit: (files: Record<string, unknown>) => void, pattern: RegExp) {
    const f = grammarTopicsFixture(); edit(f.files);
    await assert.rejects(() => readLibrary(f.read), pattern);
}

test('temat jest wczytany z pliku kursu, a reguły zachowują treść i wskazanie tematu', () => {
    assert.deepEqual(en.grammarTopics?.map(t => t.id), ['present-continuous', 'articles']);
    assert.equal(unit('en-unit-2').grammar[0].grammarTopicId, 'present-continuous');
    assert.equal(library.courses.find(c => c.id === 'french-book')!.grammarTopics![0].id, 'passe');
});

test('kurs bez pliku tematów nadal działa, ale reguła nie może wskazywać tematu', async () => {
    const f = grammarTopicsFixture();
    for (const c of (f.files['kursy.json'] as { courses: { grammarTopicsFile?: string }[] }).courses) delete c.grammarTopicsFile;
    for (const file of ['en-1', 'en-2', 'fr-1']) (f.files[`${file}/gramatyka.json`] as { grammarTopicId?: string }[]).forEach(r => delete r.grammarTopicId);
    assert.equal((await readLibrary(f.read)).courses[0].grammarTopics, undefined);
    await failsWith(files => { delete (files['kursy.json'] as { courses: { grammarTopicsFile?: string }[] }).courses[1].grammarTopicsFile; }, /nie ma pliku tematów/);
});

test('walidator odrzuca regułę bez tematu, z nieznanym tematem, bez ćwiczeń oraz powtórzony temat', async () => {
    await failsWith(files => { delete (files['en-1/gramatyka.json'] as { grammarTopicId?: string }[])[1].grammarTopicId; }, /nie ma tematu/);
    await failsWith(files => { (files['en-1/gramatyka.json'] as { grammarTopicId?: string }[])[1].grammarTopicId = 'nie-ma'; }, /nieznany temat/);
    await failsWith(files => { files['en-1/cwiczenia.json'] = (files['en-1/cwiczenia.json'] as { ruleId: string }[]).filter(q => q.ruleId !== 'art'); }, /nie ma żadnego zadania/);
    await failsWith(files => { (files['tematy-gramatyki/english-book.json'] as unknown[]).push({ id: 'articles', title: 'Duplikat' }); }, /tematów gramatyki/);
});

test('temat nie jest widoczny przed pierwszą próbą', () => {
    assert.deepEqual(grammarTopics(modules, anchor, en.grammarTopics!, fixture.journeys, emptyProgress()), []);
    assert.deepEqual(grammarTopicPool(modules, anchor, emptyProgress(), 'present-continuous'), []);
});

test('po próbie widać tylko próbowane reguły tematu, ze statystyką i lekcjami; rozwinięcie z dalszego modułu nie zdradza się', () => {
    const p = emptyProgress(); tryItem(p, item(anchor, 'g-pc-1'), true);
    let view = grammarTopics(modules, anchor, en.grammarTopics!, fixture.journeys, p);
    assert.deepEqual(view.map(t => t.topic.id), ['present-continuous']);
    assert.deepEqual(view[0].rules.map(r => r.rule.id), ['pc-basic']);
    assert.deepEqual([view[0].attempts, view[0].correct], [1, 0]);
    assert.deepEqual(view[0].rules[0].lessons.map(l => [l.moduleId, l.lessonId]), [['en-unit-1', 'l-pc']]);
    tryItem(p, item(anchor, 'g-pc-2'));
    tryItem(p, item(unit('en-unit-2'), 'g-pcm-1'));
    view = grammarTopics(modules, anchor, en.grammarTopics!, fixture.journeys, p);
    assert.deepEqual(view[0].rules.map(r => r.rule.id), ['pc-basic', 'pc-more']);
    assert.deepEqual([view[0].attempts, view[0].correct], [3, 2]);
    assert.deepEqual(view[0].rules[1].lessons.map(l => l.lessonId), ['l-more']);
});

test('lekcja pokazuje swoją aktualną treść: reguły z update mają pierwszeństwo', () => {
    const p = emptyProgress(); tryItem(p, item(anchor, 'g-pc-1'));
    const journeys = structuredClone(fixture.journeys);
    const l = journeys[0].stages[0].lessons[0];
    l.update = { edition: 2, title: 'Nowy tytuł', intro: 'x', wordIds: [], exerciseIds: [], ruleIds: [] };
    assert.deepEqual(grammarTopics(modules, anchor, en.grammarTopics!, journeys, p)[0].rules[0].lessons, []);
    l.update.ruleIds = ['pc-basic'];
    assert.equal(grammarTopics(modules, anchor, en.grammarTopics!, journeys, p)[0].rules[0].lessons[0].title, 'Nowy tytuł');
});

test('sesja tematu bierze tylko próbowane zadania tego tematu i jest zwykłą sesją kursu', () => {
    const p = emptyProgress(); tryItem(p, item(anchor, 'g-pc-1'), true); tryItem(p, item(anchor, 'g-art-1')); tryItem(p, item(unit('en-unit-2'), 'g-pcm-1'));
    assert.deepEqual(grammarTopicPool(modules, anchor, p, 'present-continuous').map(i => i.id).sort(), ['g-pc-1', 'g-pcm-1']);
    assert.deepEqual(grammarTopicPool(modules, anchor, p, 'articles').map(i => i.id), ['g-art-1']);
    const s = makeGrammarTopicSession(modules, anchor, p, 'present-continuous', 'choice')!;
    assert.equal(s.mode, 'grammar'); assert.deepEqual(s.scope, { kind: 'course', courseId: 'english-book' });
    assert.ok(s.items.length <= 10 && s.items.every(i => ['g-pc-1', 'g-pcm-1'].includes(i.id)));
    p.active = s;
    assert.deepEqual(validateBackup(backup(p)).progress.active!.items, s.items);
    assert.ok(sessionCompatible(modules, p.active));
    assert.equal(makeGrammarTopicSession(modules, anchor, emptyProgress(), 'present-continuous', 'choice'), null);
});

test('inny kurs ma osobne tematy, także gdy reguły mają te same identyfikatory', () => {
    const p = emptyProgress(), fr = unit('fr-unit-1');
    tryItem(p, item(fr, 'g-fr-1'));
    assert.deepEqual(grammarTopics(modules, anchor, en.grammarTopics!, fixture.journeys, p), []);
    const frTopics = library.courses.find(c => c.id === 'french-book')!.grammarTopics!;
    const view = grammarTopics(modules, fr, frTopics, [], p);
    assert.deepEqual(view.map(t => t.topic.id), ['passe']);
    assert.deepEqual(grammarTopicPool(modules, anchor, p, 'passe'), []);
});

test('po lekcji z regułami tematu jest przycisk „Poćwicz gramatykę”, tylko gdy są próbowane zadania', async () => {
    const { AppState } = await import('../src/app/state.ts');
    const { lessonSummaryActions } = await import('../src/views/lesson-summary-actions.ts');
    const { lessonTopicIds } = await import('../src/learning/grammar-topics.ts');
    const state = new AppState();
    state.courses = library.courses; state.modules = modules; state.journeys = fixture.journeys; state.selectedCourseId = 'english-book'; state.selected = anchor;
    const finished = (lessonId: string) => ({ ...makeSession(modules, anchor, 'quiz', 'text', false, state.progress), lesson: { id: `en-unit-1/${lessonId}`, title: lessonId }, completedAt: new Date().toISOString() });
    assert.doesNotMatch(lessonSummaryActions(state, finished('l-pc')), /grammar-practice/);
    tryItem(state.progress, item(anchor, 'g-pc-1'));
    tryItem(state.progress, item(unit('en-unit-2'), 'g-pcm-1'));
    assert.match(lessonSummaryActions(state, finished('l-pc')), /data-action="grammar-practice" data-id="present-continuous"/);
    // The lesson about articles has no tried article exercise, so there is nothing to practise yet.
    assert.doesNotMatch(lessonSummaryActions(state, finished('l-art')), /grammar-practice/);
    assert.deepEqual(lessonTopicIds(anchor, fixture.journeys[0].stages[0].lessons[0]), ['present-continuous']);
    assert.deepEqual(lessonTopicIds(anchor, { id: 'x', title: 'x', intro: 'x', wordIds: [], exerciseIds: [], ruleIds: [] }), []);
});
