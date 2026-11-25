import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { AppState } from '../../src/app/state.ts';
import { emptyProgress } from '../../src/learning/model.ts';
import { makeSession } from '../../src/learning/session.ts';
import { studyView } from '../../src/views/study.ts';
import { engineModule } from '../fixtures/engine.ts';

test.use({ viewport: { width: 320, height: 720 }, isMobile: true, hasTouch: true, offline: true });

test('bank słów na wąskim ekranie wyróżnia zdanie i pozwala rozwinąć pomoc pod słowami', async ({ page }) => {
    const module = engineModule();
    const progress = emptyProgress();
    const session = makeSession([module], module, 'grammar', 'choice', false, progress);
    const item = session.items[0];
    const exercise = module.exercises.find(task => task.id === item.id)!;
    exercise.prompt = 'Wybierz: I can listen to music without waking my sister. I put on my ___.';
    item.presentation = 'bank';
    progress.active = session;
    const state = new AppState();
    state.modules = [module];
    state.progress = progress;
    const styles = ['style', 'theme', 'adventure'].map(name =>
        readFileSync(new URL(`../../src/${name}.css`, import.meta.url), 'utf8'),
    ).join('\n');
    await page.setContent(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>${styles}</style><body class="studying"><main><div class="content">${studyView(state)}</div></main></body>`);

    const instruction = page.getByText('Wybierz słowo z banku i dotknij luki.', { exact: true });
    const sentence = page.locator('.gap-sentence p');
    const options = page.getByLabel('Bank słów');
    const help = page.getByText('Jak przenieść lub odłożyć słowo?', { exact: true });
    const details = page.getByText(/Możesz przeciągnąć słowo do luki/);
    await expect(instruction).toHaveCSS('font-size', '15px');
    await expect(sentence).toHaveCSS('font-size', '22px');
    await expect(sentence.locator('br')).toHaveCount(1);
    await expect(sentence.locator('.bank-gap-end')).toHaveText('….');
    const option = options.getByRole('button').first();
    expect((await option.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect((await options.boundingBox())!.y).toBeLessThan((await help.boundingBox())!.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole('button', { name: 'Dalej →' })).toBeDisabled();
    await expect(details).toBeHidden();
    await help.tap();
    await expect(details).toBeVisible();
});

test('bank używa tej samej typografii dla kilku luk i dla kwestii dialogu', async ({ page }) => {
    const module = engineModule();
    const progress = emptyProgress();
    const session = makeSession([module], module, 'grammar', 'choice', false, progress);
    session.items = session.items.slice(0, 2);
    const [first, second] = session.items;
    const firstTask = module.exercises.find(task => task.id === first.id)!;
    const secondTask = module.exercises.find(task => task.id === second.id)!;
    firstTask.prompt = 'Wpisz nazwę rzeczy:\n\nI need a ___.';
    secondTask.prompt = 'Uzupełnij zdanie: You can see a ___.';
    for (const item of session.items) {
        item.presentation = 'bank';
        item.gapGroup = first.key;
    }
    progress.active = session;
    const state = new AppState();
    state.modules = [module];
    state.progress = progress;
    const styles = ['style', 'theme', 'adventure'].map(name =>
        readFileSync(new URL(`../../src/${name}.css`, import.meta.url), 'utf8'),
    ).join('\n');
    const render = () => page.setContent(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>${styles}</style><body class="studying"><main><div class="content">${studyView(state)}</div></main></body>`);

    await render();
    await expect(page.getByText('Wybierz słowo z banku i dotknij luki.', { exact: true })).toHaveCount(1);
    for (const card of await page.locator('.gap-sentence').all()) {
        await expect(card.locator('.exercise-instruction')).toHaveCSS('font-size', '15px');
        await expect(card.locator('p').last()).toHaveCSS('font-size', '22px');
    }
    await expect(page.locator('.gap-target')).toHaveCount(2);
    await expect(page.getByLabel('Bank słów').getByRole('button')).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    delete first.gapGroup;
    session.items = [first];
    firstTask.kind = 'dialogue';
    firstTask.prompt = 'Uzupełnij rozmowę.';
    firstTask.dialogue = [
        { speaker: 'Ala', text: 'I need a ___.' },
        { speaker: 'Olek', text: 'Here you are.' },
    ];
    await render();
    await expect(page.getByRole('heading', { name: 'Uzupełnij rozmowę.' })).toBeVisible();
    await expect(page.locator('.gap-sentence').getByText('Ala:', { exact: true })).toBeVisible();
    await expect(page.locator('.gap-sentence p').first()).toHaveCSS('font-size', '22px');
    await expect(page.locator('.gap-target')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
