import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { modules, courses } from './materials.ts';
import { AppState } from '../src/app/state.ts';
import { createCourseController, coursePreferenceKey } from '../src/controllers/courses.ts';
import { courseModules } from '../src/app/selectors.ts';
import { readLibrary } from '../src/materials/library.ts';
import { courseFixture } from './fixtures/course-materials.ts';
import { backup, emptyProgress, keyFor, makeSession, next, questionFor, recordAnswer, replaceActive, sessionCompatible, validateBackup, type Item, type Module, type Progress } from '../src/core.ts';
import { coursePracticePool, makeCoursePracticeSession } from '../src/learning/course-practice.ts';
import { knownMaterial } from '../src/learning/known-material.ts';
import { compactHistory, type HistoryPage } from '../src/history.ts';
import { currentStats } from '../src/learning/statistics.ts';
import { rewardCompletion, stars, type Journey } from '../src/adventure.ts';
import { getNextStep } from '../src/next-step.ts';
import { fullBackup, validateFullBackup } from '../src/history-backup.ts';

const m = modules[0];
const item = (id: string, type: Item['type'] = 'word', module = m): Item => ({ key: keyFor(module, type, id), moduleId: module.id, version: 1, type, id, input: 'text' });
function tryItem(p: Progress, i: Item, wrong = false, all = modules) {
    p.active = makeSession(all, all.find(m => m.id === i.moduleId)!, 'quiz', 'text', false, p); p.active.items = [i];
    recordAnswer(p, questionFor(all, i), wrong ? 'wrong' : questionFor(all, i).answers[0]);
}
function finish(p: Progress, all = modules) {
    const s = p.active!;
    while (p.active) { if (s.phase !== 'feedback') recordAnswer(p, questionFor(all, s.items[s.index]), questionFor(all, s.items[s.index]).answers[0]); next(p); }
    return s;
}

test('globalny zakres jest pusty przed pierwszą próbą; sam status starej pasywnej fiszki nie otwiera pytań', () => {
    const p = emptyProgress(); p.words[keyFor(m, 'word', 'apple')] = 'known';
    for (const mode of ['flashcards','quiz','grammar'] as const) {
        assert.equal(coursePracticePool(modules, m, p, mode).length, 0);
        assert.equal(makeCoursePracticeSession(modules, m, p, mode, 'choice'), null);
    }
});

test('błędna próba w niedokończonej sesji otwiera fiszkę i quiz tego znaczenia, bez innych słów', () => {
    const p = emptyProgress(); tryItem(p, item('apple'), true);
    assert.deepEqual(coursePracticePool(modules, m, p, 'flashcards').map(i => i.id), ['apple']);
    const quiz = coursePracticePool(modules, m, p, 'quiz');
    assert.ok(quiz.length); assert.ok(quiz.every(i => questionFor(modules, i).wordId === 'apple'));
    assert.equal(coursePracticePool(modules, m, p, 'grammar').length, 0);
});

test('poprawnie znane słówka pozostają w globalnych fiszkach; modułowe dalej je pomijają', () => {
    const p = emptyProgress(); tryItem(p, item('apple')); finish(p);
    assert.equal(p.words[keyFor(m, 'word', 'apple')], 'known');
    assert.equal(coursePracticePool(modules, m, p, 'flashcards')[0].id, 'apple');
    assert.ok(!makeSession(modules, m, 'flashcards', 'text', false, p).items.some(i => i.id === 'apple'));
});

test('próba quizu otwiera fiszkę tego samego znaczenia; gramatyka wymaga własnej próby pytania', () => {
    const p = emptyProgress(), q = m.exercises.find(q => q.wordId === 'apple')!;
    tryItem(p, item(q.id, 'exercise')); finish(p);
    assert.equal(coursePracticePool(modules, m, p, 'flashcards')[0].id, 'apple');
    tryItem(p, item('g-so-sport', 'exercise'), true);
    assert.deepEqual(coursePracticePool(modules, m, p, 'grammar').map(i => i.id), ['g-so-sport']);
    const s = makeCoursePracticeSession(modules, m, p, 'grammar', 'text')!;
    assert.equal(s.items[0].input, 'choice');
    assert.deepEqual(questionFor(modules, s.items[0]).options, m.exercises.find(q => q.id === 'g-so-sport')!.options);
});

