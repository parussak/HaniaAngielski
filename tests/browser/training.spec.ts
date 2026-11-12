import {answerCurrent} from './helpers.ts';
import {openWarmup,openAdditionalWarmup} from './navigation.ts';
import {openBackup} from './navigation.ts';
import { test, expect, type Page } from './fixtures.ts';
import { readFileSync } from 'node:fs';
import { foodModules as modules } from '../materials.ts';
import { backup, emptyProgress, keyFor, makeSession, next, questionFor, recordAnswer, type Item, type Progress } from '../../src/core.ts';
import { freshAdventure, lessonKey, lessons, type Journey } from '../../src/adventure.ts';
import { recordStageError, stageKey } from '../../src/stage-review.ts';
import { openMap, openModule } from './navigation.ts';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const m = modules[0];
const food: Journey = JSON.parse(readFileSync(new URL('../../public/content/02-food/sciezka.json', import.meta.url), 'utf8'));
const word = (id: string): Item => ({ key: keyFor(m, 'word', id), moduleId: m.id, id, type: 'word', version: 1, input: 'text' });
function fixture() {
    const p = emptyProgress();
    const items: Item[] = [word('apple'), word('bread'), { key: keyFor(m, 'exercise', 'g-so-sport'), moduleId: m.id, id: 'g-so-sport', type: 'exercise', version: 1, input: 'choice' }];
    for (const item of items) {
        p.active = makeSession(modules, m, 'quiz', 'text', false, p);
        p.active.items = [item];
        recordAnswer(p, questionFor(modules, item), questionFor(modules, item).answers[0]); next(p);
    }
    p.adventure = freshAdventure(); p.adventure.earned = 17; p.adventure.reviewSchema = 1;
    return p;
}
async function importProgress(page: Page, p: Progress) {
    await page.goto('./');
    await openBackup(page);
    await page.locator('#import-file').setInputFiles({ name: 'training.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup(p))) });
    await page.getByRole('button', { name: 'Zastąp postępy', exact: true }).tap();
    await expect(page.locator('#app')).toHaveAttribute('aria-busy', 'false');
    await page.getByRole('button', { name: 'Moja nauka', exact: true }).tap();
}
const answer=(page:Page)=>answerCurrent(page,modules);
async function finish(page: Page) {
    await expect(page.locator('.question')).toBeVisible();
    while (await page.locator('.question').count()) {
        if (!await page.locator('.feedback').count()) await answer(page);
        await page.getByRole('button', { name: /Dalej/ }).tap();
        await expect(page.locator('#app')).toHaveAttribute('aria-busy', 'false');
    }
}

test('telefon: dodatkowy trening, wznowienie po odświeżeniu i jedna gwiazdka za każde ukończenie', async ({ page }) => {
    await importProgress(page, fixture()); await openModule(page);
    await page.getByText('Wpisuję odpowiedź', { exact: true }).tap();
    await openAdditionalWarmup(page);
    await expect(page.locator('.study-heading h1')).toHaveText('Kocia rozgrzewka');
    await expect(page.locator('.study-heading .tag')).toHaveText('1 / 3');
    await answer(page); const prompt = await page.locator('.question').innerText();
    await page.reload(); await page.getByRole('button', { name: 'Kontynuuj naukę →', exact: true }).tap();
    await expect(page.locator('.question')).toHaveText(prompt);
    await expect(page.locator('.feedback.correct')).toBeVisible();
    await finish(page); await expect(page.locator('.lesson-reward')).toContainText('+1 ★');
    await page.getByRole('button', { name: 'Moja nauka', exact: true }).tap();
    await page.getByRole('button', { name: 'Domek', exact: true }).tap();
    await expect(page.locator('.star-wallet')).toContainText('18');
    await page.reload(); await openModule(page); await openAdditionalWarmup(page);
    await finish(page); await expect(page.locator('.lesson-reward')).toContainText('+1 ★');
    await page.getByRole('button', { name: 'Moja nauka', exact: true }).tap();
    await page.getByRole('button', { name: 'Domek', exact: true }).tap();
    await expect(page.locator('.star-wallet')).toContainText('19');
    await page.screenshot({ path: 'test-results/training-house-mobile.png', fullPage: true });
});

test('brak poznanych pytań: trening nie tworzy pustej sesji; mały ekran mieści przycisk', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('./'); await openModule(page);
    await openWarmup(page);await expect(page.getByRole('button', { name: 'Zacznij rozgrzewkę →', exact: true })).toBeDisabled();
    await expect(page.locator('.content')).toContainText('Najpierw spróbuj kilku zadań');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test('100% ukończenia i gratulacje mimo błędów; utrwalenie nie zmienia sukcesu mapy', async ({ page }) => {
    const p = fixture();
    for (const { key } of lessons(food)) p.adventure!.completed[key] = { at: '2026-11-08T12:00:00Z' };
    const session = { ...p.sessions[0], mode: 'lesson' as const, lesson: { id: lessonKey(food, food.stages[0].lessons[0]), title: 'Pierwsze smaki' } };
    recordStageError(p, session, word('apple'), [food]);
    await importProgress(page, p); await openMap(page);
    await expect(page.locator('.lead')).toContainText('100% ukończenia');
    await expect(page.locator('.retention-overview.is-mastered')).toContainText('Gratulacje');await expect(page.locator('.has-pending,.stage-review-step')).toHaveCount(0);
    await expect(page.locator('.stage-retention').first()).toHaveAttribute('aria-valuenow', '100');
    await expect(page.locator('.retention-overview')).not.toContainText('% utrwalenia');
    await page.screenshot({ path: 'test-results/progress-pending-mobile.png', fullPage: true });
    const entry = p.adventure!.stageReviews![stageKey(food, food.stages[0])].items[word('apple').key];
    entry.correct = 3; entry.due = 0;
    await importProgress(page, p); await openMap(page);
    await expect(page.locator('.retention-overview.is-mastered')).toContainText('Gratulacje');
    await expect(page.locator('.journey-progress')).toHaveClass(/is-mastered/);
    await page.screenshot({ path: 'test-results/progress-mastered-mobile.png', fullPage: true });
});

test('gramatyka wyjaśnia odpowiedź po błędzie i sukcesie, z dostępną regułą', async ({ page }) => {
    const p = fixture(); p.active = makeSession(modules, m, 'grammar', 'text', false, p);
    p.active.items = [{ key: keyFor(m, 'exercise', 'g-so-sport'), moduleId: m.id, id: 'g-so-sport', type: 'exercise', version: 1, input: 'choice' }];
    await importProgress(page, p); await page.getByRole('button', { name: 'Kontynuuj naukę →', exact: true }).tap();
    await page.getByRole('button', { name: 'because', exact: true }).tap();
    await expect(page.locator('.feedback.incorrect .grammar-explanation')).toContainText('Dlaczego tak?');
    await expect(page.locator('.grammar-explanation')).toContainText(m.exercises.find(q => q.id === 'g-so-sport')!.explanation);
    await page.locator('.grammar-explanation summary').tap();
    await expect(page.locator('.grammar-explanation details')).toHaveAttribute('open', '');
    await page.getByRole('button', { name: 'Spróbuję jeszcze raz', exact: true }).tap();
    await page.getByRole('button', { name: 'so', exact: true }).tap();
    await expect(page.locator('.feedback.correct .grammar-explanation')).toContainText('Dlaczego tak?');
});

test('druga mapa: osobna nawigacja, wymagany trening i jednorazowe 3 gwiazdki', async ({ page }) => {
    const second: Journey = { version: 1, moduleId: m.id, id: 'second', title: 'Druga kocia przygoda', stages: [{ ...structuredClone(food.stages[0]), lessons: [
        { ...structuredClone(food.stages[0].lessons[0]), id: 'new-1', wordIds: m.words.slice(0, 6).map(w => w.id) },
        { ...structuredClone(food.stages[0].lessons[1]), id: 'new-2', wordIds: m.words.slice(6, 12).map(w => w.id) },
        { id: 'training-1', title: 'Wracamy do pierwszej mapy', intro: 'Poznane słowa i gramatyka.', role: 'training', wordIds: [], exerciseIds: [], ruleIds: [] },
    ] }] };
    await page.route('**/content/02-food/modul.json', async route => {
        const response = await route.fetch(), metadata = await response.json();
        delete metadata.journeyPath; metadata.journeyPaths = ['02-food/sciezka.json', '02-food/second.json'];
        await route.fulfill({ json: metadata });
    });
    await page.route('**/content/02-food/second.json', route => route.fulfill({ json: second }));
    const p = fixture();
    for (const { key } of lessons(food)) p.adventure!.completed[key] = { at: '2026-11-08T12:00:00Z' };
    for (const l of second.stages[0].lessons.slice(0, 2)) p.adventure!.completed[lessonKey(second, l)] = { at: '2026-11-08T12:00:00Z' };
    // Existing bonuses are already paid; this test isolates the training reward.
    p.adventure!.stageReviews = Object.fromEntries(food.stages.map(stage => [stageKey(food, stage), { round: 0, items: {}, rewardedAt: '2026-11-08T12:00:00Z' }]));
    await importProgress(page, p);
    await page.getByRole('button', { name: /Wybierz przygodę/ }).tap();
    await page.getByRole('button', { name: 'Otwórz mapę Druga kocia przygoda', exact: true }).tap();
    await expect(page.locator('.lead')).toContainText('2 z 3');
    await page.getByRole('button', { name: 'Kontynuuj naukę →', exact: true }).tap();
    await expect(page.getByRole('heading', { name: 'Koci trening', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Zaczynam ćwiczenia →', exact: true }).tap();
    await finish(page); await expect(page.locator('.lesson-reward')).toContainText('+3 ★');
    await page.getByRole('button', { name: 'Wróć do mapy', exact: true }).tap();
    await expect(page.getByRole('heading', { name: 'Druga kocia przygoda', exact: true })).toBeVisible();
    await expect(page.locator('.lead')).toContainText('100% ukończenia');
    await expect(page.locator('.star-wallet')).toContainText('20');
});
