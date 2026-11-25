import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { bindListeningTranslation } from '../../src/app/listening-translation.ts';
import { AppState } from '../../src/app/state.ts';
import { emptyProgress } from '../../src/learning/model.ts';
import { makeSession } from '../../src/learning/session.ts';
import { speaker } from '../../src/speech.ts';
import { studyView } from '../../src/views/study.ts';
import { engineModule } from '../fixtures/engine.ts';

test.use({ viewport: { width: 320, height: 720 }, isMobile: true, hasTouch: true, offline: true });

for (const input of ['text', 'choice'] as const) {
    test(`zadanie ze słuchu (${input}): tłumaczenie można pokazać i ukryć bez odtwarzania`, async ({ page }) => {
        const module = engineModule();
        module.languageCode = 'en';
        const progress = emptyProgress();
        const session = makeSession([module], module, 'flashcards', input, false, progress);
        const item = session.items[0];
        const word = module.words.find(entry => entry.id === item.id)!;
        const linked = module.exercises.find(entry => entry.wordId === item.id)!;
        linked.options = linked.options.map(option => option === word.back ? 'cheese' : option);
        word.back = 'cheese';
        word.front = 'ser';
        item.listen = true;
        progress.active = session;
        const state = new AppState();
        state.modules = [module];
        state.progress = progress;
        const device = speaker();
        const available = device.available;
        let card: string;
        try {
            device.available = () => true;
            card = studyView(state);
        } finally {
            device.available = available;
        }
        const styles = ['style', 'theme', 'adventure'].map(name =>
            readFileSync(new URL(`../../src/${name}.css`, import.meta.url), 'utf8'),
        ).join('\n');
        await page.setContent(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>${styles}</style><body class="studying"><main><div class="content">${card}</div></main></body>`);
        await page.locator('main').evaluate(bindListeningTranslation);

        const disclosure = page.locator('.listen-translation');
        const summary = disclosure.locator('summary');
        await expect(summary.getByText('Pokaż tłumaczenie')).toBeVisible();
        expect((await summary.boundingBox())!.height).toBeGreaterThanOrEqual(44);
        await expect(disclosure.getByText('ser', { exact: true })).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Posłuchaj jeszcze raz' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Wolniej' })).toBeVisible();

        const answer = page.getByRole('textbox');
        if (input === 'text') await answer.fill('che');
        await summary.tap();
        await expect(disclosure.getByText('ser', { exact: true })).toBeVisible();
        await expect(summary.getByText('Ukryj tłumaczenie')).toBeVisible();
        if (input === 'text') await expect(answer).toHaveValue('che');
        else await expect(page.getByRole('button', { name: 'ser', exact: true })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await summary.tap();
        await expect(disclosure.getByText('ser', { exact: true })).toBeHidden();
        await expect(summary.getByText('Pokaż tłumaczenie')).toBeVisible();
    });
}