test('globalny wybór słówek używa wyłącznie poznanych opcji; pojedyncze hasło wymaga wpisania', () => {
    const p = emptyProgress(); tryItem(p, item('apple')); finish(p);
    const single = makeCoursePracticeSession(modules, m, p, 'quiz', 'choice')!;
    assert.ok(single.items.every(i => i.input === 'text' && !i.options));
    tryItem(p, item('bread')); finish(p);
    const session = makeCoursePracticeSession(modules, m, p, 'quiz', 'choice')!;
    assert.ok(session.items.every(i => i.input === 'choice'));
    for (const i of session.items) assert.deepEqual(new Set(questionFor(modules, i).options), new Set(['apple','bread']));
    p.active = session; const restored = validateBackup(backup(p)).progress;
    assert.deepEqual(restored.active!.items, session.items);
    assert.ok(sessionCompatible(modules, restored.active!));
    tryItem(p, item('water')); finish(p);
    for (const i of restored.active!.items) assert.ok(!questionFor(modules, i).options.includes('water'));
});

test('brak automatycznego poznania nowej rewizji po zmianie źródłowego słówka', () => {
    const p = emptyProgress(); tryItem(p, item('apple')); finish(p);
    const changed = structuredClone(m); changed.words.find(w => w.id === 'apple')!.rev = 2;
    assert.equal(coursePracticePool([changed], changed, p, 'flashcards').length, 0);
});

test('poznane elementy z całego kursu mogą pochodzić z dowolnego modułu, bez innych podręczników', async () => {
    const f = courseFixture(); f.courses[0].moduleIds.push('en-later');
    (f.files['katalog.json'] as { modules: string[] }).modules.push('later');
    for (const file of ['modul.json','slownictwo.json','quiz.json','cwiczenia.json','gramatyka.json']) f.files[`later/${file}`] = structuredClone(f.files[`english/${file}`]);
    Object.assign(f.files['later/modul.json'] as object, { id: 'en-later', order: 10 });
    const all = (await readLibrary(f.read)).modules, anchor = all[0], later = all.find(m => m.id === 'en-later')!, french = all.find(m => m.id === 'fr-unit')!;
    const p = emptyProgress(); tryItem(p, item('coffee-drink','word',later), false, all); finish(p, all);
    tryItem(p, item('coffee-drink','word',french), false, all); finish(p, all);
    assert.deepEqual(coursePracticePool(all, anchor, p, 'flashcards').map(i => i.moduleId), ['en-later']);
    const s = makeCoursePracticeSession(all, anchor, p, 'flashcards', 'text')!;
    assert.equal(s.scope!.courseId, anchor.courseId); assert.ok(sessionCompatible(all, s));
});

test('globalne zestawy mają do dziesięciu różnych zadań, bez dopełniania pustego zakresu', () => {
    const p = emptyProgress(); for (const w of m.words.slice(0, 20)) { tryItem(p,item(w.id)); finish(p); }
    const s = makeCoursePracticeSession(modules,m,p,'flashcards','mixed')!;
    assert.equal(s.items.length,10); assert.equal(new Set(s.items.map(i=>i.key)).size,10);
    assert.ok(s.items.every(i=>knownMaterial(modules,m,p).words.has(i.key)));
});

test('globalna sesja nie przyznaje gwiazdek, nie zmienia ukończeń i nie oznacza lekcji za zaliczoną', () => {
    const p = emptyProgress(); tryItem(p,item('apple')); finish(p);
    p.active = makeCoursePracticeSession(modules,m,p,'flashcards','text');
    const finished = finish(p);
    assert.equal(rewardCompletion(p,finished),0); assert.equal(stars(p),0); assert.equal(p.adventure,undefined);
});

test('archiwizacja zachowuje znany zakres, wyniki i tytuł zakresu, bez przypisywania globalnych sesji do Food', async () => {
    const p=emptyProgress(); tryItem(p,item('apple')); finish(p);
    for(let i=0;i<36;i++){p.active=makeCoursePracticeSession(modules,m,p,'flashcards','text');finish(p);}
    const before=currentStats(modules,p),pages=new Map<string,HistoryPage>();
    const compacted=await compactHistory(p,async page=>{pages.set(page.id,page);});
    assert.deepEqual(currentStats(modules,compacted),before);
    assert.equal(coursePracticePool(modules,m,compacted,'flashcards').length,1);
    assert.equal(compacted.history!.modules[m.id].sessions,1);
    assert.equal(compacted.history!.courses![courses[0].id].sessions,compacted.history!.sessions-1);
    const full=await fullBackup(compacted,async id=>pages.get(id)!);
    assert.deepEqual((await validateFullBackup(full)).progress,compacted);
    const bad=structuredClone(full);bad.progress.history!.courses![courses[0].id].total++;
    await assert.rejects(validateFullBackup(bad));
});

