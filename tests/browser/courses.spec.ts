import {openBackup} from './navigation.ts';
import { test, expect, type Page } from './fixtures.ts';
import { courseFixture } from '../fixtures/course-materials.ts';
import { backup, emptyProgress } from '../../src/core.ts';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

async function materials(page: Page, fixture = courseFixture()) {
    for (const [folder, order] of [['english',1],['french',2],['italian',3]] as const)
        (fixture.files[`${folder}/modul.json`] as Record<string, unknown>).order = order;
    await page.route('**/content/**', async route => {
        const path = new URL(route.request().url()).pathname.split('/content/')[1];
        if (path in fixture.files) await route.fulfill({ json: fixture.files[path] });
        else await route.continue();
    });
    return fixture;
}
async function open(page: Page, course = 'french-book') {
    await page.getByRole('button', { name: 'Wybierz kurs', exact: true }).tap();
    await page.getByRole('button', { name: `Wybierz kurs Test: ${course}`, exact: true }).tap();
    await page.getByRole('button', { name: /Przejdź do modułów/ }).tap();
    await page.getByRole('button', { name: `Otwórz moduł Moduł ${course}`, exact: true }).tap();
}

for (const [book, target, incorrect, prompt] of [['french-book','café','cafe','Podaj po francusku'],['italian-book','caffè','caffe','Podaj po włosku']]) {
    test(`${book}: osobny kurs, jawne odpowiedzi, znaki językowe i wznowienie po odświeżeniu`, async ({ page }) => {
        await materials(page); await page.goto('./'); await open(page, book);
        await page.getByText('Wpisuję odpowiedź', { exact: true }).tap();
        await page.locator('.session-settings summary').tap(); await page.locator('#previous').check();
        await page.getByRole('button', { name: 'Quiz słownictwa', exact: true }).tap();
        await expect(page.locator('.question')).toHaveText(`${prompt}: kawa`);
        await expect(page.locator('.study-heading .tag')).toHaveText('1 / 1');
        await page.getByRole('textbox').fill(incorrect); await page.getByRole('button', { name: /Sprawdź/ }).tap();
        await expect(page.locator('.feedback.incorrect')).toBeVisible();
        await expect(page.locator('.expected-answer')).toContainText(target);
        await page.getByRole('button', { name: 'Spróbuję jeszcze raz', exact: true }).tap();
        await page.getByRole('textbox').fill(target); await page.getByRole('button', { name: /Sprawdź/ }).tap();
        await expect(page.locator('.feedback.correct')).toBeVisible();
        await page.reload(); await page.getByRole('button', { name: 'Kontynuuj naukę →', exact: true }).tap();
        await expect(page.locator('.question')).toHaveText(`${prompt}: kawa`);
        await expect(page.locator('.feedback.correct')).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
        await openBackup(page);
        const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Zapisz kopię postępów', exact: true }).tap();
        const file = await (await download).path();
        const { readFileSync } = await import('node:fs');
        const p = JSON.parse(readFileSync(file!, 'utf8')).progress;
        const id = book === 'french-book' ? 'fr-unit' : 'it-unit';
        expect(p.active.moduleId).toBe(id); expect(p.active.items.every((i: { moduleId: string }) => i.moduleId === id)).toBe(true);
        expect(p.active.attempts[0].first).toBe(false); expect(p.active.attempts[0].lastAnswer).toBe(target);
    });
}

test('dwa podręczniki francuskiego nie współdzielą zaliczonych słówek', async ({ page }) => {
    const f = courseFixture(); f.courses[2].targetLanguage = 'fr'; f.courses[2].instructions.translationPrompt = 'Podaj po francusku';
    (f.files['italian/modul.json'] as Record<string, unknown>).language = 'Francuski';
    await materials(page, f); await page.goto('./');
    const p = emptyProgress();
    p.words['fr-unit@1:word:coffee-drink'] = 'known'; p.words['fr-unit@1:word:water-drink'] = 'known';
    await openBackup(page);
    await page.locator('#import-file').setInputFiles({ name: 'courses.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup(p))) });
    await page.getByRole('button', { name: 'Zastąp postępy', exact: true }).tap();
    await expect(page.locator('#app')).toHaveAttribute('aria-busy', 'false');
    await page.getByRole('button', { name: 'Moja nauka', exact: true }).tap(); await open(page, 'italian-book');
    await page.getByRole('button', { name: 'Fiszki', exact: true }).tap();
    await expect(page.locator('.question')).toBeVisible(); await expect(page.locator('.study-heading .tag')).toHaveText('1 / 2');
    await expect(page.locator('.exercise-label')).toContainText('PODAJ PO FRANCUSKU');
    expect(await page.locator('.option').allTextContents()).not.toContain('coffee');
});

test('brak wariantu językowego daje komunikat odczytu zamiast uruchomienia niepełnej lekcji', async ({ page }) => {
    const f = courseFixture(); delete (f.files['french/slownictwo.json'] as { entries: typeof f.entries }).entries[0].variants.fr;
    await materials(page, f); await page.goto('./');
    await expect(page.getByRole('heading', { name: 'Nie możemy wczytać aplikacji', exact: true })).toBeVisible();
    await expect(page.locator('.loading')).toContainText('Nie zmieniliśmy Twoich postępów');
});
