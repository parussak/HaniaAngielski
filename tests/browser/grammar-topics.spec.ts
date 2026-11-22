import { openBackup } from './navigation.ts';
import { test, expect, type Page } from './fixtures.ts';
import { grammarTopicsFixture } from '../fixtures/grammar-topics.ts';
import { readLibrary } from '../../src/materials/library.ts';
import { backup, emptyProgress, keyFor, makeSession, next, questionFor, recordAnswer, type Item, type Module, type Progress } from '../../src/core.ts';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

const fixture = grammarTopicsFixture();
const modules = (await readLibrary(fixture.read)).modules;
const unit = (id: string) => modules.find(m => m.id === id)!;
const item = (m: Module, id: string): Item => ({ key: keyFor(m, 'exercise', id), moduleId: m.id, version: 1, type: 'exercise', id, input: 'text' });

/** Progress with the given attempts; each attempt is one finished session. */
function seed(attempts: [Module, string, boolean][]) {
    const p: Progress = emptyProgress();
    for (const [m, id, correct] of attempts) {
        const i = item(m, id);
        p.active = makeSession(modules, m, 'quiz', 'text', false, p); p.active.items = [i];
        recordAnswer(p, questionFor(modules, i), correct ? questionFor(modules, i).answers[0] : 'zła');
        while (p.active) { const s = p.active; if (s.phase !== 'feedback') recordAnswer(p, questionFor(modules, s.items[s.index]), questionFor(modules, s.items[s.index]).answers[0]); next(p); }
    }
    return p;
}
async function materials(page: Page) {
    await page.route('**/content/**', async route => {
        const path = new URL(route.request().url()).pathname.split('/content/')[1];
        if (path in fixture.files) await route.fulfill({ json: fixture.files[path] });
        else await route.continue();
    });
}
async function restore(page: Page, p: Progress) {
    await page.goto('./'); await openBackup(page);
    await page.locator('#import-file').setInputFiles({ name: 'grammar.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup(p))) });
    await page.getByRole('button', { name: 'Zastąp postępy', exact: true }).tap(); await expect(page.locator('#app')).toHaveAttribute('aria-busy', 'false');
    await page.getByRole('button', { name: 'Moja nauka', exact: true }).tap();
}
const open = (page: Page) => page.getByRole('button', { name: /Otwórz gramatykę/ }).tap();

test('Wyszukiwanie filtruje poznane tematy i po wyczyszczeniu przywraca listę', async ({ page }) => {
    await materials(page);
    await restore(page, seed([[unit('en-unit-1'), 'g-pc-1', true], [unit('en-unit-1'), 'g-art-1', true]]));
    await open(page);
    const search = page.getByRole('searchbox', { name: 'Szukaj w poznanej gramatyce' });
    const visible = page.locator('.grammar-topic:visible summary');
    await search.fill(' WYJASNIENIE PC-BASIC ');
    await expect(visible).toHaveCount(1);
    await expect(visible).toContainText('Present Continuous');
    await search.fill('pc-more');
    await expect(visible).toHaveCount(0);
    await expect(page.getByText('Brak pasujących tematów.', { exact: false })).toBeVisible();
    await search.fill('');
    await expect(visible).toHaveCount(2);
});

test('Dotknięcie okładki zeszytu poza napisem otwiera gramatykę', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('./');
    await page.locator('.grammar-entry').tap({ position: { x: 16, y: 12 } });
    await expect(page.getByRole('heading', { name: 'Gramatyka', level: 1 })).toBeVisible();
});

test('Gramatyka: bez prób jest wyjaśnienie, bez przewijania w poziomie', async ({ page }) => {
    await materials(page); await page.setViewportSize({ width: 320, height: 640 }); await page.goto('./'); await open(page);
    await expect(page.getByRole('heading', { name: 'Gramatyka', exact: true })).toBeVisible();
    await expect(page.locator('.course-empty')).toContainText('Gdy spróbujesz pierwszych zadań');
    await expect(page.locator('.grammar-topic')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test('Gramatyka: temat pojawia się po próbie, pokazuje tylko próbowane reguły i statystykę, a „Poćwicz” startuje sesję tematu', async ({ page }) => {
    await materials(page);
    await restore(page, seed([[unit('en-unit-1'), 'g-pc-1', false], [unit('en-unit-2'), 'g-pcm-1', true]]));
    await open(page);
    const topic = page.locator('.grammar-topic');
    await expect(topic).toHaveCount(1);
    await expect(topic.locator('summary')).toContainText('Present Continuous');
    await expect(topic.locator('summary')).toContainText('ćwiczone 2×, 50% poprawnych');
    await topic.locator('summary').tap();
    await expect(topic.locator('.grammar-rule h3')).toHaveText(['Reguła pc-basic', 'Reguła pc-more']);
    await expect(page.getByText('Reguła art')).toHaveCount(0);
    await page.getByRole('button', { name: 'Poćwicz ten temat →', exact: true }).tap();
    await expect(page.locator('.study-heading .tag')).toHaveText('1 / 2');
    await page.reload();
    await expect(page.locator('.study-heading')).toBeVisible();
});

test('Gramatyka: po odświeżeniu na ekranie Gramatyka widok wraca', async ({ page }) => {
    await materials(page);
    await restore(page, seed([[unit('en-unit-1'), 'g-art-1', true]]));
    await open(page);
    await expect(page.locator('.grammar-topic summary')).toContainText('Articles');
    await page.reload();
    await expect(page.locator('.grammar-topic summary')).toContainText('Articles');
});