test('stare kopie nadal działają, a niepoprawny zakres i opcje globalne są odrzucane', () => {
    const old=JSON.parse(readFileSync(new URL('./fixtures/backup-v1.json',import.meta.url),'utf8'));
    assert.deepEqual(validateBackup(old),old);
    const p=emptyProgress();for(const id of ['apple','bread']){tryItem(p,item(id));finish(p);}
    p.active=makeCoursePracticeSession(modules,m,p,'flashcards','choice');
    for(const edit of [
        (s:any)=>s.scope.kind='all', (s:any)=>s.scope.courseId='', (s:any)=>s.mode='lesson',
        (s:any)=>delete s.scope, (s:any)=>s.items[0].options=['apple'], (s:any)=>s.items[0].options=['apple','apple'],
    ]){const bad=backup(p);edit(bad.progress.active);assert.throws(()=>validateBackup(bad));}
    const wrong=structuredClone(p.active!);wrong.scope!.courseId='another';assert.equal(sessionCompatible(modules,wrong),false);
});

test('wybór kursu jest lokalny, osobny dla konta i gościa i nie usuwa rozpoczętej sesji', async () => {
    const library=await readLibrary(courseFixture().read),state=new AppState(),records=new Map<string,unknown>();
    state.modules=library.modules;state.courses=library.courses;state.progress.active=makeSession(state.modules,state.modules[0],'quiz','text',false,state.progress);
    const before=structuredClone(state.progress);
    const controller=createCourseController(state,{read:async key=>records.get(key),write:async(key,value)=>{records.set(key,value);}});
    await controller.restore();await controller.select('french-book');assert.equal(state.selectedCourseId,'french-book');assert.deepEqual(state.progress,before);
    await controller.restore();assert.equal(state.selectedCourseId,'french-book');assert.ok(courseModules(state).every(m=>m.courseId==='french-book'));
    state.user={uid:'tester',email:'test@example.test',displayName:null};await controller.restore();await controller.select('italian-book');
    state.user=null;await controller.restore();assert.equal(state.selectedCourseId,'french-book');
    assert.notEqual(coursePreferenceKey('tester'),coursePreferenceKey());
    await controller.followSession();assert.equal(state.selectedCourseId,'english-book');assert.deepEqual(state.progress,before);
});

test('spóźniony odczyt preferencji nie przenosi wyboru poprzedniego konta', async () => {
    const library=await readLibrary(courseFixture().read),state=new AppState();state.modules=library.modules;state.courses=library.courses;
    let complete!:(value:unknown)=>void;
    const controller=createCourseController(state,{read:()=>new Promise(resolve=>{complete=resolve;}),write:async()=>{}});
    const pending=controller.restore();state.user={uid:'new',email:'new@example.test',displayName:null};complete({version:1,courseId:'french-book'});await pending;
    assert.equal(state.selectedCourseId,'');
});

test('kontynuacja wybranego kursu nie zastępuje aktywnej sesji innego podręcznika', async () => {
    const library=await readLibrary(courseFixture().read),p=emptyProgress();p.active=makeSession(library.modules,library.modules[0],'quiz','text',false,p);
    const before=structuredClone(p),m=library.modules[1];
    const j:Journey={version:1,moduleId:m.id,title:'Francuski',stages:[{id:'first',title:'Pierwszy',cat:'maja',illustration:'illustrations/word-apple.svg',lessons:[{id:'one',title:'Nowa lekcja',intro:'Test',wordIds:['coffee-drink'],exerciseIds:[],ruleIds:[]}]}]};
    assert.equal(getNextStep(library.modules,[j],p,'french-book').kind,'lesson');
    assert.equal(getNextStep(library.modules,[j],p,'english-book').kind,'resume');
    assert.deepEqual(p,before);
});

test('poznanie nie znika po zastąpieniu starej aktywnej sesji bez nowego znacznika', () => {
    const p=emptyProgress();tryItem(p,item('apple'),true);delete p.encountered;
    const session=makeCoursePracticeSession(modules,m,p,'flashcards','text')!;
    replaceActive(p,session);
    assert.equal(p.active!.attempts.length,0);
    assert.deepEqual(p.encountered,[keyFor(m,'word','apple')]);
    assert.equal(coursePracticePool(modules,m,p,'flashcards').length,1);
    assert.deepEqual(validateBackup(backup(p)).progress,p);
});

test('znaczniki poznania nie rosną wraz z liczbą powtórzeń i nie zmieniają ocen', () => {
    const p=emptyProgress();for(let i=0;i<40;i++){tryItem(p,item('apple'));finish(p);}
    assert.deepEqual(p.encountered,[keyFor(m,'word','apple')]);
    assert.equal(currentStats(modules,p).total,40);
    const broken=backup(p);broken.progress.encountered!.push(broken.progress.encountered![0]);
    assert.throws(()=>validateBackup(broken));
});
